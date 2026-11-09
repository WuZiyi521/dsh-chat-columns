# 07 · ThreadContext、测试与验收、五项风险

> 路径约定：`仓库/` = `/home/leon/dafeiyu/projects/dsh-chat-columns/`，
> `宿主/` = `/home/leon/node/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/`。
> 只读代码与文档，未开浏览器，未跑任何测试；标 `[假设]` 的都必须实测才算数。
> 本节不重复 README「复制模式硬约束」「P1 为什么难」，只补它没说的。

## 0. 结论先行

1. `[已证实]` 0.1.4 的状态是**模块级单例**（`lastState`、`lastFlow`、`appliedFlows`、`widthTouched`，`仓库/lib/client.js:124-201`）+ **`<html>` 全局属性**。0.2 必须把它们收进「按容器分片」的 ThreadContext；否则第二个 `[data-conversation-scroll]`（子智能体右栏）一出现就是状态互相踩。
2. 分片的最小单位不是「会话 id」，是**滚动容器元素**；会话 id 只当**持久化键**。这样拿不到 id 也能工作，拿到 id 才记忆。
3. 0.2 只做**单线程激活**（同一时刻只有一个线程被排版、被加载），但状态按容器分片。激活是派生量，不是状态本身。
4. 0.1.x 的测试有两个结构性盲区：沙盒只有**一个**滚动容器（`仓库/harness/index.html:35-37`），且沙盒**永远不会有 null/hero**。0.2 新增的线程分片与 none 路径，这两块一条都测不到。
5. `[已证实]` 沙盒还有一处保真缺陷必须先修：它把「正文列上限」放在 flow 的**父元素**上（`:16-18`），而宿主的 `[data-chat-flow]` **自己就是**那个 `max-width` 元素（`宿主/dsh-client-ui-chat/lib/client.js:2679,2886`）。所以沙盒里 3 列实际总宽被 920px 卡死，只验证了"列数被设上"，没验证"列宽够读"。
6. 发版门槛见 §5：不是"三种模式都能开"，而是"P0–P5 的量化标准在真实 DSH 上全过、且双线程与历史单源零回归"。

## 1. ThreadContext：按会话/线程隔离什么

### 1.1 隔离边界（先定"什么属于线程"）

| 状态 | 归属 | 生命周期 | 依据 |
|---|---|---|---|
| 模式（报纸/无缝/复制） | 线程（可回落到全局默认） | 持久化，按会话 id | 不同会话适配不同读法；全局单值会强迫每次重切 |
| 报纸列数 | 线程（同上） | 持久化 | 同上；0.1.4 只有全局一个 `localStorage["dsh-chat-columns:cols"]`（`仓库/lib/client.js:27`） |
| 滚动位置 | **宿主**（A/B）；C 的各栏位置属该线程的渲染器 | 插件不持久化 | 宿主自己存 position（`宿主/dsh-client-ui-chat/lib/client.js:1167-1222`），插件再存一份很可能打架 |
| 历史加载进度 | 线程（仅运行时） | **永不持久化** | 分页真值在宿主 DOM；缓存自己的进度只会在重挂载后说谎 |
| 副本布局（栏数、各栏 offset、渲染快照） | 线程（仅运行时） | 内容变化即失效 | 旧 offset 落到新内容上没有意义 |
| 全局偏好（默认模式、每模式自动加载默认值、是否被用户显式改过） | **不是线程** | `localStorage` | 任务书要求"默认值不得覆盖用户已设偏好"，所以必须记 `explicit` 标记 |

### 1.2 最小设计（够 0.2 用，不为 0.3 预埋）

```ts
type Mode = "newspaper" | "seamless" | "copy";

interface ThreadState {              // 每个滚动容器一份，纯数据
  mode?: Mode;                       // undefined = 跟随 prefs.mode
  cols?: 1 | 2 | 3 | "auto";         // undefined = 跟随 prefs.cols（报纸）
  copy?: { n: number; offsets: number[]; snapshotKey: string };
  history: {                         // 运行时，永不落盘
    phase: "idle" | "loading" | "complete" | "error";
    inFlight: boolean; attempts: number; hasMore: boolean; lastError?: string;
  };
}

interface ThreadContext {
  readonly key: string;              // "s:<sessionId>" | "anon:<n>"
  readonly persistent: boolean;      // false 时 key 只是诊断用
  readonly scroller: HTMLElement;    // 唯一身份
  flow(): HTMLElement | null;        // 每次现取，不缓存（宿主会换节点）
  readonly state: ThreadState;
  dispose(): void;                   // 释放本线程一切引用/观察者
}

interface ThreadRegistry {
  resolve(scroller: HTMLElement): ThreadContext;   // WeakMap<Element,ThreadContext>，get-or-create
  peek(scroller: HTMLElement): ThreadContext | undefined;
  active(): ThreadContext | undefined;             // 最后交互者；仅用于徽标/快捷键/自动加载
  all(): ThreadContext[];                          // 诊断与卸载兜底
}
```

约束：

- `ReaderCore` 持有 `Map<Element, ThreadContext>`（容器还活着时强引用，`dispose` 时删），**没有** `currentFlow` 这类模块级可变槽。今天 `lastFlow`/`appliedFlows`（`仓库/lib/client.js:199-201`）承担的职责拆成：线程内 `flow()` + 线程内 `applied: Set<Element>`。
- `active()` 在 **0.2 恒等于 `HostAdapter.current()`**（主会话容器），与 01 §0 第 4 条一致。
「最近一次 `pointerdown|wheel|keydown|focusin` 命中的 scroller」只作为 `ThreadRegistry` 的**预留派生**，
**不参与 0.2 的排版决策**——0.2 只有一个容器会被排版，多容器调度属于 0.3 之后。
（0.1.4 的「行数最多的 scroller」正是被这条取代的，`仓库/lib/client.js:131-145`。）
- `<html data-dshc*>` 只保留为**诊断视图**（版本/owner/state/active key），不是真值来源；`data-dshcThread` 写到 flow 与容器上，供 HMR 后从 DOM 重建归属。
- 记忆槽：`localStorage["dsh-chat-columns:threads"]`，一个 JSON，LRU 上限 30 条、每条只存 `{mode?, cols?}`。`[假设]` 30 条足够覆盖常用会话；超限不报错，直接淘汰最旧。

### 1.3 key 从哪来、拿不到怎么办

`[已证实]` 宿主把会话 id 写在会话内容根的属性上：

```
宿主/dsh-client-ui-conversation/lib/client.js:17865-17871
  <div data-conversation-content data-conversation-session={sessionId}
       data-content-phase={phase}>
    <div data-conversation-scroll> …
```

宿主自己也是这么反查的（`occurrence = target.closest("[data-conversation-session]")`，`:19385`）。

```ts
const sid = scroller.closest("[data-conversation-content]")
  ?.getAttribute("data-conversation-session") ?? null;
```

- 有 sid → `s:<sid>`，`persistent = true`。
- 无 sid → `anon:<n>`，`persistent = false`，**不写 localStorage**（否则新会话每开一次就攒一条垃圾）。`[已证实]` sid 会是 `undefined`：hero/新会话时 `sessionId === undefined`（`:17546`），React 不渲染该属性。
- sid **迟到**（新会话发出第一条消息后才有 id）：ctx 就地升级 key，`anon → s:<sid>`；只补读持久化里"用户从没在本 ctx 改过"的字段，改过的不覆盖。这条是必须的，否则"新建会话 → 读着 → 刷新"会丢模式。
- 同一 sid 两个容器同时活着（例如同一会话在主槽和右栏各开一份）：**两个 runtime ctx 独立**，持久化槽只有一份，后写覆盖。0.2 不做冲突合并（值两个字节，用户一秒能改回来）。

### 1.4 切会话：保留什么、丢什么

| 项 | 切走 | 切回 |
|---|---|---|
| 用户设过的 mode / cols | 写入该 sid 的持久化槽 | 读回 |
| 历史进度、in-flight 请求 | **取消并丢弃**（`cancel()`），绝不"接着上次继续" | 从 DOM 现状重新推导（有几行、有没有 `hasMore` 按钮） |
| 复制布局、各栏 scrollTop | 丢弃 | 重建；栏内位置归零（保留第 0 栏位置也无意义，因为批次会追加内容） |
| 实测高度缓存（行高、接缝位置） | 丢弃 | 重新测量 |
| DOM 引用、ResizeObserver、MutationObserver、rAF、事件监听 | 全部释放（沿用 0.1.4 的 actor 清理清单） | 新建 |

### 1.5 明确不做（防过度抽象）

1. **不做并发排版**：同一时刻只排 `active()` 一个线程；其它线程不套列、不跑历史。多容器只保证"互不污染"，不保证"都好看"。
2. **不做隐藏会话预热**：不给不在 DOM 里的会话建 ctx，不预渲染、不缓存 DOM 快照。
3. **不碰宿主会话服务**：不从 `ctx.sessions` 之类取身份。`[假设]` 第三方 bundle 是否可见该服务未验证；0.2 只读 DOM 属性。包清单里 `dsh.client.inject` 是空数组（`仓库/package.json`），也没有声明依赖。
4. **不做跨标签页同步 / IndexedDB / 指纹**：一个 `localStorage` 小 JSON 够用。
5. **不把 C 的栏容器算进 ThreadContext**：C 的栏是只读渲染器内部容器，随渲染器生死，不进注册表。
6. **不做元素级状态**（展开/折叠/图片尺寸记忆）：0.3 的事。
7. **不做"模式 = 全局"的兼容开关**：0.2 起就是每会话记忆，不再提供单一全局列数。

## 2. 测试分层

### 2.1 三层各能测什么、骗不了什么

| 层 | 能测 | 测不了（别自欺） |
|---|---|---|
| 沙盒 `仓库/harness/index.html` | 纯布局数学与 CSS 是否落地（flex→block、column-count、atomic 标记）、状态机（active/ambiguous/none）、归属与 disposer 竞态、按钮查找的门控逻辑、拆分后的纯函数 | 真实 React 重渲染与流式追加、真实锚点动画（宿主逐帧写 `scrollTop`，`宿主/dsh-client-ui-chat/lib/client.js:2015`）、真实 `hasMore`/`loadingOlder`/`error` 按钮、第二个滚动容器、真实 `data-conversation-session`、hero/settling 相位、主题 token、`--dsh-chat-content-width` 被 `.wSkVaW_body` 遮蔽（`宿主/dsh-client-ui-conversation/lib/client.js:17325`）、HMR 真实时序、真实字体/代码块高度 |
| 真实 DSH + CDP | 上面全部、加 HMR、卸载、缩放、子智能体右栏并发、真实分页与锚点、性能 | 长期稳定性（小时级）、本机没有的内容类型（sticky/宽表/大图）、其它浏览器与机器、CI 里跑（需要活实例和 token） |
| 手工验收 | 手感（接缝"看着不动"）、只读感（复制模式"看着不能点"）、暗色/缩放/拖宽后的观感 | 一切可量化项；不能替代前两层 |

### 2.2 0.1.x 现有测试的两个已知盲区

**盲区 1：只有一个 `[data-conversation-scroll]`。** `[已证实]`
`仓库/harness/index.html:35-37` 只有一个 `.scrollBody[data-conversation-scroll]`，整份沙盒也只有一个 flow。而真实页面打开子智能体右栏时会有第二个：`宿主/dsh-client-ui-subagent/lib/client.js:794` 用 `variant: "embedded"` 渲染同一个会话内容根，`:805` 的 `[data-sidebar-chat]` 就是入口，内容根同样带 `data-conversation-session` 与 `data-conversation-scroll`（`宿主/dsh-client-ui-conversation/lib/client.js:17866,17871`）。
后果：`mainScroller()` 的行数启发式、模块级 `lastState`（`:124`）、`appliedFlows`/`lastFlow`（`:199-201`）、滚到顶代点（`:399-412` 只绑一个 `scrollHost`）在双容器下**一条都没被测过**；现有 9 条 state-tests 里 T3/T3b 测的是"同一页面里的多个 flow"（T3b 那个还在容器外），不是"多个滚动容器"。

**盲区 2：没有 null/hero 用例。** `[已证实]`
沙盒永远有行、有宽高的 flow，`findParts()` 永远走 `active` 分支；`none` 与空 flow 路径在沙盒里是死代码。真实环境里 none 只被 `state-tests.mjs` 的 T2（点 New Session，`仓库/harness/state-tests.mjs:255-266`）覆盖过一次。而 hero 有两种：`sessionId` 缺省时内容根不渲染 Views（无 flow），`sessionId` 存在但会话为 blank 时 `phase = "hero"` 仍渲染 Views，可能产生 0 行 flow（这正对应 `docs/testing.md:245-247` 抓到的"hero 空面板面积比主会话大"）。0.2 要在 none/hero 上建/拆 ctx，这段是**新代码**，现有测试覆盖率为零。

### 2.3 沙盒必须先补的保真项（0.2 的 P0 前置）

1. 把 `.column` 与 `[data-chat-flow]` 合成**同一个元素**（今天分成两层，`:16-18`；宿主是一层，`宿主/dsh-client-ui-chat/lib/client.js:2679,2886`）。不修的话沙盒永远测不到"放开 920px 上限"和真实列宽。
2. 加 `[data-conversation-content][data-conversation-session]` 包装，并做 `?threads=2` 双容器（第二个容器不同 sid）。
3. 加 `?phase=hero` / `?phase=blank` / 空 flow 变体，以及 `loading/error/hasMore` 三态按钮。
4. 加 `[data-chat-turn-spacer]` 与 `data-chat-motion` / `data-chat-following-tail` 属性（宿主真实存在，`宿主/dsh-client-ui-chat/lib/client.js:2679,2879`），否则无缝与锚点相关的分支测不到。
5. 修完先跑一遍 0.1.4 的 R0–R4，必须仍 5/5（证明改动没改变语义）。

### 2.4 0.2 新增关键用例（前置 / 动作 / 断言）

> `S` = 沙盒，`R` = 真实 DSH（CDP），`M` = 手工；每条只在对应层执行。

| ID | 前置 | 动作 | 断言 |
|---|---|---|---|
| S1 双容器隔离 | 沙盒双容器：A=报纸 2 列、B=无缝，行数不同 | 分别 set 模式；A 滚 200px | A 有 `column-count:2`；B 无 columnCount 且 `data-dshcMode="seamless"`；B 的滚动不改 A 的 `scrollTop`（±0）；徽标 1 个且只反映 active |
| S2 同 sid 双容器 | 两个容器同为 `session="X"` | 改 A 的模式后切走再切回 | 两个 runtime ctx 独立（B 不被改）；持久化表里 X 只有 1 条 |
| S3 无 sid / hero | 去掉 sid，flow 无行 | 触发 layout | `state="none"`；无 flow 套列；localStorage 无 anon 键；徽标仍在 |
| S4 sid 迟到升级 | anon ctx 存在，用户已改 cols=3 | 补上 `session="Y"` 再 layout | ctx key 变 `s:Y`；cols 仍为 3；持久化出现 Y 且值为 3（不被默认值覆盖） |
| S5 历史单源 | 复制 3 栏 + 有 hasMore 的合成按钮（500ms 后 enabled） | 三栏各滚到顶一次 | 按钮 click 总次数 == 1；三栏行数同步增长；`phase: idle→loading→complete`；无第二次点击 |
| S6 历史错误可恢复 | 点击后行数不增（模拟 error） | 滚到顶 5 次 | click ≤ 3（退避上限）；`phase="error"` 且有可点重试；重试 1 次后不再自动循环 |
| S7 副本不污染宿主选择器 | 复制模式渲染完成 | 遍历副本根 | 副本内 `[data-chat-flow],[data-chat-flow-key],[data-chat-anchor-key],[data-conversation-scroll]` 命中 **0**；`mainScroller()` 行计数与渲染前一致 |
| S8 副本只读 | 复制 3 栏 | 合成 click 副本内按钮/链接；Tab 遍历 | 副本内可聚焦元素 0（或全在 `inert` 容器内）；宿主事件监听计数 0；副本有可见只读标记 |
| S9 无缝几何对照 | 合成 flow，行高已知，视口 H=1000 | scrollTop 0→max 分 300 步 | 每步"屏幕 y 处应是哪一行"与 `elementFromPoint` 命中一致（≤1 行）；接缝 y ∈ [H-2, H]；插件写 scrollTop 次数 == 0 |
| S10 HMR 双线程 | 两线程各自套列/复制 | `new Function(src)()` 造新实例，再执行旧 disposer | 徽标/样式各 1；两线程布局都在且归属新实例；旧 disposer 不删任何新状态；`data-dshcThread` 与两个容器对得上 |
| S11 视口高变化 | 无缝模式，接缝在底 | 高 1000→800→1000 | 重切段后接缝仍 ∈ [H-2,H]；不出现空白列；当前阅读锚点行位移 ≤ 4px |
| R1 真机侧栏共存（**不排版**） | 247 行主会话 + 打开子智能体右栏 chat | 主会话报纸 3 列；对右栏做一次滚动与点击 | 右栏**无列、无 `dshc-*` 痕迹、无 history 请求**；主会话保持 3 列不被抢占；两容器 `data-dshcThread` 不同；in-flight ≤ 1 |
| R2 真机锚点 | 有 hasMore 的会话 | 滚轮到顶触发一批加载 | 报纸：`scrollHeight` 增量与 `scrollTop` 增量差 ≤ 2px，锚点行 `top` 差 ≤ 2px；无缝：锚点行差 ≤ 4px，连 3 批累计 ≤ 8px |
| R3 真机无缝连续性 | 无缝 + 可滚 3 屏 | CDP 合成 60 次 wheel（120px/次），逐帧采接缝 y | 接缝 y 的 p95 偏差 ≤ 4px；`scrollTop` 单调；到底部时 `[data-chat-following-tail]` 行为与单列基线一致 |
| R4 真机复制性能 | 247 行，复制 3 栏 | 渲染 + 单栏滚 500 帧 | 首帧 ≤ 300ms；长任务（>50ms）0 个；DOM 节点 ≤ 3× 源；堆增量 ≤ 80MB `[假设：阈值待实测校准]` |
| R5 真机 HMR ×5 | 两线程 + 复制开启 | `touch` client.js 5 次，各等 1.5s | 每次徽标/样式各 1；rootOwner 唯一且每轮更新；布局不丢不重；副本不叠加 |
| R6 真机卸载 | 复制 3 栏 + 无缝接缝元素都在 | 从 bundles 移除 | 副本 0、`inert` 0、flow 的 columnCount/transform/spacer 全清、`display` 回 `flex`、`data-dshc*` 全清、API undefined |
| M1 手感 | 无缝，真实长会话 | 慢/快滚各 10 秒 | 无跳、无闪、无"被拽回"；接缝始终贴在视口底部附近 |
| M2 只读感 | 复制 | 尝试点副本里的按钮、复制代码 | 外观明确不可交互；误点无副作用；代码可选中复制 |
| M3 外观回归 | 三模式 | 暗色、80/125% 缩放、拖宽侧栏 | 三种模式都重排正确，无横向溢出 |

### 2.5 负向对照（照抄 0.1.4 的做法）

`docs/testing.md:316-320` 的负向对照是这套测试里唯一能证明"用例不是恒真"的东西，0.2 每条关键断言都要配一个"撤掉修复"的临时副本，并且**只在系统临时目录改，不动仓库**：

- S1/S2：把 registry 的 key 改成常量 → S1 必须 FAIL。
- S5/S6：去掉防重入 → S5 的 click 次数必须 > 1。
- S7：让副本带上 `data-chat-flow-key` → S7 必须 FAIL（顺带证明行数统计会被污染）。
- S9：改成"每帧写 scrollTop"的朴素实现 → S9 的"写 0 次"与接缝断言必须 FAIL。
- S10：去掉 `ownsRoot()` / 实例 token → S10 必须 FAIL（对应今天 R3 的负向对照）。

没有负向对照的断言，评审时按"未验证"处理。

## 3. 分阶段验收标准

| 阶段 | 算完成（可测量） | 过不了就退回 |
|---|---|---|
| **P0 架构** | 七模块落地，策略接口可替换；**行为零变化**：0.1.4 的 9 条 state-tests 与 5 条 targeted 全过；1389/1289/813px → 3/2/1 列；atomic 行数与基线差 ≤ 1；插件写 `scrollTop` 次数 == 0；无新增 JS 异常 | 任何一条 0.1.4 用例回归 → 不"边修边迁"，回滚到单文件，重构重来 |
| **P1 无缝原型** | 只在沙盒：S9 全过；接缝 y 恒 ∈ [H-2,H]；300 步内模型/DOM 命中一致 ≤1 行；**布局计算耗时 p95 ≤ 8ms**、**帧间隔 p95 ≤ 33.3ms**（两个数分开记）；**插件写 `scrollTop` == 0**（宿主写入单独归因） | 若"精确映射"必须写 `scrollTop` → 停，回去改方案（换 `column-fill:auto` + `translate` 或横向 `scrollLeft`），不许先接管再补 |
| **P2 报纸迁移** | 0.1.4 全绿 + S1/S2/S3/S4/S10 全过；列底差 ≤ 列宽 1/4；两线程列数互不影响；卸载全清 | 出现任一状态污染（A 的列数跑到 B、旧 disposer 清掉新实例）→ 回滚到 0.1.4 客户端，0.2 不合并 |
| **P3 复制** | S7/S8 全过；文本保真 ≥ 99.5%（空白归一后逐块比）；副本可聚焦元素 0；247 行三栏首帧 ≤ 300ms；节点 ≤ 3×；单栏滚动长任务 0 个；历史 click == 1/批 | 节点 > 4× 或首帧 > 300ms → 降级为最多 2 栏；保真 < 95% → 砍掉 C，只发 A+B |
| **P4 无缝完整** | R3 + S11 + R2（无缝）全过：接缝 p95 ≤ 4px，单帧位移 ≤ 8px，连 3 批锚点累计 ≤ 8px；到底跟随尾部的行为与单列一致；自动加载只由真实手势触发 | 连续 3 次真机跑出现 > 12px 跳变，或锚点漂移 > 4px → 冻结 B，0.2 只发 A+C，B 挂 flag 并标 experimental |
| **P5 历史加载** | S5/S6 + R1 + R2 全过；单飞（in-flight ≤ 1）；同批不重复点击（1.5s 内 ≤ 1）；进度/complete/error 可观测（DOM 上有 `data-dshcHistory`）；错误 ≤ 3 次退避后停并可重试；一键加载全部能跑完且有进度；**各模式默认值不覆盖用户显式偏好**（设报纸关自动加载 → 切模式 → 刷新，仍关） | 出现重复请求、无上限重试、或死循环 → 这是正确性问题，不发版，不靠"概率低"放过 |

### 3.1 性能指标口径（三个数不许混用）

| 数 | 含义 | 用途 |
|---|---|---|
| **8ms** | 插件**自己的布局计算耗时**（rAF 内重排前/后的 `performance.now()` 差）p95 | P1 硬门槛 |
| **16.7ms** | 60Hz 下一个完整帧的时间预算 | **只作参考基准**，不作门槛 |
| **33.3ms** | P1 原型阶段可接受的**帧间隔**上限 | P1 门槛；达到它**不等于**达到 60fps |
| **100ms** | 长任务阈值（`longtask`） | 出现即触发 §4 改判 |

接缝偏差：**普通内容 p95 ≤ 0.1H**；不可断元素（图片/宽表/长代码块）单独统计，
允许偏差 ≤ 该元素自身高度，由 T10 专项验。内容守恒误差 ≤ **2px**（CSS 像素，避免中间步骤取整）。

阶段顺序是先 P1 后 P2：无缝是唯一会逼着改架构的（滚动映射），报纸是已验证的迁移；先做报纸会让架构"看起来能行"，到无缝再推翻。

## 4. 五项最大技术风险

五项都是 `[风险]`。按「触发概率 × 影响」粗排：**K1 > K3 > K4 > K2 > K5**；K1/K3 任一发生都是用户可见的阅读中断，所以它们决定发版与否，不是打磨项。

### K1 · 无缝模式的滚动重映射

- **风险**：接缝固定 = 内容位置必须由插件自己表达（切段 + 平移），但滚动量由宿主独占。插件若写 `scrollTop`，会和宿主的逐帧动画互相覆盖。
- **触发**：宿主"加载更早"期间逐帧写 `elements.scroller.scrollTop = top`（`宿主/dsh-client-ui-chat/lib/client.js:2015`，另见 `:2040`、`:2057`、`:2418`）；它还用 `elements.column.offsetHeight` 当内容总高做分页几何（`:1947`），并用 `drift = scrollTop - written` 自纠（`:1995`）。插件只要改了 flow 的几何或写了 scrollTop，这三个量全失真。
- **影响**：抖动/被拽回、锚点丢失、`hasMore` 反复触发、用户读到一半跳走；最坏情况是把宿主的 `followingTail` 状态打坏，新消息不再跟随。
- **验证**：在 CDP 里给 `Element.prototype.scrollTop` 装 setter 计数（记录写入者 stack），跑 60 次 wheel + 一次真实加载更早；同时逐帧采接缝 y 与锚点行 `top`。断言：插件写入 0 次、接缝 p95 ≤ 4px、锚点差 ≤ 4px。
- **缓解**：P1 先做"只读映射"（`transform` 由 `scrollTop` 推导，绝不回写）；检测宿主分页窗口（`[data-chat-motion]`、`[data-input-fold]`、按钮 `disabled`）期间冻结重排；给"万一必须接管"留一条独立策略接口，但默认不启用，且要有 §2.5 的负向对照证明替换可行。

### K2 · 复制模式的保真与性能

- **风险**：复制模式只能渲染静态副本，保真靠 DOM 序列化，成本随会话线性涨；而"看起来能点其实不能"是产品风险，不只是技术风险。
- **触发**：247 行 × 3 份、代码块/图片/工具调用卡片；流式输出时源 DOM 每帧变；源里含 canvas/iframe/受保护资源。
- **影响**：首屏卡顿、内存翻倍、副本过期（与源不一致）、用户点空按钮以为插件坏了；更隐蔽的是**副本如果带 `data-chat-*` 属性会污染宿主与插件自己的选择器**（`mainScroller()` 按 `[data-chat-flow] [data-chat-flow-key]` 数行，`仓库/lib/client.js:136`）。
- **验证**：R4 + S7 + S8；另加一次"渲染后追加 3 行"的一致性检查（副本必须只增量追加，不整棵重绘）。
- **缓解**：只序列化白名单结构（文本、标题、列表、代码、表格、图片、链接），不复制事件与 `data-chat-*`；副本容器整体 `inert` + `aria-hidden` + 可见"只读"标记；按栏懒渲染（离屏栏只占位）；超预算降级栏数（3→2）；用 `snapshotKey`（行数 + 末尾 key 的哈希）判断是否需要重建。

### K3 · 历史加载风暴

- **风险**：自动加载 + 宿主锚点补偿 + 用户停在顶部 = 一次滚动触发一串翻页，错误时还能无限重试。
- **触发**：宿主加载时写 `scrollTop` 把位置拉回顶部附近（`scrollTop` 增量 ≈ 内容增量，`docs/testing.md:189-195` 实测 +1183）；插件监听 `scroll` 且判据是 `scrollTop <= 24`（`仓库/lib/client.js:402`）；多栏复制若各自触发；宿主 error 后按钮仍在。
- **影响**：重复请求/服务端压力、位置连续跳动、错误死循环、`hasMore` 提前耗尽。
- **验证**：S5/S6 + R1；真机上给按钮 `click` 装计数，用户停在顶部 30 秒，统计 click 次数与请求批次数；错误路径注入（把按钮换成永不增行的版本）。
- **缓解**：每线程一个 HistoryController 状态机（idle/loading/complete/error）+ 单飞 + 冷却（沿用 1500ms）+ 只在真实手势后 3 秒内 + 每批后校验（行数必须增长、锚点漂移 ≤ 阈值，否则转 error 并停）+ 指数退避最多 3 次 + 显式错误 UI 与手动重试；复制模式的三栏共享同一个 controller，不各自点。

### K4 · 多容器/多线程状态污染

- **风险**：0.1.4 的状态是模块级 + `<html>` 全局；第二个滚动容器出现时互相改。
- **触发**：打开子智能体右栏 chat（`宿主/dsh-client-ui-subagent/lib/client.js:794,805`）；主会话切到小会话而右栏行数更多；复制模式的副本节点被选择器数进去。
- **影响**：排错线程、列数来回跳、一个线程的 disposer 清掉另一个线程的 flow、徽标显示错的数字；这些在单容器测试里全部恒真通过（见 §2.2）。
- **验证**：S1/S2/S7 + R1 + R5；关键对照组：把右栏做得比主会话行数更多，看主会话是否被抢（今天 `mainScroller()` 按行数裁决，`仓库/lib/client.js:131-145`，这一组大概率直接暴露问题，需实测确认）。
- **缓解**：状态全部进 ThreadContext，模块级只留常量与不可变配置；`active()` 用最后交互而不是行数；每次 DOM 写入带实例 token（沿用 `data-dshcOwner`，扩到容器级 `data-dshcThread`）；释放只释放自己 token 的节点；任何"全文档查询"只用于发现容器，不用于写状态。

### K5 · HMR 与实例归属

- **风险**：热更新时新实例 apply 早于旧实例 disposer 是已实测的竞态（`docs/testing.md:275-278`）；0.2 的状态从"根节点 4 个属性"扩到"每线程一份"，旧 disposer 能破坏的面变大。
- **触发**：`touch lib/client.js`（约 500ms 热替换）；两个线程同时活着；复制模式有 `inert` 容器；旧实例的 rAF/observer 在新实例 apply 之后才跑。
- **影响**：徽标/样式重复、列被清空、副本叠加、`inert` 残留在宿主节点上（这个最糟：会让宿主自己的按钮点不动）、偏好被旧实例的默认值覆盖。
- **验证**：S10 + R5（连续 5 次热更，看是否单调增长）+ R6；每次热更后比对 `data-dshcRootOwner` 与两个容器的 `data-dshcThread`。
- **缓解**：apply 抢占归属（现有做法）；所有写入先过 `ownsRoot()`/`owns(flow)`；**`inert` 只加在插件自己创建的容器上，且 disposer 幂等**；registry 可从 DOM（`data-dshcThread`）重建，不依赖内存；apply 幂等（重复 apply 不叠加）；版本号写进根属性，便于观测旧实例是否还在写。

## 5. 一句话：0.2.0 什么时候允许发版

**只有当 P0–P5 的量化标准全部在真实 DSH 上通过——尤其无缝模式在 247 行 `hasMore` 会话上连续 3 次运行接缝 p95 ≤ 4px、无 >8px 位置跳变，历史加载零重复请求且错误可停，主会话 + 子智能体右栏两个线程互不污染，HMR 与卸载零残留——才允许发 0.2.0；任何一项不达标就降级发布（只发报纸 + 复制，无缝挂 experimental flag）或推迟，不用"概率低""用户遇不到"换发版。**

## 6. 本节的开放问题

1. `active()` 用"最后交互"替代"行数最多"，首次交互前是否会出现可感知的错选？需要 R1 实测（先开右栏再看主会话、以及相反顺序）。
2. 每会话记忆 mode/cols 的收益是否值得多一个存储槽？若维护方倾向"全局一套偏好"，ThreadContext 仍按容器分片，只是不自带持久化——设计上留了这条退路。
3. 复制模式三栏共享一个 HistoryController 时，"一栏滚到顶触发加载"会不会让另外两栏正在读的位置被追加内容推走？`[假设]` 会，但推走量等于增长量，需要 R4 实测确认可接受。
4. 无缝模式的视口高变化（拖窗口/开侧栏）会导致整段重切；重切时"当前阅读锚点"能否稳定到行级？S11 只给了 4px 阈值，行级锚定是否足够还没验证。
5. 宿主 `[data-slot="main.conversation"]` 是否真实存在于 DOM（宿主自己的 CSS 用 `[data-slot=conversation.session]` 选择，`宿主/dsh-client-ui-conversation/lib/client.js:17325`，说明 slot 会带该属性）？如果存在，认主会话可以更硬；未核实，所以 0.2 不依赖它。

## 7. 本节的结论清单

1. ThreadContext 的分片单位是**滚动容器元素**，会话 id 只作持久化键；无 id 走 `anon`，不落盘，id 迟到时就地升级。
2. 0.2 做**按容器分片的状态 + 单线程激活**：只有 `active()` 被排版/加载，其它线程只保证不互相污染。
3. 线程内只存四样：mode、cols、copy 布局、history 运行时状态；滚动位置不存（宿主负责），历史进度永不持久化。
4. 明确不做：并发排版、隐藏会话预热、依赖宿主会话服务、跨标签同步、元素级状态。
5. 测试三层分工固定；0.1.x 的两个盲区（单容器、无 null/hero）必须在 0.2 的沙盒里补上，否则新代码等于无测试。
6. 沙盒还有一处保真缺陷要先修：`[data-chat-flow]` 必须自己就是 `max-width` 元素，不能套一层。
7. 每阶段都有量化"算完成"和"过不了就退回"；P1 先于 P2，因为无缝是唯一会推翻架构的。
8. 0.2.0 的发版条件是 P0–P5 全过 + 双线程/历史单源/HMR 零回归，不是"三种模式都能开"。
