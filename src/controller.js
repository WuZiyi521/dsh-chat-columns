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
      'M4.5 3H15.5A2 2 0 0 1 17.5 5V15A2 2 0 0 1 15.5 17H4.5A2 2 0 0 1 2.5 15V5A2 2 0 0 1 4.5 3ZM4 4.5V15.5A.5.5 0 0 0 4.5 16H15.5A.5.5 0 0 0 16 15.5V4.5A.5.5 0 0 0 15.5 4H4.5A.5.5 0 0 0 4 4.5ZM9.25 4H10.75V6.5H9.25ZM9.25 13.5H10.75V16H9.25ZM6 6H7.5V10.5C7.5 12.5 12.5 7 12.5 9V13.5H14V9C14 6 9 11.5 9 10V6H6ZM13.25 14L11.5 11.5H15Z',
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
