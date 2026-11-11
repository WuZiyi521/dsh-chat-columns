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
