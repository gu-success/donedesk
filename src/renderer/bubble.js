const FONTS={system:'system-ui,"Microsoft YaHei UI","PingFang SC",sans-serif',segoe:'"Segoe UI","Microsoft YaHei UI",sans-serif',yahei:'"Microsoft YaHei","微软雅黑",sans-serif',pingfang:'"PingFang SC","Hiragino Sans GB",sans-serif',noto:'"Noto Sans CJK SC","Source Han Sans SC",sans-serif',inter:'Inter,"Segoe UI",sans-serif',consolas:'Consolas,ui-monospace,monospace'};
'use strict';
const bub = document.getElementById('bub'), msg = document.getElementById('msg'), idx = document.getElementById('idx');
const mq = matchMedia('(prefers-color-scheme: dark)');
let D = { tasks: [], sec: 4, theme: 'system' }, i = 0, timer = null, paused = false, key = '';
const applyTheme = () => document.documentElement.classList.toggle('dark', D.theme === 'dark' || (D.theme !== 'light' && mq.matches));
mq.addEventListener('change', applyTheme);
function show(anim) {
  const t = D.tasks;
  if (!t.length) { if (!D.hasTasks) { bub.hidden = true; return; } msg.className = 'done'; msg.textContent = D.allDone; idx.textContent = ''; bub.hidden = false; return; }
  i %= t.length; const x = t[i];
  msg.replaceChildren(); msg.className = x.urgent ? 'urgent' : '';
  if (x.urgent) { const s = document.createElement('span'); s.className = 'star'; s.textContent = '★'; msg.append(s); }
  msg.append(x.text); idx.textContent = t.length > 1 ? `${i + 1}/${t.length}` : '';
  bub.hidden = false;
  if (anim) { msg.classList.remove('in'); void msg.offsetWidth; msg.classList.add('in'); }
}
function next() {
  if (paused || D.tasks.length < 2) return;
  msg.classList.add('out');
  setTimeout(() => { msg.classList.remove('out'); i++; show(true); }, 220);
}
function restart() { clearInterval(timer); timer = setInterval(next, (D.sec || 4) * 1000); }
window.api.on('ball:update', (v) => {
  const k = JSON.stringify([v.tasks, v.allDone]); const changed = k !== key; key = k;
  const wasHidden = bub.hidden; D = v; applyTheme();
  if (v.font) document.body.style.fontFamily = FONTS[v.font] || FONTS.system;
  document.body.className = /^(left|right)-(top|bottom)$/.test(v.side || '') ? v.side.replace('-', ' ') : 'right top';
  if (changed) { i = 0; show(true); } else show(false);
  if (wasHidden && !bub.hidden) { bub.classList.remove('pop'); void bub.offsetWidth; bub.classList.add('pop'); }
  restart();
});
bub.addEventListener('mouseenter', () => { paused = true; window.api.ball('bubble:mouse', true); });
bub.addEventListener('mouseleave', () => { paused = false; window.api.ball('bubble:mouse', false); });
bub.addEventListener('click', () => window.api.ball('bubble:click'));
