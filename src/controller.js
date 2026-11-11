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
        button.setAttribute('aria-pressed', String(button.getAttribute('data-impl') === (next && next.impl ? next.impl : 'ghost')));
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
