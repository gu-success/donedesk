const test = require('node:test'); const assert = require('node:assert');
const T = require('../src/tasks');
function seed() {
  const s = T.emptyState();
  const a = T.addTask(s, 'Alpha report', '2026-10-10'); T.addTask(s, 'Beta call', '2026-10-10', true);
  T.updateTask(s, a.id, { done: true });
  T.rollover(s, '2026-10-11');           // Alpha -> 历史；Beta 结转
  const c = T.addTask(s, '买牛奶', '2026-10-11'); T.updateTask(s, c.id, { done: true });
  T.rollover(s, '2026-10-12');           // 买牛奶 -> 历史；Beta 再次结转
  return s;
}
test('历史：按日期新->旧分组，含已完成与结转记录', () => {
  const r = T.historyQuery(seed());
  assert.deepEqual(r.days.map((d) => d.date), ['2026-10-11', '2026-10-10']);
  assert.deepEqual(r.dates, ['2026-10-11', '2026-10-10']);
  const d10 = r.days[1].items;
  assert.ok(d10.find((x) => x.text === 'Alpha report' && x.done));
  assert.ok(d10.find((x) => x.text === 'Beta call' && !x.done && x.carriedTo === '2026-10-11' && x.urgent));
  assert.ok(r.days[0].items.find((x) => x.text === 'Beta call' && x.carriedTo === '2026-10-12'));
  assert.equal(r.total, 4);
});
test('历史：搜索（不区分大小写）与按日期筛选', () => {
  const s = seed();
  assert.deepEqual(T.historyQuery(s, { q: 'BETA' }).days.flatMap((d) => d.items.map((x) => x.date)), ['2026-10-11', '2026-10-10']);
  assert.equal(T.historyQuery(s, { q: '牛奶' }).total, 1);
  assert.equal(T.historyQuery(s, { date: '2026-10-10' }).total, 2);
  assert.equal(T.historyQuery(s, { q: 'zzz' }).total, 0);
});
test('历史：分页，大量数据只返回一页', () => {
  const s = T.emptyState();
  for (let i = 0; i < 3000; i++) s.history.push({ id: 'id' + i, text: 'task ' + i, done: true, date: `2025-${String(1 + (i % 12)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}` });
  const t0 = Date.now(); const p1 = T.historyQuery(s, { limit: 100 });
  assert.ok(Date.now() - t0 < 200);
  assert.equal(p1.days.reduce((n, d) => n + d.items.length, 0), 100); assert.equal(p1.next, 100); assert.equal(p1.total, 3000);
  const p2 = T.historyQuery(s, { offset: p1.next, limit: 100 });
  assert.notEqual(p2.days[0].items[0].hid, p1.days[0].items[0].hid);
  assert.equal(T.historyQuery(s, { limit: 99999 }).days.reduce((n, d) => n + d.items.length, 0), 500, '单页上限 500');
  assert.equal(T.historyQuery(s, { offset: 2950, limit: 100 }).next, null);
});
test('历史：恢复到今天（只读，历史保持不变）', () => {
  const s = seed(); const before = T.historyQuery(s).total;
  const hid = T.historyQuery(s, { q: 'Alpha' }).days[0].items[0].hid;
  const t = T.restoreFromHistory(s, hid, '2026-10-12');
  assert.equal(t.text, 'Alpha report'); assert.equal(t.date, '2026-10-12'); assert.equal(t.done, false);
  assert.ok(s.tasks.find((x) => x.id === t.id));
  assert.equal(T.historyQuery(s).total, before);
  assert.throws(() => T.restoreFromHistory(s, 'nope', '2026-10-12'));
});
test('旧数据兼容：无 carried 字段、历史无 hid', () => {
  const s = T.normalize({ tasks: [], history: [{ id: 'x', text: 'old', done: true, date: '2026-01-01' }] });
  assert.deepEqual(s.carried, []);
  const r = T.historyQuery(s); assert.equal(r.days[0].items[0].hid, 'x@2026-01-01');
});
