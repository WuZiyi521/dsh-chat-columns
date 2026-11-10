#!/usr/bin/env node
/**
 * 把本插件装进某个 DSH profile（或从 profile 退回）。
 *
 * **不依赖 dsh / pnpm 在 PATH 上**：只用 Node 自己完成三件事——
 *  1. 备份 profile 的 package.json → package.json.bak-dshc3；
 *  2. 在 profile/node_modules 里建一个指向本目录的链接（Windows 用 junction，
 *     等价于 pnpm 的 `link:`；2.0 当时就是这么被 link 进去的）；
 *  3. 写 profile/package.json 的 dependencies 与 dsh.profile.bundles，
 *     并把旧的 dsh-chat-columns-2 从 bundles 摘掉（包留在 node_modules，随时可退回）。
 *
 * cordis.yml 不用改：宿主每次启动按 profile bundles 重新生成。
 *
 * 用法：
 *   node scripts/install.mjs --profile <name> [--dry-run]
 *   node scripts/install.mjs --uninstall --profile <name> [--dry-run]
 */
import { readFile, writeFile, copyFile, stat, lstat, symlink, rm, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(join(projectDir, 'package.json'), 'utf8'));
const OLD_PACKAGE = 'dsh-chat-columns-2';

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const uninstall = argv.includes('--uninstall');
const profileFlag = argv.indexOf('--profile');
const profileName = profileFlag >= 0 ? argv[profileFlag + 1] : '';

function die(message) {
  console.error('\n✗ ' + message);
  process.exit(1);
}

if (!profileName) die('缺少 --profile <name>（例如 --profile 0.2.1-alpha.2）');

const home = process.env.DSH_HOME || join(homedir(), '.dsh');
const profileDir = join(home, 'profiles', profileName);
const manifestPath = join(profileDir, 'package.json');
const modulesDir = join(profileDir, 'node_modules');
const linkPath = join(modulesDir, pkg.name);
const backupPath = manifestPath + '.bak-dshc3';

try {
  await stat(manifestPath);
} catch (error) {
  die('找不到 profile：' + manifestPath);
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (!manifest.dsh || !manifest.dsh.profile || !Array.isArray(manifest.dsh.profile.bundles)) {
  die('profile 的 package.json 里没有 dsh.profile.bundles，拒绝改动');
}

const bundles = manifest.dsh.profile.bundles.slice();
const dependencies = Object.assign({}, manifest.dependencies);

let linkExists = false;
try {
  await lstat(linkPath);
  linkExists = true;
} catch (error) {
  linkExists = false;
}

const nextBundles = uninstall
  ? bundles.filter((name) => name !== pkg.name)
  : bundles.filter((name) => name !== OLD_PACKAGE).concat(bundles.includes(pkg.name) ? [] : [pkg.name]);

const bundlesChanged = JSON.stringify(nextBundles) !== JSON.stringify(bundles);

console.log('profile : ' + profileDir);
console.log('bundles :' + (bundlesChanged ? '' : ' （无变化）'));
if (bundlesChanged) {
  for (const name of nextBundles) console.log('  - ' + name);
  if (!uninstall && bundles.includes(OLD_PACKAGE)) {
    console.log('  （已从 bundles 摘掉 ' + OLD_PACKAGE + '；它的包仍留在 node_modules，随时可退回）');
  }
}
console.log('link    : ' + linkPath + ' → ' + projectDir + (linkExists ? '（已存在）' : '（待创建）'));

if (dryRun) {
  console.log('\n--dry-run：没有写入任何文件');
  process.exit(0);
}

// 1. 备份
await copyFile(manifestPath, backupPath);
console.log('备份    : ' + backupPath);

// 2. 链接（Windows junction 不需要管理员权限，等价于 pnpm 的 link:）
if (uninstall) {
  if (linkExists) {
    await rm(linkPath, { recursive: true, force: true });
    console.log('链接    : 已删除');
  }
  delete dependencies[pkg.name];
} else {
  if (!linkExists) {
    await mkdir(modulesDir, { recursive: true });
    await symlink(projectDir, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
    console.log('链接    : 已创建');
  }
  dependencies[pkg.name] = 'link:' + projectDir.replace(/\\/g, '/');
}

// 3. 写回 manifest
const next = Object.assign({}, manifest, {
  dependencies,
  dsh: Object.assign({}, manifest.dsh, {
    profile: Object.assign({}, manifest.dsh.profile, { bundles: nextBundles })
  })
});
await writeFile(manifestPath, JSON.stringify(next, null, 2) + '\n', 'utf8');

console.log('\n✓ ' + (uninstall ? '已从 profile 移除' : '已写入 profile'));
console.log('\n下一步：');
if (uninstall) {
  console.log('  1. 重启 DSHWeb');
  console.log('  2. 想用回旧版：在 GUI 的 Plugins 里 Enable dsh-chat-columns-2');
} else {
  console.log('  1. 重启 DSHWeb（dsh-web 就是当前会话本身，重启会让当前对话断一下）');
  console.log('  2. 刷新页面 → 进一个长会话 → 点右上角胶囊切换模式');
  console.log('  3. 出问题在控制台执行 __dshc.diagnose()');
}
