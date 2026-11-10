/**
 * A｜报纸模式：在宿主原生正文列上做 CSS 均衡分栏。
 *
 * 规则（3.0 任务书）：
 *  - 宿主的列是 display:flex，CSS 多列对 flex 容器无效，先改回 display:block；
 *  - column-fill:balance，列高由内容与列数共同决定；
 *  - 释放 --dsh-chat-content-width 的宽度限制，退出时原样还回去；
 *  - 短消息 break-inside:avoid，超长消息允许跨列（否则最后一列会出现整屏空白）；
 *  - 不接管 scrollTop，滚动/锚点/历史加载都还是宿主自己的。
 */
DSHC.newspaper = (() => {
  'use strict';

  const RAIL = 44; // 右侧 TurnNavigator 轨道 + 安全距
  const LONG_RATIO = 0.55; // 超过列高 55% 的消息视为「超长」，允许跨列

  function create(context) {
    const adapter = DSHC.adapter;
    const math = DSHC.math;
    let applied = false;
    let column = null;
    let columns = 1;
    let tuneRaf = 0;

    function markedItems() {
      return column ? Array.from(column.querySelectorAll('[' + adapter.MARK.item + ']')) : [];
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
        'column-rule': 'none',
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

      applied = true;
      scheduleTune();
      return true;
    }

    /**
     * 超长消息允许跨列：均衡分栏下，一条比列还高的消息若不许拆开，
     * 浏览器只能把列高抬到它那么高，其它列就会大面积空白。
     */
    function tune() {
      tuneRaf = 0;
      if (!applied || !column || !column.isConnected) return;
      const height = column.getBoundingClientRect().height;
      if (!height) return;
      for (const item of markedItems()) {
        const h = item.getBoundingClientRect().height;
        if (h > height * LONG_RATIO) {
          if (!item.hasAttribute(adapter.MARK.long)) adapter.setAttr(item, adapter.MARK.long, '');
        } else if (item.hasAttribute(adapter.MARK.long)) {
          item.removeAttribute(adapter.MARK.long);
        }
      }
    }

    function scheduleTune() {
      if (tuneRaf) cancelAnimationFrame(tuneRaf);
      tuneRaf = requestAnimationFrame(() => {
        tuneRaf = requestAnimationFrame(tune);
      });
    }

    function restore() {
      if (tuneRaf) cancelAnimationFrame(tuneRaf);
      tuneRaf = 0;
      for (const item of markedItems()) adapter.resetEl(item);
      if (column) adapter.resetEl(column);
      applied = false;
    }

    function destroy() {
      restore();
      column = null;
    }

    return {
      apply,
      tune: scheduleTune,
      restore,
      destroy,
      isApplied: () => applied,
      get columns() {
        return columns;
      }
    };
  }

  return { create, RAIL, LONG_RATIO };
})();
