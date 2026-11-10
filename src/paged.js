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

      // 1) 先按单列量一次内容总高，算出纸带要几列
      adapter.setStyles(column, {
        display: 'block',
        'column-count': '1',
        'column-fill': 'auto',
        'column-gap': GAP + 'px',
        'column-width': 'auto',
        height: 'auto',
        width: '100%',
        'max-width': 'none',
        margin: '0',
        padding: '0',
        'box-sizing': 'border-box',
        [adapter.HOST.contentWidth]: '100%'
      });
      const total = column.getBoundingClientRect().height;
      totalCols = Math.max(1, Math.ceil((total || 0) / Math.max(1, H)));
      pages = Math.max(1, Math.ceil(totalCols / Math.max(1, cols)));

      // 2) 纸带：所有列横向排开，交给宿主横向滚动
      adapter.setStyles(column, {
        'column-count': String(totalCols),
        'column-fill': 'auto',
        'column-gap': GAP + 'px',
        'column-width': 'auto',
        height: H + 'px',
        width: totalCols * colW + (totalCols - 1) * GAP + 'px',
        'max-width': 'none',
        overflow: 'visible',
        transform: 'none'
      });
      adapter.setAttr(column, 'data-dshc-paged', '');

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

    function pageWidth() {
      return step * Math.max(1, cols);
    }

    function maxScroll() {
      if (!host) return 0;
      const width = (Number(host.scrollWidth) || 0) - (Number(host.clientWidth) || 0);
      return Number.isFinite(width) ? Math.max(0, width) : 0;
    }

    function currentPage() {
      if (!host || !pageWidth()) return 0;
      return Math.round(host.scrollLeft / pageWidth());
    }

    function clampPage(value) {
      return Math.max(0, Math.min(pages - 1, value));
    }

    /** 翻到第 p 页（平滑横向滚动）。 */
    function goTo(next) {
      if (!host) return;
      const target = clampPage(next);
      const left = Math.min(maxScroll(), target * pageWidth());
      if (typeof host.scrollTo === 'function') {
        try {
          host.scrollTo({ left, behavior: 'smooth' });
        } catch (error) {
          host.scrollLeft = left;
        }
      } else {
        host.scrollLeft = left;
      }
      page = target;
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
      acc = 0;
    }

    /* --------------------------------------------------------------- 应用 */

    function apply(target, count, options) {
      column = target && target.column ? target.column : null;
      scroller = target && target.scroller ? target.scroller : null;
      cols = Math.max(1, Math.min(3, Number(count) || 1));
      progress = options && options.progress === 'linear' ? 'linear' : 'page';
      if (!column || !scroller) {
        restore();
        return false;
      }

      try {
        if (!applyShell()) {
          restore();
          return false;
        }
        page = 0;
        if (host) host.scrollLeft = 0;
        active = true;
        bind();
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
      const keep = page;
      if (!applyShell()) {
        restore();
        return;
      }
      goTo(clampPage(keep));
    }

    function restore() {
      active = false;
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
