const test = require('node:test'); const assert = require('node:assert');
const fs = require('fs'); const path = require('path');
const rd = (f) => fs.readFileSync(path.join(__dirname, '../src/renderer', f), 'utf8');
test('渲染进程不使用原生 confirm/alert/prompt（Windows 上会导致输入框失去键盘焦点）', () => {
  const js = rd('app.js').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(js, /(^|[^.\w])(window\.)?(confirm|alert|prompt)\s*\(/m);
});
test('输入控件永不处于窗口拖拽区', () => {
  const css = rd('style.css');
  assert.match(css, /input,textarea,select,\[contenteditable\]\{-webkit-app-region:no-drag;user-select:text\}/);
  // 只有标题栏是 drag 区
  assert.equal((css.match(/-webkit-app-region:drag/g) || []).length, 1);
});
test('四个标签页且滑块宽度为 1/4', () => {
  const html = rd('index.html');
  assert.deepEqual([...html.matchAll(/data-tab="(\w+)"/g)].map((m) => m[1]), ['tasks', 'recurring', 'notes', 'history']);
  assert.match(rd('style.css'), /\.seg-thumb\{width:calc\(\(100% - 6px\)\/4\)\}/);
});
test('周期弹层含 once/daily/weekly/monthly 与 取消/确定', () => {
  const html = rd('index.html');
  for (const f of ['none', 'daily', 'weekly', 'monthly']) assert.match(html, new RegExp(`data-f="${f}"`));
  assert.match(html, /id="rCancel"/); assert.match(html, /id="rOk"/); assert.match(html, /id="rDay"/); assert.match(html, /type="time" id="rTime"/);
});
test('庆祝动画尊重 prefers-reduced-motion', () => { assert.match(rd('style.css'), /prefers-reduced-motion:reduce\)\{\.cf\{display:none\}/); });
