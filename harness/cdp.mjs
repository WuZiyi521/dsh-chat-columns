#!/usr/bin/env node
/**
 * 极简 CDP 客户端（Node 22 自带 WebSocket），用来在**真实 DSH 页面**上跑验收。
 *
 *   node cdp.mjs list
 *   node cdp.mjs eval 'document.title'
 *   node cdp.mjs eval-file probe.js          # 执行一个表达式文件，返回 JSON
 *   node cdp.mjs shot /tmp/a.png
 *   node cdp.mjs resize 1000 800
 *
 * 连接地址默认 http://127.0.0.1:9222（通过 ssh -L 转发到主力机的 Edge）。
 */
import { readFileSync, writeFileSync } from "node:fs";

const BASE = process.env.CDP_BASE || "http://127.0.0.1:9222";

async function targets() {
  const r = await fetch(`${BASE}/json/list`);
  return r.json();
}

async function pageTarget() {
  const list = await targets();
  const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
  if (!page) throw new Error("没有可用的 page target");
  return page;
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      }
    });
  }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => {
      ws.addEventListener("open", res, { once: true });
      ws.addEventListener("error", rej, { once: true });
    });
    return new Cdp(ws);
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    });
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    }
    return r.result?.value;
  }
  close() {
    this.ws.close();
  }
}

const [cmd, ...args] = process.argv.slice(2);

if (cmd === "list") {
  const list = await targets();
  for (const t of list) console.log(`${t.type}\t${t.url.slice(0, 80)}\t${t.title.slice(0, 40)}`);
  process.exit(0);
}

const cdp = await Cdp.connect((await pageTarget()).webSocketDebuggerUrl);

try {
  if (cmd === "eval") {
    const out = await cdp.eval(args.join(" "));
    console.log(typeof out === "string" ? out : JSON.stringify(out, null, 2));
  } else if (cmd === "eval-file") {
    const expr = readFileSync(args[0], "utf8");
    const out = await cdp.eval(expr);
    console.log(JSON.stringify(out, null, 2));
  } else if (cmd === "shot") {
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
    writeFileSync(args[0], Buffer.from(data, "base64"));
    console.log(`saved ${args[0]}`);
  } else if (cmd === "resize") {
    const [w, h] = args.map(Number);
    const { windowId } = await cdp.send("Browser.getWindowForTarget");
    await cdp.send("Browser.setWindowBounds", { windowId, bounds: { width: w, height: h } });
    console.log(`resized to ${w}x${h}`);
  } else {
    console.error("用法: list | eval <expr> | eval-file <file> | shot <png> | resize <w> <h>");
    process.exitCode = 2;
  }
} finally {
  cdp.close();
}
