# dsh-chat-columns 3.0 — 交接文档

> 给下一个空白会话：读完这一份就能接手，不用重新摸索。
> 最后更新：2026-11-11 08:57（Asia/Shanghai）· 版本 **3.5.1** · 本地提交 `f96c5ff`

---

## 0. 一句话现状

3.0 已经能在真实 DSHWeb 上跑：**原生 / 报纸 / 无缝（竖向·横向·翻页）/ 复制** 五种读法都实现了。
报纸和复制经过用户实测认可；无缝的**横向/翻页**刚修完滚轮问题、等用户验证；
**竖向无缝**用户反馈「莫名其妙多出空白」，尚未复现定位（详见 §3.1）。

---

## 1. 路径与环境

| 项 | 值 |
|---|---|
| 项目目录 | `D:\dsh\dsh-chat-columns-3.0` |
| 旧版目录（只读参考，别动） | `D:\dsh\dsh-chat-columns-2.0` |
| profile | `C:\Users\Joel4\.dsh\profiles\0.2.1-alpha.2` |
| 安装方式 | profile 里 `node_modules/dsh-chat-columns-3` → 指向项目目录的 junction；`dsh.profile.bundles` 含 `dsh-chat-columns-3` |
| DSH 宿主 | 0.2.1-alpha.2（安装目录 `C:\Users\Joel4\.dsh-win\versions\0.2.1-alpha.2`） |
| 用户界面 | DSHWeb，`http://127.0.0.1:10727`（launcher 启动；token 在 `D:\DSHL\DSHL\Log1.txt` 最新条目） |
| 用户沟通 | 微信（手机），中文；真实环境验证由用户做 |

**改完代码必须重启 DSHWeb**：`lib/client.js` 是 web 启动时读进内存的，只刷新页面还是旧字节。
DSHWeb 就是当前会话所在的服务，重启会让对话断一下——改完先告知用户，由他重启。

**安装/卸载**（不依赖 `dsh` 在 PATH 上）：

```bash
node scripts/install.mjs --profile 0.2.1-alpha.2
node scripts/install.mjs --uninstall --profile 0.2.1-alpha.2
```

---

## 2. 代码地图（只读这些就够）

```
src/math.js        纯计算：列数、B 的打包/投影（可在 Node 里单测，10 项）
src/adapter.js     宿主边界：主会话识别、几何、主题、样式快照、内容适配(fitContent)、C 的净化
src/indexer.js     消息索引：稳定 ID / 顺序 / 增量变更（唯一的内容观察器，120ms 批处理）
src/history.js     历史状态机：只点宿主「加载更早」按钮，防重复/可重试
src/newspaper.js   A 报纸：CSS 均衡分栏 + 放开 pre/表格（纯 CSS，无测量）
src/seamless.js    B 竖向无缝：粘滞视口层 + 逐条绝对定位 + 逻辑占位层
src/paged.js       B 横向/翻页：浏览器分栏的「纸带」+ 宿主横向滚动
src/mirror.js      C 复制：完整只读副本 × N 栏，各栏独立滚动
src/controller.js  悬浮控制器：模式 / 列数 / 滚动方式 / 每页列数 / 自动加载 / 状态
src/index.js       唯一状态所有者：mount/unmount、模式编排、降级、诊断 API
src/tokens.css     设计令牌（宿主 --dsw-alias-* 优先，深色回退）
src/layout.css     A / B / C 与控制器样式（必须 scoped）
scripts/build.mjs  零依赖构建 src → lib/client.js
scripts/check.mjs  静态检查（包契约/语法/宿主选择器隔离/CSS 作用域/产物新鲜度）
scripts/test.mjs   math 单测（10 项）
scripts/smoke.mjs  最小 DOM 桩 + 契约夹具（17 项：三模式应用/切换/还原/卸载）
scripts/install.mjs  profile 安装器（junction + bundles，带备份）
lib/client.js      产物（提交进仓库，安装即用）
```

### 三条硬约束（别破坏）

1. **宿主选择器只允许出现在 `adapter.js`**：`data-conversation-scroll`、`data-chat-flow`、
   `--dsh-chat-content-width`、`data-composer-seat` 等字面量出现在别的文件 → `npm run check` 直接失败。
   其它模块要用就走 `adapter.HOST.*`。
2. **CSS 全部 scoped**：每条选择器以 `#dshc-root` 或 `[data-dshc...]` 开头，不写裸标签。
3. **对宿主的写入必须走 `adapter.setStyle/setAttr`（带快照）**，退出/切模式能 100% 还原。

---

## 3. 已知问题（按优先级）

### 3.1 竖向无缝「多出很多空白」— **未复现，待定位**（P0）

- 用户 2026-11-11 早反馈：切到「竖向」后多出很多空白。
- `git diff v3.2.2..HEAD -- src/seamless.js src/layout.css src/adapter.js` 为**空**，
  说明竖向引擎自 3.2.2 起没改过 → 要么是变体切换残留，要么是用户说的空白本来就是
  「消息整块不拆 → 列底留白」。
- 让用户按这个顺序验，并要 `__dshc.diagnose().seamless` 的数字：
  1. 刷新页面 → 直接切「无缝」（不动滚动方式）→ 是否还有空白；
  2. 再从「翻页」切回「竖向」→ 是否出现差异；
- `seamless.diagnose()` 字段：`active / H / available / columns / columnWidth / gap / pages / total /
  scroll / maxScroll / items / tall / hidden`。
  `total` 应 ≈ `pages × H`，`maxScroll` 应 = `total - H`，`items` 是消息数。
- 如果是切换残留：在 `index.js` 的 `setVariant()` 里改成 `resolve(true)`（重建 indexer + 重新识别），
  而不是只 `applyMode()`。

### 3.2 横向/翻页的滚轮：3.5.1 已修，**等用户验证**（P0）

- 根因：`paged.js` 的 `ownsScroll()` 把「纸带外层自己」（本来就 `overflow-x:auto`）判成
  「自己会滚、别抢」，于是每个 wheel 事件都被吞掉；拖滚动条能用是因为不走滚轮。
- 修法：判断时 `if (node === host) return false;`。
- 验证：竖向滚轮在「横向」= 线性横移；在「翻页」= 整页跳；`Ctrl+Alt+Num6/8` 前进、`Num4/2` 后退。

### 3.3 每页列数（3.5.1 新增）

- 面板 → 无缝 → 「每页列数」：一屏 / 1 / 2 / 3，默认一屏；`paged.js` 用
  `stepCols` 计算 `pageWidth`，`pages = floor(maxLeft / pageWidth) + 1`，最后一页右对齐。

### 3.4 精细度（用户提过，尚未做）

用户原话：「一些视觉效果以后优化」。候选：列间距/分隔线、栏头、滚动条颜色、暗色对比度、
控制器胶囊与面板的间距、字号。**不要动布局逻辑**。

### 3.5 其他已知限制（README「已知限制」有完整列表）

- 竖向无缝的最小单元只能是「消息」（整条不拆），列底会有留白；
- 横向/翻页靠 `column-fill:auto` 让浏览器切内容，长行会被软换行（`fitContent` 里设的）；
- 宽表被夹进列内（`table-layout:fixed`），列多时偏挤；
- 复制模式是只读副本（按钮不可点）；
- 窄屏 < 768px 强制单列。

---

## 4. 三种无缝变体的实现差异（重要）

| 变体 | 引擎 | 关键实现 | 输入 |
|---|---|---|---|
| `vertical`（默认） | `seamless.js` | 正文列变高度 H 的粘滞视口层；每条消息 `position:absolute + translate3d`；宿主 `::after` 逻辑占位层提供滚动行程；消息按整列高度打包（绝不跨列）；超高消息 `max-height:H` 自滚 | 原生滚轮 |
| `horizontal` | `paged.js` | 正文列变「纸带」：`column-count=总列数` + `column-fill:auto` + `height:H`，宽度 = 总列数×列宽；外层宿主 `overflow-x:auto; overflow-y:hidden` 横向滚动 | 竖向滚轮=线性横移；触控板横滑/Shift+滚轮/横向条/方向键 |
| `paged` | `paged.js` | 同一张纸带，按 `stepCols` 整页平移（`scrollTo({left, behavior:'smooth'})`） | 竖向滚轮=翻页；PageUp/PageDown/Home/End；Ctrl+Alt+小键盘 |

`paged.js` 的 `progress`（`linear` / `page`）决定滚轮语义，`stepCols` 决定每页列数。

---

## 5. 宿主契约（详见 `docs/宿主契约审计.md`）

- 滚动容器 `[data-conversation-scroll]`，会话身份在祖先 `[data-conversation-session]`；
- 正文列 `[data-chat-flow]`（宿主是 `display:flex` + `max-width:var(--dsh-chat-content-width)`）；
- 消息行 `[data-chat-flow-key]`；分组卡片 `[data-chat-group-key]`（内部还有嵌套 flow）；
- 输入区 `[data-composer-seat]`（在滚动容器内部，`position:sticky;bottom:0`）；
- 插槽壳是 `display:contents`（**别把它们当成有盒子的元素**，3.3.x 的重叠就是踩这个）；
- 宿主「加载更早」只在 `hasMore` 时渲染，是列内 `.older > button`；
- 宿主「宽表」用 `100cqw` 撑出正文列 → 多列里必须夹住。

---

## 6. 调试与验收

### 控制台 API

```js
__dshc.diagnose()            // 全量：state / target / geometry / available / newspaper / seamless / paged / mirror / history
__dshc.getState()            // 轻量状态（控制器用）
__dshc.setMode('seamless')   // native | newspaper | seamless | mirror
__dshc.setVariant('paged')   // vertical | horizontal | paged（仅 seamless 生效）
__dshc.setPageStep('2')      // screen | 1 | 2 | 3
__dshc.setColumns('auto')    // auto | 1 | 2 | 3
__dshc.setAutoLoad(true)
__dshc.nextPage() / prevPage() / setPage(2)
__dshc.unmount()
```

`seamless.diagnose()` 看 `pages/total/maxScroll/scroll/items`；
`paged.diagnose()` 看 `active/progress/stepCols/totalCols/pages/page/scrollLeft/scrollable`；
`newspaper.diagnose()` 看 `height/items/columnsEnd/blank`（`blank` 应接近 0）。

### 验收清单

README 的「3. 实测验收清单」就是给用户的操作步骤（T1 默认零干预 / T2 报纸 / T3 无缝三变体 /
T4 复制 / T5 历史加载 / T6 生命周期 / T7 诊断）。每轮交付都要更新它。

### 构建与自检

```bash
npm run build   # src → lib/client.js
npm test        # math 单测 10 项
npm run check   # 静态检查
npm run smoke   # DOM 桩 + 契约夹具 17 项
npm run verify  # 以上全部
```

当前基线：**10 项 + 静态检查 + 17 项全过**（`npm run verify`）。

---

## 7. Git 与发布状态

- 本地分支 `main`，HEAD = `f96c5ff`（3.5.1），工作区干净。
- 回滚标签：`v3.2.2`（移除去段落拆分实验的稳定版）、`v3.4.0`（翻页首次可用）、
  `v3.5.0`（三变体）、`v3.5.1`（滚轮修复）。
- 压缩包备份：`D:\dsh\dsh-chat-columns-3.0-backup-3.2.2.zip`（3.2.2 快照）。
- **远端 GitHub 落后于本地**：`main` 上只到「报纸留白」那一版（`90d25c8`，3.1 时期）；
  服务器代理提交的 README 改动在分支 `server-3.0`；1.0 在 `legacy-1.x`。
  用户说过「先别管 GitHub」，发布由「大肥鱼」（服务器侧）负责——**推之前先问用户**。
- **沙箱里不能直接用 git 联网**：`git-remote-https` 需要命名管道，被沙箱拒绝
  （`cannot create standard input pipe`）；curl 也因 schannel 凭据不可用而失败。
  可行的推送方式是 `D:\dsh\.push-tools\push.js`（用 isomorphic-git 走 Node 的 HTTPS，
  读 `github-token.txt`，强推 main，并在远端保留 `legacy-1.x` / `server-3.0`）。
  令牌文件 `D:\dsh\dsh-chat-columns-3.0\github-token.txt` 已在 `.gitignore` 里，**别提交、别外传**。

---

## 8. 回滚

```bash
cd D:/dsh/dsh-chat-columns-3.0
git reset --hard v3.5.1     # 或 v3.5.0 / v3.4.0 / v3.2.2
npm run build               # 必须重建 lib/client.js
# 然后重启 DSHWeb
```

---

## 9. 下一步（建议顺序）

1. **等用户验证 3.5.1**：横向/翻页滚轮、每页列数；同时要竖向空白的 `diagnose().seamless`。
2. 按数据修竖向空白（若是切换残留 → `setVariant` 改走 `resolve(true)`）。
3. 一轮视觉打磨（§3.4），只动 CSS/间距，不动布局逻辑。
4. 性能：长会话下 `indexer.read()`（每条消息一次 `getComputedStyle`）与复制模式 N 份 DOM 是热点。
5. 发布：征得用户同意后推 GitHub，更新 README 的版本号与 CHANGELOG。

---

## 10. 踩过的坑（别重复）

1. **按段落拆分（3.3.0–3.3.2，已 revert）**：想用 `display:contents` 把消息摊平到段落级来缩小单元。
   真实环境里宿主正文的块被**多层 `display:contents` 插槽壳**包着（壳 0 高却有内容绘制），
   穿透一层还有一层 → 所有单元叠在同一个 y 上。结论：**不拆/不克隆 DOM 时，竖向无缝的最小单元只能是消息。**
2. **代码块不可分片**：宿主 `pre` 带 `overflow-x:auto`（滚动容器），CSS 多列无法切开 → 报纸里必须
   `fitContent()` 放开 overflow + 软换行，否则整块搬家、上一列留空。
3. **宽表出列**：宿主 `.md-table-wide` 用 `100cqw` 撑出正文列，多列里 cqw 取滚动容器宽 → 必须夹住。
4. **滚轮被吞**：判断「谁该滚」时别把纸带外层自己算进去（3.5.1 的 bug）。
5. **沙箱限制**：`git push` / `curl` 联网在沙箱里不可用；`node` 的 fetch 可以。
6. **宿主锚点**：竖向无缝会自己写 `scrollTop`，宿主 `preserve()` 也可能写，极端情况会抖一下；
   `overflow-anchor:none` 已关，但宿主的 JS 补偿还在。
7. **改完必须重启 DSHWeb**，只刷新页面不生效；插件启用/停用后也建议刷新一次。

---

## 11. 协作方式（用户偏好，照做）

- 用中文；回复尽量短（他在手机上看微信）。
- **真实环境验证由用户做**，不要自己搭第二套 DSH 环境；你负责静态检查、单测、构建、冒烟。
- 每轮交付写清：做了什么 / 怎么验（步骤·预期·失败表现）/ 已知风险 / 回滚点。
- 不要猜着改：先给证据（`diagnose()` 数字、截图、代码 diff），再动核心逻辑；
  连续两次猜错就停下要数据。
- 不要把「布局模式」和「元素显示」混在一起改；先保证覆盖，再追求精致。
- 用户否掉过的方向：连续列流 + 横向滚动的「传送门」实现（2.0 时期）、按段落拆分 DOM（3.3.x）。
