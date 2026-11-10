#!/usr/bin/env node
/**
 * 静态检查：包契约、语法、宿主选择器隔离、CSS 作用域、产物新鲜度、bundle 可物化。
 * 不跑浏览器、不模拟宿主，只守住「不越界、不污染、产物可信」这几条底线。
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const notes = [];

function fail(message) {
  problems.push(message);
}
function note(message) {
  notes.push(message);
}

/* ------------------------------------------------------------ 1. 包契约 */

const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
if (pkg.name !== 'dsh-chat-columns-3') fail('package.json name 必须是 dsh-chat-columns-3');
if (!/^\d+\.\d+\.\d+/.test(pkg.version || '')) fail('package.json version 不合法');
if (pkg.main !== 'lib/index.js') fail('package.json main 必须是 lib/index.js');
if (!pkg.exports || pkg.exports['./client'] !== './lib/client.js') fail('package.json 必须导出 ./client → lib/client.js');
if (!pkg.dsh || !pkg.dsh.client) fail('package.json 缺少 dsh.client 声明');
if (pkg.dsh && pkg.dsh.client && pkg.dsh.client.platform !== 'web') fail('dsh.client.platform 必须是 web');
if (!pkg.dsh || !pkg.dsh.bundle || !pkg.dsh.bundle.patch) fail('package.json 缺少 dsh.bundle.patch');

const patch = await readFile(join(root, 'cordis.patch.yml'), 'utf8');
if (!patch.includes('dsh-chat-columns-3')) fail('cordis.patch.yml 没有引用包名');
if (!patch.includes('chat-columns-3')) fail('cordis.patch.yml 缺少 bundle id');

const hostEntry = await readFile(join(root, 'lib', 'index.js'), 'utf8');
if (!/export function apply/.test(hostEntry)) fail('lib/index.js 必须导出一个空的 apply');

/* -------------------------------------------------------------- 2. 语法 */

const srcDir = join(root, 'src');
const srcFiles = (await readdir(srcDir)).sort();
const jsFiles = srcFiles.filter((name) => name.endsWith('.js'));
const cssFiles = srcFiles.filter((name) => name.endsWith('.css'));

for (const name of jsFiles) {
  const code = await readFile(join(srcDir, name), 'utf8');
  try {
    new vm.Script(code, { filename: 'src/' + name });
  } catch (error) {
    fail('src/' + name + ' 语法错误: ' + error.message);
  }
}

/* ------------------------------------------------- 3. 宿主选择器隔离 */

const HOST_LITERALS = [
  'data-conversation-scroll',
  'data-conversation-session',
  'data-conversation-content',
  'data-composer-seat',
  'data-chat-flow',
  'data-chat-following-tail',
  'data-chat-anchor-key',
  'data-chat-node-key',
  'data-chat-group-key',
  'data-chat-turn',
  '--dsh-chat-content-width',
  'data-ds-dark-theme',
  'data-ds-theme-source'
];

const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

for (const name of jsFiles.concat(cssFiles)) {
  if (name === 'adapter.js') continue;
  const code = stripComments(await readFile(join(srcDir, name), 'utf8'));
  for (const literal of HOST_LITERALS) {
    if (code.includes(literal)) {
      fail('宿主契约字面量 "' + literal + '" 只允许出现在 src/adapter.js（出现在 ' + name + '）');
    }
  }
}

/* ------------------------------------------------------- 4. CSS 作用域 */

function selectorsOf(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  const pattern = /([^{}]+)\{/g;
  let match;
  while ((match = pattern.exec(clean))) {
    const prelude = match[1].trim();
    if (!prelude || prelude.startsWith('@')) continue;
    for (const part of prelude.split(',')) {
      const selector = part.trim();
      if (!selector) continue;
      if (/^(from|to|\d+(\.\d+)?%)$/.test(selector)) continue; // keyframes
      out.push(selector);
    }
  }
  return out;
}

for (const name of cssFiles) {
  const css = await readFile(join(srcDir, name), 'utf8');
  for (const selector of selectorsOf(css)) {
    const scoped = selector.startsWith('#dshc-root') || selector.startsWith('[data-dshc');
    if (!scoped) fail('CSS 作用域越界（' + name + '）: ' + selector);
    if (/^(button|input|pre|table|img|a|div|span|svg|style|body|html)\b/.test(selector)) {
      fail('CSS 里出现了裸标签选择器（' + name + '）: ' + selector);
    }
  }
}

/* ------------------------------------------------------ 5. 产物新鲜度 */

const bundlePath = join(root, 'lib', 'client.js');
let bundleStat;
try {
  bundleStat = await stat(bundlePath);
} catch (error) {
  fail('lib/client.js 不存在，先跑 npm run build');
}
if (bundleStat) {
  let newest = 0;
  for (const name of srcFiles) {
    const info = await stat(join(srcDir, name));
    newest = Math.max(newest, info.mtimeMs);
  }
  if (bundleStat.mtimeMs + 1 < newest) fail('lib/client.js 比 src/ 旧，需要重新构建');

  const bundle = await readFile(bundlePath, 'utf8');
  for (const name of jsFiles) {
    if (!bundle.includes('src/' + name + ' */')) fail('bundle 缺少模块: ' + name);
  }
  if (!bundle.includes('window.__ModuleLoader__.load(')) fail('bundle 没有走宿主模块加载器');
  if (!bundle.includes('id: ' + JSON.stringify(pkg.name))) fail('bundle 的 id 与包名不一致');

  // 6. 可物化：真正跑一遍 factory（不接触 DOM）。
  let exportsValue = null;
  const sandbox = {
    window: {
      __ModuleLoader__: {
        load(spec) {
          exportsValue = spec.factory(() => ({}));
        }
      }
    },
    console
  };
  const context = vm.createContext(sandbox);
  try {
    vm.runInContext(bundle, context, { filename: 'lib/client.js' });
  } catch (error) {
    fail('bundle 无法物化: ' + error.message);
  }
  if (!exportsValue || typeof exportsValue.apply !== 'function') fail('bundle 没有导出 apply');
  if (!exportsValue || typeof exportsValue.mount !== 'function') fail('bundle 没有导出 mount');
  if (!exportsValue || typeof exportsValue.unmount !== 'function') fail('bundle 没有导出 unmount');
}

/* ---------------------------------------------------------------- 结果 */

if (notes.length) for (const message of notes) console.log('  note  ' + message);

if (problems.length) {
  console.error('\n静态检查未通过：');
  for (const problem of problems) console.error('  - ' + problem);
  process.exit(1);
}

console.log(
  `静态检查通过：${jsFiles.length} 个模块、${cssFiles.length} 个样式表、` +
    `${(await stat(bundlePath)).size} 字节产物`
);
