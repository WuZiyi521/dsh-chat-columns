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

  const VERSION = '3.5.0';
  const SETTINGS_KEY = 'dshc-settings';
  const MODES = ['native', 'newspaper', 'seamless', 'mirror'];
  const COLS = ['auto', '1', '2', '3'];
  const MOBILE_QUERY = '(max-width: 767px)';
  const VARIANTS = ['vertical', 'horizontal', 'paged'];
  const DEFAULT_AUTO = { newspaper: false, seamless: true, mirror: true };

  const state = {
    mode: 'native',
    cols: 'auto',
    autoLoad: Object.assign({}, DEFAULT_AUTO),
    variant: 'vertical',
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
  let paged = null;
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
      variant: VARIANTS.indexOf(value.variant) >= 0 ? value.variant : 'vertical',
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
          variant: state.variant,
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
        const ok =
          state.variant === 'vertical'
            ? seamless.apply(target, state.resolved, items)
            : paged.apply(target, state.resolved, { progress: state.variant === 'horizontal' ? 'linear' : 'page' });
        if (!ok) note = state.variant === 'vertical' ? '无缝模式初始化失败，已退回原生' : '横向/翻页无缝初始化失败，已退回原生';
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
      newspaper.tune();
    } else if (state.mode === 'seamless') {
      if (state.variant !== 'vertical') paged.update();
      else seamless.update(itemsFromIndex(), change.dirty);
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
      if (state.mode === 'seamless') {
        if (state.variant !== 'vertical') {
          paged.apply(target, state.resolved, { progress: state.variant === 'horizontal' ? 'linear' : 'page' });
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

  function setVariant(value) {
    const next = String(value);
    if (VARIANTS.indexOf(next) < 0 || next === state.variant) return;
    state.variant = next;
    writeSettings();
    if (state.mode === 'seamless') applyMode();
    else render();
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
