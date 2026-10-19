'use strict';
// 周期任务：每天 / 每周(多选星期) / 每月(某日，超出月末取最后一天)，带提醒时间。
const crypto = require('crypto');
const { addTask } = require('./tasks');

function parse(d) { const [y, m, dd] = d.split('-').map(Number); return new Date(y, m - 1, dd, 12); }
function fmt(dt) { const p = (n) => String(n).padStart(2, '0'); return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`; }
function addDays(d, n) { const x = parse(d); x.setDate(x.getDate() + n); return fmt(x); }

function validateRule(r) {
  if (!r || !['daily', 'weekly', 'monthly'].includes(r.type)) throw new Error('无效的重复类型');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time || '')) throw new Error('时间格式应为 HH:MM');
  if (r.type === 'weekly' && (!Array.isArray(r.weekdays) || !r.weekdays.length || r.weekdays.some((w) => !Number.isInteger(w) || w < 0 || w > 6))) throw new Error('请选择星期');
  if (r.type === 'monthly' && !(Number.isInteger(r.day) && r.day >= 1 && r.day <= 31)) throw new Error('日期应为 1-31');
  return { type: r.type, time: r.time, weekdays: r.type === 'weekly' ? [...new Set(r.weekdays)].sort() : undefined, day: r.type === 'monthly' ? r.day : undefined };
}

function occursOn(rule, d) {
  const dt = parse(d);
  if (rule.type === 'daily') return true;
  if (rule.type === 'weekly') return rule.weekdays.includes(dt.getDay());
  const last = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
  return dt.getDate() === Math.min(rule.day, last);
}

// 返回 >= from（inclusive=true）或 > from 的第一个日期
function nextOccurrence(rule, from, inclusive = false) {
  let d = inclusive ? from : addDays(from, 1);
  for (let i = 0; i < 800; i++, d = addDays(d, 1)) if (occursOn(rule, d)) return d;
  throw new Error('找不到下一次');
}

function addRecurring(state, { text, urgent, rule }, today) {
  text = String(text || '').trim(); if (!text) throw new Error('任务内容不能为空');
  const r = { id: crypto.randomUUID(), text, urgent: !!urgent, rule: validateRule(rule), nextDate: null };
  r.nextDate = nextOccurrence(r.rule, today, true);
  state.recurring = state.recurring || [];
  state.recurring.push(r);
  materialize(state, today);
  return r;
}

function updateRecurring(state, id, patch, today) {
  const r = (state.recurring || []).find((x) => x.id === id); if (!r) throw new Error('周期任务不存在');
  if ('text' in patch) { const t = String(patch.text || '').trim(); if (!t) throw new Error('任务内容不能为空'); r.text = t; }
  if ('urgent' in patch) r.urgent = !!patch.urgent;
  let resched = false;
  if ('rule' in patch) { r.rule = validateRule(patch.rule); resched = true; }
  if ('paused' in patch) { const p = !!patch.paused; if (!p && r.paused) resched = true; r.paused = p; }
  if (resched) r.nextDate = nextOccurrence(r.rule, today, true);
  // 同步今天尚未完成的实例
  for (const t of state.tasks) if (t.recurId === r.id && !t.done) { t.text = r.text; t.urgent = r.urgent; t.remindTime = r.rule.time; }
  if (!r.paused) materialize(state, today);
  return r;
}

function deleteRecurring(state, id) { state.recurring = (state.recurring || []).filter((r) => r.id !== id); }

// 到期的周期任务生成今天的实例；若已有未完成实例（被结转）则不重复生成，只推进 nextDate。
function materialize(state, today) {
  let changed = false;
  for (const r of state.recurring || []) {
    if (r.paused || !r.nextDate || r.nextDate > today) continue;
    const exists = state.tasks.some((t) => t.recurId === r.id && (!t.done || t.date === today));
    if (!exists) {
      const t = addTask(state, r.text, today, r.urgent);
      t.recurId = r.id; t.remindTime = r.rule.time; t.occurrence = r.nextDate;
    }
    r.nextDate = nextOccurrence(r.rule, today);
    changed = true;
  }
  return changed;
}

// 返回需要提醒的任务（今天、未完成、已到时间、未提醒过），并标记已提醒
function dueReminders(state, now = new Date()) {
  const today = fmt(now); const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const out = [];
  for (const t of state.tasks) {
    if (t.recurId && t.remindTime && !t.done && t.date === today && t.notifiedOn !== today && t.remindTime <= hm) { t.notifiedOn = today; out.push(t); }
  }
  return out;
}

module.exports = { updateRecurring, validateRule, occursOn, nextOccurrence, addRecurring, deleteRecurring, materialize, dueReminders, addDays };
