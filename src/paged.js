/**
 * B′｜翻页式无缝（实验，方案二）：浏览器自己分栏，一屏 N 列，滚动翻页。
 *
 * 和原来的 B（逐条绝对定位）是两套完全不同的模型：
 *  - 用 CSS 多列 + `column-fill: auto` + 固定高度 H，让**浏览器**把正文切成一列列（段落、代码块都能切）；
 *  - 正文列就是那条「纸带」：宽 = N 列，超出的列排在右边，由外层裁剪；
 *  - 一屏显示 N 列，翻一页就把纸带整条左移 N 列 —— 每页都是整齐的 N 列，没有列底参差、没有单元过大。
 *
 * 代价（必须说清楚）：
 *  - 读法是「从左到右读完这一屏，再翻页」，不是「接缝在内容中间滑动」；
 *  - 翻页要接管滚轮/PageUp/PageDown，否则浏览器只会上下滚一点点。
 *
 * 所有对宿主的写入都走 HostAdapter 快照，退出/关闭开关时原样还原。
 */
DSHC.paged = (() => {
  'use strict';

  const GAP = 40;
  const RAIL = 44;
  const MIN_COL = 220;
  const WHEEL_STEP = 48;
  const COOLDOWN = 240;

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
    let cols = 0;
    let wide = 0;
    let pages = 1;
    let page = 0;

    let wheelBound = null;
    let keyBound = null;
    let acc = 0;
    let lastTurnAt = 0;

    /* ------------------------------------------------------------- 布局 */

    function applyShell() {
      const rect = adapter.measure(scroller);
      if (!rect) return false;
      H = Math.floor(rect.height);
      if (H < 140) return false;

      const avail = Math.floor(adapter.availableWidth(column, scroller) - RAIL);
      colW = Math.floor(math.columnWidth(avail, cols, GAP));
      if (colW < MIN_COL) return false;
      wide = cols * colW + (cols - 1) * GAP;

      adapter.setStyles(column, {
        display: 'block',
        'column-count': String(cols),
        // auto：填满一列再去下一列，页才是整齐的 N 列
        'column-fill': 'auto',
        'column-gap': GAP + 'px',
        'column-width': 'auto',
        height: H + 'px',
        width: wide + 'px',
        'max-width': 'none',
        margin: '0',
        padding: '0',
        'box-sizing': 'border-box',
        overflow: 'visible',
        'transform-origin': '0 0',
        'will-change': 'transform',
        transition: 'transform 0.22s cubic-bezier(0.2, 0.7, 0.2, 1)',
        [adapter.HOST.contentWidth]: '100%'
      });
      adapter.setAttr(column, 'data-dshc-paged', '');

      host = adapter.layoutParent(column, scroller) || column.parentElement;
      if (host) {
        adapter.setAttr(host, 'data-dshc-paged-host', '');
        adapter.setStyles(host, {
          position: 'relative',
          overflow: 'hidden',
          height: H + 'px',
          'padding-top': '0px',
          'padding-bottom': '0px'
        });
      }

      // 翻页由插件接管，宿主自己的滚动就不需要了
      adapter.setStyles(scroller, { 'overflow-anchor': 'none', overflow: 'hidden' });
      return true;
    }

    /**
     * 估算页数：临时按单列 + auto 高度量一次内容总高，再按 H 折算。
     * 量完立刻还原多列样式，浏览器只会绘制最终状态。
     */
    function measurePages() {
      if (!column) return 1;
      const saved = {
        count: column.style.getPropertyValue('column-count'),
        height: column.style.getPropertyValue('height'),
        width: column.style.getPropertyValue('width'),
        fill: column.style.getPropertyValue('column-fill')
      };
      column.style.setProperty('column-count', '1');
      column.style.setProperty('column-fill', 'auto');
      column.style.setProperty('height', 'auto');
      column.style.setProperty('width', '100%');
      const total = column.getBoundingClientRect().height;
      column.style.setProperty('column-count', saved.count);
      column.style.setProperty('column-fill', saved.fill);
      column.style.setProperty('height', saved.height);
      column.style.setProperty('width', saved.width);

      const columnCount = Math.max(1, Math.ceil(total / Math.max(1, H)));
      pages = Math.max(1, Math.ceil(columnCount / Math.max(1, cols)));
      return pages;
    }

    function clampPage(value) {
      return Math.max(0, Math.min(pages - 1, value));
    }

    function paint() {
      if (!column) return;
      const x = -(page * cols * (colW + GAP));
      adapter.setStyle(column, 'transform', 'translate3d(' + x + 'px,0,0)');
    }

    function goTo(next) {
      const target = clampPage(next);
      if (target === page) return;
      page = target;
      paint();
      onChange();
    }

    function turn(delta) {
      const now = Date.now();
      if (now - lastTurnAt < COOLDOWN) return;
      if ((delta > 0 && page >= pages - 1) || (delta < 0 && page <= 0)) return;
      lastTurnAt = now;
      goTo(page + delta);
    }

    /* ------------------------------------------------------------- 输入 */

    /** 事件目标在「自己会滚」的区域里（输入框、代码块横向滚动等）时，不抢它的滚动。 */
    function ownsScroll(event) {
      let node = event && event.target;
      while (node && node !== scroller) {
        if (node.nodeType === 1) {
          const cs = getComputedStyle(node);
          const scrollable = cs.overflowY === 'auto' || cs.overflowY === 'scroll';
          if (scrollable && node.scrollHeight > node.clientHeight + 1) return true;
          if (node.matches && node.matches(adapter.HOST.composer)) return true;
        }
        node = node.parentElement;
      }
      return false;
    }

    function onWheel(event) {
      if (!active) return;
      if (ownsScroll(event)) return;
      const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!delta) return;
      if (typeof event.preventDefault === 'function') event.preventDefault();
      acc += event.deltaMode === 1 ? delta * 16 : delta;
      if (Math.abs(acc) < WHEEL_STEP) return;
      turn(acc > 0 ? 1 : -1);
      acc = 0;
    }

    function isTyping(event) {
      const el = event && event.target;
      if (!el || !el.tagName) return false;
      const tag = el.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || el.isContentEditable === true;
    }

    function onKeyDown(event) {
      if (!active || isTyping(event)) return;
      const key = event.key;
      let delta = 0;
      if (key === 'PageDown') delta = 1;
      else if (key === 'PageUp') delta = -1;
      else if (key === 'ArrowDown' && event.altKey) delta = 1;
      else if (key === 'ArrowUp' && event.altKey) delta = -1;
      else if (key === 'Home') {
        if (page > 0) {
          if (typeof event.preventDefault === 'function') event.preventDefault();
          goTo(0);
        }
        return;
      } else if (key === 'End') {
        if (page < pages - 1) {
          if (typeof event.preventDefault === 'function') event.preventDefault();
          goTo(pages - 1);
        }
        return;
      } else return;
      if (typeof event.preventDefault === 'function') event.preventDefault();
      page = clampPage(page + delta);
      paint();
    }

    function bind() {
      unbind();
      scroller.addEventListener('wheel', onWheel, { passive: false });
      wheelBound = scroller;
      document.addEventListener('keydown', onKeyDown, true);
      keyBound = true;
    }

    function unbind() {
      if (wheelBound) {
        wheelBound.removeEventListener('wheel', onWheel);
        wheelBound = null;
      }
      if (keyBound) {
        document.removeEventListener('keydown', onKeyDown, true);
      }
      keyBound = false;
      acc = 0;
    }

    /* ------------------------------------------------------------- 应用 */

    function apply(target, count) {
      column = target && target.column ? target.column : null;
      scroller = target && target.scroller ? target.scroller : null;
      cols = Math.max(1, Math.min(3, Number(count) || 1));
      if (!column || !scroller || cols < 2) {
        restore();
        return false;
      }

      try {
        if (!applyShell()) {
          restore();
          return false;
        }
        measurePages();
        page = 0;
        paint();
        active = true;
        bind();
        return true;
      } catch (error) {
        console.error('[dsh-chat-columns] 翻页式无缝初始化失败，已退回原生', error);
        restore();
        return false;
      }
    }

    /** 内容变化后重算页数（流式/加载更早）。 */
    function update() {
      if (!active) return;
      const current = page;
      measurePages();
      page = clampPage(current);
      paint();
      onChange();
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
      pages = 1;
      page = 0;
    }

    function diagnose() {
      return { active, H, cols, columnWidth: colW, pages, page, width: wide };
    }

    return {
      apply,
      update,
      restore,
      diagnose,
      goTo,
      next: () => turn(1),
      prev: () => turn(-1),
      isActive: () => active
    };
  }

  return { create };
})();
