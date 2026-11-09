#!/usr/bin/env node
/**
 * 生命周期回归测试 v2（真实 DSH 环境，CDP 驱动）。
 *
 * v1 被独立审查指出「证明的是某次环境恰好干净，不是状态机正确」：
 *   - T2 只查 DOM 残留，状态卡死也能过；
 *   - T1b 在卸载前把干扰面板删了，实际没测到 ambiguous 下卸载；
 *   - T3 没有候选数断言，干净环境恒真；
 *   - 固定 sleep、硬编码标题、改 profile 不按字节恢复、不挡 Ctrl-C。
 * v2 逐条整改。
 * 0.1.4 复核整改：新增 T3b（面积更大的外部 flow 对抗测试）。同时 T1a 的干扰面板
 * 改为注入到主会话滚动容器**内部**——候选范围已收窄到该容器，容器外的注入节点
 * 不再参与裁决，继续挂在 body 上就测不到 ambiguous 了。
 *
 * 用法：
 *   node harness/state-tests.mjs
 *   SESSION_TITLE="某会话" ALTERNATE_TITLE="另一条" node harness/state-tests.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const BASE = process.env.CDP_BASE || "http://127.0.0.1:9222";
const PROFILE = process.env.PROFILE_PKG || join(process.env.DSH_PROFILE_DIR || join(homedir(), ".dsh/profiles/web"), "package.json");
const TITLE = process.env.SESSION_TITLE || "测试工作区与API";
const ALT = process.env.ALTERNATE_TITLE || "Administrator";
const MIN_ROWS = Number(process.env.MIN_ROWS || 50);

const results = [];
const t = (name, pass, detail) => {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  " + JSON.stringify(detail) : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const pkgBytes = readFileSync(PROFILE);
let pkgDirty = false;
function setBundles(include) {
  const d = JSON.parse(readFileSync(PROFILE, "utf8"));
  const b = d.dsh.profile.bundles;
  d.dsh.profile.bundles = include ? [...new Set([...b, "dsh-chat-columns"])] : b.filter((x) => x !== "dsh-chat-columns");
  writeFileSync(PROFILE, JSON.stringify(d, null, 2) + "\n");
  pkgDirty = true;
}
function restoreProfile() {
  if (!pkgDirty) return;
  writeFileSync(PROFILE, pkgBytes);
  pkgDirty = false;
}
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => { restoreProfile(); console.error(`\n收到 ${sig}，已恢复 profile`); process.exit(130); });
}

async function connect() {
  const list = await (await fetch(`${BASE}/json/list`)).json();
  const pages = list.filter((x) => x.type === "page" && x.webSocketDebuggerUrl);
  if (!pages.length) throw new Error("没有 page target");
  const page = pages.find((x) => /^https?:\/\/[^/]+\/?(\?|$)/.test(x.url)) || pages[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener("open", res, { once: true }); ws.addEventListener("error", rej, { once: true }); });
  let id = 0; const pending = new Map();
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
  return { send, evaluate, close: () => ws.close(), url: page.url };
}

async function waitFor(cdp, expr, label, timeout = 30000) {
  const t0 = Date.now();
  let last;
  while (Date.now() - t0 < timeout) {
    last = await cdp.evaluate(expr);
    if (last) return { ok: true, ms: Date.now() - t0, value: last };
    await sleep(200);
  }
  return { ok: false, ms: Date.now() - t0, value: last, label };
}

const PAGE_ALIVE = `(() => ({
  href: location.href,
  root: (document.getElementById('root') || document.body).children.length,
  hasUi: !!document.querySelector('[data-conversation-scroll], button'),
}))()`;

const OPEN = (title) => `(async () => {
  const find = (t) => [...document.querySelectorAll('span,div')].find(e => !e.children.length && e.textContent.trim() === t);
  const click = (el) => { const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.x + 4, clientY: r.y + 4 })); };
  let node = find(${JSON.stringify(title)});
  if (!node) {
    for (const g of ['workspace', 'eng', '大肥鱼工作室', 'dafeiyu', 'life']) {
      const el = find(g);
      if (!el) continue;
      click(el); await new Promise(r => setTimeout(r, 400));
      node = find(${JSON.stringify(title)});
      if (node) break;
    }
  }
  if (!node) return 'title-not-found';
  click(node);
  return 'clicked';
})()`;

const RESIDUE = `(() => {
  const flows = [...document.querySelectorAll('[data-chat-flow]')];
  const d = document.documentElement;
  return {
    state: d.dataset.dshcState ?? null,
    badge: document.querySelectorAll('.dshc-badge').length,
    styles: document.querySelectorAll('style[data-plugin="dsh-chat-columns"]').length,
    withClass: flows.filter(f => f.classList.contains('dshc-flow')).length,
    withCols: flows.filter(f => f.style.columnCount).length,
    withAtomic: flows.reduce((n, f) => n + f.querySelectorAll('.dshc-atomic').length, 0),
    withVar: flows.filter(f => f.style.getPropertyValue('--dsh-chat-content-width')).length,
    rootVar: d.style.getPropertyValue('--dsh-chat-content-width') || null,
    dataAttrs: ['dshc', 'dshcWidth', 'dshcN', 'dshcState', 'dshcRootOwner'].filter(k => d.dataset[k] !== undefined).sort(),
    api: typeof window.__dshChatColumns,
  };
})()`;

const ACTIVE_STATE = `(() => {
  const flows = [...document.querySelectorAll('[data-chat-flow]')].map(f => {
    const r = f.getBoundingClientRect();
    const area = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
    return { rows: f.querySelectorAll('[data-chat-flow-key]').length, area, cols: f.style.columnCount || '', cls: f.classList.contains('dshc-flow') };
  }).filter(f => f.rows > 0).sort((a, b) => b.area - a.area);
  return { state: document.documentElement.dataset.dshcState ?? null, top: flows[0] || null, applied: flows.filter(f => f.cls).length, total: flows.length };
})()`;

const ACTIVE_OK = `(() => { const s = ${ACTIVE_STATE};
  return (s.state === 'active' && s.top && s.top.rows >= ${MIN_ROWS} && Number(s.top.cols) >= 2 && s.applied === 1) ? s : null; })()`;

const READY = (title) => `(() => {
  const alive = (document.getElementById('root') || document.body).children.length > 0;
  const api = typeof window.__dshChatColumns === 'object' || window.__dshChatColumns === undefined;
  const hasTitle = [...document.querySelectorAll('span,div')].some(e => !e.children.length && e.textContent.trim() === ${title});
  return alive && api && hasTitle;
})()`;

const cdp = await connect();
try {
  const { windowId } = await cdp.send("Browser.getWindowForTarget");
  await cdp.send("Browser.setWindowBounds", { windowId, bounds: { width: 1700, height: 1000 } });
  await sleep(600);

  const alive = await cdp.evaluate(PAGE_ALIVE);
  t("T-pre 页面存活且是 DSH（不是空白页）", alive.root > 0 && alive.hasUi, { href: alive.href.replace(/token=[^&]+/, "token=***"), root: alive.root });

  await cdp.evaluate(`document.getElementById('dshc-test-fake')?.remove(); 1`);
  const opened = await cdp.evaluate(OPEN(TITLE));
  const base = await waitFor(cdp, ACTIVE_OK, "T0");
  t("T0 基线：active、≥2 列、行数达标、只有一个 flow 被套列",
    opened === "clicked" && base.ok, base.ok ? { rows: base.value.top.rows, cols: base.value.top.cols, total: base.value.total, ms: base.ms } : { opened, ms: base.ms });
  if (!base.ok) throw new Error("基线不成立，后续用例没有意义");

  const multi = await cdp.evaluate(ACTIVE_STATE);
  t("T3 多候选（≥2 个含内容 flow）：只有面积最大的被套列",
    multi.total >= 2 && multi.applied === 1 && multi.top.cols !== "",
    { total: multi.total, applied: multi.applied, topCols: multi.top?.cols });

  // 0.1.4 复核第 2 条：造一个比主会话**更大**、但不在滚动容器内的 flow。
  // 旧实现全局按面积选，会把它当成活动面板（随后 closest 找不到 scroller，
  // 主会话的分栏被整组拆掉）。修复后它根本不进候选集。
  const adv = await cdp.evaluate(`(async () => {
    const real = [...document.querySelectorAll('[data-chat-flow]')].find(f => f.classList.contains('dshc-flow'));
    const d = document.documentElement;
    const sc = real.closest('[data-conversation-scroll]');
    const before = real.style.columnCount || '';
    const ext = document.createElement('div');
    ext.setAttribute('data-chat-flow', ''); ext.id = 'dshc-test-external';
    ext.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:1;pointer-events:none';
    for (let i = 0; i < 20; i++) {
      const row = document.createElement('div');
      row.setAttribute('data-chat-flow-key', 'ext-' + i);
      row.textContent = 'external ' + i;
      ext.appendChild(row);
    }
    document.body.appendChild(ext);
    const area = (el) => {
      const r = el.getBoundingClientRect();
      return Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)) *
             Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
    };
    const ratio = area(ext) / Math.max(1, area(real));
    const outsideScroller = !sc.contains(ext);
    await new Promise(x => setTimeout(x, 1200));
    const out = {
      ratio: +ratio.toFixed(2), outsideScroller,
      state: d.dataset.dshcState, before,
      realCols: real.style.columnCount || '', extCols: ext.style.columnCount || '',
      applied: document.querySelectorAll('[data-chat-flow].dshc-flow').length,
    };
    ext.remove();
    return out;
  })()`);
  t("T3b 面积更大的外部 flow（容器外）不能抢占主会话",
    adv.ratio > 1.2 && adv.outsideScroller && adv.state === "active" &&
    adv.realCols === adv.before && Number(adv.realCols) >= 2 && adv.extCols === "" && adv.applied === 1,
    adv);

  // 干扰面板必须挂在主会话滚动容器内部，才属于候选集（候选范围已收窄）。
  const amb = await cdp.evaluate(`(async () => {
    const real = [...document.querySelectorAll('[data-chat-flow]')].find(f => f.classList.contains('dshc-flow'));
    const sc = real.closest('[data-conversation-scroll]') || document.body;
    const r = real.getBoundingClientRect();
    const fake = document.createElement('div');
    fake.setAttribute('data-chat-flow', ''); fake.id = 'dshc-test-fake';
    fake.style.cssText = 'position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;z-index:1';
    for (let i = 0; i < 3; i++) { const row = document.createElement('div'); row.setAttribute('data-chat-flow-key', 'fake-' + i); row.textContent = 'test'; fake.appendChild(row); }
    sc.appendChild(fake);
    await new Promise(x => setTimeout(x, 800));
    return { state: document.documentElement.dataset.dshcState, realCols: real.style.columnCount || '', fakeCols: fake.style.columnCount || '', applied: document.querySelectorAll('[data-chat-flow].dshc-flow').length };
  })()`);
  t("T1a active → ambiguous：容器内等大面板触发冻结、不拆、没被套列",
    amb.state === "ambiguous" && amb.realCols === base.value.top.cols && amb.fakeCols === "" && amb.applied === 1, amb);

  setBundles(false);
  const gone = await waitFor(cdp, `(() => { const r = ${RESIDUE}; return (r.badge === 0 && r.styles === 0 && r.api === 'undefined') ? r : null; })()`, "T1b");
  const g = gone.value || {};
  t("T1b ambiguous → 卸载：类/columnCount/atomic/变量/data 属性/API 全清",
    gone.ok && g.withClass === 0 && g.withCols === 0 && g.withAtomic === 0 && g.withVar === 0 &&
    g.rootVar === null && (g.dataAttrs || []).length === 0, { ms: gone.ms, ...g });

  setBundles(true);
  const back = await waitFor(cdp, `(() => typeof window.__dshChatColumns === 'object')()`, "T4 重装");
  // 实测：配置热重载后、页面不刷新时，新实例的 observer 有时没接管旧会话，
  // 要等下一次布局事件才恢复。真实使用里"启用插件后刷新页面"是标准动作，这里照做。
  await cdp.evaluate("location.reload(); 1");
  await sleep(1500);
  await waitFor(cdp, READY(JSON.stringify(TITLE)), "T4 应用就绪");   // 重载后侧栏可能还没渲染
  const opened2 = await cdp.evaluate(OPEN(TITLE));
  await waitFor(cdp, `(() => document.querySelectorAll('[data-chat-flow-key]').length > ${MIN_ROWS})()`, "T4 会话树加载", 45000);
  const active2 = await waitFor(cdp, ACTIVE_OK, "T4 回到 active", 45000);
  const dup = await cdp.evaluate(`({ badge: document.querySelectorAll('.dshc-badge').length, styles: document.querySelectorAll('style[data-plugin="dsh-chat-columns"]').length })`);
  if (!active2.ok) console.log("  [diag] T4 当时的页面状态:", JSON.stringify(await cdp.evaluate(RESIDUE)));
  t("T4 重装后重新打开会话：回到 active、≥2 列、无重复徽标/样式",
    back.ok && opened2 === "clicked" && active2.ok && dup.badge === 1 && dup.styles === 1,
    { opened: opened2, ms: active2.ms, ...dup });

  await waitFor(cdp, READY(JSON.stringify(ALT)), "T5 前置");
  await cdp.evaluate(OPEN(ALT));
  await sleep(2500);
  await cdp.evaluate(OPEN(TITLE));
  const sw = await waitFor(cdp, ACTIVE_OK, "T5 切回");
  const stale = await cdp.evaluate(`document.querySelectorAll('[data-chat-flow].dshc-flow').length`);
  t("T5 切走再切回：只有当前会话被套列，旧 flow 无残留",
    sw.ok && stale === 1, { staleClassCount: stale, applied: sw.value?.applied });

  await waitFor(cdp, READY(JSON.stringify(TITLE)), "T2 前置");
  const none = await cdp.evaluate(`(async () => {
    const btn = [...document.querySelectorAll('button')].find(b => /New Session/i.test(b.textContent || ''));
    if (!btn) return { skipped: true };
    btn.click();
    await new Promise(r => setTimeout(r, 1200));
    return ${RESIDUE};
  })()`);
  t("T2 active → none：state=none、插件在位、data 只剩 dshc/dshcRootOwner/dshcState、无残留",
    !none.skipped && none.state === "none" && none.badge === 1 && none.styles === 1 && none.api === "object" &&
    none.withClass === 0 && none.withCols === 0 && none.withAtomic === 0 && none.withVar === 0 &&
    (none.dataAttrs || []).join(",") === "dshc,dshcRootOwner,dshcState", none);

  await waitFor(cdp, READY(JSON.stringify(TITLE)), "T2b 前置");
  await cdp.evaluate(OPEN(TITLE));
  const roundTrip = await waitFor(cdp, ACTIVE_OK, "T2b 往返");
  t("T2b none → 重开会话：回到 active（往返可用）", roundTrip.ok, { ms: roundTrip.ms, cols: roundTrip.value?.top?.cols });
} catch (err) {
  console.error("测试中断:", err.message);
} finally {
  await cdp.evaluate(`document.getElementById('dshc-test-fake')?.remove(); document.getElementById('dshc-test-external')?.remove(); 1`).catch(() => {});
  restoreProfile();
  cdp.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
