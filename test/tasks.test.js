const test = require('node:test'); const assert = require('node:assert');
const T = require('../src/tasks');
test('结转：未完成结转到今天，已完成进历史', () => {
  const s = T.emptyState();
  const a = T.addTask(s, 'A', '2026-10-14'); const b = T.addTask(s, 'B', '2026-10-14');
  T.updateTask(s, b.id, { done: true });
  const c = T.addTask(s, 'C', '2026-10-15');
  assert.equal(T.rollover(s, '2026-10-15'), true);
  assert.deepEqual(s.tasks.map((t) => t.text).sort(), ['A', 'C']);
  assert.equal(s.tasks.find((t) => t.id === a.id).date, '2026-10-15');
  assert.equal(s.tasks.find((t) => t.id === a.id).carriedFrom, '2026-10-14');
  assert.deepEqual(s.history.map((t) => t.text), ['B']);
  assert.equal(T.rollover(s, '2026-10-15'), false, '幂等');
  // 今天完成的仍显示
  T.updateTask(s, c.id, { done: true }); T.rollover(s, '2026-10-15');
  assert.ok(s.tasks.find((t) => t.id === c.id).done);
});
test('跨多天结转不重复', () => {
  const s = T.emptyState(); T.addTask(s, 'X', '2026-10-01');
  T.rollover(s, '2026-10-05'); T.rollover(s, '2026-10-06');
  assert.equal(s.tasks.length, 1); assert.equal(s.tasks[0].carriedFrom, '2026-10-01');
});
test('紧急置顶与组内重排', () => {
  const s = T.emptyState(); const d = '2026-10-15';
  const [a, b, c, e] = ['a', 'b', 'c', 'e'].map((x) => T.addTask(s, x, d));
  T.updateTask(s, c.id, { urgent: true }); T.updateTask(s, a.id, { urgent: true });
  assert.deepEqual(T.sorted(s.tasks).map((t) => t.text), ['c', 'a', 'b', 'e']);
  T.reorder(s, [a.id, c.id]); T.reorder(s, [e.id, b.id]);
  assert.deepEqual(T.sorted(s.tasks).map((t) => t.text), ['a', 'c', 'e', 'b']);
  assert.throws(() => T.reorder(s, [a.id, b.id]), /跨组/);
  assert.throws(() => T.reorder(s, [a.id]), /不完整/);
  T.updateTask(s, a.id, { urgent: false });
  assert.deepEqual(T.sorted(s.tasks).map((t) => t.text), ['c', 'e', 'b', 'a']);
  T.deleteTask(s, e.id); assert.deepEqual(T.sorted(s.tasks).map((t) => t.order), [0, 1, 2]);
  assert.throws(() => T.addTask(s, '   ', d));
});
