#!/usr/bin/env node
/**
 * 纯计算层回归：列数公式、B 无缝的打包与投影。
 * 不需要浏览器，也不需要 DSH：src/math.js 是纯函数。
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const code = await readFile(join(root, 'src', 'math.js'), 'utf8');
const DSHC = {};
vm.runInNewContext(code, { DSHC, Math, Number, String, parseInt, Object, Array });
const math = DSHC.math;

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('  ok  ' + name);
  } catch (error) {
    console.error('  FAIL ' + name);
    throw error;
  }
}

console.log('math: 列数');

test('自动列宽阈值 1389 / 1289 / 813', () => {
  assert.equal(math.fit(1389, math.AUTO_MIN, math.GAP), 3);
  assert.equal(math.fit(1289, math.AUTO_MIN, math.GAP), 2);
  assert.equal(math.fit(813, math.AUTO_MIN, math.GAP), 1);
});

test('分母含 gap：1180px 只够 2 列', () => {
  // 1180/420 = 2.8 → 若漏加 gap 会算成 2 列；这里验证公式本身
  assert.equal(math.fit(1180, math.AUTO_MIN, math.GAP), 2);
  assert.equal(math.fit(1340, math.AUTO_MIN, math.GAP), 3);
});

test('手动 3 列但宽度不够 → 被硬下限压回', () => {
  assert.equal(math.resolveColumns(830, '3', false), 2);
  assert.equal(math.resolveColumns(830, '2', false), 2);
  assert.equal(math.resolveColumns(250, '3', false), 1);
});

test('手动 1 列 / 自动 / 窄屏', () => {
  assert.equal(math.resolveColumns(2400, '1', false), 1);
  assert.equal(math.resolveColumns(2400, 'auto', false), 3);
  assert.equal(math.resolveColumns(2400, 'auto', true), 1);
  assert.equal(math.resolveColumns(0, 'auto', false), 1);
});

test('列宽等分', () => {
  assert.equal(math.columnWidth(1000, 3, 40), (1000 - 80) / 3);
  assert.equal(math.columnWidth(1000, 1, 40), 1000);
});

console.log('math: B 无缝打包');

test('三条消息装不进一列时另起一列', () => {
  const packed = math.pack([{ height: 100 }, { height: 100 }, { height: 100 }], 300, 12);
  assert.deepEqual(Array.from(packed.starts), [0, 112, 300]);
  assert.equal(packed.pages, 2);
  assert.equal(packed.total, 600);
});

test('超高消息独占列段，列内只排一屏', () => {
  const packed = math.pack([{ height: 600 }, { height: 50 }], 300, 12);
  assert.equal(packed.tall[0], true);
  assert.equal(packed.heights[0], 300);
  assert.deepEqual(Array.from(packed.starts), [0, 300]);
  assert.equal(packed.pages, 2);
});

test('任何情况下消息都不跨列', () => {
  const H = 300;
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let round = 0; round < 200; round += 1) {
    const blocks = [];
    const count = 1 + Math.floor(rnd() * 12);
    for (let i = 0; i < count; i += 1) blocks.push({ height: Math.floor(rnd() * 520) });
    const packed = math.pack(blocks, H, 16);
    for (let i = 0; i < blocks.length; i += 1) {
      const start = packed.starts[i];
      const end = start + packed.heights[i];
      const pageEnd = (Math.floor(start / H) + 1) * H;
      assert.ok(end <= pageEnd + 0.5, `第 ${i} 条越过了列底: ${end} > ${pageEnd}`);
      assert.ok(start + packed.heights[i] <= packed.total + 0.5);
    }
  }
});

console.log('math: B′ 连续流');

test('连续堆叠：starts 是前缀和，不再按页对齐', () => {
  const flow = math.flowStarts([{ height: 120 }, { height: 80 }, { height: 300, gap: 20 }], 12);
  assert.deepEqual([...flow.starts], [0, 132, 232]);
  assert.equal(flow.total, 532);
  assert.deepEqual([...flow.heights], [120, 80, 300]);
});

test('底边单调：starts[i+1] + 高 >= starts[i] + 高（二分的前提）', () => {
  const flow = math.flowStarts([{ height: 500 }, { height: 10 }, { height: 900 }, { height: 0 }], 12);
  let last = -1;
  for (let i = 0; i < flow.starts.length; i += 1) {
    const bottom = flow.starts[i] + flow.heights[i];
    assert.ok(bottom >= last, 'i=' + i);
    last = bottom;
  }
});

test('可见范围：二分只返回与窗口相交的消息', () => {
  const flow = math.flowStarts([{ height: 100 }, { height: 100 }, { height: 100 }, { height: 100 }], 0);
  // 窗口 [50, 250) 覆盖第 0 条尾部、第 1 条整条、第 2 条头部
  const r = math.visibleRange(flow.starts, flow.heights, 50, 200);
  assert.deepEqual({ from: r.from, to: r.to }, { from: 0, to: 3 });
});

test('可见范围：空集合与窗口落在末尾之外', () => {
  assert.deepEqual({ ...math.visibleRange([], [], 0, 300) }, { from: 0, to: 0 });
  const flow = math.flowStarts([{ height: 100 }], 0);
  const r = math.visibleRange(flow.starts, flow.heights, 500, 300);
  assert.deepEqual({ from: r.from, to: r.to }, { from: 1, to: 1 });
});

test('超长消息：按可见上限裁剪后仍可参与二分', () => {
  const limit = 600;
  const flow = math.flowStarts([{ height: 400 }, { height: Math.min(2000, limit) }, { height: 100 }], 0);
  assert.equal(flow.total, 1100);
  const r = math.visibleRange(flow.starts, flow.heights, 300, 600);
  assert.ok(r.from <= 1 && r.to >= 2);
});

console.log('math: B 投影');

test('逻辑位置按 H 落入对应列', () => {
  assert.deepEqual({ ...math.project(0, 0, 300) }, { column: 0, top: 0 });
  assert.deepEqual({ ...math.project(300, 0, 300) }, { column: 1, top: 0 });
  assert.deepEqual({ ...math.project(300, 100, 300) }, { column: 0, top: 200 });
  assert.deepEqual({ ...math.project(0, 100, 300) }, { column: -1, top: 200 });
  assert.deepEqual({ ...math.project(1000, 300, 300) }, { column: 2, top: 100 });
});

test('每列显示 [s+cH, s+(c+1)H)', () => {
  const H = 300;
  const s = 120;
  const y = 1000; // 逻辑位置
  const p = math.project(y, s, H);
  const windowStart = s + p.column * H;
  assert.ok(y >= windowStart && y < windowStart + H);
  assert.equal(y - windowStart, p.top);
});

console.log(`\n${passed} 项通过`);
