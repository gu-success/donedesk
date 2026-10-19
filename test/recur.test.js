const test = require('node:test'); const assert = require('node:assert');
const R = require('../src/recur'); const T = require('../src/tasks');
test('每天', () => assert.equal(R.nextOccurrence({ type: 'daily' }, '2026-12-31'), '2027-01-01'));
test('每周多选', () => {
  const r = { type: 'weekly', weekdays: [1, 3, 5] }; // 一三五；2026-10-15 周四
  assert.equal(R.nextOccurrence(r, '2026-10-15'), '2026-10-16');
  assert.equal(R.nextOccurrence(r, '2026-10-16'), '2026-10-19');
  assert.equal(R.nextOccurrence(r, '2026-10-19', true), '2026-10-19');
});
test('每月 31 号月末收敛', () => {
  const r = { type: 'monthly', day: 31 };
  assert.equal(R.nextOccurrence(r, '2026-01-31'), '2026-02-28');
  assert.equal(R.nextOccurrence(r, '2026-02-28'), '2026-03-31');
  assert.equal(R.nextOccurrence(r, '2026-04-01'), '2026-04-30');
  assert.equal(R.nextOccurrence({ type: 'monthly', day: 29 }, '2028-01-31'), '2028-02-29');
  assert.equal(R.nextOccurrence({ type: 'monthly', day: 30 }, '2027-01-31'), '2027-02-28');
});
test('校验', () => {
  assert.throws(() => R.validateRule({ type: 'weekly', weekdays: [], time: '09:00' }));
  assert.throws(() => R.validateRule({ type: 'daily', time: '25:00' }));
});
test('生成实例、未完成不叠加、提醒', () => {
  const s = T.emptyState();
  const r = R.addRecurring(s, { text: '日报', rule: { type: 'daily', time: '09:00' } }, '2026-10-14');
  assert.equal(s.tasks.length, 1); assert.equal(r.nextDate, '2026-10-15');
  // 未完成 -> 跨三天，只保留一份
  for (const d of ['2026-10-15', '2026-10-16', '2026-10-17']) { T.rollover(s, d); R.materialize(s, d); }
  assert.equal(s.tasks.length, 1); assert.equal(r.nextDate, '2026-10-18');
  // 完成后次日生成新实例，旧的进历史
  T.updateTask(s, s.tasks[0].id, { done: true });
  T.rollover(s, '2026-10-18'); R.materialize(s, '2026-10-18');
  assert.equal(s.tasks.length, 1); assert.equal(s.tasks[0].done, false); assert.equal(s.history.length, 1);
  // 今天完成后不在同一天再生成
  T.updateTask(s, s.tasks[0].id, { done: true }); R.materialize(s, '2026-10-18');
  assert.equal(s.tasks.length, 1);
  T.updateTask(s, s.tasks[0].id, { done: false });
  assert.equal(R.dueReminders(s, new Date(2026, 9, 18, 8, 59)).length, 0);
  assert.equal(R.dueReminders(s, new Date(2026, 9, 18, 9, 0)).length, 1);
  assert.equal(R.dueReminders(s, new Date(2026, 9, 18, 9, 5)).length, 0, '只提醒一次');
});
test('每周：非当日创建不立即出现', () => {
  const s = T.emptyState();
  const r = R.addRecurring(s, { text: '周会', rule: { type: 'weekly', weekdays: [1], time: '10:00' } }, '2026-10-15');
  assert.equal(s.tasks.length, 0); assert.equal(r.nextDate, '2026-10-19');
  R.materialize(s, '2026-10-19'); assert.equal(s.tasks.length, 1); assert.equal(r.nextDate, '2026-10-26');
});
