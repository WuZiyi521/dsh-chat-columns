/**
 * A｜报纸模式：在宿主原生正文列上做 CSS 均衡分栏。
 *
 * 规则：
 *  - 宿主的列是 display:flex，CSS 多列对 flex 容器无效，先改回 display:block；
 *  - column-fill:balance，列高由内容与列数共同决定；
 *  - 释放 --dsh-chat-content-width 的宽度限制，退出时原样还回去；
 *  - **任何消息都不跨列**（break-inside:avoid）：CSS 多列一旦把消息切开，
 *    不可分片的代码块会出现「盒子留在第一列、内容画到第二列」的渲染错位；
 *  - 不接管 scrollTop，滚动/锚点/历史加载都还是宿主自己的。
 *
 * 关于「底部留白」（本文件的核心逻辑）：
 *  均衡分栏的列高 = max(各列内容高)，而 break-inside:avoid 把每条消息变成不可拆的整块，
 *  于是一条比列还高的消息会把**所有**列一起顶到它那么高，其它列下面就是大片空白。
 *  所以这里按「理想列高 ideal = 内容总高 / 列数」来判定：
 *    - 消息高于 ideal 的一半 → 允许跨列（切在列缝上，读的时候接着看下一列顶部）；
 *    - 消息高于 ideal 的 2.2 倍 → 浏览器也切不开（典型是自带滚动的代码块），
 *      直接给它一个「一屏多一点」的高度上限并让消息自己滚，禁止它把整页顶开。
 *  判据用的是 ideal 而不是「当前列高」，因为后者会被上一条无法拆分的消息撑大，形成自激。
 */
DSHC.newspaper = (() => {
  'use strict';

  const RAIL = 44; // 右侧 TurnNavigator 轨道 + 安全距
  /** 列高超过理想列高的这个倍数 → 说明有「比一列还高」的消息在顶 */
  const CAP_SLACK = 1.2;
  /** 只有比这个倍数还高的消息才限高：普通消息宁留白，也别给它套内部滚动条 */
  const CAP_MIN_RATIO = 1.35;
  /** 这类消息的高度上限 = 理想列高 × 这个倍数（略小于一列，内容由它自己滚） */
  const CAP_TARGET = 0.95;
  /** 纯文字消息超过理想列高的这个比例就允许跨列，用来把列底留白填平 */
  const SPLIT_RATIO = 0.5;
  const SPLIT_FLOOR = 320;
  /**
   * 这些内容不可分片：含它们的消息整块保留，绝不跨列（另加嵌套 flow，见 isSplittable）。
   * 故意不含 svg：消息里的图标（按钮、状态标记）都是内联 svg，排掉它们等于所有消息都不能跨列。
   */
  const UNSPLITTABLE = 'pre, table, img, video, canvas, iframe';

  function create() {
    const adapter = DSHC.adapter;
    const math = DSHC.math;
    let applied = false;
    let column = null;
    let columns = 1;
    let tuneRaf = 0;
    let tuneTimer = 0;
    let tuneCapped = 0;
    let tuneLong = 0;
    let tuneIdeal = 0;

    /** 不含代码块/表格/媒体的消息才允许跨列（跨列的代价是内容被列缝切开）。 */
    function isSplittable(el) {
      // 嵌套 flow（分组卡片）也不能拆
      return !el.querySelector(UNSPLITTABLE + ', ' + adapter.HOST.column);
    }

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
     * 按「理想列高」给过高的消息限高，把底部留白压到最小。
     * 幂等：每次先量自然高度（撤掉上一次加的上限），再重新判定。
     */
    function tune() {
      tuneRaf = 0;
      if (!applied || !column || !column.isConnected) return;
      const items = markedItems();
      if (!items.length) return;

      // 1) 量自然高度：先撤掉上次给巨型块加的上限，否则量到的是被截断后的高度。
      //    写和读分开做：先全部写完，再一次性读高度，只触发一次布局。
      for (const el of items) {
        adapter.setStyle(el, 'max-height', '');
        adapter.setStyle(el, 'overflow-y', '');
      }
      const heights = [];
      for (const el of items) heights.push(el.getBoundingClientRect().height);
      const gaps = [];
      for (const el of items) gaps.push(parseFloat(getComputedStyle(el).marginTop) || 0);

      const splittable = items.map(isSplittable);
      const plan = math.columnPlan(heights, gaps, columns, splittable, {
        splitRatio: SPLIT_RATIO,
        splitFloor: SPLIT_FLOOR,
        capRatio: CAP_MIN_RATIO,
        capTarget: CAP_TARGET
      });

      // 2) 纯文字的长消息允许跨列：读到列底就接下一列顶部，把列底留白填平。
      let longCount = 0;
      for (let i = 0; i < items.length; i += 1) {
        if (plan.markLong[i]) {
          adapter.setAttr(items[i], adapter.MARK.long, '');
          longCount += 1;
        } else {
          items[i].removeAttribute(adapter.MARK.long);
        }
      }

      // 3) 比「一列」高得多的消息（典型：长代码块，整块不可拆）：
      //    列高会被它顶到它那么高，其它列下面就是整屏空白。
      //    给它一列的高度上限，内容由它自己滚；最多 3 条，避免反复强制布局。
      const capped = new Set();
      let height = column.getBoundingClientRect().height;
      const queue = plan.candidates.slice(0, 3);
      for (const index of queue) {
        if (height <= plan.ideal * CAP_SLACK) break;
        capped.add(index);
        adapter.setStyle(items[index], 'max-height', plan.cap + 'px');
        adapter.setStyle(items[index], 'overflow-y', 'auto');
        height = column.getBoundingClientRect().height;
      }
      tuneCapped = capped.size;
      tuneLong = longCount;
      tuneIdeal = Math.round(plan.ideal);
    }

    /**
     * 安排一次重排。
     * @param {number} delay 毫秒；流式输出时给个小延迟，避免每批 token 都强制同步布局
     */
    function scheduleTune(delay) {
      if (tuneRaf) cancelAnimationFrame(tuneRaf);
      if (tuneTimer) clearTimeout(tuneTimer);
      tuneRaf = 0;
      tuneTimer = setTimeout(() => {
        tuneTimer = 0;
        // 两帧：等浏览器把多列布局算完，再量高度
        tuneRaf = requestAnimationFrame(() => {
          tuneRaf = requestAnimationFrame(tune);
        });
      }, Math.max(0, Number(delay) || 0));
    }

    /** 诊断：列数、列高、理想列高、每列内容底、最大留白。 */
    function diagnose() {
      if (!applied || !column || !column.isConnected) return { applied: false };
      const rect = column.getBoundingClientRect();
      const items = markedItems();
      const ends = new Map();
      let total = 0;
      for (const el of items) {
        const r = el.getBoundingClientRect();
        const left = Math.round(r.left - rect.left);
        const bottom = Math.round(r.bottom - rect.top);
        ends.set(left, Math.max(ends.get(left) || 0, bottom));
        total += r.height;
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
        ideal: tuneIdeal,
        long: tuneLong,
        capped: tuneCapped,
        columnsEnd: columnsInfo,
        // 最大一列留白：列高 - 最矮那列的底
        blank: Math.max(0, height - lowest)
      };
    }

    function restore() {
      if (tuneRaf) cancelAnimationFrame(tuneRaf);
      tuneRaf = 0;
      if (tuneTimer) clearTimeout(tuneTimer);
      tuneTimer = 0;
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
      diagnose,
      restore,
      destroy,
      isApplied: () => applied,
      get columns() {
        return columns;
      }
    };
  }

  return { create, RAIL, CAP_SLACK, CAP_MIN_RATIO, CAP_TARGET, SPLIT_RATIO, SPLIT_FLOOR, UNSPLITTABLE };
})();
