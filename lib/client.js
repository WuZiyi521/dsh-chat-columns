/*! dsh-chat-columns 3.1.2 — generated from src/ by scripts/build.mjs. Do not edit. */
window.__ModuleLoader__.load({
	id: "dsh-chat-columns-3",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

		const DSHC = Object.create(null);
		const TOKENS_CSS = "/*!\n * dsh-chat-columns 3.0 — Design Tokens\n * 作用域：#dshc-root 内；宿主令牌优先，缺失时按主题回退。\n * 这里只定义变量与小工具类，禁止裸写全局标签样式。\n */\n\n#dshc-root {\n  color-scheme: light;\n\n  --dshc-bg: var(--dsw-alias-bg-base, #ffffff);\n  --dshc-bg-elevated: var(--dsw-alias-bg-elevated, #ffffff);\n  --dshc-text: var(--dsw-alias-label-primary, #1a1a1a);\n  --dshc-text-2: var(--dsw-alias-label-secondary, #4b4a45);\n  --dshc-text-3: var(--dsw-alias-label-tertiary, #6b6a63);\n  --dshc-border: var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.1));\n  --dshc-border-l2: var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.16));\n  --dshc-hover: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.05));\n  --dshc-accent: var(--dsw-alias-state-business-primary, #3964fe);\n  --dshc-danger: var(--dsw-alias-state-error-primary, #d92d20);\n  --dshc-success: var(--dsw-alias-state-success-primary, #12805c);\n  --dshc-focus: var(--dsw-focus-ring-color, #3964fe);\n  --dshc-thumb: var(--dsh-scrollbar-thumb, rgba(0, 0, 0, 0.26));\n  --dshc-shadow: var(--dsw-elevation-panel, 0 10px 30px rgba(0, 0, 0, 0.16));\n\n  --dshc-radius: var(--dsw-radius-md, 10px);\n  --dshc-radius-sm: var(--dsw-radius-sm, 8px);\n\n  --dshc-font-text: var(\n    --dsw-font-family,\n    var(--dsh-font-family-text-default, -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif)\n  );\n  --dshc-font-mono: var(\n    --dsw-font-family-mono,\n    var(--dsh-font-family-code-default, \"SFMono-Regular\", \"JetBrains Mono\", Consolas, \"Liberation Mono\", Menlo, monospace)\n  );\n  --dshc-font-size: var(--dsh-content-font-size, 14px);\n  --dshc-font-size-sm: 11px;\n  --dshc-font-size-md: 12px;\n\n  --dshc-col-gap: 40px;\n  --dshc-c-gap: 20px;\n  --dshc-pad: 12px;\n  --dshc-z: 40;\n\n  color: var(--dshc-text);\n  font-family: var(--dshc-font-text);\n  font-size: var(--dshc-font-size);\n}\n\n#dshc-root[data-dshc-theme=\"dark\"] {\n  color-scheme: dark;\n\n  --dshc-bg: var(--dsw-alias-bg-base, #1c1b1a);\n  --dshc-bg-elevated: var(--dsw-alias-bg-elevated, #242321);\n  --dshc-text: var(--dsw-alias-label-primary, #f2f1ee);\n  --dshc-text-2: var(--dsw-alias-label-secondary, #c9c7c0);\n  --dshc-text-3: var(--dsw-alias-label-tertiary, #9c9a93);\n  --dshc-border: var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.12));\n  --dshc-border-l2: var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.2));\n  --dshc-hover: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.07));\n  --dshc-accent: var(--dsw-alias-state-business-primary, #6d8cff);\n  --dshc-danger: var(--dsw-alias-state-error-primary, #ff6b60);\n  --dshc-success: var(--dsw-alias-state-success-primary, #4bd1a0);\n  --dshc-focus: var(--dsw-focus-ring-color, #6d8cff);\n  --dshc-thumb: var(--dsh-scrollbar-thumb, rgba(255, 255, 255, 0.3));\n  --dshc-shadow: var(--dsw-elevation-panel, 0 10px 30px rgba(0, 0, 0, 0.5));\n}\n\n/* 数据/状态用等宽字体，正文用系统字体 */\n#dshc-root .dshc-mono,\n#dshc-root .dshc-bar-sub,\n#dshc-root .dshc-col-tag,\n#dshc-root .dshc-status {\n  font-family: var(--dshc-font-mono);\n  font-variant-numeric: tabular-nums;\n}\n\n/* 极细滚动条：只在插件自己的容器内 */\n#dshc-root .dshc-col-body,\n#dshc-root .dshc-panel {\n  scrollbar-width: thin;\n  scrollbar-color: var(--dshc-thumb) transparent;\n}\n\n#dshc-root .dshc-col-body::-webkit-scrollbar,\n#dshc-root .dshc-panel::-webkit-scrollbar {\n  width: 7px;\n  height: 7px;\n}\n\n#dshc-root .dshc-col-body::-webkit-scrollbar-track,\n#dshc-root .dshc-panel::-webkit-scrollbar-track {\n  background: transparent;\n}\n\n#dshc-root .dshc-col-body::-webkit-scrollbar-thumb,\n#dshc-root .dshc-panel::-webkit-scrollbar-thumb {\n  background: var(--dshc-thumb);\n  border: 2px solid transparent;\n  border-radius: 999px;\n  background-clip: content-box;\n}\n\n/* 无动效偏好：关掉全部位移/展开动画 */\n@media (prefers-reduced-motion: reduce) {\n  #dshc-root .dshc-ctl,\n  #dshc-root .dshc-ctl-toggle,\n  #dshc-root .dshc-panel,\n  #dshc-root .dshc-pill,\n  #dshc-root .dshc-switch-ui,\n  #dshc-root .dshc-switch-ui::after,\n  #dshc-root .dshc-ctl-dot {\n    transition: none !important;\n    animation: none !important;\n  }\n}\n";
		const LAYOUT_CSS = "/*!\r\n * dsh-chat-columns 3.0 — Layout & Message Styles\r\n * 作用域约定：\r\n *  - 插件自己的界面：一律挂在 #dshc-root 下；\r\n *  - 宿主元素上的改动：一律带 [data-dshc-*] 标记（由 adapter 快照，可 100% 还原）；\r\n *  - 不写裸标签的全局样式，保证对宿主零污染。\r\n */\r\n\r\n/* ---------------------------------------------------------------- 根容器 */\r\n\r\n#dshc-root {\r\n  position: fixed;\r\n  inset: 0;\r\n  z-index: var(--dshc-z);\r\n  pointer-events: none;\r\n  color: var(--dshc-text);\r\n  font-family: var(--dshc-font-text);\r\n  font-size: var(--dshc-font-size);\r\n  line-height: 1.5;\r\n}\r\n\r\n#dshc-root [hidden] {\r\n  display: none !important;\r\n}\r\n\r\n#dshc-root :focus-visible {\r\n  outline: 2px solid var(--dshc-focus);\r\n  outline-offset: 2px;\r\n}\r\n\r\n/* 只规范化插件自己的盒子；克隆进镜像的宿主内容保持宿主原样 */\r\n#dshc-root .dshc-ctl,\r\n#dshc-root .dshc-ctl-toggle,\r\n#dshc-root .dshc-panel,\r\n#dshc-root .dshc-pill,\r\n#dshc-root .dshc-view,\r\n#dshc-root .dshc-bar,\r\n#dshc-root .dshc-cols,\r\n#dshc-root .dshc-col,\r\n#dshc-root .dshc-col-head,\r\n#dshc-root .dshc-col-body {\r\n  box-sizing: border-box;\r\n}\r\n\r\n/* ---------------------------------------------------------------- 控制器 */\r\n\r\n#dshc-root .dshc-ctl {\r\n  position: absolute;\r\n  top: 72px;\r\n  right: 18px;\r\n  width: 38px;\r\n  pointer-events: auto;\r\n}\r\n\r\n#dshc-root .dshc-ctl-toggle {\r\n  position: relative;\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  justify-content: center;\r\n  gap: 1px;\r\n  width: 38px;\r\n  height: 38px;\r\n  padding: 0;\r\n  color: var(--dshc-text-2);\r\n  background: var(--dshc-bg-elevated);\r\n  border: 1px solid var(--dshc-border);\r\n  border-radius: 12px;\r\n  box-shadow: var(--dshc-shadow);\r\n  opacity: 0.76;\r\n  cursor: pointer;\r\n  transition: opacity 0.12s linear, color 0.12s linear;\r\n}\r\n\r\n#dshc-root .dshc-ctl-toggle:hover,\r\n#dshc-root .dshc-ctl[data-dshc-open=\"true\"] .dshc-ctl-toggle,\r\n#dshc-root .dshc-ctl-toggle:focus-visible {\r\n  opacity: 1;\r\n  color: var(--dshc-text);\r\n}\r\n\r\n#dshc-root .dshc-ctl[data-dshc-open=\"true\"] .dshc-ctl-toggle {\r\n  border-color: var(--dshc-border-l2);\r\n}\r\n\r\n#dshc-root .dshc-ctl-icon {\r\n  display: inline-flex;\r\n  height: 16px;\r\n}\r\n\r\n#dshc-root .dshc-ctl-mark {\r\n  font-size: 9px;\r\n  line-height: 1;\r\n  letter-spacing: 0.04em;\r\n  color: var(--dshc-text-3);\r\n}\r\n\r\n#dshc-root .dshc-ctl-dot {\r\n  position: absolute;\r\n  top: 6px;\r\n  right: 6px;\r\n  width: 6px;\r\n  height: 6px;\r\n  border-radius: 50%;\r\n  background: transparent;\r\n}\r\n\r\n#dshc-root .dshc-ctl[data-dshc-mode=\"newspaper\"] .dshc-ctl-dot,\r\n#dshc-root .dshc-ctl[data-dshc-mode=\"seamless\"] .dshc-ctl-dot,\r\n#dshc-root .dshc-ctl[data-dshc-mode=\"mirror\"] .dshc-ctl-dot {\r\n  background: var(--dshc-accent);\r\n}\r\n\r\n#dshc-root .dshc-ctl[data-dshc-status=\"error\"] .dshc-ctl-dot {\r\n  background: var(--dshc-danger);\r\n}\r\n\r\n#dshc-root .dshc-ctl[data-dshc-status=\"busy\"] .dshc-ctl-dot {\r\n  background: var(--dshc-accent);\r\n  animation: dshc-pulse 1.2s ease-in-out infinite;\r\n}\r\n\r\n@keyframes dshc-pulse {\r\n  0%,\r\n  100% {\r\n    opacity: 0.35;\r\n  }\r\n  50% {\r\n    opacity: 1;\r\n  }\r\n}\r\n\r\n#dshc-root .dshc-panel {\r\n  position: absolute;\r\n  top: calc(100% + 8px);\r\n  right: 0;\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 10px;\r\n  width: 286px;\r\n  max-height: 420px;\r\n  overflow: auto;\r\n  padding: var(--dshc-pad);\r\n  background: var(--dshc-bg-elevated);\r\n  border: 1px solid var(--dshc-border);\r\n  border-radius: 14px;\r\n  box-shadow: var(--dshc-shadow);\r\n  color: var(--dshc-text);\r\n}\r\n\r\n/* 毛玻璃只在支持时启用；不支持就是上面的不透明背景（对比度兜底） */\r\n@supports ((backdrop-filter: blur(10px)) or (-webkit-backdrop-filter: blur(10px))) {\r\n  #dshc-root .dshc-ctl-toggle {\r\n    background: color-mix(in srgb, var(--dshc-bg-elevated) 86%, transparent);\r\n    -webkit-backdrop-filter: blur(12px) saturate(1.2);\r\n    backdrop-filter: blur(12px) saturate(1.2);\r\n  }\r\n}\r\n\r\n#dshc-root .dshc-panel-head {\r\n  display: flex;\r\n  align-items: baseline;\r\n  justify-content: space-between;\r\n  gap: 8px;\r\n}\r\n\r\n#dshc-root .dshc-panel-title {\r\n  font-size: 13px;\r\n  font-weight: 600;\r\n}\r\n\r\n#dshc-root .dshc-panel-sub {\r\n  font-size: var(--dshc-font-size-sm);\r\n  color: var(--dshc-text-3);\r\n}\r\n\r\n#dshc-root .dshc-group {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 5px;\r\n}\r\n\r\n#dshc-root .dshc-label {\r\n  font-size: var(--dshc-font-size-sm);\r\n  color: var(--dshc-text-3);\r\n}\r\n\r\n#dshc-root .dshc-seg {\r\n  display: flex;\r\n  gap: 2px;\r\n  padding: 2px;\r\n  background: var(--dshc-hover);\r\n  border-radius: 9px;\r\n}\r\n\r\n#dshc-root .dshc-seg button {\r\n  flex: 1 1 0;\r\n  min-width: 0;\r\n  padding: 6px 4px;\r\n  font: inherit;\r\n  font-size: var(--dshc-font-size-md);\r\n  color: var(--dshc-text-2);\r\n  background: transparent;\r\n  border: 0;\r\n  border-radius: 7px;\r\n  cursor: pointer;\r\n}\r\n\r\n#dshc-root .dshc-seg button:hover:not(:disabled) {\r\n  color: var(--dshc-text);\r\n}\r\n\r\n#dshc-root .dshc-seg button[aria-pressed=\"true\"] {\r\n  color: var(--dshc-text);\r\n  background: var(--dshc-bg-elevated);\r\n  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);\r\n  font-weight: 600;\r\n}\r\n\r\n#dshc-root .dshc-seg button:disabled {\r\n  opacity: 0.42;\r\n  cursor: not-allowed;\r\n}\r\n\r\n#dshc-root .dshc-switch {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n  font-size: var(--dshc-font-size-md);\r\n  color: var(--dshc-text-2);\r\n  cursor: pointer;\r\n  user-select: none;\r\n}\r\n\r\n#dshc-root .dshc-switch input {\r\n  position: absolute;\r\n  width: 1px;\r\n  height: 1px;\r\n  opacity: 0;\r\n  pointer-events: none;\r\n}\r\n\r\n#dshc-root .dshc-switch-ui {\r\n  position: relative;\r\n  flex: none;\r\n  width: 30px;\r\n  height: 18px;\r\n  background: var(--dshc-border-l2);\r\n  border-radius: 999px;\r\n  transition: background 0.12s linear;\r\n}\r\n\r\n#dshc-root .dshc-switch-ui::after {\r\n  content: \"\";\r\n  position: absolute;\r\n  top: 2px;\r\n  left: 2px;\r\n  width: 14px;\r\n  height: 14px;\r\n  background: #fff;\r\n  border-radius: 50%;\r\n  transition: transform 0.12s linear;\r\n}\r\n\r\n#dshc-root .dshc-switch input:checked + .dshc-switch-ui {\r\n  background: var(--dshc-accent);\r\n}\r\n\r\n#dshc-root .dshc-switch input:checked + .dshc-switch-ui::after {\r\n  transform: translateX(12px);\r\n}\r\n\r\n#dshc-root .dshc-switch input:focus-visible + .dshc-switch-ui {\r\n  outline: 2px solid var(--dshc-focus);\r\n  outline-offset: 2px;\r\n}\r\n\r\n#dshc-root .dshc-status {\r\n  min-height: 16px;\r\n  font-size: var(--dshc-font-size-sm);\r\n  line-height: 1.5;\r\n  color: var(--dshc-text-3);\r\n  overflow-wrap: anywhere;\r\n}\r\n\r\n#dshc-root .dshc-actions {\r\n  display: flex;\r\n  gap: 8px;\r\n}\r\n\r\n#dshc-root .dshc-action {\r\n  padding: 5px 10px;\r\n  font: inherit;\r\n  font-size: var(--dshc-font-size-md);\r\n  color: var(--dshc-text);\r\n  background: var(--dshc-hover);\r\n  border: 1px solid var(--dshc-border);\r\n  border-radius: 8px;\r\n  cursor: pointer;\r\n}\r\n\r\n#dshc-root .dshc-action:hover:not(:disabled) {\r\n  border-color: var(--dshc-border-l2);\r\n}\r\n\r\n#dshc-root .dshc-action:disabled {\r\n  opacity: 0.55;\r\n  cursor: default;\r\n}\r\n\r\n#dshc-root .dshc-note {\r\n  font-size: var(--dshc-font-size-sm);\r\n  line-height: 1.5;\r\n  color: var(--dshc-text-3);\r\n}\r\n\r\n/* 顶部手动「加载更早」胶囊 */\r\n#dshc-root .dshc-pill {\r\n  position: absolute;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 6px;\r\n  padding: 6px 13px;\r\n  font: inherit;\r\n  font-size: var(--dshc-font-size-md);\r\n  color: var(--dshc-text-2);\r\n  background: var(--dshc-bg-elevated);\r\n  border: 1px solid var(--dshc-border);\r\n  border-radius: 999px;\r\n  box-shadow: var(--dshc-shadow);\r\n  transform: translateX(-50%);\r\n  pointer-events: auto;\r\n  cursor: pointer;\r\n  opacity: 0.9;\r\n}\r\n\r\n#dshc-root .dshc-pill:hover {\r\n  opacity: 1;\r\n  color: var(--dshc-text);\r\n}\r\n\r\n#dshc-root .dshc-pill-icon {\r\n  font-size: 12px;\r\n  line-height: 1;\r\n  color: var(--dshc-text-3);\r\n}\r\n\r\n/* ================================================================= A 报纸 */\r\n\r\n[data-dshc-a] {\r\n  column-gap: var(--dshc-col-gap, 40px);\r\n  /* 报纸的列缝：极细、跟随宿主边框色（不引入插件变量，因为这一层在 #dshc-root 外面） */\r\n  column-rule: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.09));\r\n}\r\n\r\n[data-dshc-a] [data-dshc-item] {\r\n  min-width: 0;\r\n  break-inside: avoid;\r\n  -webkit-column-break-inside: avoid;\r\n}\r\n\r\n/* 纯文字的长消息允许跨列（内容里含代码块/表格/媒体的消息不带这个标记） */\r\n[data-dshc-a] [data-dshc-item][data-dshc-long] {\r\n  break-inside: auto;\r\n  -webkit-column-break-inside: auto;\r\n}\r\n\r\n[data-dshc-a] pre,\r\n[data-dshc-a] table {\r\n  max-width: 100%;\r\n}\r\n\r\n[data-dshc-a] pre {\r\n  overflow-x: auto;\r\n}\r\n\r\n[data-dshc-a] img,\r\n[data-dshc-a] video,\r\n[data-dshc-a] canvas,\r\n[data-dshc-a] svg {\r\n  max-width: 100%;\r\n  height: auto;\r\n}\r\n\r\n/* ================================================================= B 无缝 */\r\n\r\n/* 逻辑高度占位层：只提供滚动行程，不显示任何内容 */\r\n[data-dshc-b-host]::after {\r\n  content: \"\";\r\n  display: block;\r\n  width: 100%;\r\n  height: var(--dshc-spacer, 0px);\r\n  margin: 0;\r\n  padding: 0;\r\n  border: 0;\r\n  pointer-events: none;\r\n}\r\n\r\n[data-dshc-b=\"column\"] {\r\n  isolation: isolate;\r\n}\r\n\r\n[data-dshc-b=\"item\"] {\r\n  overflow-x: hidden;\r\n}\r\n\r\n/* 宿主自己的「加载更早」按钮、生成中指示、占位在 B 下会被压到第一列顶端 */\r\n[data-dshc-hide] {\r\n  display: none !important;\r\n}\r\n\r\n/* ================================================================= C 复制 */\r\n\r\n#dshc-root .dshc-view {\r\n  position: absolute;\r\n  display: flex;\r\n  flex-direction: column;\r\n  min-height: 0;\r\n  background: var(--dshc-bg);\r\n  border: 1px solid var(--dshc-border);\r\n  border-radius: 12px;\r\n  box-shadow: var(--dshc-shadow);\r\n  overflow: hidden;\r\n  pointer-events: auto;\r\n}\r\n\r\n#dshc-root .dshc-bar {\r\n  display: flex;\r\n  flex: none;\r\n  align-items: center;\r\n  gap: 10px;\r\n  /* 右侧给控制器的悬浮胶囊让位，否则胶囊会压在「拉取更早历史」按钮上 */\r\n  padding: 8px 118px 8px 14px;\r\n  border-bottom: 1px solid var(--dshc-border);\r\n  background: var(--dshc-bg-elevated);\r\n}\r\n\r\n#dshc-root .dshc-bar-title {\r\n  font-size: var(--dshc-font-size-md);\r\n  font-weight: 600;\r\n  color: var(--dshc-text);\r\n}\r\n\r\n#dshc-root .dshc-bar-sub {\r\n  font-size: var(--dshc-font-size-sm);\r\n  color: var(--dshc-text-3);\r\n}\r\n\r\n#dshc-root .dshc-bar-state {\r\n  flex: 1 1 auto;\r\n  min-width: 0;\r\n  font-size: var(--dshc-font-size-sm);\r\n  color: var(--dshc-text-3);\r\n  text-align: right;\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n}\r\n\r\n#dshc-root .dshc-view[data-state=\"error\"] .dshc-bar-state {\r\n  color: var(--dshc-danger);\r\n}\r\n\r\n#dshc-root .dshc-bar-action {\r\n  flex: none;\r\n  padding: 4px 10px;\r\n  font: inherit;\r\n  font-size: var(--dshc-font-size-md);\r\n  color: var(--dshc-text-2);\r\n  background: var(--dshc-hover);\r\n  border: 1px solid var(--dshc-border);\r\n  border-radius: 8px;\r\n  cursor: pointer;\r\n}\r\n\r\n#dshc-root .dshc-bar-action:disabled {\r\n  opacity: 0.55;\r\n  cursor: default;\r\n}\r\n\r\n#dshc-root .dshc-cols {\r\n  display: flex;\r\n  flex: 1 1 auto;\r\n  gap: var(--dshc-c-gap);\r\n  min-height: 0;\r\n  padding: 12px 14px 14px;\r\n}\r\n\r\n#dshc-root .dshc-col {\r\n  display: flex;\r\n  flex: 1 1 0;\r\n  flex-direction: column;\r\n  min-width: 0;\r\n  min-height: 0;\r\n  border: 1px solid var(--dshc-border);\r\n  border-radius: 10px;\r\n  overflow: hidden;\r\n}\r\n\r\n#dshc-root .dshc-col-head {\r\n  position: sticky;\r\n  top: 0;\r\n  z-index: 2;\r\n  display: flex;\r\n  flex: none;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  gap: 8px;\r\n  padding: 6px 10px;\r\n  border-bottom: 1px solid var(--dshc-border);\r\n  background: var(--dshc-bg-elevated);\r\n}\r\n\r\n#dshc-root .dshc-col-name {\r\n  font-size: var(--dshc-font-size-sm);\r\n  font-weight: 600;\r\n  color: var(--dshc-text-2);\r\n}\r\n\r\n#dshc-root .dshc-col-tag {\r\n  font-size: 10px;\r\n  color: var(--dshc-text-3);\r\n}\r\n\r\n#dshc-root .dshc-col-body {\r\n  flex: 1 1 auto;\r\n  min-height: 0;\r\n  overflow-y: auto;\r\n  overflow-x: hidden;\r\n  padding: 12px;\r\n  container-type: inline-size;\r\n  overscroll-behavior: contain;\r\n  user-select: text;\r\n}\r\n\r\n/* 副本里相邻消息的间距（宿主那套边距依赖正文列的选择器，这里补上） */\r\n#dshc-root .dshc-col-body > [data-dshc-clone] + [data-dshc-clone] {\r\n  margin-top: 16px;\r\n}\r\n\r\n#dshc-root .dshc-empty {\r\n  padding: 28px 8px;\r\n  color: var(--dshc-text-3);\r\n  font-size: var(--dshc-font-size-md);\r\n  text-align: center;\r\n}\r\n\r\n/* 副本是死的：按钮/表单不可点，文字可选、链接可开 */\r\n#dshc-root .dshc-c-dead,\r\n#dshc-root .dshc-col-body [data-dshc-clone] button,\r\n#dshc-root .dshc-col-body [data-dshc-clone] input,\r\n#dshc-root .dshc-col-body [data-dshc-clone] select,\r\n#dshc-root .dshc-col-body [data-dshc-clone] textarea {\r\n  pointer-events: none !important;\r\n  cursor: default !important;\r\n}\r\n\r\n#dshc-root .dshc-col-body [data-dshc-clone] a {\r\n  pointer-events: auto;\r\n  cursor: pointer;\r\n}\r\n\r\n/* ------------------------------------------------------------ 宿主滚动条 */\r\n\r\n[data-dshc-hide-scrollbar] {\r\n  scrollbar-width: none;\r\n}\r\n\r\n[data-dshc-hide-scrollbar]::-webkit-scrollbar {\r\n  width: 0;\r\n  height: 0;\r\n  display: none;\r\n}\r\n\r\n/* ---------------------------------------------------------------- 窄屏 */\r\n\r\n@media (max-width: 767px) {\r\n  #dshc-root .dshc-ctl-toggle {\r\n    width: 32px;\r\n    height: 32px;\r\n    border-radius: 10px;\r\n  }\r\n\r\n  #dshc-root .dshc-ctl-mark {\r\n    display: none;\r\n  }\r\n\r\n  #dshc-root .dshc-ctl {\r\n    width: 32px;\r\n  }\r\n\r\n  #dshc-root .dshc-panel {\r\n    width: min(268px, calc(100vw - 24px));\r\n  }\r\n\r\n  #dshc-root .dshc-cols {\r\n    flex-direction: column;\r\n    overflow-y: auto;\r\n  }\r\n\r\n  #dshc-root .dshc-col {\r\n    min-height: 240px;\r\n    flex: 1 1 auto;\r\n  }\r\n}\r\n";

/* ============================================================ src/math.js */
/**
 * 纯计算层：列数、B 无缝的「按列高打包」与「逻辑位置 → 屏幕位置」投影。
 *
 * 这一层不接触 DOM，可以脱离浏览器直接跑（scripts/test.mjs 会 import 它），
 * 所有与 DSH 无关的临界条件（列宽下限、四舍五入、超高消息）都在这里定死。
 */
DSHC.math = (() => {
  'use strict';

  /** 列间距（与 layout.css 的 column-gap 保持一致）。 */
  const GAP = 40;
  /** 自动列宽的列宽下限。 */
  const AUTO_MIN = 420;
  /** 手动指定列数时的列宽硬下限。 */
  const MANUAL_MIN = 260;
  /** 列数上限。 */
  const MAX_COLUMNS = 3;

  /**
   * 给定可用宽度，最多能放下多少列。
   * 分母必须加上 gap：只算 W / min 会把列宽压到 min 以下。
   */
  function fit(width, minWidth, gap) {
    const w = Math.max(0, Number(width) || 0);
    const min = Math.max(1, Number(minWidth) || 1);
    const g = Math.max(0, gap === undefined ? GAP : Number(gap) || 0);
    return Math.max(1, Math.min(MAX_COLUMNS, Math.floor((w + g) / (min + g))));
  }

  /**
   * 解析最终列数。
   * @param {number} width 可用宽度（CSS px）
   * @param {string|number} setting 'auto' | 1 | 2 | 3
   * @param {boolean} mobile 窄屏强制单列
   */
  function resolveColumns(width, setting, mobile) {
    if (mobile) return 1;
    const value = String(setting);
    if (value === '1') return 1;
    if (value === 'auto') return fit(width, AUTO_MIN, GAP);
    const want = Math.max(1, Math.min(MAX_COLUMNS, parseInt(value, 10) || 1));
    // 手动列数也受硬下限约束：宁可少一列，也不把列压到 260px 以下。
    return Math.min(want, fit(width, MANUAL_MIN, GAP));
  }

  /** 等分列宽（不取整，供测量使用）。 */
  function columnWidth(width, columns, gap) {
    const n = Math.max(1, Number(columns) || 1);
    const g = Math.max(0, gap === undefined ? GAP : Number(gap) || 0);
    return Math.max(0, (Math.max(0, Number(width) || 0) - (n - 1) * g) / n);
  }

  /**
   * B 无缝：把消息按「整列高度 H」打包成页。
   *
   * 规则：
   *  - 一条消息绝不跨列（跨列等于把内容藏到看不见的地方），放不下就另起一列；
   *  - 单条高度超过 H 的消息按 H 计（列内自我滚动），独占自己的列段；
   *  - 每列的纵向坐标是「列序号 × H + 列内偏移」，因此逻辑总高 = 页数 × H。
   *
   * @param {Array<{height: number, gap?: number}>} blocks 按 DOM 顺序的消息高度
   * @param {number} height 列高 H（阅读视口高度）
   * @param {number} gap 默认行间距
   * @returns {{starts: number[], pages: number, total: number, tall: boolean[], heights: number[]}}
   *   starts[i] = 第 i 条消息的「内容起点」逻辑坐标；pages = 页数；total = 逻辑总高
   */
  function pack(blocks, height, gap) {
    const H = Math.max(1, Number(height) || 1);
    const g0 = Math.max(0, gap === undefined ? 0 : Number(gap) || 0);
    const starts = [];
    const tall = [];
    const heights = [];
    let page = 0;
    let used = 0;

    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i] || {};
      const raw = Math.max(0, Number(block.height) || 0);
      // 超高消息：列内只显示一屏，内容由该消息自己的滚动承载，避免与相邻消息重叠。
      const h = Math.min(raw, H);
      const g = i === 0 ? 0 : Math.max(0, block.gap === undefined ? g0 : Number(block.gap) || 0);
      const lead = used === 0 ? 0 : g;
      if (used > 0 && used + lead + h > H + 0.5) {
        page += 1;
        used = 0;
      }
      const lead2 = used === 0 ? 0 : g;
      starts.push(page * H + used + lead2);
      tall.push(raw > H + 0.5);
      heights.push(h);
      used += lead2 + h;
      if (used > H) used = H;
    }

    return {
      starts,
      tall,
      heights,
      pages: page + 1,
      total: (page + 1) * H
    };
  }

  /**
   * B 的屏幕投影：逻辑位置 y 在滚动量 s 下落在第几列、列内多高。
   * 第 c 列显示逻辑区间 [s + cH, s + (c+1)H)。
   */
  function project(y, scroll, height) {
    const H = Math.max(1, Number(height) || 1);
    const r = (Number(y) || 0) - (Number(scroll) || 0);
    const column = Math.floor(r / H);
    return { column, top: r - column * H };
  }

  /**
   * 报纸模式的排版计划：理想列高、可跨列的消息、需要限高的消息。
   *
   * 均衡分栏的列高 = 各列内容高的最大值。两件事会把列底撑出空白：
   *  1. 一条消息整块放不进当前列 → 这一列底部留一截（低风险，可以靠「纯文字消息允许跨列」填上）；
   *  2. 一条比一列还高的消息（长代码块）→ 所有列一起被顶到它那么高，其它列整屏空白。
   * 所以：不含代码块/表格/媒体的长消息允许跨列；比 ideal×minRatio 还高的消息单独限高。
   *
   * @param {number[]} heights 每条消息的自然高度
   * @param {number[]} gaps 每条消息上方的间距
   * @param {number} columns 列数
   * @param {boolean[]} [splittable] 这条消息是否允许跨列（含代码块/表格/媒体的不算）
   * @param {{splitRatio?: number, splitFloor?: number, capRatio?: number, capTarget?: number, capFloor?: number}} [options]
   * @returns {{ideal: number, splitLimit: number, cap: number, markLong: boolean[], candidates: number[]}}
   */
  function columnPlan(heights, gaps, columns, splittable, options) {
    const N = Math.max(1, Number(columns) || 1);
    const opts = options || {};
    const splitRatio = opts.splitRatio === undefined ? 0.5 : opts.splitRatio;
    const splitFloor = opts.splitFloor === undefined ? 320 : opts.splitFloor;
    const capRatio = opts.capRatio === undefined ? 1.35 : opts.capRatio;
    const capTarget = opts.capTarget === undefined ? 0.95 : opts.capTarget;
    const capFloor = opts.capFloor === undefined ? 240 : opts.capFloor;

    let total = 0;
    for (let i = 0; i < heights.length; i += 1) {
      total += Math.max(0, Number(heights[i]) || 0) + Math.max(0, Number(gaps && gaps[i]) || 0);
    }
    const ideal = Math.max(1, total / N);
    const splitLimit = Math.max(splitFloor, ideal * splitRatio);
    const cap = Math.max(capFloor, Math.round(ideal * capTarget));

    const markLong = [];
    const candidates = [];
    for (let i = 0; i < heights.length; i += 1) {
      const h = Number(heights[i]) || 0;
      const canSplit = !splittable || splittable[i] !== false;
      markLong.push(canSplit && h > splitLimit);
      if (h > ideal * capRatio) candidates.push(i);
    }
    candidates.sort((a, b) => (Number(heights[b]) || 0) - (Number(heights[a]) || 0));

    return { ideal, splitLimit, cap, markLong, candidates };
  }

  /** 数值取整到 0.01，避免 transform 里的长小数。 */
  function round(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  return {
    GAP,
    AUTO_MIN,
    MANUAL_MIN,
    MAX_COLUMNS,
    fit,
    resolveColumns,
    columnWidth,
    columnPlan,
    pack,
    project,
    round
  };
})();


/* ============================================================ src/adapter.js */
/**
 * HostAdapter — 唯一允许知道 DSH 宿主 DOM 的模块。
 *
 * 职责：
 *  - 识别主会话：滚动容器、主消息列、消息行、历史按钮、输入区、主题；
 *  - 读取几何信息（阅读视口高度、可用宽度）；
 *  - 样式快照：给宿主元素写内联样式/属性时先备份，退出时 100% 还原；
 *  - C 复制模式的只读节点净化。
 *
 * 约束：
 *  - 不持有业务状态、不做布局决策、不监听业务事件；
 *  - 所有宿主选择器/属性名字面量只允许出现在本文件（scripts/check.mjs 会检查）。
 */
DSHC.adapter = (() => {
  'use strict';

  /** 宿主契约（0.2.1-alpha.2 静态审计确认）。 */
  const HOST = {
    /** 会话滚动容器：真正产生滚动条的那一层。 */
    scroller: '[data-conversation-scroll]',
    /** 会话身份：挂在滚动容器的祖先上。 */
    session: '[data-conversation-session]',
    /** 会话正文列：宿主的 display:flex + max-width 就写在这一层。 */
    column: '[data-chat-flow]',
    /** 消息行。 */
    item: '[data-chat-flow-key]',
    itemKey: 'data-chat-flow-key',
    groupKey: 'data-chat-group-key',
    anchorKey: 'data-chat-anchor-key',
    /** 输入区座位。 */
    composer: '[data-composer-seat]',
    /** 正在跟随最新消息（宿主自己维护）。 */
    followingTail: '[data-chat-following-tail]',
    /** 宿主主题信号。 */
    themeDark: 'data-ds-dark-theme',
    themeSource: 'data-ds-theme-source',
    /** 用户可调正文宽度变量（宿主写在会话 body 上）。 */
    contentWidth: '--dsh-chat-content-width',
    /** C 模式克隆时必须剥掉的身份属性，避免宿主/插件再次把它们当成真实消息。 */
    stripped: [
      'id',
      'for',
      'name',
      'form',
      'autofocus',
      'contenteditable',
      'tabindex',
      'data-slot',
      'data-chat-flow',
      'data-chat-flow-key',
      'data-chat-flow-kind',
      'data-chat-group-key',
      'data-chat-group-part',
      'data-chat-anchor-key',
      'data-chat-node-key',
      'data-chat-turn',
      'data-chat-paging-anchor',
      'data-chat-motion',
      'data-chat-following-tail',
      'data-chat-turn-spacer',
      'data-chat-running',
      'data-conversation-scroll',
      'data-conversation-content',
      'data-conversation-session',
      'data-conversation-region',
      'data-composer-seat',
      'aria-expanded',
      'aria-controls',
      'aria-pressed',
      'onclick',
      'onmousedown',
      'onmouseup',
      'onkeydown',
      'onkeyup',
      'oninput',
      'onchange',
      'onsubmit',
      'onfocus',
      'onblur'
    ]
  };

  /** 插件写在宿主/自身节点上的标记（全部可逆）。 */
  const MARK = {
    instance: 'data-dshc-instance',
    item: 'data-dshc-item',
    long: 'data-dshc-long',
    host: 'data-dshc-host',
    hide: 'data-dshc-hide',
    cloneId: 'data-dshc-clone'
  };

  /** 快照表：元素 → { styles: Map<prop, 原值>, attrs: Set<原名> }。 */
  const snapshots = new Map();

  function isConnected(el) {
    return !!(el && el.isConnected);
  }

  /**
   * 只要还在布局里就算「在场」——**不要求 visibility 可见**。
   * 复制模式会把宿主正文列设为 visibility:hidden（它仍有布局和数据），
   * 如果这里也排除掉，每次点击都会重新识别目标、把镜像视图整个重建一遍。
   */
  function isAttached(el) {
    if (!isConnected(el)) return false;
    return getComputedStyle(el).display !== 'none';
  }

  /** 真正能被看到的元素（用于挑选滚动容器候选）。 */
  function isVisible(el) {
    if (!isConnected(el)) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  /* ------------------------------------------------------------ 样式快照 */

  function entry(el) {
    let item = snapshots.get(el);
    if (!item) {
      item = { styles: new Map(), attrs: new Set() };
      snapshots.set(el, item);
    }
    return item;
  }

  /** 写内联样式并记住原值（同一次生命周期内可反复改）。 */
  function setStyle(el, prop, value) {
    if (!el) return;
    const item = entry(el);
    if (!item.styles.has(prop)) item.styles.set(prop, el.style.getPropertyValue(prop));
    if (value === null || value === undefined || value === '') el.style.removeProperty(prop);
    else el.style.setProperty(prop, String(value));
  }

  function setStyles(el, bag) {
    for (const prop of Object.keys(bag)) setStyle(el, prop, bag[prop]);
  }

  /** 写属性并记住原值；只有 null/undefined 表示「删除」，空字符串是合法属性值（标记属性就靠它）。 */
  function setAttr(el, name, value) {
    if (!el) return;
    const item = entry(el);
    if (!item.attrs.has(name)) item.attrs.add(name);
    if (value === null || value === undefined) el.removeAttribute(name);
    else el.setAttribute(name, String(value));
  }

  /** 还原单个元素；幂等。 */
  function resetEl(el) {
    if (!el) return;
    const item = snapshots.get(el);
    if (!item) return;
    for (const [prop, value] of item.styles) {
      if (value) el.style.setProperty(prop, value);
      else el.style.removeProperty(prop);
    }
    for (const name of item.attrs) el.removeAttribute(name);
    if (el.getAttribute('style') === '') el.removeAttribute('style');
    snapshots.delete(el);
  }

  /** 还原本插件改过的一切；宿主节点被 React 卸载时直接跳过。 */
  function resetAll() {
    for (const el of Array.from(snapshots.keys())) {
      if (el && el.isConnected) resetEl(el);
      else snapshots.delete(el);
    }
    snapshots.clear();
  }

  /* -------------------------------------------------------------- 目标识别 */

  function scrollers() {
    return Array.from(document.querySelectorAll(HOST.scroller));
  }

  /** 最近的一层「有盒子的」祖先（display:contents 的插槽层不算）。 */
  function layoutParent(el, stop) {
    let node = el ? el.parentElement : null;
    while (node && node !== stop) {
      if (getComputedStyle(node).display !== 'contents') return node;
      node = node.parentElement;
    }
    return null;
  }

  /** 列内最外层的 flow（分组卡片里还有嵌套的 data-chat-flow）。 */
  function isNestedFlow(el, root) {
    let node = el.parentElement;
    while (node && node !== root) {
      if (node.matches(HOST.column)) return true;
      node = node.parentElement;
    }
    return false;
  }

  function itemId(el) {
    if (!el) return '';
    const flow = el.getAttribute(HOST.itemKey);
    if (flow) return flow;
    const group = el.getAttribute(HOST.groupKey);
    if (group) return 'group:' + group;
    const anchor = el.getAttribute(HOST.anchorKey);
    if (anchor) return 'anchor:' + anchor;
    return '';
  }

  function itemKind(el) {
    return (el && el.getAttribute('data-chat-flow-kind')) || '';
  }

  function itemOf(node, column) {
    let el = node && node.nodeType === 1 ? node : node && node.parentElement;
    while (el && el !== column) {
      if (el.matches(HOST.item)) return el;
      el = el.parentElement;
    }
    return null;
  }

  function isInsideItem(el, column) {
    if (!el) return false;
    if (el.matches(HOST.item)) return true;
    return itemOf(el, column) !== null;
  }

  /**
   * 空的/占位的消息行。
   * 只做廉价判断（不读 getComputedStyle）：流式输出时每 120ms 会对所有消息调一次，
   * 逐条读计算样式在长会话里是实打实的开销。宿主隐藏行用的是 hidden 属性，够用。
   */
  function isBlank(el) {
    if (!el) return true;
    if (el.hidden || el.hasAttribute('hidden')) return true;
    if (el.childElementCount === 0 && (el.textContent || '').trim() === '') return true;
    return false;
  }

  /**
   * 顶层消息行（不返回嵌在其它消息里的行）。
   * @returns {Array<{el: HTMLElement, id: string, kind: string}>}
   */
  function getItems(column) {
    if (!column) return [];
    const out = [];
    const seen = new Set();
    for (const el of column.querySelectorAll(HOST.item)) {
      if (isNestedFlow(el, column) || isInsideItem(el.parentElement, column)) continue;
      if (!isConnected(el) || isBlank(el)) continue;
      const id = itemId(el);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push({ el, id, kind: itemKind(el) });
    }
    return out;
  }

  /** 主列：滚动容器里最外层、行数最多的 data-chat-flow。 */
  function mainColumnOf(scroller) {
    if (!scroller) return null;
    let best = null;
    for (const el of scroller.querySelectorAll(HOST.column)) {
      if (isNestedFlow(el, scroller)) continue;
      if (!isAttached(el)) continue;
      const rows = el.querySelectorAll(HOST.item).length;
      const r = el.getBoundingClientRect();
      const area = Math.max(1, r.width) * Math.max(1, r.height);
      const score = rows;
      if (
        best === null ||
        score > best.score ||
        (score === best.score && area > best.area)
      ) {
        best = { el, rows, area, score };
      }
    }
    return best === null ? null : { column: best.el, rows: best.rows, area: best.area };
  }

  /**
   * 识别主会话。优先「消息行最多」的滚动容器，平手看可见面积；
   * 前两名行数相同、面积接近时判为 ambiguous，由上层降级为原生。
   * @returns {{scroller: HTMLElement|null, column: HTMLElement|null, reason: string, rows: number}}
   */
  function resolve() {
    const candidates = [];
    for (const scroller of scrollers()) {
      if (!isVisible(scroller)) continue;
      const main = mainColumnOf(scroller);
      if (!main || main.rows === 0) continue;
      const r = scroller.getBoundingClientRect();
      candidates.push({
        scroller,
        column: main.column,
        rows: main.rows,
        area: Math.max(1, r.width) * Math.max(1, r.height)
      });
    }

    if (candidates.length === 0) {
      return { scroller: null, column: null, reason: 'no-conversation', rows: 0 };
    }

    candidates.sort((a, b) => (b.rows - a.rows) || (b.area - a.area));
    const first = candidates[0];
    const second = candidates[1];
    // 两个容器行数一样、面积也接近：分不清主次，不猜。
    if (
      second &&
      second.rows === first.rows &&
      second.area > first.area * 0.85
    ) {
      return { scroller: first.scroller, column: first.column, reason: 'ambiguous', rows: first.rows };
    }
    return { scroller: first.scroller, column: first.column, reason: 'ok', rows: first.rows };
  }

  /** 宿主的「加载更早」按钮：在主列里、不在任何消息行内、外层只是按钮的包装。 */
  function findOlderButton(column) {
    if (!column) return null;
    for (const btn of column.querySelectorAll('button')) {
      if (!isConnected(btn)) continue;
      if (isInsideItem(btn, column)) continue;
      const wrap = btn.parentElement;
      if (!wrap || !column.contains(wrap)) continue;
      if ((wrap.textContent || '').trim() !== (btn.textContent || '').trim()) continue;
      return btn;
    }
    return null;
  }

  function olderWrapper(btn) {
    if (!btn) return null;
    const wrap = btn.parentElement;
    return wrap && wrap.parentElement ? wrap : null;
  }

  function findComposer(scroller) {
    if (!scroller) return null;
    return scroller.querySelector(HOST.composer);
  }

  function followingTail(scroller) {
    return !!(scroller && scroller.querySelector(HOST.followingTail));
  }

  function sessionKey(scroller) {
    if (!scroller) return '';
    const holder = scroller.closest(HOST.session);
    return holder ? holder.getAttribute('data-conversation-session') || '' : '';
  }

  /* ---------------------------------------------------------------- 几何 */

  function readScrollbarWidth() {
    const raw = getComputedStyle(document.body).getPropertyValue('--dsh-scrollbar-width');
    const value = parseFloat(raw);
    return Number.isFinite(value) && value > 0 ? value : 5;
  }

  /**
   * 阅读视口：滚动容器的可见区域，扣掉底部输入区。
   * @returns {{top:number,bottom:number,left:number,right:number,width:number,height:number,composerHeight:number,scrollbarWidth:number}}
   */
  function measure(scroller) {
    if (!scroller) return null;
    const r = scroller.getBoundingClientRect();
    const composer = findComposer(scroller);
    let bottom = r.bottom;
    let composerHeight = 0;
    if (composer) {
      const cr = composer.getBoundingClientRect();
      if (cr.height > 0) composerHeight = cr.height;
      if (cr.height > 0 && cr.top > r.top + 80 && cr.top < r.bottom) bottom = cr.top;
    }
    if (!(bottom > r.top + 120)) bottom = r.bottom;
    return {
      top: r.top,
      bottom,
      left: r.left,
      right: r.right,
      width: r.width,
      height: Math.max(0, bottom - r.top),
      composerHeight,
      scrollbarWidth: readScrollbarWidth()
    };
  }

  /** 正文列真实可用的宽度：跳过 display:contents 的插槽层，扣掉左右 padding。 */
  function availableWidth(column, scroller) {
    let node = layoutParent(column, scroller);
    while (node) {
      const cs = getComputedStyle(node);
      if (node.clientWidth > 0) {
        const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
        return Math.max(0, node.clientWidth - pad);
      }
      node = layoutParent(node, scroller);
    }
    return Math.max(0, (scroller ? scroller.clientWidth : 0) - 32);
  }

  /* ---------------------------------------------------------------- 主题 */

  function parseRgb(color) {
    const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/i.exec(color || '');
    if (!m) return null;
    const alpha = m[4] === undefined ? 1 : Number(m[4]);
    return [Number(m[1]), Number(m[2]), Number(m[3]), Number.isFinite(alpha) ? alpha : 1];
  }

  /** 宿主属性 → 宿主 color-scheme → 背景亮度 → 系统媒体查询。 */
  function detectTheme() {
    const body = document.body;
    const html = document.documentElement;
    if (!body || !html) return 'light';
    if (body.hasAttribute(HOST.themeDark)) return 'dark';
    const source = html.getAttribute(HOST.themeSource);
    if (source === 'dark' || source === 'light') return source;
    const scheme = (getComputedStyle(html).colorScheme || '').trim();
    if (scheme === 'dark') return 'dark';
    if (scheme === 'light') return 'light';
    const rgb = parseRgb(getComputedStyle(body).backgroundColor);
    if (rgb && rgb[3] > 0.05) {
      const luminance = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
      return luminance < 0.5 ? 'dark' : 'light';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function watchTheme(callback) {
    const mo = new MutationObserver(() => callback());
    if (document.body) {
      mo.observe(document.body, { attributes: true, attributeFilter: [HOST.themeDark] });
    }
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [HOST.themeSource, 'style', 'class']
    });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => callback();
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onChange);
    else if (typeof mq.addListener === 'function') mq.addListener(onChange);
    return function dispose() {
      mo.disconnect();
      if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', onChange);
      else if (typeof mq.removeListener === 'function') mq.removeListener(onChange);
    };
  }

  /* ------------------------------------------------------------ 阅读锚点 */

  /** 视口内最靠上的一条消息（by id + 距视口顶的偏移）。 */
  function captureAnchor(scroller, column) {
    if (!scroller || !column) return null;
    const top = scroller.getBoundingClientRect().top;
    for (const item of getItems(column)) {
      const r = item.el.getBoundingClientRect();
      if (r.bottom <= top + 1) continue;
      if (r.top >= scroller.getBoundingClientRect().bottom) break;
      return { id: item.id, offset: r.top - top };
    }
    return null;
  }

  /** 按锚点把滚动位置拉回去（仅用于 A / 原生，B 由无缝引擎自己换算）。 */
  function restoreAnchor(scroller, column, anchor) {
    if (!scroller || !column || !anchor) return false;
    let target = null;
    for (const item of getItems(column)) {
      if (item.id === anchor.id) {
        target = item.el;
        break;
      }
    }
    if (!target) return false;
    const top = scroller.getBoundingClientRect().top;
    const delta = target.getBoundingClientRect().top - top - anchor.offset;
    if (Math.abs(delta) > 1) {
      const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      scroller.scrollTop = Math.max(0, Math.min(max, scroller.scrollTop + delta));
    }
    return true;
  }

  /* ------------------------------------------------------ C 模式：净化副本 */

  /**
   * 只读快照净化：去掉身份属性、表单能力、内联事件与可执行节点。
   * 保留结构与文本，允许选择文字和打开链接。
   */
  function sanitize(root) {
    if (!root) return root;
    const dropped = [];
    const DROP_TAGS = new Set(['script', 'style', 'link', 'meta', 'iframe', 'object', 'embed', 'template']);

    const visit = (node) => {
      for (const child of Array.from(node.children || [])) {
        const tag = child.tagName ? child.tagName.toLowerCase() : '';
        if (DROP_TAGS.has(tag)) {
          dropped.push(child);
          continue;
        }
        for (const name of HOST.stripped) child.removeAttribute(name);
        if (tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea') {
          child.setAttribute('disabled', '');
          child.setAttribute('tabindex', '-1');
          child.setAttribute('aria-disabled', 'true');
          if (child.classList) child.classList.add('dshc-c-dead');
        }
        if (child.hasAttribute('autofocus')) child.removeAttribute('autofocus');
        if (child.hasAttribute('href')) {
          child.setAttribute('target', '_blank');
          child.setAttribute('rel', 'noopener noreferrer');
        }
        visit(child);
      }
    };

    visit(root);
    for (const el of dropped) {
      if (el.parentNode) el.parentNode.removeChild(el);
    }
    return root;
  }

  /* ------------------------------------------------------------ 启动兜底 */

  /**
   * 插件先于会话渲染时，等滚动容器出现（一次性观察，最长 60s）。
   * @returns {() => void} 取消
   */
  function watchForScroller(callback) {
    if (scrollers().length > 0 || !document.body) return function stop() {};
    let stopped = false;
    let timer = 0;
    const mo = new MutationObserver(() => {
      if (scrollers().length > 0) {
        stop();
        callback();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    timer = setTimeout(stop, 60000);
    function stop() {
      if (stopped) return;
      stopped = true;
      if (timer) clearTimeout(timer);
      timer = 0;
      mo.disconnect();
    }
    return stop;
  }

  return {
    HOST,
    MARK,
    isConnected,
    isAttached,
    isVisible,
    layoutParent,
    setStyle,
    setStyles,
    setAttr,
    resetEl,
    resetAll,
    getItems,
    itemOf,
    isInsideItem,
    itemId,
    itemKind,
    mainColumnOf,
    resolve,
    findOlderButton,
    olderWrapper,
    findComposer,
    followingTail,
    sessionKey,
    measure,
    availableWidth,
    detectTheme,
    watchTheme,
    captureAnchor,
    restoreAnchor,
    sanitize,
    watchForScroller
  };
})();


/* ============================================================ src/indexer.js */
/**
 * MessageIndex — 消息识别、顺序与变更合并。
 *
 * 全插件只在主列上挂一个内容观察器：
 *  - 只观察主列子树，不观察 document.body；
 *  - 变更合并成批次（120ms），不逐条重排；
 *  - 区分「结构变化」（增删/换序/折叠）与「内容变化」（某些消息脏了）。
 *
 * 注意：观察器的 attributeFilter 故意不包含 style/class ——
 * B 无缝会给消息行写内联样式，包含它们会形成「写样式 → 触发观察 → 再写」的自激循环。
 */
DSHC.indexer = (() => {
  'use strict';

  const BATCH_MS = 120;
  const WATCHED_ATTRS = ['hidden', 'open', 'disabled', 'aria-expanded'];

  /**
   * @param {HTMLElement} column 主消息列
   * @param {{onChange?: (change: {structural: boolean, dirty: Set<string>}) => void}} options
   */
  function create(column, options) {
    const adapter = DSHC.adapter;
    const onChange = (options && options.onChange) || function noop() {};
    let dirty = new Set();
    let structural = false;
    let timer = 0;
    let disposed = false;

    function flush() {
      if (timer) clearTimeout(timer);
      timer = 0;
      if (disposed) return;
      const change = { structural, dirty };
      structural = false;
      dirty = new Set();
      try {
        onChange(change);
      } catch (error) {
        console.error('[dsh-chat-columns] indexer callback failed', error);
      }
    }

    function schedule(delay) {
      if (disposed) return;
      if (timer) return;
      timer = setTimeout(flush, delay === undefined ? BATCH_MS : delay);
    }

    function markItem(node) {
      const item = adapter.itemOf(node, column);
      if (!item) return false;
      const id = adapter.itemId(item);
      if (id) dirty.add(id);
      return true;
    }

    function collect(node) {
      if (!node || node.nodeType !== 1) return;
      if (node.matches && node.matches(adapter.HOST.item)) {
        const id = adapter.itemId(node);
        if (id) dirty.add(id);
      }
      if (node.querySelectorAll) {
        for (const inner of node.querySelectorAll(adapter.HOST.item)) {
          const id = adapter.itemId(inner);
          if (id) dirty.add(id);
        }
      }
    }

    const observer = new MutationObserver((records) => {
      let touched = false;
      for (const record of records) {
        if (record.type === 'attributes') {
          if (markItem(record.target)) touched = true;
          else if (record.target === column) structural = true;
          touched = true;
          continue;
        }
        if (record.type === 'characterData') {
          markItem(record.target);
          touched = true;
          continue;
        }
        // childList
        if (adapter.isInsideItem(record.target, column)) {
          if (!markItem(record.target)) structural = true;
        } else {
          structural = true;
          for (const node of record.addedNodes) collect(node);
          for (const node of record.removedNodes) collect(node);
        }
        touched = true;
      }
      if (touched) schedule();
    });

    observer.observe(column, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: WATCHED_ATTRS
    });

    /** 当前顺序的消息快照（每次现读，不维护第二份列表）。 */
    function read() {
      return adapter.getItems(column).map((item, index) => ({
        el: item.el,
        id: item.id,
        kind: item.kind,
        index
      }));
    }

    function destroy() {
      disposed = true;
      if (timer) clearTimeout(timer);
      timer = 0;
      observer.disconnect();
      dirty = new Set();
      structural = false;
    }

    return { read, flush, destroy, column };
  }

  return { create };
})();


/* ============================================================ src/history.js */
/**
 * HistoryController — 历史加载的唯一入口与状态机。
 *
 * 只做三件事：
 *  1. 读宿主「加载更早」按钮，判断 hasMore / loading / end；
 *  2. 在允许时点它（auto 或 manual），不自己发请求；
 *  3. 防重复触发、失败可重试，并把状态上报给控制器。
 *
 * 绝不写宿主滚动位置、绝不插入/删除消息节点。
 */
DSHC.history = (() => {
  'use strict';

  const NEAR_TOP = 24;
  const REARM_AT = 120;
  const THROTTLE = 1500;
  const WATCHDOG = 2600;

  function create(options) {
    const adapter = DSHC.adapter;
    const onChange = (options && options.onChange) || function noop() {};
    let disposed = false;
    let state = 'unknown';
    let button = null;
    let auto = false;
    let count = 0;
    let firstId = '';
    let everHadButton = false;
    let loadingMark = { count: 0, firstId: '' };
    let errorMark = { count: 0, firstId: '' };
    let lastRequest = 0;
    let armed = true;
    let scrollEl = null;
    let watchdog = 0;
    let armTimer = 0;
    let tries = 0;
    let lastEmit = '';

    function snapshot() {
      return {
        state,
        hasMore: !!button,
        count,
        canRetry: state === 'error'
      };
    }

    function emit(force) {
      if (disposed) return;
      const view = snapshot();
      const key = view.state + '|' + view.hasMore + '|' + view.count;
      if (!force && key === lastEmit) return;
      lastEmit = key;
      try {
        onChange(view);
      } catch (error) {
        console.error('[dsh-chat-columns] history callback failed', error);
      }
    }

    function stopWatchdog() {
      if (watchdog) clearTimeout(watchdog);
      watchdog = 0;
    }

    function startWatchdog() {
      stopWatchdog();
      watchdog = setTimeout(function tick() {
        watchdog = 0;
        if (disposed || state !== 'loading') return;
        if (!button || !button.isConnected) {
          state = 'end';
          emit(true);
          return;
        }
        if (!button.disabled) {
          const changed = count !== loadingMark.count || firstId !== loadingMark.firstId;
          if (changed) {
            state = 'idle';
            emit(true);
          } else if (tries < 2) {
            tries += 1;
            watchdog = setTimeout(tick, WATCHDOG);
          } else {
            state = 'error';
            errorMark = { count, firstId };
            emit(true);
          }
          return;
        }
        if (tries < 6) {
          tries += 1;
          watchdog = setTimeout(tick, WATCHDOG);
        }
      }, WATCHDOG);
    }

    /**
     * 用宿主按钮与消息集合刷新状态。
     * @param {{button: HTMLButtonElement|null, count: number, firstId: string}} input
     */
    function refresh(input) {
      if (disposed) return;
      button = (input && input.button) || null;
      count = (input && Number(input.count)) || 0;
      firstId = (input && input.firstId) || '';
      if (button) everHadButton = true;

      const prev = state;
      if (prev === 'loading') {
        if (!button) {
          state = 'end';
          stopWatchdog();
        } else if (!button.disabled) {
          const changed = count !== loadingMark.count || firstId !== loadingMark.firstId;
          state = changed ? 'idle' : 'error';
          if (!changed) errorMark = { count, firstId };
          stopWatchdog();
        }
      } else if (prev === 'error') {
        if (!button) state = 'end';
        else if (count !== errorMark.count || firstId !== errorMark.firstId) state = 'idle';
      } else if (!button) {
        state = everHadButton || count > 0 ? 'end' : 'unknown';
      } else if (button.disabled) {
        state = 'loading';
      } else {
        state = 'idle';
      }

      if (prev !== 'loading' && state === 'loading') {
        loadingMark = { count, firstId };
        tries = 0;
        startWatchdog();
      }
      emit();
    }

    /**
     * 触发一次加载（只点宿主按钮）。
     * @param {'auto'|'manual'} kind
     * @returns {boolean} 是否真的点了
     */
    function request(kind) {
      if (disposed) return false;
      if (kind === 'auto' && !auto) return false;
      if (state !== 'idle' && state !== 'error') return false;
      if (!button || button.disabled || !button.isConnected) return false;
      const now = Date.now();
      if (now - lastRequest < THROTTLE) return false;

      lastRequest = now;
      armed = false;
      loadingMark = { count, firstId };
      tries = 0;
      state = 'loading';
      emit(true);
      startWatchdog();
      button.click();
      return true;
    }

    function retry() {
      if (state === 'error') {
        lastRequest = 0;
        state = 'idle';
      }
      return request('manual');
    }

    function onScroll() {
      if (disposed || !scrollEl) return;
      const top = scrollEl.scrollTop;
      if (top > REARM_AT) {
        armed = true;
        return;
      }
      if (!auto || state !== 'idle' || !armed) return;
      if (top <= NEAR_TOP) request('auto');
    }

    /** 绑定自动加载的滚动源；传 null 解绑。 */
    function setScrollSource(el) {
      if (disposed) return;
      if (el === scrollEl) return;
      if (scrollEl) scrollEl.removeEventListener('scroll', onScroll);
      scrollEl = el || null;
      if (scrollEl) {
        scrollEl.addEventListener('scroll', onScroll, { passive: true });
        armed = true;
        // 切模式时可能已经停在顶部，给宿主一帧再补一次机会。
        if (armTimer) clearTimeout(armTimer);
        armTimer = setTimeout(() => {
          armTimer = 0;
          if (disposed || !scrollEl || !auto || state !== 'idle') return;
          if (scrollEl.scrollTop <= NEAR_TOP) request('auto');
        }, 350);
      }
    }

    function setAuto(value) {
      auto = !!value;
      if (auto && state === 'idle' && scrollEl && scrollEl.scrollTop <= NEAR_TOP) request('auto');
    }

    function reset() {
      stopWatchdog();
      if (armTimer) clearTimeout(armTimer);
      armTimer = 0;
      state = 'unknown';
      button = null;
      count = 0;
      firstId = '';
      everHadButton = false;
      loadingMark = { count: 0, firstId: '' };
      errorMark = { count: 0, firstId: '' };
      lastRequest = 0;
      armed = true;
      lastEmit = '';
      if (scrollEl) scrollEl.removeEventListener('scroll', onScroll);
      scrollEl = null;
      if (!disposed) emit(true);
    }

    function destroy() {
      disposed = true;
      stopWatchdog();
      if (armTimer) clearTimeout(armTimer);
      armTimer = 0;
      if (scrollEl) scrollEl.removeEventListener('scroll', onScroll);
      scrollEl = null;
      button = null;
    }

    return {
      refresh,
      request,
      retry,
      setAuto,
      setScrollSource,
      reset,
      snapshot,
      destroy
    };
  }

  return { create, NEAR_TOP, REARM_AT };
})();


/* ============================================================ src/newspaper.js */
/**
 * A｜报纸模式：在宿主原生正文列上做 CSS 均衡分栏。
 *
 * 规则：
 *  - 宿主的列是 display:flex，CSS 多列对 flex 容器无效，先改回 display:block；
 *  - column-fill:balance，列高由内容与列数共同决定；
 *  - 释放 --dsh-chat-content-width 的宽度限制，退出时原样还回去；
 *  - **任何消息都不跨列**（break-inside:avoid）：CSS 多列一旦把消息切开，
 *    不可分片的代码块会出现「盒子留在第一列、内容画到第二列」的渲染错位；
 *  - 不接管 scrollTop，滚动/锚点/历史加载都还是宿主自己的。
 *
 * 关于「底部留白」（本文件的核心逻辑）：
 *  均衡分栏的列高 = max(各列内容高)，而 break-inside:avoid 把每条消息变成不可拆的整块，
 *  于是一条比列还高的消息会把**所有**列一起顶到它那么高，其它列下面就是大片空白。
 *  所以这里按「理想列高 ideal = 内容总高 / 列数」来判定：
 *    - 消息高于 ideal 的一半 → 允许跨列（切在列缝上，读的时候接着看下一列顶部）；
 *    - 消息高于 ideal 的 2.2 倍 → 浏览器也切不开（典型是自带滚动的代码块），
 *      直接给它一个「一屏多一点」的高度上限并让消息自己滚，禁止它把整页顶开。
 *  判据用的是 ideal 而不是「当前列高」，因为后者会被上一条无法拆分的消息撑大，形成自激。
 */
DSHC.newspaper = (() => {
  'use strict';

  const RAIL = 44; // 右侧 TurnNavigator 轨道 + 安全距
  /** 列高超过理想列高的这个倍数 → 说明有「比一列还高」的消息在顶 */
  const CAP_SLACK = 1.2;
  /** 只有比这个倍数还高的消息才限高：普通消息宁留白，也别给它套内部滚动条 */
  const CAP_MIN_RATIO = 1.35;
  /** 这类消息的高度上限 = 理想列高 × 这个倍数（略小于一列，内容由它自己滚） */
  const CAP_TARGET = 0.95;
  /** 纯文字消息超过理想列高的这个比例就允许跨列，用来把列底留白填平 */
  const SPLIT_RATIO = 0.5;
  const SPLIT_FLOOR = 320;
  /**
   * 这些内容不可分片：含它们的消息整块保留，绝不跨列（另加嵌套 flow，见 isSplittable）。
   * 故意不含 svg：消息里的图标（按钮、状态标记）都是内联 svg，排掉它们等于所有消息都不能跨列。
   */
  const UNSPLITTABLE = 'pre, table, img, video, canvas, iframe';

  function create() {
    const adapter = DSHC.adapter;
    const math = DSHC.math;
    let applied = false;
    let column = null;
    let columns = 1;
    let tuneRaf = 0;
    let tuneTimer = 0;
    let tuneCapped = 0;
    let tuneLong = 0;
    let tuneIdeal = 0;

    /** 不含代码块/表格/媒体的消息才允许跨列（跨列的代价是内容被列缝切开）。 */
    function isSplittable(el) {
      // 嵌套 flow（分组卡片）也不能拆
      return !el.querySelector(UNSPLITTABLE + ', ' + adapter.HOST.column);
    }

    function markedItems() {
      return column ? Array.from(column.querySelectorAll('[' + adapter.MARK.item + ']')) : [];
    }

    /**
     * 应用均衡分栏。columns < 2 时退回原生。
     * @returns {boolean} 是否真的分成多列
     */
    function apply(target, count) {
      column = target && target.column ? target.column : null;
      columns = Math.max(1, Math.min(3, Number(count) || 1));
      if (!column || columns < 2) {
        restore();
        return false;
      }

      adapter.setAttr(column, 'data-dshc-a', '');
      adapter.setStyles(column, {
        display: 'block',
        'column-count': String(columns),
        'column-fill': 'balance',
        'column-gap': math.GAP + 'px',
        'column-width': 'auto',
        'max-width': 'none',
        width: '100%',
        'box-sizing': 'border-box',
        'padding-right': RAIL + 'px',
        // 释放宿主写死的正文宽度上限（退出时由快照原样还回去）。
        [adapter.HOST.contentWidth]: '100%'
      });

      for (const item of adapter.getItems(column)) {
        adapter.setAttr(item.el, adapter.MARK.item, '');
      }

      applied = true;
      scheduleTune();
      return true;
    }

    /**
     * 按「理想列高」给过高的消息限高，把底部留白压到最小。
     * 幂等：每次先量自然高度（撤掉上一次加的上限），再重新判定。
     */
    function tune() {
      tuneRaf = 0;
      if (!applied || !column || !column.isConnected) return;
      const items = markedItems();
      if (!items.length) return;

      // 1) 量自然高度：先撤掉上次给巨型块加的上限，否则量到的是被截断后的高度。
      //    写和读分开做：先全部写完，再一次性读高度，只触发一次布局。
      for (const el of items) {
        adapter.setStyle(el, 'max-height', '');
        adapter.setStyle(el, 'overflow-y', '');
      }
      const heights = [];
      for (const el of items) heights.push(el.getBoundingClientRect().height);
      const gaps = [];
      for (const el of items) gaps.push(parseFloat(getComputedStyle(el).marginTop) || 0);

      const splittable = items.map(isSplittable);
      const plan = math.columnPlan(heights, gaps, columns, splittable, {
        splitRatio: SPLIT_RATIO,
        splitFloor: SPLIT_FLOOR,
        capRatio: CAP_MIN_RATIO,
        capTarget: CAP_TARGET
      });

      // 2) 纯文字的长消息允许跨列：读到列底就接下一列顶部，把列底留白填平。
      let longCount = 0;
      for (let i = 0; i < items.length; i += 1) {
        if (plan.markLong[i]) {
          adapter.setAttr(items[i], adapter.MARK.long, '');
          longCount += 1;
        } else {
          items[i].removeAttribute(adapter.MARK.long);
        }
      }

      // 3) 比「一列」高得多的消息（典型：长代码块，整块不可拆）：
      //    列高会被它顶到它那么高，其它列下面就是整屏空白。
      //    给它一列的高度上限，内容由它自己滚；最多 3 条，避免反复强制布局。
      const capped = new Set();
      let height = column.getBoundingClientRect().height;
      const queue = plan.candidates.slice(0, 3);
      for (const index of queue) {
        if (height <= plan.ideal * CAP_SLACK) break;
        capped.add(index);
        adapter.setStyle(items[index], 'max-height', plan.cap + 'px');
        adapter.setStyle(items[index], 'overflow-y', 'auto');
        height = column.getBoundingClientRect().height;
      }
      tuneCapped = capped.size;
      tuneLong = longCount;
      tuneIdeal = Math.round(plan.ideal);
    }

    /**
     * 安排一次重排。
     * @param {number} delay 毫秒；流式输出时给个小延迟，避免每批 token 都强制同步布局
     */
    function scheduleTune(delay) {
      if (tuneRaf) cancelAnimationFrame(tuneRaf);
      if (tuneTimer) clearTimeout(tuneTimer);
      tuneRaf = 0;
      tuneTimer = setTimeout(() => {
        tuneTimer = 0;
        // 两帧：等浏览器把多列布局算完，再量高度
        tuneRaf = requestAnimationFrame(() => {
          tuneRaf = requestAnimationFrame(tune);
        });
      }, Math.max(0, Number(delay) || 0));
    }

    /** 诊断：列数、列高、理想列高、每列内容底、最大留白。 */
    function diagnose() {
      if (!applied || !column || !column.isConnected) return { applied: false };
      const rect = column.getBoundingClientRect();
      const items = markedItems();
      const ends = new Map();
      let total = 0;
      for (const el of items) {
        const r = el.getBoundingClientRect();
        const left = Math.round(r.left - rect.left);
        const bottom = Math.round(r.bottom - rect.top);
        ends.set(left, Math.max(ends.get(left) || 0, bottom));
        total += r.height;
      }
      const columnsInfo = Array.from(ends.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([left, end]) => ({ left, end }));
      const lowest = columnsInfo.length ? Math.min.apply(null, columnsInfo.map((c) => c.end)) : 0;
      const height = Math.round(rect.height);
      return {
        applied: true,
        columns,
        height,
        ideal: tuneIdeal,
        long: tuneLong,
        capped: tuneCapped,
        columnsEnd: columnsInfo,
        // 最大一列留白：列高 - 最矮那列的底
        blank: Math.max(0, height - lowest)
      };
    }

    function restore() {
      if (tuneRaf) cancelAnimationFrame(tuneRaf);
      tuneRaf = 0;
      if (tuneTimer) clearTimeout(tuneTimer);
      tuneTimer = 0;
      for (const item of markedItems()) adapter.resetEl(item);
      if (column) adapter.resetEl(column);
      applied = false;
    }

    function destroy() {
      restore();
      column = null;
    }

    return {
      apply,
      tune: scheduleTune,
      diagnose,
      restore,
      destroy,
      isApplied: () => applied,
      get columns() {
        return columns;
      }
    };
  }

  return { create, RAIL, CAP_SLACK, CAP_MIN_RATIO, CAP_TARGET, SPLIT_RATIO, SPLIT_FLOOR, UNSPLITTABLE };
})();


/* ============================================================ src/seamless.js */
/**
 * B｜无缝模式：列高 = 阅读视口高度 H，滚动时各列连续推进。
 *
 * 模型（3.0 任务书）：
 *  - 第 c 列显示逻辑内容区间 [s + cH, s + (c+1)H)，s = 主滚动容器的 scrollTop；
 *  - 原生正文列变成高度 H 的粘滞视口层（position:sticky; top:0; height:H），由滚动容器裁切；
 *  - 消息节点保持原父子关系，逐条 position:absolute + translate3d 放进对应列；
 *  - 滚动容器里放插件自有的逻辑高度占位层（::after 伪元素），提供真实滚动行程；
 *  - 不 reparent、不 clone、不接管滚轮，宿主消息交互保持可用。
 *
 * 关键取舍：一条消息绝不跨列。消息按「整列高度」打包，放不下就另起一列，
 * 因此不会出现「消息被列缝切断、剩下半截永远看不到」的问题；代价是列底可能有留白。
 * 单条消息比 H 还高时，独占一个列段并在消息内部滚动（杜绝与相邻消息重叠）。
 */
DSHC.seamless = (() => {
  'use strict';

  /** 右侧 TurnNavigator 轨道 + 安全距。 */
  const RAIL = 44;
  const MIN_VIEWPORT = 140;
  const MIN_COLUMN_WIDTH = 220;
  const GAP_DEFAULT = 12;
  const RESIZE_DEBOUNCE = 90;

  function create() {
    const adapter = DSHC.adapter;
    const math = DSHC.math;
    const MARK = adapter.MARK;

    let column = null;
    let scroller = null;
    let host = null;
    let records = [];
    let active = false;

    let H = 0;
    let available = 0;
    let cols = 1;
    let colWidth = 0;
    let total = 0;
    let pages = 1;
    let s = 0;

    let scrollRaf = 0;
    let repackTimer = 0;
    let resizeTimer = 0;
    let itemObserver = null;
    let sizeObserver = null;
    let boundScroll = null;
    let applying = false;
    let lastLayoutAt = 0;
    /** sticky 在宿主祖先有滚动/裁剪容器时不可靠，退化为「JS 钉住」的视口层。 */
    let pinnedByJs = false;
    let pinnedValue = '';

    /* ------------------------------------------------------------- 样式壳 */

    function gapOf(el) {
      const value = parseFloat(getComputedStyle(el).marginTop);
      return Number.isFinite(value) && value >= 0 ? value : GAP_DEFAULT;
    }

    function hide(el) {
      if (!el || !el.getAttribute) return;
      const tag = el.tagName ? el.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (el.matches(adapter.HOST.column)) return;
      if (el.getAttribute('role') === 'dialog') return;
      adapter.setAttr(el, MARK.hide, 'b');
    }

    /**
     * 主列里除消息之外的装饰节点（宿主「加载更早」按钮、生成中指示、占位）
     * 在 B 下会压在第一列顶端，必须收起；消息容器要下钻而不是整体隐藏。
     */
    function hideDecorations() {
      const walk = (parent) => {
        for (const child of Array.from(parent.children)) {
          if (child.matches(adapter.HOST.item)) continue;
          if (child.querySelector(adapter.HOST.item)) {
            walk(child);
            continue;
          }
          hide(child);
        }
      };
      walk(column);
    }

    /**
     * sticky 依赖「最近的滚动容器」是会话滚动容器。
     * 如果中间夹了 overflow:auto/scroll/hidden 的祖先，sticky 会相对那个祖先定位而永远不吸顶，
     * 这时退化为 JS 钉住（每帧把视口层下移 s）。
     */
    function stickyUnreliable() {
      if (!(window.CSS && window.CSS.supports && window.CSS.supports('position', 'sticky'))) return true;
      let node = column.parentElement;
      while (node && node !== scroller) {
        const overflow = getComputedStyle(node).overflowY;
        if (overflow === 'auto' || overflow === 'scroll' || overflow === 'hidden') return true;
        node = node.parentElement;
      }
      return false;
    }

    function layoutShell() {
      const rect = adapter.measure(scroller);
      if (!rect) return false;
      H = Math.floor(rect.height);
      if (!(H >= MIN_VIEWPORT)) return false;
      available = Math.floor(adapter.availableWidth(column, scroller) - RAIL);
      colWidth = Math.floor(math.columnWidth(available, cols, math.GAP));
      if (!(colWidth >= MIN_COLUMN_WIDTH)) return false;

      host = adapter.layoutParent(column, scroller) || column.parentElement;
      if (host) {
        adapter.setAttr(host, 'data-dshc-b-host', '');
        adapter.setStyle(host, '--dshc-spacer', '0px');
        // 宿主正文有一个 16px 的上下内边距；B 的列高必须精确等于阅读视口高度。
        adapter.setStyle(host, 'padding-top', '0px');
        adapter.setStyle(host, 'padding-bottom', '0px');
      }

      // 关掉浏览器滚动锚定：这一层的滚动位置由插件自己换算，不能让浏览器再补一次。
      adapter.setStyles(scroller, { 'overflow-anchor': 'none' });

      pinnedByJs = stickyUnreliable();
      pinnedValue = '';
      adapter.setAttr(column, 'data-dshc-b', 'column');
      adapter.setStyles(column, {
        position: pinnedByJs ? 'relative' : 'sticky',
        top: '0px',
        height: H + 'px',
        overflow: 'hidden',
        display: 'block',
        'box-sizing': 'border-box',
        'max-width': 'none',
        width: '100%',
        margin: '0',
        padding: '0',
        'z-index': '1',
        transform: 'none',
        [adapter.HOST.contentWidth]: '100%'
      });

      hideDecorations();
      return true;
    }

    function styleItem(el) {
      adapter.setAttr(el, 'data-dshc-b', 'item');
      adapter.setStyles(el, {
        position: 'absolute',
        top: '0px',
        left: '0px',
        width: colWidth + 'px',
        'max-width': colWidth + 'px',
        margin: '0',
        'box-sizing': 'border-box',
        'transform-origin': '0 0',
        transition: 'none',
        'will-change': 'transform',
        'z-index': '1'
      });
      adapter.setStyle(el, 'max-height', '');
    }

    /* --------------------------------------------------------------- 测量 */

    function measureRecord(rec) {
      const el = rec.el;
      if (!el || !el.isConnected) {
        rec.height = 0;
        return;
      }
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') {
        rec.height = 0;
        return;
      }
      const rect = el.getBoundingClientRect();
      rec.height = Math.max(0, Math.round(rect.height * 100) / 100);
    }

    function measureAll() {
      for (const rec of records) {
        adapter.setStyle(rec.el, 'max-height', '');
        measureRecord(rec);
      }
    }

    /** 从 indexer 的结果同步记录表（新增/删除/脏消息）。 */
    function syncItems(items, dirty) {
      const previous = new Map();
      for (const rec of records) previous.set(rec.el, rec);
      const next = [];

      for (const item of items) {
        let rec = previous.get(item.el);
        if (!rec) {
          rec = { el: item.el, id: item.id, gap: gapOf(item.el), height: 0, start: 0, tall: false, cache: '' };
          styleItem(item.el);
          measureRecord(rec);
        } else {
          previous.delete(item.el);
          rec.id = item.id;
          if (dirty && dirty.has(item.id)) {
            adapter.setStyle(rec.el, 'max-height', '');
            measureRecord(rec);
          }
        }
        next.push(rec);
      }

      for (const [el, rec] of previous) {
        if (el && el.isConnected) adapter.resetEl(el);
        if (rec.cache) rec.cache = '';
      }
      records = next;
    }

    /* --------------------------------------------------------------- 排布 */

    function place() {
      const blocks = records.map((rec) => ({ height: rec.height, gap: rec.gap }));
      const packed = math.pack(blocks, H, GAP_DEFAULT);
      pages = packed.pages;
      total = packed.total;
      for (let i = 0; i < records.length; i += 1) {
        records[i].start = packed.starts[i];
        records[i].tall = packed.tall[i];
        const el = records[i].el;
        if (packed.tall[i]) {
          adapter.setStyle(el, 'max-height', H + 'px');
          adapter.setStyle(el, 'overflow-y', 'auto');
          adapter.setStyle(el, 'overscroll-behavior', 'contain');
        } else {
          adapter.setStyle(el, 'max-height', '');
          adapter.setStyle(el, 'overflow-y', '');
        }
      }
      if (host) adapter.setStyle(host, '--dshc-spacer', Math.max(0, total - H) + 'px');
      lastLayoutAt = Date.now();
    }

    function projectAll() {
      if (!active || !scroller) return;
      const maxS = Math.max(0, total - H);
      s = Math.min(maxS, Math.max(0, scroller.scrollTop));
      if (pinnedByJs && column) {
        const pin = 'translate3d(0,' + Math.round(s) + 'px,0)';
        if (pinnedValue !== pin) {
          pinnedValue = pin;
          adapter.setStyle(column, 'transform', pin);
        }
      }
      const step = colWidth + math.GAP;
      for (const rec of records) {
        const el = rec.el;
        if (!el || !el.isConnected) continue;
        if (rec.height < 1) continue;
        const p = math.project(rec.start, s, H);
        const left = math.round(p.column * step);
        const top = Math.round(p.top);
        const value = 'translate3d(' + left + 'px,' + top + 'px,0)';
        if (rec.cache !== value) {
          rec.cache = value;
          adapter.setStyle(el, 'transform', value);
        }
      }
    }

    function maxScroll() {
      return Math.max(0, total - H);
    }

    function setScroll(value) {
      if (!scroller) return;
      const next = Math.min(maxScroll(), Math.max(0, value));
      if (Math.abs(scroller.scrollTop - next) > 0.5) scroller.scrollTop = next;
      projectAll();
    }

    /* --------------------------------------------------------------- 锚点 */

    /**
     * 屏幕最靠上的一条可见消息。
     * 用逻辑坐标算，不读 DOM 几何：流式更新时每 120ms 都会调用它，读 rect 会把布局打穿。
     */
    function captureAnchor() {
      if (!active || !scroller) return null;
      const value = Math.min(Math.max(0, total - H), Math.max(0, scroller.scrollTop));
      s = value;
      let best = null;
      for (const rec of records) {
        if (!rec.el || !rec.el.isConnected || rec.height < 1) continue;
        const p = math.project(rec.start, value, H);
        if (p.column < 0 || p.column >= cols) continue;
        if (best === null || p.column < best.column || (p.column === best.column && p.top < best.offset)) {
          best = { rec, column: p.column, offset: p.top };
        }
      }
      return best;
    }

    /** 把「消息 + 所在列 + 列内偏移」换算回滚动量。 */
    function anchorScroll(anchor) {
      if (!anchor || !anchor.rec) return 0;
      const column = anchor.column || 0;
      return anchor.rec.start - column * H - (anchor.offset || 0);
    }

    /** 按锚点恢复滚动位置。 */
    function restoreAnchor(anchor) {
      if (!anchor || !anchor.rec) return;
      if (!anchor.rec.el || !anchor.rec.el.isConnected) return;
      setScroll(anchorScroll(anchor));
    }

    /* ----------------------------------------------------------- 重新布局 */

    function scheduleRepack(delay) {
      if (!active) return;
      if (repackTimer) clearTimeout(repackTimer);
      repackTimer = setTimeout(() => {
        repackTimer = 0;
        repack();
      }, delay === undefined ? RESIZE_DEBOUNCE : delay);
    }

    function repack() {
      if (!active) return;
      applying = true;
      try {
        const anchor = captureAnchor();
        const before = anchor ? anchor.rec.start : 0;
        place();
        if (anchor && anchor.rec.el && anchor.rec.el.isConnected) {
          // 只有锚点的逻辑起点真的变了才动滚动，避免平白跳动。
          if (Math.abs(anchor.rec.start - before) > 1) restoreAnchor(anchor);
          else projectAll();
        } else {
          projectAll();
        }
      } finally {
        applying = false;
      }
    }

    /** 消息集合变化（流式、折叠、加载更早）后重排。 */
    function update(items, dirty) {
      if (!active) return;
      applying = true;
      try {
        const anchor = captureAnchor();
        syncItems(items, dirty);
        place();
        observeItems();
        if (anchor && anchor.rec.el && anchor.rec.el.isConnected) restoreAnchor(anchor);
        else projectAll();
      } catch (error) {
        console.error('[dsh-chat-columns] 无缝模式重排失败', error);
      } finally {
        applying = false;
      }
    }

    /* ------------------------------------------------------------- 观察器 */

    function bind() {
      unbind();
      const onScroll = () => {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(() => {
          scrollRaf = 0;
          if (active) projectAll();
        });
      };
      scroller.addEventListener('scroll', onScroll, { passive: true });
      boundScroll = { el: scroller, onScroll };

      if (typeof ResizeObserver === 'function') {
        sizeObserver = new ResizeObserver(() => {
          if (applying || !active) return;
          if (resizeTimer) clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            resizeTimer = 0;
            if (!active) return;
            const rect = adapter.measure(scroller);
            if (!rect) return;
            const nextH = Math.floor(rect.height);
            const nextWidth = Math.floor(adapter.availableWidth(column, scroller) - RAIL);
            if (nextH === H && nextWidth === available) return;
            relayout();
          }, RESIZE_DEBOUNCE);
        });
        sizeObserver.observe(scroller);
        const composer = adapter.findComposer(scroller);
        if (composer) sizeObserver.observe(composer);

        itemObserver = new ResizeObserver((entries) => {
          if (applying || !active) return;
          // 自己刚写完布局的那一帧不响应，避免自激。
          if (Date.now() - lastLayoutAt < 120) return;
          let changed = false;
          for (const item of entries) {
            const rec = records.find((candidate) => candidate.el === item.target);
            if (!rec || rec.tall) continue;
            const height = Math.round(item.contentRect.height * 100) / 100;
            if (Math.abs(height - rec.height) > 0.5) {
              rec.height = height;
              changed = true;
            }
          }
          if (changed) scheduleRepack();
        });
        for (const rec of records) itemObserver.observe(rec.el);
      }
    }

    function observeItems() {
      if (!itemObserver) return;
      itemObserver.disconnect();
      for (const rec of records) itemObserver.observe(rec.el);
    }

    function unbind() {
      if (boundScroll) {
        boundScroll.el.removeEventListener('scroll', boundScroll.onScroll);
        boundScroll = null;
      }
      if (sizeObserver) sizeObserver.disconnect();
      sizeObserver = null;
      if (itemObserver) itemObserver.disconnect();
      itemObserver = null;
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      scrollRaf = 0;
      if (repackTimer) clearTimeout(repackTimer);
      repackTimer = 0;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = 0;
    }

    /* --------------------------------------------------------------- 应用 */

    function apply(target, count, items) {
      column = target && target.column ? target.column : null;
      scroller = target && target.scroller ? target.scroller : null;
      cols = Math.max(1, Math.min(3, Number(count) || 1));
      if (!column || !scroller || cols < 2) {
        restore();
        return false;
      }

      const anchor = adapter.captureAnchor(scroller, column);
      if (!layoutShell()) {
        restore();
        return false;
      }

      applying = true;
      try {
        syncItems(items || [], null);
        measureAll();
        place();
        active = true;
        bind();
        if (anchor) {
          const hit = records.find((rec) => rec.id === anchor.id);
          setScroll(hit ? hit.start - Math.max(0, Math.min(H - 1, anchor.offset)) : 0);
        } else {
          setScroll(scroller.scrollTop);
        }
      } catch (error) {
        // 任何一步出错都退回原生，绝不留半个布局在页面上。
        console.error('[dsh-chat-columns] 无缝模式初始化失败，已退回原生', error);
        restore();
        return false;
      } finally {
        applying = false;
      }
      return active;
    }

    /** 视口/宽度变化后整体重排（宽度变了，消息高度必须重测）。 */
    function relayout() {
      if (!active || !column || !scroller) return;
      applying = true;
      try {
        const anchor = captureAnchor();
        H = 0;
        available = 0;
        if (!layoutShell()) {
          restore();
          return;
        }
        // 列宽可能变了：已有节点的宽度也要重写，再重测高度。
        for (const rec of records) {
          if (rec.el && rec.el.isConnected) styleItem(rec.el);
        }
        syncItems(readItems(), null);
        measureAll();
        place();
        observeItems();
        if (anchor && anchor.rec.el && anchor.rec.el.isConnected) restoreAnchor(anchor);
        else projectAll();
      } catch (error) {
        console.error('[dsh-chat-columns] 无缝模式重排失败', error);
      } finally {
        applying = false;
      }
    }

    function readItems() {
      return adapter.getItems(column).map((item, index) => ({
        el: item.el,
        id: item.id,
        kind: item.kind,
        index
      }));
    }

    function restore() {
      active = false;
      unbind();
      for (const rec of records) {
        if (rec.el && rec.el.isConnected) adapter.resetEl(rec.el);
      }
      records = [];
      if (host) adapter.resetEl(host);
      host = null;
      if (column) adapter.resetEl(column);
      if (scroller) adapter.resetEl(scroller);
      column = null;
      scroller = null;
      H = 0;
      total = 0;
    }

    function diagnose() {
      return {
        active,
        H,
        available,
        columns: cols,
        columnWidth: colWidth,
        gap: math.GAP,
        pages,
        total,
        scroll: scroller ? Math.round(scroller.scrollTop) : 0,
        maxScroll: maxScroll(),
        items: records.length,
        tall: records.filter((rec) => rec.tall).length,
        hidden: document.querySelectorAll('[' + MARK.hide + '="b"]').length
      };
    }

    return {
      apply,
      update,
      relayout,
      restore,
      diagnose,
      isActive: () => active
    };
  }

  return { create, RAIL, MIN_VIEWPORT };
})();


/* ============================================================ src/mirror.js */
/**
 * C｜复制模式：把同一份对话复制成 N 栏只读副本，每栏独立滚动。
 *
 * 语义（2026-11-11 按维护方实测反馈修正）：
 *  每一栏都是**完整对话的一份副本**，不是把内容切成 N 段。
 *  三栏从同一阅读位置开始，各自滚到不同段落对照；标题栏只做「栏 n · 只读对照」标识。
 *
 * 为什么只能是「只读副本」：整段对话只有一套 React 管理的节点树，
 * 搬节点会破坏 keyed seat，克隆后的交互控件（按钮/审批/复制代码）也全部失效。
 * 因此这里克隆宿主已渲染好的结构，净化成静态内容。
 *
 * 不移动宿主节点、不依赖克隆后的宿主事件；用稳定消息 ID 做增量同步与滚动锚点。
 */
DSHC.mirror = (() => {
  'use strict';

  const REARM = 120;
  const NEAR_TOP = 24;

  function make(tag, className, attrs) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (attrs) {
      for (const name of Object.keys(attrs)) el.setAttribute(name, attrs[name]);
    }
    return el;
  }

  function create(options) {
    const adapter = DSHC.adapter;
    const onNeedMore = (options && options.onNeedMore) || function noop() {};
    const isAuto = (options && options.isAuto) || function yes() { return true; };

    const root = make('section', 'dshc-view', {
      'data-mode': 'mirror',
      'aria-label': '复制模式：只读分栏',
      hidden: ''
    });

    const bar = make('header', 'dshc-bar');
    const title = make('span', 'dshc-bar-title');
    title.textContent = '复制 · 只读对照';
    const sub = make('span', 'dshc-bar-sub');
    const state = make('span', 'dshc-bar-state', { 'aria-live': 'polite' });
    const olderBtn = make('button', 'dshc-bar-action', { type: 'button' });
    olderBtn.textContent = '拉取更早历史';
    olderBtn.hidden = true;
    bar.append(title, sub, state, olderBtn);

    const colsBox = make('div', 'dshc-cols');
    root.append(bar, colsBox);

    let active = false;
    let columns = 1;
    let cols = [];
    /** 每栏一份「消息 ID → 克隆节点」，第 0 栏直接从宿主克隆，其它栏克隆第 0 栏（省掉重复净化）。 */
    let copies = [];
    let suppress = false;
    let lastCount = 0;

    function buildColumns(count) {
      colsBox.textContent = '';
      cols = [];
      copies = [];
      colsBox.setAttribute('data-columns', String(count));
      for (let i = 0; i < count; i += 1) {
        const col = make('section', 'dshc-col');
        const head = make('header', 'dshc-col-head');
        const name = make('span', 'dshc-col-name');
        name.textContent = '栏 ' + (i + 1);
        const tag = make('span', 'dshc-col-tag');
        tag.textContent = '只读对照';
        head.append(name, tag);
        const body = make('div', 'dshc-col-body');
        body.setAttribute('data-index', String(i));
        col.append(head, body);
        colsBox.append(col);
        cols.push({ el: col, body, armed: false });
        copies.push(new Map());
        body.addEventListener(
          'scroll',
          () => {
            const entry = cols[i];
            if (!entry) return;
            if (suppress) return;
            if (body.scrollTop > REARM) {
              entry.armed = true;
              return;
            }
            if (body.scrollTop > NEAR_TOP) return;
            if (!isAuto()) return;
            if (!entry.armed) return;
            entry.armed = false;
            onNeedMore();
          },
          { passive: true }
        );
      }
      columns = count;
    }

    function sanitized(item) {
      let node = null;
      try {
        node = item.el.cloneNode(true);
      } catch (error) {
        return null;
      }
      adapter.sanitize(node);
      node.setAttribute('data-dshc-clone', item.id);
      return node;
    }

    /** 取第 k 栏里这条消息的节点；没有就从第 0 栏（或宿主）复制一份。 */
    function nodeFor(index, item) {
      const map = copies[index];
      const cached = map.get(item.id);
      if (cached) return cached;
      let node = null;
      if (index > 0 && copies[0]) {
        const source = copies[0].get(item.id);
        if (source) node = source.cloneNode(true);
      }
      if (!node) node = sanitized(item);
      if (node) map.set(item.id, node);
      return node;
    }

    /** 记住每栏顶部那条消息，重排后按 ID 还原。 */
    function captureAnchors() {
      return cols.map((entry) => {
        const top = entry.body.getBoundingClientRect().top;
        let best = null;
        for (const node of entry.body.children) {
          const r = node.getBoundingClientRect();
          if (r.bottom <= top + 1) continue;
          const offset = r.top - top;
          const id = node.getAttribute('data-dshc-clone');
          if (id && (best === null || offset < best.offset)) best = { id, offset };
        }
        return best;
      });
    }

    function scrollToAnchor(index, id, offset) {
      const entry = cols[index];
      if (!entry) return;
      const node = entry.body.querySelector('[data-dshc-clone="' + cssEscape(id) + '"]');
      if (!node) return;
      const delta = node.getBoundingClientRect().top - entry.body.getBoundingClientRect().top - offset;
      if (Math.abs(delta) > 1) entry.body.scrollTop += delta;
    }

    function restoreAnchors(anchors) {
      suppress = true;
      try {
        for (let i = 0; i < cols.length; i += 1) {
          const entry = cols[i];
          const anchor = anchors[i];
          if (anchor) scrollToAnchor(i, anchor.id, anchor.offset);
          // 停在顶部时先解除自动加载，等用户真的离开顶部再武装。
          entry.armed = entry.body.scrollTop > REARM;
        }
      } finally {
        suppress = false;
      }
    }

    function cssEscape(value) {
      if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
      return String(value).replace(/["\\]/g, '\\$&');
    }

    /** items: [{el, id}]，按 DOM 顺序；每一栏都放完整的这一份。 */
    function render(items) {
      const ids = new Set(items.map((item) => item.id));
      for (const map of copies) {
        for (const id of Array.from(map.keys())) if (!ids.has(id)) map.delete(id);
      }

      if (!items.length) {
        for (const entry of cols) {
          const empty = make('div', 'dshc-empty');
          empty.textContent = '还没有消息';
          entry.body.replaceChildren(empty);
        }
        lastCount = 0;
        return;
      }

      const anchors = captureAnchors();
      for (let i = 0; i < cols.length; i += 1) {
        const nodes = [];
        for (const item of items) {
          const node = nodeFor(i, item);
          if (node) nodes.push(node);
        }
        cols[i].body.replaceChildren(...nodes);
      }
      lastCount = items.length;
      restoreAnchors(anchors);
    }

    /** 进入时让所有栏都停在同一阅读位置。 */
    function alignAll(anchor) {
      if (!anchor) return;
      suppress = true;
      try {
        for (let i = 0; i < cols.length; i += 1) {
          scrollToAnchor(i, anchor.id, anchor.offset);
          cols[i].armed = cols[i].body.scrollTop > REARM;
        }
      } finally {
        suppress = false;
      }
    }

    function setMeta(info) {
      const h = info && info.history ? info.history : null;
      sub.textContent = columns + ' 栏 · ' + Math.max(lastCount, (h && h.count) || 0) + ' 条 · 每栏完整副本';
      if (!h) {
        state.textContent = '';
        olderBtn.hidden = true;
        return;
      }
      const text =
        h.state === 'loading'
          ? '正在加载更早…'
          : h.state === 'error'
            ? '历史加载失败'
            : h.hasMore
              ? '还有更早历史'
              : '已到最早';
      state.textContent = text;
      root.setAttribute('data-state', h.state === 'error' ? 'error' : h.state === 'loading' ? 'busy' : 'ok');
      olderBtn.hidden = !h.hasMore || h.state === 'loading';
      olderBtn.disabled = !h.hasMore || h.state === 'loading';
      olderBtn.textContent = h.state === 'error' ? '重试加载' : '拉取更早历史';
    }

    function position(next) {
      if (!next) return;
      root.style.top = Math.round(next.top) + 'px';
      root.style.left = Math.round(next.left) + 'px';
      root.style.width = Math.round(next.width) + 'px';
      root.style.height = Math.round(next.height) + 'px';
    }

    function apply(target, count, items, geometry, anchor) {
      if (!target || !target.column) return false;
      active = true;
      root.hidden = false;
      if (count !== columns || cols.length === 0) buildColumns(count);
      position(geometry);
      render(items || []);
      alignAll(anchor);
      // 宿主正文列隐藏：C 自己渲染副本，底下不留一份重复内容。
      adapter.setStyle(target.column, 'visibility', 'hidden');
      return true;
    }

    /**
     * 只更新脏消息（流式输出走这条路）：原地换节点，不重建整栏，
     * 否则每 120ms 重排三栏 × 上百条会把滚动位置也一起打掉。
     * @returns {boolean} 是否处理成功；失败则退回整栏重建
     */
    function patchDirty(items, dirty) {
      const byId = new Map(items.map((item) => [item.id, item]));
      for (let i = 0; i < cols.length; i += 1) {
        const body = cols[i].body;
        for (const id of dirty) {
          const item = byId.get(id);
          const old = body.querySelector('[data-dshc-clone="' + cssEscape(id) + '"]');
          if (!item) {
            if (old) old.remove();
            for (const map of copies) map.delete(id);
            continue;
          }
          if (!old) return false;
          copies[i].delete(id);
          const node = nodeFor(i, item);
          if (!node) return false;
          body.replaceChild(node, old);
        }
      }
      lastCount = items.length;
      return true;
    }

    function update(items, info, change) {
      if (!active) return;
      const dirty = change && change.dirty ? change.dirty : null;
      const structural = !!(change && change.structural);
      // 没有结构性变化、也没有消息被改过：只刷新状态文字，不动 DOM。
      if (change && !structural && (!dirty || dirty.size === 0)) {
        setMeta(info);
        return;
      }
      if (!structural && dirty && dirty.size > 0 && patchDirty(items || [], dirty)) {
        setMeta(info);
        return;
      }
      if (dirty) {
        for (const id of dirty) for (const map of copies) map.delete(id);
      }
      render(items || []);
      setMeta(info);
    }

    function setColumns(count, items) {
      if (!active) return;
      if (count === columns) return;
      buildColumns(count);
      render(items || []);
    }

    function restore() {
      active = false;
      root.hidden = true;
      suppress = true;
      for (const entry of cols) entry.body.replaceChildren();
      colsBox.textContent = '';
      cols = [];
      copies = [];
      suppress = false;
    }

    olderBtn.addEventListener('click', () => onNeedMore());

    return {
      element: root,
      apply,
      update,
      setColumns,
      setMeta,
      position,
      restore,
      isActive: () => active
    };
  }

  return { create };
})();


/* ============================================================ src/controller.js */
/**
 * 悬浮控制器：模式、列数、各模式独立的自动加载开关、历史状态。
 *
 * 规范落点：
 *  - 只靠点击/触摸/键盘（原生 button）展开与切换，不依赖 hover；
 *  - aria-expanded / aria-pressed / role=group / aria-live / :focus-visible；
 *  - Esc 收起、点外部收起；窄屏（<768px）折叠成小图标并强制单列；
 *  - 不遮挡底部输入区与右侧原生滚动条，状态持久化由上层负责。
 *
 * 这里全部用 createElement 构建，不用 innerHTML：既是安全习惯，
 * 也让 scripts/smoke.mjs 能用最小 DOM 桩跑通挂载路径。
 */
DSHC.controller = (() => {
  'use strict';

  const MODES = [
    { id: 'native', label: '原生', mark: '原', icon: 'none' },
    { id: 'newspaper', label: '报纸', mark: '报', icon: 'cols' },
    { id: 'seamless', label: '无缝', mark: '缝', icon: 'seam' },
    { id: 'mirror', label: '复制', mark: '复', icon: 'mirror' }
  ];

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const ICONS = {
    none: [{ x: 5, y: 3, w: 10, h: 14, o: 0.5 }],
    cols: [
      { x: 2.6, y: 3, w: 4.2, h: 14, o: 0.85 },
      { x: 7.9, y: 3, w: 4.2, h: 14, o: 0.85 },
      { x: 13.2, y: 3, w: 4.2, h: 14, o: 0.85 }
    ],
    seam: [
      { x: 2.6, y: 3, w: 6.4, h: 6.2, o: 0.85 },
      { x: 11, y: 3, w: 6.4, h: 6.2, o: 0.45 },
      { x: 2.6, y: 10.8, w: 6.4, h: 6.2, o: 0.45 },
      { x: 11, y: 10.8, w: 6.4, h: 6.2, o: 0.85 }
    ],
    mirror: [
      { x: 2.6, y: 3, w: 6.2, h: 14, o: 0.85 },
      { x: 10.8, y: 3, w: 6.6, h: 14, o: 0.45 }
    ]
  };

  function el(tag, className, attrs) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (attrs) {
      for (const name of Object.keys(attrs)) {
        const value = attrs[name];
        if (value === undefined || value === null) continue;
        node.setAttribute(name, String(value));
      }
    }
    return node;
  }

  function svgIcon(kind) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    for (const rect of ICONS[kind] || ICONS.none) {
      const node = document.createElementNS(SVG_NS, 'rect');
      node.setAttribute('x', String(rect.x));
      node.setAttribute('y', String(rect.y));
      node.setAttribute('width', String(rect.w));
      node.setAttribute('height', String(rect.h));
      node.setAttribute('rx', '1.2');
      node.setAttribute('fill', 'currentColor');
      node.setAttribute('opacity', String(rect.o));
      svg.appendChild(node);
    }
    return svg;
  }

  function create(options) {
    const root = options.root;
    const onMode = options.onMode || function noop() {};
    const onColumns = options.onColumns || function noop() {};
    const onAutoLoad = options.onAutoLoad || function noop() {};
    const onLoadEarlier = options.onLoadEarlier || function noop() {};
    const onRetry = options.onRetry || function noop() {};

    const wrap = el('div', 'dshc-ctl', { 'data-dshc-open': 'false', 'data-dshc-mode': 'native' });

    const toggle = el('button', 'dshc-ctl-toggle', {
      type: 'button',
      'aria-expanded': 'false',
      'aria-controls': 'dshc-panel',
      'aria-label': '多列阅读设置'
    });
    const iconBox = el('span', 'dshc-ctl-icon');
    iconBox.setAttribute('aria-hidden', 'true');
    iconBox.appendChild(svgIcon('none'));
    const mark = el('span', 'dshc-ctl-mark', { 'aria-hidden': 'true' });
    mark.textContent = '原';
    const dot = el('span', 'dshc-ctl-dot', { 'aria-hidden': 'true' });
    toggle.append(iconBox, mark, dot);

    const panel = el('div', 'dshc-panel', {
      id: 'dshc-panel',
      role: 'group',
      'aria-label': '多列阅读设置'
    });
    panel.hidden = true;

    const head = el('div', 'dshc-panel-head');
    const title = el('span', 'dshc-panel-title');
    title.textContent = '多列阅读';
    const sub = el('span', 'dshc-panel-sub');
    head.append(title, sub);

    const modesGroup = el('div', 'dshc-group');
    const modesLabel = el('span', 'dshc-label', { id: 'dshc-label-mode' });
    modesLabel.textContent = '显示模式';
    const modesBox = el('div', 'dshc-seg', { role: 'group', 'aria-labelledby': 'dshc-label-mode' });
    const modeButtons = MODES.map((mode) => {
      const button = el('button', null, { type: 'button', 'data-mode': mode.id, 'aria-pressed': 'false' });
      button.textContent = mode.label;
      modesBox.appendChild(button);
      return button;
    });
    modesGroup.append(modesLabel, modesBox);

    const colsGroup = el('div', 'dshc-group', { 'data-role': 'cols-group' });
    const colsLabel = el('span', 'dshc-label', { id: 'dshc-label-cols' });
    colsLabel.textContent = '列数';
    const colsBox = el('div', 'dshc-seg', { role: 'group', 'aria-labelledby': 'dshc-label-cols' });
    const colValues = [
      ['auto', '自动'],
      ['1', '1'],
      ['2', '2'],
      ['3', '3']
    ];
    const colButtons = colValues.map(([value, label]) => {
      const button = el('button', null, { type: 'button', 'data-cols': value, 'aria-pressed': 'false' });
      button.textContent = label;
      colsBox.appendChild(button);
      return button;
    });
    colsGroup.append(colsLabel, colsBox);

    const autoGroup = el('div', 'dshc-group', { 'data-role': 'auto-group' });
    const autoLabel = el('label', 'dshc-switch');
    const autoInput = el('input', null, { type: 'checkbox', 'data-role': 'auto' });
    const autoUi = el('span', 'dshc-switch-ui', { 'aria-hidden': 'true' });
    const autoText = el('span', 'dshc-switch-text');
    autoText.textContent = '到顶自动加载更早';
    autoLabel.append(autoInput, autoUi, autoText);
    autoGroup.appendChild(autoLabel);

    const status = el('div', 'dshc-status', { 'aria-live': 'polite' });
    const actions = el('div', 'dshc-actions');
    const earlierBtn = el('button', 'dshc-action', { type: 'button', 'data-role': 'earlier' });
    earlierBtn.textContent = '加载更早';
    earlierBtn.hidden = true;
    const retryBtn = el('button', 'dshc-action', { type: 'button', 'data-role': 'retry' });
    retryBtn.textContent = '重试加载';
    retryBtn.hidden = true;
    actions.append(earlierBtn, retryBtn);
    const note = el('div', 'dshc-note', { 'data-role': 'note' });
    note.hidden = true;

    panel.append(head, modesGroup, colsGroup, autoGroup, status, actions, note);
    wrap.append(toggle, panel);

    // 顶部手动「加载更早」悬浮胶囊：报纸默认手动、无缝关闭自动加载时的唯一入口。
    const pill = el('button', 'dshc-pill', { type: 'button' });
    const pillIcon = el('span', 'dshc-pill-icon', { 'aria-hidden': 'true' });
    pillIcon.textContent = '↑';
    const pillText = el('span');
    pillText.textContent = '加载更早';
    pill.append(pillIcon, pillText);
    pill.hidden = true;

    root.append(wrap, pill);

    let open = false;
    let lastMode = '';

    function setOpen(next, focusToggle) {
      open = !!next;
      wrap.setAttribute('data-dshc-open', open ? 'true' : 'false');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.hidden = !open;
      if (open) {
        const activeBtn =
          modeButtons.find((button) => button.getAttribute('aria-pressed') === 'true' && !button.disabled) ||
          modeButtons[0] ||
          toggle;
        if (activeBtn && typeof activeBtn.focus === 'function') activeBtn.focus({ preventScroll: true });
      } else if (focusToggle && typeof toggle.focus === 'function') {
        toggle.focus({ preventScroll: true });
      }
    }

    function onPointerDown(event) {
      if (!open) return;
      const target = event && event.target;
      if (!target || !wrap.contains(target)) setOpen(false, false);
    }

    function onKeyDown(event) {
      if (!event || event.key !== 'Escape' || !open) return;
      if (typeof event.preventDefault === 'function') event.preventDefault();
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      setOpen(false, true);
    }

    function onFocusOut(event) {
      if (!open) return;
      const next = event && event.relatedTarget;
      if (next && !wrap.contains(next)) setOpen(false, false);
    }

    function modeLabel(id) {
      for (const mode of MODES) if (mode.id === id) return mode.label;
      return '原生';
    }

    function statusText(current) {
      const h = current.history || { state: 'unknown', hasMore: false, count: 0 };
      if (!current.caps.scroller || !current.caps.column) return '未识别到会话，保持原生';
      const historyText =
        h.state === 'unknown'
          ? '正在读取会话…'
          : h.state === 'loading'
            ? '正在加载更早…'
            : h.state === 'error'
              ? '历史加载失败'
              : h.hasMore
                ? '还有更早历史'
                : '已到最早';
      if (current.mode === 'native') {
        return '原生单列' + (h.count > 0 ? ' · ' + h.count + ' 条消息' : '');
      }
      return modeLabel(current.mode) + ' ' + current.resolved + ' 列 · ' + historyText;
    }

    function noteText(current) {
      const parts = [];
      if (current.caps.scroller && !current.caps.column) parts.push('未识别到会话正文列，已保持原生。');
      if (current.reason === 'ambiguous') parts.push('检测到多个疑似会话且无法确定主会话，已保持原生。');
      if (current.mobile) parts.push('窄屏已强制单列。');
      else if (current.mode !== 'native' && current.resolved < 2) parts.push('当前宽度只够 1 列。');
      if (current.mode === 'newspaper') parts.push('所有列共用宿主滚动容器，滚动与锚点仍是宿主原生机制。');
      if (current.mode === 'seamless') parts.push('列高等于阅读视口；超高的单条消息在消息内部滚动。');
      if (current.mode === 'mirror') parts.push('只读副本：可选中文字、可打开链接，按钮不可点。');
      if (current.prefNote) parts.push(current.prefNote);
      return parts.join(' ');
    }

    function render(next) {
      const current = next || {};
      const mode = current.mode || 'native';
      const info = MODES.find((item) => item.id === mode) || MODES[0];

      wrap.setAttribute('data-dshc-mode', mode);
      wrap.setAttribute(
        'data-dshc-status',
        current.history && current.history.state === 'error'
          ? 'error'
          : current.history && current.history.state === 'loading'
            ? 'busy'
            : 'ok'
      );
      toggle.setAttribute('aria-label', '多列阅读设置：' + info.label);
      iconBox.replaceChildren(svgIcon(info.icon));
      mark.textContent = info.mark;
      sub.textContent = mode === 'native' ? '单列' : (current.resolved || 1) + ' 列';

      for (const button of modeButtons) {
        const id = button.getAttribute('data-mode');
        button.setAttribute('aria-pressed', id === mode ? 'true' : 'false');
        button.disabled = !current.enhanced;
        if (current.enhanced) button.removeAttribute('title');
        else button.setAttribute('title', '未识别到会话');
      }

      const showCols = mode !== 'native';
      colsGroup.hidden = !showCols;
      for (const button of colButtons) {
        const value = button.getAttribute('data-cols');
        button.setAttribute('aria-pressed', value === String(current.columns) ? 'true' : 'false');
        button.disabled = !!current.mobile;
      }

      autoGroup.hidden = mode === 'native';
      autoInput.checked = !!current.autoLoad;
      autoText.textContent = '到顶自动加载更早（' + modeLabel(mode) + '）';

      const h = current.history || { state: 'unknown', hasMore: false, count: 0, canRetry: false };
      const showEarlier = mode !== 'native' && h.hasMore && h.state !== 'loading';
      earlierBtn.hidden = !showEarlier;
      retryBtn.hidden = h.state !== 'error';
      status.textContent = statusText(current);

      const text = noteText(current);
      note.textContent = text;
      note.hidden = text === '';

      const wantPill =
        !!current.caps && current.caps.column && h.hasMore && h.state !== 'loading' &&
        (mode === 'newspaper' || (mode === 'seamless' && !current.autoLoad));
      pill.hidden = !wantPill;

      if (lastMode !== mode) {
        lastMode = mode;
        root.setAttribute('data-dshc-mode', mode);
      }
    }

    function position(rect) {
      if (!rect) return;
      const scrollbar = rect.scrollbarWidth || 5;
      // 右侧让出：原生滚动条 + 安全距 + TurnNavigator 轨道（28px + 12px）。
      const rightInset = Math.max(12, window.innerWidth - rect.right + scrollbar + 12 + 40);
      wrap.style.top = Math.max(8, Math.round(rect.top) + 10) + 'px';
      wrap.style.right = Math.round(rightInset) + 'px';
      const maxPanel = Math.max(220, Math.min(460, Math.round(rect.height) - 88));
      panel.style.maxHeight = maxPanel + 'px';
      pill.style.top = Math.max(8, Math.round(rect.top) + 10) + 'px';
      pill.style.left = Math.round(rect.left + rect.width / 2) + 'px';
    }

    toggle.addEventListener('click', () => setOpen(!open, false));

    for (const button of modeButtons) {
      button.addEventListener('click', () => {
        if (button.disabled) return;
        onMode(button.getAttribute('data-mode'));
      });
    }

    for (const button of colButtons) {
      button.addEventListener('click', () => {
        if (button.disabled) return;
        onColumns(button.getAttribute('data-cols'));
      });
    }

    autoInput.addEventListener('change', () => onAutoLoad(autoInput.checked));
    earlierBtn.addEventListener('click', () => onLoadEarlier());
    retryBtn.addEventListener('click', () => onRetry());
    pill.addEventListener('click', () => onLoadEarlier());

    document.addEventListener('pointerdown', onPointerDown, true);
    wrap.addEventListener('keydown', onKeyDown);
    wrap.addEventListener('focusout', onFocusOut);

    function destroy() {
      document.removeEventListener('pointerdown', onPointerDown, true);
      wrap.removeEventListener('keydown', onKeyDown);
      wrap.removeEventListener('focusout', onFocusOut);
      wrap.remove();
      pill.remove();
    }

    return {
      render,
      position,
      setOpen,
      isOpen: () => open,
      destroy,
      element: wrap
    };
  }

  return { create, MODES };
})();


/* ============================================================ src/index.js */
/**
 * App — 生命周期、状态与编排。
 *
 * 只有这里持有状态：
 *  - 设置（模式 / 列数 / 各模式自动加载）持久化到 localStorage['dshc-settings']；
 *  - 目标识别失败、多候选分不清、宽度不够时安全降级为原生单列，绝不抛未捕获异常；
 *  - 所有对宿主的写入都经过 HostAdapter 的快照，unmount 时 100% 还原。
 */
DSHC.app = (() => {
  'use strict';

  const VERSION = '3.1.2';
  const SETTINGS_KEY = 'dshc-settings';
  const MODES = ['native', 'newspaper', 'seamless', 'mirror'];
  const COLS = ['auto', '1', '2', '3'];
  const MOBILE_QUERY = '(max-width: 767px)';
  const DEFAULT_AUTO = { newspaper: false, seamless: true, mirror: true };

  const state = {
    mode: 'native',
    cols: 'auto',
    autoLoad: Object.assign({}, DEFAULT_AUTO),
    resolved: 1
  };

  const target = { scroller: null, column: null, reason: 'no-conversation', rows: 0 };

  let mounted = false;
  let disposed = false;
  let started = false;
  let pluginCtx = null;
  let mountTimer = 0;
  let bootRetries = 0;

  let rootEl = null;
  let controller = null;
  let history = null;
  let indexer = null;
  let newspaper = null;
  let seamless = null;
  let mirror = null;

  let themeWatch = null;
  let mobileMq = null;
  let mobileListener = null;
  let resizeObserver = null;
  let resizeRaf = 0;
  let resolveTimer = 0;
  let startupWatch = null;
  let sessionKey = '';

  /* ----------------------------------------------------------- 设置存取 */

  function readSettings() {
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    } catch (error) {
      raw = null;
    }
    const value = raw && typeof raw === 'object' ? raw : {};
    const auto = value.autoLoadHistory && typeof value.autoLoadHistory === 'object' ? value.autoLoadHistory : {};
    return {
      mode: MODES.indexOf(value.mode) >= 0 ? value.mode : 'native',
      cols: COLS.indexOf(String(value.cols)) >= 0 ? String(value.cols) : 'auto',
      autoLoad: {
        newspaper: auto.newspaper === undefined ? DEFAULT_AUTO.newspaper : !!auto.newspaper,
        seamless: auto.seamless === undefined ? DEFAULT_AUTO.seamless : !!auto.seamless,
        mirror: auto.mirror === undefined ? DEFAULT_AUTO.mirror : !!auto.mirror
      }
    };
  }

  function writeSettings() {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          v: 1,
          mode: state.mode,
          cols: state.cols,
          autoLoadHistory: state.autoLoad
        })
      );
    } catch (error) {
      /* localStorage 不可用时保持内存态 */
    }
  }

  function autoFor(mode) {
    if (mode === 'newspaper' || mode === 'seamless' || mode === 'mirror') return !!state.autoLoad[mode];
    return false;
  }

  /* ------------------------------------------------------------- 视口信息 */

  function isMobile() {
    if (mobileMq) return !!mobileMq.matches;
    return window.innerWidth < 768;
  }

  function geometry() {
    return target.scroller ? DSHC.adapter.measure(target.scroller) : null;
  }

  function availableWidth() {
    if (!target.column || !target.scroller) return 0;
    return DSHC.adapter.availableWidth(target.column, target.scroller);
  }

  function computeColumns() {
    return DSHC.math.resolveColumns(availableWidth(), state.cols, isMobile());
  }

  /* ----------------------------------------------------------------- 视图 */

  function viewState() {
    return {
      mode: state.mode,
      columns: state.cols,
      resolved: state.resolved,
      autoLoad: autoFor(state.mode),
      mobile: isMobile(),
      enhanced: !!(target.scroller && target.column) && target.reason !== 'ambiguous',
      reason: target.reason,
      prefNote: state.prefNote || '',
      caps: { scroller: !!target.scroller, column: !!target.column },
      history: history ? history.snapshot() : { state: 'unknown', hasMore: false, count: 0, canRetry: false }
    };
  }

  function render() {
    if (!controller) return;
    controller.render(viewState());
    const rect = geometry();
    if (rect) controller.position(rect);
  }

  /* ----------------------------------------------------------- 历史状态 */

  function refreshHistory() {
    if (!history) return;
    const button = target.column ? DSHC.adapter.findOlderButton(target.column) : null;
    let count = 0;
    let firstId = '';
    if (indexer) {
      const items = indexer.read();
      count = items.length;
      firstId = items.length ? items[0].id : '';
    }
    history.refresh({ button, count, firstId });
  }

  /* ------------------------------------------------------------ 宿主改写 */

  function hideHostOlder(hide) {
    if (!target.column) return;
    const button = DSHC.adapter.findOlderButton(target.column);
    const wrap = DSHC.adapter.olderWrapper(button);
    if (!wrap) return;
    if (hide) DSHC.adapter.setAttr(wrap, DSHC.adapter.MARK.hide, 'older');
  }

  function resetHost() {
    if (newspaper) newspaper.restore();
    if (seamless) seamless.restore();
    if (mirror) mirror.restore();
    if (target.column) {
      DSHC.adapter.resetEl(target.column);
      for (const item of DSHC.adapter.getItems(target.column)) DSHC.adapter.resetEl(item.el);
    }
    if (target.scroller) DSHC.adapter.resetEl(target.scroller);
    // 装饰节点（宿主的「加载更早」按钮）由快照统一还原。
    for (const el of document.querySelectorAll('[' + DSHC.adapter.MARK.hide + ']')) {
      DSHC.adapter.resetEl(el);
    }
  }

  function itemsFromIndex() {
    return indexer ? indexer.read() : [];
  }

  /* -------------------------------------------------------------- 应用模式 */

  function applyMode() {
    if (!mounted || disposed) return;
    if (!target.scroller || !target.column) {
      if (history) {
        history.setAuto(false);
        history.setScrollSource(null);
      }
      state.resolved = 1;
      render();
      return;
    }

    // 切换前记住阅读位置：任何模式变化都不该把用户扔回顶部。
    const anchor = DSHC.adapter.captureAnchor(target.scroller, target.column);
    try {
      resetHost();
      if (anchor) DSHC.adapter.restoreAnchor(target.scroller, target.column, anchor);
      state.resolved = computeColumns();
      applyView(anchor);
    } catch (error) {
      // 布局出错也绝不把宿主留在半个状态里。
      console.error('[dsh-chat-columns] apply mode failed', error);
      try {
        resetHost();
      } catch (inner) {
        console.error('[dsh-chat-columns] reset failed', inner);
      }
      state.prefNote = '布局失败，已退回原生';
    }

    if (history) {
      history.setAuto(autoFor(state.mode));
      history.setScrollSource(state.mode === 'newspaper' || state.mode === 'seamless' ? target.scroller : null);
    }

    refreshHistory();
    render();
  }

  /** 按当前模式应用视图；降级原因通过 state.prefNote 反馈给控制器。 */
  function applyView(anchor) {
    const items = itemsFromIndex();
    let note = '';

    if (state.mode === 'newspaper') {
      if (state.resolved < 2) {
        note = '当前宽度只够 1 列';
      } else {
        hideHostOlder(true);
        newspaper.apply(target, state.resolved);
      }
    } else if (state.mode === 'seamless') {
      if (state.resolved < 2) {
        note = '当前宽度只够 1 列';
      } else {
        hideHostOlder(true);
        if (!seamless.apply(target, state.resolved, items)) note = '无缝模式初始化失败，已退回原生';
      }
    } else if (state.mode === 'mirror') {
      hideHostOlder(true);
      DSHC.adapter.setAttr(target.scroller, 'data-dshc-hide-scrollbar', '');
      mirror.setColumns(state.resolved, items);
      // 复制模式：每栏都是完整副本，进入时让所有栏停在同一阅读位置。
      mirror.apply(target, state.resolved, items, geometry(), anchor);
      mirror.setMeta({ history: history ? history.snapshot() : null });
    }

    if (note) state.prefNote = note;
    else delete state.prefNote;
  }

  /* ------------------------------------------------------------ 消息变化 */

  function onItemsChange(change) {
    if (!mounted || disposed) return;

    const session = DSHC.adapter.sessionKey(target.scroller);
    if (session && session !== sessionKey) {
      sessionKey = session;
      scheduleResolve(true);
      return;
    }

    if (state.mode === 'newspaper') {
      // 结构变化立刻重排；流式增长稍等一会儿，别每批 token 都强制同步布局
      newspaper.tune(change.structural ? 0 : 600);
    } else if (state.mode === 'seamless') {
      seamless.update(itemsFromIndex(), change.dirty);
    } else if (state.mode === 'mirror') {
      mirror.update(itemsFromIndex(), { history: history ? history.snapshot() : null }, change);
    }

    refreshHistory();
    render();
  }

  /* ------------------------------------------------------------ 目标识别 */

  function scheduleResolve(force) {
    if (resolveTimer) return;
    resolveTimer = setTimeout(() => {
      resolveTimer = 0;
      resolve(!!force);
    }, 80);
  }

  function rebuildIndexer() {
    if (indexer) indexer.destroy();
    indexer = null;
    if (target.column) {
      indexer = DSHC.indexer.create(target.column, { onChange: onItemsChange });
    }
  }

  function resolve(force) {
    if (!mounted || disposed) return;
    try {
      const found = DSHC.adapter.resolve();
      const nextSession = DSHC.adapter.sessionKey(found.scroller);
      const changed =
        found.scroller !== target.scroller ||
        found.column !== target.column ||
        found.reason !== target.reason ||
        (nextSession && nextSession !== sessionKey);

      if (!changed && !force) {
        refreshHistory();
        if (state.mode === 'mirror') mirror.setMeta({ history: history ? history.snapshot() : null });
        render();
        return;
      }

      resetHost();
      if (history) history.reset();

      target.scroller = found.scroller;
      target.column = found.column;
      target.reason = found.reason;
      target.rows = found.rows;
      sessionKey = nextSession || sessionKey;

      observeResize(found.scroller);
      rebuildIndexer();
      applyMode();
    } catch (error) {
      console.error('[dsh-chat-columns] resolve failed', error);
    }
  }

  /* --------------------------------------------------------------- 观察器 */

  function observeResize(scroller) {
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = null;
    if (!scroller || typeof ResizeObserver !== 'function') return;
    resizeObserver = new ResizeObserver(() => onResize());
    resizeObserver.observe(scroller);
    const composer = DSHC.adapter.findComposer(scroller);
    if (composer) resizeObserver.observe(composer);
  }

  function onResize() {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      if (!mounted || disposed) return;
      if (!target.scroller || !target.scroller.isConnected || !target.column || !target.column.isConnected) {
        scheduleResolve(true);
        return;
      }
      const rect = geometry();
      if (rect && controller) controller.position(rect);

      const next = computeColumns();
      if (next !== state.resolved) {
        // 列数变了：三种模式的实现都依赖列宽，整体重来一次比逐处修补可靠。
        state.resolved = next;
        applyMode();
        return;
      }
      if (state.mode === 'seamless') seamless.relayout();
      else if (state.mode === 'mirror') mirror.position(rect);
      else if (state.mode === 'newspaper') newspaper.tune();
      render();
    });
  }

  function verifyTarget() {
    if (!mounted || disposed) return;
    if (!target.scroller || !target.scroller.isConnected) {
      scheduleResolve(true);
      return;
    }
    if (!target.column || !target.column.isConnected) {
      scheduleResolve(true);
      return;
    }
    const found = DSHC.adapter.resolve();
    if (found.scroller !== target.scroller || found.column !== target.column) scheduleResolve(true);
  }

  function onVisibility() {
    if (!document.hidden) verifyTarget();
  }

  function onViewportResize() {
    onResize();
  }

  /* --------------------------------------------------------------- 意图 */

  function setMode(mode) {
    if (MODES.indexOf(mode) < 0 || mode === state.mode) return;
    state.mode = mode;
    writeSettings();
    applyMode();
  }

  function setColumns(value) {
    const next = String(value);
    if (COLS.indexOf(next) < 0 || next === state.cols) return;
    state.cols = next;
    writeSettings();
    applyMode();
  }

  function setAutoLoad(value) {
    const mode = state.mode;
    if (mode !== 'newspaper' && mode !== 'seamless' && mode !== 'mirror') return;
    state.autoLoad[mode] = !!value;
    writeSettings();
    if (history) {
      history.setAuto(autoFor(mode));
      history.setScrollSource(mode === 'newspaper' || mode === 'seamless' ? target.scroller : null);
    }
    render();
  }

  function loadEarlier() {
    if (history) history.request('manual');
  }

  /* --------------------------------------------------------------- 样式 */

  const STYLES = [
    ['dsh-chat-columns/tokens.css', TOKENS_CSS],
    ['dsh-chat-columns/layout.css', LAYOUT_CSS]
  ];

  function injectStyles() {
    for (const [id, css] of STYLES) {
      const selector = 'style[data-dshc-css="' + id + '"]';
      if (document.querySelector(selector)) continue;
      const tag = document.createElement('style');
      tag.setAttribute('data-dshc-css', id);
      tag.textContent = css;
      document.head.appendChild(tag);
    }
  }

  function removeStyles() {
    for (const tag of document.querySelectorAll('style[data-dshc-css]')) tag.remove();
  }

  /* ------------------------------------------------------------ 生命周期 */

  function mount() {
    if (mounted) return api;
    mounted = true;
    disposed = false;

    const settings = readSettings();
    state.mode = settings.mode;
    state.cols = settings.cols;
    state.autoLoad = settings.autoLoad;

    injectStyles();

    // 旧实例残留（热更）先清掉，避免两个控制器叠在一起。
    for (const stale of document.querySelectorAll('#' + 'dshc-root')) stale.remove();

    rootEl = document.createElement('div');
    rootEl.id = 'dshc-root';
    rootEl.setAttribute(DSHC.adapter.MARK.instance, VERSION + ':' + Date.now().toString(36));
    rootEl.setAttribute('data-dshc-theme', DSHC.adapter.detectTheme());
    document.body.appendChild(rootEl);

    newspaper = DSHC.newspaper.create({});
    seamless = DSHC.seamless.create({});
    mirror = DSHC.mirror.create({
      onNeedMore: () => {
        if (history) history.request('auto');
      },
      isAuto: () => autoFor('mirror')
    });
    rootEl.appendChild(mirror.element);

    history = DSHC.history.create({ onChange: () => render() });
    controller = DSHC.controller.create({
      root: rootEl,
      onMode: setMode,
      onColumns: setColumns,
      onAutoLoad: setAutoLoad,
      onLoadEarlier: loadEarlier,
      onRetry: () => {
        if (history) history.retry();
      }
    });

    themeWatch = DSHC.adapter.watchTheme(() => {
      if (rootEl) rootEl.setAttribute('data-dshc-theme', DSHC.adapter.detectTheme());
    });

    mobileMq = window.matchMedia(MOBILE_QUERY);
    mobileListener = () => onResize();
    if (typeof mobileMq.addEventListener === 'function') mobileMq.addEventListener('change', mobileListener);
    else if (typeof mobileMq.addListener === 'function') mobileMq.addListener(mobileListener);

    window.addEventListener('resize', onViewportResize, { passive: true });
    window.addEventListener('focus', verifyTarget);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('pointerdown', verifyTarget, true);

    // 插件先于会话渲染时等滚动容器出现（一次性观察，不是常驻全页观察器）。
    startupWatch = DSHC.adapter.watchForScroller(() => scheduleResolve(true));

    startExpose();
    render();
    resolve(true);
    return api;
  }

  function unmount() {
    if (!mounted) return;
    mounted = false;
    disposed = true;

    // 热更场景：旧实例的 disposer 可能晚于新实例执行。
    // 如果我们的根节点已经被新实例摘掉，只清理自己的监听与定时器，绝不回滚新实例的宿主改动。
    const stale = !!(rootEl && !rootEl.isConnected);

    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = 0;
    if (resolveTimer) clearTimeout(resolveTimer);
    resolveTimer = 0;
    if (mountTimer) clearTimeout(mountTimer);
    mountTimer = 0;
    bootRetries = 0;
    started = false;

    if (themeWatch) themeWatch();
    themeWatch = null;
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = null;
    if (startupWatch) startupWatch();
    startupWatch = null;
    if (mobileMq && mobileListener) {
      if (typeof mobileMq.removeEventListener === 'function') mobileMq.removeEventListener('change', mobileListener);
      else if (typeof mobileMq.removeListener === 'function') mobileMq.removeListener(mobileListener);
    }
    mobileMq = null;
    mobileListener = null;

    window.removeEventListener('resize', onViewportResize);
    window.removeEventListener('focus', verifyTarget);
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('pointerdown', verifyTarget, true);

    if (!stale) {
      resetHost();
      if (newspaper) newspaper.destroy();
      if (seamless) seamless.restore();
      if (mirror) mirror.restore();
      DSHC.adapter.resetAll();
    }
    newspaper = null;
    seamless = null;
    mirror = null;

    if (indexer) indexer.destroy();
    indexer = null;
    if (history) history.destroy();
    history = null;
    if (controller) controller.destroy();
    controller = null;

    target.scroller = null;
    target.column = null;
    target.reason = 'no-conversation';
    target.rows = 0;
    sessionKey = '';

    if (rootEl) rootEl.remove();
    rootEl = null;

    if (!stale) {
      removeStyles();
      try {
        delete window.__dshc;
      } catch (error) {
        window.__dshc = undefined;
      }
    }
  }

  /* ----------------------------------------------------------------- API */

  function diagnose() {
    const rect = geometry();
    return {
      version: VERSION,
      state: viewState(),
      target: {
        reason: target.reason,
        rows: target.rows,
        session: sessionKey,
        scroller: !!target.scroller,
        column: !!target.column
      },
      geometry: rect
        ? {
            top: Math.round(rect.top),
            left: Math.round(rect.left),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            composerHeight: Math.round(rect.composerHeight)
          }
        : null,
      available: Math.round(availableWidth()),
      newspaper: newspaper ? newspaper.diagnose() : null,
      seamless: seamless ? seamless.diagnose() : null,
      mirror: mirror ? { active: mirror.isActive() } : null,
      history: history ? history.snapshot() : null
    };
  }

  const api = {
    version: VERSION,
    mount,
    unmount,
    start(ctx) {
      pluginCtx = ctx || null;
      if (started) return api;
      started = true;
      scheduleMount();
      if (pluginCtx && typeof pluginCtx.effect === 'function') {
        try {
          pluginCtx.effect(() => () => api.unmount(), 'ui: dsh-chat-columns');
        } catch (error) {
          console.error('[dsh-chat-columns] ctx.effect registration failed', error);
        }
      }
      return api;
    },
    getState: viewState,
    diagnose,
    setMode,
    setColumns,
    setAutoLoad,
    loadEarlier,
    refresh: () => resolve(true)
  };

  /**
   * 激活入口：**绝不向外抛异常**。
   * 插件再坏也不允许把宿主启动流程带崩（2.0 的历史教训：
   * 一次 mount 异常会让整个 web boot 报 "1 entry did not activate"）。
   */
  function scheduleMount() {
    if (mounted || disposed || mountTimer) return;
    mountTimer = setTimeout(() => {
      mountTimer = 0;
      if (mounted || disposed) return;
      try {
        if (!document.body || !document.documentElement) throw new Error('document.body 尚未就绪');
        mount();
        bootRetries = 0;
        startExpose();
      } catch (error) {
        mounted = false;
        disposed = false;
        reportBootError(error);
        if (bootRetries < 3) {
          bootRetries += 1;
          scheduleMount();
        }
      }
    }, 0);
  }

  function startExpose() {
    window.__dshc = {
      version: VERSION,
      getState: viewState,
      diagnose,
      setMode,
      setColumns,
      setAutoLoad,
      loadEarlier,
      refresh: () => resolve(true),
      unmount: () => api.unmount()
    };
  }

  function reportBootError(error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack || '' : '';
    window.__dshcActivationError = { message, stack };
    console.error('[dsh-chat-columns] mount failed（插件不会影响宿主启动）', error);
    if (!window.__dshc) {
      window.__dshc = {
        version: VERSION,
        getState: viewState,
        lastError: window.__dshcActivationError,
        unmount: () => api.unmount()
      };
    }
  }

  return api;
})();

		exports.apply = (ctx) => { DSHC.app.start(ctx); };
		exports.mount = () => DSHC.app.mount();
		exports.unmount = () => DSHC.app.unmount();
		exports.inject = [];
		return module.exports;
	}
});
