const test = require('node:test'); const assert = require('node:assert');
const FL = require('../src/float');
// 模拟 Windows 125% 缩放下的窗口：setPosition 会让尺寸因取整逐次 +1（真实 bug 的表现），setBounds 按给定尺寸设置
function fakeWin(x, y, w, h) {
  const b = { x, y, width: w, height: h };
  return { b, isDestroyed: () => false, getBounds: () => ({ ...b }), getSize: () => [b.width, b.height],
    setPosition(nx, ny) { b.x = nx; b.y = ny; b.width += 1; b.height += 1; },
    setBounds(n) { Object.assign(b, n); }, setMinimumSize() {}, setMaximumSize() {}, setResizable() {} };
}
test('反复拖动悬浮球尺寸保持不变', () => {
  const w = fakeWin(700, 400, 64, 64);
  for (let k = 0; k < 50; k++) {           // 50 次拖动
    const st = FL.dragStart(w, { x: 720 + k, y: 420 });
    for (let i = 1; i <= 40; i++) { const p = FL.dragPos(st, { x: 720 + k + i * 1.25, y: 420 + Math.sin(i) * 7.6 }); FL.moveFixed(w, p.x, p.y, 64, 64); }
  }
  assert.deepEqual([w.b.width, w.b.height], [64, 64]);
  assert.ok(Number.isInteger(w.b.x) && Number.isInteger(w.b.y));
});
test('拖动位移准确（按下位置 + 光标位移）', () => {
  const w = fakeWin(100, 100, 64, 64); const st = FL.dragStart(w, { x: 130, y: 130 });
  const p = FL.dragPos(st, { x: 230.6, y: 80.2 }); FL.moveFixed(w, p.x, p.y, 64, 64);
  assert.deepEqual(w.getBounds(), { x: 201, y: 50, width: 64, height: 64 });
});
test('main.js 中悬浮球/气泡不再使用 setPosition', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '../src/main.js'), 'utf8');
  assert.ok(!/(ball|bub)\.setPosition/.test(src));
});
