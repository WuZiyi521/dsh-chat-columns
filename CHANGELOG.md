# 更新记录

## 0.1.5 — 2026-11-09

**主会话识别修正**（0.1.4 复核留下的缺口）。

- **右栏 embedded 会话不再抢主会话**：右栏「子智能体聊天」是 embedded 会话，同样渲染
  `[data-conversation-scroll]`，行数可能超过主会话。0.1.4 用「行数最多」选主，会选中它，
  把主会话的列拆掉、按右栏宽度重算（真实页面复现：主 156 行 / 右栏 244 行 → 主会话 0 列、
  `data-dshc-width` = 右栏 712px）。
  现在优先认宿主 renderer 输出的 `[data-slot="main"]`（`main.conversation` 是公开扩展点名），
  并跳过 `[data-sidebar-chat]` 里的容器；没有 slot 标记（沙盒 / 宿主改版）才退回
  「可见面积最大且含内容行的容器」。
- **`bindScroll` 与排版用同一个容器**：以前是 `document.querySelector` 取第一个滚动容器，
  与 `mainScroller()` 可能不是同一个 → 滚右栏时会在主会话上点「加载更早」。
- 定向回归新增 **R5**：注入 60 行的右栏容器，断言主会话列数不变、右栏不套列。
- 用例里的版本号改为从 `package.json` 读取，升版本不再假失败。

## 0.1.4 — 2026-11-09

**生命周期收口 + 两轮独立审查整改**。

- **实例归属标记**：热更新时旧实例的 disposer 可能晚于新实例 apply 执行，会把新实例刚套上的列清掉
  （实测症状：`api` 在、`state=active`、但一个 flow 都没有列）。现在每个实例只拆自己标记过的 flow。
- **嵌套 flow 排除**：分组座位也带 `data-chat-flow` 且内含 `flow-key`，两个盒子面积几乎相同
  → 会永久判 `ambiguous`、分组会话静默不分栏。现在只认最外层 flow。
- **迟滞**：进入 ambiguous 阈值 85%，恢复阈值 72%，拖侧栏/缩放不再来回抖。
- **ambiguous 稳态**只冻结，但释放已脱离 DOM 的强引用。
- 去掉 `none` 分支的重复释放与一处死代码；回到 hero 时清掉 `data-dshc-width/n`。
- 回归测试 v2（`harness/state-tests.mjs`）重写：每条用例自带前置断言、轮询替代固定 sleep、
  profile 按字节备份恢复、处理 SIGINT/SIGTERM、校验页面身份；用例从 6 条扩到 9 条。

### 0.1.4 复核整改（同日，待正式验收）

只处理复核提出的两项阻塞，未扩大范围、未重跑完整用例集。

- **根节点实例归属保护**（阻塞 1）：新增 `<html data-dshcRootOwner>`，`apply()` 抢占归属，
  `relayout()` / `cleanupLegacyRootVar()` / disposer 都先校验 `ownsRoot()`。
  旧实例 disposer 晚于新实例 apply 时，不再删除新实例的
  `data-dshc / dshcWidth / dshcN / dshcState`。
- **候选范围收窄到主会话滚动容器**（阻塞 2）：`mainScroller()` 先按宿主结构认出装着最多
  `[data-chat-flow-key]` 内容行的 `[data-conversation-scroll]`，`findParts()` 只在其中取
  flow 候选；容器外再大的 flow 也抢不走主会话。面积排序、内容行过滤、嵌套排除、
  ambiguous 迟滞不变。
- **定向回归** `harness/targeted-tests.mjs`（本地无头浏览器，5/5 通过）：外部大 flow 对抗、
  容器内 ambiguous 保留、旧实例 disposer 晚到、单属主卸载全清；
  另有撤掉修复的负向对照（3/5）证明用例有效。详见 `docs/testing.md` 第十一节。
- **已有测试调整**：`state-tests.mjs` 新增 T3b 对抗用例、T1a 干扰面板移入容器内、
  T2 断言补 `dshcRootOwner`；`harness/index.html` 补 `data-chat-flow-key`（沙盒此前会恒判 none）。
  真实 DSH 上的 `state-tests.mjs` 本轮未复跑。
- **文档口径**：README 版本标题与算法说明更新；三种模式统一为**报纸 / 无缝 / 复制**
  （无缝 = 原「传送门」，复制 = 原「分屏」）；历史验收结论与已知限制改为按当前状态描述。

## 0.1.3 — 2026-11-09

**生命周期收口版**（回应裁决第一轮的第 6 条）。

- **空面板不再算候选**：hero / 占位面板同样"可见面积很大"，但没有任何内容行；
  只按面积比会把它当活动会话。现在候选必须含 `[data-chat-flow-key]`。
  （这是回归测试 T4 抓出来的真问题。）
- `relayout()` 的 `!scroller || !flow` 分支：从"只还宽度变量"改为**拆掉所有套过列的 flow**
  （列类、`columnCount`、`columnFill`、`atomic` 标记、变量），不再遗漏 `clear(lastFlow)`。
- disposer 在 `ambiguous` 状态下也能清干净：改用"已套列集合 + lastFlow"兜底，
  不再依赖 `findParts().flow`（该状态下它是 null）。
- 新增可重复的状态机回归测试 `harness/state-tests.mjs`（6 条，见下）。

### 回归测试（真实 DSH，连续两次干净运行均 6/6）

| 用例 | 覆盖 |
|---|---|
| T0 | 基线：active 且套列 |
| T3 | 多面板：只套可见面积最大且有内容的那一个 |
| T1a | active → ambiguous：状态正确、冻结不拆 |
| T1b | ambiguous → 卸载：类/columnCount/atomic/变量/data 属性全清 |
| T4 | 重装后重新打开会话回到 active |
| T2 | active → none：所有套过列的 flow 都被拆干净 |

## 0.1.2 — 2026-11-09

**验收回应版**（0.1.1 为「有条件通过」）。

- **活动面板识别 + 安全降级**：页面里可能同时有多个 `[data-chat-flow]`（轨迹、子代理面板也带这个属性）。
  改为按**可见面积**选当前活动面板；两个候选面积接近（≥85%）时判定为「分不清」，
  **冻结当前布局**、徽标显示「▷ 多面板 · 待定」，不猜也不拆。
- 切换活动面板时，清除上一个面板上的列布局（否则它退到后台还撑着多列）。
- 补充真实环境验收证据：L-01/L-02（长会话 247 行）、E-01（滚到顶自动加载，含位置补偿）。

## 0.1.1 — 2026-11-09

稳定性加固，10 项修复：

- 消息行切断：`break-inside` 下沉到真实行节点（宿主在 flow 里有一层 `display:contents` 包装）
- 列被顶空：只让 ≤420px 的卡片整块不劈开，长消息允许跨列（2 列底差 910px → 76px）
- 自动加载更早：宿主类名被哈希（`EvIC1a_older`），改用结构 + 文案匹配；新增用户手势门控
- 列宽计算计入 40px 列间距；手动列数加 260px 硬下限
- `--dsh-chat-content-width` 改为只写在 flow 自身（宿主会遮蔽根上的值）
- 卸载清理 `<html>` 数据属性；切换会话时还原旧 flow 的变量并 `unobserve` 旧滚动容器
- 徽标去掉 800ms 轮询，改为布局驱动；调试 API 校验输入、容忍禁用存储

## 0.1.0 — 2026-11-08

首个可用版本：按容器宽度自动 1/2/3 列、共用宿主滚动容器、列数记忆、右下角徽标切换。
