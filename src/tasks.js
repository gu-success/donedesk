'use strict';
// 纯逻辑：任务结转、排序、重排。无 I/O，便于单元测试。
const crypto = require('crypto');

function localDate(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function emptyState() { return { version: 1, tasks: [], history: [], recurring: [], carried: [] }; }

function normalize(state) {
  const s = state && typeof state === 'object' ? state : {};
  return {
    version: 1,
    tasks: Array.isArray(s.tasks) ? s.tasks.filter((t) => t && typeof t.text === 'string') : [],
    history: Array.isArray(s.history) ? s.history : [],
    recurring: Array.isArray(s.recurring) ? s.recurring : [],
    carried: Array.isArray(s.carried) ? s.carried : [],
  };
}

// 日期翻转：之前日期已完成的 -> 历史；未完成的 -> 结转到 today。返回是否发生变化。
function rollover(state, today) {
  let changed = false;
  const keep = [];
  for (const t of state.tasks) {
    if (t.date < today) {
      changed = true;
      if (t.done) { state.history.push({ ...t }); continue; }
      (state.carried || (state.carried = [])).push({ hid: crypto.randomUUID(), taskId: t.id, text: t.text, urgent: !!t.urgent, date: t.date, to: today });
      if (state.carried.length > CARRY_MAX) state.carried.splice(0, state.carried.length - CARRY_MAX);
      t.carriedFrom = t.carriedFrom || t.date;
      t.date = today;
    }
    keep.push(t);
  }
  state.tasks = keep;
  if (changed) renumber(state);
  return changed;
}

const CARRY_MAX = 5000;
// ---------- 历史 ----------
// 历史 = 已完成并归档的任务（history）+ 未完成被结转的记录（carried）。只读，可“恢复到今天”。
function historyItems(state) {
  const done = (state.history || []).map((t) => ({ hid: t.hid || `${t.id}@${t.date}`, text: t.text, urgent: !!t.urgent, date: t.date, done: true, doneAt: t.doneAt, carriedFrom: t.carriedFrom }));
  const car = (state.carried || []).map((c) => ({ hid: c.hid, text: c.text, urgent: !!c.urgent, date: c.date, done: false, carriedTo: c.to }));
  return done.concat(car).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (Number(b.done) - Number(a.done)) || (Number(b.urgent) - Number(a.urgent))));
}
// opts: { q 搜索, date 指定日期, offset, limit(默认 100，最大 500) }
function historyQuery(state, opts = {}) {
  const q = String(opts.q || '').trim().toLowerCase();
  const limit = Math.min(Math.max(Number(opts.limit) || 100, 1), 500), offset = Math.max(Number(opts.offset) || 0, 0);
  const all = historyItems(state);
  const dates = [...new Set(all.map((x) => x.date))]; // 新 -> 旧
  let items = all;
  if (opts.date) items = items.filter((x) => x.date === opts.date);
  if (q) items = items.filter((x) => x.text.toLowerCase().includes(q));
  const page = items.slice(offset, offset + limit);
  const days = [];
  for (const x of page) { let d = days[days.length - 1]; if (!d || d.date !== x.date) days.push(d = { date: x.date, items: [] }); d.items.push(x); }
  return { days, total: items.length, offset, next: offset + page.length < items.length ? offset + page.length : null, dates };
}
function restoreFromHistory(state, hid, today) {
  const it = historyItems(state).find((x) => x.hid === hid);
  if (!it) throw new Error('历史记录不存在');
  return addTask(state, it.text, today, it.urgent);
}

// 整表序：未完成(周期→昨日继承→紧急→每日) → 已完成垫底。勾选完成即掉入已完成区。
// 紧急用 urgent 字段；与周期/继承重叠时周期/继承优先（不单独抬到已完成之上）。
function taskKind(t) {
  if (t.recurId) return 0;
  if (t.carriedFrom) return 1;
  if (t.urgent) return 2;
  return 3;
}
function sorted(tasks) {
  return [...tasks].sort((a, b) =>
    (Number(!!a.done) - Number(!!b.done)) ||
    (taskKind(a) - taskKind(b)) ||
    (a.order - b.order));
}

function renumber(state) {
  sorted(state.tasks).forEach((t, i) => { t.order = i; });
}

function addTask(state, text, today, urgent = false) {
  text = String(text).trim();
  if (!text) throw new Error('任务内容不能为空');
  const t = { id: crypto.randomUUID(), text, done: false, urgent: !!urgent, date: today, createdAt: Date.now(), order: 0 };
  // 新任务放在本组末尾
  const maxOrder = state.tasks.reduce((m, x) => Math.max(m, x.order), -1);
  t.order = maxOrder + 1;
  state.tasks.push(t);
  renumber(state);
  return t;
}

function find(state, id) {
  const t = state.tasks.find((x) => x.id === id);
  if (!t) throw new Error('任务不存在');
  return t;
}

function updateTask(state, id, patch) {
  const t = find(state, id);
  if ('text' in patch) { const v = String(patch.text).trim(); if (!v) throw new Error('任务内容不能为空'); t.text = v; }
  if ('done' in patch) { t.done = !!patch.done; t.doneAt = t.done ? Date.now() : undefined; }
  if ('urgent' in patch && !!patch.urgent !== !!t.urgent) {
    t.urgent = !!patch.urgent;
    // 切换组后放到新组末尾
    t.order = Number.MAX_SAFE_INTEGER;
  }
  renumber(state);
  return t;
}

function deleteTask(state, id) {
  const n = state.tasks.length;
  state.tasks = state.tasks.filter((t) => t.id !== id);
  if (state.tasks.length === n) throw new Error('任务不存在');
  renumber(state);
}

// 在组内重排：ids 为该组（urgent 或普通）的新顺序；跨组不允许。
function reorder(state, ids) {
  const items = ids.map((id) => find(state, id));
  if (new Set(ids).size !== ids.length) throw new Error('重复 id');
  const urgent = !!items[0]?.urgent;
  if (items.some((t) => !!t.urgent !== urgent)) throw new Error('不能跨组排序');
  const group = state.tasks.filter((t) => !!t.urgent === urgent);
  if (group.length !== items.length) throw new Error('排序列表不完整');
  const slots = group.map((t) => t.order).sort((a, b) => a - b);
  items.forEach((t, i) => { t.order = slots[i]; });
  renumber(state);
}

module.exports = { historyItems, historyQuery, restoreFromHistory, localDate, emptyState, normalize, rollover, sorted, addTask, updateTask, deleteTask, reorder };
