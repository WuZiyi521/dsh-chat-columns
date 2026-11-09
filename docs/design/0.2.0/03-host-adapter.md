# 03 · 宿主事实与 HostAdapter / ConversationSource

> 基线：DSH `0.2.1-rc.2`、插件 `dsh-chat-columns@0.1.4`；实测环境见 §7。
> 标记：`[已证实]` = 有 bundle 行号或可复现观测；`[假设]` = 合理未验；`[风险]`。

## 0. 一页结论

1. **主会话的可靠判据是 `closest('[data-slot="main"]')`，不是「行数最多」。** 0.1.4 的 `mainScroller()`
   （`lib/client.js:131-146`）在右栏开着子智能体聊天时**选错容器**：实测窗口 2200px、主会话 1193px 本应 2 列，
   实际 `<html data-dshc-width=712 data-dshc-n=1>` 且主 flow 无 `dshc-flow` —— **主会话多列静默失效**（§2.3）。
2. `[data-conversation-scroll]` ≠ 会话：hero（无会话）也有一个；右栏每个 embedded 会话再一个；
   Chat/Trajectory 视图切换时它**保留**、内容整块替换。**「找到 scroller」不等于「有会话」**。
3. 会话切换 / 视图切换 = 正文子树**整棵替换**（实测元素身份丢失），插件不得缓存 DOM 引用。
4. `apply(ctx)` 拿到的是 cordis Context；`ctx.get("sessions")` **无需 `inject`** 即达（已运行证实），
   能读到 `hasMore/loadingOlder/openState`、全量事件、渲染节点模型。**「插件只能读 DOM」不成立**；
   准确说法：*DOM 是对外契约，服务是内部捷径*。
5. 「加载更早」的锚点补偿**绑在按钮 onClick（`beginPaging`）上**，不在数据层：代点按钮 = 免费拿补偿；
   直接 `session.loadOlder()` = 不补偿、会跳。
6. paging 失败**没有 DOM 表面**（只 `console.error`），HistoryController 不能靠 DOM 判失败。
7. `apply()` 早于会话 DOM 约 300ms（368ms vs 684ms）：接口不能假设 apply 时可解析。

## 1. 会话 DOM 的稳定契约

### 1.1 可依赖（结构契约，有明确产出点）

| 选择器 | 语义 | 证据 |
|---|---|---|
| `[data-slot="main"]` / `[data-slot="main.conversation"]` | 主区域槽位锚点，全页各 1 个 | renderer `SlotOutlet` 统一输出：`dsh-client-ui-renderer/lib/client.js:1117-1127`；注册：ui-conversation:19727 |
| `[data-conversation-content]` | 一个会话 occurrence 的根 | ui-conversation:17864 |
| `[data-conversation-session="<id>"]` | 该 occurrence 的会话 id（DOM 里唯一的会话身份来源） | ui-conversation:17866；宿主自己也用 `closest(...)` 认 occurrence：:19386 |
| `[data-conversation-region="chat"｜"composer"]` | 实例内区域划分 | :17867 / :17859 |
| `[data-content-phase="hero"｜"settling"｜"active"]` | 空态 / 打开中 / 正常 | :17868（phase 计算 :17543-17548） |
| `[data-conversation-scroll]` | **滚动视口**（唯一纵向滚区） | :17870-17872 |
| `[data-chat-flow]` | 正文流容器（主 flow 或分组嵌套 flow） | ui-chat:2886 / :4239 |
| `[data-chat-flow-key]` | 一行（一个渲染节点），flow 的直接子元素 | ui-chat:3805 |
| `[data-chat-turn]` / `[data-chat-flow-kind]` | 轮次 / 节点类型 | :3809 / :3810 |
| `[data-chat-group-key]` + `[data-step-process-content][data-chat-flow]` | 折叠分组座位 + 嵌套 flow | :4210-4240 |
| `[data-chat-anchor-key]` / `[data-chat-paging-anchor]` | 锚点键 / 可作分页锚点的行 | :3804,:3807 / :4211,:4213 |
| `[data-chat-turn-spacer]` | flow 之后的尾部占位 | :2929 |
| `[data-composer-seat]` | 输入区座位，**在 scroller 内部** | ui-conversation:17855-17858 |
| `[data-sidebar-chat]` / `[data-dockkit-pane]` / `[data-rightbar-col]` / `[data-sidebar-right-session]` | 右栏停靠结构 / 右栏所属父会话 | ui-subagent:805；祖先链实测（§7-E2） |

`data-slot` 的取值就是插件扩展点槽名（`main`、`main.conversation`、`conversation.chat.flow`…），是宿主意图书写的对外标识；**这是 0.2 唯一该硬编码的一层。**

### 1.2 只能当线索

- **一切类名**：`EvIC1a_x`（ui-chat:2679 CSS + :2688-2700 类映射）、`O_Ebla_x`、`wSkVaW_x`（ui-conversation:17325/17335/17345）、`pI_x6G_x`、`_root_k7ery_16`。主会话子树实测 20 个类名家族、958 个元素带 SVG 类名——只可调试，不可选择。
- **`.EvIC1a_older`** 就是哈希（映射表 :2695）：0.1.0 的 `.older button` 从未命中即此因；只能「文案 + 结构」找。
- **行数 / 面积 / DOM 顺序**：不能当容器身份判据（§2.3 反例），只能做**同容器内**候选排序。
- **`[data-preview]/[data-tool]/[data-disclosure-*]`**：toolview 实现细节，数量随内容变（实测 52/25/77 个），不属于会话结构。

### 1.3 硬规则

> 选择器只由「`data-slot` + `data-conversation-*` + `data-chat-*`」构成；哈希类名与「最大/最多/第几个」只允许用于同一父容器内的排序。

## 2. 多个 `[data-conversation-scroll]`：谁是谁

### 2.1 它们从哪来

全部来自**同一个** `ConversationRoot`（ui-conversation:17862-17874），按 `variant` 分两种：

| variant | 谁在用 | 判别特征 |
|---|---|---|
| `main` | 主区域（`main.conversation` 槽） | 祖先有 `[data-slot="main"]`；根类 `wSkVaW_body` |
| `embedded` | 右栏子智能体聊天（`data-sidebar-chat`） | 祖先 `[data-slot="sidebar.chat.conversation"]`→`[data-sidebar-chat]`→`[data-slot="sidebar.right.pane.tab"]`→`[data-dockkit-pane]`→`[data-rightbar-col]`；根类含 `wSkVaW_embeddedBody`（:17345,:17864；subagent:783-810） |

embedded 的 `data-conversation-session` 是**子会话 id**（实测 `46aa4484-…`），面板上的
`[data-sidebar-right-session="<父会话 id>"]` 可交叉校验归属。
`[假设]` 文档预览面板不产生第三个 scroller（渲染文件而非 ConversationRoot），本机无可开目标未验；`[假设]` dockkit `preferNewPane`（subagent:969-972）意味着多 pane 时可能有 **N 个 embedded**，我只复现了单 pane 多 tab。

### 2.2 实测：页面里真的同时有两个，且 embedded 更大

| | 主会话 | 右栏子智能体聊天 |
|---|---|---|
| `data-conversation-session` | `session-98192d17…` | `46aa4484…` |
| `closest('[data-slot="main"]')` | ✔ | ✘ |
| `[data-chat-flow-key]` 行数 | 156 | **244** |
| `clientWidth`（窗口 2200） | 1193 | 712 |

### 2.3 反例：0.1.4 就是这样选错的（已复现）

判据 = 「含 `[data-chat-flow] [data-chat-flow-key]` 最多的 scroller」（`lib/client.js:131-146`），面积只做行数持平裁决：

```
窗口 2200×1000，右栏开着子智能体聊天
<html data-dshc-state="active" data-dshc-width="712" data-dshc-n="1">
主会话 flow: class="EvIC1a_column"（无 dshc-flow），clientWidth=1193 → 本应 2 列，实际 0 列
```

`712` 正是 embedded 的 clientWidth。1600px 窗口同样复现（主 598 / embedded 717）。README 的「未验证能否认错」——**已验证：能**。

### 2.4 判定算法（推荐）

```
mainScroller():
  all = [...document.querySelectorAll("[data-conversation-scroll]")]
  main = all.filter(s => s.closest('[data-slot="main"]'))          # 全页唯一，最强结构证据
  if (main.length === 1) return main[0]
  cand = all.filter(s => !s.closest("[data-sidebar-chat],[data-dockkit-pane],[data-sidebar-right-panel],[data-rightbar-col]"))
  if (cand.length === 1) return cand[0]                             # 回退：排除一切「嵌在别的面板里」的实例
  ...                                                               # 再回退：用会话 id 对齐；仍不唯一 → null（冻结，不猜）
```

独立交叉校验：`localStorage["dsh.sessions.current"]` = `{"sessionId":"…"}`（实测与主会话一致），可与 `[data-conversation-session]` 比对；但它是**缓存**，切换瞬间可能滞后 → 只做校验，不做唯一依据。

**反例清单（朴素判据都会翻车）**：
1. 「行数最多」→ 右栏子智能体聊天赢（§2.3 实测）。
2. 「面积最大」→ embedded 可以更大（实测 546k px² vs 433k px²）；0.1.3 还曾因此选中 hero 空面板。
3. 「`querySelector` 第一个」→ 0.1.4 的 `bindScroll()`（`lib/client.js:421-423`）如此，DOM 顺序一变就绑错滚动容器。
4. 「有 scroller」→ hero 也有（实测 `flows=0`、`phase=hero`），会误判「有会话」。
5. 「有 `[data-chat-flow]`」→ Trajectory 视图下主 scroller `flows=0`、右栏 embedded 有 flow → 判成右栏是主会话（已实测）。

## 3. `apply(ctx)` 里的 ctx 到底是什么

### 3.1 是什么（已证实）

- 客户端插件由模块系统装载：`window.__ModuleLoader__.load({id, factory})` → `factory(require)` 返回 `{apply, inject}`
  （`dsh-client-modules/lib/client.js:9-31` 文档、`lib/index.js:463` 的 HTML facade）。
- 宿主用 cordis `Loader` 建 entry fiber，`apply(ctx)` 的 `ctx` = **该 entry fiber 的 cordis Context**，
  原型链上是客户端根 context（根上 provide 的服务都可达）。本插件 `exports.inject = []`（`lib/client.js:524`）。
- 运行实测（从 React fiber 的 slot inject 载荷里取到真 ctx）：`fiber.name="agentScope"`, `state=2`(ACTIVE), `inject=[]`
  —— 说明会话作用域 ctx 与根 ctx 共享服务存储，`ctx.get` 两边都能用。

### 3.2 两条完全不同的路

| 方式 | 结果 | 证据 |
|---|---|---|
| `ctx.sessions` / `ctx.store` 等**属性访问** | **抛错** `cannot get property "xxx" without inject` | cordis:674-712；运行时实测读 `ctx.store` 直接抛 |
| `ctx.get("sessions")` | **可用，无需 inject** | `ReflectService.get` 文档原文「Read a service from the store without the inject requirement」：cordis:755-765；实测返回 object |

`ctx.reflect.props` 运行时可枚举全部声明过的上下文属性（实测 100+ 项），关键子集：`sessions`、`uiSession`、
`uiConversation`、`conversation`、`slots`、`modules`、`resources`、`locale`、`theme`、`layout`、`sidebarRight`、
`sidebarRightTabs`、`documentPreviews`、`remote.*`。

### 3.3 能拿到什么（运行时实测，会话 `session-98192d17…`）

| 想要 | 能 | 怎么拿 | 实测 |
|---|---|---|---|
| 当前会话 id | ✔ | `sessions.scopeOf(ctx)` / DOM `[data-conversation-session]` / `localStorage["dsh.sessions.current"]` | 三者一致 |
| 会话元数据 | ✔ | `sessions.list.getSnapshot()` → `{ids,byId,phase,projectionsBySession}`；`sessions.binding(id)` → `{sessionId,session,eventSource,ctx}` | 四键齐全 |
| 历史状态 | ✔ | `binding.session.getSnapshot()` → `{hasMore,loadingOlder,openState,running,blank,pendingSubmissions}` | `{hasMore:false,loadingOlder:false,openState:"open"}` |
| 触发加载更早 | ✔ | `binding.session.loadOlder()` / `loadThrough(seq)`（`ISession`） | 未直接调（怕扰动），与按钮同方法（§5.3） |
| 消息/事件 | ✔ | `binding.eventSource.getSnapshot()` → `{entries,hasMore,revision}` | 265 条，`revision=1` |
| **渲染节点模型** | ✔ | `uiConversation.binding(id).target("chat").getSnapshot()` → `{order,nodes,locations,navigation,timeline}` | `order` 75 项；`nodes.get(k)` → `{key,kind,id,target,anchorSeq,location,visibility,groupTree,data}`，user 节点 `data` 含 `{kind,seq,time,content,source}` |
| 订阅变更 | 部分 | `sessions.list.subscribe` 实测 4s 19 次；`session.subscribe`/`chat.subscribe` 在空闲会话 4s 内 0 次（不能据此证伪） | §7-E7 |

### 3.4 硬结论（进总文档的那一句）

> **不要写「插件只能读 DOM」。** 准确表述：*DOM（`data-*` 结构）是宿主唯一对外、可预期的契约；
> cordis 服务（`ctx.get(...)`）在 rc.2 上实际可达，能提供 DOM 拿不到的 hasMore/loadingOlder/节点模型，
> 但它是未承诺兼容的内部面，只能作为可选加速路径，不能作为 0.2 的唯一数据源。*

`[风险]` 三条：① 内部服务无版本契约，`nodes.get()`/`order` 形状随时可能变；② `ctx.get` 绕过 `inject` 也就绕过「服务就绪」等待，可能返回 `undefined`，必须处处判空；③ 若复制模式内容源绑到内部对象，宿主一次重构就断，而 DOM 侧行模型反而被宿主自己测试覆盖。

**复制模式前提因此要改**：不必「只能克隆死 DOM」，也不必「只能刮文本」。走 `ConversationSource`：首选 DOM 行模型
（`[data-chat-flow-key]` + 节点内文本），服务侧节点模型作为「有则用、无则退」的富化源；仍坚持只读渲染、不搬 React 节点、不给副本绑交互。

## 4. 生命周期：谁被保留、谁被替换

### 4.1 冷启动时间线（实测，§7-E1）

```
DOMContentLoaded 125ms → <html data-dshc>+徽标 368ms → [data-slot=main.conversation]+scroller 684ms
→ [data-chat-flow] 1226ms → 第一个 flow-key 1365ms
```

`apply()` 比会话 DOM 早约 300ms、比第一行内容早约 1s。任何 `mount/resolve` 必须「先空后有」，由观察者驱动。

### 4.2 会话切换：整棵替换（实测，§7-E4）

在会话 A 的 scroller/flow/行上打 JS 标记 → 切 B → 切回 A：**标记全丢**（`sameScroller=false`、`flow=null`）。即 `[data-conversation-session]`、scroller、flow 都是新节点，插件必须重新解析、不能持旧引用（0.1.4 的 `lastFlow`/`appliedFlows` 释放逻辑即为此）。同期 `data-dshc` 仍在、徽标仍 1 个：插件实例没重载，只是 DOM 换了。

### 4.3 hero / 视图切换 / 右栏（实测）

| 事件 | 观测 | 推论 |
|---|---|---|
| 点 New Session（无会话） | 1 scroller、`flows=0`、`phase=hero`、`state=none`、`dshcWidth/N` 被删 | scroller 存在 ≠ 有会话；判活看 flow 或 phase |
| 切到 Trajectory 视图 | scroller **保留**、主 `[data-chat-flow]` **0 个**、出现另一个 `<td>` 里的 "Load earlier history" | 视图切换卸载正文；「加载更早」文案非会话专属 |
| 切回 Chat | 正文重新挂载（新节点），右栏不受影响 | 每次视图切换都是一次 remount |
| 开右栏子智能体聊天 | 新增第 2 个 scroller（embedded），主 scroller 被挤窄 | 多容器是常态 |
| 右栏移出视口 | embedded 仍在 DOM，但 `visibleArea=0` | 面积过滤能挡住它——**只在它不可见时** |

### 4.4 HMR（代码证据）

`ClientEntries.replace()` 顺序：`modules.prefetch` → `tearDownEntryFiber(entry)` → `removeOwnedStyles(id)` →
`modules.import` → `entry.refresh()` → `fiber.await()`（`dsh-client-modules/lib/client.js:481-497`）。

- `tearDownEntryFiber` 走 fiber disposer，插件 `ctx.effect` 的 cleanup 全部执行（:299-307）。
- `removeOwnedStyles` 删除 `style[data-plugin="<id>"]`（:312-315）——插件的
  `<style data-plugin="dsh-chat-columns">` **由宿主兜底清理**，插件自己的 disposer 是第二道保险。
- 之后 `apply()` 在新 fiber 重跑；**旧实例 disposer 可能晚于新实例 apply**（README 已记录的实测竞态）→
  0.2 必须保留实例归属标记（`dshcOwner`/`dshcRootOwner` 思路正确）。
- HMR **不重建**会话 React 树：DOM 上残留的 `dshc-flow`/内联变量必须能被新实例接管或清理。
- `[假设]` 未触碰仓库文件（禁止），HMR 结论来自代码路径 + 历史实测，本轮未复跑。

### 4.5 挂载 / 拆除时机

| 时机 | 做什么 |
|---|---|
| `apply()` 内 | 只注册：样式、观察者、徽标、API。**不解析 DOM**（还不存在） |
| 首个 scroller 出现 | MutationObserver → resolve → 应用布局 |
| 会话切换（sessionId 变） | 旧 flow 全量释放（类/内联变量/标记）→ 解析新 flow |
| flow 消失（视图切换/回 hero） | 释放所有已套列 flow，状态 `none`，**不拆徽标** |
| 右栏 embedded 出现 | **不参与**（主会话判据必须排除） |
| HMR / unload | 清理样式、观察者、监听、徽标、`<html>` 属性、flow 痕迹；先过归属检查；DOM 已先消失则用 `document.contains()` 兜底 |

## 5. 「加载更早」的真实机制

### 5.1 结构（代码，ui-chat:2884-2931；类名是哈希，图里只为示意）

```
div[data-chat-flow]                              ← 主 flow
├─ div.EvIC1a_hint        (openState==="loading"，"载入历史…")        :2891-2894
├─ div.EvIC1a_openError   (openState==="error"，"历史加载失败：…")    :2895-2900
├─ div.EvIC1a_older       (hasMore 时)
│   └─ <button type=button disabled={loadingOlder} onClick=scroll.loadEarlier>
│        {loadingOlder ? t("loading") : t("chat.loadOlder")}          :2901-2908
├─ renderSlot("conversation.chat.flow") → 行们（含分组座位嵌套 flow）
└─ div[data-chat-turn-spacer]                                        :2929
```

文案：`chat.loadOlder` = 加载更早 / Load earlier（:5798/:5992）；`loading` = 加载中… / Loading…（`dsh-client-locale:946/992`）。

### 5.2 点击之后（实测，§7-E5）

| 时刻 | DOM |
|---|---|
| t=0 | `disabled=false`，"Load earlier" |
| +6ms | `disabled=true`，文案 → "Loading…"（**唯一 loading 态**，无 spinner/aria-busy） |
| +88ms | 提交：行 122→213，`scrollHeight` 7890→14731，`scrollTop` 7166→**14007** |
| 完成 | `hasMore=false` 时整个 `.older` 容器**被移除**（按钮随之消失） |

锚点补偿**增量严格相等**：+6841/+6841，第二次 +251/+251 → 阅读位置零跳动。

### 5.3 补偿是「按钮专属」的（决定 HostAdapter 怎么触发）

`button.onClick = scroll.loadEarlier`（:2905）→ `ChatNavigation.loadEarlier`（ui-chat:669-675）：
`viewport.beginPaging()` + `reading.pauseFollowing()` + `input.loadOlder()`。
`beginPaging()` 取第一个 `[data-chat-paging-anchor]` 行，记 `{anchorKey, anchorTop, scrollTop}`（:2280-2300）；
内容提交时 `contentCommitted()` → `preserve()` 用 `target = metrics.top + rowTop - anchorTop` 回写（:2340-2385），
且**只在 `viewport.preserving === true` 时动作**（:2332-2334）。

**推论**：① `.click()` 触发 → `beginPaging` 必跑 → 补偿必发生；② 直接 `session.loadOlder()` → 不经 `beginPaging`，
`preserving=false` → 提交后**不补偿、会跳**；③ `loadOlder()` 自带守卫
`openState!=="open" || !hasMore || loadingOlder` 直接 return（session-controller:2492-2494），天然防重入。

### 5.4 失败态

- **paging 失败没有 DOM 表面**：`loadOlder()` 捕获异常只 `console.error`（非 RemoteFailure 才打），
  `finally { loadingOlder=false }`，`hasMore` 不变（session-controller:2495-2508）。UI 上就是「按钮回到可点」。
- 唯一失败文案是**首次打开**失败：`openState==="error"` → `chat.loadError` 渲染在 `.EvIC1a_openError`（:2895-2900）。
- 所以 `error` 态只能来自：`console.error` 嗅探（脏）、`session.getSnapshot().openError`（走 ctx 才有）、
  或「点了但 DOM 无变化」超时（弱）。**DOM-only 做不到可靠失败检测。**

### 5.5 另一个「加载更早」

Trajectory 视图有一个同名不同结构的 "Load earlier history"，在 `.Y0dWHa_historyLoadRow > td > button`
（实测 `inFlow=false`,`inTurn=false`）。0.1.4 靠 `flow.children` + 文案 + `!closest("[data-chat-turn]")` 排除了它，
但这证明**单靠文案会误命中**，必须叠加结构约束（必须是主 flow 的直接子节点）。

## 6. `HostAdapter` / `ConversationSource` 接口草案

只列 0.2 三模式真正会调的；每个方法标证实状态。

```ts
/** 只读宿主能力：识别、取根、滚动、锚点、加载更早、订阅。所有方法必须允许「暂时无会话」。 */
interface HostAdapter {
  /** 主会话；无会话(hero/切走)返回 null。判据 closest('[data-slot="main"]')，回退到排除 embedded 后唯一者。[已证实] */
  current(): ConversationRef | null;
  /** 出现/消失/换会话/换 flow。MutationObserver(body,subtree)+ResizeObserver(scroller)+rAF 合帧。[已证实] */
  observe(listener: (next: ConversationRef | null) => void): () => void;
  /** 正文根 = 主 scroller 内非嵌套、非 step-process 的 [data-chat-flow]。[已证实] */
  contentRoot(ref: ConversationRef): HTMLElement | null;
  /** 唯一纵向滚动容器 = ref.scroller。[已证实：主会话子树只有它可纵向滚动] */
  scrollport(ref: ConversationRef): HTMLElement;
  /** 快照：屏内首行 + 其相对 scrollport 的 top + scrollTop（与宿主 preserve 同构）。[已证实] */
  snapshotAnchor(ref: ConversationRef): Anchor | null;
  /** 恢复：scrollTop += rowTop' - anchorTop；行已消失返回 false。[已证实] */
  restoreAnchor(ref: ConversationRef, a: Anchor): boolean;
  /** hasMore：主 flow 直接子节点里存在 "Load earlier" 按钮。[已证实] */
  hasMore(ref: ConversationRef): boolean;
  /** 触发一批：只允许在宿主按钮上 .click()，这样锚点补偿由宿主完成。[已证实] */
  requestOlder(ref: ConversationRef): "clicked" | "busy" | "exhausted";
  /** 可选加速：拿不到返回 null，调用方必须能纯 DOM 工作。[需验证：订阅通知未在活动会话上观测到] */
  sessionState?(ref: ConversationRef): { hasMore: boolean; loadingOlder: boolean } | null;
}

/** 一份内容源：给复制模式供节点，给 HistoryController 供进度。DOM 优先。 */
interface ConversationSource {
  nodes(): ReadonlyArray<SourceNode>;                  // 来自 [data-chat-flow-key] 行 [已证实可枚举]
  subscribe(listener: () => void): () => void;         // MutationObserver(childList, contentRoot) [已证实]
  revision(): { rows: number; firstKey: string | null; scrollHeight: number };  // 每批后校验 [已证实]
}

type ConversationRef = {
  sessionId: string;            // 纯字符串比较，比 DOM 引用可靠
  scroller: HTMLElement;
  flow: HTMLElement | null;     // hero 时为 null
  phase: "hero" | "settling" | "active";
};
```

明确**不做**：① 多会话/多 occurrence 注册表——0.2 只要单个活动主会话（`ConversationRef` 带 `sessionId`，将来加 occurrence 不改签名）；② 元素级 provider / 拦截 `renderSlot`（0.3）；③ 自建滚动引擎（B 模式再评估）；④ 失败分类进 HostAdapter（宿主侧没有 DOM，分类属于 HistoryController 的启发策略）。

## 7. 观测证据（可复现）

环境：`chromium-1248/chrome-linux64/chrome --headless=new --remote-debugging-port=9222 --user-data-dir=/tmp/cdp-a
--no-sandbox --disable-dev-shm-usage --window-size=1600,1000`，打开 `http://127.0.0.1:3080/?token=<dsh-web.log 最后一条>`，
用 `harness/cdp.mjs eval / eval-file` 观测。**观测结束已 kill chromium（9222 已关）**。

| # | 做法 | 关键输出 |
|---|---|---|
| E1 | `Page.addScriptToEvaluateOnNewDocument` 注入时间线探针 + reload，读 `window.__tl()` | DCL 125 / dshc 368 / badge 368 / slot+scroller 684 / flow 1226 / flow-key 1365 (ms) |
| E2 | 开右栏子智能体聊天后枚举 `[data-conversation-scroll]` + 祖先链 | 2 个；链 `[data-slot=main]` vs `[data-sidebar-chat]→[data-sidebar-right-tab]→[data-dockkit-pane]→[data-rightbar-col]` |
| E3 | resize 2200×1000，读 `<html data-dshc*>` + 两 scroller 的宽度/行数 | `width=712 n=1`；主 1193/156（无列），embedded 712/244 |
| E4 | 在 A 的 scroller/flow/行打 `__probe`，切 B 再切回 A | 三标记全 `null`，`sameScrollerAsA=false`；插件仍 active、列仍生效（新节点） |
| E5 | MutationObserver 采样 + `button.click()` | +6ms disabled/"Loading…"；+88ms 行 122→213、sh 7890→14731、st 7166→14007；hasMore=false 后 `.older` 移除；二次 +251/+251 |
| E6 | Trajectory 视图下遍历主 scroller | `flows=0`，`<td>` 内 "Load earlier history"；右栏 embedded 仍 2 flow/238 行 |
| E7 | 从 React fiber 的 slot inject 载荷取 ctx，读服务 | `fiber.name=agentScope,state=2,inject=[]`；`{hasMore:false,loadingOlder:false,openState:"open"}`；eventSource 265；chat `{order:75,nodes,locations,timeline}`；`nodes.get(k)`→`{key,kind,data:{content,seq}}`；`sessions.list.subscribe` 4s 19 次 |
| E8 | `ctx.store` 属性访问 | 抛 `cannot get property "store" without inject` |
| E9 | hero（点 New Session） | 1 scroller / 0 flow / `phase=hero` / `state=none` / `dshcWidth,N` 已删 |
| E10 | 主会话子树 overflow 统计 | 只有 `[data-conversation-scroll]` 可纵向滚动（3174/724）；`EvIC1a_scroll` 不可滚；另有 turn rail（28×132）、composer 输入框等小滚区 |

副作用：E5 真在主会话（父 agent 的会话）上加载了两页历史；E9 点了 New Session（空白会话 id 轮换，会话条数未增）。未改仓库文件、`~/.dsh`，未提交。

## 8. 本节的开放问题（≤5）

1. **0.2 是否允许用 `ctx.get(...)`？** 决定 ConversationSource 是「DOM 解析」还是「节点模型」。我倾向 DOM 为契约、
   服务只做 `hasMore/loadingOlder` 的可选加速；需维护方拍板，它决定「复制模式内容一致性」能不能硬保证。
2. **多 pane 时会不会出现 N 个 embedded scroller？** dockkit 的 `preferNewPane` 暗示会；我只复现单 pane 多 tab。
   若会，`current()` 的回退分支要更保守（宁可返回 null 冻结）。
3. **`data-slot` 与 `data-conversation-*` 能否算「对外契约」？** 由 renderer/ConversationRoot 硬写，但需宿主明确不重命名，
   否则 0.2 只能靠「多信号投票 + 冻结」自保。
4. **B 模式真需要接管 `scrollTop` 吗？** 继续「代点按钮」拿锚点补偿，能否表达「接缝固定在视口底部」？这是无缝模式的核心风险，本节不给结论。
5. paging 失败无 DOM、`hasMore` 不变——HistoryController 的 `error` 态在纯 DOM 路径上**是否允许降级为「超时未变 = 失败」**？

## 9. 本节的结论清单（≤8，可直接进总文档）

1. 主会话 = `[data-conversation-scroll]` 中 `closest('[data-slot="main"]')` 的那个；行数/面积/顺序判据在右栏打开时**必错**（已复现 0.1.4 失效）。
2. 可依赖契约 = `data-slot` + `data-conversation-*` + `data-chat-*`；一切哈希类名（`EvIC1a_*` 等）只能当线索。
3. 页面可同时有多个 `[data-conversation-scroll]`（hero、右栏 embedded），**scroller 存在 ≠ 有会话**；判活看 `data-chat-flow` 与 `content-phase`。
4. `apply(ctx)` 是 cordis Context；属性访问需 `inject`（会抛错），`ctx.get(name)` 不需（已运行证实）→「只能走 DOM」不成立，但服务面是内部 API，只能当可选加速。
5. 会话切换与视图切换都**整棵替换**正文 DOM；插件不得缓存节点，切换时必须全量释放旧 flow 痕迹。
6. `apply()` 早于会话 DOM（368ms vs 684ms）——HostAdapter 必须「先空后有」，观察者驱动。
7. 「加载更早」= 主 flow 直接子节点里的一个按钮；点击后 `disabled`+"Loading…"；锚点补偿由宿主 `beginPaging/preserve` 完成，**只有点按钮才免费拿到补偿**；paging 失败无 DOM。
8. HostAdapter 只需 8 个方法（current/observe/contentRoot/scrollport/snapshotAnchor/restoreAnchor/hasMore/requestOlder）+1 个可选加速；不做多会话注册表、不做滚动引擎、不做失败分类。


---

## 维护方裁决（2026-11-09）

- **不等宿主承诺**（Q7）：容器识别改为「版本感知 + 多信号交叉校验 + 失败冻结」，
  详见 `08-open-questions.md` Q7。本文 §2 的判据是交叉校验里的主信号，不是唯一信号。
- 校验失败时**不排版、不清残留、不猜**，徽标显示「宿主结构已变化，已冻结」。
