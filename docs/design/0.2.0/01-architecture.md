# 01 · 架构总览

> 0.2.0 的目标不是「CSS 多列插件加两个开关」，而是**一个阅读器内核 + 三种布局策略**：
> 同一份会话内容，三种组织方式，各自解决一种读法。
>
> 本文是总纲：定义边界、依赖方向和硬约束。具体机制在 03–07 章。
> 标记约定：`[已证实]`（有代码/实测/测试支撑，附证据）、`[假设]`（合理但未验证，附验证办法）、
> `[风险]`。**没有第三种状态**——不确定就写不确定。

---

## 0. 一页结论

1. **七个模块，一条依赖方向**：`ReaderCore → (HostAdapter, ConversationSource, HistoryController,
   LayoutStrategy) → ElementRenderer`。下层不许回调上层，跨层只走 Core 注入的句柄。
2. **DOM 是契约，宿主服务是可选加速**。`[已证实]` 插件能 `ctx.get("sessions")` 读到
   `hasMore/loadingOlder` 与节点模型，但那是内部服务、不是插件契约（详见 §4.2）。
   0.2 必须能在「只有 DOM」的宿主上完整工作；服务只用来提升保真度，且**降级必须可见**。
3. **滚动所有权必须显式声明**，三种模式各自不同（§5）。「插件偷偷接管宿主 `scrollTop`」是红线。
4. **0.2 只排版「活动线程」= 主会话容器**（`HostAdapter.current()`）。ThreadContext 从第一天就按容器
   分片（`WeakMap<Element, ThreadContext>`），其他容器**可以有状态但一律不排版、不加载、不写 DOM**。
   多线程同时排版留到 0.3 之后——届时只改调度，不改分片。**验收口径以本节为准**（与 07 R1 已对齐）。
5. **模式互斥、可切换、可中途拆装**；切换 = 拆掉旧策略 → 装新策略，不留残余。
6. **0.3 的事情不提前做**：元素级渲染（图片/代码块/表格）只留接口，不实现策略。

---

## 1. 非目标（写清楚，防止膨胀）

| 不做 | 原因 |
|---|---|
| 多线程同时排版 | 0.2 只要求单活动会话；多线程只保留状态隔离的**结构** |
| 元素级显示优化（链接/图片/代码/表格/审批卡） | 属于 0.3；0.2 只保证「不破坏」 |
| 接管宿主滚动做「翻页」或「虚拟列表」 | 红线；无缝模式也只在证明可行后才碰（见 04） |
| 自行请求会话历史（REST） | 没有授权路径；只能经宿主按钮/服务 |
| 持久化历史加载进度、滚动位置 | 宿主已有位置记忆；进度不可信（会话会变） |
| 为「以后可能的第四种模式」提前抽象 | 过度抽象；三种模式共用一套接口即止 |

---

## 2. 术语

- **线程（Thread）**：一个会话在一次浏览上下文里的实例。key = 会话 id（`[data-conversation-session]`）
  优先，拿不到时退回滚动容器元素（WeakMap）。**0.2 只有「活动线程」会被排版**。
- **模式（Mode）**：`newspaper | seamless | duplicate`。用户选择，持久化。
- **策略（Strategy）**：模式的实现体，实现统一的 `LayoutStrategy` 接口。
- **源（Source）**：内容来源，`ConversationSource` 的两个实现（DOM / 服务）。
- **宿主面（Surface）**：`HostAdapter` 暴露给上层的宿主能力，上层**只能**通过它接触宿主 DOM。

---

## 3. 模块边界

```
                 ┌──────────────────────────────┐
                 │           ReaderCore          │  生命周期 / 配置 / 模式切换 / 实例归属
                 └───┬───────┬──────────┬───────┘
        ┌────────────┘       │          └────────────┐
        ▼                    ▼                       ▼
 ┌─────────────┐     ┌────────────────┐     ┌──────────────────┐
 │ HostAdapter │     │ConversationSource│    │ HistoryController│
 └─────────────┘     └────────────────┘     └──────────────────┘
        ▲                    │                       │
        └──────────┬─────────┴───────────┬───────────┘
                   ▼                     ▼
          ┌─────────────────┐   ┌──────────────────┐
          │ LayoutStrategy  │──▶│ ElementRenderer  │
          │ 报纸 / 无缝 / 复制 │   │ （0.2 只有一种）   │
          └─────────────────┘   └──────────────────┘
                   ▲
          ┌─────────────────┐
          │  ThreadContext   │  按线程分片的状态（Core 持有，注入给策略）
          └─────────────────┘
```

**依赖规则**（违反即架构错）：

1. 只有 `ReaderCore` 知道「现在是什么模式」。
2. 只有 `HostAdapter` 碰宿主 DOM；策略只碰自己创建的容器和源产出的节点。
3. `HistoryController` 不知道模式；策略通过 `policy` 声明需求，Core 负责接线。
4. `ElementRenderer` 不知道布局；策略不知道元素类型。
5. 任何模块都不许持有全局单例状态；状态住在 `ThreadContext`。

### 3.1 各模块的职责与**非职责**

| 模块 | 负责 | **不负责** |
|---|---|---|
| **ReaderCore** | 装配、模式切换、用户偏好、HMR/卸载、实例归属、错误收口 | 不解析 DOM、不排版、不加载历史 |
| **HostAdapter** | 认主容器、会话/视图变化订阅、滚动读写、锚点快照、`requestOlder()`（代点按钮） | 不做布局决策，不缓存内容 |
| **ConversationSource** | 把「当前会话」变成 `ContentModel`（有序行 + 版本号），订阅增量 | 不做只读化、不做滚动 |
| **LayoutStrategy** | 声明 `scrollOwnership` / `autoLoad` 默认值；mount/update/unmount；把 `ContentModel` 变成可读版面 | 不碰宿主滚动（除声明的写入额度） |
| **HistoryController** | 单飞、冷却、批次校验、取消、进度与状态 | 不决定「什么时候触发」（策略声明边沿，Core 调用） |
| **ElementRenderer** | 行 → DOM 的**唯一**渲染入口；只读化白名单 | 不决定行与行的布局关系 |
| **ThreadContext** | 每线程状态分片、持久化键、会话切换时的取舍 | 不做跨线程协调（0.2 不做） |

---

## 4. 内容来源：DOM 是契约，服务是加速

这是 0.2 最关键、也最容易被写错的一条。

### 4.1 两种实现，一个模型

```ts
interface ContentModel {
  readonly version: number;      // 每次内容变化 +1，视图据此增量
  readonly rows: Row[];          // 有序列（seq/order 来自宿主）
  readonly hasMore: boolean | null;   // null = 不知道
  readonly complete: "full" | "partial";  // partial = 可能缺内容（折叠 JSON、hidden 行）
}
```

- **`DomSource`**（契约实现）：扫 `[data-chat-flow]` 的行，读 DOM 结构。
  `[已证实]` 会缺内容：`JsonBlock` 折叠时不渲染 payload、展开后截断 20000 字符；
  带 `hidden` / `hidden="until-found"` 的行被摘掉。→ `complete = "partial"`。
- **`ServiceSource`**（加速实现）：`ctx.get("uiConversation").binding(id).target("chat")`
  拿 `{order, nodes}`，`ctx.get("sessions")` 拿 `hasMore/loadingOlder/openState`。→ `complete = "full"`。

### 4.2 边界裁决

- **`ctx.get(...)` 不是对外契约**：宿主内部服务，跨版本可能改名或消失，且 `ctx.sessions`
  这种属性访问会直接抛错（已实测）。所以：
  - 只在**启动时探测一次**，探测失败就永久降级到 `DomSource`，不重试、不刷日志；
  - `ServiceSource` 失败时**静默退回** `DomSource`，但 UI 必须显示「降级快照」；
  - 0.2 的发版验收**不依赖** `ServiceSource`（见 07 §验收）。
- **两者产出同一个 `ContentModel`**，渲染器只有一套（多一个通用行渲染器，不是第二套系统）。
- **不让服务参与布局**：`hasMore` 可以来自服务（更准），但布局只吃 `ContentModel`。

> `[风险]` 若宿主在 0.2.x 移除该服务，复制模式从 `full` 掉到 `partial`，这是**功能降级不是崩溃**——
> 但必须让用户看得见，否则「看起来完整、实际缺内容」比崩溃更坏。

---

## 5. 滚动所有权（红线表）

| 模式 | 宿主 `scrollTop` | 自己容器的滚动 | 依据 |
|---|---|---|---|
| **报纸** | **只读，0 写** | 无（共用宿主容器） | 0.1.x 已验证 |
| **无缝** | **只读，0 写**（P1 若证明必须写，单独开分支并显式记录） | 无 | 04 §3.4/§3.5：宿主有两条写通道（paging 每批一次、折叠批次逐帧自纠），且批次在途的手势会打掉补偿 |
| **复制** | 不碰 | 各栏独立 `overflow` | 05 §6 |

- `HostAdapter` 是唯一能执行 `scrollTop` 写入的模块，且写入必须先查表：该模式是否允许、额度多少。
- `[已证实]` 宿主会把任何非自己写入的 `scrollTop` 变化（>0.5px）当成「读者移动」，
  重置跟随意图并保存位置（`chat:2153`）。所以「写一次」不是免费的，会改变宿主状态。

---

## 6. 状态模型

```ts
interface ReaderState {            // 全局（单例，但很小）
  mode: Mode;                      // 当前模式
  prefs: Record<Mode, ModePrefs>;  // 每模式三态：autoLoad: "on"|"off"|"inherit"、cols
  activeThread: ThreadKey | null;
  status: "idle"|"switching"|"error";
}

interface ThreadState {            // 每线程（ThreadContext 分片）
  key: ThreadKey;
  mode: Mode;                      // 该线程上次用的模式（0.2 默认跟随全局）
  cols: number | "auto";
  history: { state: "idle"|"loading"|"complete"|"error"; loaded: number; }
  strategy: StrategyRuntime | null;
}
```

优先级（写死，避免歧义）：**USER_PREF > THREAD_OVERRIDE > MODE_DEFAULT**。
`autoLoad` 默认值：报纸 `false`、无缝 `true`、复制 `true`。用户显式设过就不再被默认值覆盖。

---

## 7. 数据流

```
宿主 DOM 变化 ──MutationObserver/订阅──▶ HostAdapter
                                        │  (active thread 变化 / 会话切换 / 视图切换)
                                        ▼
                                  ConversationSource ──▶ ContentModel(version++)
                                        │
                                        ▼
   HistoryController ◀── policy/边沿 ── ReaderCore ──▶ LayoutStrategy.update()
        │  (单飞、批次校验)                            │
        └──▶ HostAdapter.requestOlder() ──▶ button.click()
                                                       ▼
                                              ElementRenderer.render(row)
```

三条硬规则：
1. **渲染是单向的**：`ContentModel → DOM`，任何视图不许反向改模型。
2. **增量靠 version**，不靠 diff DOM；同一批提交内 N 个视图共用同一个 version。
3. **副作用只在边界**：Observer/定时器/监听器的创建与释放都在 `mount/unmount` 成对出现。

---

## 8. 与 0.1.x 的关系

- 0.1.5 的报纸实现**原样搬进** `NewspaperStrategy`，行为不变（P2 的验收标准就是「零回归」）。
- 0.1.5 的 `mainScroller` / 归属保护 / ambiguous 冻结 → 变成 `HostAdapter.current()` 与 Core 的实例归属。
- 0.1.5 的「滚到顶代点按钮」→ 收进 `HistoryController`，**仍然只能 `button.click()`**：
  `[已证实]` 锚点补偿绑在按钮 `onClick` 的 `beginPaging()` 上，直接调 `session.loadOlder()`
  不会补偿，会整屏下跳（03 §5）。

---

## 9. 章节间的一致性裁决

各节独立写作，出现过分歧或不同口径的地方，以本表为准：

| 事项 | 各节原口径 | 裁决 |
|---|---|---|
| 主会话识别 | A/C 均给 `[data-slot="main"]`；0.1.5 已落地 | ✅ 采纳，作为唯一判据；无 slot 时才退回面积 |
| 复制模式内容源 | C 选「服务优先、DOM 降级」；A 倾向「DOM 为契约」 | 采纳 C 的顺序 + A 的约束：**DOM 必须能独立跑完**，服务只是加速 |
| 无缝路线 | B 推荐 R2（滑动窗口）；R1 保底 | 采纳 R2 为 P1 主攻方向，R1 作为 go/no-go 失败后的退路 |
| 历史加载触发 | D 用边沿+迟滞；A 观察到按钮点击才补偿 | 两者并存：**边沿判定由策略**，执行永远走按钮 |
| 错误态 | D 要求 error 可恢复；A/D 都确认宿主吞错误 | error 只能用「无进展/超时」近似，文档必须写明这是近似 |
| 线程隔离 | E 按容器分片；C 要求副本不污染行数统计 | 采纳：副本**零宿主 data 属性**，否则会被 `querySelector` 数进去 |

---

## 10. 本节的开放问题

1. ~~无缝模式的「接缝」到底指流切点还是竖缝横移~~ **已定（2026-11-09，维护方）：R2，
   流切点钉在 `y=H`。** P1 只攻 R2；R1 仅作 R2 未过门槛时的退路。
2. `ServiceSource` 是否允许上线？若不允许，复制模式永远带「可能缺内容」标签。
3. `data-slot="main"` / `data-conversation-*` 能否被视为宿主的稳定契约（需要宿主方承诺）？
