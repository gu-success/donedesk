const test = require('node:test'); const assert = require('node:assert');
const R = require('../src/recur');
const mk = () => ({ tasks: [], recurring: [] });
test('编辑周期规则：文本/紧急/规则同步到今天未完成实例并重新排期', () => {
  const s = mk(); const r = R.addRecurring(s, { text: '晨会', urgent: false, rule: { type: 'daily', time: '09:00' } }, '2026-10-15');
  assert.equal(s.tasks.length, 1);
  R.updateRecurring(s, r.id, { text: '站会', urgent: true, rule: { type: 'weekly', weekdays: [1], time: '10:30' } }, '2026-10-15');
  assert.equal(s.tasks.length, 1, '不重复生成');
  assert.equal(s.tasks[0].text, '站会'); assert.equal(s.tasks[0].urgent, true); assert.equal(s.tasks[0].remindTime, '10:30');
  assert.equal(r.nextDate, '2026-10-19');
});
test('暂停后不生成；恢复后从今天重新计算', () => {
  const s = mk(); const r = R.addRecurring(s, { text: 'A', rule: { type: 'daily', time: '08:00' } }, '2026-10-15');
  s.tasks[0].done = true;
  R.updateRecurring(s, r.id, { paused: true }, '2026-10-15');
  assert.equal(R.materialize(s, '2026-10-16'), false);
  assert.equal(s.tasks.filter((t) => t.date === '2026-10-16').length, 0);
  R.updateRecurring(s, r.id, { paused: false }, '2026-10-18');
  assert.equal(r.paused, false);
  assert.equal(s.tasks.filter((t) => t.date === '2026-10-18').length, 1);
  assert.equal(r.nextDate, '2026-10-19');
});
test('无效输入报错', () => {
  const s = mk(); const r = R.addRecurring(s, { text: 'A', rule: { type: 'daily', time: '08:00' } }, '2026-10-15');
  assert.throws(() => R.updateRecurring(s, r.id, { text: '  ' }, '2026-10-15'), /不能为空/);
  assert.throws(() => R.updateRecurring(s, 'nope', {}, '2026-10-15'), /不存在/);
  assert.throws(() => R.updateRecurring(s, r.id, { rule: { type: 'weekly', weekdays: [], time: '08:00' } }, '2026-10-15'), /星期/);
});
