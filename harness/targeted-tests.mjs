#!/usr/bin/env node
/**
 * 0.1.4 复核整改 · 定向回归测试（本地无头浏览器，不依赖真实 DSH 实例）
 *
 * 只覆盖本轮两项阻塞，替代不了 docs/testing.md 的完整验收，也不重跑历史用例：
 *   R0 基线：报纸模式正常套列、根节点全局状态齐全
 *   R1 面积更大的**外部** flow 不能抢占主会话（复核第 2 条）
 *   R2 主会话滚动容器**内部**的等大 flow 仍能触发 ambiguous（安全降级没被误删）
 *   R3 旧实例 disposer 晚到，不能清掉新实例的根节点全局状态（复核第 1 条）
 *   R4 唯一的属主实例卸载时，根节点状态仍要清干净（T1b / T2 口径不回退）
 *
 * 用法：node harness/targeted-tests.mjs
 * 可用 CHROME_BIN 指定 Chrome/Edge；需要 Node 22（内置 WebSocket）。
 */
import { createServer } from "node:http";
import { readFile, mkdtemp } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, resolve, sep } from "node:path";
import { tmpdir } from "node:os";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// 版本从 package.json 读，别在用例里写死——改版本号不该让 R0/R3 假失败
const VERSION = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).version;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
};

const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = resolve(ROOT, "." + pathname);
    if (!file.startsWith(ROOT + sep)) {
      res.writeHead(403); res.end("forbidden"); return;
    }
    const buf = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
    res.end(buf);
  } catch {
    res.writeHead(404); res.end("not found");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const httpPort = server.address().port;

const BINS = [
  process.env.CHROME_BIN,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const bin = BINS.find(existsSync);
if (!bin) {
  server.close();
  console.error("FAIL  找不到 Chrome/Edge，请设置 CHROME_BIN");
  process.exit(2);
}

const profileDir = await mkdtemp(join(tmpdir(), "dshc-targeted-"));
const browser = spawn(bin, [
  "--headless=new",
  "--no-first-run",
  "--no-default-browser-check",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-extensions",
  "--remote-debugging-port=0",          // 让浏览器自己挑空闲端口，写 DevToolsActivePort
  `--user-data-dir=${profileDir}`,
  "--window-size=1700,1000",
  "about:blank",
], { stdio: "ignore", windowsHide: true });

let debugPort = 0;
for (let i = 0; i < 120 && !debugPort; i++) {
  try {
    const txt = await readFile(join(profileDir, "DevToolsActivePort"), "utf8");
    debugPort = Number(txt.split("\n")[0].trim()) || 0;
  } catch { /* 还没写 */ }
  if (!debugPort) await sleep(100);
}
if (!debugPort) {
  browser.kill(); server.close();
  console.error("FAIL  无法取得浏览器调试端口");
  process.exit(2);
}

const BASE = `http://127.0.0.1:${debugPort}`;
let page = null;
for (let i = 0; i < 120 && !page; i++) {
  try {
    const list = await (await fetch(`${BASE}/json/list`)).json();
    page = list.find((x) => x.type === "page" && x.webSocketDebuggerUrl) || null;
  } catch { /* 还没起来 */ }
  if (!page) await sleep(100);
}
if (!page) {
  browser.kill(); server.close();
  console.error("FAIL  没有可用的 page target");
  process.exit(2);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.addEventListener("open", res, { once: true });
  ws.addEventListener("error", rej, { once: true });
});
let id = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result);
  }
});
const send = (method, params = {}) => new Promise((res, rej) => {
  const i = ++id;
  pending.set(i, { res, rej });
  ws.send(JSON.stringify({ id: i, method, params }));
});
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", {
    expression, returnByValue: true, awaitPromise: true, userGesture: true,
  });
  if (r.exceptionDetails) {
    throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  }
  return r.result?.value;
};
const waitFor = async (expression, label, timeout = 15000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const v = await evaluate(expression);
    if (v) return v;
    await sleep(100);
  }
  throw new Error(`等待超时: ${label}`);
};

async function check(name, expression) {
  let out;
  try {
    out = await evaluate(expression);
  } catch (err) {
    out = { pass: false, error: String(err.message || err) };
  }
  results.push({ name, pass: !!out?.pass });
  console.log(`${out?.pass ? "PASS" : "FAIL"}  ${name}  ${JSON.stringify(out)}`);
}

try {
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1700, height: 1000, deviceScaleFactor: 1, mobile: false,
  });
  await send("Page.navigate", { url: `http://127.0.0.1:${httpPort}/harness/index.html` });
  await waitFor(
    `(() => document.readyState === 'complete' && typeof window.__dshChatColumns === 'object')()`,
    "沙盒加载",
  );
  await waitFor(
    `(() => document.documentElement.dataset.dshcState === 'active' &&
       Number(document.querySelector('[data-conversation-scroll] [data-chat-flow]').style.columnCount) >= 2)()`,
    "基线套列",
  );

  await check("R0 基线：active、≥2 列、根节点 dshc* 齐全、徽标/样式各 1 份", `(() => {
    const d = document.documentElement;
    const main = document.querySelector('[data-conversation-scroll] [data-chat-flow]');
    const missing = ['dshc','dshcState','dshcWidth','dshcN','dshcRootOwner'].filter(k => d.dataset[k] === undefined);
    return {
      pass: !window.__err && d.dataset.dshc === ${JSON.stringify(VERSION)} && d.dataset.dshcState === 'active' &&
            Number(main.style.columnCount) >= 2 && main.classList.contains('dshc-flow') &&
            missing.length === 0 &&
            document.querySelectorAll('.dshc-badge').length === 1 &&
            document.querySelectorAll('style[data-plugin="dsh-chat-columns"]').length === 1 &&
            typeof window.__dshChatColumns === 'object',
      version: d.dataset.dshc, state: d.dataset.dshcState, cols: main.style.columnCount || '',
      missing, err: window.__err || null,
    };
  })()`);

  await check("R1 面积更大的外部 flow（容器外）不能抢占主会话", `(async () => {
    const d = document.documentElement;
    const sc = document.querySelector('[data-conversation-scroll]');
    const main = sc.querySelector('[data-chat-flow]');
    const area = (el) => {
      const r = el.getBoundingClientRect();
      return Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)) *
             Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
    };
    const before = main.style.columnCount || '';
    const ext = document.createElement('div');
    ext.id = 'dshc-adv-external';
    ext.setAttribute('data-chat-flow', '');
    ext.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:1;pointer-events:none';
    for (let i = 0; i < 20; i++) {
      const row = document.createElement('div');
      row.setAttribute('data-chat-flow-key', 'ext-' + i);
      row.textContent = 'external ' + i;
      ext.appendChild(row);
    }
    document.body.appendChild(ext);
    const ratio = area(ext) / Math.max(1, area(main));
    const outsideScroller = !sc.contains(ext);
    window.__dshChatColumns.refresh();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const out = {
      state: d.dataset.dshcState,
      mainCols: main.style.columnCount || '', mainCls: main.classList.contains('dshc-flow'),
      extCols: ext.style.columnCount || '', extCls: ext.classList.contains('dshc-flow'),
      applied: document.querySelectorAll('[data-chat-flow].dshc-flow').length,
      ratio: +ratio.toFixed(2), outsideScroller, before,
    };
    ext.remove();
    window.__dshChatColumns.refresh();
    out.pass = ratio > 1.2 && outsideScroller && out.state === 'active' &&
               out.mainCols === before && Number(out.mainCols) >= 2 && out.mainCls &&
               out.extCols === '' && !out.extCls && out.applied === 1;
    return out;
  })()`);

  await check("R2 容器内等大 flow 仍触发 ambiguous，移除后回 active", `(async () => {
    const d = document.documentElement;
    const sc = document.querySelector('[data-conversation-scroll]');
    const main = sc.querySelector('[data-chat-flow]');
    const r = main.getBoundingClientRect();
    const before = main.style.columnCount || '';
    const fake = document.createElement('div');
    fake.id = 'dshc-adv-inner';
    fake.setAttribute('data-chat-flow', '');
    fake.style.cssText = 'position:fixed;left:' + r.left + 'px;top:' + r.top +
      'px;width:' + r.width + 'px;height:' + r.height + 'px;z-index:1;pointer-events:none';
    for (let i = 0; i < 3; i++) {
      const row = document.createElement('div');
      row.setAttribute('data-chat-flow-key', 'inner-' + i);
      row.textContent = 'x';
      fake.appendChild(row);
    }
    sc.appendChild(fake);
    window.__dshChatColumns.refresh();
    await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
    const mid = {
      state: d.dataset.dshcState,
      mainCols: main.style.columnCount || '', fakeCols: fake.style.columnCount || '',
      applied: document.querySelectorAll('[data-chat-flow].dshc-flow').length,
    };
    fake.remove();
    window.__dshChatColumns.refresh();
    const after = d.dataset.dshcState;
    return {
      pass: mid.state === 'ambiguous' && mid.mainCols === before && mid.fakeCols === '' &&
            mid.applied === 1 && after === 'active',
      ...mid, before, after,
    };
  })()`);

  await check("R5 右栏 embedded 会话（第二个滚动容器）不能抢走主会话", `(async () => {
    const d = document.documentElement;
    const mainSc = document.querySelector('[data-conversation-scroll]');
    const main = mainSc.querySelector('[data-chat-flow]');
    const before = main.style.columnCount || '';
    const side = document.createElement('div');
    side.setAttribute('data-sidebar-chat', '');
    side.style.cssText = 'position:fixed;right:0;top:0;width:520px;height:900px;z-index:1;pointer-events:none';
    const sc2 = document.createElement('div');
    sc2.setAttribute('data-conversation-scroll', '');
    sc2.style.cssText = 'position:absolute;inset:0;overflow:auto';
    const flow2 = document.createElement('div');
    flow2.setAttribute('data-chat-flow', '');
    for (let i = 0; i < 60; i++) {            // 行数故意比主会话多：旧规则会选它
      const row = document.createElement('div');
      row.setAttribute('data-chat-flow-key', 'side-' + i);
      row.textContent = 'side ' + i;
      flow2.appendChild(row);
    }
    sc2.appendChild(flow2); side.appendChild(sc2); document.body.appendChild(side);
    window.__dshChatColumns.refresh();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const out = {
      mainRows: main.querySelectorAll('[data-chat-flow-key]').length,
      sideRows: flow2.querySelectorAll('[data-chat-flow-key]').length,
      state: d.dataset.dshcState,
      mainCols: main.style.columnCount || '', mainCls: main.classList.contains('dshc-flow'),
      sideCols: flow2.style.columnCount || '', sideCls: flow2.classList.contains('dshc-flow'),
      applied: document.querySelectorAll('[data-chat-flow].dshc-flow').length,
      before,
    };
    side.remove();
    window.__dshChatColumns.refresh();
    out.pass = out.sideRows > out.mainRows && out.state === 'active' &&
               out.mainCols === before && Number(out.mainCols) >= 2 && out.mainCls &&
               out.sideCols === '' && !out.sideCls && out.applied === 1;
    return out;
  })()`);

  await check("R3 旧实例 disposer 晚到：不能清掉新实例的 dshc* 与列布局", `(async () => {
    const d = document.documentElement;
    const main = document.querySelector('[data-conversation-scroll] [data-chat-flow]');
    const ownerA = d.dataset.dshcRootOwner;
    const splitAt = (window.__effects || []).length;      // 旧实例 A 的 disposer 区间
    window.__instSplitAt = splitAt;
    const src = await (await fetch('../lib/client.js')).text();
    new Function(src)();                                  // 实例 B apply：抢占根节点归属
    const ownerB = d.dataset.dshcRootOwner;
    window.__dshChatColumns.refresh();                     // 让 B 真正套上列（新实例已生效）
    const colsBefore = main.style.columnCount || '';
    const flowOwnerBefore = main.dataset.dshcOwner || null;
    for (const dispose of window.__effects.slice(0, splitAt)) {
      if (typeof dispose === 'function') dispose();       // 旧实例 A 的 disposer 晚到
    }
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const keys = ['dshc','dshcState','dshcWidth','dshcN','dshcRootOwner'];
    const kept = keys.filter(k => d.dataset[k] !== undefined);
    const out = {
      ownerChanged: ownerA !== ownerB, kept, owner: d.dataset.dshcRootOwner, ownerB,
      state: d.dataset.dshcState, version: d.dataset.dshc,
      cols: main.style.columnCount || '', cls: main.classList.contains('dshc-flow'),
      badge: document.querySelectorAll('.dshc-badge').length,
      styles: document.querySelectorAll('style[data-plugin="dsh-chat-columns"]').length,
      api: typeof window.__dshChatColumns,
      flowOwnerIntact: main.dataset.dshcOwner === flowOwnerBefore,
      colsBefore,
    };
    out.pass = out.ownerChanged && kept.length === keys.length && out.owner === ownerB &&
               out.state === 'active' && out.version === ${JSON.stringify(VERSION)} &&
               out.cols === colsBefore && Number(out.cols) >= 2 && out.cls &&
               out.badge === 1 && out.styles === 1 && out.api === 'object' && out.flowOwnerIntact;
    return out;
  })()`);

  await check("R4 唯一属主卸载：根节点状态、DOM 痕迹、徽标/样式/API 全清", `(async () => {
    const d = document.documentElement;
    const main = document.querySelector('[data-conversation-scroll] [data-chat-flow]');
    for (const dispose of window.__effects.slice(window.__instSplitAt)) {
      if (typeof dispose === 'function') dispose();
    }
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const keys = ['dshc','dshcState','dshcWidth','dshcN','dshcRootOwner'];
    const left = keys.filter(k => d.dataset[k] !== undefined);
    const out = {
      left, cls: main.classList.contains('dshc-flow'), cols: main.style.columnCount || '',
      widthVar: main.style.getPropertyValue('--dsh-chat-content-width') || null,
      badge: document.querySelectorAll('.dshc-badge').length,
      styles: document.querySelectorAll('style[data-plugin="dsh-chat-columns"]').length,
      api: typeof window.__dshChatColumns,
      state: d.dataset.dshcState ?? null,
    };
    out.pass = left.length === 0 && !out.cls && !out.cols && !out.widthVar &&
               out.badge === 0 && out.styles === 0 && out.api === 'undefined';
    return out;
  })()`);
} catch (err) {
  console.error("测试中断:", err.message || String(err));
  results.push({ name: "执行中断", pass: false });
} finally {
  try { ws.close(); } catch { /* 已关闭 */ }
  browser.kill();
  server.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
