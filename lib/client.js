/**
 * dsh-chat-columns · 浏览器半边
 *
 * 目标：把会话正文排成报纸式多列，所有列共用宿主唯一那个滚动容器。
 *
 * 只做插件层：
 *  - 不动 React 树，不搬运节点，只给 `[data-chat-flow]` 加一列数；
 *  - 滚动仍然由宿主的 `[data-conversation-scroll]` 负责，所以锚点恢复、
 *    「加载更早」、输入区折叠这些既有行为都不用碰。
 *
 * 已知边界（见 README）：
 *  - 列数由容器宽度算，MIN_COL_W 420px，上限 3 列；
 *  - 列高由浏览器均衡，不是"一屏一页"，真正的无缝模式留给 0.2.0。
 */
window.__ModuleLoader__.load({
	id: "dsh-chat-columns",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

		const PLUGIN_ID = "dsh-chat-columns";
		const VERSION = "0.1.5";
		const MIN_COL_W = 420;       // 自动分栏的可读性下限
		const HARD_MIN_COL_W = 260;  // 手动指定列数时的硬下限（再窄就没法读了）
		const COL_GAP = 40;          // 必须和 CSS 里的 column-gap 一致
		const MAX_COLS = 3;
		const STORAGE_KEY = "dsh-chat-columns:cols"; // "auto" | "1" | "2" | "3"

		const CSS = `
      /* 多列只在 JS 设了列数之后生效（n>1 才加这个类） */
      [data-chat-flow].dshc-flow {
        /* 关键：宿主的 flow 是 display:flex（.column），CSS 多列对 flex 容器无效，
           必须改回 block；间距靠行自身的 margin，block 下照样生效。 */
        display: block;
        max-width: none;
        column-gap: 40px;
        column-rule: 1px solid color-mix(in srgb, currentColor 8%, transparent);
        /* 行、卡片不许被拦腰切断 */
      }
      [data-chat-flow].dshc-flow > * {
        break-inside: avoid;
        -webkit-column-break-inside: avoid;
      }
      /* 关键取舍：只让"矮卡片"整体不劈开，长消息允许跨列继续。
         把高 1500px 的长消息也设成 avoid，会让一列填不满——实测两列底部相差 850px。
         哪些算"矮"由 JS 打上 .dshc-atomic（见 tagAtomic）。 */
      [data-chat-flow].dshc-flow .dshc-atomic {
        break-inside: avoid;
        -webkit-column-break-inside: avoid;
      }
      /* 分列后每列更窄：代码块/表格/图片不许撑破列宽 */
      [data-chat-flow].dshc-flow pre,
      [data-chat-flow].dshc-flow table,
      [data-chat-flow].dshc-flow img {
        max-width: 100%;
      }
      [data-chat-flow].dshc-flow pre,
      [data-chat-flow].dshc-flow table {
        overflow-x: auto;
      }
      /* 右下角的小控件：一眼看出插件在不在、现在几列 */
      .dshc-badge {
        position: fixed; right: 14px; bottom: 14px; z-index: 2147483000;
        font: 500 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
        letter-spacing: .06em;
        /* 用宿主的设计变量：亮/暗主题由宿主的 body[data-ds-dark-theme] 决定，
           我们跟着走，不自己猜 prefers-color-scheme（宿主主题不一定等于系统主题）。 */
        color: var(--dsw-alias-label-secondary, #6b6a63);
        background: var(--dsw-alias-bg-module-platform, rgba(255,255,255,.82));
        border: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.12));
        box-shadow: var(--dsw-elevation-panel, none);
        border-radius: 999px; padding: 6px 10px;
        cursor: pointer; backdrop-filter: blur(6px); opacity: .55; transition: opacity .15s;
      }
      .dshc-badge:hover { opacity: 1; }
    `;

		function readPref() {
			try {
				const v = localStorage.getItem(STORAGE_KEY);
				return v === "1" || v === "2" || v === "3" ? Number(v) : "auto";
			} catch {
				return "auto";
			}
		}

		/**
		 * 列数 = 能用几列 × 想要几列。
		 *
		 * 关键：列宽不是 width/n，是 (width - (n-1)*gap)/n。只按 width/MIN 算会把
		 * 列压得比下限还窄（实测 1289px 宽算出 3 列，每列只有 403px，低于 420 的可读下限）。
		 * 手动指定列数时用更低的硬下限，但同样不许窄到没法读。
		 */
		function colsFor(width, pref) {
			const fit = (minW) => Math.max(1, Math.floor((width + COL_GAP) / (minW + COL_GAP)));
			if (pref === "auto") return Math.max(1, Math.min(MAX_COLS, fit(MIN_COL_W)));
			return Math.max(1, Math.min(Number(pref), MAX_COLS, fit(HARD_MIN_COL_W)));
		}

		/** 元素在视口里的可见面积（px²）。分不清活动面板时靠它裁决。 */
		function visibleArea(el) {
			const r = el.getBoundingClientRect();
			const w = Math.min(r.right, window.innerWidth) - Math.max(r.left, 0);
			const h = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
			return Math.max(0, w) * Math.max(0, h);
		}

		/**
		 * 找"当前活动"的会话面板。
		 *
		 * 页面里同时存在多个 `[data-chat-flow]`（实测 7–11 个：轨迹面板、子代理面板也带这个属性）。
		 * 0.1.1 是"取第一个有高度的"，依赖 DOM 顺序；0.1.2 改成全局按可见面积选。
		 * 0.1.4 复核指出后者仍有问题：**先全局搜 flow、事后才 closest 找 scroller**，
		 * 一个不属于会话的、面积更大的外部 flow（悬浮层/侧栏/注入节点）会抢走主会话。
		 *
		 * 现在顺序反过来：先按宿主结构认出主会话滚动容器，再**只在它内部**取候选。
		 * 容器外的 flow 根本不参与，无论多大都抢不走。容器内部仍按可见面积排序，
		 * 面积接近时安全降级冻结，不猜。
		 *
		 * @returns {{scroller: Element|null, flow: Element|null, state: "active"|"ambiguous"|"none"}}
		 */
		const AMBIGUOUS_RATIO = 0.85;      // 进入"分不清"的阈值
		const AMBIGUOUS_EXIT_RATIO = 0.72;  // 退出阈值（迟滞，防止在阈值附近来回抖）
		let lastState = "none";

		/**
		 * 主会话滚动容器。
		 *
		 * **不能按「行数最多」选。** 右栏的「子智能体聊天」是 embedded 会话：同一个
		 * ConversationRoot 渲染在 `[data-sidebar-chat]` 里，也有 `[data-conversation-scroll]`。
		 * 它聊得多的时候行数会超过主会话，于是主会话的列被拆掉、按右栏宽度重算
		 * （2026-11-09 在真实页面复现：主 156 行 / 右栏 244 行 → 主会话 0 列）。
		 *
		 * 可靠判据是宿主 renderer 输出的 slot 名：主会话在 `[data-slot="main"]` 里，
		 * `main.conversation` 是公开的扩展点名。没有 slot 标记时（沙盒/宿主改版）退化为
		 * 「排除 embedded 容器、取可见面积最大且含内容行的那个」。
		 */
		function mainScroller() {
			let slotBest = null;   // 命中 [data-slot="main"]：宿主自己声明的主会话
			let areaBest = null;   // 兜底：按可见面积
			for (const sc of document.querySelectorAll("[data-conversation-scroll]")) {
				if (sc.closest("[data-sidebar-chat]")) continue;   // 右栏 / 子智能体：不参与
				const r = sc.getBoundingClientRect();
				if (r.width <= 1 || r.height <= 1) continue;
				if (!sc.querySelector("[data-chat-flow] [data-chat-flow-key]")) continue;   // hero/空会话
				const area = visibleArea(sc);
				if (area <= 0) continue;
				if (sc.closest('[data-slot="main"]')) {
					if (!slotBest || area > slotBest.area) slotBest = { sc, area };
					continue;
				}
				if (!areaBest || area > areaBest.area) areaBest = { sc, area };
			}
			return (slotBest ?? areaBest)?.sc ?? null;
		}

		function findParts() {
			const scroller = mainScroller();
			if (!scroller) return { scroller: null, flow: null, state: "none" };
			const cands = [];
			for (const el of scroller.querySelectorAll("[data-chat-flow]")) {
				const r = el.getBoundingClientRect();
				if (r.width <= 1 || r.height <= 1) continue;
				// 空面板（hero、占位、还没渲染的会话）也是"可见面积"很大的元素，
				// 只按面积比会把它当成活动面板——必须有真实内容行才算候选。
				if (el.querySelectorAll("[data-chat-flow-key]").length === 0) continue;
				// 嵌套 flow 直接排除：分组座位（data-step-process-content）也带这个属性，
				// 且内部含 flow-key；两个盒子面积几乎相同 → 永远判 ambiguous，
				// 分组会话里的分栏会静默失效。
				if (el.parentElement?.closest("[data-chat-flow]")) continue;
				cands.push({ el, area: visibleArea(el) });
			}
			if (!cands.length) return { scroller, flow: null, state: "none" };
			cands.sort((a, b) => b.area - a.area);
			const best = cands[0];
			if (best.area <= 0) return { scroller, flow: null, state: "none" };
			const second = cands[1];
			const ratio = second ? second.area / best.area : 0;
			// 迟滞：已经在 ambiguous 时，要明显分开（< 72%）才恢复，
			// 否则拖侧栏/缩放会让 active ↔ ambiguous 反复切换。
			const threshold = lastState === "ambiguous" ? AMBIGUOUS_EXIT_RATIO : AMBIGUOUS_RATIO;
			if (second && ratio >= threshold) {
				lastState = "ambiguous";
				return { scroller, flow: null, state: "ambiguous" };
			}
			lastState = "active";
			return { scroller, flow: best.el, state: "active" };
		}

		/**
		 * 放开正文列 920px 的上限。
		 *
		 * 真正起作用的是 CSS 里的 `max-width: none`（写在本插件给自己的类上）。
		 * 同时把 `--dsh-chat-content-width` 写到 flow 自己身上：宿主在
		 * `.wSkVaW_body` 上又定义了一份同名变量，根节点写着会被它遮蔽（0.1.0 的写法
		 * 其实从未生效）。写到 flow 上是"就近覆盖"，也顺手让该子树里的后代读到正确值。
		 */
		// 实例归属：热更新时旧实例的 disposer 可能**晚于**新实例 apply 执行，
		// 它会把新实例刚套上的列清掉（实测：api 在、state=active、但一个 flow 都没有列）。
		// 每个实例给自己的 flow 打标记，拆除时只动自己标记过的。
		const OWNER = Math.random().toString(36).slice(2, 10);
		const owns = (flow) => !!flow && flow.dataset.dshcOwner === OWNER;
		// <html> 上的 data-dshc* 同样是所有实例共用的全局状态，也要有归属保护：
		// 热更新时旧实例的 disposer 若晚于新实例 apply 执行，无条件 delete 会把新实例
		// 刚写的版本号 / 宽度 / 列数 / 状态一起抹掉。规则：apply 时抢占归属（最新实例
		// 获胜），只有当前属主才允许写和删这组属性。
		const ROOT_OWNER = "dshcRootOwner";
		const ownsRoot = () => document.documentElement.dataset[ROOT_OWNER] === OWNER;
		const widthTouched = new Set();
		const appliedFlows = new Set();   // 套过列的 flow（可能不止一个：切面板/后台残留）
		let lastFlow = null;
		let paintBadge = null;   // 由徽标 effect 注册；relayout 直接调用，免掉轮询
		function setFlowWidth(flow, on) {
			if (!flow) return;
			if (on) {
				flow.style.setProperty("--dsh-chat-content-width", "calc(100% - 32px)");
				widthTouched.add(flow);
			} else if (widthTouched.delete(flow) || flow.style.getPropertyValue("--dsh-chat-content-width")) {
				flow.style.removeProperty("--dsh-chat-content-width");
			}
		}

		/** 把一个 flow 上的所有痕迹拆干净：列类、columnCount/columnFill、atomic 标记、宽度变量。 */
		function releaseFlow(flow) {
			if (!flow) return;
			// 别的实例（更年轻的那个）正在用这个 flow：不要动它
			if (flow.dataset.dshcOwner && !owns(flow)) return;
			clear(flow);
			delete flow.dataset.dshcOwner;
			setFlowWidth(flow, false);
			appliedFlows.delete(flow);
			widthTouched.delete(flow);
		}

		/** 0.1.0 把变量写在 :root 上；升级到 0.1.1 时把那个遗留值清掉。 */
		function cleanupLegacyRootVar() {
			if (!ownsRoot()) return;
			const root = document.documentElement;
			if (root.style.getPropertyValue("--dsh-chat-content-width") === "calc(100% - 32px)") {
				root.style.removeProperty("--dsh-chat-content-width");
			}
		}

		function clear(flow) {
			if (!flow) return;
			flow.classList.remove("dshc-flow");
			flow.style.columnCount = "";
			flow.style.columnFill = "";
			delete flow.dataset.dshcCols;
			flow.querySelectorAll(".dshc-atomic").forEach((el) => el.classList.remove("dshc-atomic"));
		}

		/**
		 * 给"矮"的行打标：这些行整块保留、不被列边界切断。
		 *
		 * 为什么按高度判定：CSS 没法表达"矮的 avoid、高的 auto"。把所有行都 avoid，
		 * 一条 1500px 的长消息会把整列顶住、另一列空一半（实测差 850px）；
		 * 全都不 avoid，卡片又会被劈开。折中：卡片级别（<= 420px 且不超过列高 45%）保留整体，
		 * 长消息允许跨列——报纸本来就这么读。
		 */
		const ATOMIC_MAX_H = 420;
		function tagAtomic(flow, cols) {
			const colW = (flow.clientWidth - COL_GAP * (cols - 1)) / cols;
			if (!(colW > 0)) return;
			const rows = flow.querySelectorAll("[data-chat-flow-key]");
			for (const el of rows) {
				const h = el.getBoundingClientRect().height;
				const atomic = h > 0 && h <= ATOMIC_MAX_H;
				el.classList.toggle("dshc-atomic", atomic);
			}
		}

		function relayout() {
			// 归属被新实例抢走之后，旧实例排队的 rAF / ResizeObserver / MutationObserver
			// 仍可能触发。此时它既不该写 <html>，也不该再动 DOM，直接短路。
			if (!ownsRoot()) return;
			const { scroller, flow, state } = findParts();
			document.documentElement.dataset.dshcState = state;
			if (state === "ambiguous") {
				// 分不清谁是活动面板：**冻结当前布局**，不猜也不拆。
				// 拆掉可能让正在读的会话突然变回单列，比不动更糟。
				// 但要把已经脱离 DOM 的强引用放掉（否则 appliedFlows 会一直攥着一个旧子树）。
				for (const f of [...appliedFlows]) if (!document.contains(f)) releaseFlow(f);
				paintBadge?.();
				return;
			}
			if (!scroller || !flow) {
				// 会话被卸载 / 回到 hero：把**所有**套过列的 flow 都拆干净再忘掉它们。
				// 只还宽度变量是不够的——类名、columnCount、atomic 标记都得清，
				// 否则这个 flow 再出现时会带着上一轮的列布局。
				const toRelease = new Set(appliedFlows);
				if (lastFlow) toRelease.add(lastFlow);
				for (const f of toRelease) releaseFlow(f);
				lastFlow = null;
				// 回到 hero / 没有会话时，这两个调试属性也要撤掉，否则 <html> 上会留着
				// 上一次的宽度和列数（数据是错的，排查时会误导）
				delete document.documentElement.dataset.dshcWidth;
				delete document.documentElement.dataset.dshcN;
				paintBadge?.();
				return;
			}
			// 换了会话/面板：把上一个 flow 的列布局和变量都还回去（它可能还在 DOM 里，
			// 只是不在前台），否则切走之后它还撑着多列样式
			if (lastFlow && lastFlow !== flow) releaseFlow(lastFlow);
			lastFlow = flow;
			const n = colsFor(scroller.clientWidth, readPref());
			document.documentElement.dataset.dshcWidth = String(Math.round(scroller.clientWidth));
			document.documentElement.dataset.dshcN = String(n);
			if (n <= 1) {
				releaseFlow(flow);
				paintBadge?.();
				return;
			}
			setFlowWidth(flow, true);
			flow.classList.add("dshc-flow");
			flow.style.columnCount = String(n);
			flow.style.columnFill = "balance";
			flow.dataset.dshcCols = String(n);
			flow.dataset.dshcOwner = OWNER;
			appliedFlows.add(flow);
			tagAtomic(flow, n);
			paintBadge?.();
		}

		/**
		 * 滚到顶自动触发「加载更早」。
		 *
		 * 宿主没有自动加载，只在 hasMore 时渲染一个按钮；它自己那套锚点保持
		 * （beginPaging + preserve）就挂在这个按钮的 onClick 上，所以**点按钮**
		 * 是最安全的路子：位置补偿、loadingOlder 状态全由宿主处理。
		 */
		const OLDER_LABEL = /load earlier|加载更早|earlier|更早/i;

		/**
		 * 找「加载更早」按钮。
		 *
		 * 注意：宿主 CSS Modules 把类名哈希了（实测是 `EvIC1a_older`，没有字面 `older`），
		 * 所以不能写 `.older button`——0.1.0 就是因为这个，自动加载**一次都没生效过**。
		 * 现在的策略：先试老写法（兼容旧宿主），再按结构找——直系子节点里的按钮、
		 * 不在任何一轮里、文案像"加载更早"。
		 */
		function findOlderButton(flow) {
			if (!flow) return null;
			const legacy = flow.querySelector(".older button");
			if (legacy) return legacy;
			for (const child of flow.children) {
				const btn = child.querySelector?.("button");
				if (!btn || btn.closest("[data-chat-turn]")) continue;
				const label = (btn.textContent || "").trim();
				if (label.length > 40) continue;
				if (OLDER_LABEL.test(label)) return btn;
			}
			// 最后的兜底：直系子节点里有、且不在任何一轮里的那个按钮（就是它）
			for (const child of flow.children) {
				const btn = child.querySelector?.("button");
				if (btn && !btn.closest("[data-chat-turn]")) return btn;
			}
			return null;
		}

		function apply(ctx) {
			if (typeof document === "undefined") return;
			const root = document.documentElement;
			// 先抢占根节点归属（最新实例获胜），再写全局状态。
			// 这样旧实例随后才跑的 relayout / disposer 都会被 ownsRoot() 挡掉。
			root.dataset[ROOT_OWNER] = OWNER;
			// 加载标记：排查时先看 <html data-dshc="..."> 有没有，比开控制台快
			root.dataset.dshc = VERSION;
			cleanupLegacyRootVar();

			ctx.effect(() => {
				const tag = document.createElement("style");
				tag.dataset.plugin = PLUGIN_ID;
				tag.dataset.pluginCss = `${PLUGIN_ID}/columns`;
				tag.textContent = CSS;
				document.head.appendChild(tag);
				return () => tag.remove();
			}, "ui: chat columns stylesheet");

			ctx.effect(() => {
				let raf = 0;
				const schedule = () => {
					if (raf) return;
					raf = requestAnimationFrame(() => {
						raf = 0;
						relayout();
					});
				};

				// 窗口/侧栏宽度变了：重算列数
				const ro = new ResizeObserver(schedule);
				let observedScroller = null;
				const attachResize = () => {
					const { scroller } = findParts();
					if (!scroller || scroller === observedScroller) return;
					if (observedScroller) ro.unobserve(observedScroller);   // 旧容器已换掉，别留着
					observedScroller = scroller;
					ro.observe(scroller);
				};
				attachResize();

				// 滚到顶 → 自动加载更早
				//
				// 只在"用户自己滚过"之后才代点：宿主的锚点恢复也会写 scrollTop，
				// 不区分来源的话，一次位置补偿就可能触发一串翻页。
				let lastClick = 0;
				let userScrolledAt = 0;
				const markUserScroll = () => { userScrolledAt = Date.now(); };
				const onScroll = () => {
					if (!ownsRoot()) return;             // 旧实例在热更重叠期别抢着点「加载更早」
					const sc = scrollHost;               // 闭包里就有，别再查一次 DOM
					if (!sc || sc.scrollTop > 24) return;
					if (Date.now() - userScrolledAt > 3000) return;   // 不是用户在滚，不动
					const fl = findParts().flow;
					if (!fl) return;
					const btn = findOlderButton(fl);
					if (!btn || btn.disabled) return;
					const now = Date.now();
					if (now - lastClick < 1500) return;   // 防连点
					lastClick = now;
					btn.click();
				};
				let scrollHost = null;   // 必须从 null 起，否则 bindScroll 第一次就判定"没变"而不绑
				const GESTURES = ["wheel", "touchstart", "keydown", "pointerdown"];
				const bindGesture = () => {
					for (const g of GESTURES) scrollHost?.addEventListener(g, markUserScroll, { passive: true });
				};
				const unbindGesture = () => {
					for (const g of GESTURES) scrollHost?.removeEventListener(g, markUserScroll);
				};
				const bindScroll = () => {
					// 必须和排版用同一个容器：以前这里是 document.querySelector 取第一个，
					// 和 mainScroller() 可能不是同一个 → 滚右栏却在主会话上点「加载更早」。
					const sc = mainScroller();
					if (sc === scrollHost) return;
					scrollHost?.removeEventListener("scroll", onScroll);
					unbindGesture();
					scrollHost = sc;
					scrollHost?.addEventListener("scroll", onScroll, { passive: true });
					bindGesture();
				};
				bindScroll();

				// 切会话 / 新会话挂载：flow 节点会被换掉，重新套
				const mo = new MutationObserver(() => {
					attachResize();
					bindScroll();
					schedule();
				});
				mo.observe(document.body, { childList: true, subtree: true });

				schedule();

				return () => {
					ro.disconnect();
					mo.disconnect();
					scrollHost?.removeEventListener("scroll", onScroll);
					unbindGesture();
					if (raf) cancelAnimationFrame(raf);
					// 注意：ambiguous 状态下 findParts().flow 是 null，
					// 所以不能只清"当前 flow"，必须按已套列集合 + lastFlow 全清
					for (const f of [...appliedFlows]) releaseFlow(f);
					if (lastFlow) releaseFlow(lastFlow);
					lastFlow = null;
					// 只有根节点仍归本实例所有时才清全局状态。若新实例已经 apply 并抢占
					// 归属，旧实例不得删除它写的 data-dshc*（0.1.4 复核第 1 条）。
					if (ownsRoot()) {
						const d = document.documentElement.dataset;
						delete d.dshc;
						delete d.dshcWidth;
						delete d.dshcN;
						delete d.dshcState;
						delete d[ROOT_OWNER];
					}
				};
			}, "ui: chat columns layout");

			// 右下角小控件：在不在、几列、点一下切换（1 → 2 → 3 → auto）
			ctx.effect(() => {
				const badge = document.createElement("button");
				badge.className = "dshc-badge";
				badge.type = "button";
				badge.title = "多列视图：点一下切换 1/2/3/自动";
				const paint = () => {
					const pref = readPref();
					const flow = findParts().flow;   // 必须和排版用的是同一个，否则会显示错的列数
					const n = flow?.dataset.dshcCols || "1";
					const state = document.documentElement.dataset.dshcState;
					if (state === "ambiguous") {
						badge.textContent = "▥ 多面板 · 待定";
						return;
					}
					badge.textContent = `▥ ${n} 列${pref === "auto" ? " · 自动" : ""}`;
				};
				paintBadge = paint;
				badge.addEventListener("click", (e) => {
					e.preventDefault();
					e.stopPropagation();
					const order = [1, 2, 3, "auto"];
					const cur = readPref();
					const next = order[(order.findIndex((x) => String(x) === String(cur)) + 1) % order.length];
					try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* 存储禁用时只影响记忆 */ }
					relayout();
					paint();
				}, true);
				document.body.appendChild(badge);
				paint();
				return () => {
					if (paintBadge === paint) paintBadge = null;
					badge.remove();
				};
			}, "ui: chat columns badge");

			// 调试/手动切换：__dshChatColumns.set(2) 或 .set("auto")
			ctx.effect(() => {
				const api = {
					set(v) {
						const n = Math.round(Number(v));
						const value = v === "auto" ? "auto" : String(Math.max(1, Math.min(MAX_COLS, Number.isFinite(n) ? n : 1)));
						try { localStorage.setItem(STORAGE_KEY, value); } catch { /* 存储禁用时只影响记忆 */ }
						relayout();
						paintBadge?.();
						return value;
					},
					get: () => ({ pref: readPref(), applied: findParts().flow?.dataset.dshcCols || "1", state: document.documentElement.dataset.dshcState }),
					refresh: relayout,
				};
				window.__dshChatColumns = api;
				return () => {
					if (window.__dshChatColumns === api) delete window.__dshChatColumns;
				};
			}, "ui: chat columns debug api");
		}

		exports.apply = apply;
		exports.inject = [];
		return module.exports;
	},
});
