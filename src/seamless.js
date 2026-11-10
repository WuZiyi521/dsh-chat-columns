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
    /** 实验：把消息拆到段落级（display:contents 让块级子元素直接参与列排版） */
    let blockMode = false;
    let expanded = new Map();

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

    /* ---------------------------------------------------- 按块拆分（实验） */

    function px(value) {
      const n = parseFloat(value);
      return Number.isFinite(n) ? n : 0;
    }

    /** 没有可见盒子（padding/border/背景/阴影/左右 margin 都为 0）的容器才允许被摊平。 */
    function isBoxless(el) {
      const cs = getComputedStyle(el);
      if (px(cs.paddingTop) || px(cs.paddingBottom) || px(cs.paddingLeft) || px(cs.paddingRight)) return false;
      if (px(cs.borderTopWidth) || px(cs.borderBottomWidth) || px(cs.borderLeftWidth) || px(cs.borderRightWidth)) return false;
      if (px(cs.marginLeft) || px(cs.marginRight)) return false;
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return false;
      const bg = cs.backgroundColor || '';
      if (bg && bg !== 'transparent' && !/rgba\([^)]*,\s*0\s*\)/.test(bg)) return false;
      if (cs.boxShadow && cs.boxShadow !== 'none' && cs.boxShadow !== '') return false;
      return true;
    }

    /** 在一条消息里找「块最多、且自身没有可见盒子」的容器（Markdown 正文容器）。 */
    function pickBlockContainer(itemEl) {
      let best = null;
      const walk = (el, depth) => {
        if (depth > 5) return;
        const kids = Array.from(el.children);
        if (kids.length > 1 && isBoxless(el) && (!best || kids.length > best.score)) {
          best = { el, score: kids.length };
        }
        for (const kid of kids) walk(kid, depth + 1);
      };
      walk(itemEl, 0);
      return best ? best.el : null;
    }

    /** node 的直接子元素里，包含 target 的那个。 */
    function childTowards(node, target) {
      let cursor = target;
      while (cursor && cursor.parentElement !== node) cursor = cursor.parentElement;
      return cursor && cursor.parentElement === node ? cursor : null;
    }

    /**
     * 把一条消息摊平成块级单元：
     *  - 从消息行到正文容器的每一层设成 display:contents（不搬家、不克隆）；
     *  - 这些层里**所有**不在链上的子元素都是单元（文档顺序）——漏掉任何一个，
     *    它就会留在普通流里和绝对定位的单元重叠（3.3.0 的「文本重叠」就是这个原因）；
     *  - 只摊平没有可见盒子的容器，带气泡的消息自动回退成整条。
     * @returns {{units: HTMLElement[], chain: HTMLElement[]}|null}
     */
    function expandItem(itemEl) {
      const cached = expanded.get(itemEl);
      if (cached && cached.units.every((el) => el.isConnected)) return cached;

      const container = pickBlockContainer(itemEl);
      if (!container) return null;

      const chain = [];
      let node = itemEl;
      let guard = 0;
      while (node && node !== container && guard < 8) {
        chain.push(node);
        node = childTowards(node, container);
        guard += 1;
      }
      if (node !== container) return null;
      chain.push(container);

      for (const el of chain) {
        adapter.setStyle(el, 'display', 'contents');
        adapter.setStyle(el, 'margin', '0');
      }

      // 链上每一层「不在链上的孩子」都是单元，按文档顺序收集
      const onChain = new Set(chain);
      const units = [];
      const collect = (parent) => {
        for (const child of Array.from(parent.children)) {
          if (onChain.has(child)) collect(child);
          else units.push(child);
        }
      };
      collect(itemEl);

      if (!units.length) return null;
      const entry = { units, chain };
      expanded.set(itemEl, entry);
      return entry;
    }

    function collapseAll() {
      for (const entry of expanded.values()) {
        for (const el of entry.units) adapter.resetEl(el);
        for (const el of entry.chain) adapter.resetEl(el);
      }
      expanded = new Map();
    }

    /** 从 indexer 的结果同步记录表（新增/删除/脏消息）。 */
    function syncItems(items, dirty) {
      const previous = new Map();
      for (const rec of records) previous.set(rec.el, rec);
      const next = [];

      // 被摊平的祖先层由 expanded 管理，不能在「消失的单元」里被还原
      const pinned = new Set();
      if (blockMode) {
        for (const entry of expanded.values()) for (const el of entry.chain) pinned.add(el);
      }

      function ensureUnit(el, id) {
        let rec = previous.get(el);
        if (rec) {
          previous.delete(el);
          if (dirty && dirty.has(id)) {
            adapter.setStyle(rec.el, 'max-height', '');
            measureRecord(rec);
          }
          return rec;
        }
        const gap = gapOf(el);
        rec = { el, id, gap, height: 0, start: 0, tall: false, cache: '' };
        styleItem(el);
        measureRecord(rec);
        return rec;
      }

      for (const item of items) {
        const entry = blockMode ? expandItem(item.el) : null;
        if (!entry) {
          next.push(ensureUnit(item.el, item.id));
          continue;
        }
        for (const el of entry.units) next.push(ensureUnit(el, item.id));
      }

      for (const [el, rec] of previous) {
        if (pinned.has(el)) continue;
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

    function apply(target, count, items, options) {
      column = target && target.column ? target.column : null;
      scroller = target && target.scroller ? target.scroller : null;
      blockMode = !!(options && options.blockUnit);
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
      collapseAll();
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
        blockUnit: blockMode,
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
