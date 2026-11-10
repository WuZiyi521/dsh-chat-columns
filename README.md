# dsh-chat-columns 3.0

> 给超长对话加「读法」。同一份内容，四种组织方式：**原生 / 报纸 / 无缝 / 复制**。
> 一个插件，无构建步骤，不改应用外壳，默认零干预。

```
原生    宿主原样，插件只是安静地待命
报纸    横向用满：CSS 均衡分栏，所有列共用宿主那一个滚动容器
无缝    一屏一列：列高 = 阅读视口高度，滚动时接缝相对内容连续推进
复制    只读副本：同一份对话复制成 N 栏，每栏各自滚动，用来对照不同段落
```

状态：**3.1.0**（2026-11-11）。三种模式全部实现，默认停在「原生」，只有你主动切换才会改变宿主布局。
逐版本改动见 [CHANGELOG.md](CHANGELOG.md)。

---

## 1. 安装

```bash
git clone https://github.com/WuZiyi521/dsh-chat-columns.git
node dsh-chat-columns/scripts/install.mjs --profile <你的 profile 名>
```

`<你的 profile 名>` 就是 `~/.dsh/profiles/` 下面的目录名（本机是 `0.2.1-alpha.2`）。
脚本不依赖 `dsh` / `pnpm` 在 PATH 上，只用 Node 做三件事：在 profile 的 `node_modules` 里建一个指向本目录的
链接（Windows 用 junction，等价于 pnpm 的 `link:`）、把包名写进 `dsh.profile.bundles`、备份 `package.json`。
如果之前装过旧版（`dsh-chat-columns-2`），脚本会把它从 bundles 里摘掉（包仍留在 `node_modules`，随时可退回）。

装完**重启 DSHWeb**：`dsh-web` 就是那个 web 服务本身，重启会让正在进行的对话断一下。

也可以走 GUI：DSHWeb → Plugins → Add plugin → 选这个目录 → Install → Enable now → 重启。

### 卸载

```bash
node dsh-chat-columns/scripts/install.mjs --uninstall --profile <profile 名>
```

---

## 2. 使用

右下角/右上角有一个半透明胶囊，点它展开面板（键盘可 Tab 到，Enter/Space 打开，Esc 收起）：

| 控件 | 说明 |
|---|---|
| 显示模式 | 原生 / 报纸 / 无缝 / 复制 |
| 列数 | 自动 / 1 / 2 / 3（自动 = 按可用宽度算，每列 ≥420px，最多 3 列；手动可压到 260px） |
| 到顶自动加载更早 | **每个模式独立记忆**：报纸默认关、无缝默认开、复制默认开 |
| 加载更早 | 手动触发宿主的「加载更早」按钮（报纸/无缝关闭自动时出现在正文顶部） |

偏好存在 `localStorage['dshc-settings']`，第一次安装默认是「原生」，什么都不改。

---

## 3. 实测验收清单

> 这一节是给你在**真实 DSHWeb** 上跑的。我没跑真实浏览器，下面标了「预期」和「失败长什么样」。

### T1 默认零干预

1. 刷新页面，进一个长会话。
2. **预期**：会话还是原生单列；只有一个小胶囊，不遮挡输入框和右侧滚动条。
3. **失败**：页面多出分栏 / 胶囊挡住输入框 / 胶囊不出现。

### T2 报纸模式（A）

1. 面板 → 报纸，列数「自动」。
2. **预期**：正文变成 1–3 列，横向铺满，列间 40px；滚动条只有宿主那一个；滚轮滚动时所有列一起走；短消息不会被列缝切开。
3. 把窗口从宽拖窄。
4. **预期**：列数从 3 → 2 → 1 自动回落；回落时阅读位置基本不动。
5. 看列底：**不应出现一整列高的空白**；`__dshc.diagnose().newspaper.blank` 应远小于 `height`。
5. **失败**：列数不回落 / 内容被切断成两半且读不到 / 出现两个滚动条。

### T3 无缝模式（B）★高风险

1. 面板 → 无缝。
2. **预期**：正文变成 N 列，每列高度正好等于「标题栏底部到输入框顶部」；**一条消息不会被列缝切断**（放不下就整条挪到下一列，列底可能有留白）；消息里的按钮（复制代码等）仍可点。
3. 慢慢滚动。
4. **预期**：每列内容随滚动连续上移，接缝相对内容连续移动；滚动条长度对应「内容总高 - 一屏」。
5. **失败的表现**（请把现象发我）：
   - 所有列内容挤在最上面不动 → sticky 没生效（控制台 `__dshc.diagnose().seamless` 里 `active:true` 但视觉不动）；
   - 滚动时内容闪烁/抖 → 宿主 `scrollTop` 补偿在跟插件抢；
   - 一条代码块被截掉一半 → 超高消息处理异常。
6. 切回原生 / 切回无缝 3 次。
7. **预期**：每次都能干净地还原再进入，不叠加、不错位。

### T4 复制模式（C）

1. 面板 → 复制。
2. **预期**：正文被只读副本替换，N 栏并排；**每一栏都是完整对话的一份副本**（不是把内容切成 N 段），三栏从同一阅读位置开始，各栏有自己的滚动条和「栏 1 · 只读对照」标题；**在某一栏滚动，其它栏不动**；文字可选中复制；链接可点；按钮点不动（预期行为）。
3. 顶部「拉取更早历史」。
4. **预期**：宿主加载更早的历史，副本增量补进来，各栏阅读位置尽量保持。

### T5 历史加载

1. 报纸模式，滚到顶部。
2. **预期**：出现「加载更早」胶囊（报纸默认不自动加载）；点它 → 宿主的原生按钮被点击 → 历史补进来，不重复、不跳回顶部。
3. 无缝模式默认自动：滚到顶部应自动加载一次，且 1.5s 内不会连点。

### T6 生命周期

1. 切到别的会话，再切回来。**预期**：模式与列数保持，布局重新应用。
2. 关闭插件（unmount）或停用。**预期**：`display` 回到宿主原值、内联变量清空、`data-dshc-*` 属性全部消失、胶囊消失、页面回到完全原生。
3. 控制台 `document.querySelectorAll('[data-dshc-a],[data-dshc-b],[data-dshc-hide]').length` 应为 0。

### T7 诊断（出问题时请贴这段）

```js
__dshc.diagnose()
// → { version, state, target, geometry, available, newspaper, seamless, mirror, history }
```

- `target.reason`：`ok` / `ambiguous`（多个疑似会话，已停止增强）/ `no-conversation`
- `geometry.height`：阅读视口高度（= 无缝的列高）
- `seamless`：`{ active, H, columns, columnWidth, pages, total, scroll, maxScroll, items, tall }`
  - `total` 应 ≈ `pages × H`；`maxScroll` 应 = `total - H`
  - `scroll` 是当前逻辑滚动量

---

## 4. 结构

```
src/math.js        纯计算：列数、B 的打包与投影（可脱离浏览器单测）
src/adapter.js     宿主边界：主会话识别、几何、主题、样式快照、C 的净化沙箱
src/indexer.js     消息索引：稳定 ID / 顺序 / 增量变更（唯一的内容观察器）
src/history.js     历史状态机：只点宿主按钮，防重复、可重试
src/newspaper.js   A 报纸：CSS 均衡分栏 + 超长消息允许跨列
src/seamless.js    B 无缝：粘滞视口层 + 绝对定位 + 逻辑占位层
src/mirror.js      C 复制：只读副本 + N 栏独立滚动 + 增量同步
src/controller.js  悬浮控制器：模式/列数/自动加载开关/a11y/持久化
src/index.js       唯一状态所有者：mount/unmount、模式编排、降级
src/tokens.css     设计令牌（宿主 --dsw-alias-* 优先，深色回退）
src/layout.css     A / B / C 与控制器样式（全部 scoped）
scripts/build.mjs  零依赖构建 src → lib/client.js
scripts/check.mjs  包契约 / 语法 / 宿主选择器隔离 / CSS 作用域 / 产物新鲜度
scripts/test.mjs   math 单测（10 项）
scripts/smoke.mjs  最小 DOM 桩 + 契约夹具：激活 / 挂载 / 三模式应用 / 还原 / 卸载（15 项）
scripts/install.mjs  装进某个 profile（带备份与 --uninstall）
lib/client.js      产物（提交进仓库，安装即用）

docs/宿主契约审计.md        宿主 DOM 契约的逐条证据（0.2.1-alpha.2）
docs/无缝模式-模型说明.md   B 的几何模型、为什么"消息不跨列"、diagnose 判读
```

### 三条不可越界的线

1. **宿主契约只在 `adapter.js`**：`[data-conversation-scroll]`、`[data-chat-flow]`、`--dsh-chat-content-width` 等字面量出现在别的文件里，`npm run check` 直接失败。
2. **CSS 只在自己名下**：每条选择器必须以 `#dshc-root` 或 `[data-dshc...]` 开头，不写裸标签。
3. **对宿主的写入都可回滚**：内联样式与属性先快照，`unmount` / 切模式时原样还回去。

---

## 5. 关键设计

### 列数（写死，不做缩放适配）

```
gap = 40
自动   = clamp(floor((W + gap) / (420 + gap)), 1, 3)
手动 n = min(n, clamp(floor((W + gap) / (260 + gap)), 1, 3))
W = 正文列真实可用的 CSS px（滚动容器 clientWidth 扣掉左右内边距）
```

分母加 `gap` 是必须的：只算 `W / 420` 会把三列压到 403px。

### 报纸（A）

直接把 CSS 多列加在宿主原生 `[data-chat-flow]` 上：宿主那层是 `display:flex`（多列对 flex 无效），先改回 `block`；
多列时把 `--dsh-chat-content-width` 放到 `100%`（宿主默认 `min(100% - 32px, 920px)`，920px 摊成 3 列每列只剩 280px）。
**不接管 scrollTop**，锚点、滚动、历史加载都还是宿主那套。

**怎么平分**：`column-fill: balance` + 所有消息都允许被列缝切开（`break-inside: auto`），
各列等高，内容从左往右连续流过去，列底不会再参差。两个宿主细节必须处理，否则分不了：

- 代码块的 `pre` 带 `overflow-x: auto`，**滚动容器不可分片** —— 不处理的话代码块只能整块搬到下一列，
  把上一列留空。所以这里把 `pre` 的 overflow 放开、长行改成软换行；
- 代码块外面那层卡片常带 `overflow: hidden`（圆角裁切），同样不可分片，一起放开。

代价：代码块会在列缝处截断（接着读下一列顶部），长行是软换行而不是横向滚动。

看完效果可以 `console.log(__dshc.diagnose().newspaper)` 拿到 `height / items / columnsEnd / blank`，
`blank` 就是「最矮那列底部到列底」的距离（平分做对了应该接近 0）。

### 无缝（B）

```
第 c 列显示逻辑区间 [s + cH, s + (c+1)H)，s = 主滚动容器 scrollTop，H = 阅读视口高度
```

- 原生正文列变成 **高度 H 的粘滞视口层**（`position:sticky; top:0; height:H; overflow:hidden`）；
  如果中间夹了 `overflow:auto/scroll/hidden` 的祖先（sticky 会失效），自动退化为「JS 钉住」：每帧把视口层下移 `s`。
- 消息节点**保持原父子关系**，逐条 `position:absolute` + `translate3d(left, top, 0)` 放进对应列；
  **不 reparent、不 clone**，所以复制代码、折叠、审批这些宿主交互都还在。
- 滚动容器里放插件自有的**逻辑高度占位层**（`::after` 伪元素，高度 = 逻辑总高 - H），提供真实滚动行程。
- **一条消息绝不跨列**：按整列高度打包，放不下就另起一列。这样不会出现「消息被列缝切断、下半截永远看不到」。
- 单条消息比 H 还高：独占一个列段，列内只显示一屏，**由消息自己内部滚动**（杜绝与相邻消息重叠）。
- `scroll` / `ResizeObserver` / 消息变化统一用 `requestAnimationFrame` 合并；流式变化只重测脏消息并重排。

### 复制（C）

整段对话只有一套 React 管理的节点树：搬节点会破坏 keyed seat，克隆后的交互也全失效。
所以 C 只能是**只读副本**：克隆宿主已渲染的结构，净化（去 id / 表单 / 内联事件 / 可执行节点，禁用按钮）。

分栏语义是「**同一份对话复制 N 份**」，不是把内容切成 N 段：
每栏都是完整副本、各自独立滚动，进入时三栏对齐到同一阅读位置，之后各滚各的，
这样才能"左栏看第 3 轮、右栏看第 9 轮"地对照。代价是 DOM 变成 N 份（默认上限 3 栏）。

- 第 0 栏从宿主克隆并净化，其余栏直接克隆第 0 栏的节点（省掉重复净化）；
- 流式输出只做「脏消息原地换节点」，不重建整栏（否则每 120ms 会把滚动位置打掉）；
- 结构变化（加载更早、折叠）才整栏重建，并按消息 ID 还原每栏的阅读位置。

### 历史加载

- 统一只点宿主原生的「加载更早」按钮，绝不自己发请求；
- 一个状态机：`unknown / idle / loading / end / error`，1.5s 防连点，2.6s 看门狗判失败；
- 报纸默认手动（多列均衡重算时自动加载容易跳），无缝默认自动（连续阅读），复制默认自动；
- 都可在控制器里改，且**按模式分别记忆**。

### 降级

- 识别不到主会话 / 多个候选分不清（`ambiguous`）/ 宽度只够 1 列 / 无缝初始化失败 → **保持原生**，控制器里给一句说明；
- 激活入口 **绝不向外抛异常**（延迟挂载 + 重试 3 次 + `window.__dshcActivationError`），插件再坏也不会把宿主启动拖崩；
- 热更时旧实例的 disposer 晚到也不会回滚新实例的改动（根节点归属检查）。

---

## 6. 已知限制

1. **B 的阅读模型**：按任务书定义，第 c 列显示 `[s+cH, s+(c+1)H)`。这意味着每列是「错开一屏的连续窗口」：
   从左列往下读，接缝处内容与右列顶部是连续的；继续滚动时，各列内容同时上移、接缝相对内容移动。
   它不是「翻页」，也不是「左列读完右列接着读」的静态分栏。若你要的是后两者，需要改模型（见 `docs/无缝模式-模型说明.md`）。
2. **代码块会被切开**：为了平分，含代码块的消息也会被列缝截断；长行改成了软换行（否则 `pre` 不可分片）。
   如果不想要软换行，可以关掉报纸模式用原生。
3. **超高消息**：> H 的消息在消息内部滚动（会多一层滚动条）。
4. **宿主锚点**：B 关掉了浏览器滚动锚定并在插件内自己换算；宿主自己的 `preserve()` 仍可能写 `scrollTop`，
   两者在极端情况下会抖一下（真实环境待验证）。
5. **复制模式只能读**：按钮点不动、表单不可编辑（React 节点不能搬、克隆的交互是死的）。
6. **超宽表格**：宿主 `.md-table-wide` 基于 `100cqw`，三列下可能溢出（已在副本里加 `container-type: inline-size`，仍待真实环境确认）。
7. **复制模式的内存**：N 栏 = N 份 DOM。对话特别长时（几百条 + 大代码块）内存与首屏构建会变慢；列数上限 3。
8. **窄屏**：< 768px 强制单列并折叠控制器的文字标识。移动端没有专门适配。
9. **宿主自己的按钮**：三种增强模式里，正文顶部的宿主「加载更早」按钮会被收起（由控制器顶部的胶囊代替）；
   B 还会收起正文列里「不是消息」的装饰节点（生成中指示、占位等）。
10. **跨端/跨版本**：只有 `lib/client.js` 一个浏览器入口，宿主差异全部收敛在 `adapter.js`；
   第一版只保证当前 DSHWeb（0.2.1-alpha.2）。

---

## 7. 开发

```bash
cd D:/dsh/dsh-chat-columns-3.0
npm run build     # src/ → lib/client.js
npm test          # math 单测
npm run check     # 静态检查（契约隔离 / CSS 作用域 / 产物新鲜度 / 可物化）
npm run smoke     # 最小 DOM 桩 + 契约夹具：apply → mount → 三种模式应用 → unmount 全干净
npm run verify    # 以上全部
```

改完 `src/` 必须重新 build 并**重启 DSHWeb**：`dsh-web` 启动时把 `lib/client.js` 读进内存并按 rev 缓存，
只刷新页面仍是旧字节。
