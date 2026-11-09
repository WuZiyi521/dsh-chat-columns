# 04 · 无缝模式（B）：技术路线比较

> 分工：无缝模式的路线、几何、评估、P1 清单。事实基础见 `BRIEF.md` §2 与本文件 §1.2。
> 标记：`[已证实]` 有代码行号或可复现观测；`[假设]` 未验证，写明怎么验；`[风险]`。
> 行号均指宿主 bundle `dsh-0.2.1-rc.2`（`.../node_modules/@deepseek-ai/dsh-client-ui-*/lib/client.js`，下文简写 `chat:N` / `conv:N` / `sub:N`）。

---

## 0. 结论（先看这 7 条）

1. 冻结定义在几何上等价于一句话：**流坐标按 `H`（= 视口高）切成滑动窗口，切点 = `s + c·H`，随 `s` 平移**；接缝在屏幕上钉在列底边 `y = H`（"固定在底部附近"），滚动时是**内容穿过接缝**，不是接缝横移。
2. 在"一份连续内容、单棵 React 节点树、内容不重复"的约束下，**只有浏览器分片（CSS multicol fragmentation）能同时做到不切断、不丢失、不跳**。这是全节的硬约束（§1.3），也是三条路线的分水岭。
3. 宿主的锚点契约是 `dy/ds = −1`（滚动多少，目标行就上移多少）。0.1.x 的 CSS 单流满足它，所以锚点今天没坏；**任何窗口化布局都不满足**，冲突只有两种形态：恢复位置只剩相位（§3.1）、加载更早差 `k·H`（§3.3）。
4. **"触顶自动加载"和"零跳动"结构性冲突**（§3.5）：paging 在途时任何 wheel/touch/key 都会让宿主 `stopPreserving()`（`chat:2448–2463`），commit 时不补偿、整屏被推下去——而"滚到顶"用的正是这个手势。B 必须显式选一条处置（静默后再加载 / 自己补位 / 等 `scrollend`），0.1.x 的 E-01 不能当证据。
5. 推荐 **R2（滑动窗口 + 每帧重分片，只读 `scrollTop`）**：它是唯一满足冻结定义的解；代价是每帧一次整篇重排，成败由 P1 的帧级实测决定。
6. **R1（固定切点 + 横向平移）** 是零重排、零接管的保底方案，但接缝在竖直方向移动，与冻结定义的字面不符——留作"R2 性能不过关"时的产品级取舍。
7. **R3（自建列 + 逐元素 transform + 自持 `s`）** 是唯一能上长会话性能的路线，但它在接缝处要么丢内容、要么让整行跳一列，且必须接管 `scrollTop`（真正的对手是折叠批次的逐帧写，§3.4）；只在 R2 实测失败时启用。

---

## 1. 把定义落到几何上

### 1.1 操作化定义（可测）

设宿主滚动容器（scrollport）为 `S`，`H` 为**可见列高**（= 一屏，口径见 §1.2：`clientHeight` 减 padding、再减被 composer 遮住的那段），`p` 为流坐标（从流顶部算起的 px），`s` 为阅读位置（流坐标）。无缝布局的约束：

```
屏幕列 c（0..N−1）显示流区间 [s + c·H, s + (c+1)·H)         … 窗口
列内纵坐标        y = p − s − c·H,  y ∈ [0, H)               … 硬窗口
接缝（相邻窗口切点）= 流坐标 s + (c+1)·H，屏幕落点 = (列 c 的底边 y=H, 列 c+1 的顶边 y=0)
```

三条可观测的验收不变量（进 P1，见 §5）：

- **I1 位置**：`s = scrollTop`（或 `s = f(scrollTop)` 且 `f` 已知、可逆、单调）。
- **I2 唯一性**：任一 `[data-chat-flow-key]` 的可见部分，在任一时刻只出现在一列里。
- **I3 接缝**：切点 = `s + c·H`（误差 ≤ 1px），且切点之外没有空白带。

### 1.2 事实与记号

| 事实 | 证据 |
|---|---|
| 滚动容器 `[data-conversation-scroll]` 就是 `.wSkVaW_scrollBody`：`display:flex; flex-direction:column; flex:1; min-height:0; overflow-y:auto; scrollbar-gutter:stable`，**无 padding** | `conv:17325`（CSS 字符串）；渲染 `conv:17871` |
| 会话正文 `[data-chat-flow]` 就是 `.EvIC1a_column`（`display:flex`，`max-width: var(--dsh-chat-content-width)`），父级 `.EvIC1a_scroll` 有 `padding:16px …`；在 `[data-conversation-scroll]` 内 `.EvIC1a_scroll` 被改成 `flex:none; min-height:auto; overflow:visible`（即"外层才是 scroller"） | `chat:2679`（CSS 字符串）；渲染 `chat:2886` |
| 因此 `H` ≠ 直接取 `clientHeight`：要减掉 `.EvIC1a_scroll` 的上下 padding（16+16），**还要减掉被 composer 遮住的那段**——`composerSeat` 是 scrollport 的 flex 子节点且 `position:sticky; bottom:0`（`conv:17325`），滚动时浮在内容上方 | 由上两条推得 `[已证实]`；`H` 的实测口径见下 |
| 所以 `H` 的定义取"可见列高"：`H = composerSeat.getBoundingClientRect().top − flow.getBoundingClientRect().top`（首帧量一次，`ResizeObserver` 变化时重量）。写死 `clientHeight−32` 会把接缝藏到输入框下面 | `chat:2679`（`--dsh-composer-height` 默认 152）、`conv:17325`（`composerSeat` sticky） |
| 宿主自己会切换 `overflow-anchor`：折叠动画期间 `scroller.style.overflowAnchor = "none"`，结束后还原；`[data-chat-following-tail]` 时 CSS 也设 `overflow-anchor:none` | `chat:1768–1769`、`chat:2679`、`chat:2879` |
| 一个 scrollport 只有一个"跟随意向"控制器 `ScrollFollow`，按 `dy>0.5px` 判定"读者移动"；跟随 = 距 `floor` ≤ 阈值 | `chat:871`（`sample`）、`chat:2148–2153`（`readScroll`） |
| `readScroll().movedByReader = |scrollTop − min(上次确认位, floor)| > 0.5`；**宿主自己 `write()` 的位会被记为"已确认"，插件写的不会** | `chat:2148–2153`、`chat:2415–2426` |
| 加载更早：`loadEarlier()` → `beginPaging()`（保留首个 `[data-chat-paging-anchor]` 行 + 其相对 scrollport 的 top）→ 暂停跟随 → commit 后 `preserve()` 用 `target = scrollTop + (行当前 top − 保留 top)` 写回，**按 `[0, floor]` 截断** | `chat:670–673`、`chat:2280–2282`、`chat:2340–2377`、`chat:2415–2417` |
| 位置记忆 = `{anchorKey, anchorTop, scrollTop}`，`capturePosition()` 用 `elementsFromPoint(内容水平中线, 视口顶+1)` 取锚点；存储是宿主内存态（chat bundle 内无 `localStorage`/`sessionStorage` 引用），插件读不到 | `chat:2174`、`chat:2260`、`chat:1073/1085/1211` |
| 自动加载：只有 `hasMore` 时渲染 `.older` + 按钮，`onClick: scroll.loadEarlier`；`loadingOlder` 时按钮 `disabled` 且文案换 `loading`；`hasMore` 变假后**整块 `.older` 被移除**；paging 路径**没有失败态 DOM**（只有 session 打开失败有 `openError`） | `chat:2900–2907`；`lib/client.js:322–349`（选按钮） |
| **宿主有两条写 `scrollTop` 的通道**：①单次写 `write()`（paging/preserve/align/restore/toBottom）；②**逐帧写**，只在"折叠批次"（`data-chat-motion` 行收起/展开）期间活跃，且带 `drift = scrollTop − written` 自纠 | ①`chat:2418`；②`chat:2057`（`frame`）、`chat:2040`（`finish`）、`chat:2015`（`retarget`）、`chat:1995`（drift） |
| 折叠驱动把 **`column.offsetHeight` 当内容总高**来算增长与余量 | `chat:1947`、`chat:2003` |
| **paging 在途时，用户手势会打掉锚点保持**：`wheel`/`touchstart`/`pointerdown`/滚动键 `keydown`/`beforematch` 命中且 `paging !== null` ⇒ 立刻 `stopPreserving()` | `chat:2448–2463`（`onIntent`）、`chat:1786–1795`（监听注册） |
| 多个 scrollport：`data-sidebar-chat`（右栏 embedded 会话）复用同一个 Conversation 组件；`[data-conversation-scroll]` 只由 conversation bundle 产出 | `sub:805`；`grep data-conversation-scroll sub/lib/client.js` → 0 命中 |

记号：`N` 列数（沿用 `colsFor()`），`W = (S.clientWidth − 32 − (N−1)·g)/N`，`g = 40`，`L` = 流总高，`s_max = max(0, L − H)`。

### 1.3 硬约束（本节最重要的一条）

**命题**：若 (a) 内容只有一份 DOM 树、元素不被复制；(b) 每列是高度 `H` 的连续窗口；(c) 切点随 `s` 平移（接缝钉在列底边）——则切点必然会落在某个元素内部，此时该元素必须被**切成两段、分别画在两列**，而单个 DOM 节点做不到。于是只剩三条出路：

1. **浏览器替我们切**（CSS multicol 的分片能力）→ 元素被切成两个片段，文字/代码块在行盒处断开，图片/表格等不可断元素整体推到下一列（列底留白 ≤ 该元素高）。**这是唯一不丢内容的解**。
2. **不许切**（原子打包，切点吸附到元素边界）→ 切点必须随 `s` 离散移动；每移动一次，接缝处有一个元素从"列 c 底部"跳到"列 c+1 顶部"（`Δx = W+g, Δy ≈ H`）→ 位置突跳。
3. **允许裁**（硬窗口 + `overflow:hidden`）→ 跨接缝的元素被裁掉一截，下一列从**再下一个**元素开始 → 内容丢失。

> 结论：B 的可行解在数学上是唯一的（出路 1），性能代价是"切点移动 ⇒ 必须重新分片 ⇒ 每帧重排"。
> 想避开每帧重排，就只能放弃"切点随 `s` 平移"（即 R1 的固定切点 + 横向平移）。

### 1.4 宿主的锚点契约：`dy/ds = −1`

宿主所有位置修正都只用一个公式：`target = scrollTop + (目标行 rect.top − 保留的 anchorTop)`（`chat:2340–2377`、`chat:2415`），并在 `[0, floor]` 截断。这个公式**当且仅当**"scrollTop 增加 δ 时目标行上移 δ"才正确，即 `dy/ds = −1`。

- 0.1.x（CSS 单流多列）：行在普通文档流里，`dy/ds = −1` → 契约成立，所以 E-01 的"零跳动"是真的（`docs/testing.md` §七）。
- 无缝布局：列内 `dy/ds = −1`，但**跨接缝时 `y` 会绕回 `+H`**（`y = (p−s) mod H`）。于是同一个"目标行"满足公式的 `s` 有无穷多个，相差 `k·H`。宿主不知道列索引，只能给出**相位正确、列号可能错**的解。

这一条是后面所有"锚点冲突"的根，不必再逐条重复推导。

---

## 2. 三条路线

### R1 · 固定切点 + 横向平移（保守：不改宿主滚动模型）

**列怎么来**：`[data-chat-flow]` 恢复 `display:block`，加 `height:H; column-count:N; column-fill:auto`。切点固定在 `k·H`，列 `k` 静态落在 `x = k·(W+g)`；内容超出 `N` 列后成为 overflow 列（右侧，被裁）。这是报纸分栏的一个特例（列高 = 一屏、不均衡）。

**接缝怎么动**：不动。要"连续"，只能让整条列带横向平移：

```
tx(s) = −s · (W + g) / H          （s 增 1px，带子左移 (W+g)/H px；s = H 时正好换一列）
```
即滚动 `H` px 走完一整列。`tx` 每帧只写一次 `transform`，**不重排**。

**与宿主的唯一 `scrollTop` 共存**：只读 `scrollTop`，写 `transform`；滚动范围用插件自己的轨道元素（`height = (L/H)·(W+g)`，删插件时移除）撑出来。宿主的 `write()` 算出的 `target = scrollTop + (行 top − anchorTop)`，而在 R1 里 `dy/ds = 0`（列内纵坐标与 `s` 无关）⇒ **宿主的修正恒为 no-op**：它不会和我们抢，但也帮不上忙。

**几何与连续性条件**（`s↗` 时内容不跳、不重叠、不缺页）：
- 不跳：`tx` 是 `s` 的**仿射函数**（`dtx/ds = −(W+g)/H` 常数）⇒ 元素位置随 `s` 连续变化，**没有任何元素会换列**，所以这一条是三条路线里最容易保证的。唯一的跳变来自 `L` 变化：头部长 `ΔL` ⇒ 所有元素列号 `+k` ⇒ 整条带要横移 `k·(W+g)`，必须由插件的偏移量 `o` 吸收（写 `tx = −s + o`，`o += k(W+g)`），否则整带跳 `k` 列。
- 不重叠：切点固定 + multicol 分片 ⇒ 天然不重叠。
- 不缺页：不丢内容（分片）；**但列底会有留白**：不可断元素（图片/表格/`break-inside:avoid` 的行）放不下时整块推到下一列，留白 ≤ 该元素高。
- 缺页的真实风险：`s` 到 `s_max` 时右侧会露出空白（内容只有 `L/H` 列，视口有 `N` 列），阅读末段有一大片空。
- 代价：`dtx/ds ≠ 1` ⇒ 滚轮位移与视觉位移**不 1:1**（滚动 `H` px 只横移 `W+g` px），触控板手感会"变重/变轻"，且这是产品级问题不是 bug。

**小例子**（`H=600, N=3, W=280, g=40, L=1800`，三屏内容 A/B/C 各 600px）：

| s | tx | 屏幕 x=0 | x=320 | x=640 |
|---|---|---|---|---|
| 0 | 0 | A（y0–600） | B | C |
| 300 | −160 | A 的右 160px | B（x160–440） | C（x480–760） |
| 600 | −320 | B（x0–280） | C（x320–600） | 空 |

（接缝 = A/B 之间的竖直缝隙，随 `s` 从 `x=320` 连续移到 `x=0`。）

### R2 · 滑动窗口 + 每帧重分片（重映射，但不接管 `scrollTop`）

**列怎么来**：`[data-chat-flow]` 设 `display:block; height:H; column-count:N; column-fill:auto; contain:paint`，并给**第一个子节点**加 `margin-top: −s`。multicol 的分片点因此变成 `s + k·H`，列宽由 `column-count` 与容器宽度算出，`N` 列正好铺满视口，多余的 overflow 列被 `contain:paint` 裁掉（否则 `scrollWidth` 变宽、底部多出横向滚动条）。三个机制点都**没有实测**：

- `[假设]` 负 `margin-top` 能让 multicol 的**分片点**跟着平移（`position:relative/top` 不行：相对定位发生在分片之后，切点不会动）；且 multicol 容器建立独立格式化上下文、负 margin 不塌陷。验法：T1 里对同一 `s` 采样两次（`margin` 法与"手工绝对定位"对照），逐元素位置一致。
- `[假设]` `contain:paint` 能把 overflow 列排除出宿主 scrollport 的 scrollable overflow（不产生横向滚动条）；验法：T8 断言 `scrollWidth == clientWidth`。
- `[假设]` 首列被 `margin-top` 顶到 `y<0` 的部分被 scrollport 裁掉、不向上溢出到 header；验法：T1 检查 `document.elementFromPoint(x, scrollerTop+1)` 属于 flow 而非 header。

**接缝怎么动**：切点随 `s` 平移，屏幕位置不动（钉在每列底边 `y=H`）；滚动时是内容穿过接缝往上走，元素在切点处由浏览器分片接管（前一段留在列 `c` 底部，后一段出现在列 `c+1` 顶部）。

**与宿主的唯一 `scrollTop` 共存**：`s ≡ scrollTop`（只读）。给 `scrollTop` 一个**语义正确的范围**：插件在 flow 之后插一条自己的轨道（或把 flow 的祖先链 `min-height` 撑起来），令 `S.scrollHeight − S.clientHeight = s_max = L − H`。这样：

- `scrollTop` 的物理含义 = "读到流的哪个位置"，和宿主的世界观一致；
- 宿主的 `nearBottom(floor)` 恰好等于"读到最新内容"⇒ **跟随最新消息、右下角"回到底部"按钮自动是对的**；
- `restore()` 的 `anchorTop` 路径可用（列内 `dy/ds = −1`），但只到"相位"精度（§3.1）；
- 加载更早必须把 `s` 往前推 `ΔL`，这才是唯一需要写 `scrollTop` 的时刻（§3.3）。
- flow 需要 `position:sticky; top:0` 才能在轨道滚动时钉住；sticky 受父盒约束，因此 flow 的祖先链（`.EvIC1a_scroll`，必要时连 `.EvIC1a_column` 的父）必须被撑到"轨道高 + H"，逐级打 `data-dshc-*` 标记以便原样还原 `[假设]`。

**几何与连续性条件**：
- 不跳：`y = (p − s) mod H`，列内 `dy/ds = −1`；在切点处 `(c, H) → (c+1, 0)` 是**同一像素行**，所以整幅画面里没有元素发生位移突变，只有"同一元素的两段"在两个列盒里各自移动。
- **前提**：切点必须精确等于 `s + k·H`。若为了省重排把 `s` 量化成 `q`（例如 `margin-top: −floor(s)` + `translateY(−frac(s))` 只处理亚像素），接缝处会丢/重 `frac(s)` 宽的一条，**`q > 0` 就会丢内容**（因为 `translate` 不移动分片点）。
- 不重叠/不缺页：分片保证不重叠；不可断元素推到下一列 → 列底留白 ≤ 该元素高（这就是"接缝在底部**附近**"里"附近"的由来）。
- 内容守恒：`Σ(每列可见高) + Σ(留白) = L`，可作为断言。

**小例子**（同上 `H=600`，A/B/C 各 600）：

| s | 列 0 | 列 1 | 列 2 |
|---|---|---|---|
| 0 | A 0–600 | B 600–1200 | C 1200–1800 |
| 150 | A 150–600（y0–450）+ B 600–750（y450–600） | B 750–1200（y0–450）+ C 1200–1350（y450–600） | C 1350–1800（y0–450）+ 空（y450–600，流已尽） |
| 600 | B 600–1200 | C 1200–1800 | 空 |

`s=0→150`：切点从流 600 移到 750，于是 B 被切成两段——B 的 0–150 落在列 0 底部（y450–600），B 的 150–600 落在列 1 顶部（y0–450）。**两段都随 `s` 连续上移**，切点本身钉在 `y=H / y=0` 不动；没有任何一段发生位置突变。`s=150→600` 期间切点继续在 B 内部前移，直到 B 整段落进列 0（`s=600` 时 B 在列 0 的 y0–600）。

### R3 · 自建列 + 逐元素 transform（激进：接管 `scrollTop`）

**列怎么来**：不依赖 multicol。flow 保持普通纵向流（行仍在 `p` 位置），外面套一次 `transform: translateY(−s)`（每帧一次写），再对"列号 ≠ 0"的行单独写 `translate(dx, dy)`：

```
c_i = floor((p_i − s) / H)        // 行 i 的列号
dx_i = c_i · (W + g)
dy_i = −c_i · H
```
于是行 `i` 的屏幕位置 = `(c_i·(W+g), (p_i − s) − c_i·H)`，正好是窗口公式。因为 `c_i` 只在 `p_i − s` 跨过 `H` 的整数倍时跳变，**每帧只有接缝附近的 1–2 行需要改 transform**，其余行靠容器那一次 `translateY` 跟着走 ⇒ 每帧 O(1) 次写、**零重排**。

**接缝怎么动**：同 R2，切点 `s + c·H`；但切点是**吸附到行边界**的（因为单行不能切成两段），并且随 `s` 离散前移。

**与宿主的唯一 `scrollTop` 共存**：插件自持 `s`，把 `scrollTop` 当"输入通道 + 镜像"：
- 用户滚动时 `s ← scrollTop`（`|scrollTop − 上次写入值| > 0.5` 视为用户）；
- 需要时写 `scrollTop = s`（加载更早后推 `ΔL`、恢复位置、resize 重定基）——**这就是"接管"**；
- 宿主的 `write()` 会被我们在下一帧覆写（`scrollTop` 归位），宿主的 `readScroll` 会把我们的写记成"读者移动"（`chat:2153`），导致跟随意图被清、宿主保存一个合成位置、`stopPreserving()`（§3.2）；折叠批次期间宿主会**逐帧**写并把我们的写当 `drift` 自纠（§3.4），这是 R3 真正的对手。

**几何与连续性条件**：
- 不跳：列内 `dy/ds = −1` 成立；**但**切点吸附到行边界后，只要某行"在当前列放不下"，它就被整行推到下一列顶部。该行在两次临界点之间**位置冻结**（`y` 不变），到临界点瞬间**横向跳一列**：`Δx = −(W+g), Δy = 0`。一次一行，每滚过约一个行高发生一次。这是纯水平跳，但它是"位置突跳"，违反 B 的定义项。
- 留白：跨不过去的行会在上一列底部留下最多 `H − 行高` 的空白。行越少越大，留白越夸张（一张 500px 的图在 `H=900` 时会留下 400px 空白）。
- 不重叠：列号是纯函数、列宽固定 ⇒ 不重叠；但**行高 > H 的行无解**（要么裁、要么让它跨两列）。
- 不缺页：如果允许裁（`overflow:hidden`），跨接缝的行丢内容；如果不裁而让它溢出，它会压在下一列行上面。**在这一条上 R3 无法同时满足"不切断"和"不丢内容"**（§1.3 的出路 2 或 3）。

**小例子**（同上，A/B/C 各 600，行边界 0/600/1200）：
- `s=0`：A@x0 y0–600、B@x320 y0–600、C@x640 y0–600（三列都满）。
- `s=150`：列 0 从 A 的剩余部分开始（y=−150..450）；B 高 600，`450+600 > 600` 放不下 ⇒ B 推到列 1（y=0..600），C 随后也放不下 ⇒ 推到列 2（y=0..600）。结果：列 0 底部 **150px 空白**，B/C 各占满一列。注意 B **没动**（`y` 仍 0），而 A 上移了 150——这正是"位置冻结"。
- `s=600`：A 完全滚出（y=−600..0），B 现在放得下 ⇒ B **横向跳回列 0**（x 从 320 变 0，`y` 仍是 0），C 跳到列 1。→ 一次 `Δx = −(W+g)` 的突跳。

---

## 3. 逐项评估

| | R1 固定切点 + 横移 | R2 滑动窗口 + 重分片 | R3 逐元素 transform + 接管 |
|---|---|---|---|
| 被切断（长代码块/图片/表格） | 文本/`pre` 由浏览器分片（在行盒处切）；图片/表格整块推下一列 ⇒ 列底留白 | 同 R1（分片）；留白 ≤ 不可断元素高，接缝"在底部附近" | **无解**：裁 = 丢内容，不裁 = 压行；行高 > `H` 的元素直接破坏窗口 |
| 与宿主锚点冲突 | `dy/ds = 0` ⇒ 宿主修正恒 no-op，**不打架**；但 `restore()` 只能恢复"列内纵坐标"，跨会话位置基本丢失 | 列内 `dy/ds = −1`，`restore()` 只到相位精度（差 `k·H`）；`capturePosition()` 取的是**中间列**顶部那行 ⇒ 存下的锚点比真实阅读位置超前 `≈(N−1)/2·H` | 同上，且我们覆写 `scrollTop` 会让宿主存一个合成位置 |
| 折叠批次并发（宿主逐帧写，`chat:2057`/`1995`） | 无冲突：我们不写 `scrollTop`，宿主的 drift 自纠看不到我们 | 冲突存在但不致命：我们不写，但折叠驱动用 `column.offsetHeight`（=H）当内容总高（`chat:1947`）会算错 ⇒ 折叠期间位置补偿失效（T11） | **正面冲突**：宿主每帧写、把我们的写当 drift 自纠（`base += drift`），双方互拉；必须选边（暂停折叠或暂停 `s`） |
| 加载更早后保位置 | 头部长 `ΔL` ⇒ 每行的列号 +`k`（`k=ΔL/H`），视觉平移 `k` 列；插件用自己的 `o` 吸收 `ΔL·(W+g)/H`，**可以不写 `scrollTop`**（映射是纯平移，无截断） | 头部长 `ΔL` ⇒ 必须 `s += ΔL`；宿主的 `preserve()` 会先写 `s + (ΔL mod H)`（因为 `y` 只有 `H` 周期），**误差 = `k·H`**，必须一帧内覆写一次 | 自持 `s`，直接 `s += ΔL` 并覆写 `scrollTop`；宿主写几次我们盖几次，靠"最后写赢"保证 |
| 性能 | **每帧 1 次 transform，零重排**（≈0.05ms/帧 `[假设]`，参考 0.1.x 0.033ms/事件） | **每帧一次整篇 multicol 重排**（`margin-top` 变化 ⇒ 分片全算），成本随 `L` 线性增长：247 行估 3–8ms `[假设]`，2000 行可能 >30ms | 每帧 1 次容器 transform + 1–2 次行 transform，**零重排**；但每次覆写 `scrollTop` 有 scroll 事件开销 |
| 实现复杂度 | 低：CSS + 一个 transform + 一条轨道；无输入接管 | 中高：multicol 分片、`contain:paint`、sticky 祖先链、轨道尺寸、`ΔL` 覆写、自带位置记忆 | 高：自持 `s`、写入归因、逐行列号维护、resize/字体加载重定基、与宿主的写互相覆盖 |
| 与冻结定义的字面符合度 | 部分：连续但**接缝在竖直方向移动** | **符合** | 符合几何，**不符合"不许位置突跳"** |

### 3.1 为什么"恢复位置"在无缝下必然降级

宿主的 `restore(position)` 优先走 `align(row, anchorTop)`，公式见 §1.4。在窗口布局里 `y = (p−s) mod H`，所以 `align` 的解集是 `s ≡ p (mod H)`——它会把行放到"某一列的顶部"，**是哪一列取决于当时的 `s`**。新开页面 `s=0` 时，落点 = `p mod H`，与真实位置差 `floor(p/H)·H`，可能就是几十屏。这不是 bug，是"用一维纵坐标表达二维位置"的必然结果。

⇒ **R2/R3 必须自带位置记忆**（按会话键存 `{anchorKey, flowOffset}`，在插件里写一次 `scrollTop`），或者接受"刷新后回到大概位置"。R1 更糟：它的 `scrollTop` 是"列带平移量"，宿主的 `position.scrollTop` 也失去意义。

### 3.2 宿主会把插件的写当成"读者在滚"

`readScroll().movedByReader` 只认 `≤0.5px` 的容差和"这首宿主自己写过"（`chat:2153`、`chat:2415–2426`）。后果链（`[已证实]` 代码路径 + `[假设]` 实际强度）：

1. `following = nearBottom(metrics)` 被重算 ⇒ 中部阅读时"跟随最新"被关掉（本来也应关，无害）；
2. 500ms 后 `flushSample` → `capturePosition()` + `store.save(position)` ⇒ 宿主存下**合成位置**（且锚点是中间列那行，超前 ≈`(N−1)/2·H`）；
3. `readerSampled` → `viewport.stopPreserving()`（`chat:680–682`）⇒ 宿主放弃本次 paging 的锚点保留。若 500ms 内又来一批 commit，`preserve()` 可能用过期锚点再算一次 ⇒ 连续自动加载时误差累积（**P1 必测**）。

### 3.3 加载更早的误差是"一列"，不是"一点"

设头部长 `ΔL`，`k = floor(ΔL/H)`。宿主的 `preserve()` 在 commit 后、我们的重排前执行，此时目标行的屏幕 `top` 只变了 `ΔL mod H`（其余被列绕回吃掉），于是

```
target = s + (ΔL mod H)     而正确值 = s + ΔL      ⇒ 误差 = k·H
```

真实量级：`docs/testing.md` §七 的一次加载让内容长 1183px，`H≈900` ⇒ `k=1`，**差一整个列高**。这解释了为什么"B 必须处理 `scrollTop`"不是洁癖：不处理就是每次自动加载跳一屏。

补充观测（主 agent 2026-11-09 实测，供交叉核对）：一次加载后 `ΔscrollHeight = ΔscrollTop`，两组样本 **+6841/+6841**、**+251/+251**。注意这两组是在 **0.1.4 的普通文档流布局**下取的（`dy/ds = −1`）——它们恰好证明**宿主的公式本身是精确补偿**；B 的误差不来自宿主算错，而来自 B 的布局不满足公式前提（`y` 只有 `H` 周期）。所以 `[假设]` 在 B 下应观测到 `ΔscrollTop = ΔL − k·H`，而不是 `ΔL`——这正是 T4 要证的第一个数。

### 3.4 宿主不是"静止的 `scrollTop`"：单次写 vs 逐帧写

拆清楚两条通道，别混为一谈（§1.2 末两行）：

- **单次写**：`write()`（`chat:2418`）——`preserve()`/`align()`/`restore()`/`scrollToBottom()` 各写一次。"加载更早"走的是这条：`beginPaging()` 保留锚点 → commit → `preserve()` 写一次 → 结束。**没有逐帧循环**。
- **逐帧写**：折叠批次（`createFlowMotion` → `foldDriver`）在 `frame(progress)` 里每帧写 `scrollTop`（`chat:2057`），并用 `drift = scrollTop − written`（`chat:1995`）把**外部（我们的）写当成漂移自纠**：`base += drift; segmentTop += drift; aim()`。`finish()` 还会再补一次（`chat:2040`）。

⇒ 对 R3（接管 `scrollTop`）的准确威胁不是"加载更早"，而是**折叠批次与 `s` 同时活跃**：任何带 `data-chat-motion` 的行收起/展开期间，宿主每帧写、并把我们的写吸收成漂移，双方互相拉。**P1 必须专门构造并发场景（T11），不能只在静态页面上验。**

另一个直接后果：折叠驱动把 `column.offsetHeight` 当内容总高（`chat:1947`、`chat:2003`）。R2 把 flow 钉成 `height:H` 之后，这个值恒等于 `H` ⇒ 折叠批次的"内容增长/余量"计算全错（`aim()` 里 `finalHeight` 会退化）⇒ 折叠动画期间位置补偿失效。这是 R2 的一个**独立于锚点的新风险**，也进 T11。

### 3.5 结构性冲突：「触顶自动加载」× 「零跳动」

`onIntent`（`chat:2448–2463`）：`wheel`/`touchstart`/`pointerdown`/滚动键 `keydown`/`beforematch` 任一命中，只要 `this.paging !== null` 就**立刻** `stopPreserving()`（不等 500ms 采样）。之后 commit 时 `preserve()` 直接返回 null（`paging === null`）⇒ **不补偿，内容前插而 `scrollTop` 不动，整屏被推下去 `ΔL`**。

而自动加载的触发条件恰恰是"用户自己滚到了顶"：**把你送到顶的那个手势，正好是在批次在途时会打掉锚点保持的那个手势**。触控板惯性/连续滚轮尤其容易落在批次窗口内。

- `docs/testing.md` §七 的 E-01（208→247、`scrollTop` 恰好 +1183）之所以零跳动，是因为那次是**合成点击 + 手势早已结束**，没有覆盖"批次在途仍有 wheel"的情况。**这条不能当作 B 的零跳动证据。**
- B 的可行处置只有三种，都要在 P1 定量：(a) 自动加载**只在手势静默 ≥ `T` 后**触发（把 `T` 调到批次能跑完，代价是触顶后要停一下）；(b) 自己补位（每批写一次 `scrollTop`，见 §3.3，属"接管"）；(c) 只在 `hasMore` 且用户**松手**（`pointerup`/`scrollend`）后触发。0.1.x 的 1.5s 防连点 + 3s 手势门控（`lib/client.js:396–412`）只解决"重复触发"，没解决这个。

### 3.6 其它

- **失败/结束态没有 DOM 表面**：paging 失败时插件只能观察到"按钮重新可点 + 行数没变"（`chat:2900–2907` 只有 `disabled`/`loading` 两态，无 error）；`hasMore` 用尽后整块 `.older` 消失。HistoryController 的"失败可恢复、不死循环、可取消"必须靠**超时 + 行数/DOM 变化**判定，不能等错误事件。
- **多 scrollport**：`mainScroller()` 只认一个；右栏 embedded 会话（`sub:805`）必须显式排除，否则两套布局争同一个 `H` 与同一个 `scrollTop` `[风险]`。
- **sticky 元素**（compaction 头、代码块工具条、宿主的 `toBottomSlot`/`composerSeat` 都是 sticky）：在 multicol 容器里 sticky 的包含块行为各浏览器不一致，`chat:2679` 里宿主的 sticky 是相对 scrollport 写的，插件把 flow 变成 `height:H` 的 multicol 后它们的"粘住范围"会变 `[风险]`，P1 必须有专项。

---

## 4. 推荐

**推荐 R2，理由三条：**

1. 它是 §1.3 里唯一"不切断、不丢失、不突跳"的解，也就是唯一能在维护方逐条核对时站得住的解。
2. 它**不写 `scrollTop` 就能跑**（只有"加载更早后的 `ΔL` 补偿"和"自带位置记忆"两处需要写，都是每批一次、可计数、可关闭），完全对得上"未经证实不许接管 `scrollTop`"这条红线；P1 的任务正是把这两处从"未经证实"变成"已证实"或"必须接管"。
3. `scrollTop ≡ 流位置` 这个不变量让宿主的 `nearBottom`/跟随/回到底部**语义自动正确**，是三条路线里对宿主最友好的。

**改推荐的条件（任一成立就改）：**

| 观测 | 改到 | 理由 |
|---|---|---|
| 247 行下 R2 帧间隔 p95 > 33ms，或出现 > 100ms 长任务 | R1（若能接受接缝横移）或 R3 | 60fps 是"连续阅读"的硬门槛，宁可牺牲接缝方位 |
| `ΔL` 覆写后宿主**反复重试**（不只写一次）或 `overflow-anchor` 触发二次补偿，导致位置抖动 | R3（明确接管并文档化"牺牲宿主跟随"） | 与宿主抢同一个值时必须有一方退出 |
| 逐行实测"接缝留白"中位数 > 0.25·H（原子块太大，图片/表格多） | R3（放弃"不切断"，换性能与接缝紧贴） | 留白太大就不叫"接缝在底部附近"了 |
| 恢复位置实测误差 > 1 个列高且维护方不接受插件自存位置 | R1 | R1 的 `scrollTop` 语义与宿主无关，反而不会误导 |
| `contain:paint` 压不住 overflow 列（出现横向滚动条/`scrollWidth>clientWidth`） | 先修 R2 的容器方案；修不动则 R1 | R1 不需要 overflow 列 |
| T4b 显示"批次在途有手势"时宿主完全不补偿（`ΔscrollTop = 0`），且"手势静默后再加载"在真实触控板上不可用 | R3（接管，自己补位）**或**把 B 的默认改成"不自动加载" | 零跳动是 B 的定义项，不能让给"用户别滚那么快" |

---

## 5. P1 原型验证清单

**前置**：新建 `harness/seamless-probe.mjs`（探针，不改 `lib/client.js`），复用 `harness/cdp.mjs` 的 `Cdp` 类与 `eval-file` 通道；给 `cdp.mjs` **只加两个子命令**：`wheel`（`Input.dispatchMouseEvent` `type:"mouseWheel"` + `deltaY`，产生可信滚动）和 `send`（裸 CDP，用于 `Performance`/`Input` 域）。所有判定用 **rAF 帧序列 + `getBoundingClientRect` 采样 + `scrollTop` 写入探针**，截图只作辅证。

探针必备的三件观测：

```js
// 1) 写入归因：记录每一次 scrollTop 写入的值与调用栈长度（只在探针页内生效，不进插件）
const d = Object.getOwnPropertyDescriptor(Element.prototype, "scrollTop");
Object.defineProperty(Element.prototype, "scrollTop", { get: d.get, set(v){ log({v, t: performance.now(), stack: (new Error).stack.split("\n").length}); d.set.call(this, v); } });
// 2) 帧序列：每帧记录参照行的 rect + s + 当前列号
// 3) 内容守恒：把每个 [data-chat-flow-key] 的 rect 映射回流坐标，检查无空洞/无重复
```

| # | 测什么 | 怎么测 | 通过标准 |
|---|---|---|---|
| T1 | **分片正确性（内容守恒）** | 沙盒 + 真实会话各一次；注入 3000px `pre`、1200px 图片位、900px 表格；在 `s` 的 20 个等距点采样：把每行 `rect` 映射回流坐标 `p`，排序后检查覆盖 `[s, s+N·H)` 且无重叠 | 无空洞（间隙 ≤ 最大不可断元素高）、无重复（同一 `p` 不出现两次）、`Σ列高 + Σ留白 = L` 误差 ≤ 2px |
| T2 | **帧级连续性（不跳）** | `wheel` 连续滚 600px（约 40 帧），每帧记录参照行 `rect.top` 与 `s`；断言 `|Δy + Δs| ≤ 0.5` | 除"跨接缝那一帧"外全部成立；跨接缝帧允许一次 `±H` 跳变，但必须同时观测到列号 `+1` |
| T3 | **接缝钉在底部附近** | 50 个 `s` 点，量"每列最后一个完整元素的底边到 `y=H` 的距离" | 中位数 ≤ 0.1·H，p95 ≤ 0.5·H；且**不存在**某列底部空白 > 1 个不可断元素高 |
| T4 | **加载更早零跳动** | 用真实 `hasMore` 会话（`docs/testing.md` §七 的 208→247 用例）：记录顶部中线锚点行 `rect.top`，触发一次自动加载，等 commit + 2 帧 | `rect.top` 变化 ≤ 2px；`ΔscrollTop` 记录实际值并与 `ΔL − k·H`（§3.3 预测）比对；**并记录宿主在此期间写了几次、值是多少**（T5 的数据） |
| T4b | **批次在途仍有手势**（§3.5 的结构性冲突） | 用 `wheel` 制造**连续**滚动（触控板惯性：每 16ms 发一次 `mouseWheel`，持续 1.5s），在滚到顶的瞬间触发自动加载，并让 wheel 继续到批次结束 | 必须给出结论而不是"看情况"：若 `ΔscrollTop = ΔL`（补偿生效）则冲突可容忍；若 `ΔscrollTop = 0`（`onIntent` 打掉 preservation）则 B 必须走 §3.5 的 (a)/(b)/(c) 之一，并在设计里定死 |
| T5 | **宿主写入归因** | 用上面的 `scrollTop` setter 探针，跑 T4、T4b、"用户手势滚动"、"折叠批次（`data-chat-motion` 收起）"四段 | 用户手势段：插件写入 = 0；加载段：插件写入 ≤ 1 次/批且都在宿主写之后；折叠段：记录宿主逐帧写的频率（判断 R3 的并发风险是否真实存在） |
| T6 | **性能** | 247 行 / 3 列，`s` 连续变化 300 帧，采集帧间隔 p50/p95/max + `PerformanceObserver('longtask')`；同时在 rAF 内量"重排前/后"的 `performance.now()` 差 | p95 ≤ 20ms（60fps）为佳；≤ 33ms 可接受但记录；出现 > 100ms 长任务 → 触发 §4 的改判 |
| T7 | **恢复位置** | 滚到会话中部，`Page.reload`，等首帧稳定 | 落点与刷新前的**流位置**差 ≤ 1 个列高；若误差更大，验证"自带位置记忆"方案能把误差压到 ≤ 1 屏 |
| T8 | **缩放/列数变化与溢出** | `resize 1700 900 → 1200 900 → 900 900`；每次断言参照行仍在视口内、`scrollWidth == clientWidth` | 流位置不变（±1 行）；无横向滚动条；列数变化后 `H` 重算且切点仍 = `s + c·H` |
| T9 | **接管边界（红线）** | 汇总 T5，另跑"无 hasMore 的普通会话滚 60 秒" | 插件在**非加载批次**期间的 `scrollTop` 写入次数 = 0；否则判"已接管"，必须在文档里显式声明并写进 `CHANGELOG` |
| T10 | **sticky/不可断元素专项** | 构造 sticky 工具条 + 大图 + 宽表；在 `s` 扫描中记录 sticky 元素在每个列的粘住位置 | sticky 不跨列、不抖、不盖住接缝内容；图片/表格完整（允许推列留白） |
| T11 | **折叠批次与 `s` 并发**（§3.4） | 让一个 `data-chat-motion` 行收起，**同时**连续滚 300px；记录宿主逐帧写与参照行 `rect.top` | R2：折叠期间参照行位移 ≤ 2px（若 > 2px 说明 `column.offsetHeight=H` 把折叠补偿搞坏了，需给折叠期间提供"真实内容高"的替身）；R3：若观测到双方互拉（帧间抖动 > 2px）⇒ 必须选边（暂停折叠或暂停 `s`） |

**R2 的 go/no-go 门槛**：T1/T2/T3/T4b 全过 + T5 的"非加载段 0 写"成立 + T6 p95 ≤ 33ms ⇒ 采用 R2；否则按 §4 的改判表走。T11 是 R2/R3 的加分项，但若 R2 在 T11 上抖 > 2px，视为"必须给折叠期提供替代内容高"，成本 +1 档。

---

## 6. 本节的开放问题

1. ~~"接缝固定在视口底部附近"到底指哪个~~ —— **已定（2026-11-09，维护方）：流切点钉在 `y=H`，
   即 R2 的读法**。R1（列间竖缝横移）不采用，仅保留为 R2 未过 §5 门槛时的退路。
2. **接缝处允许"文本/代码块被分片"吗**？允许 ⇒ R2 成立；不允许 ⇒ 在"一份内容"约束下 B 不可实现（§1.3），只能退 R1 或承认 R3 的整行跳变。
3. **无缝模式要不要留住宿主的"跟随最新消息 / 回到底部"**？R2 免费得到它，R3 必须自己实现；如果产品上不需要，R3 的成本会低很多。
4. **允许插件自存"流位置"吗**（新 `localStorage` key，按会话）？宿主的位置记忆在无缝布局里只能恢复到相位（§3.1），不自存就只能"回到大概位置"。
5. **触顶自动加载怎么和"手势打掉锚点"共存**（§3.5）：B 的补位有三条路——(a) 手势静默 N ms 后才触发、(b) 插件自己补 `scrollTop`、(c) 等 `scrollend`/`pointerup`。选哪条决定了 B 是"零接管"还是"每批一次接管"，也是 §4 的改判入口；另外 `s < H` 就预取是否可接受也一并定。

---

## 7. 结论清单（可直接进总文档）

1. 无缝 = 流坐标按可见列高 `H` 切成滑动窗口（切点 `s + c·H`、随滚动平移、屏幕上钉在列底边），**不是**报纸分栏的特例；在"一份 DOM 树 + 内容不重复"约束下，只有浏览器分片（CSS multicol fragmentation）能同时做到不切断、不丢失、不突跳。
2. 三条路线：R1 固定切点 + 横向平移（不重映射、零重排、接缝横移）；R2 滑动窗口 + 每帧重分片（重映射、只读 `scrollTop`、符合定义）；R3 逐元素 transform + 自持 `s`（重映射 + 接管、零重排、接缝处整行横向跳）。
3. 宿主锚点契约是 `dy/ds = −1`（`chat:2340`、`chat:2415`）；窗口化布局破坏它，表现为**恢复位置只剩相位**、**加载更早差 `k·H`**（量级：一次 1183px 加载 = 一个列高）。
4. 宿主有两条写通道：单次写（`chat:2418`，paging 走这条，逐批一次、在普通文档流下恰好等于内容增量）+ **逐帧写**（折叠批次 `chat:2057`，带 `drift` 自纠 `chat:1995`，用 `column.offsetHeight` 当内容高 `chat:1947`）；且任何非宿主写入的 `scrollTop` 变化（>0.5px）都被记成"读者移动"（`chat:2153`）。所以"插件写 `scrollTop`"必须按**次/批**计数验收，接管 `scrollTop` 的真实冲突来自折叠批次。
5. **结构性冲突（B 必须正面回答）**：`onIntent` 在 paging 在途时被任何 wheel/touch/key 触发就 `stopPreserving()`（`chat:2448–2463`）⇒ 该批不补偿、整屏被推下去 `ΔL`；而"滚到顶"用的正是这个手势。0.1.x 的 E-01 零跳动没有覆盖这种情况，不能当 B 的证据。
6. 让 `scrollTop ≡ 流位置`（`scrollHeight − clientHeight = L − H`）能让宿主的 `nearBottom`/跟随/回到底部**自动正确**，这是 R2 相对 R1/R3 的关键优势。
7. 推荐 R2；R1 作为零重排保底；R3 只在 R2 帧级性能不过关或必须抢 `scrollTop` 时启用，并显式记录"牺牲宿主跟随"。
8. P1 不接受静态截图：以 T1–T11 的帧级/内容守恒/写入计数为验收口径，R2 的 go/no-go 门槛写在 §5 末。
