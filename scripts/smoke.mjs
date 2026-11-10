#!/usr/bin/env node
/**
 * 挂载与三种模式「应用路径」的烟测。
 *
 * 用**最小 DOM 桩 + 契约夹具**：夹具里只有插件真正依赖的那几个数据属性
 * （滚动容器 / 正文列 / 消息行 / 输入区 / 加载更早按钮），几何数字是编的。
 * 因此这里断言的不是"布局好不好看"，而是：
 *   1. apply(ctx) → mount 不抛异常；
 *   2. 三种模式的应用 / 切换路径没有 ReferenceError / TypeError；
 *   3. 该打的标记都打了，切换与 unmount 之后又全部还回去；
 *   4. 没有遗留定时器。
 *
 * 真实布局效果必须由维护方在真实 DSHWeb 上验证（见 README 的验收清单）。
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const bundle = await readFile(join(root, 'lib', 'client.js'), 'utf8');

/* ------------------------------------------------------------- 最小 DOM */

class StyleDecl {
  constructor() {
    this.map = new Map();
  }
  setProperty(name, value) {
    this.map.set(String(name), String(value));
  }
  getPropertyValue(name) {
    return this.map.has(name) ? this.map.get(name) : '';
  }
  removeProperty(name) {
    this.map.delete(name);
  }
}

class El {
  constructor(tag, ns) {
    this.nodeType = 1;
    this.tagName = String(tag).toUpperCase();
    this.namespaceURI = ns || null;
    this.children = [];
    this.childNodes = this.children;
    this.attributes = new Map();
    this.style = new StyleDecl();
    this.parentNode = null;
    this.className = '';
    this._text = '';
    this.hidden = false;
    this.disabled = false;
    this.checked = false;
    this.listeners = Object.create(null);
    this.computed = Object.create(null);
    this.rect = null;
    this.scrollTop = 0;
    this.scrollHeight = 0;
    this._clientWidth = 0;
    this._clientHeight = 0;
    this._offsetHeight = 0;
    this.classList = {
      add: (...names) => {
        this.className = [this.className].concat(names).filter(Boolean).join(' ');
      },
      remove: (...names) => {
        const drop = new Set(names);
        this.className = this.className
          .split(/\s+/)
          .filter((name) => name && !drop.has(name))
          .join(' ');
      }
    };
  }
  get textContent() {
    let out = this._text || '';
    for (const child of this.children) out += child.textContent;
    return out;
  }
  set textContent(value) {
    this._text = value === undefined || value === null ? '' : String(value);
  }
  get childElementCount() {
    return this.children.length;
  }
  get parentElement() {
    return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null;
  }
  get id() {
    return this.getAttribute('id') || '';
  }
  set id(value) {
    this.setAttribute('id', value);
  }
  get clientWidth() {
    return this._clientWidth;
  }
  set clientWidth(value) {
    this._clientWidth = value;
  }
  get clientHeight() {
    return this._clientHeight;
  }
  set clientHeight(value) {
    this._clientHeight = value;
  }
  get offsetHeight() {
    return this._offsetHeight;
  }
  set offsetHeight(value) {
    this._offsetHeight = value;
  }
  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }
  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }
  hasAttribute(name) {
    return this.attributes.has(name);
  }
  removeAttribute(name) {
    this.attributes.delete(name);
  }
  appendChild(child) {
    if (child.parentNode) child.parentNode.removeChild(child);
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  append(...nodes) {
    for (const node of nodes) this.appendChild(node);
  }
  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) this.children.splice(index, 1);
    child.parentNode = null;
    return child;
  }
  replaceChildren(...nodes) {
    for (const child of this.children.slice()) this.removeChild(child);
    for (const node of nodes) this.appendChild(node);
  }
  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }
  contains(node) {
    let cursor = node;
    while (cursor) {
      if (cursor === this) return true;
      cursor = cursor.parentNode;
    }
    return false;
  }
  cloneNode(deep) {
    const copy = new El(this.tagName.toLowerCase(), this.namespaceURI);
    for (const [name, value] of this.attributes) copy.attributes.set(name, value);
    copy.className = this.className;
    copy._text = this._text;
    if (this.rect) copy.rect = { ...this.rect };
    for (const [name, value] of this.style.map) copy.style.map.set(name, value);
    if (deep) for (const child of this.children) copy.appendChild(child.cloneNode(true));
    return copy;
  }
  addEventListener(type, handler) {
    (this.listeners[type] = this.listeners[type] || []).push(handler);
  }
  removeEventListener(type, handler) {
    const list = this.listeners[type];
    if (!list) return;
    this.listeners[type] = list.filter((entry) => entry !== handler);
  }
  focus() {}
  click() {
    for (const handler of (this.listeners.click || []).slice()) handler({ type: 'click', target: this });
  }
  dispatchEvent() {}
  matches(selector) {
    return String(selector).split(',').some((part) => matchesSelector(this, part));
  }
  closest(selector) {
    let node = this;
    while (node) {
      if (node.nodeType === 1 && matchesSelector(node, selector)) return node;
      node = node.parentNode;
    }
    return null;
  }
  querySelector(selector) {
    const parts = String(selector).split(',');
    return collect(this, []).find((node) => parts.some((part) => matchesSelector(node, part))) || null;
  }
  querySelectorAll(selector) {
    const parts = String(selector).split(',');
    return collect(this, []).filter((node) => parts.some((part) => matchesSelector(node, part)));
  }
  getBoundingClientRect() {
    if (this.rect) return { ...this.rect };
    return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }
  get isConnected() {
    let cursor = this;
    while (cursor) {
      if (cursor === document) return true;
      if (cursor === document.documentElement) return true;
      cursor = cursor.parentNode;
    }
    return false;
  }
}

function matchesSelector(node, selector) {
  const text = String(selector || '').trim();
  if (!text) return false;
  if (text[0] === '#') return node.getAttribute('id') === text.slice(1);
  const parsed = /^([a-zA-Z][\w-]*)?((?:\[[^\]]+\])*)$/.exec(text);
  if (!parsed) return false;
  if (parsed[1] && node.tagName.toLowerCase() !== parsed[1].toLowerCase()) return false;
  const attrs = parsed[2] ? parsed[2].match(/\[[^\]]+\]/g) || [] : [];
  for (const raw of attrs) {
    const inner = raw.slice(1, -1);
    const eq = inner.indexOf('=');
    if (eq < 0) {
      if (!node.hasAttribute(inner)) return false;
    } else {
      const name = inner.slice(0, eq);
      const value = inner.slice(eq + 1).replace(/^["']|["']$/g, '');
      if (node.getAttribute(name) !== value) return false;
    }
  }
  return true;
}

function collect(node, out) {
  for (const child of node.children) {
    out.push(child);
    collect(child, out);
  }
  return out;
}

const document = new El('#document');
document.nodeType = 9;
document.documentElement = new El('html');
document.body = new El('body');
document.head = new El('head');
document.documentElement.parentNode = document;
document.body.parentNode = document.documentElement;
document.head.parentNode = document.documentElement;
document.documentElement.append(document.head, document.body);
document.hidden = false;
document.listeners = Object.create(null);
document.addEventListener = El.prototype.addEventListener.bind(document);
document.removeEventListener = El.prototype.removeEventListener.bind(document);
document.createElement = (tag) => new El(tag);
document.createElementNS = (ns, tag) => new El(tag, ns);
document.querySelector = (selector) =>
  collect(document.documentElement, []).find((node) => matchesSelector(node, selector)) || null;
document.querySelectorAll = (selector) =>
  collect(document.documentElement, []).filter((node) => matchesSelector(node, selector));
document.getElementById = (id) => document.querySelector('#' + id);

const DEFAULTS = {
  display: 'block',
  visibility: 'visible',
  overflowY: 'visible',
  colorScheme: 'light',
  backgroundColor: 'rgb(255, 255, 255)',
  paddingLeft: '0px',
  paddingRight: '0px',
  paddingTop: '0px',
  paddingBottom: '0px',
  marginTop: '0px',
  color: 'rgb(0, 0, 0)'
};

class StubObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

const timers = new Set();
const sandbox = {
  document,
  getComputedStyle: (el) => {
    const merged = Object.assign({}, DEFAULTS, (el && el.computed) || {});
    merged.getPropertyValue = (name) =>
      Object.prototype.hasOwnProperty.call(merged, name) ? String(merged[name]) : '';
    return merged;
  },
  MutationObserver: StubObserver,
  ResizeObserver: StubObserver,
  localStorage: {
    values: new Map(),
    getItem(key) {
      return this.values.has(key) ? this.values.get(key) : null;
    },
    setItem(key, value) {
      this.values.set(key, String(value));
    },
    removeItem(key) {
      this.values.delete(key);
    }
  },
  console,
  setTimeout: (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  },
  clearTimeout: (id) => {
    timers.delete(id);
    clearTimeout(id);
  },
  requestAnimationFrame: (fn) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn(Date.now());
    }, 0);
    timers.add(id);
    return id;
  },
  cancelAnimationFrame: (id) => {
    timers.delete(id);
    clearTimeout(id);
  }
};

const context = vm.createContext(sandbox);
vm.runInContext(
  [
    'globalThis.window = globalThis;',
    'window.innerWidth = 1200;',
    'window.innerHeight = 900;',
    'window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });',
    'window.CSS = { escape: (value) => String(value), supports: () => true };',
    'window.addEventListener = () => {};',
    'window.removeEventListener = () => {};',
    'globalThis.__fixture = null;',
    'globalThis.__capture = null;',
    'window.__ModuleLoader__ = { load(spec) { globalThis.__capture = spec; } };'
  ].join('\n'),
  context
);

vm.runInContext(bundle, context, { filename: 'lib/client.js' });
vm.runInContext('globalThis.__exports = __capture.factory(() => {});', context);

const run = (code) => vm.runInContext(code, context);
const read = (code) => JSON.parse(run('JSON.stringify(' + code + ')'));

let passed = 0;
function step(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('  ok  ' + name);
  } catch (error) {
    console.error('  FAIL ' + name);
    throw error;
  }
}

console.log('smoke: 激活 / 挂载 / 卸载（无会话）');

step('bundle 导出 apply / mount / unmount', () => {
  assert.equal(
    run('[typeof __exports.apply, typeof __exports.mount, typeof __exports.unmount].join(",")'),
    'function,function,function'
  );
});

step('apply(ctx) 不抛异常', () => {
  run('__exports.apply({ effect: (fn) => fn() });');
  assert.ok(timers.size >= 1, '应当安排了延后的挂载');
});

await new Promise((resolve) => setTimeout(resolve, 120));

step('挂载完成且没有 activation error', () => {
  const state = read(
    '({ error: window.__dshcActivationError || null, api: !!window.__dshc, mode: window.__dshc && window.__dshc.getState().mode })'
  );
  assert.equal(state.error, null, '激活阶段不应记录错误');
  assert.equal(state.api, true, '应当暴露 window.__dshc');
  assert.equal(state.mode, 'native', '默认模式必须是原生');
});

step('控制器与样式就位', () => {
  const found = read(
    '({ root: !!document.querySelector("#dshc-root"), panel: !!document.querySelector("#dshc-panel"), styles: document.querySelectorAll("style[data-dshc-css]").length })'
  );
  assert.equal(found.root, true);
  assert.equal(found.panel, true);
  assert.equal(found.styles, 2);
});

step('getState / diagnose 可用', () => {
  const data = read('({ state: window.__dshc.getState(), diag: window.__dshc.diagnose() })');
  assert.equal(data.state.caps.scroller, false);
  assert.equal(data.state.caps.column, false);
  assert.equal(data.diag.version, '3.2.0');
  assert.equal(data.diag.target.reason, 'no-conversation');
});

step('无会话时切换模式安全降级', () => {
  run(
    'window.__dshc.setMode("newspaper"); window.__dshc.setColumns("2"); window.__dshc.setMode("seamless"); window.__dshc.setMode("mirror");'
  );
  assert.equal(run('window.__dshc.getState().mode'), 'mirror');
  assert.equal(run('window.__dshc.diagnose().target.reason'), 'no-conversation');
});

step('unmount 之后 DOM / 样式 / 全局对象全部清干净', () => {
  run('window.__dshc.unmount();');
  const after = read(
    '({ root: !!document.querySelector("#dshc-root"), styles: document.querySelectorAll("style[data-dshc-css]").length, api: typeof window.__dshc, hooks: document.querySelectorAll("[data-dshc-hide]").length })'
  );
  assert.equal(after.root, false);
  assert.equal(after.styles, 0);
  assert.equal(after.api, 'undefined');
  assert.equal(after.hooks, 0);
});

step('没有遗留定时器', () => {
  assert.equal(timers.size, 0, '还有 ' + timers.size + ' 个定时器没清');
});

/* ------------------------------------- 契约夹具：三种模式的应用 / 切换 / 还原 */

console.log('\nsmoke: 三种模式的应用路径（契约夹具）');

/**
 * 夹具（只复刻插件依赖的契约，几何数字是编的）：
 *
 * body
 *  └ div[data-conversation-content][data-conversation-session=s1]
 *     └ div[data-conversation-scroll]           1200×800，滚动内容 4000 高
 *        ├ div.wrap                             正文外层（左右 padding 32）
 *        │  └ div[data-chat-flow]               正文列
 *        │     ├ div[data-slot=…] display:contents
 *        │     │  └ div[data-chat-flow-key=m0…m5]  6 条消息，各 300 高
 *        │     └ div.older > button             宿主「加载更早」
 *        └ div[data-composer-seat]              输入区，top 760
 */
run(`
  (() => {
    const el = (tag, attrs) => {
      const node = document.createElement(tag);
      if (attrs) for (const key of Object.keys(attrs)) node.setAttribute(key, attrs[key]);
      return node;
    };
    const content = el('div', { 'data-conversation-content': '', 'data-conversation-session': 's1' });
    const scroller = el('div', { 'data-conversation-scroll': '' });
    scroller.clientWidth = 1200;
    scroller.clientHeight = 800;
    scroller.scrollHeight = 4000;
    scroller.rect = { top: 100, left: 0, right: 1200, bottom: 900, width: 1200, height: 800 };
    scroller.computed = { overflowY: 'auto' };

    const wrap = el('div');
    wrap.clientWidth = 1200;
    wrap.rect = { top: 100, left: 0, right: 1200, bottom: 3900, width: 1200, height: 3800 };
    wrap.computed = { paddingLeft: '32px', paddingRight: '32px', paddingTop: '16px', paddingBottom: '16px' };

    const column = el('div', { 'data-chat-flow': '' });
    column.clientWidth = 1136;
    column.rect = { top: 116, left: 32, right: 1168, bottom: 3916, width: 1136, height: 3800 };

    const slot = el('div', { 'data-slot': 'conversation.chat.flow' });
    slot.computed = { display: 'contents' };

    const rows = [];
    for (let i = 0; i < 6; i += 1) {
      const row = el('div', { 'data-chat-flow-key': 'm' + i, 'data-chat-flow-kind': 'assistant' });
      row.textContent = '消息 ' + i;
      row.rect = { top: 116 + i * 312, left: 32, right: 1168, bottom: 116 + i * 312 + 300, width: 1136, height: 300 };
      row.computed = { marginTop: '12px' };
      if (i === 0) {
        const button = document.createElement('button');
        button.textContent = '复制';
        row.append(button);
      }
      rows.push(row);
      slot.append(row);
    }

    // 一条比列高得多的巨型块：报纸模式必须把它标成可跨列、并限高
    const tall = el('div', { 'data-chat-flow-key': 'm6', 'data-chat-flow-kind': 'assistant' });
    const pre = document.createElement('pre');
    pre.textContent = '1 2 3';
    tall.append(pre);
    tall.rect = { top: 116 + 6 * 312, left: 32, right: 1168, bottom: 116 + 6 * 312 + 5000, width: 1136, height: 5000 };
    tall.computed = { marginTop: '12px' };
    rows.push(tall);
    slot.append(tall);

    const olderWrap = el('div');
    const olderBtn = document.createElement('button');
    olderBtn.textContent = '加载更早';
    olderWrap.append(olderBtn);

    column.append(slot, olderWrap);
    wrap.append(column);
    scroller.append(wrap);

    const composer = el('div', { 'data-composer-seat': '' });
    composer.rect = { top: 760, left: 0, right: 1200, bottom: 900, width: 1200, height: 140 };
    scroller.append(composer);

    content.append(scroller);
    document.body.append(content);
    globalThis.__fixture = { content, scroller, wrap, column, slot, rows, olderWrap, olderBtn, composer };
  })();
`);

run(
  'window.localStorage.setItem("dshc-settings", JSON.stringify({ v: 1, mode: "native", cols: "auto", autoLoadHistory: { newspaper: false, seamless: true, mirror: true } }));'
);
run('__exports.mount();');

await new Promise((resolve) => setTimeout(resolve, 80));

step('识别到主会话并停在原生', () => {
  const data = read(
    '({ reason: window.__dshc.diagnose().target.reason, rows: window.__dshc.diagnose().target.rows, mode: window.__dshc.getState().mode, resolved: window.__dshc.getState().resolved, cap: window.__dshc.getState().caps.column })'
  );
  assert.equal(data.reason, 'ok');
  assert.equal(data.rows, 7);
  assert.equal(data.mode, 'native');
  assert.equal(data.cap, true);
  assert.equal(data.resolved, 2);
});

run('window.__dshc.setMode("newspaper");');
await new Promise((resolve) => setTimeout(resolve, 220));

step('报纸模式：列样式与标记就位', () => {
  const data = read(`(() => {
    const c = __fixture.column;
    return {
      mark: c.hasAttribute('data-dshc-a'),
      count: c.style.getPropertyValue('column-count'),
      display: c.style.getPropertyValue('display'),
      fill: c.style.getPropertyValue('column-fill'),
      widthVar: c.style.getPropertyValue('--dsh-chat-content-width'),
      items: __fixture.rows.filter((row) => row.hasAttribute('data-dshc-item')).length,
      olderHidden: __fixture.olderWrap.getAttribute('data-dshc-hide'),
      mode: window.__dshc.getState().mode
    };
  })()`);
  assert.equal(data.mark, true);
  assert.equal(data.count, '2');
  assert.equal(data.display, 'block');
  assert.equal(data.fill, 'balance');
  assert.equal(data.widthVar, '100%');
  assert.equal(data.items, 7);
  assert.equal(data.olderHidden, 'older');
  assert.equal(data.mode, 'newspaper');
});

step('报纸模式：所有内容可跨列，代码块的滚动容器被放开', () => {
  const data = read(`(() => {
    const diag = window.__dshc.diagnose().newspaper;
    const pre = __fixture.rows[6].querySelector('pre');
    return {
      longMarks: __fixture.rows.filter((row) => row.hasAttribute('data-dshc-long')).length,
      applied: diag.applied,
      items: diag.items,
      blank: diag.blank,
      height: diag.height,
      hasEnds: Array.isArray(diag.columnsEnd) && diag.columnsEnd.length > 0,
      preOverflow: pre.style.getPropertyValue('overflow'),
      preWrap: pre.style.getPropertyValue('white-space')
    };
  })()`);
  assert.equal(data.longMarks, 0, '不再需要给单条消息打标记');
  assert.equal(data.applied, true);
  assert.equal(data.items, 7);
  assert.equal(typeof data.blank, 'number');
  assert.ok(data.height > 0);
  assert.equal(data.hasEnds, true);
  assert.equal(data.preOverflow, 'visible', 'pre 的 overflow 必须放开，否则不可分片');
  assert.equal(data.preWrap, 'pre-wrap', '长行改软换行，避免横向溢出');
});

step('无缝模式：粘滞视口层 + 占位层 + 绝对定位', () => {
  run('window.__dshc.setMode("seamless");');
  const data = read(`(() => {
    const diag = window.__dshc.diagnose().seamless;
    const c = __fixture.column;
    return {
      active: diag.active,
      H: diag.H,
      columns: diag.columns,
      pages: diag.pages,
      total: diag.total,
      maxScroll: diag.maxScroll,
      spacer: __fixture.wrap.style.getPropertyValue('--dshc-spacer'),
      hostMark: __fixture.wrap.hasAttribute('data-dshc-b-host'),
      position: c.style.getPropertyValue('position'),
      height: c.style.getPropertyValue('height'),
      overflow: c.style.getPropertyValue('overflow'),
      items: __fixture.rows.filter((row) => row.getAttribute('data-dshc-b') === 'item').length,
      transforms: __fixture.rows.map((row) => row.style.getPropertyValue('transform'))
    };
  })()`);
  assert.equal(data.active, true);
  assert.equal(data.H, 660);
  assert.equal(data.columns, 2);
  assert.equal(data.pages, 4);
  assert.equal(data.total, 2640);
  assert.equal(data.maxScroll, 1980);
  assert.equal(data.spacer, '1980px');
  assert.equal(data.hostMark, true);
  assert.equal(data.position, 'sticky');
  assert.equal(data.height, '660px');
  assert.equal(data.overflow, 'hidden');
  assert.equal(data.items, 7);
  assert.ok(
    data.transforms.every((value) => value.indexOf('translate3d') === 0),
    '每条消息都应有 translate3d'
  );
});

step('复制模式：只读副本 + 分栏 + 隐藏宿主正文', () => {
  run('window.__dshc.setMode("mirror");');
  const data = read(`(() => {
    const view = document.querySelector('section[data-mode=mirror]');
    let dead = 0;
    for (const clone of document.querySelectorAll('[data-dshc-clone]')) dead += clone.querySelectorAll('button').length;
    return {
      visible: !!view && !view.hidden,
      cols: document.querySelectorAll('[data-index]').length,
      clones: document.querySelectorAll('[data-dshc-clone]').length,
      hostHidden: __fixture.column.style.getPropertyValue('visibility'),
      dead,
      rowMarks: __fixture.rows.filter((row) => row.hasAttribute('data-dshc-item')).length,
      seamlessMark: __fixture.column.hasAttribute('data-dshc-b'),
      mode: window.__dshc.getState().mode
    };
  })()`);
  assert.equal(data.visible, true);
  assert.equal(data.cols, 2);
  assert.equal(data.clones, 14, '2 栏 × 7 条：每栏都是完整副本');
  assert.equal(data.hostHidden, 'hidden');
  assert.equal(data.dead, 2, '每个副本里的按钮都应被保留但禁用');
  assert.equal(data.rowMarks, 0, '切换模式时应先把旧标记清掉');
  assert.equal(data.seamlessMark, false);
  assert.equal(data.mode, 'mirror');
});

step('切回原生：宿主全部还原', () => {
  run('window.__dshc.setMode("native");');
  const data = read(`(() => {
    const c = __fixture.column;
    return {
      attrs: Array.from(c.attributes.keys()),
      inline: Array.from(c.style.map.keys()),
      visibility: c.style.getPropertyValue('visibility'),
      leftovers:
        document.querySelectorAll('[data-dshc-a]').length +
        document.querySelectorAll('[data-dshc-b]').length +
        document.querySelectorAll('[data-dshc-b-host]').length +
        document.querySelectorAll('[data-dshc-hide]').length +
        document.querySelectorAll('[data-dshc-item]').length +
        document.querySelectorAll('[data-dshc-long]').length,
      overlay: document.querySelector('section[data-mode=mirror]').hidden,
      mode: window.__dshc.getState().mode
    };
  })()`);
  assert.deepEqual(data.attrs, ['data-chat-flow'], '正文列上只应剩下宿主自己的属性');
  assert.deepEqual(data.inline, [], '正文列上的内联样式应清空');
  assert.equal(data.visibility, '');
  assert.equal(data.leftovers, 0, '页面上不应残留任何插件标记');
  assert.equal(data.overlay, true);
  assert.equal(data.mode, 'native');
});

step('卸载后夹具回到初始状态', () => {
  run('window.__dshc.unmount();');
  const data = read(`({
    root: !!document.querySelector('#dshc-root'),
    styles: document.querySelectorAll('style[data-dshc-css]').length,
    host: document.querySelectorAll('[data-dshc-b-host]').length
  })`);
  assert.equal(data.root, false);
  assert.equal(data.styles, 0);
  assert.equal(data.host, 0);
});

step('没有遗留定时器（含夹具阶段）', () => {
  assert.equal(timers.size, 0, '还有 ' + timers.size + ' 个定时器没清');
});

console.log(`\n${passed} 项通过`);
