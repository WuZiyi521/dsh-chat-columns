# 05 · 复制模式（C）：只读对照栏

> 范围：只写复制模式。A 报纸 / B 无缝、HistoryController 全文、总模块图不在本文。
> 标记：`[已证实]` 附文件:行号；`[已实测]` 维护方在真实页面上量过；`[假设]` 未实测，附验证方法；`[风险]`。
> 基线：插件 0.1.4，宿主 DSH 0.2.1-rc.2。

## 0. 结论（先给）

1. **内容来源选 (c)：直读客户端会话装配数据**（`ctx.get("uiConversation")` 的 chat target + `ctx.get("sessions")`），**不是**深克隆 DOM，也**不是**从 DOM 抽快照。硬理由是完整性：(a)(b) 的数据源都是宿主的**渲染输出**，折叠 / 隐藏 / 截断过的内容拿不回来（§2.2、§2.3）。数据源探测失败时降级到 DOM 快照，并**在 UI 上标注"可能缺内容"**（§2.4）。
2. **宿主只当"分页引擎 + 隐形画布"**：不搬、不克隆、不动宿主 React 节点；C 模式给宿主 `visibility:hidden`（布局保留）＋ 底部输入区重新可见，插件在 body 上叠一个自己的容器渲染 N 个只读栏。
3. **一份内容模型、N 个视图**：历史只有一个入口（HistoryController），副本只报告"我触顶了"和"我的锚点在哪"。
4. **对 BRIEF §2 的两条前提要修正**（§1.1）：客户端有可用的会话数据服务；11 个种子模块里已含 `@deepseek-ai/dsh-client-ui-primitives`（`MarkdownText`/`JsonBlock`），插件可以直接拿宿主排版件。

## 1. 事实基础

### 1.1 需要修正的两条前提

- BRIEF §2 说"插件拿不到会话数据、require 只有 react 等 11 个"。**11 个种子模块的清单**是
  `react`、`react/jsx-runtime`、`react-dom`、`react-dom/client`、`@deepseek-ai/cordis`、`zod`、
  `@tanstack/react-virtual`、`@deepseek-ai/dsh-client-store`、`@deepseek-ai/dsh-client-ui-slots`、
  `@deepseek-ai/dsh-client-ui-primitives`、`@deepseek-ai/dsh-client-ui-dockkit`
  `[已证实]`（`dsh-web-frontend/dist/assets/index-CN7NIWNw.js` 的 `staticModules` 表；`require` 语义见
  `dsh-client-modules/lib/client.js:831-840`）。**插件本来就能用宿主 UI 原语**，这条对 C 的渲染保真很关键：
  宿主自己渲染助手正文用的就是 `MarkdownText`（`dsh-client-ui-chat/lib/client.js:6272`）。
- 客户端会话数据可通过 **cordis 服务**取到，不靠 `require`：`[已实测]` 第三方插件 `apply(ctx)` 拿到的是 cordis
  Context，**不需要 `inject`**，`ctx.get("sessions")` 直接可用——能读 `session.getSnapshot()` 的
  `hasMore / loadingOlder / openState`、`eventSource` 的全量事件，以及
  `ctx.get("uiConversation").binding(id).target("chat")` 的节点模型 `{order, nodes, locations, timeline}`。
  服务与类型见 `dsh-client-ui-conversation/lib/types/client/index.d.ts:50-57`；宿主自己的包也这么取：
  同文件 `client.js:4962` 取 `sessions`、`:4976` 取 `uiConversation`、`:19485` 取 `conversation`。
- **踩坑记录**：只能 `ctx.get("…")`。`ctx.sessions` / `ctx.uiConversation` 这种属性访问会抛错（属性未在
  `props` 里声明，`cordis/lib/index.js` 的 Proxy `get` 分支直接拒），只有 `inject` 里声明过的名字才能点号访问。
- `[风险]` 这是宿主**内部**服务，不是对外插件契约：跨 minor 版本可能改名或消失。风险等级评**中**——
  feature-detect 一次就能发现、有明确降级路径（§2.4）、不会静默出错。隔离在一个适配器里（§7）。
- 所以 BRIEF 那句"插件只能读 DOM"只对 **Agent（服务端）侧数据**成立；浏览器侧已有一份完整装配结果。

### 1.2 支撑设计的事实

| # | 事实 | 证据 | 对 C 的后果 |
|---|---|---|---|
| F1 | 每行带 `data-chat-flow-key` / `data-chat-node-key` / `data-chat-flow-kind` / `data-chat-turn` | `dsh-client-ui-chat/lib/client.js:3806-3811` | 行有稳定身份；数据侧 key 与 DOM 行可一一对应 |
| F2 | 会话 id 写在 DOM：`[data-conversation-content][data-conversation-session]` | `dsh-client-ui-conversation/lib/client.js:17866` | 从 DOM 拿 sessionId，再换数据层的 binding，无需猜（数据侧没有"当前选中会话"这个概念，`sessions.list` 只有目录，导航归 view owner） |
| F3 | 聊天流**不做虚拟化**，`order.map` 全量出行 | `dsh-client-ui-chat/lib/client.js:2747` | 宿主 DOM 行数 = 已加载节点数（长会话 DOM 已经很重） |
| F4 | 行会被 `hidden` / `hidden="until-found"` 摘掉 | `.../chat/lib/client.js:1273, 1723-1724`；查询侧 `:not([hidden])` 见 `:2194, 2262` | DOM 里有"看不见但存在"的行，克隆/抽取都会继承这层遮挡 |
| F5 | `JsonBlock` 折叠时**不渲染 payload**，展开也截断在 20000 字符 | `dsh-web-frontend/.../index-CN7NIWNw.js` 内 `JsonBlock` 实现（`truncatedLabel` / `q8=2e4`）；使用点 `.../chat/lib/client.js:3818, 4499, 5546, 6313` | **DOM 不是完整内容**：未知节点/未知块的正文在折叠态根本不存在 |
| F6 | chat target 快照 `ChatSnapshot = {order, nodes, locations, navigation, timeline, legacy}`，`legacy.nodes` 是全量 `ConversationNode`，`legacy.partial` 是流式前缀 | `dsh-client-ui-chat/lib/types/client/contract/snapshot.d.ts:95-110`；`records.d.ts:27-53, 297-301` | 数据层一份按 key 的有序模型 + 流式增量，正好是 C 要的形状 |
| F7 | `ctx.get("uiConversation").binding(id).target("chat")` 返回 `ObservableSnapshot<ChatSnapshot>` | `dsh-client-ui-conversation/lib/types/client/conversation/assembly.d.ts:35-47`；`[已实测]` 可取到（§1.1） | 订阅即得增量，不需要 MutationObserver |
| F8 | `SessionFace.loadOlder()`；`hasMore` / `loadingOlder` 在会话快照里 | `dsh-api-session-controller/lib/types/client/contract/session.d.ts:121-128`；`contract/snapshot.d.ts:58-72`（`OpenState = cold\|loading\|open\|error` 见 `:51`） | 程序化翻页 + 确定性状态，不必再点 DOM 按钮 |
| F9 | 审批卡注入在 **composer** 槽，不在消息流 | `dsh-client-ui-approval/lib/client.js:343-356`（`ctx.slots.inject("conversation.composer", …)`） | C 模式只要保留 composer，审批就不会被"只读化"掉 |
| F10 | 滚到顶自动加载在 0.1.x 靠"3 秒内有过用户手势"防误触发，因为宿主会程序化写 `scrollTop` | `lib/client.js:396-412`；README:251-252 | C 模式所有 `scrollTop` 都是插件自己写的，**不需要**这套启发式，见 §6 |
| F11 | 宿主在跟随尾部时自己关掉原生滚动锚定：`[data-conversation-scroll]:has(...){overflow-anchor:none}` | `.../chat/lib/client.js:2679`（CSS 常量） | 副本栏同样要 `overflow-anchor:none` 并自算锚点，别指望浏览器 |
| F12 | 输入区高度用 CSS 变量挂在滚动容器上：`--dsh-composer-height`、`--dsh-conversation-viewport-height` | `.../conversation/lib/client.js:17756-17766` | C 的覆盖层几何可以直接读这两个变量，不用量 composer |
| F13 | 真实页面在**右栏子智能体**打开时有两个 `[data-conversation-scroll]`（主会话 + embedded）；主会话判据是 `closest('[data-slot="main"]')` | `[已实测]`（维护方）；布局侧支持：root slot 名 `main` 见 `dsh-client-ui-layout/lib/client.js:119, 631` | **C 不许再用 0.1.4 的"行数/面积猜主会话"**——猜错就是把子智能体会话当主会话，或者反过来。判据换成主面板槽（§6.1） |

## 2. 内容来源三选一

### 2.1 六轴对照

| 轴 | (a) 深克隆 DOM 后只读化 | (b) 从 DOM 抽文本/结构快照自渲染 | (c) 直读会话数据自渲染 |
|---|---|---|---|
| **保真** | 视觉最高，但只保"**此刻的渲染态**"：隐藏行仍隐藏、折叠的 JSON 无正文、20k 截断、宿主"工作详情"折叠档位被固化（F4/F5）。且视觉上是宿主的皮，容易让人以为能点 | 取决于抽取粒度。纯文本丢代码块/表格/公式/图片；带标记就是把宿主渲染结果反解析成 AST。**同样继承 F4/F5 的丢失**——抽取只能拿到 DOM 里有的 | 内容层面最全（`ConversationNode` 是宿主渲染的**输入**：完整 `text`/`argsRaw`/结果/usage/timing）。呈现层面用 `MarkdownText` 可对齐宿主排版；工具卡/审批卡只做静态简化（这正是 C 的产品定义） |
| **交互失效范围** | 全部失效（`cloneNode` 不复制监听与 expando）：发送/停止/重试/审批/展开/复制代码/灯箱/跳转/开文件。但 `<a href>` 的默认导航、`input` 的聚焦输入、CSS 的 `:hover`/`cursor:pointer` 都是**浏览器行为**，不随 React 一起失效——要么逐个删（黑名单），要么整体 `inert`（连带禁掉文本选择与 Ctrl+F）。结果就是"**看起来全都能点**" | 由自己渲染，天然没有控件；但需要显式决定链接/代码复制怎么办 | 由自己渲染，**逐元素可控**，无黑名单漏项 |
| **增量更新** | MutationObserver 反推"哪一行变了" → 重新 clone 该行。流式期间每帧一次克隆；克隆把"正在流式"的动效冻住 | MutationObserver → 重新抽取该行 → 重建快照 → 重渲染。每次都要把文本再解析一遍才能 diff | 订阅即得 upsert（F6/F7）；`partial` 直接给流式前缀；变化边界就是 node key |
| **长会话性能（200+ 行）** | 首屏 clone 成本 ≈ 宿主渲染成本 ×N；每次更新都要浏览器重新解析/样式重算克隆体 | 首屏 200 次 `outerHTML`+清洗，`[假设]` 几十 ms 量级；每个 token 都要清洗一次 | 只有变化项重渲染（memo + 稳定 key）；首屏是唯一热点，用 `content-visibility:auto` 压（§6.4） |
| **内存** | N 份完整 DOM 常驻 + 宿主一份 = (N+1) 份；图片 blob 复用，但懒加载的 IntersectionObserver 不作用于克隆，可能空白 `[假设]` | N 份快照字符串 + N 份渲染 DOM | 一份内容模型（文本共享）+ N 份渲染 DOM，字符串不翻倍 |
| **失败模式** | 宿主 DOM 结构/类名一变，只读化规则静默失配（漏删按钮）；重复 `id` 破坏 a11y 与 find-in-page；克隆体被当成可交互 | 抽取规则与宿主渲染细节耦合（哈希类名、slot 注入的自定义节点），宿主一改就**静默少内容**，很难断言"完整" | 服务/目标不存在 → **降级到 DOM 快照并标注"可能缺内容"**（§2.4），不静默降级；私有 API 无版本承诺；未映射的 node kind 必须显式占位 |

### 2.2 推荐 (c)，三条硬理由

1. **完整性不可协商**。需求写的是"每栏显示同一会话**完整内容**"。F5 已经证明 DOM 里有一类内容**根本不渲染**（折叠的 JsonBlock 正文），F4 证明有整行被 `hidden` 掉；(a)(b) 无论怎么写都补不回来，只能拿到"宿主这次渲染吐出来的东西"。数据层（F6）是唯一完整源。
2. **依赖方向**。(c) 依赖宿主的**输入**（事件 → ConversationNode 的装配契约，有 `.d.ts`）；(b) 依赖宿主的**输出**（DOM 结构与渲染细节）。前者是数据契约，后者是逆向工程，后者随宿主改版碎裂的概率高一个量级，且碎的时候是静默的。
3. **增量边界现成**。流式输出在 DOM 里表现为"某行文本变了"，要反推就得每帧解析；(c) 里变化边界就是 `node key` + `partial`，upsert 是免费的。这一条直接决定 C 能不能在流式时保持三个栏都不抖。

### 2.3 不推荐 (a) 的另一个理由：只读化是黑名单

即使接受"副本不可交互"，(a) 的安全性靠"逐个删掉能点的东西"，宿主每加一个控件（新审批样式、新工具卡的按钮、新的行内操作）就漏一个，且漏了没人会发现。C 的只读保证应该是**白名单**：我们只渲染已知的只读节点类型，未知类型渲染成显式占位。这条只有 (b)/(c) 能做到，(c) 做得更干净。

### 2.4 拿不到数据时怎么办：降级到 DOM 快照（明说它不完整）

- **首选路径**已实测可用（§1.1）。降级只为"下一次宿主改版"准备：数据源探测失败 → 换 `DomSnapshotSource`，
  它产出的还是**同一个 `ContentModel`**（`ContentItem[]`），所以只多一个**通用行渲染器**，不是第二套渲染器。
  - 逐行按 `[data-chat-flow-key]` 收集，`kind` 取 `data-chat-flow-kind`，内容取该行文本（或白名单标签的
    sanitized HTML，保留代码块/表格/列表）。
  - 三处已知不完整，**必须在 UI 上明说**：折叠的 `JsonBlock` 没有正文（F5）、被 `hidden` 的行可能缺（F4）、
    超过 20000 字符的 JSON 被截断。
  - 栏头标签变成 `只读副本（降级快照）`，进入横幅写"当前宿主版本拿不到会话数据，副本可能缺内容"。
  - **翻页也一起降级**：拿不到 `session.loadOlder()`，只能点主 flow 里的「加载更早」按钮（0.1.x 已验证的路径，
    `lib/client.js:332-412`），`hasMore` 用"按钮是否存在"近似、`loadingOlder` 用 `button.disabled` 近似。
  - 判据：宁可承认降级，也不要把"可能缺内容"包装成"完整内容"——需求第一条就是完整。
- 若 `chat` target 的 `order` 与 `nodes` 在长会话上不同步（只在 append 时同步、prepend 时不发通知），C 需要自建一层
  `key → node` 投影；这属于实现兜底，不改变选型。

## 3. 只读副本的禁用清单

原则：**白名单渲染**——只渲染 §3.1 列出的静态节点类型；动作型内容一律降级成静态块，块内**没有**任何宿主控件。

### 3.1 逐类处理

| 宿主元素 | 副本处理 | 理由 |
|---|---|---|
| 按钮 / `role=button` / 可点卡片（重试、停止、展开思考、回合跳转、fork、反馈、灯箱） | **不渲染**。数据里它们不是节点，是渲染器的产物；我们的渲染器不输出 `button` | 白名单的天然结果 |
| 审批卡 | 消息流里没有这种节点（F9 且 chat/conversation 的 node kind 无 approval/permission），审批整体在 composer。副本里只在相关工具节点上标一行静态说明「审批在下方输入区」。未来若出现审批类节点 → 静态块 + 「在原视图处理」 | 审批必须保持可操作，藏在副本里才是事故 |
| 代码复制 | **保留**，但用副本自己的按钮：`navigator.clipboard.writeText(codeEl.textContent)`。视觉上与宿主复制按钮不同，`title="副本操作：复制代码"` | 复制不改会话状态，是"读"的延伸；砍掉会让对照模式难用 |
| 链接 | 外链 `http(s)`：保留可点，强制 `target="_blank" rel="noopener noreferrer"`，并 `preventDefault` + `window.open`（避免 SPA 路由被顶掉）。内部引用（文件路径、mention、会话内锚点）：**纯文本 + title**，不给 href | 外链是"读"，内链要宿主服务，副本给不了就老实说 |
| 输入框 / textarea / contenteditable / select / 上传 / 拖放区 | **永不渲染**。排队输入（`pendingSubmissions` / steering）渲染成静态文本「（排队中）…」 | 假输入框比没有更糟 |
| 右键菜单 / 悬停工具条 / 选区工具条 | 不存在（我们自己的 DOM 没有这些） | — |
| 图片 | 用 `uiConversation.imageUrl(sessionId, attachment)` 取授权 URL 渲染 `<img>`；点开大图=不提供（0.3 再说） | 复用宿主同一份图片缓存，不额外请求 `[假设]`（URL 是缓存的） |

### 3.2 防"以为能点"

1. **栏头常驻标签**（sticky，滚动不消失）：`只读副本 1/3 · 第 12 轮`，右侧一个小锁图标。需求里的"明确标记不可交互"落在这一条上，不做一次性提示了事。
2. **进入模式一次性横幅**（可关，按会话记忆）：「副本里不能操作。审批、重试、发送请用下方输入区或切回原视图」，带「切回」按钮。
3. **降级块统一外观**：`.dshc-c-static`——灰底、无 hover、`cursor: default`、行首锁形图标。视觉上就不像按钮，比"禁用态按钮"更不容易误点（禁用态按钮看起来仍然像按钮）。
4. **误点兜底**：点在 `.dshc-c-static` 上 → 一次性 inline 提示「副本不可操作」+「切回原视图」；同一会话只提示一次。
5. **不用 `inert` 包副本正文**（会连文本选择、Ctrl+F、屏幕阅读器一起关掉）；只给副本容器 `role="region"` `aria-readonly="true"` `tabIndex=0`，让键盘能滚、能选、能复制。
6. **模式徽标**沿用 `.dshc-badge`，C 模式文案 `⧉ 只读 ×3`，与 A 的 `▥ n 列` 区分开。

## 4. 多副本共用一个历史源

### 4.1 机制

- **唯一加载者**：HistoryController。C 只调 `history.requestOlder(reason)`，永不直接 `loadOlder()`。
- **触发者**：任一栏 `scrollTop <= 24` 且**不是自写位移**（§6.2）→ `requestOlder("top-edge")`；「一键加载全部」按钮 → `history.loadAll()`。进入 C **不预加载全部**（见开放问题 1）。
- **加载量**：由宿主 `SessionFace.loadOlder()` 决定——"至少 50 条消息 + 2 个 turn 起点，单页上限 500 条，到历史尽头为止"（F8 的文档注释）。插件不自己定页大小。降级源（§2.4）下没有这个动词，页大小由宿主按钮那套逻辑决定，`hasMore` 用按钮存在与否近似。
- **什么时候停**：`hasMore === false`；用户关闭自动加载偏好；`loadAll` 到达预算（12 页 / 2000 行 / 20s）；错误后重试一次仍失败 → `error` 态等用户点重试；**无进展保护**：一批之后节点数没增加而 `hasMore` 仍为真 → 判死，停（0.1.x 的死循环教训）。
- **防重入**：Controller 内 single-flight；一批进行中收到的新请求合并成一个 pending 标记，批结束后再看"是否仍有栏在顶部"。
- **副本怎么同时更新**：所有栏读同一个 `ContentModel` 版本；一批 prepend 只产生**一次**模型提交，N 个视图在同一次 React commit 里重建行；锚点修正在 `useLayoutEffect` 里逐栏做（§6.3），对外表现为"三栏同时长高、同时不动"。

### 4.2 与 HistoryController 的职责边界

| 事 | HistoryController | C（LayoutStrategy） |
|---|---|---|
| 何时翻页 | 决定（单飞、预算、退避、取消） | 只上报"我触顶了" |
| 调 `loadOlder()` | 是，唯一调用点（经 `ConversationSource.loadOlder()`；降级源里它实现为代点按钮） | 否 |
| `hasMore`/`loadingOlder` | 读 `SessionSnapshot`（F8），对外发状态机 | 只读 `state` 画进度 |
| 每批后校验 | 节点数增长、`openState`/错误、无进展判死 | 逐栏校验"锚点 key 还在、位移已应用"，缺失则回退到顶部并记一次警告 |
| 失败恢复 | 重试一次 → error 态 + 「重试」；不自动死循环 | 显示错误条，不自行重试 |
| 取消 | 模式退出 / 会话切换 → `cancel()` | 卸载视图 |

## 5. 增量更新（新消息与流式）

| 事件 | 模型变更 | 各栏动作 |
|---|---|---|
| 新 turn 开始 / 新 user 消息 | `append(items, key)`，`contentVersion++` | 只有 `followTail` 的栏滚到底；其余栏的 `scrollTop` 不动（append 在下方，不产生位移） |
| 流式 token | 该 item `version++`（`partial` 前缀） | 该 item 若在某栏视口内则重渲染；不在则只标脏。节流：**rAF 合并**，另加 60ms 下限（≈16fps），跑满时丢中间态取最后一版 |
| 流式结束 / 工具结果落定 | 同 key 的 item 换成最终节点 | 同上；若该 item 在某栏**视口上方**且高度变了 → 该栏按锚点补偿（§6.3） |
| prepend 一批历史 | 头部插入 m 条，`contentVersion++` | 所有栏统一按"锚点 key 补偿"处理，见 §6.3 |
| compaction / 节点被替换 | 按 key upsert；key 消失则移除 | 锚点 key 消失的栏回退到"保持相对位置"（记住第 index 个可见行，按新 index 定位） |

- **全量重渲染否决**：每次 token 重建 N 棵树，200 行 × 3 栏会让输入框都卡。用"单 item 订阅 + `React.memo` + 稳定 key"。
- **不做 MutationObserver**：数据源本身是增量源，再观察 DOM 是双重真相。
- **滚动位置保持**：append 不需要补偿；**只有"变更项位于某栏视口之上"才补偿**，且只补偿受影响的栏——逐栏判断 `firstVisibleIndex` 与变更 index 的大小，避免每帧 N 次布局读取。
- **用户发送时的例外**：若发送/流式开始时没有任何栏处于 `followTail`，把"活动栏"（最后获得焦点或最后被滚动的栏）滚到底并置 `followTail`——否则用户发完消息看不到自己发的东西，会以为没发出去。

## 6. 独立滚动与测量

### 6.1 结构

```
body
└─ [data-dshc-c-root]            position:fixed; 几何 = 会话区
   ├─ header  只读标签 / 栏数 / 加载全部 / 进度
   └─ [data-dshc-c-column="k"]   overflow-y:auto; overscroll-behavior:contain;
                                 overflow-anchor:none; contain:layout paint;
      ├─ [data-dshc-c-item="<key>"]  content-visibility:auto;
      │                              contain-intrinsic-size:auto 120px
      └─ 底部哨兵
```

- 几何：先认主面板——`mainScroller = document.querySelector('[data-slot="main"] [data-conversation-scroll]')`
  （F13；页面里同时存在 embedded 子智能体会话的滚动容器），再取它的 rect，底部减去 `--dsh-composer-height`（F12），
  左/右按栏数与间距切分。root 自己 `pointer-events:none`，header / 栏 / 静态块各自 `pointer-events:auto`——
  避免覆盖层挡住 composer 的浮层（mention 候选、审批面板）。
- 宿主隐形：只对主面板那棵树操作——给主 `[data-conversation-scroll]` 加 `visibility:hidden`，再对
  `[data-composer-seat]` 子树加回 `visibility:visible`——**布局保留**（宿主自己的锚点测量仍然有效），但整片聊天区
  不可见、不进 tab 序、不进无障碍树。embedded 子智能体会话那棵树**不碰**（它在右栏，用户还要用）。
  `[风险]` composer 是否总在 scroller 内需实测；兜底为只隐藏 `[data-chat-flow]` 及其兄弟 chrome。
- 退出 C：卸 root → 去掉隐形的 class → 用第 1 栏的 `anchorKey` 在宿主 flow 里 `querySelector([data-chat-anchor-key="…"])` 并 `scrollIntoView({block:"start"})`，让宿主的位置落在用户刚看的地方。

### 6.2 触顶判定（不误触发）

- 所有 `scrollTop` 写入都经过 `setScrollTop(col, v)`：写之前记 `pendingWrite = v`，scroll 事件里若 `Math.abs(el.scrollTop - pendingWrite) < 1` 则视为自写，**不**触发加载；`pendingWrite` 在消费后清空，下一帧仍在则作废（宁可多判一次用户滚动，也不要漏判成自写）。
- 判定：`atTop = el.scrollTop <= 24 && !selfWritten`。阈值 24px 沿用 0.1.x 的实测值。
- 不需要"3 秒用户手势"那套（F10）：这套启发式是给"宿主会偷偷写 scrollTop"的场景用的；C 里宿主那棵树是隐藏的，写不到我们的栏上。
- 无滚动条场景：`scrollHeight <= clientHeight` 时 `scrollTop` 恒为 0，会永远判定 atTop → 用"内容不足一屏"分支处理：只在**用户显式**点击「加载更早」或 `loadAll` 时才继续，不自动链式触发。

### 6.3 锚点补偿（prepend / 上方变更）

等宽不变量：**所有副本栏等宽、同字体、同渲染策略**（这是 C 的硬性约束），因此同一 key 在各栏高度相同，行高只需测一次。

```
before: anchor = 首个与栏视口相交的 item → {key, top: rect.top - colRect.top}
apply : 插入/变更
after : 在"主测栏"（col 0）量 d = newRect(anchor).top - anchor.top
        对每一栏 col：col.scrollTop += d        // 同一 d，不做 N 次布局
自检  : 每栏 scrollHeight 增量与 d 一致（±1px），不一致则该栏单独精测一次
```

- 若锚点行本身在这次变更中被替换（key 消失）：退化为"按 index 保持"——记 `firstVisibleIndex` + 行内偏移比例，变更后 `scrollToIndex`。
- `overflow-anchor:none`（F11）避免浏览器的原生锚定和我们抢。
- 触顶加载后**故意不把栏拉回顶部**：`scrollTop += d` 让阅读位置钉在原处，新内容出现在上方。这与 0.1.x 在真实会话里量到的行为一致（`scrollTop` 与内容增量同时 +1183，位置零跳动，README:151 与 docs/testing.md:189-196）。

### 6.4 长会话（200+ 行）的测量与预算

- 每栏 `scrollHeight` 由浏览器给，不自己累加；行高缓存只用于"跳到某 key / 恢复上次位置"。
- `content-visibility:auto` 让视口外的行跳过 layout/paint，但 **DOM 与文本仍在**——Ctrl+F、选中、截图都正常。这是选它而不选虚拟列表的原因。
- `[假设]` 首次挂载 247 行 × 3 栏的耗时与内存未实测。**验收门槛（写进验收，不写进宣言）**：三栏首屏 ≤ 500ms、常驻 ≤ 80MB；超了再上窗口化（`@tanstack/react-virtual` 已是种子模块），但那会牺牲 find-in-page，属于最后手段。
- `[风险]` 宿主那棵隐形树仍在布局（F3：没有虚拟化）。若实测其布局成本随行数线性变差，可试 `content-visibility:hidden`，但必须先证明宿主在"零高布局"下不会触发额外翻页/锚点补偿。

## 7. 接口草案与状态模型

```ts
// ---- 单一数据源（唯一允许碰宿主服务的地方；两种实现，同一 ContentModel）----
interface ConversationSource {
  readonly sessionId: SessionId;
  /** ctx.get("uiConversation").binding(id).target("chat")；不可用时返回 undefined */
  snapshot(): ChatSnapshot | undefined;
  subscribe(listener: () => void): () => void;      // 合流后再合并成一次
  /** ctx.get("sessions").binding(id).session —— 只读状态 + 翻页动词 */
  window(): { hasMore: boolean; loadingOlder: boolean; openState: "cold"|"loading"|"open"|"error" };
  loadOlder(): Promise<void>;
  /** DataSource：服务 / target / binding 三重探测；DomSnapshotSource：主 flow 里有内容行 */
  available(): boolean;
  readonly degraded?: "dom-snapshot";               // 存在即 UI 必须标注"可能缺内容"
}

// ---- 内容模型：一份，N 个视图共享 ----
interface ContentItem {
  readonly key: string;        // = 宿主 node key（与 F1 的 data-chat-node-key 同源）
  readonly kind: string;       // user | assistant | tool | compaction | retry | user-question-reply | …
  readonly turn: number | null;
  readonly version: number;    // 局部版本，变了才重渲染
  readonly data: unknown;      // ChatNode / ConversationNode 的只读引用
}
interface ContentModel {
  readonly items: readonly ContentItem[];             // 升序（旧→新）
  readonly byKey: ReadonlyMap<string, number>;
  readonly version: number;                           // 全局版本：任何提交 +1
  readonly partial: PartialAssistant | null;          // 流式前缀（F6）
}

// ---- 历史：C 只请求，不执行 ----
type OlderReason = "top-edge" | "user-request" | "load-all";
interface HistoryPort {
  requestOlder(reason: OlderReason): void;            // 立即返回；单飞在 Controller 内
  loadAll(): Promise<{ batches: number; rows: number; complete: boolean }>;
  cancel(): void;
  state(): { phase: "idle"|"loading"|"complete"|"error"; batches: number; error?: string };
  subscribe(listener: () => void): () => void;
}

// ---- 视图 ----
interface ColumnViewState {
  readonly id: string;
  readonly index: number;
  scrollTop: number;                                  // 只在 scroll 事件里写 ref，节流上报
  anchor: { key: string; offset: number } | null;      // 首个可见行
  atTop: boolean;
  followTail: boolean;                                // 贴底才跟随，默认只有活动栏为 true
}
// ---- 宿主侧只读口：几何 / 隐形 / 位置还原 ----
interface HostSurface {
  /** `[data-slot="main"] [data-conversation-scroll]`；embedded 子智能体会话不算（F13） */
  mainScroller(): HTMLElement | null;
  sessionId(): SessionId | null;                     // data-conversation-session（F2）
  region(): { rect: DOMRect; composerHeight: number } | null;   // 读 F12 的两个变量
  hide(on: boolean): void;                           // visibility 隐藏 + composer 子树恢复可见
  restoreTo(anchorKey: string): void;                // 退出 C 时把主视图落到该锚点
}

interface DuplicateHandle {
  /** 每批之后 Controller 调它做逐栏自检；返回 false 的栏已被回退到顶部 */
  verifyAfterBatch(): boolean[];
  /** 退出前把第 1 栏位置映射回宿主视图 */
  releaseAnchor(): string | null;                      // 返回 anchorKey
  dispose(): void;
}
interface DuplicateLayout {
  mount(input: {
    host: HostSurface;              // 几何 / 隐形 / 恢复位置
    source: ConversationSource;
    history: HistoryPort;           // 触顶时 C 直接调 requestOlder("top-edge")
    columns: 2 | 3;
  }): DuplicateHandle;
}
```

**状态模型（一个会话一份）**

| 字段 | 初值 | 变化来源 |
|---|---|---|
| `columns` | 由 `colsFor(scrollerWidth)` 与用户偏好取小（下限 2） | 窗口/侧栏 resize |
| `contentVersion` | 0 | 任何模型提交 |
| `items` | 切会话时 `[]`，首帧由 source 填满 | append / prepend / upsert / remove |
| `views[k].scrollTop` | 进入时"错开一屏"：`max(0, H - k*viewH)` | 用户滚动 / 锚点补偿 |
| `views[k].anchor` | 首帧计算 | 每次 `scroll` 之后（rAF 节流 100ms 上报） |
| `views[k].followTail` | 仅 k=0（活动栏） | 用户滚到底 → true；向上滚 → false |
| `history.phase` | `idle` | Controller |
| `readOnlyNotice` | `banner` | 用户关闭横幅（按会话记忆，内存） |

**DOM / 调试契约**：`[data-dshc-c-root][data-dshc-c-version][data-dshc-c-columns]`、`[data-dshc-c-column="k"][data-dshc-c-anchor="<key>"]`、`[data-dshc-c-item="<key>"]`、降级块 `[data-dshc-c-static]`；`__dshChatColumns.c()` 返回上面那张状态表（排查时先看它，和 0.1.x 的 `data-dshc*` 一个路子）。

## 8. 本节风险

1. `[风险]`（等级中）`uiConversation` / `sessions` 是宿主**内部**契约，`0.2.1-rc.2` 有效，无版本承诺；跨 minor 可能改名或移除。隔离在一个 `ConversationSource` 里（两种实现同一接口），坏了只坏一个模块，并降级到"明说不完整"的 DOM 快照源。
2. `[风险]` 宿主隐形树的布局成本未实测（F3 无虚拟化）。这是 C 相对 A 多出来的唯一"看不见的开销"。
3. `[风险]` 等宽不变量若被打破（某栏被用户缩放/侧栏挤压），行高缓存与"一次测量广播"全部失效——必须用 `ResizeObserver` 监听每栏宽度，一不一致就退回逐栏精测。
4. `[风险]` 未映射的 node kind（第三方工具卡、新版本新增类型）会丢内容。渲染器必须对未知类型输出显式占位（kind + JSON 折叠），**不允许返回 null**。
5. `[风险]` 主面板判据依赖 `data-slot="main"`（F13）。若宿主改槽名或把会话塞进多层 keyed 槽，`mainScroller()` 返回 null → C 不启动（宁可不启动，也不去猜，0.1.4 已经证明"猜"会选错 embedded 会话）。

## 9. 开放问题（≤5）

1. 「每栏显示完整内容」是否包含"进入 C 就把整段历史拉完"？本文按"完整=不切段，历史按需自动加载"设计，避免 274 轮会话一进模式就翻十几页。
2. C 模式要不要保留 composer？本文必须保留（审批卡在那里，F9）。若产品要求"纯阅读器"，审批就得另找入口。
3. 栏数上限是否与 A 一致取 3？C 每栏还要放只读标签和代码块，420px 下限偏乐观，可能得 480px。
4. 副本内代码复制按钮算不算破坏"不可交互"？本文判"不算"（不写会话状态），需产品确认。
5. 会话切换时，各栏位置是保留（按 anchor key 恢复）还是重置到"错开一屏"？本文倾向前者，仅内存。

## 10. 结论清单（可直接进总文档）

1. C 的内容来源是**会话装配数据**（`uiConversation` 的 chat target），不是 DOM；DOM 只用来拿 sessionId（F2）和几何。
2. 否决深克隆：DOM 里有整类内容**不存在**（折叠 JsonBlock、`hidden` 行、20k 截断），克隆只能复制"这次渲染吐出来的东西"。
3. 否决 DOM 抽取：把宿主的渲染结果反解析成数据，方向不可逆、没有契约，碎了还是静默的。
4. 只读保证靠**白名单**：只渲染已知静态节点；动作型内容降级为 `.dshc-c-static` 灰块；未知类型显式占位，绝不静默丢弃。
5. 宿主在 C 里只做两件事：翻页（`SessionFace.loadOlder` + `hasMore`/`loadingOlder`）和占位（`visibility:hidden` 保布局）；不搬、不克隆任何 React 节点。主会话容器一律用 `[data-slot="main"]` 认，不用行数/面积猜（右栏 embedded 会话会骗过它）。
6. 历史只有一个入口：任一栏触顶 → `requestOlder` → HistoryController 单飞翻页；C 永不直接调 `loadOlder`。
7. 增量用"单 item 版本 + rAF/60ms 节流 + 逐栏锚点补偿"；只有"变更项在视口之上"才补偿，append 不补偿。
8. 每栏 `overflow-anchor:none` + 自算锚点，等宽不变量让"一次测量、广播到 N 栏"成立；`content-visibility:auto` 压长会话首次挂载；数据源缺失时降级为标注了"可能缺内容"的 DOM 快照。
