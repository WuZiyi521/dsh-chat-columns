/**
 * HostAdapter — 唯一允许知道 DSH 宿主 DOM 的模块。
 *
 * 职责：
 *  - 识别主会话：滚动容器、主消息列、消息行、历史按钮、输入区、主题；
 *  - 读取几何信息（阅读视口高度、可用宽度）；
 *  - 样式快照：给宿主元素写内联样式/属性时先备份，退出时 100% 还原；
 *  - C 复制模式的只读节点净化。
 *
 * 约束：
 *  - 不持有业务状态、不做布局决策、不监听业务事件；
 *  - 所有宿主选择器/属性名字面量只允许出现在本文件（scripts/check.mjs 会检查）。
 */
DSHC.adapter = (() => {
  'use strict';

  /** 宿主契约（0.2.1-alpha.2 静态审计确认）。 */
  const HOST = {
    /** 会话滚动容器：真正产生滚动条的那一层。 */
    scroller: '[data-conversation-scroll]',
    /** 会话身份：挂在滚动容器的祖先上。 */
    session: '[data-conversation-session]',
    /** 会话正文列：宿主的 display:flex + max-width 就写在这一层。 */
    column: '[data-chat-flow]',
    /** 消息行。 */
    item: '[data-chat-flow-key]',
    itemKey: 'data-chat-flow-key',
    groupKey: 'data-chat-group-key',
    anchorKey: 'data-chat-anchor-key',
    /** 输入区座位。 */
    composer: '[data-composer-seat]',
    /** 正在跟随最新消息（宿主自己维护）。 */
    followingTail: '[data-chat-following-tail]',
    /** 宿主主题信号。 */
    themeDark: 'data-ds-dark-theme',
    themeSource: 'data-ds-theme-source',
    /** 用户可调正文宽度变量（宿主写在会话 body 上）。 */
    contentWidth: '--dsh-chat-content-width',
    /** C 模式克隆时必须剥掉的身份属性，避免宿主/插件再次把它们当成真实消息。 */
    stripped: [
      'id',
      'for',
      'name',
      'form',
      'autofocus',
      'contenteditable',
      'tabindex',
      'data-slot',
      'data-chat-flow',
      'data-chat-flow-key',
      'data-chat-flow-kind',
      'data-chat-group-key',
      'data-chat-group-part',
      'data-chat-anchor-key',
      'data-chat-node-key',
      'data-chat-turn',
      'data-chat-paging-anchor',
      'data-chat-motion',
      'data-chat-following-tail',
      'data-chat-turn-spacer',
      'data-chat-running',
      'data-conversation-scroll',
      'data-conversation-content',
      'data-conversation-session',
      'data-conversation-region',
      'data-composer-seat',
      'aria-expanded',
      'aria-controls',
      'aria-pressed',
      'onclick',
      'onmousedown',
      'onmouseup',
      'onkeydown',
      'onkeyup',
      'oninput',
      'onchange',
      'onsubmit',
      'onfocus',
      'onblur'
    ]
  };

  /** 插件写在宿主/自身节点上的标记（全部可逆）。 */
  const MARK = {
    instance: 'data-dshc-instance',
    item: 'data-dshc-item',
    long: 'data-dshc-long',
    host: 'data-dshc-host',
    hide: 'data-dshc-hide',
    cloneId: 'data-dshc-clone'
  };

  /** 快照表：元素 → { styles: Map<prop, 原值>, attrs: Set<原名> }。 */
  const snapshots = new Map();

  function isConnected(el) {
    return !!(el && el.isConnected);
  }

  /**
   * 只要还在布局里就算「在场」——**不要求 visibility 可见**。
   * 复制模式会把宿主正文列设为 visibility:hidden（它仍有布局和数据），
   * 如果这里也排除掉，每次点击都会重新识别目标、把镜像视图整个重建一遍。
   */
  function isAttached(el) {
    if (!isConnected(el)) return false;
    return getComputedStyle(el).display !== 'none';
  }

  /** 真正能被看到的元素（用于挑选滚动容器候选）。 */
  function isVisible(el) {
    if (!isConnected(el)) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  /* ------------------------------------------------------------ 样式快照 */

  function entry(el) {
    let item = snapshots.get(el);
    if (!item) {
      item = { styles: new Map(), attrs: new Set() };
      snapshots.set(el, item);
    }
    return item;
  }

  /** 写内联样式并记住原值（同一次生命周期内可反复改）。 */
  function setStyle(el, prop, value) {
    if (!el) return;
    const item = entry(el);
    if (!item.styles.has(prop)) item.styles.set(prop, el.style.getPropertyValue(prop));
    if (value === null || value === undefined || value === '') el.style.removeProperty(prop);
    else el.style.setProperty(prop, String(value));
  }

  function setStyles(el, bag) {
    for (const prop of Object.keys(bag)) setStyle(el, prop, bag[prop]);
  }

  /** 写属性并记住原值；只有 null/undefined 表示「删除」，空字符串是合法属性值（标记属性就靠它）。 */
  function setAttr(el, name, value) {
    if (!el) return;
    const item = entry(el);
    if (!item.attrs.has(name)) item.attrs.add(name);
    if (value === null || value === undefined) el.removeAttribute(name);
    else el.setAttribute(name, String(value));
  }

  /** 还原单个元素；幂等。 */
  function resetEl(el) {
    if (!el) return;
    const item = snapshots.get(el);
    if (!item) return;
    for (const [prop, value] of item.styles) {
      if (value) el.style.setProperty(prop, value);
      else el.style.removeProperty(prop);
    }
    for (const name of item.attrs) el.removeAttribute(name);
    if (el.getAttribute('style') === '') el.removeAttribute('style');
    snapshots.delete(el);
  }

  /** 还原本插件改过的一切；宿主节点被 React 卸载时直接跳过。 */
  function resetAll() {
    for (const el of Array.from(snapshots.keys())) {
      if (el && el.isConnected) resetEl(el);
      else snapshots.delete(el);
    }
    snapshots.clear();
  }

  /* -------------------------------------------------------------- 目标识别 */

  function scrollers() {
    return Array.from(document.querySelectorAll(HOST.scroller));
  }

  /** 最近的一层「有盒子的」祖先（display:contents 的插槽层不算）。 */
  function layoutParent(el, stop) {
    let node = el ? el.parentElement : null;
    while (node && node !== stop) {
      if (getComputedStyle(node).display !== 'contents') return node;
      node = node.parentElement;
    }
    return null;
  }

  /** 列内最外层的 flow（分组卡片里还有嵌套的 data-chat-flow）。 */
  function isNestedFlow(el, root) {
    let node = el.parentElement;
    while (node && node !== root) {
      if (node.matches(HOST.column)) return true;
      node = node.parentElement;
    }
    return false;
  }

  function itemId(el) {
    if (!el) return '';
    const flow = el.getAttribute(HOST.itemKey);
    if (flow) return flow;
    const group = el.getAttribute(HOST.groupKey);
    if (group) return 'group:' + group;
    const anchor = el.getAttribute(HOST.anchorKey);
    if (anchor) return 'anchor:' + anchor;
    return '';
  }

  function itemKind(el) {
    return (el && el.getAttribute('data-chat-flow-kind')) || '';
  }

  function itemOf(node, column) {
    let el = node && node.nodeType === 1 ? node : node && node.parentElement;
    while (el && el !== column) {
      if (el.matches(HOST.item)) return el;
      el = el.parentElement;
    }
    return null;
  }

  function isInsideItem(el, column) {
    if (!el) return false;
    if (el.matches(HOST.item)) return true;
    return itemOf(el, column) !== null;
  }

  /**
   * 空的/占位的消息行。
   * 只做廉价判断（不读 getComputedStyle）：流式输出时每 120ms 会对所有消息调一次，
   * 逐条读计算样式在长会话里是实打实的开销。宿主隐藏行用的是 hidden 属性，够用。
   */
  function isBlank(el) {
    if (!el) return true;
    if (el.hidden || el.hasAttribute('hidden')) return true;
    if (el.childElementCount === 0 && (el.textContent || '').trim() === '') return true;
    return false;
  }

  /**
   * 顶层消息行（不返回嵌在其它消息里的行）。
   * @returns {Array<{el: HTMLElement, id: string, kind: string}>}
   */
  function getItems(column) {
    if (!column) return [];
    const out = [];
    const seen = new Set();
    for (const el of column.querySelectorAll(HOST.item)) {
      if (isNestedFlow(el, column) || isInsideItem(el.parentElement, column)) continue;
      if (!isConnected(el) || isBlank(el)) continue;
      const id = itemId(el);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push({ el, id, kind: itemKind(el) });
    }
    return out;
  }

  /** 主列：滚动容器里最外层、行数最多的 data-chat-flow。 */
  function mainColumnOf(scroller) {
    if (!scroller) return null;
    let best = null;
    for (const el of scroller.querySelectorAll(HOST.column)) {
      if (isNestedFlow(el, scroller)) continue;
      if (!isAttached(el)) continue;
      const rows = el.querySelectorAll(HOST.item).length;
      const r = el.getBoundingClientRect();
      const area = Math.max(1, r.width) * Math.max(1, r.height);
      const score = rows;
      if (
        best === null ||
        score > best.score ||
        (score === best.score && area > best.area)
      ) {
        best = { el, rows, area, score };
      }
    }
    return best === null ? null : { column: best.el, rows: best.rows, area: best.area };
  }

  /**
   * 识别主会话。优先「消息行最多」的滚动容器，平手看可见面积；
   * 前两名行数相同、面积接近时判为 ambiguous，由上层降级为原生。
   * @returns {{scroller: HTMLElement|null, column: HTMLElement|null, reason: string, rows: number}}
   */
  function resolve() {
    const candidates = [];
    for (const scroller of scrollers()) {
      if (!isVisible(scroller)) continue;
      const main = mainColumnOf(scroller);
      if (!main || main.rows === 0) continue;
      const r = scroller.getBoundingClientRect();
      candidates.push({
        scroller,
        column: main.column,
        rows: main.rows,
        area: Math.max(1, r.width) * Math.max(1, r.height)
      });
    }

    if (candidates.length === 0) {
      return { scroller: null, column: null, reason: 'no-conversation', rows: 0 };
    }

    candidates.sort((a, b) => (b.rows - a.rows) || (b.area - a.area));
    const first = candidates[0];
    const second = candidates[1];
    // 两个容器行数一样、面积也接近：分不清主次，不猜。
    if (
      second &&
      second.rows === first.rows &&
      second.area > first.area * 0.85
    ) {
      return { scroller: first.scroller, column: first.column, reason: 'ambiguous', rows: first.rows };
    }
    return { scroller: first.scroller, column: first.column, reason: 'ok', rows: first.rows };
  }

  /** 宿主的「加载更早」按钮：在主列里、不在任何消息行内、外层只是按钮的包装。 */
  function findOlderButton(column) {
    if (!column) return null;
    for (const btn of column.querySelectorAll('button')) {
      if (!isConnected(btn)) continue;
      if (isInsideItem(btn, column)) continue;
      const wrap = btn.parentElement;
      if (!wrap || !column.contains(wrap)) continue;
      if ((wrap.textContent || '').trim() !== (btn.textContent || '').trim()) continue;
      return btn;
    }
    return null;
  }

  function olderWrapper(btn) {
    if (!btn) return null;
    const wrap = btn.parentElement;
    return wrap && wrap.parentElement ? wrap : null;
  }

  function findComposer(scroller) {
    if (!scroller) return null;
    return scroller.querySelector(HOST.composer);
  }

  function followingTail(scroller) {
    return !!(scroller && scroller.querySelector(HOST.followingTail));
  }

  function sessionKey(scroller) {
    if (!scroller) return '';
    const holder = scroller.closest(HOST.session);
    return holder ? holder.getAttribute('data-conversation-session') || '' : '';
  }

  /* ---------------------------------------------------------------- 几何 */

  function readScrollbarWidth() {
    const raw = getComputedStyle(document.body).getPropertyValue('--dsh-scrollbar-width');
    const value = parseFloat(raw);
    return Number.isFinite(value) && value > 0 ? value : 5;
  }

  /**
   * 阅读视口：滚动容器的可见区域，扣掉底部输入区。
   * @returns {{top:number,bottom:number,left:number,right:number,width:number,height:number,composerHeight:number,scrollbarWidth:number}}
   */
  function measure(scroller) {
    if (!scroller) return null;
    const r = scroller.getBoundingClientRect();
    const composer = findComposer(scroller);
    let bottom = r.bottom;
    let composerHeight = 0;
    if (composer) {
      const cr = composer.getBoundingClientRect();
      if (cr.height > 0) composerHeight = cr.height;
      if (cr.height > 0 && cr.top > r.top + 80 && cr.top < r.bottom) bottom = cr.top;
    }
    if (!(bottom > r.top + 120)) bottom = r.bottom;
    return {
      top: r.top,
      bottom,
      left: r.left,
      right: r.right,
      width: r.width,
      height: Math.max(0, bottom - r.top),
      composerHeight,
      scrollbarWidth: readScrollbarWidth()
    };
  }

  /** 正文列真实可用的宽度：跳过 display:contents 的插槽层，扣掉左右 padding。 */
  function availableWidth(column, scroller) {
    let node = layoutParent(column, scroller);
    while (node) {
      const cs = getComputedStyle(node);
      if (node.clientWidth > 0) {
        const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
        return Math.max(0, node.clientWidth - pad);
      }
      node = layoutParent(node, scroller);
    }
    return Math.max(0, (scroller ? scroller.clientWidth : 0) - 32);
  }

  /* ---------------------------------------------------------------- 主题 */

  function parseRgb(color) {
    const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/i.exec(color || '');
    if (!m) return null;
    const alpha = m[4] === undefined ? 1 : Number(m[4]);
    return [Number(m[1]), Number(m[2]), Number(m[3]), Number.isFinite(alpha) ? alpha : 1];
  }

  /** 宿主属性 → 宿主 color-scheme → 背景亮度 → 系统媒体查询。 */
  function detectTheme() {
    const body = document.body;
    const html = document.documentElement;
    if (!body || !html) return 'light';
    if (body.hasAttribute(HOST.themeDark)) return 'dark';
    const source = html.getAttribute(HOST.themeSource);
    if (source === 'dark' || source === 'light') return source;
    const scheme = (getComputedStyle(html).colorScheme || '').trim();
    if (scheme === 'dark') return 'dark';
    if (scheme === 'light') return 'light';
    const rgb = parseRgb(getComputedStyle(body).backgroundColor);
    if (rgb && rgb[3] > 0.05) {
      const luminance = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
      return luminance < 0.5 ? 'dark' : 'light';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function watchTheme(callback) {
    const mo = new MutationObserver(() => callback());
    if (document.body) {
      mo.observe(document.body, { attributes: true, attributeFilter: [HOST.themeDark] });
    }
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [HOST.themeSource, 'style', 'class']
    });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => callback();
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onChange);
    else if (typeof mq.addListener === 'function') mq.addListener(onChange);
    return function dispose() {
      mo.disconnect();
      if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', onChange);
      else if (typeof mq.removeListener === 'function') mq.removeListener(onChange);
    };
  }

  /* ------------------------------------------------------------ 阅读锚点 */

  /** 视口内最靠上的一条消息（by id + 距视口顶的偏移）。 */
  function captureAnchor(scroller, column) {
    if (!scroller || !column) return null;
    const top = scroller.getBoundingClientRect().top;
    for (const item of getItems(column)) {
      const r = item.el.getBoundingClientRect();
      if (r.bottom <= top + 1) continue;
      if (r.top >= scroller.getBoundingClientRect().bottom) break;
      return { id: item.id, offset: r.top - top };
    }
    return null;
  }

  /** 按锚点把滚动位置拉回去（仅用于 A / 原生，B 由无缝引擎自己换算）。 */
  function restoreAnchor(scroller, column, anchor) {
    if (!scroller || !column || !anchor) return false;
    let target = null;
    for (const item of getItems(column)) {
      if (item.id === anchor.id) {
        target = item.el;
        break;
      }
    }
    if (!target) return false;
    const top = scroller.getBoundingClientRect().top;
    const delta = target.getBoundingClientRect().top - top - anchor.offset;
    if (Math.abs(delta) > 1) {
      const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      scroller.scrollTop = Math.max(0, Math.min(max, scroller.scrollTop + delta));
    }
    return true;
  }

  /* ------------------------------------------------------ C 模式：净化副本 */

  /**
   * 只读快照净化：去掉身份属性、表单能力、内联事件与可执行节点。
   * 保留结构与文本，允许选择文字和打开链接。
   */
  function sanitize(root) {
    if (!root) return root;
    const dropped = [];
    const DROP_TAGS = new Set(['script', 'style', 'link', 'meta', 'iframe', 'object', 'embed', 'template']);

    const visit = (node) => {
      for (const child of Array.from(node.children || [])) {
        const tag = child.tagName ? child.tagName.toLowerCase() : '';
        if (DROP_TAGS.has(tag)) {
          dropped.push(child);
          continue;
        }
        for (const name of HOST.stripped) child.removeAttribute(name);
        if (tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea') {
          child.setAttribute('disabled', '');
          child.setAttribute('tabindex', '-1');
          child.setAttribute('aria-disabled', 'true');
          if (child.classList) child.classList.add('dshc-c-dead');
        }
        if (child.hasAttribute('autofocus')) child.removeAttribute('autofocus');
        if (child.hasAttribute('href')) {
          child.setAttribute('target', '_blank');
          child.setAttribute('rel', 'noopener noreferrer');
        }
        visit(child);
      }
    };

    visit(root);
    for (const el of dropped) {
      if (el.parentNode) el.parentNode.removeChild(el);
    }
    return root;
  }

  /* -------------------------------------------------- 内容适配（A/B 共用） */

  /** 被「内容适配」改过的节点，退出时统一还原。 */
  const contentTouched = new Set();

  /**
   * 把列里的内容调成「可被列缝切开、且不超出列宽」：
   *  - `pre` 是滚动容器（overflow-x:auto），滚动容器不可分片 → 代码块会整块搬家；
   *    放开 overflow 并让长行软换行；
   *  - 代码块/表格外面那层卡片常带 overflow:hidden（圆角裁切），也会阻止分片；
   *  - 宿主有「宽表撑出正文列」的样式（宽度按 100cqw 算），多列里 cqw 取的是滚动容器宽度，
   *    不夹住就会整张表出列 → 强制 table-layout:fixed + 100% 宽。
   * @param {HTMLElement} root 正文列（或任一容器）
   */
  function fitContent(root) {
    if (!root) return;
    const touch = (el, name, value) => {
      setStyle(el, name, value);
      contentTouched.add(el);
    };
    for (const pre of root.querySelectorAll('pre')) {
      touch(pre, 'overflow', 'visible');
      touch(pre, 'overflow-x', 'visible');
      touch(pre, 'overflow-y', 'visible');
      touch(pre, 'white-space', 'pre-wrap');
      touch(pre, 'word-break', 'break-word');
      const card = pre.parentElement;
      if (card && card !== root) {
        touch(card, 'overflow', 'visible');
        touch(card, 'max-height', 'none');
      }
    }
    for (const table of root.querySelectorAll('table')) {
      const wrap = table.parentElement;
      if (wrap && wrap !== root) {
        touch(wrap, 'width', '100%');
        touch(wrap, 'max-width', '100%');
        touch(wrap, 'margin-left', '0');
        touch(wrap, 'padding-left', '0');
        touch(wrap, 'overflow', 'visible');
      }
      touch(table, 'table-layout', 'fixed');
      touch(table, 'width', '100%');
      touch(table, 'max-width', '100%');
    }
  }

  /** 还原所有「内容适配」改动；幂等。 */
  function unfitContent() {
    for (const el of Array.from(contentTouched)) {
      if (el && el.isConnected) resetEl(el);
      contentTouched.delete(el);
    }
  }

  /* ------------------------------------------------------------ 启动兜底 */

  /**
   * 插件先于会话渲染时，等滚动容器出现（一次性观察，最长 60s）。
   * @returns {() => void} 取消
   */
  function watchForScroller(callback) {
    if (scrollers().length > 0 || !document.body) return function stop() {};
    let stopped = false;
    let timer = 0;
    const mo = new MutationObserver(() => {
      if (scrollers().length > 0) {
        stop();
        callback();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    timer = setTimeout(stop, 60000);
    function stop() {
      if (stopped) return;
      stopped = true;
      if (timer) clearTimeout(timer);
      timer = 0;
      mo.disconnect();
    }
    return stop;
  }

  return {
    HOST,
    MARK,
    isConnected,
    isAttached,
    isVisible,
    layoutParent,
    setStyle,
    setStyles,
    setAttr,
    resetEl,
    resetAll,
    getItems,
    itemOf,
    isInsideItem,
    itemId,
    itemKind,
    mainColumnOf,
    resolve,
    findOlderButton,
    olderWrapper,
    findComposer,
    followingTail,
    sessionKey,
    measure,
    availableWidth,
    detectTheme,
    watchTheme,
    captureAnchor,
    restoreAnchor,
    sanitize,
    fitContent,
    unfitContent,
    watchForScroller
  };
})();
