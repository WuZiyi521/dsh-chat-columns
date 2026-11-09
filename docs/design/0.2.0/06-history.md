# 06 · HistoryController 与自动加载防护

> 只读代码与文档，未开浏览器，未改仓库。`[假设]` 均附验证办法。
> 基线：插件 `lib/client.js`（0.1.4，527 行）；宿主 `dsh-client-ui-chat`（下称 **chat**）、
> `dsh-api-session-controller`（**sc**）、`dsh-client-ui-conversation`（**conv**）。

## 0. 结论先行
1. 自动加载的正确模型是**边沿触发的「触顶事件」+ 迟滞 re-arm**，不是「`scrollTop ≤ 24` 就加载」。
   0.1.4 的 24px + 1.5s 只防手抖连点，防不住三类风暴：加载中 `scrollTop` 仍 ≤24、返回 0 条、
   宿主补偿尚未落地。必须补**每批 DOM 校验**与**最大无进展次数**。
2. 插件从 DOM 只能拿到四件事：按钮在不在/`disabled`、行数、flow 高度、锚点行位置。宿主把
   `loadOlder` 的错误**吞掉**，所以「失败 / 超时 / 真没有更多」在 DOM 上不可区分 → 只能用
   「无进展」近似失败，配有限重试，绝不无限重试。
3. `scrollTop` 只能由宿主补偿（`preserve()` 直接写 scroller），而且**它会主动放弃**：批次在途时用户
   一动 wheel 就清锚点（§4.2），「不补」也是合法结果。插件职责是**校验与停止**；唯一例外：复制模式的 pane。
4. `+1183 / +1183` 只证明「一次 prepend 后位置没跳」，**不证明**自动加载（`scrollTop≈0`）路径，
   也不区分 `preserve()` 与「到底吸附/clamp」——该次实测是 `scrollTop=2012 / scrollHeight=2844`。
5. 一键加载全部的终止条件必须**全部外部可判定**；进度用 `data-chat-turn` 估算，**没有可靠百分比**，
   且行数 ≠ 消息条数。

## 1. 事实基线
| # | 事实 | 证据 |
|---|---|---|
| F1 | 按钮只在 `hasMore` 时渲染；`disabled = loadingOlder`；文案 `loadingOlder ? "加载中…" : "加载更早"` | chat:2900-2907；zh:5798/en:5992；"加载中…" 见 `dsh-client-locale:946` |
| F2 | 点按钮 → `loadEarlier = cancel() + beginPaging() + pauseFollowing() + loadOlder()` | chat:670-675 |
| F3 | `beginPaging()` 保留**第一个** `[data-chat-paging-anchor]:not(:empty):not([hidden])` 行 | chat:2280-2285 |
| F4 | 提交后 `contentCommitted()` 调 `preserve()`：重测该行 `top`，`scrollTop = metrics.top + top - anchorTop`，clamp 到 `[0,floor]` | chat:688-695、:2340-2380、:2415-2437 |
| F6 | `loadOlder()` 幂等（`!hasMore \|\| loadingOlder` 直接 return）；**错误被吞**，`finally` 只复位 flags | sc:2492-2513 |
| F7 | 单批 ≥50 条消息且 ≥2 个 turn 起点，上限 500 条 | sc:2177-2183 |
| F8 | 行节点带 `data-chat-anchor-key`/`data-chat-flow-key`/`data-chat-turn`；部分行带 `data-chat-paging-anchor` | chat:3804-3813、:4213 |
| F9 | 滚动容器 = `list.closest("[data-conversation-scroll]")`；会话容器带 `data-conversation-session` | chat:1778；conv:17866,17871 |
| F10 | 轨道（TurnNavigator）是虚拟列表，DOM 只有可见 mark，**不能数 mark 得总轮数** | chat:231-258、:290；README 已知限制 7 |
| F11 | 0.1.4：`scrollTop>24` return；`Date.now()-userScrolledAt>3000` return；`now-lastClick<1500` return；`lastClick` 点前写 | `lib/client.js:399-412` |
| F12 | 滚动监听绑**第一个** `[data-conversation-scroll]`，按钮却来自 `mainScroller()`（行数最多的那个） | `lib/client.js:422` vs `:131-145`、`:404` |
| F13 | 0.1.4 无任何 `scrollHeight`/行数/锚点校验，无 `setTimeout`/`scrollend` | grep：`scrollTop` 只有 `:402` 一处 |
| F14 | `findOlderButton` 第三层兜底返回 flow 直系子节点内、非轮内的**任意**按钮 | `lib/client.js:344-348` |

## 2. 状态机
### 2.1 状态与数据
```ts
type Phase = "idle" | "loading" | "complete" | "error";
type Trigger = "auto" | "manual" | "load-all";
type ErrorCode = "timeout" | "no-progress" | "anchor-drift" | "binding-lost" | "budget";

interface HistoryState {
  phase: Phase;
  trigger: Trigger | null;
  auto: boolean;            // 生效值 = prefs ?? modeDefault（§7）
  armed: boolean;           // re-arm 门：只有离开顶部后才允许下一次触顶
  batch: number;            // 单调递增，丢弃迟到回调
  sessionEpoch: number;     // 会话/模式/binding 变化即 ++
  noProgress: number;       // 连续无进展批次
  retryAt: number | null;   // 退避到期
  lastClickAt: number; lastCommitAt: number;
  rows: number;             // [data-chat-flow-key] 数量
  oldestTurn: number | null;// min(data-chat-turn)，进度用
  hasMore: boolean | null;  // 由按钮存在性推断，null=未知
  error: { code: ErrorCode; retryable: boolean; at: number } | null;
  lastBatch: BatchResult | null;
}
```

### 2.2 事件
| 事件 | 来源 | 携带 |
|---|---|---|
| `E_TOP` | `scrollend`（无则 scroll+150ms 去抖）+ `scrollTop ≤ 24` + 停留 ≥120ms | S0 |
| `E_LEAVE_TOP` | `scrollTop > 96` | — |
| `E_UP_GESTURE` | wheel `deltaY<0` / 触控上滑 / `keydown` 滚动键 / pointerdown | 时刻 |
| `E_CLICK` | 自己发的 `btn.click()` | batch |
| `E_COMMIT` | MutationObserver 行数变化 + 稳定窗口结束 | S1 |
| `E_MORE_GONE` | `findOlderButton() === null` | — |
| `E_TIMEOUT` | 8s 无 `E_COMMIT` | — |
| `E_CANCEL(reason)` / `E_BINDING` / `E_DISPOSE` | 用户·会话·模式·卸载；scroller/flow/session 变化；disposer | 新 binding |

### 2.3 转移表
| 起点 | 事件 | 守卫 | 终点 | 副作用 |
|---|---|---|---|---|
| idle | `E_TOP` | `auto && armed && now-lastClick≥1500 && now≥retryAt` | loading(auto) | 采 S0；`batch++`；记 `lastClickAt`；`armed=false`；`click()`；起 8s 超时 |
| idle | `E_TOP` | 其余 | idle | 只记 `suppressed`，不碰 DOM |
| idle | 用户直接点宿主按钮 | — | loading(manual) | 采 S0；`batch++`；`armed=false` |
| loading | `E_COMMIT` 且（rows↑ 或 flowH↑） | drift ≤24 | idle | `noProgress=0`；更新 `rows`/`oldestTurn`；`armed=false` |
| loading | `E_COMMIT` 且 rows↑ 但 drift>24 | — | error(anchor-drift) | 本 epoch 内 `auto=false`；不清内容 |
| loading | `E_COMMIT` 无进展 | `noProgress<2` | idle | `noProgress++`；`retryAt=now+[400,1200][n]`；须新 `E_TOP` 才重试 |
| loading | `E_COMMIT` 无进展 | `noProgress=2` | complete(no-progress) | 本地 `hasMore=false`；`auto=false`；徽标「已停止·可重试」 |
| loading | `E_MORE_GONE` | — | complete | `hasMore=false`；`auto=false`；清 error |
| loading | `E_TIMEOUT` | 期间无 COMMIT | error(timeout) | 不自动重试；`auto=false` |
| loading | `E_CANCEL` | — | idle | `batch++`（作废回调）；`armed=false`；在途批次回来只更新计数 |
| complete/error | `E_LEAVE_TOP`→`E_TOP` | 用户手势 + 5s 冷却 | loading | 手动重试 |
| 任意 | `E_BINDING`（session/mode 变） | — | idle | `sessionEpoch++`；cancel；清计数；按新模式默认重算 `auto`；重绑监听 |
| 任意 | `E_BINDING`（仅 scroller 换元素、同 session） | — | 不变 | 只重绑监听，**不丢**计数 |
| 任意 | 归属被抢（HMR） | `!ownsRoot()` | disposed | 停一切 timer/observer；不再点击 |
| 任意 | `E_DISPOSE` | — | disposed | 清资源；不写盘、不动 scrollTop |
| disposed | 任意 | — | disposed | no-op |

### 2.4 点名场景
| 场景 | 行为 |
|---|---|
| **连续触顶 3 次** | 3 次「离开 >96px 再回 ≤24px」= 3 个独立 `E_TOP` → 3 批，同时受 1500ms 与「上一批已 commit」约束；同一手势内反复报触顶（惯性/回弹/子像素）= 1 批（`armed` 只在 `E_LEAVE_TOP` 复位）。3 次里 2 次无进展 → complete，不再点。 |
| **加载中取消** | 只能是**批次间协作取消**：宿主 `loadOlder` 无 abort（F6 无 signal），在途 RPC 不能中止。`batch++` 作废回调、`armed=false`、回 idle；在途批次最终 commit 只更新 `rows`，不推进循环。UI 必须说「本次加载仍会完成」。 |
| **返回 0 条** | 无进展第 1 次退避 400ms 重试；第 2 次 complete(no-progress)，本地 `hasMore=false`，自动关闭；宿主按钮还在则留给用户手动（5s 冷却）。**不因「还在顶部」继续点。** |
| **超时** | error(timeout)，不自动重试；若超时后行数才涨（迟到 commit）按成功回 idle。 |
| **锚点漂移** | drift>24 → error(anchor-drift)，本 epoch `auto=false`；**不补偿**（会与 `preserve()` 打架），只上报并落手动。 |
| **切会话** | `E_BINDING`：`sessionEpoch++`、`batch++`、cancel、清计数、按模式默认重算 `auto`；旧回调因 epoch 不符被丢。 |
| **模式切换** | 先 cancel 再 attach（锚点语义变了，跨模式续跑没意义）；`auto` 重新求值，**不写偏好**。 |
| **HMR** | 沿用 `OWNER`/`ownsRoot()`（`lib/client.js:191-198`）：新实例抢归属，旧实例进 disposed 不再点。新实例若见按钮 `disabled`（宿主仍在 loading）→ 进 **loading 观察态**：只等 `disabled` 消失/行数变化，判一次 commit，**不点**。这防「热更把同一页请求两遍」。 |
| **卸载** | 清 timer/rAF/observer/listener → disposed；不写 localStorage、不动 scrollTop、不干扰在途加载。 |

## 3. 防风暴
### 3.1 触顶判定：事件而非状态
```
TOP_ENTER = 24px   与 0.1.x 验收口径一致（测试计划 E-02 用 ≤24px）
TOP_EXIT  = 96px   4× 迟滞，避免 24–96 之间抖动生成一串 E_TOP
DWELL     = 120ms  进入 ≤24 后维持 2 个 rAF 才算触顶
```

判定时机用 **`scrollend`**（宿主自己就在用，chat:1791；Chromium 114+），`scroll`+150ms 去抖兜底。
0.1.4 每个 scroll 事件都跑一遍 `mainScroller()`+`findParts()`（两轮全 DOM 查询，F12），一次加载
产生几十个事件里绝大多数不可能触顶；`scrollend` 把每批判定从 O(事件) 降到 O(1)。
`armed` 只在 `E_LEAVE_TOP` 后置 true——**"在顶部"本身不是触发条件**，这是 0 条/超时/补偿未落地
三类风暴的最终保险。

### 3.2 冷却 / 去抖 / 单飞
```
MIN_CLICK_INTERVAL = 1500ms  保留 0.1.x 已验收阈值（测试计划 E-03）
COMMIT_COOLDOWN    = 400ms   commit 之后到下次允许点击
GESTURE_WINDOW     = 1200ms  0.1.4 的 3s 太宽
```

0.1.4 的两个实际漏洞：① 3s 内有过**任意** wheel（含向下滚、`deltaY=0` 的横向滚）就算手势；
② `lastClick` 记的是点击前，且没有「上一批已 commit」约束——一批要 4s 时 1.5s 冷却早已过期，
commit 触发的 scroll 会立刻再点。所以改记 `lastCommitAt` 并要求 `now-lastCommitAt ≥ 400ms`。

单飞三层：① controller 的 `inFlight`/`batch`，不依赖 DOM；② **以宿主 `disabled` 为外部真值**：
`disabled` 时不点（0.1.4 已有），且 `disabled` 出现即「宿主确认接单」，超时计时从此刻开始——
否则点击被 F6 的 guard 静默忽略却当成在途；③ 跨实例：`window.__dshcHistory.owner` +
`<html data-dshcRootOwner>`，只有属主能点。

### 3.3 每批校验（S0 → S1）
S0（点前）：`rows`、`flow.getBoundingClientRect().height`、`scroller.scrollTop`、
`anchorKey = 第一个 [data-chat-paging-anchor] 的 data-chat-anchor-key`、
`anchorTop = 该行 rect.top - scroller rect.top`、`hasMore = !!btn`。
稳定窗口：行数连续 **2 rAF + 120ms** 无变化，或 `MAX_SETTLE = 1500ms` 到顶（图片/字体异步增长）。

| 判据 | 阈值 | 理由 |
|---|---|---|
| 行数增加 | `rows1 > rows0` | 单批 ≥50 消息 / ≥2 turn（F7），正常至少十几行 |
| flow 高度增加 | `Δh ≥ 8px` | 多列下 flow 高 = 列高；行距 `--dsh-chat-flow-gap` 默认 6px，一行 ≥~18px，8px 只滤亚像素 |
| 锚点偏差 | `\|top1-top0\| ≤ 24px`（同 `anchorKey`） | 与测试计划 E-01「±24px / 理想 ±1px」一致；一个行高量级 |
| 诊断 | `ΔscrollTop > 0` | 前插时宿主必定增大（F4）；`=0` 且行数增 = 补偿未发生，记 `anchor-uncompensated`，**不阻断** |

行数**减少**（compaction/合并）既不算失败也不算进展：只更新 `rows`，`noProgress++`。
不用 `scroller.scrollHeight` 做主判据：它含 `turnSpacer` 与 fold room（chat:2929），
报纸多列下与「内容增长」不等价。

### 3.4 失败退避与最大重试
```
RETRY_DELAYS = [400ms, 1200ms]  只对 no-progress，且必须等 disabled 消失
MAX_NO_PROGRESS = 2             1 次真失败 + 1 次确认，之后停
MAX_CONSEC_ERRORS = 2           分 error code 计，达到即 error(fatal)，等用户
BATCH_TIMEOUT = 8000ms          与测试计划 E-01 的 8s 轮询一致
```

`noProgress` 在**任何**进展后清零。上限取 2 而非 1：一次远端抖动不该让用户失去自动加载；
不取 3：3 次足以让用户看到「卡住」，且 1.5s×3 已是可察觉的空转。

### 3.5 对现有 24px / 1.5s 的评估
- **够用**：24px 作为「在顶部」的几何容差合理（一个行高量级，缩放/子像素不误判）；1500ms 作为
  两次点击的绝对下限已过验收（E-03），建议原样保留，别推翻既有判据。
- **不够**（按危害排序）：① 没有「上一批已 commit」约束 → 慢批次后必连点；② 没有 re-arm 迟滞 →
  在顶部停留/回弹即反复触发；③ 没有每批校验 → 0 条返回可无限循环（E-03 已把它列为失败项
  「持续到顶无限加载」）；④ 3s 手势窗口不判方向；⑤ `findOlderButton` 兜底（F14）会返回 flow 内
  任意非轮内按钮，宿主换布局就可能误点且状态里看不出来。建议删掉兜底，只留「文案命中」+
  「旧类名 `.older button`」，找不到就**不加载**——宁可自动加载失效，不能误点。
- [风险] 五条单独都不致命，叠加就是「自动加载风暴」的真实成因。

## 4. 锚点保持
### 4.1 谁补偿
`[已证实]` **宿主**：点按钮 → `loadEarlier`（F2）→ `beginPaging()` 记下第一个
`[data-chat-paging-anchor]` 行的 `anchorKey/anchorTop/scrollTop`（F3）→ React 提交 →
`contentCommitted()` → `preserve()` 重测该行 `top` 并写 `scrollTop`，clamp 到 `[0,floor]`（F4）。
`[已证实]` 插件**不应**补偿：宿主 `onScroll`（chat:2438-2447）在 `paging !== null` 期间只
`events.resize()`，既不重测也不重新锚定 → 你多写的那一次会留在原地，与下一帧 `preserve()` 的差值
叠成 2× 偏移。**规则一句话：宿主的滚动条宿主补，插件的滚动条插件补。**

### 4.2 补偿量与校验
插件不需要算补偿量（那是 `preserve()` 的差值），只要三个**校验量**：

```
drift  = |top(row, after) - top(row, before)|   同一 data-chat-anchor-key
jump   = scrollTop(after) - scrollTop(before)   期望 > 0
expect = flowHeight(after) - flowHeight(before) 前插高度（多列下 = 列高增长）
```

`drift ≤ 24 && jump > 0` → 补偿已生效。补偿量与滚动位置**无关**：`target = metrics.top + (top_now -
anchorTop)` 且 `metrics.top = scrollTop`（chat:788-794），顶部与底部都补 delta。真正的风险是两条：
① `[已证实]` **批次在途时用户一动手，宿主就放弃锚点**：`READING_INTENTS`（wheel/touchstart/pointerdown/
keydown/beforematch，chat:1735-1740、:1793-1795）→ `onIntent` → `stopPreserving()`（chat:2455-2465），
commit 时 `preserve()` 返回 null、不补偿 → 内容前插而 `scrollTop` 不动，整屏被推下去 `expect` px。
② `[假设]` 报纸多列下新行被均衡到第 2/3 列时，锚点行位移可能**小于**插入高度 → `jump < expect`：
位置仍稳但 `scrollTop` 增量不再等于内容增量。验证：3 列下触顶自动加载，同时记 `drift/jump/expect`
三次，若 `jump < expect - 24` 即证实。①同时解释了为什么必须「`scrollend` 后再点」、drift 校验为何不可省。

### 4.3 校验方法（可抄进 harness）
```js
function s0(scroller, flow) {
  const row = flow.querySelector("[data-chat-paging-anchor]:not(:empty):not([hidden])");
  const r = row?.getBoundingClientRect();
  return { key: row?.dataset.chatAnchorKey ?? null,
           top: r ? r.top - scroller.getBoundingClientRect().top : null,
           rows: flow.querySelectorAll("[data-chat-flow-key]").length,
           h: flow.getBoundingClientRect().height, st: scroller.scrollTop };
}
// S1 必须按 key 反查——prepend 之后「第一个 paging-anchor」已经换人了
const row1 = flow.querySelector(`[data-chat-anchor-key="${CSS.escape(key)}"]`);
```

`[风险]` 行可能因 compaction 被换掉 → 拿不到 key 时退化为「`scrollTop` 单调不减 + 行数增加」两条弱判据。

### 4.4 「+1183 / +1183」说明什么、不能说明什么
`[已证实]` 样本：`docs/testing.md` 第七节 E-01（0.1.1/0.1.2 各跑一次，208→247 行）。
**说明**：① 一次真实 prepend 后宿主确实把 `scrollTop` 增加了与内容等量的值，阅读位置零跳动；
② 插件没干扰这条链路（F13：0.1.4 只读 `scrollTop`），报纸 3 列下也不干扰；③ 批增量是 1183px 量级，
可作阈值标定的量级参考。

**不能说明**：
1. **不能证明自动加载路径**：自动加载在 `scrollTop ≤ 24` 触发，而该实测 `scrollTop=2012 /
   scrollHeight=2844`（≈到底），前置条件写的是「`scrollTop` 不在顶部」
   （`eng/tasks/T-20261109-001/evidence/test-plan.md` E-01）。顶部场景按 §4.2 的公式与底部同构，但没有实测样本。
2. **不能区分补偿来源**：在底部时「内容前插 + 底部保持」与「`preserve()` 锚定首行」都得到
   `+1183/+1183`，两个数字完全一样。要区分只能在顶部做一次。
3. **不能证明多列下的插入位置**：1183 是列高差；均衡分栏把新行摊到各列，插入点不止一处，
   它不说明「新内容都在锚点之上」这个 `preserve()` 前提在多列下仍成立。
4. **不能外推**：1 次样本（同条件重复 2 次），没有 0 条/超时/失败/连续触顶/取消/多批连跑。
5. **不能证明两数同容器**：0.1.4 的 `bindScroll` 取**第一个** `[data-conversation-scroll]`（F12），
   有子智能体栏时可能不是主会话。观测必须同时打印
   `closest("[data-conversation-session]").dataset.conversationSession`。

## 5. 一键加载全部
```ts
loadAll(opts?: { signal?: AbortSignal }): Promise<LoadAllResult>;
type LoadAllResult =
  | { ok: true;  reason: "exhausted" | "budget"; batches: number; rows: number }
  | { ok: false; reason: "cancelled" | "no-progress" | "anchor-drift" | "timeout" | "binding-lost";
      batches: number; rows: number; at: number };
```

**循环**：串行 `step()`——采 S0 → 等 `retryAt`/`COMMIT_COOLDOWN` → 点 → 等 commit/超时 → 校验；
失败按 §3.4 退避重试，不并发。

**终止条件**（先到先停，全部外部可判定）：① `E_MORE_GONE`（按钮消失）→ `ok/exhausted`；
② 连续无进展 = 2 → `no-progress`；③ 锚点漂移 >24px 出现 2 次 → `anchor-drift`（第 1 次只告警继续，
避免一次抖动打断整跑）；④ `MAX_TOTAL_BATCHES=200` 或 `MAX_WALL=90s` → `ok/budget`（安全阀；实测
274 轮会话一批就够，真实场景不该触发）；⑤ `signal.aborted`/`cancel()` → `cancelled`；
⑥ 会话或模式变化 → `binding-lost`（**不回滚**已加载内容）。

**取消语义**：批次边界协作取消（§2.4）；已加载内容不回滚、不重载；在途那批照常落地，只记数。
UI 必须写「已停止（已加载 N 行）」而不是「已取消加载」，否则用户以为在途那批被撤了。

**中途失败**：停在 `error` + `ok:false`，`rows`/`batches` 保留；面板给「继续」→ 再 `loadAll()`，
**不清零计数**，从当前 `hasMore` 续。不自动续跑：既是需求（不得无限循环），也因为失败原因
（网络/服务端）不该由插件替用户赌。`loadAll` 期间与结束后都保持 `auto=false && armed=false`，
直到用户 `E_LEAVE_TOP`——否则刚好停在顶部会立刻再自动加载一批，看起来像「停不下来」。

## 6. 与三种模式的接口
```ts
interface HistoryPolicy {
  autoDefault: boolean;                            // A false / B true / C true
  triggerSource: "host-scroller" | "visible-pane";  // A/B: host-scroller；C: visible-pane
  anchorOwner: "host" | "host+assist";             // A/B: host；C 的 pane 侧另算
  loadSource: "shared";                            // 恒定：按 sessionId 单例
  onBatchCommitted(b: BatchResult): void;          // 布局策略钩子
  canAutoNow(binding: LayoutBinding): boolean;     // 模式自己的额外守卫
}
```

- **A 报纸（默认关）**：`triggerSource="host-scroller"`，锚点全交宿主，插件只校验+停止。
  默认关，但**一键加载全部与手动按钮始终可用**（需求冻结项）。
- **B 无缝（默认开）**：内容插入改变列映射。若不接管 `scrollTop`，`preserve()` 把 `s` 增大 delta，
  而列映射 `[s+cH, s+cH+H)` 随之整体后移 → 视觉上「接缝跳了一屏」，与「接缝固定、连续移动」冲突。
  `[风险]` 无缝下「自动加载」与「不接管 scrollTop」语义上不可同时成立。接口给两条路：
  (a) 首版 `canAutoNow` 限制为「跟随态/用户停在底部」才允许；(b) 将来若接管 scrollTop，必须接
  `onBatchCommitted` 在**同一帧**重算映射，并把 §4.2 的 drift 校验升级为硬门。建议总文档写成
  「默认开 + 首版守卫 (a)」。
- **C 复制（默认开）**：多副本一源。`HistorySource` 按 `sessionId` 单例：
  `subscribe(snapshot)` / `load(): Promise<BatchResult>` / `inFlight`。**single-flight 在 source 层**，
  不在 pane 层——两个 pane 同时触顶只产生一次 `load()`，另一次拿到同一个 promise。触发来自 pane 时
  **不得**写宿主 `scrollTop`（会让主会话跳到顶部），只发 `load()`；pane 自己的 `scrollTop` 由插件补。

## 7. 状态模型与接口草案
```ts
interface HistoryController {
  attach(binding: LayoutBinding): void;   // 会话/模式/容器变化 → 内部先 cancel
  detach(): void;
  readonly snapshot: HistorySnapshot;
  subscribe(fn: (s: HistorySnapshot) => void): () => void;
  requestAuto(reason: "top" | "mode-on"): void;
  loadAll(opts?: { signal?: AbortSignal }): Promise<LoadAllResult>;
  cancel(reason: "user" | "session" | "mode" | "dispose"): void;
  retry(): void;
}
interface LayoutBinding {                 // 由 LayoutStrategy 提供
  mode: ModeId; sessionId: string;
  scroller: HTMLElement;                  // 宿主 [data-conversation-scroll]
  flow: HTMLElement;                      // 宿主 [data-chat-flow]
  findOlderButton(): HTMLButtonElement | null;
  sample(): AnchorSample;                 // §4.3
  compensatePane?(pane: HTMLElement, before: PaneAnchor): void;   // 仅 C
}
```

**偏好优先级**（关键：三态，`undefined ≠ false`）：

```ts
STORAGE_KEY_PREFS = "dsh-chat-columns:prefs";  // { v:1, cols:"auto"|"1"|"2"|"3",
                                              //   auto:{ newspaper?:boolean; seamless?:boolean; copy?:boolean } }
effective.auto = prefs.auto[mode] ?? policy.autoDefault
```
1. **用户显式设置 > 模式默认**；`prefs.auto[mode]===false` 时模式默认是 true 也不得开；
2. 模式切换**只重算 `effective`，不写 `prefs`**——这就是「默认值不得覆盖用户偏好」的落地方式；
3. 只有用户显式操作（徽标菜单 / `__dshChatColumns.setAuto(bool)`）才写 `prefs`；
4. 读失败（存储抛错、JSON 坏、版本不符）→ 用默认，**不写回**（0.1.4 的 `readPref` 已是此行为，
   `lib/client.js:78-85`，保持）；
5. 迁移：`dsh-chat-columns:cols`（0.1.x）必须仍可读，新 key 只加不改名，否则升级丢列数记忆；
6. `auto` 是**每模式**三态，不提供「全局 auto」——否则报纸关掉会连带关掉无缝。

**计数口径**（必须进 UI 文案）：`rows = [data-chat-flow-key]` 数量是 DOM 行数，**不是**消息条数
（README 口径说明：1 轮 ≈ 1.1–2.5 行）；进度（可估算时）= `(newestTurn-oldestTurn+1)/newestTurn`，
用 `data-chat-turn`（F8）。`[假设]` turn 编号在会话内从 1 连续，验证：一次 `loadAll` 跑到
`exhausted`，检查 `oldestTurn===1`。不可估算时只显示「已加载 N 行 · 还有更早」，**不显示百分比**；
不要用轨道 mark 数当分母（虚拟列表，F10）。

## 本节的开放问题
1. 批次在途时用户滚动会打掉宿主锚点（§4.2 ①）。自动加载是否该「触顶后静默 300ms 再点」？还是接受偶发整屏跳动？
2. `loadOlder` 失败在 DOM 上完全不可见（F6）。0.2 是否接受「无进展 = 失败」这一近似，还是走
   `ctx.get("sessions")` → `scope(id).conversation`（**未验证可拿**，需先核 sc 的 scope 面）。
3. 无缝模式是否允许接管 `scrollTop`：不允许 → 自动加载靠守卫降级；允许 → 需要新锚点契约。
4. `findOlderButton` 的兜底（F14）是否直接删掉，接受「宿主改结构后自动加载静默失效」？
5. 多 `[data-conversation-scroll]`（子智能体右栏）下，自动加载是否应完全不作用于 embedded 会话？

## 结论清单
1. 自动加载＝**边沿触发（`scrollend` + 120ms dwell）** + 迟滞 re-arm（24/96px），不是「在顶部就加载」。
2. 每批必校验：行数增加、flow 高度 ≥8px、锚点偏差 ≤24px；无进展 2 次即停，退避 400/1200ms。
3. 冷却从「距上次点击 1500ms」改为「距上次**提交** ≥400ms 且距上次点击 ≥1500ms」；手势窗口 3s→1200ms
   并要求方向向上。
4. `scrollTop` 只由宿主补偿，插件只校验不补偿；唯一例外是复制模式的 pane。
5. 取消只能是批次边界协作取消（宿主无 abort）；在途批次照常落地，只记数。
6. 一键加载全部：终止条件全部外部可判定；失败停下保留已加载内容、不自动续跑、继续时不清零。
7. 三模式共用一个 controller，差异只在 `HistoryPolicy`；复制的 single-flight 在 source 层，
   pane 触发时不写宿主 `scrollTop`。
8. 偏好是**每模式三态**，`effective = prefs ?? modeDefault`；模式切换只重算不写盘。
