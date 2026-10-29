'use strict';
const $ = (id) => document.getElementById(id);
const API = window.api;
let t = I18N.make('zh'); let WD = t('wd'); let SET = null;
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
let V = { today: '', tasks: [], recurring: [] };
let notes = null, cur = null, saveTimer = null;

// ---------- 图标（内联 SVG） ----------
const P = {
  pin: '<path d="M15 4.5l4.5 4.5-3 1.5-3 3 .5 4-1.5 1.5-3.5-3.5L5 19M9 11l-3.5-3.5L7 6l4 .5 3-3z"/>', min: '<path d="M5 12h14"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', up: '<path d="M12 19V5M6 11l6-6 6 6"/>', star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  grip: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', repeat: '<path d="M17 3l3 3-3 3M20 6H8a4 4 0 00-4 4v1M7 21l-3-3 3-3M4 18h12a4 4 0 004-4v-1"/>',
  chev: '<path d="M9 6l6 6-6 6"/>', back: '<path d="M15 6l-6 6 6 6"/>', lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 018 0v3"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z"/><path d="M9 12l2 2 4-4"/>', alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/>',
  carry: '<path d="M5 12h12M13 7l5 5-5 5"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>', pause: '<path d="M9 6v12M15 6v12"/>', play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>', restore: '<path d="M4 12a8 8 0 108-8 8.2 8.2 0 00-5.7 2.3L4 8.5"/><path d="M4 4v4.5h4.5"/>',
  note: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;
function hydrate(root = document) { root.querySelectorAll('[data-ic]').forEach((e) => { if (!e.firstElementChild) e.insertAdjacentHTML('afterbegin', icon(e.dataset.ic)); }); }
$('wSet').innerHTML = icon('gear'); $('wPin').innerHTML = icon('pin'); $('wMin').innerHTML = icon('min'); $('wClose').innerHTML = icon('close'); $('emptyIc').innerHTML = icon('sun');
hydrate();
['recurBtn','addFab'].forEach((id) => { const e=$(id); if (e && !e.firstElementChild) e.insertAdjacentHTML('afterbegin', icon('plus')); });

function el(tag, props = {}, ...kids) { const e = document.createElement(tag); Object.assign(e, props); for (const k of kids) if (k != null) e.append(k); return e; }
function svgEl(n, cls) { const s = el('span', { className: cls || '' }); s.innerHTML = icon(n); return s; }
function notice(msg, ok) { const n = $('notice'); n.textContent = msg; n.classList.toggle('ok', !!ok); n.hidden = false; clearTimeout(notice.t); notice.t = setTimeout(() => { n.hidden = true; }, ok ? 3500 : 8000); }
async function run(p) { try { return await p; } catch (e) { notice(e.message); throw e; } }

// ---------- 语言 ----------
function applyLang(lang) {
  t = I18N.make(lang); WD = t('wd'); document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  document.querySelectorAll('[data-i18n]').forEach((e) => { e.textContent = t(e.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach((e) => { e.placeholder = t(e.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-title]').forEach((e) => { e.title = t(e.dataset.i18nTitle); });
  document.querySelectorAll('#sRelock option').forEach((o) => { if (o.value !== '0') o.textContent = t('s.min', { n: o.value }); });
  document.querySelectorAll('#sBubSec option').forEach((o) => { o.textContent = t('s.sec', { n: o.value }); });
  document.querySelectorAll('#sFont option').forEach((o) => { o.textContent = t(('s.font.' + o.value)); });
  $('rWeek').replaceChildren(...WEEK_ORDER.map((i) => el('label', { title: t('wdPre') + WD[i] }, el('input', { type: 'checkbox', value: i }), el('span', { textContent: lang === 'en' ? WD[i].slice(0, 2) : WD[i] }))));
  $('rDay').replaceChildren(...Array.from({ length: 31 }, (_, i) => el('option', { value: String(i + 1), textContent: t('rp.dayN', { n: i + 1 }) })));
  if (V.today) render(V);
  if ($('history').classList.contains('on')) loadHistory(true);
  if (notes && !$('nListView').hidden) showList();
  if (typeof syncRecurUi === 'function') syncRecurUi();
}
// ---------- 窗口缩放（透明无边框窗口自绘边缘） ----------
document.querySelectorAll('.rz').forEach((h) => {
  h.addEventListener('pointerdown', (e) => { if (e.button) return; h.setPointerCapture(e.pointerId); API.resize(h.dataset.e); const mv = () => API.resize(null);
    const up = () => { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); API.resizeEnd(); }; h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); });
});
// ---------- 窗口控制 ----------
$('wPin').onclick = () => API.call('win:pin');
$('wMin').onclick = () => API.call('win:minimize');
$('wClose').onclick = () => API.call('win:close');

// ---------- 标签页 ----------
const TABS = ['tasks', 'recurring', 'notes', 'history'];
function openSettings(on) { $('settings').hidden = !on; if (on) document.activeElement?.blur(); }
$('wSet').onclick = () => openSettings($('settings').hidden);
$('sClose').onclick = () => openSettings(false);
$('settings').onclick = (e) => { if (e.target === $('settings')) openSettings(false); };
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('settings').hidden) openSettings(false); });
document.querySelectorAll('.tab').forEach((b) => b.onclick = () => showTab(b.dataset.tab));
function showTab(t) {
  if (t === 'settings') { openSettings(true); return; }
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
  document.querySelectorAll('.pane').forEach((p) => p.classList.toggle('on', p.id === t));
  document.querySelector('.seg-thumb').style.transform = `translateX(${TABS.indexOf(t) * 100}%)`;
  if (t === 'notes') refreshVault();
  if (t === 'history') { H.date = ''; H.q = ''; if ($('hQ')) $('hQ').value = ''; loadHistory(true); }
  if (!$('recurPop').hidden) closePop();
}

// ---------- 任务 ----------
function fmtToday(d) {
  const [y, m, dd] = d.split('-').map(Number); const w = new Date(y, m - 1, dd).getDay();
  if (t.lang === 'en') return new Date(y, m - 1, dd).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  return `${m}月${dd}日 · 星期${WD[w]}`;
}
function ring(done, total) {
  const r = 14, c = 2 * Math.PI * r, p = total ? done / total : 0;
  $('ring').innerHTML = `<svg viewBox="0 0 34 34"><circle cx="17" cy="17" r="${r}" stroke="var(--line)" stroke-width="3" fill="none"/>` +
    `<circle cx="17" cy="17" r="${r}" stroke="var(--accent)" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" transform="rotate(-90 17 17)" class="ringp"/>` +
    `<text x="17" y="21" text-anchor="middle" font-size="10" fill="var(--muted)" stroke="none" font-weight="600">${done}/${total}</text></svg>`;
  $('ring').title = t('ring', { d: done, n: total });
}
function render(v) {
  V = v;
  const done = v.tasks.filter((t) => t.done).length;
  $('todayTitle').textContent = t('today');
  $('today').textContent = fmtToday(v.today) + (v.tasks.length ? '  ·  ' + t('remain', { n: v.tasks.length - done }) : '');
  ring(done, v.tasks.length);
  const list = $('list'); list.replaceChildren();
  for (const k of v.tasks) { const tk = k;
    const li = el('li', { className: (tk.done ? 'done ' : '') + (tk.urgent ? 'urgent' : '') });
    li.dataset.id = tk.id; li.dataset.urgent = tk.urgent ? '1' : '0';
    const cb = el('input', { type: 'checkbox', className: 'cbx', checked: tk.done, title: tk.done ? t('t.undone') : t('t.done') });
    cb.onchange = () => setTimeout(() => upd(tk.id, { done: cb.checked }), 160);
    const txt = el('span', { className: 'txt', title: t('t.dbl') });
    txt.append(tk.text);
    if (tk.urgent) txt.append(el('span', { className: 'ustar', textContent: ' *', title: t('urgent') }));
    txt.ondblclick = () => edit(li, tk);
    const chips = [];
    if (tk.remindTime) { const c = el('span', { className: 'chip', title: t('t.remind') }); c.innerHTML = icon('clock'); c.append(tk.remindTime); chips.push(c); }
    if (tk.carriedFrom) { const c = el('span', { className: 'chip gray', title: t('t.carried', { d: tk.carriedFrom }) }); c.innerHTML = icon('carry'); c.append(tk.carriedFrom.slice(5).replace('-', '/')); chips.push(c); }
    const ub = el('button', { className: 'ib' + (tk.urgent ? ' on' : ''), title: tk.urgent ? t('t.unurgent') : t('add.urgent') }); ub.innerHTML = icon('star'); ub.onclick = () => upd(tk.id, { urgent: !tk.urgent });
    const eb = el('button', { className: 'ib', title: t('t.edit') }); eb.innerHTML = icon('edit'); eb.onclick = () => edit(li, tk);
    const db = el('button', { className: 'ib del', title: t('t.del') }); db.innerHTML = icon('trash'); db.onclick = async () => { if (await askConfirm(t('t.confirmDel', { t: tk.text }))) run(API.call('tasks:delete', tk.id)).then(render); };
    li.append(svgEl('grip', 'handle'), cb, txt, ...chips, el('span', { className: 'acts' }, ub, eb, db));
    dnd(li); list.append(li);
  }
  $('empty').hidden = v.tasks.length > 0;
  renderRecur(v.recurring);
  maybeCelebrate(v);
}
const upd = (id, p) => { if (p.done === true) celePending = true; return run(API.call('tasks:update', id, p)).then(render, (e) => { celePending = false; throw e; }); };
function ruleDesc(r) {
  return r.type === 'daily' ? t('daily') : r.type === 'weekly' ? wkText(r.weekdays) : t('r.monthly', { d: r.day });
}
function wkText(ws) {
  const k = [...ws].sort().join();
  if (k === '1,2,3,4,5') return t('rp.weekdays'); if (k === '0,6') return t('rp.weekends'); if (k === '0,1,2,3,4,5,6') return t('daily');
  return t('weekly') + (t.lang === 'en' ? ' ' : '') + WEEK_ORDER.filter((w) => ws.includes(w)).map((w) => WD[w]).join(t('r.sep'));
}
function renderRecur(list) {
  const rl = $('recurList'); rl.replaceChildren();
  $('rcSub').textContent = t('rc.count', { n: list.length }); $('rcEmpty').hidden = list.length > 0;
  for (const r of list) {
    const pb = el('button', { className: 'ib', title: r.paused ? t('rc.resume') : t('rc.pause') }); pb.innerHTML = icon(r.paused ? 'play' : 'pause');
    pb.onclick = () => run(API.call('recur:update', r.id, { paused: !r.paused })).then(render);
    const eb = el('button', { className: 'ib', title: t('t.edit') }); eb.innerHTML = icon('edit'); eb.onclick = () => openPop({ mode: 'edit', rec: r });
    const d = el('button', { className: 'ib del', title: t('r.del') }); d.innerHTML = icon('trash');
    d.onclick = async () => { if (await askConfirm(t('r.confirmDel'))) run(API.call('recur:delete', r.id)).then(render); };
    const chip = el('span', { className: 'chip' }); chip.innerHTML = icon('clock'); chip.append(r.rule.time);
    const sub = r.paused ? `${ruleDesc(r.rule)} · ${t('rc.paused')}` : `${ruleDesc(r.rule)} · ${t('r.next')} ${r.nextDate.slice(5).replace('-', '/')}`;
    const title = el('div', { className: 'rt' }, el('div', { textContent: r.text + (r.urgent ? ' *' : ''), title: r.text }), el('div', { className: 'rs', textContent: sub }));
    if (r.urgent) title.firstChild.style.color = 'var(--red)';
    const li = el('li', { className: r.paused ? 'paused' : '' }, title, chip, pb, eb, d); li.ondblclick = (e) => { if (!e.target.closest('button')) openPop({ mode: 'edit', rec: r }); };
    rl.append(li);
  }
}
// ---------- 完成庆祝 ----------
let celePending = false;
function maybeCelebrate(v) {
  const go = celePending && v.tasks.length > 0 && v.tasks.every((x) => x.done); celePending = false;
  if (go && SET && SET.celebrate !== false) celebrate();
}
function celebrate() {
  const c = $('cele'); c.querySelectorAll('.cf').forEach((n) => n.remove());
  const card = c.querySelector('.cele-card'); card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
  c.querySelectorAll('.cele-ck circle,.cele-ck path').forEach((n) => { n.style.animation = 'none'; void n.getBoundingClientRect(); n.style.animation = ''; });
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const cols = ['#4F7CFF', '#FF7A59', '#FFC53D', '#2EC27E', '#B57CFF', '#FF5C8A'];
    for (let i = 0; i < 34; i++) {
      const a = (Math.PI * 2 * i) / 34 + Math.random() * 0.3, dist = 90 + Math.random() * 110;
      const f = el('span', { className: 'cf' });
      f.style.cssText = `background:${cols[i % cols.length]};--dx:${Math.cos(a) * dist}px;--dy:${Math.sin(a) * dist * 0.8 + 70}px;--r:${Math.round(Math.random() * 720 - 360)}deg;animation-delay:${Math.random() * 90}ms;${i % 3 ? '' : 'border-radius:50%;width:7px;height:7px;'}`;
      c.append(f);
    }
  }
  c.hidden = false; clearTimeout(celebrate.t); celebrate.t = setTimeout(() => { c.hidden = true; c.querySelectorAll('.cf').forEach((n) => n.remove()); }, 1550);
}
// ---------- 应用内确认框（替代 window.confirm：Windows 上原生对话框关闭后输入框会失去键盘焦点） ----------
function askConfirm(msg) {
  return new Promise((res) => {
    const prev = document.activeElement; $('dlgMsg').textContent = msg; $('dlg').hidden = false; $('dlgYes').focus();
    const done = (v) => { $('dlg').hidden = true; $('dlgYes').onclick = $('dlgNo').onclick = $('dlg').onclick = null; document.removeEventListener('keydown', key, true); if (prev && prev.isConnected && prev.focus) prev.focus(); res(v); };
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); done(false); } };
    $('dlgYes').onclick = () => done(true); $('dlgNo').onclick = () => done(false); $('dlg').onclick = (e) => { if (e.target === $('dlg')) done(false); };
    document.addEventListener('keydown', key, true);
  });
}
function edit(li, t) {
  const inp = el('input', { value: t.text, maxLength: 500, className: 'edit' });
  const txt = li.querySelector('.txt'); txt.replaceWith(inp); inp.focus(); inp.select(); li.draggable = false;
  let fin0 = false;
  const fin = (save) => { if (fin0) return; fin0 = true; const v = inp.value.trim(); if (save && v && v !== t.text) upd(t.id, { text: v }); else render(V); };
  inp.onkeydown = (e) => { if (e.key === 'Enter') fin(true); if (e.key === 'Escape') fin(false); };
  inp.onblur = () => fin(true);
}
// ---------- 拖动排序（自绘：浮起卡片 + 占位 + FLIP 动画；不用浏览器默认拖影） ----------
let drag = null;
function dnd(li) {
  li.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button,input,.edit')) return;
    const sx = e.clientX, sy = e.clientY; let started = false;
    const mv = (ev) => { if (!started) { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return; started = true; startDrag(li, sx, sy); } ev.preventDefault(); moveDrag(ev.clientX, ev.clientY); };
    const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); if (started) endDrag(); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
  });
}
function flip(mutate) {
  const items = [...$('list').children].filter((n) => !n.classList.contains('ghost'));
  const before = new Map(items.map((n) => [n, n.getBoundingClientRect().top]));
  mutate();
  for (const n of items) { const d = before.get(n) - n.getBoundingClientRect().top; if (d) n.animate([{ transform: `translateY(${d}px)` }, { transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.3,1)' }); }
}
function startDrag(li, x, y) {
  const r = li.getBoundingClientRect();
  const ghost = li.cloneNode(true); ghost.classList.add('ghost'); ghost.removeAttribute('data-id');
  Object.assign(ghost.style, { width: r.width + 'px', left: r.left + 'px', top: r.top + 'px' });
  $('list').append(ghost); li.classList.add('placeholder'); document.body.classList.add('dragging');
  drag = { li, ghost, dx: x - r.left, dy: y - r.top, x0: r.left, y0: r.top, urgent: li.dataset.urgent, order: ids() };
  requestAnimationFrame(() => ghost.classList.add('lift'));
}
const ids = () => [...$('list').children].filter((n) => n.dataset.id).map((n) => n.dataset.id);
function moveDrag(x, y) {
  if (!drag) return; const { li, ghost } = drag;
  ghost.style.translate = `${x - drag.dx - drag.x0}px ${y - drag.dy - drag.y0}px`;
  const sc = $('list').closest('.scroll'), sr = sc.getBoundingClientRect();
  if (y < sr.top + 24) sc.scrollTop -= 8; else if (y > sr.bottom - 24) sc.scrollTop += 8;
  const sibs = [...$('list').children].filter((n) => n !== li && n.dataset.id && n.dataset.urgent === drag.urgent);
  if (!sibs.length) return;
  let before = null; for (const n of sibs) { const r = n.getBoundingClientRect(); if (y < r.top + r.height / 2) { before = n; break; } }
  const target = before || sibs[sibs.length - 1].nextSibling;
  if (target === li || li.nextSibling === target) return;
  flip(() => $('list').insertBefore(li, target));
}
function endDrag() {
  if (!drag) return; const { li, ghost } = drag; const d = drag; drag = null;
  const r = li.getBoundingClientRect();
  ghost.classList.remove('lift'); ghost.classList.add('drop'); ghost.style.translate = `${r.left - d.x0}px ${r.top - d.y0}px`;
  setTimeout(() => {
    ghost.remove(); li.classList.remove('placeholder'); document.body.classList.remove('dragging');
    const now = ids(); if (now.join() === d.order.join()) return;
    const src = V.tasks.find((x) => x.id === li.dataset.id);
    const group = now.filter((id) => !!V.tasks.find((x) => x.id === id)?.urgent === !!src.urgent);
    run(API.call('tasks:reorder', group)).then(render, () => render(V));
  }, 200);
}
// ---------- 底部输入栏：折叠 + 周期 ----------
const addWrap = $('addWrap');
let recurRule = null; // null = 不重复
function recurSummary(rule) {
  if (!rule) return '';
  const tm = rule.time || '';
  if (rule.type === 'daily') return t('daily') + ' ' + tm;
  if (rule.type === 'weekly') return wkText(rule.weekdays || []) + ' ' + tm;
  return t('r.monthly', { d: rule.day }) + ' ' + tm;
}
function syncRecurUi() {
  const on = !!recurRule;
  $('recurBtn').classList.toggle('on', on);
  $('recurChip').hidden = !on;
  $('recurChipT').textContent = on ? t('add.recurOn', { s: recurSummary(recurRule) }) : '';
  updateAddCollapse();
}
// 弹层：mode = 'arm'（今日输入栏的 +，确认后挂到输入框）| 'new' | 'edit'（周期页）
let POP = null;
function setFreq(f) {
  POP.freq = f;
  $('rFreq').querySelectorAll('button').forEach((b) => { b.classList.toggle('on', b.dataset.f === f); b.setAttribute('aria-checked', String(b.dataset.f === f)); });
  $('rWeekRow').hidden = f !== 'weekly'; $('rMonthRow').hidden = f !== 'monthly'; $('rTimeRow').hidden = f === 'none';
}
function openPop(o) {
  const rule = o.mode === 'arm' ? recurRule : o.rec ? o.rec.rule : null;
  POP = { ...o, freq: 'none' };
  $('rpTitle').textContent = o.mode === 'arm' ? t('rp.title') : o.mode === 'edit' ? t('rp.edit') : t('rp.new');
  $('rpTextRow').hidden = o.mode === 'arm';
  $('rFreq').querySelector('[data-f="none"]').hidden = o.mode !== 'arm';
  $('rFreq').style.gridTemplateColumns = `repeat(${o.mode === 'arm' ? 4 : 3},1fr)`;
  $('rText').value = o.rec ? o.rec.text : ''; $('rUrgent').checked = !!(o.rec && o.rec.urgent);
  const today = new Date(); const wd = today.getDay();
  $('rTime').value = rule ? rule.time : '09:00';
  $('rWeek').querySelectorAll('input').forEach((c) => { c.checked = rule && rule.type === 'weekly' ? rule.weekdays.includes(Number(c.value)) : Number(c.value) === wd; });
  $('rDay').value = String(rule && rule.type === 'monthly' ? rule.day : today.getDate());
  setFreq(rule ? rule.type : o.mode === 'arm' ? 'daily' : 'daily');
  const pop = $('recurPop'); pop.style.setProperty('--ax', o.mode === 'arm' ? '22px' : 'calc(100% - 22px)');
  pop.hidden = false;
  if (o.mode === 'arm') expandAdd(false);
  setTimeout(() => (o.mode === 'arm' ? $('recurPop') : $('rText')).focus(), 0);
}
function closePop(refocus) { const m = POP && POP.mode; $('recurPop').hidden = true; POP = null; if (refocus && m === 'arm') $('newText').focus(); updateAddCollapse(); }
function readRule() {
  const f = POP.freq; if (f === 'none') return null;
  const rule = { type: f, time: $('rTime').value || '09:00' };
  if (f === 'weekly') { rule.weekdays = [...$('rWeek').querySelectorAll('input:checked')].map((x) => Number(x.value)); if (!rule.weekdays.length) throw new Error(t.err('请选择星期')); }
  if (f === 'monthly') rule.day = Number($('rDay').value) || 1;
  return rule;
}
async function confirmPop() {
  let rule; try { rule = readRule(); } catch (e) { notice(e.message); return; }
  if (POP.mode === 'arm') { recurRule = rule; closePop(true); syncRecurUi(); return; }
  const text = $('rText').value.trim(); if (!text) { $('rText').focus(); return; }
  const urgent = $('rUrgent').checked;
  const p = POP.mode === 'edit' ? API.call('recur:update', POP.rec.id, { text, urgent, rule }) : API.call('recur:add', { text, urgent, rule });
  const v = await run(p); closePop(); render(v);
}
$('rFreq').querySelectorAll('button').forEach((b) => b.onclick = () => setFreq(b.dataset.f));
$('rCancel').onclick = () => closePop(true);
$('rOk').onclick = confirmPop;
$('recurPop').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SELECT') { e.preventDefault(); confirmPop(); } });
$('recurBtn').onclick = (e) => { e.preventDefault(); if ($('recurPop').hidden) openPop({ mode: 'arm' }); else closePop(true); };
$('recurChipT').onclick = () => openPop({ mode: 'arm' });
$('recurChipX').onclick = (e) => { e.stopPropagation(); recurRule = null; syncRecurUi(); $('newText').focus(); };
$('rcAdd').onclick = () => openPop({ mode: 'new' });

function expandAdd(focus = true) { addWrap.classList.remove('collapsed'); $('addFab').hidden = true; if (focus && document.activeElement !== $('newText')) $('newText').focus(); }
function collapseAdd() {
  if ($('newText').value.trim() || recurRule || $('newUrgent').checked || (POP && POP.mode === 'arm')) return;
  if (document.activeElement && addWrap.contains(document.activeElement)) return;
  addWrap.classList.add('collapsed'); $('addFab').hidden = false;
}
function updateAddCollapse() { if ($('newText').value.trim() || recurRule || $('newUrgent').checked || (POP && POP.mode === 'arm')) expandAdd(false); }
$('addFab').onclick = () => expandAdd();
$('newText').addEventListener('focus', () => expandAdd());
$('newText').addEventListener('input', updateAddCollapse);
$('newUrgent').addEventListener('change', updateAddCollapse);
document.addEventListener('pointerdown', (e) => {
  if (!$('recurPop').hidden && !$('recurPop').contains(e.target) && !e.target.closest('#recurBtn,#recurChip,#rcAdd,#dlg') && !e.target.closest('#recurList button')) closePop();
  if (addWrap.contains(e.target) || $('recurPop').contains(e.target)) return;
  // 只在点到非输入区域时才让输入框失焦，避免抢走其它输入框（记事本等）的焦点
  if (document.activeElement === $('newText') && !e.target.closest('input,textarea,select,[contenteditable]')) $('newText').blur();
  setTimeout(collapseAdd, 0);
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('recurPop').hidden) { closePop(true); return; }
  if (!addWrap.classList.contains('collapsed') && !$('newText').value.trim()) { $('newText').blur(); collapseAdd(); }
});
setTimeout(collapseAdd, 400);

$('addForm').onsubmit = (e) => {
  e.preventDefault();
  const text = $('newText').value.trim(); if (!text) { $('newText').focus(); return; }
  const urgent = $('newUrgent').checked;
  const p = recurRule
    ? API.call('recur:add', { text, urgent, rule: recurRule })
    : API.call('tasks:add', text, urgent);
  run(p).then((v) => {
    $('newText').value = ''; $('newUrgent').checked = false;
    render(v);
    if (!recurRule) $('list').lastElementChild?.scrollIntoView({ block: 'nearest' });
    else { notice(t('rc.added') + '：' + text + ' · ' + recurSummary(recurRule), true); recurRule = null; syncRecurUi(); }
    $('newText').focus();
  });
};

// ---------- 历史 ----------
const H = { q: '', date: '', offset: 0, dates: [], seq: 0 };
function fmtDay(d) {
  const [y, m, dd] = d.split('-').map(Number); const dt = new Date(y, m - 1, dd);
  if (t.lang === 'en') return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: y === new Date().getFullYear() ? undefined : 'numeric' });
  return `${y === new Date().getFullYear() ? '' : y + '年'}${m}月${dd}日 · 星期${WD[dt.getDay()]}`;
}
const md = (d) => d ? d.slice(5).replace('-', '/') : '';
async function loadHistory(reset) {
  if (reset) H.offset = 0;
  const seq = ++H.seq;
  // 无日期：只取 dates 供导航，不渲染任务列表（一次一天，先选日期）
  const opts = H.date
    ? { q: H.q, date: H.date, offset: H.offset, limit: 100 }
    : { q: '', date: '\0', offset: 0, limit: 1 };
  const r = await run(API.call('history:query', opts));
  if (seq !== H.seq) return;
  H.dates = r.dates; H.next = H.date ? r.next : null;
  const box = $('hList');
  if (!H.date) {
    box.replaceChildren();
    $('hMore').hidden = true;
    const any = r.dates.length > 0;
    $('hEmpty').hidden = false;
    $('hEmptyT').textContent = any ? t('h.pick') : t('h.empty');
    $('hEmptyS').textContent = any ? t('h.pickS') : t('h.emptyS');
    $('hSub').textContent = any ? t('h.pickSub', { n: r.dates.length }) : t('h.count', { n: 0 });
    $('hDate').value = '';
    $('hAll').hidden = true;
    $('hPrev').disabled = !r.dates.length;
    $('hNext').disabled = true;
    return;
  }
  if (reset) box.replaceChildren();
  for (const d of r.days) {
    let sec = box.lastElementChild?.dataset.date === d.date ? box.lastElementChild : null;
    if (!sec) { sec = el('div', { className: 'hday' }); sec.dataset.date = d.date; sec.append(el('div', { className: 'hdate' }, el('span', { textContent: fmtDay(d.date) }), el('span', { className: 'hstat' })), el('ul', { className: 'hitems' })); box.append(sec); }
    const ul = sec.querySelector('ul');
    for (const x of d.items) {
      const st = el('span', { className: 'hst ' + (x.done ? 'ok' : 'carry') }); st.innerHTML = icon(x.done ? 'check' : 'carry');
      st.title = x.done ? t('h.done') : t('h.carried', { d: md(x.carriedTo) });
      const txt = el('span', { className: 'txt', textContent: x.text }); if (x.urgent) txt.append(el('span', { className: 'ustar', textContent: ' *' }));
      const meta = el('span', { className: 'hmeta', textContent: x.done ? (x.carriedFrom ? t('h.from', { d: md(x.carriedFrom) }) : '') : t('h.carried', { d: md(x.carriedTo) }) });
      const rb = el('button', { className: 'ib', title: t('h.restore') }); rb.innerHTML = icon('restore');
      rb.onclick = () => run(API.call('history:restore', x.hid)).then((v) => { render(v); notice(t('h.restored') + '：' + x.text); });
      const li = el('li', { className: (x.done ? 'done' : 'carried') + (x.urgent ? ' urgent' : '') }, st, el('span', { className: 'hbody' }, txt, meta), rb);
      ul.append(li);
    }
    const all = [...ul.children]; sec.querySelector('.hstat').textContent = t('h.dayStat', { d: all.filter((l) => l.classList.contains('done')).length, c: all.filter((l) => l.classList.contains('carried')).length });
  }
  H.offset = r.next ?? H.offset;
  $('hMore').hidden = r.next == null; if (r.next != null) $('hMore').textContent = t('h.more', { n: r.total - r.next });
  const none = !box.children.length; $('hEmpty').hidden = !none;
  if (none) { $('hEmptyT').textContent = t('h.none'); $('hEmptyS').textContent = ''; }
  $('hSub').textContent = t('h.count', { n: r.total });
  $('hDate').value = H.date; $('hAll').hidden = !H.date;
  const i = H.dates.indexOf(H.date);
  $('hPrev').disabled = !H.dates.length || (H.date && i >= H.dates.length - 1); $('hNext').disabled = !H.date || i <= 0;
}
let hqT; $('hQ').oninput = () => { clearTimeout(hqT); hqT = setTimeout(() => { H.q = $('hQ').value; if (!H.date) return; loadHistory(true); }, 180); };
$('hDate').onchange = () => { H.date = $('hDate').value; loadHistory(true); };
// 清除日期 → 回到「先选日期」空态（不再展示全部日期列表）
$('hAll').onclick = () => { H.date = ''; loadHistory(true); };
// 前一天/后一天：在有记录的日期间跳转（dates 为新->旧）；无日期时 prev 选最近一天
$('hPrev').onclick = () => { const d = H.dates; if (!d.length) return; const i = H.date ? d.findIndex((x) => x < H.date) : 0; if (i >= 0) { H.date = d[i]; loadHistory(true); } };
$('hNext').onclick = () => { const d = H.dates; if (!H.date) return; const later = d.filter((x) => x > H.date); if (!later.length) return; H.date = later[later.length - 1]; loadHistory(true); };
$('hMore').onclick = () => loadHistory(false);

// ---------- 记事本 ----------
async function refreshVault() {
  const s = await API.call('vault:status');
  if (!s.unlocked) notes = null;
  const open = s.exists && s.unlocked && !!notes;
  $('vSetup').hidden = s.exists; $('vOpen').hidden = !open; $('vLock').hidden = !s.exists || open;
  if (!$('vLock').hidden) $('up').focus();
}
$('spBtn').onclick = async () => {
  $('spErr').textContent = '';
  if ($('sp1').value !== $('sp2').value) { $('spErr').textContent = t('v.mismatch'); return; }
  try { $('spBtn').disabled = true; $('spBtn').textContent = t('v.creating'); notes = await API.call('vault:setup', $('sp1').value); $('sp1').value = $('sp2').value = ''; openNotes(); }
  catch (e) { $('spErr').textContent = e.message; } finally { $('spBtn').disabled = false; $('spBtn').textContent = t('v.create'); }
};
async function unlock() {
  $('upErr').textContent = ''; $('upBtn').disabled = true; $('upBtn').textContent = t('v.unlocking');
  try { notes = await API.call('vault:unlock', $('up').value); $('up').value = ''; openNotes(); } catch (e) { $('upErr').textContent = e.message; }
  finally { $('upBtn').disabled = false; $('upBtn').textContent = t('v.unlock'); }
}
$('upBtn').onclick = unlock; $('up').onkeydown = (e) => { if (e.key === 'Enter') unlock(); };
function openNotes() {
  $('vSetup').hidden = $('vLock').hidden = true; $('vOpen').hidden = false;
  if (!notes.notes.length) newNote(); else showList();
}
function fmtTime(ts) { if (!ts) return ''; const d = new Date(ts); const p = (n) => String(n).padStart(2, '0'); return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`; }
function showList() {
  flush(); $('nEditView').hidden = true; $('nListView').hidden = false;
  notes.notes.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  $('nCount').textContent = t('n.count', { n: notes.notes.length });
  $('noteList').replaceChildren(...notes.notes.map((n) => {
    const li = el('li', {}, el('div', { className: 'nt', textContent: n.title || t('n.untitled') }), el('div', { className: 'np', textContent: (n.body || '').split('\n').find((l) => l.trim()) || t('n.blank') }), el('div', { className: 'nd', textContent: fmtTime(n.updatedAt) }));
    li.onclick = () => openNote(n.id); return li;
  }));
}
function openNote(id) {
  cur = id; const n = notes.notes.find((x) => x.id === id);
  $('nListView').hidden = true; $('nEditView').hidden = false;
  $('nTitle').value = n?.title || ''; $('nBody').value = n?.body || ''; $('nStatus').textContent = t('n.enc', { t: fmtTime(n?.updatedAt) });
}
function newNote() { const n = { id: crypto.randomUUID(), title: '', body: '', updatedAt: Date.now() }; notes.notes.unshift(n); openNote(n.id); queueSave(); $('nTitle').focus(); }
async function flush() {
  if (!notes) return; if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  try { await API.call('vault:save', notes); if (!$('nEditView').hidden) $('nStatus').textContent = t('n.saved', { t: fmtTime(Date.now()) }); }
  catch (e) { $('nStatus').textContent = t('n.saveFail', { e: e.message }); }
}
function queueSave() { clearTimeout(saveTimer); $('nStatus').textContent = t('n.editing'); saveTimer = setTimeout(() => { saveTimer = 1; flush(); }, 600); }
function onEdit() { const n = notes?.notes.find((x) => x.id === cur); if (!n) return; n.title = $('nTitle').value; n.body = $('nBody').value; n.updatedAt = Date.now(); queueSave(); }
$('nTitle').oninput = onEdit; $('nBody').oninput = onEdit;
$('nTitle').onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); $('nBody').focus(); } };
window.addEventListener('blur', () => { flush(); });
$('nNew').onclick = newNote;
$('nBack').onclick = showList;
$('nDel').onclick = async () => { if (!(await askConfirm(t('n.confirmDel')))) return; notes.notes = notes.notes.filter((n) => n.id !== cur); queueSave(); flush(); showList(); };
$('nLock').onclick = async () => { try { await flush(); } catch (e) { console.error('flush', e); } finally { await API.call('vault:lock'); } };
API.on('vault:locking', async () => { try { await flush(); } finally { API.call('vault:lockReady'); } });
API.on('vault:locked', (why) => { clearTimeout(saveTimer); saveTimer = null; notes = null; $('nTitle').value = $('nBody').value = ''; refreshVault(); if (why === 'timeout') $('upErr').textContent = t('v.timeout'); });
let lastTouch = 0;
['keydown', 'mousemove', 'mousedown'].forEach((ev) => document.addEventListener(ev, () => { if (notes && Date.now() - lastTouch > 15000) { lastTouch = Date.now(); API.call('vault:touch'); } }));
window.addEventListener('beforeunload', () => { flush(); });

// ---------- 设置 ----------
function setOpacity(o) { const r = document.documentElement; r.style.setProperty('--a', String(o)); r.classList.toggle('lowop', o < 0.75); $('sOpVal').textContent = Math.round(o * 100) + '%'; }
let opDrag = false, opT;
$('sOpacity').oninput = () => { opDrag = true; const o = $('sOpacity').value / 100; setOpacity(o); clearTimeout(opT); opT = setTimeout(() => { run(API.call('settings:set', 'opacity', o)).finally(() => { opDrag = false; }); }, 150); };
document.querySelectorAll('#sLang .theme-opt').forEach((b) => b.onclick = () => run(API.call('settings:set', 'lang', b.dataset.lang)));
$('sCele').onchange = () => run(API.call('settings:set', 'celebrate', $('sCele').checked));
$('sBub').onchange = () => run(API.call('settings:set', 'bubble', $('sBub').checked));
$('sBubSec').onchange = () => run(API.call('settings:set', 'bubbleSec', Number($('sBubSec').value)));
let curLang = null;
function fillSettings(s) {
  SET = s; if (s.uiLang !== curLang) { curLang = s.uiLang; applyLang(s.uiLang); }
  $('sTop').checked = s.alwaysOnTop; $('sAuto').checked = s.autoStart; $('sRelock').value = String(s.relockMinutes);
  $('sAuto').disabled = s.platform === 'linux'; $('sAutoHint').hidden = s.platform !== 'linux';
  $('wPin').classList.toggle('on', s.alwaysOnTop); $('wPin').title = s.alwaysOnTop ? t('win.unpin') : t('win.pin');
  const th = s.theme || 'system';
  document.querySelectorAll('#sTheme .theme-opt').forEach((b) => b.classList.toggle('on', b.dataset.theme === th));
  const k = $('sHotkey'); k.classList.toggle('bad', !s.hotkeyOk);
  k.textContent = s.hotkeyOk ? s.hotkey : t('s.hotkeyFail', { k: s.hotkey }); k.title = s.hotkeyOk ? t('s.hotkeyTip') : t('s.hotkeyBad');
  setOpacity(s.opacity ?? 1); if (!opDrag) $('sOpacity').value = Math.round((s.opacity ?? 1) * 100);
  document.querySelectorAll('#sLang .theme-opt').forEach((b) => b.classList.toggle('on', b.dataset.lang === (s.lang || 'system')));
  $('sFont').value = s.font || 'system'; applyFont(s.font || 'system');
  $('sCele').checked = s.celebrate !== false; $('sBub').checked = s.bubble !== false; $('sBubSec').value = String(s.bubbleSec || 4); $('sBubSec').disabled = s.bubble === false;
}
$('sTop').onchange = () => run(API.call('settings:set', 'alwaysOnTop', $('sTop').checked));
$('sAuto').onchange = () => run(API.call('settings:set', 'autoStart', $('sAuto').checked));
$('sRelock').onchange = () => run(API.call('settings:set', 'relockMinutes', Number($('sRelock').value)));
document.querySelectorAll('#sTheme .theme-opt').forEach((b) => b.onclick = () => run(API.call('settings:set', 'theme', b.dataset.theme)));
const FONTS = {
  system: '"Microsoft YaHei UI","Microsoft YaHei","PingFang SC","Segoe UI",system-ui,"Noto Sans CJK SC",sans-serif',
  segoe: '"Segoe UI","Segoe UI Variable","Microsoft YaHei UI","PingFang SC",system-ui,sans-serif',
  yahei: '"Microsoft YaHei","Microsoft YaHei UI","微软雅黑","PingFang SC","Noto Sans CJK SC",sans-serif',
  pingfang: '"PingFang SC","Hiragino Sans GB","冬青黑体","Microsoft YaHei UI","Noto Sans CJK SC",sans-serif',
  noto: '"Noto Sans CJK SC","Source Han Sans SC","Noto Sans SC","Microsoft YaHei UI","PingFang SC",sans-serif',
  inter: 'Inter,"Segoe UI","Microsoft YaHei UI","PingFang SC",system-ui,sans-serif',
  consolas: 'Consolas,"Sarasa Mono SC","Cascadia Mono","Microsoft YaHei Mono",ui-monospace,monospace',
};
function applyFont(id) { document.documentElement.style.setProperty('--font', FONTS[id] || FONTS.system); document.documentElement.dataset.font = id || 'system'; }
$('sFont').onchange = () => { applyFont($('sFont').value); run(API.call('settings:set', 'font', $('sFont').value)); };
$('cpBtn').onclick = async () => {
  const e0 = $('cpErr'); e0.textContent = ''; e0.classList.remove('ok');
  const a = $('cp0').value, b = $('cp1').value, c = $('cp2').value;
  if (!b) { e0.textContent = t.err('新密码不能为空'); return; }
  if (b !== c) { e0.textContent = t('s.mismatch'); return; }
  $('cpBtn').disabled = true; const prev = $('cpBtn').textContent; $('cpBtn').textContent = t('s.cpwing');
  try {
    await flush();
    await API.call('vault:changePassword', a, b, notes && notes.notes ? notes : null);
    $('cp0').value = $('cp1').value = $('cp2').value = '';
    e0.textContent = t('s.cpwOk'); e0.classList.add('ok');
  } catch (e) { e0.textContent = e.message; }
  finally { $('cpBtn').disabled = false; $('cpBtn').textContent = prev; }
};
API.on('settings:changed', fillSettings);
API.on('tasks:changed', render);
API.on('notice', notice);
API.on('open:settings', () => openSettings(true));
// ---------- 焦点恢复：窗口重新显示/获得焦点后，把光标放回上次使用的输入框 ----------
let lastField = null;
document.addEventListener('focusin', (e) => { if (e.target.matches('input:not([type=checkbox]):not([type=range]),textarea')) lastField = e.target; });
function restoreFocus() {
  const a = document.activeElement; if (a && a !== document.body) return;
  if (!$('dlg').hidden || !$('settings').hidden) return;
  const f = lastField && lastField.isConnected && lastField.offsetParent ? lastField : document.querySelector('.pane.on #nBody:not([hidden]), .pane.on #newText');
  if (f && f.offsetParent) f.focus({ preventScroll: true });
}
API.on('win:shown', () => setTimeout(restoreFocus, 0));
window.addEventListener('focus', () => setTimeout(restoreFocus, 0));
API.call('settings:get').then(fillSettings).then(() => API.call('tasks:get')).then(render);
window.__tn = { loadHistory, showTab, render, openNote, showList, openSettings, expandAdd, collapseAdd, openPop, closePop, setFreq, celebrate, askConfirm, setRecur: (r) => { recurRule = r; syncRecurUi(); }, drag: { startDrag, moveDrag, endDrag } };
