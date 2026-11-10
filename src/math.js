/**
 * 纯计算层：列数、B 无缝的「按列高打包」与「逻辑位置 → 屏幕位置」投影。
 *
 * 这一层不接触 DOM，可以脱离浏览器直接跑（scripts/test.mjs 会 import 它），
 * 所有与 DSH 无关的临界条件（列宽下限、四舍五入、超高消息）都在这里定死。
 */
DSHC.math = (() => {
  'use strict';

  /** 列间距（与 layout.css 的 column-gap 保持一致）。 */
  const GAP = 40;
  /** 自动列宽的列宽下限。 */
  const AUTO_MIN = 420;
  /** 手动指定列数时的列宽硬下限。 */
  const MANUAL_MIN = 260;
  /** 列数上限。 */
  const MAX_COLUMNS = 3;

  /**
   * 给定可用宽度，最多能放下多少列。
   * 分母必须加上 gap：只算 W / min 会把列宽压到 min 以下。
   */
  function fit(width, minWidth, gap) {
    const w = Math.max(0, Number(width) || 0);
    const min = Math.max(1, Number(minWidth) || 1);
    const g = Math.max(0, gap === undefined ? GAP : Number(gap) || 0);
    return Math.max(1, Math.min(MAX_COLUMNS, Math.floor((w + g) / (min + g))));
  }

  /**
   * 解析最终列数。
   * @param {number} width 可用宽度（CSS px）
   * @param {string|number} setting 'auto' | 1 | 2 | 3
   * @param {boolean} mobile 窄屏强制单列
   */
  function resolveColumns(width, setting, mobile) {
    if (mobile) return 1;
    const value = String(setting);
    if (value === '1') return 1;
    if (value === 'auto') return fit(width, AUTO_MIN, GAP);
    const want = Math.max(1, Math.min(MAX_COLUMNS, parseInt(value, 10) || 1));
    // 手动列数也受硬下限约束：宁可少一列，也不把列压到 260px 以下。
    return Math.min(want, fit(width, MANUAL_MIN, GAP));
  }

  /** 等分列宽（不取整，供测量使用）。 */
  function columnWidth(width, columns, gap) {
    const n = Math.max(1, Number(columns) || 1);
    const g = Math.max(0, gap === undefined ? GAP : Number(gap) || 0);
    return Math.max(0, (Math.max(0, Number(width) || 0) - (n - 1) * g) / n);
  }

  /**
   * B 无缝：把消息按「整列高度 H」打包成页。
   *
   * 规则：
   *  - 一条消息绝不跨列（跨列等于把内容藏到看不见的地方），放不下就另起一列；
   *  - 单条高度超过 H 的消息按 H 计（列内自我滚动），独占自己的列段；
   *  - 每列的纵向坐标是「列序号 × H + 列内偏移」，因此逻辑总高 = 页数 × H。
   *
   * @param {Array<{height: number, gap?: number}>} blocks 按 DOM 顺序的消息高度
   * @param {number} height 列高 H（阅读视口高度）
   * @param {number} gap 默认行间距
   * @returns {{starts: number[], pages: number, total: number, tall: boolean[], heights: number[]}}
   *   starts[i] = 第 i 条消息的「内容起点」逻辑坐标；pages = 页数；total = 逻辑总高
   */
  function pack(blocks, height, gap) {
    const H = Math.max(1, Number(height) || 1);
    const g0 = Math.max(0, gap === undefined ? 0 : Number(gap) || 0);
    const starts = [];
    const tall = [];
    const heights = [];
    let page = 0;
    let used = 0;

    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i] || {};
      const raw = Math.max(0, Number(block.height) || 0);
      // 超高消息：列内只显示一屏，内容由该消息自己的滚动承载，避免与相邻消息重叠。
      const h = Math.min(raw, H);
      const g = i === 0 ? 0 : Math.max(0, block.gap === undefined ? g0 : Number(block.gap) || 0);
      const lead = used === 0 ? 0 : g;
      if (used > 0 && used + lead + h > H + 0.5) {
        page += 1;
        used = 0;
      }
      const lead2 = used === 0 ? 0 : g;
      starts.push(page * H + used + lead2);
      tall.push(raw > H + 0.5);
      heights.push(h);
      used += lead2 + h;
      if (used > H) used = H;
    }

    return {
      starts,
      tall,
      heights,
      pages: page + 1,
      total: (page + 1) * H
    };
  }

  /**
   * B 的屏幕投影：逻辑位置 y 在滚动量 s 下落在第几列、列内多高。
   * 第 c 列显示逻辑区间 [s + cH, s + (c+1)H)。
   */
  function project(y, scroll, height) {
    const H = Math.max(1, Number(height) || 1);
    const r = (Number(y) || 0) - (Number(scroll) || 0);
    const column = Math.floor(r / H);
    return { column, top: r - column * H };
  }

  /**
   * 报纸模式的排版计划：理想列高、可跨列的消息、需要限高的消息。
   *
   * 均衡分栏的列高 = 各列内容高的最大值。两件事会把列底撑出空白：
   *  1. 一条消息整块放不进当前列 → 这一列底部留一截（低风险，可以靠「纯文字消息允许跨列」填上）；
   *  2. 一条比一列还高的消息（长代码块）→ 所有列一起被顶到它那么高，其它列整屏空白。
   * 所以：不含代码块/表格/媒体的长消息允许跨列；比 ideal×minRatio 还高的消息单独限高。
   *
   * @param {number[]} heights 每条消息的自然高度
   * @param {number[]} gaps 每条消息上方的间距
   * @param {number} columns 列数
   * @param {boolean[]} [splittable] 这条消息是否允许跨列（含代码块/表格/媒体的不算）
   * @param {{splitRatio?: number, splitFloor?: number, capRatio?: number, capTarget?: number, capFloor?: number}} [options]
   * @returns {{ideal: number, splitLimit: number, cap: number, markLong: boolean[], candidates: number[]}}
   */
  function columnPlan(heights, gaps, columns, splittable, options) {
    const N = Math.max(1, Number(columns) || 1);
    const opts = options || {};
    const splitRatio = opts.splitRatio === undefined ? 0.5 : opts.splitRatio;
    const splitFloor = opts.splitFloor === undefined ? 320 : opts.splitFloor;
    const capRatio = opts.capRatio === undefined ? 1.35 : opts.capRatio;
    const capTarget = opts.capTarget === undefined ? 0.95 : opts.capTarget;
    const capFloor = opts.capFloor === undefined ? 240 : opts.capFloor;

    let total = 0;
    for (let i = 0; i < heights.length; i += 1) {
      total += Math.max(0, Number(heights[i]) || 0) + Math.max(0, Number(gaps && gaps[i]) || 0);
    }
    const ideal = Math.max(1, total / N);
    const splitLimit = Math.max(splitFloor, ideal * splitRatio);
    const cap = Math.max(capFloor, Math.round(ideal * capTarget));

    const markLong = [];
    const candidates = [];
    for (let i = 0; i < heights.length; i += 1) {
      const h = Number(heights[i]) || 0;
      const canSplit = !splittable || splittable[i] !== false;
      markLong.push(canSplit && h > splitLimit);
      if (h > ideal * capRatio) candidates.push(i);
    }
    candidates.sort((a, b) => (Number(heights[b]) || 0) - (Number(heights[a]) || 0));

    return { ideal, splitLimit, cap, markLong, candidates };
  }

  /** 数值取整到 0.01，避免 transform 里的长小数。 */
  function round(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  return {
    GAP,
    AUTO_MIN,
    MANUAL_MIN,
    MAX_COLUMNS,
    fit,
    resolveColumns,
    columnWidth,
    columnPlan,
    pack,
    project,
    round
  };
})();
