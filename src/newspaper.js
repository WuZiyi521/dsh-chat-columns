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
     * 放开不可分片的块：
     *  - pre 是滚动容器（overflow-x:auto）→ 浏览器无法在它内部断列，只能整块搬家；
     *  - 外面那层卡片常带 overflow:hidden（圆角裁切），同样是不可分片。
     * 放开之后 `white-space: pre-wrap` 保证长行不会横向溢出。
     */
    function relaxBlocks() {
      if (!column) return;
      for (const pre of column.querySelectorAll('pre')) {
        adapter.setStyle(pre, 'overflow', 'visible');
        adapter.setStyle(pre, 'overflow-x', 'visible');
        adapter.setStyle(pre, 'overflow-y', 'visible');
        adapter.setStyle(pre, 'white-space', 'pre-wrap');
        adapter.setStyle(pre, 'word-break', 'break-word');
        const card = pre.parentElement;
        if (card && card !== column) {
          adapter.setStyle(card, 'overflow', 'visible');
          adapter.setStyle(card, 'max-height', 'none');
        }
      }
      for (const table of column.querySelectorAll('table')) {
        const wrap = table.parentElement;
        if (wrap && wrap !== column) adapter.setStyle(wrap, 'overflow', 'visible');
      }
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

      relaxBlocks();
      applied = true;
      return true;
    }

    /** 结构变化时补一次：流式 / 加载更早之后新出现的代码块也要放开。 */
    function tune() {
      if (!applied) return;
      relaxBlocks();
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
      for (const item of markedItems()) adapter.resetEl(item);
      if (column) {
        // 代码块/表格上放开的 overflow 也要还原
        for (const pre of column.querySelectorAll('pre')) {
          adapter.resetEl(pre);
          if (pre.parentElement && pre.parentElement !== column) adapter.resetEl(pre.parentElement);
        }
        for (const table of column.querySelectorAll('table')) {
          if (table.parentElement && table.parentElement !== column) adapter.resetEl(table.parentElement);
        }
        adapter.resetEl(column);
      }
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
