#!/usr/bin/env node
/**
 * 零依赖构建：把 src/ 的模块与样式拼成一个浏览器 bundle。
 *
 * 产物：lib/client.js（提交进仓库，安装即用）
 * 不做压缩、不做转译、不引入打包器；源码保持可读，构建结果可审查。
 */
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));

/** 模块顺序即依赖顺序：math / adapter 必须最先。 */
const MODULES = [
  'math.js',
  'adapter.js',
  'indexer.js',
  'history.js',
  'newspaper.js',
  'seamless.js',
  'paged.js',
  'flow.js',
  'native-mirror.js',
  'native-flow.js',
  'mirror.js',
  'controller.js',
  'index.js'
];
const STYLES = ['tokens.css', 'layout.css'];

const readSource = (name) => readFile(join(root, 'src', name), 'utf8');

const blocks = [];
for (const name of MODULES) {
  const code = (await readSource(name)).trimEnd();
  new vm.Script(code, { filename: 'src/' + name }); // 只解析，不执行
  blocks.push(`\n/* ============================================================ src/${name} */\n${code}\n`);
}

const css = {};
for (const name of STYLES) css[name] = await readSource(name);

const banner = `/*! dsh-chat-columns ${pkg.version} — generated from src/ by scripts/build.mjs. Do not edit. */`;
const bundle = [
  banner,
  'window.__ModuleLoader__.load({',
  `\tid: ${JSON.stringify(pkg.name)},`,
  '\tfactory: (require) => {',
  '\t\tvar module = { exports: {} };',
  '\t\tvar exports = module.exports;',
  '',
  '\t\tconst DSHC = Object.create(null);',
  `\t\tconst TOKENS_CSS = ${JSON.stringify(css['tokens.css'])};`,
  `\t\tconst LAYOUT_CSS = ${JSON.stringify(css['layout.css'])};`,
  ...blocks,
  '\t\texports.apply = (ctx) => { DSHC.app.start(ctx); };',
  '\t\texports.mount = () => DSHC.app.mount();',
  '\t\texports.unmount = () => DSHC.app.unmount();',
  '\t\texports.inject = ["slots"];',
  '\t\treturn module.exports;',
  '\t}',
  '});',
  ''
].join('\n');

new vm.Script(bundle, { filename: 'lib/client.js' });

await mkdir(join(root, 'lib'), { recursive: true });
const output = join(root, 'lib', 'client.js');
await writeFile(output, bundle, 'utf8');

let newest = 0;
for (const name of MODULES.concat(STYLES)) {
  const info = await stat(join(root, 'src', name));
  newest = Math.max(newest, info.mtimeMs);
}
const built = await stat(output);

console.log(
  `built lib/client.js — ${Buffer.byteLength(bundle)} bytes, ${MODULES.length} modules, ${STYLES.length} stylesheets`
);
console.log(`source newest: ${new Date(newest).toISOString()}`);
console.log(`bundle  built: ${new Date(built.mtimeMs).toISOString()}`);
