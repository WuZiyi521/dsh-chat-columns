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

      // 2) 纸带：所有列横向排开，交给宿主横向滚动。
      //    注意 display 必须是 block：宿主正文列是 flex，CSS 多列对 flex 容器无效
      //    （漏了这句就会退化成"一列、拉得很长"）。
      adapter.setStyles(column, {
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
      let right = 0;
      for (let i = 0; i < items.length; i += 1) {
        const el = items[i].el;
        if (!el || !el.isConnected) continue;
        const rect = el.getBoundingClientRect();
        if (!(rect.height > 0 || rect.width > 0)) continue;
        right = Math.max(right, rect.right - base);
      }
      if (!(right > 0)) return Math.max(1, totalCols);
      return Math.max(1, Math.ceil((right + GAP) / step));
    }

    function pageWidth() {
      return step * Math.max(1, stepCols);
    }

    /** 纸带能滚到的最大左偏移（最后一屏刚好贴右） */
    function maxLeft() {
      return Math.max(0, (totalCols - Math.max(1, cols)) * step);
    }

    /** 实际能滚到的最右端：算式和宿主实测取大者，避免"差一列"。 */
    function endLeft() {
      return Math.max(maxLeft(), maxScroll());
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
      const keep = page;
      const keepLeft = host ? host.scrollLeft : 0;
      if (!applyShell()) {
        restore();
        return;
      }
      // 重排会改动纸带尺寸，浏览器可能把位置钳掉：非贴边时按原样恢复。
      if (host && !wasEnd && Math.abs(host.scrollLeft - keepLeft) > 1) {
        host.scrollLeft = keepLeft;
        lastWrite = keepLeft;
      }
      // 贴边时跟随最新内容，否则守住当前页；两种情况都不带动画。
      if (wasEnd) snapToEnd(2);
      else goTo(clampPage(keep), { smooth: false });
    }

    function restore() {
      active = false;
      followEnd = true;
      lastWrite = -1;
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
