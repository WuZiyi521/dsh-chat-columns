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
