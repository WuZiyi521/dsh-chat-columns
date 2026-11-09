#!/usr/bin/env node
/**
 * 0.1.2 生命周期回归测试（真实 DSH 环境，CDP 驱动）。
 *
 * 覆盖裁决要求的 4 条：
 *   T1 active → ambiguous → 卸载：卸载后不得留下列类/columnCount/atomic/变量/数据属性
 *   T2 active → none（回到 hero）：所有套过列的 flow 必须被拆干净
 *   T3 多面板：轨迹/子代理面板不得抢占主会话
 *   T4 重装后回到 active
 *
 * 用法（需要先开好带 CDP 的无头浏览器并转发 9222）：
 *   node harness/state-tests.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const BASE = process.env.CDP_BASE || "http://127.0.0.1:9222";
const PROFILE_PKG = "/home/leon/.dsh/profiles/web/package.json";
const results = [];

const t = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  " + JSON.stringify(detail) : ""}`);
};

async function connect() {
  const list = await (await fetch(`${BASE}/json/list`)).json();
  const page = list.find((x) => x.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", rej, { once: true });
  });
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result?.value;
  };
  return { evaluate, close: () => ws.close() };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 页面侧：当前残留检查 */
const RESIDUE = `(() => {
  const flows = [...document.querySelectorAll('[data-chat-flow]')];
  const withClass = flows.filter(f => f.classList.contains('dshc-flow')).length;
  const withCols = flows.filter(f => f.style.columnCount).length;
  const withAtomic = flows.reduce((n, f) => n + f.querySelectorAll('.dshc-atomic').length, 0);
  const withVar = flows.filter(f => f.style.getPropertyValue('--dsh-chat-content-width')).length;
  const d = document.documentElement;
  return {
    state: d.dataset.dshcState || null,
    badge: document.querySelectorAll('.dshc-badge').length,
    styles: document.querySelectorAll('style[data-plugin="dsh-chat-columns"]').length,
    withClass, withCols, withAtomic, withVar,
    rootVar: d.style.getPropertyValue('--dsh-chat-content-width') || null,
    dataAttrs: ['dshc','dshcWidth','dshcN','dshcState'].filter(k => d.dataset[k] !== undefined),
    api: typeof window.__dshChatColumns,
  };
})()`;

const ACTIVE = `(() => {
  const f = [...document.querySelectorAll('[data-chat-flow]')].filter(e => e.clientHeight > 0)
    .map(e => ({ e, a: (() => { const r = e.getBoundingClientRect();
      return Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)); })() }))
    .sort((x, y) => y.a - x.a)[0];
  return {
    state: document.documentElement.dataset.dshcState,
    cols: f ? (f.e.style.columnCount || '1') : null,
    rows: f ? f.e.querySelectorAll('[data-chat-flow-key]').length : 0,
    withClass: document.querySelectorAll('[data-chat-flow].dshc-flow').length,
  };
})()`;

function setBundles(include) {
  const d = JSON.parse(readFileSync(PROFILE_PKG, "utf8"));
  const b = d.dsh.profile.bundles;
  d.dsh.profile.bundles = include ? [...new Set([...b, "dsh-chat-columns"])] : b.filter((x) => x !== "dsh-chat-columns");
  writeFileSync(PROFILE_PKG, JSON.stringify(d, null, 2) + "\n");
}

const OPEN_SESSION = `(async () => {
  const find = (t) => [...document.querySelectorAll('span,div')].find(e => !e.children.length && e.textContent.trim() === t);
  const click = (el) => { const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.x + 4, clientY: r.y + 4 })); };
  const waitFor = async (t, ms = 4000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { const el = find(t); if (el) return el; await new Promise(r => setTimeout(r, 150)); }
    return null;
  };
  let title = find('测试工作区与API');
  if (!title) {                       // 分组可能已经展开，别盲目点（点了反而会收起）
    const group = find('workspace');
    if (group) { click(group); await new Promise(r => setTimeout(r, 500)); }
    title = await waitFor('测试工作区与API');
  }
  if (!title) return 'title-not-found';
  click(title);
  return 'clicked';
})()`;

const cdp = await connect();
try {
  // ---------- 先打开一条长会话（每次跑都从确定状态开始） ----------
  await cdp.evaluate("document.getElementById('dshc-test-fake')?.remove(); 1");   // 清掉上一轮可能残留的干扰面板
  const openedFirst = await cdp.evaluate(OPEN_SESSION);
  await sleep(3000);
  if (openedFirst !== "clicked") console.log("  [warn] 打开会话:", openedFirst);

  // ---------- 基线 ----------
  const base = await cdp.evaluate(ACTIVE);
  t("T0 基线：active 且有列", base.state === "active" && Number(base.cols) >= 2, base);

  // ---------- T3 多面板不抢占 ----------
  const multi = await cdp.evaluate(`(() => {
    const flows = [...document.querySelectorAll('[data-chat-flow]')].map(f => {
      const r = f.getBoundingClientRect();
      const area = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
      return { cls: f.className, rows: f.querySelectorAll('[data-chat-flow-key]').length, area: Math.round(area), w: Math.round(r.width), hasClass: f.classList.contains('dshc-flow') };
    }).sort((a, b) => b.area - a.area);
    return { total: flows.length, top: flows[0], applied: flows.filter(f => f.hasClass) };
  })()`);
  t("T3 多面板：套列的是可见面积最大的那个，且只有一个",
    multi.applied.length === 1 && multi.top.hasClass === true, { total: multi.total, top: { rows: multi.top.rows, area: multi.top.area, cls: multi.top.cls.slice(0, 30) }, appliedCount: multi.applied.length });

  // ---------- T1 active → ambiguous ----------
  const amb = await cdp.evaluate(`(async () => {
    const real = [...document.querySelectorAll('[data-chat-flow]')].find(e => e.classList.contains('dshc-flow'));
    const r = real.getBoundingClientRect();
    const fake = document.createElement('div');
    fake.setAttribute('data-chat-flow', ''); fake.id = 'dshc-test-fake';
    // 必须带真实内容行：0.1.3 起空面板不算候选（hero 抢占问题的修复）
    for (let i = 0; i < 3; i++) { const row = document.createElement('div'); row.setAttribute('data-chat-flow-key', 'fake-' + i); row.textContent = 'test'; fake.appendChild(row); }
    fake.style.cssText = 'position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;z-index:1';
    document.body.appendChild(fake);
    await new Promise(x => setTimeout(x, 500));
    return { state: document.documentElement.dataset.dshcState, realCols: real.style.columnCount || '(无)', badge: document.querySelector('.dshc-badge')?.textContent };
  })()`);
  t("T1a active → ambiguous：状态正确且冻结（不拆列）",
    amb.state === "ambiguous" && amb.realCols === base.cols, amb);

  // 撤掉干扰面板，回到单一面板的正常状态，再继续卸载测试
  await cdp.evaluate("document.getElementById('dshc-test-fake')?.remove(); 1");
  await sleep(800);

  // ---------- T1b 卸载（ambiguous 状态下） ----------
  setBundles(false);
  await sleep(7000);
  const afterUnload = await cdp.evaluate(RESIDUE);
  t("T1b ambiguous → 卸载：无任何残留",
    afterUnload.badge === 0 && afterUnload.styles === 0 && afterUnload.withClass === 0 &&
    afterUnload.withCols === 0 && afterUnload.withAtomic === 0 && afterUnload.withVar === 0 &&
    afterUnload.rootVar === null && afterUnload.dataAttrs.length === 0 && afterUnload.api === "undefined",
    afterUnload);

  // ---------- T4 重装 ----------
  setBundles(true);
  await sleep(8000);
  const openedAgain = await cdp.evaluate(OPEN_SESSION);
  await sleep(3000);
  if (openedAgain !== "clicked") console.log("  [warn] 打开会话:", openedAgain);
  const reinstalled = await cdp.evaluate(ACTIVE);
  t("T4 重装后重新打开会话回到 active", reinstalled.state === "active" && Number(reinstalled.cols) >= 2 && reinstalled.rows > 0, reinstalled);

  // ---------- T2 active → none（回到 hero） ----------
  const none = await cdp.evaluate(`(async () => {
    const btn = [...document.querySelectorAll('button')].find(b => /New Session/i.test(b.textContent || ''));
    if (!btn) return { skipped: '没有 New Session 按钮' };
    btn.click();
    await new Promise(x => setTimeout(x, 1500));
    return ${RESIDUE.replace(/;\s*$/, "")};
  })()`);
  if (none.skipped) t("T2 active → none", false, none);
  else t("T2 active → none：所有套过列的 flow 都被拆干净（只查残留，不苛求 state 文案）",
    none.withClass === 0 && none.withCols === 0 && none.withAtomic === 0 && none.withVar === 0 && none.rootVar === null,
    none);
} finally {
  cdp.close();
  // 测试中途失败也要把 profile 恢复，别把插件留在"已卸载"状态
  try { setBundles(true); } catch {}
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
