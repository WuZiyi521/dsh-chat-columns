/*! dsh-chat-columns 1.0.0-beta.1 — generated from src/ by scripts/build.mjs. Do not edit. */
window.__ModuleLoader__.load({
	id: "dsh-chat-columns-3",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

		const DSHC = Object.create(null);
		const TOKENS_CSS = "/*!\n * dsh-chat-columns 3.0 — Design Tokens\n * 作用域：#dshc-root 内；宿主令牌优先，缺失时按主题回退。\n * 这里只定义变量与小工具类，禁止裸写全局标签样式。\n */\n\n#dshc-root {\n  color-scheme: light;\n\n  --dshc-bg: var(--dsw-alias-bg-base, #ffffff);\n  --dshc-bg-elevated: var(--dsw-alias-bg-elevated, #ffffff);\n  --dshc-text: var(--dsw-alias-label-primary, #1a1a1a);\n  --dshc-text-2: var(--dsw-alias-label-secondary, #4b4a45);\n  --dshc-text-3: var(--dsw-alias-label-tertiary, #6b6a63);\n  --dshc-border: var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.1));\n  --dshc-border-l2: var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.16));\n  --dshc-hover: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.05));\n  --dshc-accent: var(--dsw-alias-state-business-primary, #3964fe);\n  --dshc-danger: var(--dsw-alias-state-error-primary, #d92d20);\n  --dshc-success: var(--dsw-alias-state-success-primary, #12805c);\n  --dshc-focus: var(--dsw-focus-ring-color, #3964fe);\n  --dshc-thumb: var(--dsh-scrollbar-thumb, rgba(0, 0, 0, 0.26));\n  --dshc-shadow: var(--dsw-elevation-panel, 0 10px 30px rgba(0, 0, 0, 0.16));\n\n  --dshc-radius: var(--dsw-radius-md, 10px);\n  --dshc-radius-sm: var(--dsw-radius-sm, 8px);\n\n  --dshc-font-text: var(\n    --dsw-font-family,\n    var(--dsh-font-family-text-default, -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif)\n  );\n  --dshc-font-mono: var(\n    --dsw-font-family-mono,\n    var(--dsh-font-family-code-default, \"SFMono-Regular\", \"JetBrains Mono\", Consolas, \"Liberation Mono\", Menlo, monospace)\n  );\n  --dshc-font-size: var(--dsh-content-font-size, 14px);\n  --dshc-font-size-sm: 11px;\n  --dshc-font-size-md: 12px;\n\n  --dshc-col-gap: 40px;\n  --dshc-c-gap: 20px;\n  --dshc-pad: 12px;\n  --dshc-z: 40;\n\n  color: var(--dshc-text);\n  font-family: var(--dshc-font-text);\n  font-size: var(--dshc-font-size);\n}\n\n#dshc-root[data-dshc-theme=\"dark\"] {\n  color-scheme: dark;\n\n  --dshc-bg: var(--dsw-alias-bg-base, #1c1b1a);\n  --dshc-bg-elevated: var(--dsw-alias-bg-elevated, #242321);\n  --dshc-text: var(--dsw-alias-label-primary, #f2f1ee);\n  --dshc-text-2: var(--dsw-alias-label-secondary, #c9c7c0);\n  --dshc-text-3: var(--dsw-alias-label-tertiary, #9c9a93);\n  --dshc-border: var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.12));\n  --dshc-border-l2: var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.2));\n  --dshc-hover: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.07));\n  --dshc-accent: var(--dsw-alias-state-business-primary, #6d8cff);\n  --dshc-danger: var(--dsw-alias-state-error-primary, #ff6b60);\n  --dshc-success: var(--dsw-alias-state-success-primary, #4bd1a0);\n  --dshc-focus: var(--dsw-focus-ring-color, #6d8cff);\n  --dshc-thumb: var(--dsh-scrollbar-thumb, rgba(255, 255, 255, 0.3));\n  --dshc-shadow: var(--dsw-elevation-panel, 0 10px 30px rgba(0, 0, 0, 0.5));\n}\n\n/* 数据/状态用等宽字体，正文用系统字体 */\n#dshc-root .dshc-mono,\n#dshc-root .dshc-bar-sub,\n#dshc-root .dshc-col-tag,\n#dshc-root .dshc-status {\n  font-family: var(--dshc-font-mono);\n  font-variant-numeric: tabular-nums;\n}\n\n/* 极细滚动条：只在插件自己的容器内 */\n#dshc-root .dshc-col-body,\n#dshc-root .dshc-panel {\n  scrollbar-width: thin;\n  scrollbar-color: var(--dshc-thumb) transparent;\n}\n\n#dshc-root .dshc-col-body::-webkit-scrollbar,\n#dshc-root .dshc-panel::-webkit-scrollbar {\n  width: 7px;\n  height: 7px;\n}\n\n#dshc-root .dshc-col-body::-webkit-scrollbar-track,\n#dshc-root .dshc-panel::-webkit-scrollbar-track {\n  background: transparent;\n}\n\n#dshc-root .dshc-col-body::-webkit-scrollbar-thumb,\n#dshc-root .dshc-panel::-webkit-scrollbar-thumb {\n  background: var(--dshc-thumb);\n  border: 2px solid transparent;\n  border-radius: 999px;\n  background-clip: content-box;\n}\n\n/* 无动效偏好：关掉全部位移/展开动画 */\n@media (prefers-reduced-motion: reduce) {\n  #dshc-root .dshc-ctl,\n  #dshc-root .dshc-ctl-toggle,\n  #dshc-root .dshc-panel,\n  #dshc-root .dshc-pill,\n  #dshc-root .dshc-switch-ui,\n  #dshc-root .dshc-switch-ui::after,\n  #dshc-root .dshc-ctl-dot {\n    transition: none !important;\n    animation: none !important;\n  }\n}\n";
		const LAYOUT_CSS = "/*!\n * dsh-chat-columns 3.0 — Layout & Message Styles\n * 作用域约定：\n *  - 插件自己的界面：一律挂在 #dshc-root 下；\n *  - 宿主元素上的改动：一律带 [data-dshc-*] 标记（由 adapter 快照，可 100% 还原）；\n *  - 不写裸标签的全局样式，保证对宿主零污染。\n */\n\n/* ---------------------------------------------------------------- 根容器 */\n\n#dshc-root {\n  position: fixed;\n  inset: 0;\n  z-index: var(--dshc-z);\n  pointer-events: none;\n  color: var(--dshc-text);\n  font-family: var(--dshc-font-text);\n  font-size: var(--dshc-font-size);\n  line-height: 1.5;\n}\n\n#dshc-root [hidden] {\n  display: none !important;\n}\n\n#dshc-root :focus-visible {\n  outline: 2px solid var(--dshc-focus);\n  outline-offset: 2px;\n}\n\n/* 只规范化插件自己的盒子；克隆进镜像的宿主内容保持宿主原样 */\n#dshc-root .dshc-ctl,\n#dshc-root .dshc-ctl-toggle,\n#dshc-root .dshc-panel,\n#dshc-root .dshc-pill,\n#dshc-root .dshc-view,\n#dshc-root .dshc-bar,\n#dshc-root .dshc-cols,\n#dshc-root .dshc-col,\n#dshc-root .dshc-col-head,\n#dshc-root .dshc-col-body {\n  box-sizing: border-box;\n}\n\n/* ---------------------------------------------------------------- 控制器 */\n\n#dshc-root .dshc-ctl {\n  position: absolute;\n  top: 72px;\n  right: 18px;\n  width: 38px;\n  pointer-events: auto;\n  /* 复制模式会铺一整块覆盖层，控制器与面板必须压在它上面 */\n  z-index: 6;\n}\n\n#dshc-root .dshc-ctl-toggle {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 1px;\n  width: 38px;\n  height: 38px;\n  padding: 0;\n  color: var(--dshc-text-2);\n  background: var(--dshc-bg-elevated);\n  border: 1px solid var(--dshc-border);\n  border-radius: 12px;\n  box-shadow: var(--dshc-shadow);\n  opacity: 0.76;\n  cursor: pointer;\n  transition: opacity 0.12s linear, color 0.12s linear;\n}\n\n#dshc-root .dshc-ctl-toggle:hover,\n#dshc-root .dshc-ctl[data-dshc-open=\"true\"] .dshc-ctl-toggle,\n#dshc-root .dshc-ctl-toggle:focus-visible {\n  opacity: 1;\n  color: var(--dshc-text);\n}\n\n#dshc-root .dshc-ctl[data-dshc-open=\"true\"] .dshc-ctl-toggle {\n  border-color: var(--dshc-border-l2);\n}\n\n#dshc-root .dshc-ctl-icon {\n  display: inline-flex;\n  height: 16px;\n}\n\n#dshc-root .dshc-ctl-mark {\n  font-size: 10px;\n  letter-spacing: 0;\n  line-height: 1;\n  letter-spacing: 0.04em;\n  color: var(--dshc-text-3);\n}\n\n/* 贴进宿主右上角动作栏时：变成一个工具栏按钮（参考 Office 功能区） */\n#dshc-root .dshc-ctl[data-dshc-anchor=\"toolbar\"] {\n  width: auto;\n}\n\n#dshc-root .dshc-ctl[data-dshc-anchor=\"toolbar\"] .dshc-ctl-toggle {\n  flex-direction: row;\n  gap: 6px;\n  width: auto;\n  height: 30px;\n  padding: 0 10px;\n  border-radius: 8px;\n  border-color: transparent;\n  background: transparent;\n  box-shadow: none;\n  opacity: 0.86;\n}\n\n#dshc-root .dshc-ctl[data-dshc-anchor=\"toolbar\"] .dshc-ctl-toggle:hover,\n#dshc-root .dshc-ctl[data-dshc-anchor=\"toolbar\"][data-dshc-open=\"true\"] .dshc-ctl-toggle {\n  background: var(--dshc-hover);\n  border-color: var(--dshc-border);\n  opacity: 1;\n}\n\n#dshc-root .dshc-ctl[data-dshc-anchor=\"toolbar\"] .dshc-ctl-mark {\n  font-size: 12px;\n  letter-spacing: 0;\n  color: var(--dshc-text-2);\n}\n\n#dshc-root .dshc-ctl[data-dshc-anchor=\"toolbar\"] .dshc-ctl-dot {\n  top: 4px;\n  right: 4px;\n}\n\n#dshc-root .dshc-ctl-dot {\n  position: absolute;\n  top: 6px;\n  right: 6px;\n  width: 6px;\n  height: 6px;\n  border-radius: 50%;\n  background: transparent;\n}\n\n#dshc-root .dshc-ctl[data-dshc-mode=\"newspaper\"] .dshc-ctl-dot,\n#dshc-root .dshc-ctl[data-dshc-mode=\"seamless\"] .dshc-ctl-dot,\n#dshc-root .dshc-ctl[data-dshc-mode=\"mirror\"] .dshc-ctl-dot {\n  background: var(--dshc-accent);\n}\n\n#dshc-root .dshc-ctl[data-dshc-status=\"error\"] .dshc-ctl-dot {\n  background: var(--dshc-danger);\n}\n\n#dshc-root .dshc-ctl[data-dshc-status=\"busy\"] .dshc-ctl-dot {\n  background: var(--dshc-accent);\n  animation: dshc-pulse 1.2s ease-in-out infinite;\n}\n\n@keyframes dshc-pulse {\n  0%,\n  100% {\n    opacity: 0.35;\n  }\n  50% {\n    opacity: 1;\n  }\n}\n\n#dshc-root .dshc-panel {\n  position: absolute;\n  top: calc(100% + 8px);\n  right: 0;\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  width: 286px;\n  max-height: 420px;\n  overflow: auto;\n  padding: var(--dshc-pad);\n  background: var(--dshc-bg-elevated);\n  border: 1px solid var(--dshc-border);\n  border-radius: 14px;\n  box-shadow: var(--dshc-shadow);\n  color: var(--dshc-text);\n}\n\n/* 毛玻璃只在支持时启用；不支持就是上面的不透明背景（对比度兜底） */\n@supports ((backdrop-filter: blur(10px)) or (-webkit-backdrop-filter: blur(10px))) {\n  #dshc-root .dshc-ctl-toggle {\n    background: color-mix(in srgb, var(--dshc-bg-elevated) 86%, transparent);\n    -webkit-backdrop-filter: blur(12px) saturate(1.2);\n    backdrop-filter: blur(12px) saturate(1.2);\n  }\n}\n\n#dshc-root .dshc-panel-head {\n  display: flex;\n  align-items: baseline;\n  justify-content: space-between;\n  gap: 8px;\n}\n\n#dshc-root .dshc-panel-title {\n  font-size: 13px;\n  font-weight: 600;\n}\n\n#dshc-root .dshc-panel-sub {\n  font-size: var(--dshc-font-size-sm);\n  color: var(--dshc-text-3);\n}\n\n#dshc-root .dshc-group {\n  display: flex;\n  flex-direction: column;\n  gap: 5px;\n}\n\n#dshc-root .dshc-label {\n  font-size: var(--dshc-font-size-sm);\n  color: var(--dshc-text-3);\n}\n\n#dshc-root .dshc-seg {\n  display: flex;\n  gap: 2px;\n  padding: 2px;\n  background: var(--dshc-hover);\n  border-radius: 9px;\n}\n\n#dshc-root .dshc-seg button {\n  flex: 1 1 0;\n  min-width: 0;\n  padding: 6px 4px;\n  font: inherit;\n  font-size: var(--dshc-font-size-md);\n  color: var(--dshc-text-2);\n  background: transparent;\n  border: 0;\n  border-radius: 7px;\n  cursor: pointer;\n}\n\n#dshc-root .dshc-seg button:hover:not(:disabled) {\n  color: var(--dshc-text);\n}\n\n#dshc-root .dshc-seg button[aria-pressed=\"true\"] {\n  color: var(--dshc-text);\n  background: var(--dshc-bg-elevated);\n  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);\n  font-weight: 600;\n}\n\n#dshc-root .dshc-seg button:disabled {\n  opacity: 0.42;\n  cursor: not-allowed;\n}\n\n#dshc-root .dshc-switch {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  font-size: var(--dshc-font-size-md);\n  color: var(--dshc-text-2);\n  cursor: pointer;\n  user-select: none;\n}\n\n#dshc-root .dshc-switch input {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  opacity: 0;\n  pointer-events: none;\n}\n\n#dshc-root .dshc-switch-ui {\n  position: relative;\n  flex: none;\n  width: 30px;\n  height: 18px;\n  background: var(--dshc-border-l2);\n  border-radius: 999px;\n  transition: background 0.12s linear;\n}\n\n#dshc-root .dshc-switch-ui::after {\n  content: \"\";\n  position: absolute;\n  top: 2px;\n  left: 2px;\n  width: 14px;\n  height: 14px;\n  background: #fff;\n  border-radius: 50%;\n  transition: transform 0.12s linear;\n}\n\n#dshc-root .dshc-switch input:checked + .dshc-switch-ui {\n  background: var(--dshc-accent);\n}\n\n#dshc-root .dshc-switch input:checked + .dshc-switch-ui::after {\n  transform: translateX(12px);\n}\n\n#dshc-root .dshc-switch input:focus-visible + .dshc-switch-ui {\n  outline: 2px solid var(--dshc-focus);\n  outline-offset: 2px;\n}\n\n#dshc-root .dshc-status {\n  min-height: 16px;\n  font-size: var(--dshc-font-size-sm);\n  line-height: 1.5;\n  color: var(--dshc-text-3);\n  overflow-wrap: anywhere;\n}\n\n#dshc-root .dshc-actions {\n  display: flex;\n  gap: 8px;\n}\n\n#dshc-root .dshc-action {\n  padding: 5px 10px;\n  font: inherit;\n  font-size: var(--dshc-font-size-md);\n  color: var(--dshc-text);\n  background: var(--dshc-hover);\n  border: 1px solid var(--dshc-border);\n  border-radius: 8px;\n  cursor: pointer;\n}\n\n#dshc-root .dshc-action:hover:not(:disabled) {\n  border-color: var(--dshc-border-l2);\n}\n\n#dshc-root .dshc-action:disabled {\n  opacity: 0.55;\n  cursor: default;\n}\n\n#dshc-root .dshc-note {\n  font-size: var(--dshc-font-size-sm);\n  line-height: 1.5;\n  color: var(--dshc-text-3);\n}\n\n/* 顶部手动「加载更早」胶囊 */\n#dshc-root .dshc-pill {\n  position: absolute;\n  z-index: 6;\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 6px 13px;\n  font: inherit;\n  font-size: var(--dshc-font-size-md);\n  color: var(--dshc-text-2);\n  background: var(--dshc-bg-elevated);\n  border: 1px solid var(--dshc-border);\n  border-radius: 999px;\n  box-shadow: var(--dshc-shadow);\n  transform: translateX(-50%);\n  pointer-events: auto;\n  cursor: pointer;\n  opacity: 0.9;\n}\n\n#dshc-root .dshc-pill:hover {\n  opacity: 1;\n  color: var(--dshc-text);\n}\n\n#dshc-root .dshc-pill-icon {\n  font-size: 12px;\n  line-height: 1;\n  color: var(--dshc-text-3);\n}\n\n/* ================================================================= A 报纸 */\n\n[data-dshc-a] {\n  column-gap: var(--dshc-col-gap, 40px);\n  /* 报纸的列缝：极细、跟随宿主边框色（不引入插件变量，因为这一层在 #dshc-root 外面） */\n  column-rule: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.09));\n}\n\n[data-dshc-a] [data-dshc-item] {\n  min-width: 0;\n  /* 平分优先：所有消息都允许被列缝切开，列底才不会参差 */\n  break-inside: auto;\n  -webkit-column-break-inside: auto;\n}\n\n[data-dshc-a] pre,\n[data-dshc-a] table {\n  max-width: 100%;\n}\n\n/* 表格夹回列内之后，单元格里的长串（URL、路径、token）要能断行 */\n[data-dshc-a] td,\n[data-dshc-a] th {\n  overflow-wrap: anywhere;\n}\n\n[data-dshc-a] pre {\n  overflow-x: auto;\n}\n\n[data-dshc-a] img,\n[data-dshc-a] video,\n[data-dshc-a] canvas,\n[data-dshc-a] svg {\n  max-width: 100%;\n  height: auto;\n}\n\n/* ================================================================= B 无缝 */\n\n/* 逻辑高度占位层：只提供滚动行程，不显示任何内容 */\n[data-dshc-b-host]::after {\n  content: \"\";\n  display: block;\n  width: 100%;\n  height: var(--dshc-spacer, 0px);\n  margin: 0;\n  padding: 0;\n  border: 0;\n  pointer-events: none;\n}\n\n[data-dshc-b=\"column\"] {\n  isolation: isolate;\n}\n\n[data-dshc-b=\"item\"] {\n  overflow-x: hidden;\n}\n\n/* 宿主自己的「加载更早」按钮、生成中指示、占位在 B 下会被压到第一列顶端 */\n[data-dshc-hide] {\n  display: none !important;\n}\n\n/* C-Native：交互版复制的 N 栏（每栏都是真组件，各栏独立滚动） */\n[data-dshc-native-mirror] {\n  display: flex;\n  gap: 20px;\n  width: 100%;\n  max-width: none;\n  box-sizing: border-box;\n}\n\n[data-dshc-native-mirror-col] {\n  display: flex;\n  flex: 1 1 0;\n  flex-direction: column;\n  min-width: 0;\n  overflow: hidden;\n  border: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.1));\n  border-radius: 10px;\n}\n\n[data-dshc-native-mirror-head] {\n  flex: none;\n  padding: 6px 10px;\n  border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.1));\n  font-size: 11px;\n  color: var(--dsw-alias-label-tertiary, #6b6a63);\n}\n\n[data-dshc-native-mirror-body] {\n  flex: 1 1 auto;\n  min-height: 0;\n  overflow-y: auto;\n  overflow-x: hidden;\n  padding: 12px;\n  container-type: inline-size;\n  overscroll-behavior: contain;\n}\n\n/* ================================================================= C 复制 */\n\n#dshc-root .dshc-view {\n  position: absolute;\n  z-index: 1;\n  display: flex;\n  flex-direction: column;\n  min-height: 0;\n  background: var(--dshc-bg);\n  border: 1px solid var(--dshc-border);\n  border-radius: 12px;\n  box-shadow: var(--dshc-shadow);\n  overflow: hidden;\n  pointer-events: auto;\n}\n\n#dshc-root .dshc-bar {\n  display: flex;\n  flex: none;\n  align-items: center;\n  gap: 10px;\n  /* 右侧给控制器的悬浮胶囊让位，否则胶囊会压在「拉取更早历史」按钮上 */\n  padding: 8px 118px 8px 14px;\n  border-bottom: 1px solid var(--dshc-border);\n  background: var(--dshc-bg-elevated);\n}\n\n#dshc-root .dshc-bar-title {\n  font-size: var(--dshc-font-size-md);\n  font-weight: 600;\n  color: var(--dshc-text);\n}\n\n#dshc-root .dshc-bar-sub {\n  font-size: var(--dshc-font-size-sm);\n  color: var(--dshc-text-3);\n}\n\n#dshc-root .dshc-bar-state {\n  flex: 1 1 auto;\n  min-width: 0;\n  font-size: var(--dshc-font-size-sm);\n  color: var(--dshc-text-3);\n  text-align: right;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n#dshc-root .dshc-view[data-state=\"error\"] .dshc-bar-state {\n  color: var(--dshc-danger);\n}\n\n#dshc-root .dshc-bar-action {\n  flex: none;\n  padding: 4px 10px;\n  font: inherit;\n  font-size: var(--dshc-font-size-md);\n  color: var(--dshc-text-2);\n  background: var(--dshc-hover);\n  border: 1px solid var(--dshc-border);\n  border-radius: 8px;\n  cursor: pointer;\n}\n\n#dshc-root .dshc-bar-action:disabled {\n  opacity: 0.55;\n  cursor: default;\n}\n\n#dshc-root .dshc-cols {\n  display: flex;\n  flex: 1 1 auto;\n  gap: var(--dshc-c-gap);\n  min-height: 0;\n  padding: 12px 14px 14px;\n}\n\n#dshc-root .dshc-col {\n  display: flex;\n  flex: 1 1 0;\n  flex-direction: column;\n  min-width: 0;\n  min-height: 0;\n  border: 1px solid var(--dshc-border);\n  border-radius: 10px;\n  overflow: hidden;\n}\n\n#dshc-root .dshc-col-head {\n  position: sticky;\n  top: 0;\n  z-index: 2;\n  display: flex;\n  flex: none;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  padding: 6px 10px;\n  border-bottom: 1px solid var(--dshc-border);\n  background: var(--dshc-bg-elevated);\n}\n\n#dshc-root .dshc-col-name {\n  font-size: var(--dshc-font-size-sm);\n  font-weight: 600;\n  color: var(--dshc-text-2);\n}\n\n#dshc-root .dshc-col-tag {\n  font-size: 10px;\n  color: var(--dshc-text-3);\n}\n\n#dshc-root .dshc-col-body {\n  flex: 1 1 auto;\n  min-height: 0;\n  overflow-y: auto;\n  overflow-x: hidden;\n  padding: 12px;\n  container-type: inline-size;\n  overscroll-behavior: contain;\n  user-select: text;\n}\n\n/* 副本里相邻消息的间距（宿主那套边距依赖正文列的选择器，这里补上） */\n#dshc-root .dshc-col-body > [data-dshc-clone] + [data-dshc-clone] {\n  margin-top: 16px;\n}\n\n#dshc-root .dshc-empty {\n  padding: 28px 8px;\n  color: var(--dshc-text-3);\n  font-size: var(--dshc-font-size-md);\n  text-align: center;\n}\n\n/* 副本是死的：按钮/表单不可点，文字可选、链接可开 */\n#dshc-root .dshc-c-dead,\n#dshc-root .dshc-col-body [data-dshc-clone] button,\n#dshc-root .dshc-col-body [data-dshc-clone] input,\n#dshc-root .dshc-col-body [data-dshc-clone] select,\n#dshc-root .dshc-col-body [data-dshc-clone] textarea {\n  pointer-events: none !important;\n  cursor: default !important;\n}\n\n#dshc-root .dshc-col-body [data-dshc-clone] a {\n  pointer-events: auto;\n  cursor: pointer;\n}\n\n/* ------------------------------------------------------------ 宿主滚动条 */\n\n[data-dshc-hide-scrollbar] {\n  scrollbar-width: none;\n}\n\n[data-dshc-hide-scrollbar]::-webkit-scrollbar {\n  width: 0;\n  height: 0;\n  display: none;\n}\n\n/* ---------------------------------------------------------------- 窄屏 */\n\n@media (max-width: 767px) {\n  #dshc-root .dshc-ctl-toggle {\n    width: 32px;\n    height: 32px;\n    border-radius: 10px;\n  }\n\n  #dshc-root .dshc-ctl-mark {\n    display: none;\n  }\n\n  #dshc-root .dshc-ctl {\n    width: 32px;\n  }\n\n  #dshc-root .dshc-panel {\n    width: min(268px, calc(100vw - 24px));\n  }\n\n  #dshc-root .dshc-cols {\n    flex-direction: column;\n    overflow-y: auto;\n  }\n\n  #dshc-root .dshc-col {\n    min-height: 240px;\n    flex: 1 1 auto;\n  }\n}\n";

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
   * B′ 连续流：不按页对齐，starts[i] = 前面所有消息（含间距）的高度和。
   *
   * 与 pack() 的区别：不再有「放不下就另起一列」，因此列底不会留白；
   * 代价是消息可能跨列缝，由渲染层用「边界副本」补上连续性。
   *
   * @param {Array<{height: number, gap?: number}>} blocks 按 DOM 顺序的消息高度（已按可见上限裁剪）
   * @param {number} gap 默认行间距
   * @returns {{starts: number[], heights: number[], total: number}}
   *   starts 单调不减，且 starts[i+1] >= starts[i] + heights[i]（内部保证二分查找的前提）
   */
  function flowStarts(blocks, gap) {
    const g0 = Math.max(0, gap === undefined ? 0 : Number(gap) || 0);
    const starts = [];
    const heights = [];
    let y = 0;
    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i] || {};
      const height = Math.max(0, Number(block.height) || 0);
      const g = i === 0 ? 0 : Math.max(0, block.gap === undefined ? g0 : Number(block.gap) || 0);
      y += g;
      starts.push(y);
      heights.push(height);
      y += height;
    }
    return { starts, heights, total: y };
  }

  /**
   * 可见范围：二分查找与 [scroll, scroll + span) 相交的消息下标区间 [from, to)。
   *
   * 前提（flowStarts 保证）：starts 单调不减，且底边 starts[i] + heights[i] 也单调不减。
   * 因此「底边 > top」这个判据在区间上是单调的，可以二分。
   * 复杂度 O(log N)，与历史消息总数无关 —— 每帧只碰当前可见的那几条。
   *
   * @returns {{from: number, to: number}} 半开区间；没有消息时 from === to
   */
  function visibleRange(starts, heights, scroll, span) {
    const n = starts.length;
    if (!n) return { from: 0, to: 0 };
    const top = Number(scroll) || 0;
    const bottom = top + Math.max(0, Number(span) || 0);
    const bottomOf = (i) => starts[i] + heights[i];

    let lo = 0;
    let hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (bottomOf(mid) <= top) lo = mid + 1;
      else hi = mid;
    }
    const from = lo;

    lo = from;
    hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (starts[mid] < bottom) lo = mid + 1;
      else hi = mid;
    }
    return { from, to: lo };
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
    pack,
    flowStarts,
    visibleRange,
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

  /* --------------------------------------------- B-Native 行属性（宿主契约） */

  /**
   * B-Native：我们自己渲染出来的行要带上宿主的行属性，
   * 聊天流那套间距/动效/锚点选择器才会继续作用在这些行上。
   * 属性名属于宿主契约，按硬约束只能出现在本文件（scripts/check.mjs 会查）。
   *
   * @param {{key?: string, kind?: string, location?: {turn?: {turn?: number}}}} node 宿主 chat 节点
   * @returns {Record<string, string|number>}
   */
  function flowRowAttrs(node) {
    const key = node && node.key ? String(node.key) : '';
    const kind = node && node.kind ? String(node.kind) : '';
    const attrs = {
      'data-chat-flow-key': key,
      'data-chat-node-key': key,
      'data-chat-anchor-key': key,
      'data-chat-flow-kind': kind
    };
    const turn = node && node.location ? node.location.turn : null;
    if (turn && typeof turn.turn === 'number') attrs['data-chat-turn'] = turn.turn;
    return attrs;
  }

  /* ------------------------------------------------ B′ 边界副本（只读） */

  /**
   * B′ 连续流的「边界副本」：同一条消息在另一个列窗口里再画一份。
   *
   * 净化口径与 C 一致（剥宿主身份属性、去 id/name、禁用表单与按钮、剥内联事件），
   * 额外的三条是 B′ 特有的：
   *  - `aria-hidden` + `inert`：读屏不重复朗读，也不进 Tab 序；
   *  - `pointer-events: none` + `user-select: none`：点不动，也**选不进**，
   *    避免跨缝选中把两份文字一起选出来（那才会一眼假）；
   *  - `data-dshc-clone`：退出时按这个标记整体清理。
   *
   * 副本不是宿主节点，不进样式快照，由调用方负责移除。
   *
   * @param {HTMLElement} el 宿主原生消息行
   * @returns {HTMLElement|null}
   */
  function overlayClone(el) {
    if (!el) return null;
    const copy = el.cloneNode(true);
    if (!copy || copy.nodeType !== 1) return null;
    for (const name of HOST.stripped) copy.removeAttribute(name);
    sanitize(copy);
    copy.setAttribute(MARK.cloneId, 'flow');
    copy.setAttribute('aria-hidden', 'true');
    copy.setAttribute('inert', '');
    copy.style.setProperty('pointer-events', 'none');
    copy.style.setProperty('user-select', 'none');
    copy.style.setProperty('-webkit-user-select', 'none');
    return copy;
  }

  /* -------------------------------------------------- 内容适配（A/B 共用） */

  /** 被「内容适配」改过的节点，退出时统一还原。 */
  const contentTouched = new Set();

  /**
   * 把列里的内容调成「可被列缝切开、且不超出列宽」：
   *  - `pre` 是滚动容器（overflow-x:auto），滚动容器不可分片 → 代码块会整块搬家；
   *    放开 overflow 并让长行软换行；
   *  - 代码块/表格外面那层卡片常带 overflow:hidden（圆角裁切），也会阻止分片；
   *  - 宿主有「宽表撑出正文列」的样式（宽度按 100cqw 算），多列里 cqw 取的是滚动容器宽度，
   *    不夹住就会整张表出列 → 强制 table-layout:fixed + 100% 宽。
   * @param {HTMLElement} root 正文列（或任一容器）
   */
  function fitContent(root) {
    if (!root) return;
    const touch = (el, name, value) => {
      setStyle(el, name, value);
      contentTouched.add(el);
    };
    for (const pre of root.querySelectorAll('pre')) {
      touch(pre, 'overflow', 'visible');
      touch(pre, 'overflow-x', 'visible');
      touch(pre, 'overflow-y', 'visible');
      touch(pre, 'white-space', 'pre-wrap');
      touch(pre, 'word-break', 'break-word');
      const card = pre.parentElement;
      if (card && card !== root) {
        touch(card, 'overflow', 'visible');
        touch(card, 'max-height', 'none');
      }
    }
    for (const table of root.querySelectorAll('table')) {
      const wrap = table.parentElement;
      if (wrap && wrap !== root) {
        touch(wrap, 'width', '100%');
        touch(wrap, 'max-width', '100%');
        touch(wrap, 'margin-left', '0');
        touch(wrap, 'padding-left', '0');
        touch(wrap, 'overflow', 'visible');
      }
      touch(table, 'table-layout', 'fixed');
      touch(table, 'width', '100%');
      touch(table, 'max-width', '100%');
    }
  }

  /** 还原所有「内容适配」改动；幂等。 */
  function unfitContent() {
    for (const el of Array.from(contentTouched)) {
      if (el && el.isConnected) resetEl(el);
      contentTouched.delete(el);
    }
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

  /* --------------------------------------------------- 右上角动作栏（工具栏） */

  /**
   * 宿主会话标题栏右上角的动作栏（文件夹切换、更多、面板…）。
   * 插件的控制器要贴在它左边，和这些图标排成一行。
   * @returns {{top: number, bottom: number, left: number, right: number, height: number} | null}
   */
  /** 最近一次量到的工具栏位置（诊断用）。 */
  let lastToolbar = null;

  function toolbarAnchor() {
    /** 一组盒子的并集（槽位锚点是 display:contents，量它自己永远是 0×0）。 */
    const unionOf = (nodes) => {
      const boxes = [];
      for (const node of nodes) {
        if (!node || !node.getBoundingClientRect) continue;
        const rect = node.getBoundingClientRect();
        if (rect.height > 0 && rect.width > 0) boxes.push(rect);
      }
      if (!boxes.length) return null;
      return {
        left: Math.min.apply(null, boxes.map((r) => r.left)),
        right: Math.max.apply(null, boxes.map((r) => r.right)),
        top: Math.min.apply(null, boxes.map((r) => r.top)),
        bottom: Math.max.apply(null, boxes.map((r) => r.bottom))
      };
    };

    // 1) 先认槽位锚点（优先 utilities：右上角那排图标通常挂在这里）
    const slotNames = [
      'conversation.session.header.utilities',
      'conversation.session.header.actions',
      'conversation.session.header.corner'
    ];
    let box = null;
    for (const name of slotNames) {
      const outlet = document.querySelector('[data-slot="' + name + '"]');
      if (!outlet) continue;
      box = unionOf(Array.from(outlet.children));
      if (box) break;
    }

    // 2) 兜底：以「More actions」按钮为锚点，往上找到那一小簇图标
    if (!box) {
      const more = document.querySelector('[aria-label="More actions"]');
      if (more) {
        let node = more;
        for (let depth = 0; depth < 4 && node.parentElement; depth += 1) {
          const parent = node.parentElement;
          const rect = parent.getBoundingClientRect();
          if (!(rect.height > 0) || rect.height > 80 || rect.width > 720) break;
          node = parent;
        }
        box = unionOf([node]);
      }
    }

    if (!box) {
      lastToolbar = null;
      return null;
    }
    lastToolbar = { top: box.top, bottom: box.bottom, left: box.left, right: box.right, height: box.bottom - box.top };
    return lastToolbar;
  }

  /* ------------------------------------------- 正文列被替换（切会话）的观察 */

  /**
   * 切会话时宿主会把正文列整块换掉。插件没有观察者时，只能等用户点一下才重扫
   * ——「卡在原生视图、点一下才切换」就是这么来的。
   *
   * 新列出现时**同步**回调，调用方要在同一个任务里把它盖住，否则浏览器可能先画一帧原生排版。
   * 消息行内部的嵌套 flow（分组卡片）不算会话正文列。
   *
   * @param {(column: Element|null) => void} callback
   * @returns {() => void} 停止观察
   */
  function watchColumns(callback) {
    if (!document.body || typeof MutationObserver !== 'function') return function stop() {};
    let debounce = 0;
    const isColumn = (el) => !!el && el.nodeType === 1 && el.matches(HOST.column) && !el.closest(HOST.item);
    const scheduleCheck = () => {
      if (debounce) return;
      debounce = setTimeout(() => {
        debounce = 0;
        const found = resolve();
        callback(found.column);
      }, 60);
    };
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes || []) {
          if (node.nodeType !== 1) continue;
          if (isColumn(node)) {
            callback(node);
            return;
          }
          if (node.querySelector && node.querySelector(HOST.column)) {
            scheduleCheck();
            return;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      if (debounce) clearTimeout(debounce);
      observer.disconnect();
    };
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
    overlayClone,
    flowRowAttrs,
    fitContent,
    unfitContent,
    watchForScroller,
    watchColumns,
    toolbarAnchor,
    lastToolbar: () => lastToolbar
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
 * A｜报纸模式：把宿主原生正文列变成均衡多列。
 *
 * 目标就是「平分」：所有列等高，内容从左往右连续流过去。
 * 所以这里**不限制任何消息跨列**——报纸本来就是切断了接着读下一列。
 *
 * 两个必须处理的宿主细节：
 *  1. 宿主的列是 display:flex，CSS 多列对 flex 容器无效 → 先改回 display:block；
 *  2. 宿主给代码块 `pre` 加了 `overflow-x:auto`，而**滚动容器不可分片**，
 *     所以代码块会整块挪到下一列、把上一列留空。这里把 `pre`（以及它外面那层卡片）
 *     的 overflow 放开、长行改为软换行，代码块就能被列缝切开了。
 *
 * 不接管 scrollTop：滚动、锚点、历史加载都还是宿主自己的。
 */
DSHC.newspaper = (() => {
  'use strict';

  /** 右侧 TurnNavigator 轨道 + 安全距 */
  const RAIL = 44;

  function create() {
    const adapter = DSHC.adapter;
    const math = DSHC.math;
    let applied = false;
    let column = null;
    let columns = 1;

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

      adapter.fitContent(column);
      applied = true;
      return true;
    }

    /** 结构变化时补一次：流式 / 加载更早之后新出现的代码块也要放开。 */
    function tune() {
      if (!applied) return;
      adapter.fitContent(column);
    }

    /** 诊断：列数、列高、每列内容底、最大留白。 */
    function diagnose() {
      if (!applied || !column || !column.isConnected) return { applied: false };
      const rect = column.getBoundingClientRect();
      const ends = new Map();
      const items = markedItems();
      for (const el of items) {
        const r = el.getBoundingClientRect();
        const left = Math.round(r.left - rect.left);
        const bottom = Math.round(r.bottom - rect.top);
        ends.set(left, Math.max(ends.get(left) || 0, bottom));
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
        items: items.length,
        columnsEnd: columnsInfo,
        // 最大一列留白：列高 - 最矮那列的底
        blank: Math.max(0, height - lowest)
      };
    }

    function restore() {
      adapter.unfitContent();
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
      tune,
      diagnose,
      restore,
      destroy,
      isApplied: () => applied,
      get columns() {
        return columns;
      }
    };
  }

  return { create, RAIL };
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
        adapter.fitContent(column);
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
        adapter.fitContent(column);
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
        adapter.fitContent(column);
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
      adapter.unfitContent();
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


/* ============================================================ src/paged.js */
/**
 * B′｜翻页模式：浏览器自己分栏，一屏 N 列；竖向滚轮翻页，横向可自由滚动。
 *
 * 模型：
 *  - 正文列变成一条「纸带」：`column-count = 总列数` + `column-fill: auto` + 固定高度 H，
 *    由**浏览器**把内容切进一列列（段落、代码块都能切，不存在「单元太大」）；
 *  - 纸带宽度 = 总列数 × 列宽，外层容器横向滚动，一屏看到 N 列；
 *  - 竖向滚轮 / PageUp / PageDown = 整页平移（N 列）；触控板横滑、Shift+滚轮、
 *    横向滚动条、方向键 = 按列横向滚。
 *
 * 所有对宿主的写入都走 HostAdapter 快照，切模式/关闭时原样还原。
 */
DSHC.paged = (() => {
  'use strict';

  const GAP = 40;
  const RAIL = 44;
  const MIN_COL = 220;
  const WHEEL_STEP = 48;
  const COOLDOWN = 220;

  function create(options) {
    const onChange = (options && options.onChange) || function noop() {};
    const adapter = DSHC.adapter;
    const math = DSHC.math;

    let active = false;
    let column = null;
    let scroller = null;
    let host = null;
    let H = 0;
    let colW = 0;
    let cols = 1; // 一屏几列
    let totalCols = 1; // 纸带一共几列
    let step = 0; // 一列 + 间距
    let pages = 1;
    let page = 0;
    /** 一次翻几列（默认 = 一屏列数） */
    let stepCols = 1;
    let wantedStep = 0;
    /** 'page' = 竖向滚轮整页翻；'linear' = 竖向滚轮线性横向走 */
    let progress = 'page';

    let wheelBound = null;
    let scrollBound = null;
    let keyBound = false;
    let acc = 0;
    let lastTurnAt = 0;
    let scrollRaf = 0;

    /* --------------------------------------------------------------- 布局 */

    function applyShell() {
      const rect = adapter.measure(scroller);
      if (!rect) return false;
      H = Math.floor(rect.height);
      if (H < 140) return false;

      const avail = Math.floor(adapter.availableWidth(column, scroller) - RAIL);
      colW = Math.floor(math.columnWidth(avail, cols, GAP));
      if (colW < MIN_COL) return false;
      step = colW + GAP;

      // 1) 量内容总高：**按消息逐条累加**，不要临时把纸带改成单列去量。
      //    改布局会让浏览器把 scrollLeft 钳回 0 —— 流式更新时画面就被拽回最左，
      //    表现就是「往右滚一点又被回滚，在最左端原地打转」。
      totalCols = Math.max(1, Math.ceil(measureContent() / Math.max(1, H)));
      stepCols = Math.max(1, Math.min(cols, Number(wantedStep) || cols));
      recalcPages();

      const same =
        shellCache.H === H &&
        shellCache.colW === colW &&
        shellCache.cols === cols &&
        shellCache.totalCols === totalCols;
      shellCache = { H, colW, cols, totalCols };

      // 2) 纸带：所有列横向排开，交给宿主横向滚动。
      //    注意 display 必须是 block：宿主正文列是 flex，CSS 多列对 flex 容器无效
      //    （漏了这句就会退化成"一列、拉得很长"）。
      if (!same) adapter.setStyles(column, {
        display: 'block',
        'column-count': String(totalCols),
        'column-fill': 'auto',
        'column-gap': GAP + 'px',
        'column-width': 'auto',
        height: H + 'px',
        width: totalCols * colW + (totalCols - 1) * GAP + 'px',
        'max-width': 'none',
        margin: '0',
        padding: '0',
        'box-sizing': 'border-box',
        overflow: 'visible',
        transform: 'none',
        [adapter.HOST.contentWidth]: '100%'
      });
      adapter.setAttr(column, 'data-dshc-paged', '');
      // 内容要能塞进列宽：否则长代码行/宽表会横向溢出，既难看也会让列数算错。
      adapter.fitContent(column);

      // 估计的列数会偏（估多了最右端多出空白列，估少了差一列）。
      // 用「最后一条消息的右边缘」反推**实际用掉几列**，再按实际宽度重设一次。
      const used = measureUsedCols();
      if (used !== totalCols) {
        totalCols = used;
        adapter.setStyles(column, {
          'column-count': String(totalCols),
          width: totalCols * colW + (totalCols - 1) * GAP + 'px'
        });
        recalcPages();
      }

      host = adapter.layoutParent(column, scroller) || column.parentElement;
      if (host) {
        adapter.setAttr(host, 'data-dshc-paged-host', '');
        adapter.setStyles(host, {
          position: 'relative',
          overflow: 'auto',
          'overflow-x': 'auto',
          'overflow-y': 'hidden',
          height: H + 'px',
          'padding-top': '0px',
          'padding-bottom': '0px'
        });
      }

      // 竖向滚轮由插件翻页，宿主自己的纵向滚动关掉
      adapter.setStyles(scroller, { 'overflow-anchor': 'none', overflow: 'hidden' });
      return true;
    }

    /**
     * 内容总高：逐条消息高度 + 间距累加。
     * 只用几何读取，不改布局，所以不会打断用户当前的横向位置。
     */
    function measureContent() {
      const items = adapter.getItems(column);
      let total = 0;
      for (let i = 0; i < items.length; i += 1) {
        const el = items[i].el;
        if (!el || !el.isConnected) continue;
        const rect = el.getBoundingClientRect();
        if (!(rect.height > 0)) continue;
        const marginTop = i === 0 ? 0 : parseFloat(getComputedStyle(el).marginTop) || 0;
        total += rect.height + marginTop;
      }
      if (total > 0) return total;
      // 兜底：一条消息都读不到时，按单列量一次（会打断滚动位置，只在异常路径用）
      return column.getBoundingClientRect().height || 0;
    }

    /**
     * 实际用掉几列：看所有消息里最靠右的那条，它的右边缘落在第几列。
     * 比「按高度估算」可靠 —— 估多会多出空白列，估少会差一列。
     */
    function measureUsedCols() {
      const items = adapter.getItems(column);
      const base = column.getBoundingClientRect().left;
      let maxCol = 0;
      for (let i = 0; i < items.length; i += 1) {
        const el = items[i].el;
        if (!el || !el.isConnected) continue;
        const rect = el.getBoundingClientRect();
        if (!(rect.height > 0 || rect.width > 0)) continue;
        // 用**左边缘**而不是右边缘：列起点精确落在 k*step，
        // 而右边缘会被「比列还宽的内容」（长代码行/宽表）撑出去，反推出多余的列。
        const col = Math.round((rect.left - base) / step) + 1;
        if (col > maxCol) maxCol = col;
      }
      return Math.max(1, maxCol || totalCols);
    }

    function pageWidth() {
      return step * Math.max(1, stepCols);
    }

    /** 纸带能滚到的最大左偏移（最后一屏刚好贴右） */
    function maxLeft() {
      return Math.max(0, (totalCols - Math.max(1, cols)) * step);
    }

    /**
     * 实际能滚到的最右端：以纸带的真实右边缘为准（宿主 scrollWidth 可能比纸带更大，
     * 滚过头就是一片空白），再用算式兜底。
     */
    function endLeft() {
      if (!host) return maxLeft();
      const hostRect = host.getBoundingClientRect();
      const colRect = column.getBoundingClientRect();
      const contentLeft = hostRect.left + (parseFloat(getComputedStyle(host).paddingLeft) || 0);
      const tapeRight = colRect.right - contentLeft;
      const byTape = Math.round(tapeRight - host.clientWidth);
      return Math.max(maxLeft(), Math.min(maxScroll(), byTape));
    }

    function recalcPages() {
      const width = Math.max(1, pageWidth());
      pages = Math.max(1, Math.floor(maxLeft() / width) + 1);
    }

    function maxScroll() {
      if (!host) return 0;
      const width = (Number(host.scrollWidth) || 0) - (Number(host.clientWidth) || 0);
      return Number.isFinite(width) ? Math.max(0, width) : 0;
    }

    function currentPage() {
      if (!host || !pageWidth()) return 0;
      return Math.max(0, Math.min(pages - 1, Math.round(host.scrollLeft / pageWidth())));
    }

    function clampPage(value) {
      return Math.max(0, Math.min(pages - 1, value));
    }

    /** 翻到第 p 页（平滑横向滚动）。 */
    function goTo(next, options) {
      if (!host) return;
      const smooth = !options || options.smooth !== false;
      const target = clampPage(next);
      const left = Math.min(endLeft(), target * pageWidth());
      if (smooth && typeof host.scrollTo === 'function') {
        try {
          host.scrollTo({ left, behavior: 'smooth' });
        } catch (error) {
          host.scrollLeft = left;
        }
      } else {
        host.scrollLeft = left;
      }
      lastWrite = host.scrollLeft;
      page = target;
      onChange();
    }

    /** 直接贴到纸带最右端（布局可能还没算完，所以按帧重试几次）。 */
    function snapToEnd(attempts) {
      if (!active || !host) return;
      if (!followEnd) return;
      host.scrollLeft = Math.max(0, endLeft());
      lastWrite = host.scrollLeft;
      page = Math.max(0, pages - 1);
      if (attempts > 0) {
        if (wakeRaf) cancelAnimationFrame(wakeRaf);
        wakeRaf = requestAnimationFrame(() => {
          wakeRaf = 0;
          snapToEnd(attempts - 1);
        });
      }
      onChange();
    }

    function turn(delta) {
      const now = Date.now();
      if (now - lastTurnAt < COOLDOWN) return;
      const current = currentPage();
      if ((delta > 0 && current >= pages - 1) || (delta < 0 && current <= 0)) return;
      lastTurnAt = now;
      goTo(current + delta);
    }

    /** 按列横向滚动（不整页跳）。 */
    function scrollByColumns(delta) {
      if (!host) return;
      host.scrollLeft = Math.max(0, Math.min(maxScroll(), host.scrollLeft + delta * step));
    }

    /* --------------------------------------------------------------- 输入 */

    /** 事件目标在「自己会滚」的区域里（输入框、代码块横向滚动等）时，不抢它的滚动。 */
    function ownsScroll(event) {
      let node = event && event.target;
      while (node && node !== scroller) {
        // 纸带外层本来就可横向滚，不能把它当成「自己会滚、别抢」的区域
        if (node === host) return false;
        if (node.nodeType === 1) {
          if (node.matches && node.matches(adapter.HOST.composer)) return true;
          const cs = getComputedStyle(node);
          const scrollableX = cs.overflowX === 'auto' || cs.overflowX === 'scroll';
          const scrollableY = cs.overflowY === 'auto' || cs.overflowY === 'scroll';
          if (scrollableX && node.scrollWidth > node.clientWidth + 1) return true;
          if (scrollableY && node.scrollHeight > node.clientHeight + 1) return true;
        }
        node = node.parentElement;
      }
      return false;
    }

    function onWheel(event) {
      if (!active || ownsScroll(event)) return;
      const dy = event.deltaY || 0;
      const dx = event.deltaX || 0;
      // 横向滚动（触控板横滑、Shift+滚轮）交给宿主自己，手感才顺
      if (Math.abs(dx) > Math.abs(dy)) return;
      if (!dy) return;
      if (typeof event.preventDefault === 'function') event.preventDefault();
      const delta = event.deltaMode === 1 ? dy * 16 : dy;
      if (progress === 'linear') {
        // 线性横向：滚轮走多少，纸带就横移多少
        if (host) host.scrollLeft = Math.max(0, Math.min(maxScroll(), host.scrollLeft + delta));
        return;
      }
      acc += delta;
      if (Math.abs(acc) < WHEEL_STEP) return;
      turn(acc > 0 ? 1 : -1);
      acc = 0;
    }

    function onHostScroll() {
      if (!active || scrollRaf) return;
      // 用户自己滚的（不是我们写的）→ 停止跟随，别和用户抢位置。
      if (host && lastWrite >= 0 && Math.abs(host.scrollLeft - lastWrite) > 4) {
        followEnd = host.scrollLeft >= maxScroll() - 8;
      }
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        if (!active) return;
        const next = currentPage();
        if (next !== page) {
          page = next;
          onChange();
        }
      });
    }

    function isTyping(event) {
      const el = event && event.target;
      if (!el || !el.tagName) return false;
      const tag = el.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || el.isContentEditable === true;
    }

    /** 前进/后退一屏：翻页模式整页跳，横线模式滚一屏宽。 */
    function stepPage(delta) {
      if (progress === 'linear') {
        scrollByColumns(delta * cols);
        goTo(currentPage());
      } else {
        goTo(currentPage() + delta);
      }
    }

    function onKeyDown(event) {
      if (!active || isTyping(event)) return;
      // Ctrl+Alt+小键盘方向键：不用摸 PageUp/PageDown 也能翻
      if (event.ctrlKey && event.altKey && event.code) {
        const forward = event.code === 'Numpad6' || event.code === 'Numpad8';
        const backward = event.code === 'Numpad4' || event.code === 'Numpad2';
        if (forward || backward) {
          if (typeof event.preventDefault === 'function') event.preventDefault();
          stepPage(forward ? 1 : -1);
          return;
        }
      }
      const key = event.key;
      if (key === 'ArrowRight' || key === 'ArrowLeft') {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        scrollByColumns(key === 'ArrowRight' ? 1 : -1);
        return;
      }
      let delta = 0;
      if (key === 'PageDown') delta = 1;
      else if (key === 'PageUp') delta = -1;
      else if (key === 'ArrowDown' && event.altKey) delta = 1;
      else if (key === 'ArrowUp' && event.altKey) delta = -1;
      else if (key === 'Home') {
        if (currentPage() > 0) {
          if (typeof event.preventDefault === 'function') event.preventDefault();
          goTo(0);
        }
        return;
      } else if (key === 'End') {
        if (currentPage() < pages - 1) {
          if (typeof event.preventDefault === 'function') event.preventDefault();
          goTo(pages - 1);
        }
        return;
      } else return;
      if (typeof event.preventDefault === 'function') event.preventDefault();
      stepPage(delta);
    }

    function bind() {
      unbind();
      scroller.addEventListener('wheel', onWheel, { passive: false });
      wheelBound = scroller;
      if (host) host.addEventListener('scroll', onHostScroll, { passive: true });
      scrollBound = host;
      document.addEventListener('keydown', onKeyDown, true);
      keyBound = true;
    }

    function unbind() {
      if (wheelBound) {
        wheelBound.removeEventListener('wheel', onWheel);
        wheelBound = null;
      }
      if (scrollBound) {
        scrollBound.removeEventListener('scroll', onHostScroll);
        scrollBound = null;
      }
      if (keyBound) document.removeEventListener('keydown', onKeyDown, true);
      keyBound = false;
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      scrollRaf = 0;
      if (wakeRaf) cancelAnimationFrame(wakeRaf);
      wakeRaf = 0;
      acc = 0;
    }

    /* --------------------------------------------------------------- 应用 */

    /** 进入后等一帧再对齐右端（纸带宽度要等样式生效后才算得准）。 */
    let wakeRaf = 0;
    /** 是否跟随最右端：用户自己滚走之后就不再抢他的位置。 */
    let followEnd = true;
    /** 上一轮写进 DOM 的几何；没变就不重写样式（避免每 120ms 一次整表重排）。 */
    let shellCache = { H: 0, colW: 0, cols: 0, totalCols: 0 };
    /** 我们最近一次程序写入的 scrollLeft，用来区分「谁在滚」。 */
    let lastWrite = -1;

    function apply(target, count, options) {
      column = target && target.column ? target.column : null;
      scroller = target && target.scroller ? target.scroller : null;
      cols = Math.max(1, Math.min(3, Number(count) || 1));
      progress = options && options.progress === 'linear' ? 'linear' : 'page';
      wantedStep = options && options.stepCols ? Number(options.stepCols) : 0;
      if (!column || !scroller) {
        restore();
        return false;
      }

      try {
        shellCache = { H: 0, colW: 0, cols: 0, totalCols: 0 };
        if (!applyShell()) {
          restore();
          return false;
        }
        active = true;
        followEnd = true;
        lastWrite = -1;
        bind();
        // 进横向/翻页时停在纸带最右端（最新内容），和竖向落底一致。
        // 纸带宽度要等样式生效后才算得准，所以按帧重试几次。
        snapToEnd(8);
        onChange();
        return true;
      } catch (error) {
        console.error('[dsh-chat-columns] 翻页模式初始化失败，已退回原生', error);
        restore();
        return false;
      }
    }

    /** 内容变化后重算纸带列数与页数（流式 / 加载更早）。 */
    function update() {
      if (!active) return;
      const wasEnd = page >= pages - 1 || host.scrollLeft >= maxScroll() - 8;
      const keepLeft = host ? host.scrollLeft : 0;
      if (!applyShell()) {
        restore();
        return;
      }
      if (wasEnd) {
        // 贴边：跟随最新内容。
        snapToEnd(2);
        return;
      }
      // 非贴边：**原样恢复像素位置，不做页对齐**。
      // 之前这里每 120ms 调一次 goTo()，会把自由滚动的横向位置吸到页边界上，
      // 表现就是「你滚一下、它又被吸回去」的原地抽搐。
      if (host && Math.abs(host.scrollLeft - keepLeft) > 1) {
        host.scrollLeft = keepLeft;
        lastWrite = keepLeft;
      }
      page = currentPage();
      onChange();
    }

    function restore() {
      active = false;
      adapter.unfitContent();
      followEnd = true;
      lastWrite = -1;
      shellCache = { H: 0, colW: 0, cols: 0, totalCols: 0 };
      unbind();
      if (column) adapter.resetEl(column);
      if (host) adapter.resetEl(host);
      if (scroller) adapter.resetEl(scroller);
      column = null;
      scroller = null;
      host = null;
      H = 0;
      step = 0;
      totalCols = 1;
      pages = 1;
      page = 0;
    }

    function diagnose() {
      return {
        active,
        progress,
        stepCols,
        H,
        cols,
        columnWidth: colW,
        totalCols,
        pages,
        page,
        scrollLeft: host ? Math.round(host.scrollLeft) : 0,
        scrollable: host ? Math.round(host.scrollWidth - host.clientWidth) : 0
      };
    }

    return {
      apply,
      update,
      restore,
      diagnose,
      goTo,
      next: () => stepPage(1),
      prev: () => stepPage(-1),
      isActive: () => active
    };
  }

  return { create };
})();


/* ============================================================ src/flow.js */
/**
 * B′｜连续流（伪无缝）：消息连续堆叠，跨过列缝的那条在下一个窗口里再画一份。
 *
 * 为什么要有它：seamless.js 按「整页」打包消息，放不下就整条挪到下一列，
 * 于是列底会空一块 —— 用户看到的就是「内容中间莫名多出空白」。
 *
 * 这一版把打包换成连续堆叠：
 *  - 布局：starts[i] = 前面所有消息（含间距）的高度和，不再对齐到 H；
 *  - 渲染：一条消息可以同时出现在多个窗口里 —— 原件 + 边界副本；
 *  - 滚动：s ∈ [0, max(0, T − cols×H)]，到底时最后一列刚好填满（对应「最后一条出来就翻不动」）；
 *  - 可见集：前缀和 + 二分查找，每帧只碰可见范围里的几条消息，与历史总数无关。
 *
 * 三条不可消除的代价（如实上报，不假装没有）：
 *  1. 跨缝的副本是只读的：按钮点不动（`pointer-events:none`）；
 *  2. 跨缝选中会停在缝上（副本 `user-select:none`，避免选出重复文字）；
 *  3. 浏览器 Ctrl+F 会命中两份同文。
 * 另外：一条消息比「一屏 × 列数」还高时无法整条呈现，降级为消息内部滚动（diagnose 里计 oversized）。
 */
DSHC.flow = (() => {
  'use strict';

  const RAIL = 44;
  const MIN_VIEWPORT = 140;
  const MIN_COLUMN_WIDTH = 220;
  const GAP_DEFAULT = 12;
  const RESIZE_DEBOUNCE = 90;
  /** 视口上下各预载多少像素：提前建好副本，滚进来时不闪。 */
  const PRELOAD = 200;
  /** 离开可见区超过这个距离才回收副本，避免来回蹭滚动时反复克隆。 */
  const RECYCLE = 800;
  /** 视口外的停靠位置：够远、且不改变可见性（visibility:hidden 会被量成 0 高）。 */
  const PARK = 'translate3d(-99999px,0,0)';

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
    let step = 0;
    let total = 0;
    let s = 0;

    /** 前缀和（与 records 同序），供二分查找。 */
    let starts = [];
    let caps = [];

    let scrollRaf = 0;
    /** 「落到底」的补帧令牌；退出/新一次补帧都会让它失效，避免留定时器。 */
    let settleToken = 0;
    let settleRaf = 0;
    let repackTimer = 0;
    let resizeTimer = 0;
    let itemObserver = null;
    let sizeObserver = null;
    let boundScroll = null;
    let applying = false;
    let lastLayoutAt = 0;
    let pinnedByJs = false;
    let pinnedValue = '';

    /** 每帧统计，给 diagnose 用。 */
    let stats = { visible: 0, views: 0, clones: 0, oversized: 0 };

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

    /** 主列里除消息之外的装饰节点（「加载更早」、生成中指示、占位）在 B 下必须收起。 */
    function hideDecorations() {
      const walk = (parent) => {
        for (const child of Array.from(parent.children)) {
          // 边界副本不是宿主节点，重排时不能被当成装饰节点收起来。
          if (child.getAttribute(MARK.cloneId)) continue;
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

    /** sticky 的最近滚动容器必须就是会话滚动容器，否则退化为 JS 钉住。 */
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
      step = colWidth + math.GAP;

      host = adapter.layoutParent(column, scroller) || column.parentElement;
      if (host) {
        adapter.setAttr(host, 'data-dshc-b-host', '');
        adapter.setStyle(host, '--dshc-spacer', '0px');
        adapter.setStyle(host, 'padding-top', '0px');
        adapter.setStyle(host, 'padding-bottom', '0px');
      }

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

    function syncItems(items, dirty) {
      const previous = new Map();
      for (const rec of records) previous.set(rec.el, rec);
      const next = [];

      for (const item of items) {
        let rec = previous.get(item.el);
        if (!rec) {
          rec = {
            el: item.el,
            id: item.id,
            gap: gapOf(item.el),
            height: 0,
            cap: 0,
            start: 0,
            clones: [],
            hidden: false,
            dirty: true,
            lastT: ''
          };
          styleItem(item.el);
          measureRecord(rec);
        } else {
          previous.delete(item.el);
          rec.id = item.id;
          if (dirty && dirty.has(item.id)) {
            adapter.setStyle(rec.el, 'max-height', '');
            measureRecord(rec);
            rec.dirty = true;
          }
        }
        next.push(rec);
      }

      for (const [el, rec] of previous) {
        release(rec);
        if (el && el.isConnected) adapter.resetEl(el);
      }
      records = next;
    }

    /* ----------------------------------------------------------- 副本管理 */

    /** 建一份只读副本，套上和原件一样的盒模型。 */
    function makeClone(rec) {
      const copy = adapter.overlayClone(rec.el);
      if (!copy) return null;
      copy.style.setProperty('position', 'absolute');
      copy.style.setProperty('top', '0px');
      copy.style.setProperty('left', '0px');
      copy.style.setProperty('width', colWidth + 'px');
      copy.style.setProperty('max-width', colWidth + 'px');
      copy.style.setProperty('margin', '0');
      copy.style.setProperty('box-sizing', 'border-box');
      copy.style.setProperty('transform-origin', '0 0');
      copy.style.setProperty('transition', 'none');
      copy.style.setProperty('will-change', 'transform');
      column.appendChild(copy);
      return copy;
    }

    /** 确保这条消息有 n 份副本（不够就补，多了就删）。 */
    function ensureClones(rec, n) {
      while (rec.clones.length > n) {
        const node = rec.clones.pop();
        if (node && node.parentNode) node.parentNode.removeChild(node);
      }
      while (rec.clones.length < n) {
        const node = makeClone(rec);
        if (!node) break;
        rec.clones.push(node);
      }
      return rec.clones;
    }

    /** 消息离开可见区后回收副本，控制 DOM 总量。 */
    function release(rec) {
      if (!rec) return;
      for (const node of rec.clones) {
        if (node && node.parentNode) node.parentNode.removeChild(node);
      }
      rec.clones = [];
    }

    /* --------------------------------------------------------------- 排布 */

    function place() {
      const limit = cols * H;
      const blocks = records.map((rec) => ({ height: Math.min(rec.height, limit), gap: rec.gap }));
      const flow = math.flowStarts(blocks, GAP_DEFAULT);
      starts = flow.starts;
      caps = flow.heights;
      total = flow.total;

      let oversized = 0;
      for (let i = 0; i < records.length; i += 1) {
        const rec = records[i];
        rec.start = starts[i];
        rec.cap = caps[i];
        if (rec.height > rec.cap + 0.5) {
          oversized += 1;
          // 显式降级：不静默截断，限高后由消息自己内部滚动，内容仍然可达。
          adapter.setStyle(rec.el, 'max-height', rec.cap + 'px');
          adapter.setStyle(rec.el, 'overflow-y', 'auto');
          adapter.setStyle(rec.el, 'overscroll-behavior', 'contain');
        } else {
          adapter.setStyle(rec.el, 'max-height', '');
          adapter.setStyle(rec.el, 'overflow-y', '');
        }
      }
      stats.oversized = oversized;

      if (host) adapter.setStyle(host, '--dshc-spacer', maxScroll() + 'px');
      lastLayoutAt = Date.now();
    }

    function maxScroll() {
      return Math.max(0, total - cols * H);
    }

    /** 这条消息在当前 s 下落在哪几个窗口、每个窗口的列内偏移。 */
    function viewsOf(rec) {
      if (rec.cap < 1) return [];
      const y = rec.start;
      const h = rec.cap;
      let first = Math.floor((y - s) / H);
      let last = Math.floor((y + h - 1 - s) / H);
      if (last < 0 || first > cols - 1) return [];
      if (first < 0) first = 0;
      if (last > cols - 1) last = cols - 1;
      const out = [];
      for (let c = first; c <= last; c += 1) out.push({ col: c, top: y - s - c * H });
      return out;
    }

    function move(node, view, rec) {
      const value =
        'translate3d(' + Math.round(view.col * step) + 'px,' + Math.round(view.top) + 'px,0)';
      if (node === rec.el) {
        if (rec.lastT === value) return false;
        rec.lastT = value;
        adapter.setStyle(node, 'transform', value);
        return true;
      }
      if (node.__dshcMove === value) return false;
      node.__dshcMove = value;
      node.style.setProperty('transform', value);
      return true;
    }

    /** 视口外的消息：移到很远处，而不是 visibility:hidden（那会让高度量成 0）。 */
    function park(rec) {
      if (rec.parked) return;
      rec.parked = true;
      rec.lastT = PARK;
      adapter.setStyle(rec.el, 'transform', PARK);
      for (const node of rec.clones) node.style.setProperty('transform', PARK);
    }

    function unpark(rec) {
      rec.parked = false;
    }

    function projectAll() {
      if (!active || !scroller) return;
      s = Math.min(maxScroll(), Math.max(0, scroller.scrollTop));

      if (pinnedByJs && column) {
        const pin = 'translate3d(0,' + Math.round(s) + 'px,0)';
        if (pinnedValue !== pin) {
          pinnedValue = pin;
          adapter.setStyle(column, 'transform', pin);
        }
      }

      const span = cols * H;
      // 只算可见范围（含预载），与历史消息总数无关。
      const range = math.visibleRange(starts, caps, s - PRELOAD, span + PRELOAD * 2);

      let views = 0;
      let clones = 0;
      let visible = 0;

      for (let i = 0; i < records.length; i += 1) {
        const rec = records[i];
        if (i < range.from || i >= range.to) {
          park(rec);
          const far = rec.start + rec.cap < s - RECYCLE || rec.start > s + span + RECYCLE;
          if (far) release(rec);
          continue;
        }

        const list = viewsOf(rec);
        if (!list.length) {
          park(rec);
          continue;
        }

        unpark(rec);
        // 原件放在最后一段：宿主消息的原生操作控件通常就在末段。
        const home = list[list.length - 1];
        move(rec.el, home, rec);
        const rest = ensureClones(rec, list.length - 1);
        for (let k = 0; k < rest.length; k += 1) move(rest[k], list[k], rec);

        views += list.length;
        clones += rest.length;
        visible += 1;
      }

      stats.visible = visible;
      stats.views = views;
      stats.clones = clones;
    }

    /**
     * 连补几帧落到底：字体、图片、圆角分组会在第一帧之后才把高度撑开，
     * 一次对齐必然「差一点」。每帧复量 + 重新定位，直到稳定。
     */
    function settleToEnd(frames) {
      const token = (settleToken += 1);
      let left = Math.max(1, frames);
      const step = () => {
        settleRaf = 0;
        if (!active || token !== settleToken) return;
        measureAll();
        place();
        setScroll(maxScroll());
        left -= 1;
        if (left > 0) settleRaf = requestAnimationFrame(step);
      };
      if (settleRaf) cancelAnimationFrame(settleRaf);
      settleRaf = requestAnimationFrame(step);
    }

    function setScroll(value) {
      if (!scroller) return;
      const next = Math.min(maxScroll(), Math.max(0, value));
      if (Math.abs(scroller.scrollTop - next) > 0.5) scroller.scrollTop = next;
      projectAll();
    }

    /* --------------------------------------------------------------- 锚点 */

    /** 屏幕最上面那条可见消息（逻辑坐标算，不读 rect）。 */
    function captureAnchor() {
      if (!active || !scroller) return null;
      const value = Math.min(Math.max(0, maxScroll()), Math.max(0, scroller.scrollTop));
      const range = math.visibleRange(starts, caps, value, cols * H);
      for (let i = range.from; i < range.to; i += 1) {
        const rec = records[i];
        if (!rec || !rec.el || !rec.el.isConnected || rec.cap < 1) continue;
        if (rec.start + rec.cap <= value) continue;
        return { rec, offset: rec.start - value };
      }
      return null;
    }

    function restoreAnchor(anchor) {
      if (!anchor || !anchor.rec) return;
      if (!anchor.rec.el || !anchor.rec.el.isConnected) return;
      setScroll(anchor.rec.start - (anchor.offset || 0));
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
          if (Math.abs(anchor.rec.start - before) > 1) restoreAnchor(anchor);
          else projectAll();
        } else {
          projectAll();
        }
      } finally {
        applying = false;
      }
    }

    /** 是否贴着底部（新消息到来时要跟着走，宿主原生也是这个行为）。 */
    function atBottom() {
      if (!scroller) return false;
      // 阈值放宽：字体、图片、圆角分组这些会让总高差几像素，太严就"差一点到底"。
      return maxScroll() - scroller.scrollTop < 32;
    }

    /** 消息集合变化（流式、折叠、加载更早）后重排。 */
    function update(items, dirty) {
      if (!active) return;
      applying = true;
      try {
        const follow = atBottom();
        const anchor = captureAnchor();
        syncItems(items, dirty);
        adapter.fitContent(column);
        place();
        // 展开/折叠会渲染出新的装饰节点（分隔线、按钮等），它们会停在层的正常流里压住内容。
        hideDecorations();
        observeItems();
        // 脏消息的副本要跟着换内容。
        for (const rec of records) {
          if (!rec.dirty) continue;
          rec.dirty = false;
          for (let k = 0; k < rec.clones.length; k += 1) {
            const fresh = makeClone(rec);
            if (!fresh) break;
            const old = rec.clones[k];
            if (old && old.parentNode) old.parentNode.removeChild(old);
            rec.clones[k] = fresh;
          }
        }
        // 贴底时跟随最新内容；否则守住原来的阅读位置。
        if (follow) setScroll(maxScroll());
        else if (anchor && anchor.rec.el && anchor.rec.el.isConnected) restoreAnchor(anchor);
        else projectAll();
      } catch (error) {
        console.error('[dsh-chat-columns] 连续流重排失败', error);
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
          if (Date.now() - lastLayoutAt < 120) return;
          let changed = false;
          for (const item of entries) {
            const rec = records.find((candidate) => candidate.el === item.target);
            if (!rec) continue;
            // 超高消息（思维链展开这类）被 max-height 限过，量到的是裁剪值。
            // 先放开限高再量自然高，否则展开/收起之后尺寸永远停在旧值 → 错位。
            adapter.setStyle(rec.el, 'max-height', '');
            const height = Math.round(rec.el.getBoundingClientRect().height * 100) / 100;
            if (Math.abs(height - rec.height) > 0.5) {
              rec.height = height;
              rec.dirty = true;
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
      settleToken += 1;
      if (settleRaf) cancelAnimationFrame(settleRaf);
      settleRaf = 0;
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
      if (!column || !scroller) {
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
        adapter.fitContent(column);
        measureAll();
        place();
        // 第一遍量完尺寸往往还会变（宽度生效、字体、图片），再量一遍才准，
        // 否则「落到底」会差一截。
        measureAll();
        place();
        active = true;
        bind();
        // 进入竖向无缝时停在会话底部（最新内容），和宿主原生的落点一致。
        setScroll(maxScroll());
        settleToEnd(5);
      } catch (error) {
        console.error('[dsh-chat-columns] 连续流初始化失败，已退回原生', error);
        restore();
        return false;
      } finally {
        applying = false;
      }
      return active;
    }

    function relayout() {
      if (!active || !column || !scroller) return;
      applying = true;
      try {
        const anchor = captureAnchor();
        H = 0;
        available = 0;
        // 先清掉副本：layoutShell 会重新认一遍装饰节点，残留的副本会被误伤。
        for (const rec of records) release(rec);
        if (!layoutShell()) {
          restore();
          return;
        }
        for (const rec of records) {
          if (rec.el && rec.el.isConnected) styleItem(rec.el);
        }
        syncItems(readItems(), null);
        adapter.fitContent(column);
        measureAll();
        place();
        observeItems();
        if (anchor && anchor.rec.el && anchor.rec.el.isConnected) restoreAnchor(anchor);
        else projectAll();
      } catch (error) {
        console.error('[dsh-chat-columns] 连续流重排失败', error);
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
      adapter.unfitContent();
      for (const rec of records) {
        release(rec);
        if (rec.el && rec.el.isConnected) adapter.resetEl(rec.el);
      }
      records = [];
      starts = [];
      caps = [];
      // 兜底：任何漏网的副本都清掉。
      if (column) {
        for (const node of column.querySelectorAll('[' + MARK.cloneId + ']')) node.remove();
      }
      if (host) adapter.resetEl(host);
      host = null;
      if (column) adapter.resetEl(column);
      if (scroller) adapter.resetEl(scroller);
      column = null;
      scroller = null;
      H = 0;
      total = 0;
      stats = { visible: 0, views: 0, clones: 0, oversized: 0 };
    }

    function diagnose() {
      const scrollHeight = scroller ? Math.round(scroller.scrollHeight) : 0;
      return {
        active,
        H,
        columns: cols,
        columnWidth: colWidth,
        gap: math.GAP,
        total: Math.round(total),
        scroll: scroller ? Math.round(scroller.scrollTop) : 0,
        maxScroll: maxScroll(),
        // 滚动行程必须严丝合缝：scrollHeight = H + maxScroll。
        scrollHeight,
        expectedScrollHeight: Math.round(H + maxScroll()),
        items: records.length,
        visible: stats.visible,
        views: stats.views,
        clones: stats.clones,
        oversized: stats.oversized
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


/* ============================================================ src/native-mirror.js */
/**
 * C-Native｜交互版复制：同一份对话并排 N 栏，每栏都是**真实 React 实例**。
 *
 * 与轻量版（mirror.js，DOM 克隆只读）的差别只有一个：
 * 这里的每一栏都是调宿主的 `conversation.chat.node` 渲染器画出来的，
 * 所以按钮、折叠、复制代码全都活着；代价是 N 倍真组件（N 倍订阅与内存）。
 *
 * 已知限制：
 *  - 折叠/思维链展开这类状态存在宿主 store 里，**一栏动、各栏跟着动**（对照阅读时反而更合理）；
 *  - 跨栏选中无关（每栏是独立的滚动容器），栏内选中正常；
 *  - 长对话 N 倍实例，重活；后续要按可见区裁剪。
 */
DSHC.nativeMirror = (() => {
  'use strict';

  function constantSnapshot(value) {
    return { getSnapshot: () => value, subscribe: () => () => {} };
  }

  /**
   * @param {object} react 宿主共享的 React 实例
   * @returns {(props: object) => any} 组件
   */
  function make(react) {
    const h = react.createElement;

    function useSource(source) {
      return react.useSyncExternalStore(source.subscribe, source.getSnapshot, source.getSnapshot);
    }

    /** 一条消息：自己订阅 keyed source，流式只刷这一条。 */
    function Row(props) {
      const { nodeKey, nodes, renderSlot, shared } = props;
      const source = react.useMemo(() => nodes.source(nodeKey), [nodes, nodeKey]);
      const node = useSource(source);
      const owner = react.useMemo(() => (node ? { ...shared.owner, node } : null), [node, shared.owner]);
      const hookContext = react.useMemo(
        () => ({ turnData: undefined, disclosureReset: constantSnapshot(0), useGroupAction: () => react.useRef(null) }),
        []
      );
      if (!node) return null;
      const attrs = Object.assign({ 'data-dshc-native-mirror-row': '' }, DSHC.adapter.flowRowAttrs(node));
      return h(
        'div',
        { ...attrs, style: { minWidth: '0', marginTop: '12px' } },
        renderSlot('conversation.chat.node', owner, {
          entryKey: node.kind,
          hookContext,
          fallback: h('div', null, '这条消息类型暂未渲染：' + node.kind)
        })
      );
    }

    /** 给诊断用：最近一次渲染用了几个栏。 */
    const countRef = { value: 0 };

    function NativeMirror(props) {
      const { renderSlot, useChat, columns, shared } = props;
      const order = useChat((value) => value.order);
      const nodes = useChat((value) => value.nodes);
      const count = Math.max(1, Math.min(3, Number(columns) || 2));
      countRef.value = count;
      const colRefs = react.useRef([]);
      const rootRef = react.useRef(null);
      const [height, setHeight] = react.useState(0);

      // 栏高 = 阅读视口高度（标题栏底到输入框顶），和竖向无缝同一套量法。
      react.useLayoutEffect(() => {
        const read = () => {
          const root = rootRef.current;
          if (!root) return;
          const scroller = root.closest(DSHC.adapter.HOST.scroller);
          const rect = scroller ? DSHC.adapter.measure(scroller) : null;
          if (rect && rect.height > 140) setHeight(Math.floor(rect.height));
        };
        read();
        window.addEventListener('resize', read);
        return () => window.removeEventListener('resize', read);
      }, []);

      // 各栏独立滚动，但进入时对齐到同一位置（最新内容）。
      react.useLayoutEffect(() => {
        for (const el of colRefs.current) {
          if (el) el.scrollTop = el.scrollHeight;
        }
      }, [count]);

      const cols = [];
      for (let c = 0; c < count; c += 1) {
        const rows = [];
        for (const key of order) {
          if (!nodes || typeof nodes.source !== 'function') continue;
          rows.push(h(Row, { key: key, nodeKey: key, nodes, renderSlot, shared }));
        }
        cols.push(
          h(
            'div',
            {
              key: 'col' + c,
              'data-dshc-native-mirror-col': '',
              ref: (el) => {
                colRefs.current[c] = el;
              }
            },
            h('div', { 'data-dshc-native-mirror-head': '' }, '栏 ' + (c + 1) + ' · 交互'),
            h('div', { 'data-dshc-native-mirror-body': '' }, rows)
          )
        );
      }
      return h(
        'div',
        {
          ref: rootRef,
          'data-dshc-native-mirror': '',
          'data-dshc-cols': String(count),
          style: height ? { height: height + 'px' } : undefined
        },
        cols
      );
    }

    /**
     * 兜底边界：交互版复制出错时**不要**让槽位把整个实现退休（那会静默变回宿主单列，
     * 看起来就是「只有一栏」）。这里把错误直接画在页面上，便于定位。
     */
    class MirrorErrorBoundary extends react.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }

      static getDerivedStateFromError(error) {
        return { error: error };
      }

      componentDidCatch(error) {
        console.error('[dsh-chat-columns] 交互版复制渲染失败', error);
      }

      render() {
        if (this.state.error) {
          return react.createElement(
            'div',
            { 'data-dshc-native-mirror-error': '', style: { padding: '16px', color: '#d92d20', fontSize: '13px' } },
            '交互版复制渲染失败：' + (this.state.error && this.state.error.message ? this.state.error.message : String(this.state.error))
          );
        }
        return this.props.children;
      }
    }

    function Guarded(props) {
      return react.createElement(MirrorErrorBoundary, null, react.createElement(NativeMirror, props));
    }

    return Guarded;
  }

  return { make };
})();


/* ============================================================ src/native-flow.js */
/**
 * B-Native｜交互版竖向无缝：接管 chat flow，三列连续流，跨缝用**真实 React 实例**补。
 *
 * 与轻量版（ghost / flow.js）的关系：
 *  - 阅读模型完全一致：列高 = 阅读视口 H，滚动量 s，第 c 列显示 [s+cH, s+(c+1)H)；
 *  - 唯一差别：跨缝那一份**不是 DOM 克隆**，而是对同一个 node 再调一次宿主的
 *    `conversation.chat.node` 渲染器 —— 得到的是真组件，按钮/折叠都活着。
 *
 * 布局由本组件自己负责（绝对定位 + 粘滞视口层 + 逻辑占位层），
 * 位置更新走命令式 transform，不触发 React 重渲染；只有"某条消息需要多一份"时才 setState。
 *
 * 已知限制（短期待接受）：
 *  - 跨缝选中仍会断（两棵 DOM 子树，语义上无解）；
 *  - Ctrl+F 会命中两份；
 *  - turn-process / 分组卡的分段折叠属于宿主内部实现，这里先按普通节点渲染。
 */
DSHC.native = (() => {
  'use strict';

  /** 宿主 flow 槽注册时没给 priority（默认 0），更小的值覆盖它。 */
  const PRIORITY = -1;
  const SLOT_FLOW = 'conversation.chat.flow';
  const SLOT_NODE = 'conversation.chat.node';
  const RAIL = 44;
  const MIN_VIEWPORT = 160;
  const GAP = 12;

  /** 槽位只有一个，竖向/复制共用它，用这个外部 store 决定渲哪套布局。 */
  const layoutStore = { layout: 'seamless', columns: 2 };
  const layoutListeners = new Set();
  function emitLayout() {
    for (const fn of layoutListeners) fn();
  }
  function subscribeLayout(fn) {
    layoutListeners.add(fn);
    return () => layoutListeners.delete(fn);
  }
  function setLayout(next) {
    const value = next === 'mirror' ? 'mirror' : 'seamless';
    if (value === layoutStore.layout) return;
    layoutStore.layout = value;
    emitLayout();
  }
  function setColumns(count) {
    const value = Math.max(1, Math.min(3, Number(count) || 1));
    if (value === layoutStore.columns) return;
    layoutStore.columns = value;
    emitLayout();
  }

  let installed = false;
  let teardown = null;
  let React = null;
  let lastError = '';
  let renders = 0;
  /** 运行时诊断（给 __dshc.diagnose().native 看）。 */
  const stats = { H: 0, cols: 0, columnWidth: 0, keys: 0, measured: 0, total: 0, scroll: 0, views: 0, planMax: 0, mode: '' };

  function safeRequire(name) {
    try {
      return require(name);
    } catch (error) {
      lastError = 'require("' + name + '") 失败: ' + (error && error.message ? error.message : error);
      return null;
    }
  }

  function constantSnapshot(value) {
    return { getSnapshot: () => value, subscribe: () => () => {} };
  }

  /** 阅读视口几何：从宿主滚动容器与正文列上量，和 ghost 用的是同一套 adapter。 */
  function readGeometry(column, scroller) {
    const adapter = DSHC.adapter;
    const math = DSHC.math;
    const rect = adapter.measure(scroller);
    if (!rect || !(rect.height >= MIN_VIEWPORT)) return null;
    const H = Math.floor(rect.height);
    const available = Math.floor(adapter.availableWidth(column, scroller) - RAIL);
    const cols = Math.max(1, Math.min(3, math.resolveColumns(available, 'auto')));
    const columnWidth = Math.floor(math.columnWidth(available, cols, math.GAP));
    if (!(columnWidth >= 220)) return null;
    return { H, cols, columnWidth, step: columnWidth + math.GAP };
  }

  function makeFlow(react) {
    const h = react.createElement;
    const { useRef, useState, useEffect, useLayoutEffect, useCallback } = react;

    function useSource(source) {
      return react.useSyncExternalStore(source.subscribe, source.getSnapshot, source.getSnapshot);
    }

    /** 一条消息的一个视图：自己订阅 keyed source，所以流式更新是局部的。 */
    function NodeView(props) {
      const { nodeKey, nodes, renderSlot, shared, registerRef, width } = props;
      const source = react.useMemo(() => nodes.source(nodeKey), [nodes, nodeKey]);
      const node = useSource(source);
      const owner = react.useMemo(
        () => (node ? { ...shared.owner, node } : null),
        [node, shared.owner]
      );
      const hookContext = react.useMemo(
        () => ({
          turnData: undefined,
          disclosureReset: constantSnapshot(0),
          useGroupAction: () => react.useRef(null)
        }),
        []
      );
      const ref = useCallback((el) => registerRef(nodeKey, el), [registerRef, nodeKey]);
      if (!node) return null;
      const attrs = Object.assign({ 'data-dshc-native-row': '' }, DSHC.adapter.flowRowAttrs(node));
      return h(
        'div',
        { ref, ...attrs, style: { position: 'absolute', left: '0px', top: '0px', width: width + 'px' } },
        renderSlot(SLOT_NODE, owner, {
          entryKey: node.kind,
          hookContext,
          fallback: h('div', null, '这条消息类型暂未渲染：' + node.kind)
        })
      );
    }

    function SeamlessFlow(props) {
      const { entries, renderSlot, useChat, cwd, openFile, openSkill, inspectCall, forkAt, loadImage, fileMentions } = props;
      renders += 1;

      const order = useChat((value) => value.order);
      const nodes = useChat((value) => value.nodes);

      const rootRef = useRef(null);
      const layerRef = useRef(null);
      const viewRefs = useRef(new Map()); // key -> first element (用来量高)
      const heights = useRef(new Map()); // key -> 像素高
      const startsRef = useRef([]); // 前缀和
      const totalRef = useRef(0);
      const sRef = useRef(0);
      const geomRef = useRef(null);
      const [geomState, setGeomState] = useState(null);
      const scrollRaf = useRef(0);
      const elRefs = useRef(new Map()); // "key:k" -> 视图元素

      // 每条消息当前需要几个视图（跨了几列缝就多几份）；只在数量变化时才 setState。
      const [extra, setExtra] = useState(() => ({}));

      const keys = react.useMemo(() => {
        const list = Array.isArray(entries) ? entries.filter((e) => e && e.kind === 'node').map((e) => e.key) : null;
        return list && list.length ? list : Array.isArray(order) ? order.slice() : [];
      }, [entries, order]);

      const shared = react.useMemo(
        () => ({
          owner: { cwd, openFile, openSkill, inspectCall, forkAt, loadImage, renderMessageImages: () => null, fileMentions }
        }),
        [cwd, openFile, openSkill, inspectCall, forkAt, loadImage, fileMentions]
      );

      const registerRef = useCallback((key, el) => {
        if (el) {
          if (!viewRefs.current.has(key)) viewRefs.current.set(key, el);
        }
      }, []);

      const scrollerOf = useCallback(() => {
        const root = rootRef.current;
        if (!root) return null;
        return DSHC.adapter.HOST.scroller ? root.closest(DSHC.adapter.HOST.scroller) : null;
      }, []);

      /** 量高 + 重算前缀和。 */
      const recompute = useCallback(() => {
        const geom = geomRef.current;
        if (!geom) return;
        const next = new Map();
        let y = 0;
        const starts = [];
        for (let i = 0; i < keys.length; i += 1) {
          const key = keys[i];
          const el = viewRefs.current.get(key);
          const height = el ? Math.max(0, Math.round(el.getBoundingClientRect().height)) : 0;
          next.set(key, height);
          if (i > 0) y += GAP;
          starts.push(y);
          y += height;
        }
        heights.current = next;
        startsRef.current = starts;
        totalRef.current = y;
        stats.measured = next.size;
        stats.total = Math.round(y);
      }, [keys]);

      /** 依据当前滚动量，算出每条消息需要几个视图（0 表示不在可见范围）。 */
      const planOf = useCallback(() => {
        const geom = geomRef.current;
        if (!geom) return {};
        const { H, cols } = geom;
        const s = sRef.current;
        const starts = startsRef.current;
        const plan = {};
        for (let i = 0; i < keys.length; i += 1) {
          const key = keys[i];
          const height = heights.current.get(key) || 0;
          if (height < 1) continue;
          const start = starts[i];
          let first = Math.floor((start - s) / H);
          let last = Math.floor((start + height - 1 - s) / H);
          if (last < 0 || first > cols - 1) continue;
          if (first < 0) first = 0;
          if (last > cols - 1) last = cols - 1;
          plan[key] = last - first + 1;
        }
        return plan;
      }, [keys]);

      /** 把每个视图挪到位（命令式，不触发渲染）。 */
      const project = useCallback(() => {
        const geom = geomRef.current;
        if (!geom || !layerRef.current) return;
        const { H, cols, step } = geom;
        const s = sRef.current;
        const starts = startsRef.current;
        const layer = layerRef.current;
        for (let i = 0; i < keys.length; i += 1) {
          const key = keys[i];
          const height = heights.current.get(key) || 0;
          if (height < 1) continue;
          const start = starts[i];
          let first = Math.floor((start - s) / H);
          let last = Math.floor((start + height - 1 - s) / H);
          if (last < 0 || first > cols - 1) {
            for (let k = 0; k < 3; k += 1) {
              const hidden = elRefs.current.get(key + ':' + k);
              if (hidden) hidden.style.visibility = 'hidden';
            }
            continue;
          }
          if (first < 0) first = 0;
          if (last > cols - 1) last = cols - 1;
          const count = last - first + 1;
          for (let k = 0; k < count; k += 1) {
            const col = last - k; // 最后一份放末段（原生控件通常在那儿）
            const el = elRefs.current.get(key + ':' + k);
            if (!el) continue;
            el.style.visibility = '';
            el.style.transform = 'translate3d(' + Math.round(col * step) + 'px,' + Math.round(start - s - col * H) + 'px,0)';
          }
          for (let k = count; k < 3; k += 1) {
            const el = elRefs.current.get(key + ':' + k);
            if (el) el.style.visibility = 'hidden';
          }
        }
      }, [keys]);

      /** 重算高度/位置；原本贴底的话跟着新内容走（新消息不该停在下半屏）。 */
      const refresh = useCallback(() => {
        const scroller = scrollerOf();
        const geom = geomRef.current;
        const before = geom ? Math.max(0, totalRef.current - geom.cols * geom.H) : 0;
        const follow = scroller ? before - scroller.scrollTop < 8 : false;
        recompute();
        tick();
        if (follow && scroller && geomRef.current) {
          const max = Math.max(0, totalRef.current - geomRef.current.cols * geomRef.current.H);
          if (Math.abs(scroller.scrollTop - max) > 0.5) scroller.scrollTop = max;
          tick();
        }
      }, [recompute, scrollerOf, tick]);

      const maxScrollOf = useCallback(() => {
        const geom = geomRef.current;
        if (!geom) return 0;
        return Math.max(0, totalRef.current - geom.cols * geom.H);
      }, []);

      /** 一帧：同步滚动量 → 需要几份 → 数量变了才 setState → 重新投影。 */
      const tick = useCallback(() => {
        const geoms = geomRef.current;
        const scroller = scrollerOf();
        if (!geoms || !scroller) return;
        sRef.current = Math.min(maxScrollOf(), Math.max(0, scroller.scrollTop));
        const next = planOf();
        let viewsWanted = 0;
        let planMax = 0;
        for (const key of Object.keys(next)) {
          viewsWanted += next[key];
          if (next[key] > planMax) planMax = next[key];
        }
        stats.scroll = Math.round(sRef.current);
        stats.views = viewsWanted;
        stats.planMax = planMax;
        stats.keys = keys.length;
        setExtra((prev) => {
          let changed = false;
          const keyset = new Set(Object.keys(next).concat(Object.keys(prev)));
          for (const key of keyset) {
            if ((next[key] || 0) !== (prev[key] || 0)) {
              changed = true;
              break;
            }
          }
          return changed ? next : prev;
        });
        project();
      }, [maxScrollOf, planOf, project, scrollerOf]);

      // 首帧：量几何、量高、把占位层撑起来。
      useLayoutEffect(() => {
        const scroller = scrollerOf();
        const column = rootRef.current ? rootRef.current.closest(DSHC.adapter.HOST.column) : null;
        if (!scroller || !column) return undefined;
        const geom = readGeometry(column, scroller);
        if (!geom) {
          lastError = '几何不足（视口或列宽太小）';
          return undefined;
        }
        geomRef.current = geom;
        stats.H = geom.H;
        stats.cols = geom.cols;
        stats.columnWidth = geom.columnWidth;
        requestAnimationFrame(() => {
          setGeomState(geom);
          recompute();
          // 宿主进来时停在底部：直接把行程拉到最后。
          scroller.scrollTop = Math.max(0, totalRef.current - geom.cols * geom.H);
          tick();
        });

        const onScroll = () => {
          if (scrollRaf.current) return;
          scrollRaf.current = requestAnimationFrame(() => {
            scrollRaf.current = 0;
            tick();
          });
        };
        scroller.addEventListener('scroll', onScroll, { passive: true });
        const onResize = () => {
          const next = readGeometry(column, scroller);
          if (!next) return;
          geomRef.current = next;
          recompute();
          tick();
        };
        window.addEventListener('resize', onResize);
        return () => {
          scroller.removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', onResize);
          if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
        };
      }, [recompute, scrollerOf, tick]);

      // 消息集合变化（流式/加载更早）后重量一次。
      useLayoutEffect(() => {
        requestAnimationFrame(refresh);
      }, [keys, refresh]);

      // 几何（列宽）真正落到 DOM 之后再量一次：首帧宽度是 0，量出来的是废数。
      useLayoutEffect(() => {
        if (!geomState) return undefined;
        const raf = requestAnimationFrame(refresh);
        return () => cancelAnimationFrame(raf);
      }, [geomState, refresh]);

      // 内容高度会变（流式、图片、折叠）：盯住每条消息的第一个视图。
      useLayoutEffect(() => {
        if (!geomState || typeof ResizeObserver !== 'function') return undefined;
        let raf = 0;
        const observer = new ResizeObserver(() => {
          if (raf) return;
          raf = requestAnimationFrame(() => {
            raf = 0;
            refresh();
          });
        });
        for (const key of keys) {
          const el = viewRefs.current.get(key);
          if (el) observer.observe(el);
        }
        return () => {
          if (raf) cancelAnimationFrame(raf);
          observer.disconnect();
        };
      }, [geomState, keys, refresh]);

      const geom = geomState || geomRef.current;
      const layerHeight = geom ? geom.H : 0;
      const spacer = Math.max(0, maxScrollOf());

      const views = [];
      for (const key of keys) {
        const count = extra[key] || 1;
        for (let k = 0; k < count; k += 1) {
          views.push(
            h(
              'div',
              {
                key: key + ':' + k,
                'data-dshc-view': key + ':' + k,
                ref: (el) => {
                  const id = key + ':' + k;
                  if (el) elRefs.current.set(id, el);
                  else elRefs.current.delete(id);
                },
                style: { position: 'absolute', left: '0px', top: '0px', width: (geomState ? geomState.columnWidth : 0) + 'px', willChange: 'transform' }
              },
              h(NodeView, {
                nodeKey: key,
                nodes,
                renderSlot,
                shared,
                registerRef,
                width: geomState ? geomState.columnWidth : 0
              })
            )
          );
        }
      }

      return h(
        'div',
        { ref: rootRef, 'data-dshc-native': '', style: { display: 'block' } },
        h(
          'div',
          {
            ref: layerRef,
            'data-dshc-native-layer': '',
            style: { position: 'sticky', top: '0px', height: layerHeight + 'px', overflow: 'hidden' }
          },
          views
        ),
        h('div', { 'data-dshc-native-spacer': '', style: { height: spacer + 'px' } })
      );
    }

    /** 路由：竖向用连续流布局，复制用 N 栏布局；两者共用同一个槽位。 */
    function NativeFlowRouter(props) {
      const layout = react.useSyncExternalStore(subscribeLayout, () => layoutStore.layout, () => layoutStore.layout);
      if (layout === 'mirror' && DSHC.nativeMirror) {
        if (!mirrorComponent) mirrorComponent = DSHC.nativeMirror.make(react);
        return react.createElement(mirrorComponent, {
          renderSlot: props.renderSlot,
          useChat: props.useChat,
          columns: layoutStore.columns,
          shared: {
            owner: {
              cwd: props.cwd,
              openFile: props.openFile,
              openSkill: props.openSkill,
              inspectCall: props.inspectCall,
              forkAt: props.forkAt,
              loadImage: props.loadImage,
              renderMessageImages: () => null,
              fileMentions: props.fileMentions
            }
          }
        });
      }
      return react.createElement(SeamlessFlow, props);
    }

    let mirrorComponent = null;
    return NativeFlowRouter;
  }

  function install(ctx) {
    if (installed) return true;
    if (!ctx || !ctx.slots || typeof ctx.slots.register !== 'function') {
      lastError = '宿主没有提供 ctx.slots';
      return false;
    }
    if (!React) React = safeRequire('react');
    if (!React) return false;
    const Flow = makeFlow(React);
    try {
      const off = ctx.slots.inject(SLOT_FLOW, () => ctx.slots.register({ name: SLOT_FLOW, priority: PRIORITY }, Flow));
      teardown = typeof off === 'function' ? off : null;
      installed = true;
      return true;
    } catch (error) {
      lastError = '注册槽位失败: ' + (error && error.message ? error.message : error);
      return false;
    }
  }

  function uninstall() {
    if (teardown) {
      try {
        teardown();
      } catch (error) {
        lastError = '卸载槽位失败: ' + (error && error.message ? error.message : error);
      }
    }
    teardown = null;
    installed = false;
  }

  function diagnose() {
    return {
      installed,
      layout: layoutStore.layout,
      columns: layoutStore.columns,
      priority: PRIORITY,
      react: !!React,
      renders,
      lastError,
      // 布局现场：H / 列数 / 列宽 / 量到几条 / 内容总高 / 滚动量 / 当前视图数
      H: stats.H,
      cols: stats.cols,
      columnWidth: stats.columnWidth,
      keys: stats.keys,
      measured: stats.measured,
      total: stats.total,
      scroll: stats.scroll,
      views: stats.views,
      planMax: stats.planMax
    };
  }

  return {
    install,
    uninstall,
    diagnose,
    setLayout,
    setColumns,
    getLayout: () => layoutStore.layout,
    isInstalled: () => installed
  };
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
      suppress = true;
      if (!anchor) {
        // 没有锚点（刚进复制模式）→ 每栏都落到最新内容，和宿主原生落点一致。
        try {
          for (let i = 0; i < cols.length; i += 1) {
            cols[i].body.scrollTop = cols[i].body.scrollHeight;
            cols[i].armed = cols[i].body.scrollTop > REARM;
          }
        } finally {
          suppress = false;
        }
        return;
      }
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
  // 四枚 20×20 线性图标（猫猫绘制，纯 fill="currentColor"，深浅主题自动跟随）
  const ICONS = {
    // 原生：单列居中阅读流
    none:
      'M4.5 3H15.5A2 2 0 0 1 17.5 5V15A2 2 0 0 1 15.5 17H4.5A2 2 0 0 1 2.5 15V5A2 2 0 0 1 4.5 3ZM4 4.5V15.5A.5.5 0 0 0 4.5 16H15.5A.5.5 0 0 0 16 15.5V4.5A.5.5 0 0 0 15.5 4H4.5A.5.5 0 0 0 4 4.5ZM10.5 6H14A.75.75 0 0 1 14.75 6.75A.75.75 0 0 1 14 7.5H10.5A.75.75 0 0 1 9.75 6.75A.75.75 0 0 1 10.5 6ZM6 9.25H13.25A.75.75 0 0 1 14 10A.75.75 0 0 1 13.25 10.75H6A.75.75 0 0 1 5.25 10A.75.75 0 0 1 6 9.25ZM6 12.5H10A.75.75 0 0 1 10.75 13.25A.75.75 0 0 1 10 14H6A.75.75 0 0 1 5.25 13.25A.75.75 0 0 1 6 12.5Z',
    // 报纸：三列均衡分栏
    cols:
      'M4.5 3H15.5A2 2 0 0 1 17.5 5V15A2 2 0 0 1 15.5 17H4.5A2 2 0 0 1 2.5 15V5A2 2 0 0 1 4.5 3ZM4 4.5V15.5A.5.5 0 0 0 4.5 16H7V4H4.5A.5.5 0 0 0 4 4.5ZM8.5 4V16H11.5V4H8.5ZM13 4V16H15.5A.5.5 0 0 0 16 15.5V4.5A.5.5 0 0 0 15.5 4H13Z',
    // 无缝：双列接缝连续流
    seam:
      'M4.5 3H15.5A2 2 0 0 1 17.5 5V15A2 2 0 0 1 15.5 17H4.5A2 2 0 0 1 2.5 15V5A2 2 0 0 1 4.5 3ZM4 4.5V15.5A.5.5 0 0 0 4.5 16H15.5A.5.5 0 0 0 16 15.5V4.5A.5.5 0 0 0 15.5 4H4.5A.5.5 0 0 0 4 4.5ZM6 5.5H7.5V14.5H6ZM12.5 5.5H14V14.5H12.5ZM7.5 12.5L12.5 7.5V9L9 12.5Z',
    // 复制：双层卡片副本
    mirror:
      'M7.5 2.5H15.5A2 2 0 0 1 17.5 4.5V12.5A2 2 0 0 1 15.5 14.5H14V13H15.5A.5.5 0 0 0 16 12.5V4.5A.5.5 0 0 0 15.5 4H7.5A.5.5 0 0 0 7 4.5V6H5.5V4.5A2 2 0 0 1 7.5 2.5ZM4.5 5.5H12.5A2 2 0 0 1 14.5 7.5V15.5A2 2 0 0 1 12.5 17.5H4.5A2 2 0 0 1 2.5 15.5V7.5A2 2 0 0 1 4.5 5.5ZM4 7.5V15.5A.5.5 0 0 0 4.5 16H7.75V7H4.5A.5.5 0 0 0 4 7.5ZM9.25 7V16H12.5A.5.5 0 0 0 13 15.5V7.5A.5.5 0 0 0 12.5 7H9.25Z'
  };

  /** 建元素的小工具（带 class 与属性表）。 */
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

  /** 单路径图标：viewBox 20×20，fill 跟随 currentColor。 */
  function svgIcon(kind) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('fill', 'currentColor');
    path.setAttribute('fill-rule', 'evenodd');
    path.setAttribute('d', ICONS[kind] || ICONS.none);
    svg.appendChild(path);
    return svg;
  }

  function create(options) {
    const root = options.root;
    const onMode = options.onMode || function noop() {};
    const onColumns = options.onColumns || function noop() {};
    const onAutoLoad = options.onAutoLoad || function noop() {};
    const onVariant = options.onVariant || function noop() {};
    const onImpl = options.onImpl || function noop() {};
    const onPageStep = options.onPageStep || function noop() {};
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

    const variantGroup = el('div', 'dshc-group', { 'data-role': 'variant-group' });
    const variantLabel = el('span', 'dshc-label', { id: 'dshc-label-variant' });
    variantLabel.textContent = '滚动方式';
    const variantBox = el('div', 'dshc-seg', { role: 'group', 'aria-labelledby': 'dshc-label-variant', 'data-role': 'variants' });
    const variantValues = [
      ['vertical', '竖向'],
      ['horizontal', '横向'],
      ['paged', '翻页']
    ];
    const variantButtons = variantValues.map(([value, label]) => {
      const button = el('button', null, { type: 'button', 'data-variant': value, 'aria-pressed': 'false' });
      button.textContent = label;
      variantBox.appendChild(button);
      return button;
    });
    variantGroup.append(variantLabel, variantBox);

    const stepGroup = el('div', 'dshc-group', { 'data-role': 'step-group' });
    const stepLabel = el('span', 'dshc-label', { id: 'dshc-label-step' });
    stepLabel.textContent = '每页列数';
    const stepBox = el('div', 'dshc-seg', { role: 'group', 'aria-labelledby': 'dshc-label-step', 'data-role': 'steps' });
    const stepValues = [
      ['screen', '一屏'],
      ['1', '1'],
      ['2', '2'],
      ['3', '3']
    ];
    const stepButtons = stepValues.map(([value, label]) => {
      const button = el('button', null, { type: 'button', 'data-step': value, 'aria-pressed': 'false' });
      button.textContent = label;
      stepBox.appendChild(button);
      return button;
    });
    stepGroup.append(stepLabel, stepBox);

    // 无缝竖向的两档实现：轻量版 / 交互版（阅读模型一致，差别是跨缝那份能否交互）
    const implGroup = el('div', 'dshc-group', { 'data-role': 'impl-group' });
    const implLabel = el('span', 'dshc-label', { id: 'dshc-label-impl' });
    implLabel.textContent = '实现方式';
    const implBox = el('div', 'dshc-seg', { role: 'group', 'aria-labelledby': 'dshc-label-impl', 'data-role': 'impls' });
    const implValues = [
      ['ghost', '轻量'],
      ['native', '交互']
    ];
    const implButtons = implValues.map(([value, label]) => {
      const button = el('button', null, { type: 'button', 'data-impl': value, 'aria-pressed': 'false' });
      button.textContent = label;
      implBox.appendChild(button);
      return button;
    });
    implGroup.append(implLabel, implBox);

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

    panel.append(head, modesGroup, colsGroup, variantGroup, stepGroup, implGroup, autoGroup, status, actions, note);
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
    /** 是否贴到了宿主右上角动作栏（决定按钮样式与角标文案）。 */
    let anchored = false;
    /** 最近一次渲染用的状态（定位方式变化时要用它刷新角标文案）。 */
    let lastView = null;
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
      const page = current.pageInfo;
      if (page && page.active) {
        const how = current.variant === 'horizontal' ? '横向' : '翻页';
        return '无缝（' + how + '） ' + page.cols + ' 列 · 第 ' + (page.page + 1) + '/' + page.pages + ' 页';
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
      lastView = next || lastView || null;
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
      mark.textContent = info.label;
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
      variantGroup.hidden = mode !== 'seamless';
      // 交互版对「无缝竖向」和「复制」都适用；横向/翻页没有第二套实现。
      implGroup.hidden =
        (mode === 'seamless' && next && next.variant && next.variant !== 'vertical') ||
        (mode !== 'seamless' && mode !== 'mirror');
      for (const button of implButtons) {
        const value = button.getAttribute('data-impl');
        button.setAttribute('aria-pressed', String(value === (next && next.impl ? next.impl : 'ghost')));
        // 交互版暂不可用：置灰并把原因写在 title 里（不要让它看起来能用）
        const blocked = value === 'native' && next && next.implBlocked;
        button.disabled = !!blocked;
        if (blocked && next.implNote) button.title = next.implNote;
        else button.removeAttribute('title');
      }
      // 每页列数只对「翻页」有意义：横向是线性横移，竖向根本不按页走。
      stepGroup.hidden = mode !== 'seamless' || current.variant !== 'paged';
      for (const button of stepButtons) {
        const value = button.getAttribute('data-step');
        button.setAttribute('aria-pressed', value === String(current.pageStep) ? 'true' : 'false');
      }
      for (const button of variantButtons) {
        const value = button.getAttribute('data-variant');
        button.setAttribute('aria-pressed', value === String(current.variant) ? 'true' : 'false');
      }
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

    /**
     * 摆放控制器。
     * 优先贴到宿主右上角动作栏的左边（和文件夹/更多/面板图标排成一行）；
     * 宿主没给这个槽时，退回原来的悬浮位置。
     */
    function position(rect) {
      if (!rect) return;
      const bar = DSHC.adapter.toolbarAnchor ? DSHC.adapter.toolbarAnchor() : null;
      const TOGGLE_H = 30;
      const GAP = 8;

      const nextAnchored = !!bar;
      if (nextAnchored !== anchored) {
        anchored = nextAnchored;
        const info = MODES.find((item) => item.id === ((lastView && lastView.mode) || 'native')) || MODES[0];
        mark.textContent = info.label;
      }

      if (bar) {
        const top = Math.round(bar.top + (bar.height - TOGGLE_H) / 2);
        const right = Math.round(window.innerWidth - bar.left + GAP);
        anchored = true;
        wrap.setAttribute('data-dshc-anchor', 'toolbar');
        wrap.style.top = top + 'px';
        wrap.style.right = right + 'px';
        panel.style.maxHeight = Math.max(220, Math.min(460, Math.round(rect.height) - (top - rect.top) - 48)) + 'px';
      } else {
        anchored = false;
        wrap.removeAttribute('data-dshc-anchor');
        const scrollbar = rect.scrollbarWidth || 5;
        const rightInset = Math.max(12, window.innerWidth - rect.right + scrollbar + 12 + 40);
        wrap.style.top = Math.max(8, Math.round(rect.top) + 10) + 'px';
        wrap.style.right = Math.round(rightInset) + 'px';
        panel.style.maxHeight = Math.max(220, Math.min(460, Math.round(rect.height) - 88)) + 'px';
      }

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
    for (const button of variantButtons) {
      button.addEventListener('click', () => onVariant(button.getAttribute('data-variant')));
    }
    for (const button of stepButtons) {
      button.addEventListener('click', () => onPageStep(button.getAttribute('data-step')));
    }
    for (const button of implButtons) {
      button.addEventListener('click', () => onImpl(button.getAttribute('data-impl')));
    }
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

  const VERSION = '1.0.0-beta.1';
  const SETTINGS_KEY = 'dshc-settings';
  const MODES = ['native', 'newspaper', 'seamless', 'mirror'];
  const COLS = ['auto', '1', '2', '3'];
  const MOBILE_QUERY = '(max-width: 767px)';
  const VARIANTS = ['vertical', 'horizontal', 'paged'];
  const STEPS = ['screen', '1', '2', '3'];
  const DEFAULT_AUTO = { newspaper: false, seamless: true, mirror: true };
  /**
   * 交互版（Native）暂时不可用。
   * 宿主渲染器只在「注册时声明了子槽」的情况下才发 renderSlot：
   *   dsh-client-ui-renderer/lib/client.js: `if (entry.children !== void 0) kit.renderSlot = …`
   * 而 conversation.chat.node 已被 chat 包声明，别人再声明会抛 already declared。
   * 结果：影子注册的 flow 拿不到 renderSlot → 组件抛错 → slots 把我们的实现退休 →
   * 静默退回宿主单列渲染。宿主放行后把 BLOCKED 改成 false 即可复活。
   */
  const NATIVE_BLOCKED = true;
  const NATIVE_BLOCKED_NOTE = '交互版暂不可用：宿主的影子 flow 拿不到 renderSlot（待宿主放行）';

  const state = {
    mode: 'native',
    cols: 'auto',
    autoLoad: Object.assign({}, DEFAULT_AUTO),
    variant: 'vertical',
    pageStep: 'screen',
    resolved: 1,
    /** B′ 连续流：内部实验开关，不是用户可见模式。 */
    flow: false,
    /** 无缝竖向的实现方式：ghost（轻量）| native（交互）。 */
    impl: 'ghost'
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
  let paged = null;
  let flow = null;
  let mirror = null;

  let themeWatch = null;
  let mobileMq = null;
  let mobileListener = null;
  let resizeObserver = null;
  let resizeRaf = 0;
  let resolveTimer = 0;
  let startupWatch = null;
  let columnWatch = null;
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
      // 第一次安装默认进「无缝 · 轻量」：这才是这个插件的卖点。
      mode: MODES.indexOf(value.mode) >= 0 ? value.mode : 'seamless',
      cols: COLS.indexOf(String(value.cols)) >= 0 ? String(value.cols) : 'auto',
      variant: VARIANTS.indexOf(value.variant) >= 0 ? value.variant : 'vertical',
      impl: value.impl === 'native' ? 'native' : 'ghost',
      pageStep: STEPS.indexOf(String(value.pageStep)) >= 0 ? String(value.pageStep) : 'screen',
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
          impl: state.impl,
          variant: state.variant,
          pageStep: state.pageStep,
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
      variant: state.variant,
      impl: state.impl,
      implBlocked: NATIVE_BLOCKED,
      implNote: NATIVE_BLOCKED_NOTE,
      pageStep: state.pageStep,
      pageInfo: state.mode === 'seamless' && state.variant !== 'vertical' && paged ? paged.diagnose() : null,
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
    if (flow) flow.restore();
    if (paged) paged.restore();
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

    ensureApplied();
    refreshHistory();
    render();
  }

  /** 按当前模式应用视图；降级原因通过 state.prefNote 反馈给控制器。 */
  function applyView(anchor) {
    const items = itemsFromIndex();
    let note = '';

    // 交互版：竖向无缝 + 复制两个视图都走它，其它视图把槽位还回宿主。
    const nativeSeamless = state.mode === 'seamless' && state.variant === 'vertical' && state.impl === 'native';
    const nativeMirror = state.mode === 'mirror' && state.impl === 'native';
    if (!nativeSeamless && !nativeMirror && DSHC.native && DSHC.native.isInstalled()) DSHC.native.uninstall();
    if (nativeSeamless && DSHC.native) DSHC.native.setLayout('seamless');
    if (nativeMirror && DSHC.native) DSHC.native.setLayout('mirror');

    if (state.mode === 'newspaper') {
      if (state.resolved < 2) {
        note = '当前宽度只够 1 列';
      } else {
        hideHostOlder(true);
        newspaper.apply(target, state.resolved);
      }
    } else if (state.mode === 'seamless') {
      const wantNative = state.impl === 'native' && state.variant === 'vertical';
      if (wantNative) {
        // 交互版自己接管 chat flow 渲染，宿主 DOM 一律不改写。
        if (DSHC.native && !DSHC.native.isInstalled()) DSHC.native.install(pluginCtx);
      } else if (state.resolved < 2) {
        note = '当前宽度只够 1 列';
      } else {
        // 不在交互版时把槽位还回宿主，避免它继续接管渲染。
        if (DSHC.native && DSHC.native.isInstalled()) DSHC.native.uninstall();
        hideHostOlder(true);
        // 竖向下：轻量 = 连续流引擎（Ghost）；交互 = 接管渲染器（Native，不走这里）。
        const useFlow = state.variant === 'vertical' && state.impl === 'ghost' && flow;
        const ok =
          state.variant === 'vertical'
            ? (useFlow
                ? flow.apply(target, state.resolved, items)
                : seamless.apply(target, state.resolved, items))
            : paged.apply(target, state.resolved, {
                progress: state.variant === 'horizontal' ? 'linear' : 'page',
                stepCols: state.pageStep === 'screen' ? state.resolved : Number(state.pageStep)
              });
        if (!ok) note = state.variant === 'vertical' ? '无缝模式初始化失败，已退回原生' : '横向/翻页无缝初始化失败，已退回原生';
      }
    } else if (state.mode === 'mirror') {
      if (nativeMirror) {
        // 交互版复制：每栏都是真组件，不克隆 DOM。
        if (DSHC.native && !DSHC.native.isInstalled()) DSHC.native.install(pluginCtx);
        if (DSHC.native) DSHC.native.setColumns(state.resolved);
        note = '';
      } else {
        hideHostOlder(true);
        DSHC.adapter.setAttr(target.scroller, 'data-dshc-hide-scrollbar', '');
        mirror.setColumns(state.resolved, items);
        // 复制模式：每栏都是完整副本，进入时让所有栏停在同一阅读位置。
        // 不传锚点：进入复制模式直接落到各栏底部（最新内容）。
        mirror.apply(target, state.resolved, items, geometry(), null);
        mirror.setMeta({ history: history ? history.snapshot() : null });
      }
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
      newspaper.tune();
    } else if (state.mode === 'seamless') {
      if (state.variant !== 'vertical') paged.update();
      else if (state.impl === 'ghost' && flow) flow.update(itemsFromIndex(), change.dirty);
      else seamless.update(itemsFromIndex(), change.dirty);
    } else if (state.mode === 'mirror') {
      if (state.impl !== 'native') mirror.update(itemsFromIndex(), { history: history ? history.snapshot() : null }, change);
    }

    refreshHistory();
    render();
  }

  /* ------------------------------------------------------------ 目标识别 */

  let revealTimer = 0;

  /** 切会话时先盖住正文列，避免「默认视图 → 目标视图」闪一下。 */
  function hideForSwitch() {
    if (!target.column || state.mode === 'native') return;
    DSHC.adapter.setStyle(target.column, 'visibility', 'hidden');
    if (revealTimer) clearTimeout(revealTimer);
    // 兜底：最多盖 500ms，绝不把聊天盖死。
    revealTimer = setTimeout(() => {
      revealTimer = 0;
      revealNow();
    }, 500);
  }

  function revealNow() {
    if (revealTimer) {
      clearTimeout(revealTimer);
      revealTimer = 0;
    }
    if (target.column) DSHC.adapter.setStyle(target.column, 'visibility', '');
  }

  /** 当前选的模式是否已经真的落到 DOM 上了（没落上就要补一次）。 */
  function isModeApplied() {
    if (!target.scroller || !target.column) return false;
    if (state.mode === 'native') return true;
    if (state.mode === 'newspaper') return !!(newspaper && newspaper.isApplied());
    if (state.mode === 'mirror') return !!(mirror && mirror.isActive());
    if (state.mode === 'seamless') {
      if (state.variant !== 'vertical') return !!(paged && paged.isActive());
      if (state.impl === 'native') return !!(DSHC.native && DSHC.native.isInstalled());
      return !!(flow && flow.isActive());
    }
    return true;
  }

  let retryTimer = 0;
  let retryLeft = 8;
  /**
   * 布局没落上就补一次。
   * 典型场景：切会话时新的正文列还没渲染完（高度 0 / 消息为空），那一次 applyMode 会失败，
   * 之后消息到了却没人再应用 → 用户看到的是默认视图，得手动点一下才变。
   */
  function ensureApplied() {
    if (!mounted || disposed || retryTimer) return;
    if (isModeApplied() || state.mode === 'native') {
      retryLeft = 8;
      return;
    }
    if (retryLeft <= 0) return;
    retryLeft -= 1;
    retryTimer = setTimeout(() => {
      retryTimer = 0;
      applyMode();
      if (isModeApplied()) revealNow();
      else ensureApplied();
    }, 60);
  }

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

      const switched = !!(nextSession && nextSession !== sessionKey);

      if (!changed && !force) {
        refreshHistory();
        if (state.mode === 'mirror') mirror.setMeta({ history: history ? history.snapshot() : null });
        render();
        return;
      }

      resetHost();
      retryLeft = 8;
      if (history) history.reset();

      target.scroller = found.scroller;
      target.column = found.column;
      target.reason = found.reason;
      target.rows = found.rows;
      sessionKey = nextSession || sessionKey;

      observeResize(found.scroller);
      rebuildIndexer();
      if (switched) hideForSwitch();
      applyMode();
      if (isModeApplied()) revealNow();
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
      if (!isModeApplied()) ensureApplied();
      if (state.mode === 'seamless') {
        if (state.variant !== 'vertical') {
          paged.apply(target, state.resolved, {
            progress: state.variant === 'horizontal' ? 'linear' : 'page',
            stepCols: state.pageStep === 'screen' ? state.resolved : Number(state.pageStep)
          });
        } else if (state.impl === 'ghost' && flow) {
          flow.relayout();
        } else {
          seamless.relayout();
        }
      }
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

  function setPageStep(value) {
    const next = String(value);
    if (STEPS.indexOf(next) < 0 || next === state.pageStep) return;
    state.pageStep = next;
    writeSettings();
    if (state.mode === 'seamless') applyMode();
    else render();
  }

  function setVariant(value) {
    const next = String(value);
    if (VARIANTS.indexOf(next) < 0 || next === state.variant) return;
    state.variant = next;
    writeSettings();
    if (state.mode === 'seamless') applyMode();
    else render();
  }

  /**
   * 内部实验开关：B 模式换用「连续流 + 边界副本」引擎。
   * 不是用户可见的第四种模式，只为验收期 A/B 用。
   */
  function setFlow(value) {
    // 兼容旧入口：true = 轻量（连续流），false = 交互（接管渲染器）。
    setImpl(value ? 'ghost' : 'native');
  }

  /**
   * 无缝竖向的实现方式（并列两档，阅读模型完全一样）：
   *  - ghost：轻量版 —— 原生节点 + 边界克隆，跨缝那份只读；
   *  - native：交互版 —— 接管 chat flow，跨缝那份是真实 React 实例。
   * @param {string} value 'ghost' | 'native'
   */
  function setImpl(value) {
    const next = String(value) === 'native' ? 'native' : 'ghost';
    if (next === state.impl) return;
    if (next === 'native') {
      if (NATIVE_BLOCKED) {
        state.prefNote = NATIVE_BLOCKED_NOTE;
        render();
        return;
      }
      const ok = DSHC.native && DSHC.native.install(pluginCtx);
      if (!ok) {
        const detail = DSHC.native ? DSHC.native.diagnose().lastError : 'native 模块缺失';
        state.prefNote = '交互版不可用：' + (detail || '未知原因');
        render();
        return;
      }
      // 交互版适用于「无缝竖向」和「复制」：留在当前视图，不把用户踢走。
      writeSettings();
    } else if (DSHC.native) {
      DSHC.native.uninstall();
    }
    state.impl = next;
    delete state.prefNote;
    applyMode();
  }

  function nextPage() {
    if (state.mode === 'seamless' && state.variant !== 'vertical' && paged) paged.next();
  }

  function prevPage() {
    if (state.mode === 'seamless' && state.variant !== 'vertical' && paged) paged.prev();
  }

  function setPage(value) {
    if (state.mode === 'seamless' && state.variant !== 'vertical' && paged) paged.goTo(Number(value) || 0);
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
    state.variant = settings.variant;
    state.impl = settings.impl;
    state.pageStep = settings.pageStep;

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
    paged = DSHC.paged.create({ onChange: () => render() });
    flow = DSHC.flow.create({});
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
      onVariant: setVariant,
      onImpl: setImpl,
      onPageStep: setPageStep,
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

    // 切会话时正文列会被整块换掉。必须在同一帧盖住新列，否则会先画出一帧原生排版。
    columnWatch = DSHC.adapter.watchColumns((column) => {
      if (!mounted || disposed) return;
      if (column && column !== target.column) {
        if (state.mode !== 'native') DSHC.adapter.setStyle(column, 'visibility', 'hidden');
        if (revealTimer) clearTimeout(revealTimer);
        revealTimer = setTimeout(() => {
          revealTimer = 0;
          revealNow();
        }, 500);
        setTimeout(() => {
          if (mounted && !disposed) resolve(true);
        }, 0);
        return;
      }
      // 列没变就别重扫：我们自己的副本也会触发 mutation，重扫会自激。
      if (!target.column || !target.column.isConnected) scheduleResolve(true);
    });

    startExpose();
    render();
    resolve(true);
    return api;
  }

  function unmount() {
    if (!mounted) return;
    mounted = false;
    disposed = true;
    // 停用插件时把 flow 槽位还回宿主，否则聊天会停在我们的实现上。
    if (DSHC.native) DSHC.native.uninstall();

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
    if (columnWatch) columnWatch();
    columnWatch = null;
    if (revealTimer) {
      clearTimeout(revealTimer);
      revealTimer = 0;
    }
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
      if (paged) paged.restore();
      if (mirror) mirror.restore();
      DSHC.adapter.resetAll();
    }
    newspaper = null;
    seamless = null;
    paged = null;
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
      flow: flow ? flow.diagnose() : null,
      native: DSHC.native ? DSHC.native.diagnose() : null,
      toolbar: DSHC.adapter.lastToolbar ? DSHC.adapter.lastToolbar() : null,
      paged: paged ? paged.diagnose() : null,
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
      // 上次是交互版的话，这里补装槽位。
      if (state.impl === 'native' && DSHC.native) DSHC.native.install(pluginCtx);
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
    setVariant,
    setPageStep,
    setFlow,
    setImpl,
    nextPage,
    prevPage,
    setPage,
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
      setVariant,
      setPageStep,
      setFlow,
      setImpl,
      nextPage,
      prevPage,
      setPage,
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
		exports.inject = ["slots"];
		return module.exports;
	}
});
