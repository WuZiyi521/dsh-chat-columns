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
 *  - 列高由浏览器均衡，不是"一屏一页"，真正的传送门分页留给 P1。
 */
window.__ModuleLoader__.load({
	id: "dsh-chat-columns",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

		const PLUGIN_ID = "dsh-chat-columns";
		const MIN_COL_W = 420;
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
      /* 分隔线在极窄时反而碍眼 */
      @media (max-width: 900px) {
        [data-chat-flow].dshc-flow { column-rule: none; }
      }
      /* 右下角的小控件：一眼看出插件在不在、现在几列 */
      .dshc-badge {
        position: fixed; right: 14px; bottom: 14px; z-index: 2147483000;
        font: 500 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
        letter-spacing: .06em; color: #6b6a63; background: rgba(255,255,255,.82);
        border: 1px solid rgba(0,0,0,.12); border-radius: 999px; padding: 6px 10px;
        cursor: pointer; backdrop-filter: blur(6px); opacity: .55; transition: opacity .15s;
      }
      .dshc-badge:hover { opacity: 1; }
      @media (prefers-color-scheme: dark) {
        .dshc-badge { color:#b9b7b0; background: rgba(28,27,26,.82); border-color: rgba(255,255,255,.14); }
      }
    `;

		function readPref() {
			try {
				const v = localStorage.getItem(STORAGE_KEY);
				return v === "1" || v === "2" || v === "3" ? Number(v) : "auto";
			} catch {
				return "auto";
			}
		}

		function colsFor(width, pref) {
			if (pref !== "auto") return Math.min(pref, MAX_COLS);
			return Math.max(1, Math.min(MAX_COLS, Math.floor(width / MIN_COL_W)));
		}

		function findParts() {
			const scroller = document.querySelector("[data-conversation-scroll]");
			// 正常情况 flow 就在滚动容器里；但会话面板可能有多个（隐藏的、分屏的），
			// 取第一个"真的占了高度"的，取不到再退回全局搜索。
			let flow = null;
			if (scroller) {
				flow = [...scroller.querySelectorAll("[data-chat-flow]")].find((el) => el.clientHeight > 0) || null;
			}
			if (!flow) {
				flow = [...document.querySelectorAll("[data-chat-flow]")].find((el) => el.clientHeight > 0) || null;
			}
			return { scroller, flow };
		}

		/**
		 * 宿主给正文列写死了 `max-width: var(--dsh-chat-content-width)`
		 * （默认 min(100%-32px, 920px)），不分列时这是对的；一旦分 3 列，
		 * 920px 摊成 3 份每列只剩 280px，根本没法读。多列时把这个变量放开
		 * 到整个滚动宽度，单列时原样还回去。
		 */
		function setContentWidth(on) {
			const root = document.documentElement;
			if (on) {
				root.style.setProperty("--dsh-chat-content-width", "calc(100% - 32px)");
			} else if (root.style.getPropertyValue("--dsh-chat-content-width")) {
				root.style.removeProperty("--dsh-chat-content-width");
			}
		}

		function clear(flow) {
			if (!flow) return;
			flow.classList.remove("dshc-flow");
			flow.style.columnCount = "";
			flow.style.columnFill = "";
			delete flow.dataset.dshcCols;
		}

		function relayout() {
			const { scroller, flow } = findParts();
			if (!scroller || !flow) return;
			const n = colsFor(scroller.clientWidth, readPref());
			document.documentElement.dataset.dshcWidth = String(Math.round(scroller.clientWidth));
			document.documentElement.dataset.dshcN = String(n);
			if (n <= 1) {
				clear(flow);
				setContentWidth(false);
				return;
			}
			setContentWidth(true);
			flow.classList.add("dshc-flow");
			flow.style.columnCount = String(n);
			flow.style.columnFill = "balance";
			flow.dataset.dshcCols = String(n);
		}

		/**
		 * 滚到顶自动触发「加载更早」。
		 *
		 * 宿主没有自动加载，只在 hasMore 时渲染一个按钮；它自己那套锚点保持
		 * （beginPaging + preserve）就挂在这个按钮的 onClick 上，所以**点按钮**
		 * 是最安全的路子：位置补偿、loadingOlder 状态全由宿主处理。
		 */
		function findOlderButton(flow) {
			return flow?.querySelector(".older button") || null;
		}

		function apply(ctx) {
			if (typeof document === "undefined") return;
			// 加载标记：排查时先看 <html data-dshc="..."> 有没有，比开控制台快
			document.documentElement.dataset.dshc = "1.0.0";

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
				const attachResize = () => {
					const { scroller } = findParts();
					if (scroller) ro.observe(scroller);
				};
				attachResize();

				// 滚到顶 → 自动加载更早
				let lastClick = 0;
				const onScroll = () => {
					const { scroller: sc, flow: fl } = findParts();
					if (!sc || !fl) return;
					if (sc.scrollTop > 24) return;
					const btn = findOlderButton(fl);
					if (!btn || btn.disabled) return;
					const now = Date.now();
					if (now - lastClick < 1500) return;   // 防连点
					lastClick = now;
					btn.click();
				};
				let scrollHost = null;   // 必须从 null 起，否则 bindScroll 第一次就判定"没变"而不绑
				const bindScroll = () => {
					const sc = document.querySelector("[data-conversation-scroll]");
					if (sc === scrollHost) return;
					scrollHost?.removeEventListener("scroll", onScroll);
					scrollHost = sc;
					scrollHost?.addEventListener("scroll", onScroll, { passive: true });
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
					if (raf) cancelAnimationFrame(raf);
					clear(findParts().flow);
					setContentWidth(false);
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
					const flow = document.querySelector("[data-chat-flow]");
					const n = flow?.dataset.dshcCols || "1";
					badge.textContent = `▥ ${n} 列${pref === "auto" ? " · 自动" : ""}`;
				};
				const tick = setInterval(paint, 800);
				badge.addEventListener("click", (e) => {
					e.preventDefault();
					e.stopPropagation();
					const order = [1, 2, 3, "auto"];
					const cur = readPref();
					const next = order[(order.findIndex((x) => String(x) === String(cur)) + 1) % order.length];
					localStorage.setItem(STORAGE_KEY, String(next));
					relayout();
					paint();
				}, true);
				document.body.appendChild(badge);
				paint();
				return () => {
					clearInterval(tick);
					badge.remove();
				};
			}, "ui: chat columns badge");

			// 调试/手动切换：__dshChatColumns.set(2) 或 .set("auto")
			ctx.effect(() => {
				const api = {
					set(v) {
						const value = v === "auto" ? "auto" : String(Math.max(1, Math.min(MAX_COLS, Number(v) || 1)));
						localStorage.setItem(STORAGE_KEY, value);
						relayout();
						return value;
					},
					get: () => ({ pref: readPref(), applied: document.querySelector("[data-chat-flow]")?.dataset.dshcCols || "1" }),
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
