'use strict';
const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut, Notification, powerMonitor, screen, dialog, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const T = require('./tasks');
const R = require('./recur');
const V = require('./vault');
const { readJson, writeJson } = require('./store');
const FL = require('./float');
const I18N = require('./renderer/i18n');
let L = I18N.make('zh');
const setLang = () => { L = I18N.make(I18N.resolveLang(settings.lang, app.getLocale())); };

if (process.env.TN_SCREENSHOT || process.env.TN_E2E) app.disableHardwareAcceleration();
if (process.env.TN_DATA) app.setPath('userData', process.env.TN_DATA);
else {
  // 一次性迁移：旧版 TaskNotepad 数据目录 -> DoneDesk
  const nu = path.join(app.getPath('appData'), 'DoneDesk'); const old = path.join(app.getPath('appData'), 'TaskNotepad');
  app.setPath('userData', nu);
  try {
    if (fs.existsSync(old) && !fs.existsSync(path.join(nu, 'tasks.json')) && !fs.existsSync(path.join(nu, 'vault.json'))) {
      fs.mkdirSync(nu, { recursive: true });
      for (const f of fs.readdirSync(old)) if (/^(tasks|settings|vault)\.json(\.bak)?$/.test(f)) fs.copyFileSync(path.join(old, f), path.join(nu, f));
      console.log('已从 TaskNotepad 迁移数据');
    }
  } catch (e) { console.error('数据迁移失败', e); }
}
if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }

const dataDir = () => app.getPath('userData');
const F = { tasks: () => path.join(dataDir(), 'tasks.json'), settings: () => path.join(dataDir(), 'settings.json'), vault: () => path.join(dataDir(), 'vault.json') };
const HOTKEY = process.platform === 'darwin' ? 'Command+Shift+L' : 'Control+Shift+L';

let win, tray, state, settings, today, quitting = false, hotkeyOk = false;
let vault = { key: null, notes: null, file: null };
const relock = new V.RelockTimer(() => lockVault('timeout'));

const defaults = { alwaysOnTop: false, autoStart: false, relockMinutes: 15, theme: 'system', opacity: 1, font: 'system', ball: null, bubble: true, bubbleSec: 4, celebrate: true, lang: 'system', bounds: { width: 380, height: 560 } };

function applyTheme(t) {
  const v = ['light', 'dark', 'system'].includes(t) ? t : 'system';
  settings.theme = v;
  nativeTheme.themeSource = v;
}

function saveTasks() { writeJson(F.tasks(), state); updateBall(); }
function saveSettings() { writeJson(F.settings(), settings); }
function send(ch, v) { if (win && !win.isDestroyed()) win.webContents.send(ch, v); }
function view() { return { today, tasks: T.sorted(state.tasks), recurring: state.recurring || [] }; }

function checkDate() {
  try { checkDateInner(); } catch (e) { console.error('checkDate 失败', e); }
}
function checkDateInner() {
  const d = T.localDate();
  const ch1 = d !== today ? T.rollover(state, d) : false;
  today = d;
  const ch2 = R.materialize(state, d);
  if (ch1 || ch2) { saveTasks(); send('tasks:changed', view()); }
  const due = R.dueReminders(state);
  if (due.length) {
    saveTasks();
    for (const t of due) if (Notification.isSupported()) {
      const n = new Notification({ title: L('notify.title'), body: `${t.remindTime}  ${t.text}` });
      n.on('click', showWin); n.show();
    }
  }
}

// 上锁前先让渲染进程把未保存的编辑写入（最多等 1.5 秒），再清密钥
let locking = null, lockReady = null;
function lockVault(reason) {
  if (locking) return locking;
  locking = (async () => {
    relock.stop();
    if (vault.key && win && !win.isDestroyed()) {
      await new Promise((r) => { const t = setTimeout(r, 1500); lockReady = () => { clearTimeout(t); r(); }; send('vault:locking'); });
      lockReady = null;
    }
    if (vault.key) vault.key.fill(0);
    vault.key = null; vault.notes = null; relock.stop();
    send('vault:locked', reason);
  })().finally(() => { locking = null; });
  return locking;
}

function clampBounds(b) {
  const area = screen.getDisplayMatching({ x: b.x ?? 0, y: b.y ?? 0, width: b.width, height: b.height }).workArea;
  const vis = b.x !== undefined && b.x < area.x + area.width - 40 && b.x + b.width > area.x + 40 && b.y >= area.y - 10 && b.y < area.y + area.height - 40;
  return vis ? b : { width: b.width, height: b.height };
}

function createWindow() {
  win = new BrowserWindow({
    ...clampBounds(settings.bounds), minWidth: 300, minHeight: 360, title: 'DoneDesk', show: !process.argv.includes('--hidden'),
    alwaysOnTop: settings.alwaysOnTop, autoHideMenuBar: true, frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false, icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  if (process.platform !== 'darwin') win.setMenu(null);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  let t; const saveB = () => { clearTimeout(t); t = setTimeout(() => { if (!win.isMinimized() && !win.isMaximized()) { settings.bounds = win.getBounds(); saveSettings(); } }, 400); };
  win.on('resize', saveB); win.on('move', saveB);
  win.on('minimize', showBall); win.on('restore', hideBall); win.on('show', hideBall); win.on('focus', () => { hideBall(); win.webContents.focus(); });
  win.on('close', (e) => { if (!quitting) { e.preventDefault(); win.hide(); } });
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}
// ---------- 悬浮球 ----------
let ball = null, bd = null, bub = null;
const BW = 250, BH = 60;
const BALL = 64;
function ballPos() {
  const p = settings.ball; const a = screen.getPrimaryDisplay().workArea;
  if (p && screen.getAllDisplays().some((d) => p.x >= d.workArea.x - 10 && p.y >= d.workArea.y - 10 && p.x + BALL <= d.workArea.x + d.workArea.width + 10 && p.y + BALL <= d.workArea.y + d.workArea.height + 10)) return p;
  return { x: a.x + a.width - BALL - 24, y: a.y + Math.round(a.height * 0.6) };
}
function createBall() {
  ball = new BrowserWindow({ ...ballPos(), width: BALL, height: BALL, frame: false, transparent: true, backgroundColor: '#00000000', resizable: false, maximizable: false, minimizable: false, fullscreenable: false,
    alwaysOnTop: true, skipTaskbar: true, hasShadow: false, show: false, focusable: true, title: 'DoneDesk',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  ball.setAlwaysOnTop(true, 'floating'); ball.setMenu(null); FL.lockSize(ball, BALL, BALL);
  ball.loadFile(path.join(__dirname, 'renderer', 'ball.html'));
  ball.webContents.on('did-finish-load', updateBall);
  ball.webContents.on('will-navigate', (e) => e.preventDefault());
  ball.on('close', (e) => { if (!quitting) { e.preventDefault(); ball.hide(); } });
}
function createBubble() {
  bub = new BrowserWindow({ width: BW, height: BH, frame: false, transparent: true, backgroundColor: '#00000000', resizable: false, maximizable: false, minimizable: false, fullscreenable: false,
    alwaysOnTop: true, skipTaskbar: true, hasShadow: false, show: false, focusable: false, title: 'DoneDesk',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  bub.setAlwaysOnTop(true, 'floating'); bub.setMenu(null); FL.lockSize(bub, BW, BH);
  bub.setIgnoreMouseEvents(true, { forward: true }); // 透明区域点击穿透，仅气泡本体可点
  bub.loadFile(path.join(__dirname, 'renderer', 'bubble.html'));
  bub.webContents.on('did-finish-load', updateBall);
  bub.webContents.on('will-navigate', (e) => e.preventDefault());
  bub.on('close', (e) => { if (!quitting) { e.preventDefault(); bub.hide(); } });
}
function placeBubble() {
  if (!bub || bub.isDestroyed() || !ball) return;
  const [x, y] = ball.getPosition(); const a = screen.getDisplayMatching({ x, y, width: BALL, height: BALL }).workArea;
  // 默认锚定在球的右上角弹出（气泡底边与徽标下沿齐平，尾巴从左下角指向球体右侧、避开徽标）；靠近右/上边缘时翻转
  const h = x + BALL - 4 + BW <= a.x + a.width ? 'right' : 'left';
  const v = y + 36 - BH >= a.y ? 'top' : 'bottom';
  const bx = h === 'right' ? x + BALL - 4 : x - BW + 4;
  const by = v === 'top' ? y + 36 - BH : y + 28;
  FL.moveFixed(bub, bx, Math.min(Math.max(a.y, by), a.y + a.height - BH), BW, BH);
  return `${h}-${v}`;
}
function bubbleData() {
  const open = T.sorted(state.tasks).filter((t) => !t.done).map((t) => ({ text: t.text, urgent: !!t.urgent }));
  return { tasks: open, sec: settings.bubbleSec || 4, side: placeBubble(), theme: settings.theme, lang: L.lang, allDone: L('bubble.allDone'), hasTasks: state.tasks.length > 0, font: settings.font || 'system' };
}
function syncBubble() {
  if (!bub || bub.isDestroyed()) return;
  const want = settings.bubble && ball && !ball.isDestroyed() && ball.isVisible();
  if (!want) { if (bub.isVisible()) bub.hide(); return; }
  bub.webContents.send('ball:update', bubbleData());
  if (!bub.isVisible()) bub.showInactive();
}
function updateBall() { syncBubble(); if (ball && !ball.isDestroyed()) ball.webContents.send('ball:update', { left: state.tasks.filter((t) => !t.done).length, theme: settings.theme, title: L('ball.tip') }); }
function showBall() { if (!ball || ball.isDestroyed()) return; { const p = ballPos(); FL.moveFixed(ball, p.x, p.y, BALL, BALL); } updateBall(); ball.showInactive(); syncBubble(); }
function hideBall() { if (ball && !ball.isDestroyed() && ball.isVisible()) ball.hide(); if (bub && !bub.isDestroyed() && bub.isVisible()) bub.hide(); }
ipcMain.on('ball:drag', (_e, phase) => {
  if (!ball) return; const c = screen.getCursorScreenPoint();
  if (phase === 'start') { bd = FL.dragStart(ball, c); return; }
  if (!bd) return;
  { const p = FL.dragPos(bd, c); FL.moveFixed(ball, p.x, p.y, BALL, BALL); } const side = placeBubble(); if (bub && bub.isVisible() && side !== bd.side) { bd.side = side; bub.webContents.send('ball:update', bubbleData()); }
  if (phase === 'end') { const p = FL.dragPos(bd, c); FL.moveFixed(ball, p.x, p.y, BALL, BALL); settings.ball = p; saveSettings(); bd = null; }
});
ipcMain.on('bubble:mouse', (_e, over) => { if (bub && !bub.isDestroyed()) bub.setIgnoreMouseEvents(!over, { forward: true }); });
ipcMain.on('bubble:click', () => { hideBall(); showWin(); });
ipcMain.on('ball:click', () => { hideBall(); showWin(); });
ipcMain.on('ball:menu', () => Menu.buildFromTemplate([
  { label: L('ball.restore'), click: () => { hideBall(); showWin(); } }, { type: 'separator' },
  { label: L('tray.quit'), click: () => { quitting = true; app.quit(); } }]).popup({ window: ball }));
// 显示/恢复后把键盘焦点交还给页面（Windows 上仅 win.focus() 时渲染进程可能拿不到键盘焦点）
function focusWin() { if (!win || win.isDestroyed()) return; win.focus(); win.webContents.focus(); win.webContents.send('win:shown'); }
function showWin() { if (win.isMinimized()) win.restore(); win.show(); focusWin(); setTimeout(focusWin, 60); }
function toggleWin() { if (win.isVisible() && win.isFocused()) win.hide(); else showWin(); }

function buildTray() {
  let ti;
  if (process.platform === 'darwin') { ti = nativeImage.createFromPath(path.join(__dirname, 'trayTemplate.png')); ti.setTemplateImage(true); } // 菜单栏模板图，自动适配明暗
  else ti = nativeImage.createFromPath(path.join(__dirname, 'tray.png')).resize({ width: 16, height: 16, quality: 'best' });
  tray = new Tray(ti);
  tray.setToolTip('DoneDesk');
  const menu = () => Menu.buildFromTemplate([
    { label: L('tray.toggle'), click: toggleWin },
    { label: L('win.pin'), type: 'checkbox', checked: settings.alwaysOnTop, click: (i) => setSetting('alwaysOnTop', i.checked) },
    { label: L('s.auto'), type: 'checkbox', checked: settings.autoStart, click: (i) => setSetting('autoStart', i.checked) },
    { label: L('tray.lock'), click: () => lockVault('manual') },
    { type: 'separator' },
    { label: L('tray.quit'), click: () => { quitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(menu()); tray.on('click', toggleWin);
  tray.rebuild = () => tray.setContextMenu(menu());
}

function setSetting(k, v) {
  if (k === 'alwaysOnTop') { settings.alwaysOnTop = !!v; win.setAlwaysOnTop(!!v); }
  else if (k === 'autoStart') { settings.autoStart = !!v; if (process.platform !== 'linux') app.setLoginItemSettings({ openAtLogin: !!v, args: ['--hidden'] }); }
  else if (k === 'theme') { applyTheme(v); }
  else if (k === 'relockMinutes') { const m = Number(v); if (![0, 1, 5, 15, 30, 60].includes(m)) throw new Error('无效'); settings.relockMinutes = m; relock.setMinutes(m); if (vault.key) relock.touch(); }
  else if (k === 'opacity') { const o = Number(v); if (!Number.isFinite(o)) throw new Error('无效'); settings.opacity = Math.round(Math.min(1, Math.max(0.3, o)) * 100) / 100; }
  else if (k === 'bubble') { settings.bubble = !!v; }
  else if (k === 'celebrate') { settings.celebrate = !!v; }
  else if (k === 'bubbleSec') { const n = Number(v); if (![3, 4, 6, 10].includes(n)) throw new Error('无效'); settings.bubbleSec = n; }
  else if (k === 'font') { if (!['system','segoe','yahei','pingfang','noto','inter','consolas'].includes(v)) throw new Error('无效'); settings.font = v; }
  else if (k === 'lang') { if (!['zh', 'en', 'system'].includes(v)) throw new Error('无效'); settings.lang = v; setLang(); buildAppMenu(); }
  else throw new Error('未知设置');
  saveSettings(); tray?.rebuild(); updateBall(); send('settings:changed', pubSettings());
}
const pubSettings = () => ({ alwaysOnTop: settings.alwaysOnTop, autoStart: settings.autoStart, relockMinutes: settings.relockMinutes, theme: settings.theme || 'system', hotkey: HOTKEY.replace('Control', 'Ctrl').replace('Command', 'Cmd'), hotkeyOk, platform: process.platform, opacity: settings.opacity ?? 1, lang: settings.lang || 'system', font: settings.font || 'system', bubble: settings.bubble !== false, bubbleSec: settings.bubbleSec || 4, celebrate: settings.celebrate !== false, uiLang: L.lang });

function handle(ch, fn) { ipcMain.handle(ch, async (_e, ...a) => { try { return { ok: true, v: await fn(...a) }; } catch (e) { return { ok: false, err: L.err(e.message), code: e.code }; } }); }
function mutate(fn) { return (...a) => { checkDate(); fn(...a); saveTasks(); return view(); }; }

handle('tasks:get', () => { checkDate(); return view(); });
handle('tasks:add', mutate((text, urgent) => T.addTask(state, text, today, urgent)));
handle('tasks:update', mutate((id, patch) => T.updateTask(state, id, patch)));
handle('tasks:delete', mutate((id) => T.deleteTask(state, id)));
handle('tasks:reorder', mutate((ids) => T.reorder(state, ids)));
handle('history:query', (opts) => { checkDate(); return T.historyQuery(state, opts || {}); });
handle('history:restore', mutate((hid) => T.restoreFromHistory(state, hid, today)));
handle('recur:add', mutate((r) => R.addRecurring(state, r, today)));
handle('recur:update', mutate((id, patch) => R.updateRecurring(state, id, patch || {}, today)));
handle('recur:delete', mutate((id) => R.deleteRecurring(state, id)));
handle('settings:get', () => pubSettings());
handle('win:minimize', () => win.minimize());
handle('win:close', () => win.hide());
let rs = null;
ipcMain.on('win:resize', (_e, edge) => {
  if (!win || win.isDestroyed()) return;
  const c = screen.getCursorScreenPoint();
  if (edge) { rs = { edge, b: win.getBounds(), x: c.x, y: c.y }; return; }
  if (!rs) return;
  const [mw, mh] = win.getMinimumSize(); const dx = c.x - rs.x, dy = c.y - rs.y; let { x, y, width, height } = rs.b;
  if (rs.edge.includes('e')) width = Math.max(mw, width + dx);
  if (rs.edge.includes('s')) height = Math.max(mh, height + dy);
  if (rs.edge.includes('w')) { const w = Math.max(mw, width - dx); x += width - w; width = w; }
  if (rs.edge.includes('n')) { const h = Math.max(mh, height - dy); y += height - h; height = h; }
  win.setBounds({ x, y, width, height });
});
ipcMain.on('win:resizeEnd', () => { rs = null; });
handle('win:pin', () => setSetting('alwaysOnTop', !settings.alwaysOnTop));
handle('settings:set', (k, v) => setSetting(k, v));
handle('vault:status', () => ({ exists: fs.existsSync(F.vault()), unlocked: !!vault.key }));
handle('vault:setup', async (pw) => {
  if (fs.existsSync(F.vault())) throw new Error('记事本已存在');
  if (typeof pw !== 'string' || pw.length === 0) throw new Error('密码不能为空');
  const v = await V.createVault(pw); writeJson(F.vault(), v.file); vault = v; relock.touch(); return v.notes;
});
let failCount = 0, failUntil = 0;
handle('vault:unlock', async (pw) => {
  if (Date.now() < failUntil) throw new Error(`尝试过多，请 ${Math.ceil((failUntil - Date.now()) / 1000)} 秒后再试`);
  const file = readJson(F.vault(), null); if (!file) throw new Error('记事本文件不存在或损坏');
  try { const o = await V.openVault(pw, file); vault = { ...o, file }; failCount = 0; relock.touch(); return o.notes; }
  catch (e) { if (e.code === 'BAD_PASSWORD' && ++failCount >= 5) failUntil = Date.now() + 30000; throw e; }
});
handle('vault:save', (notes) => {
  if (!vault.key) { const e = new Error('已锁定'); e.code = 'LOCKED'; throw e; }
  if (!notes || !Array.isArray(notes.notes)) throw new Error('数据无效');
  vault.notes = notes; vault.file = V.sealVault(vault.key, notes, vault.file); writeJson(F.vault(), vault.file); relock.touch(); return true;
});
handle('vault:touch', () => { if (vault.key) relock.touch(); });
handle('vault:lock', () => lockVault('manual'));
handle('vault:lockReady', () => { if (lockReady) lockReady(); });
handle('vault:changePassword', async (oldPw, newPw, notes) => {
  const file = vault.file || readJson(F.vault(), null);
  if (!file) throw new Error('记事本文件不存在或损坏');
  // 优先用渲染进程flush过来的最新笔记；否则用内存中已解锁的，再否则由 changePassword 从文件解密
  const latest = (notes && Array.isArray(notes.notes)) ? notes : vault.notes;
  const nv = await V.changePassword(oldPw, newPw, file, latest);
  writeJson(F.vault(), nv.file);
  if (vault.key) vault.key.fill(0);
  vault = { key: nv.key, notes: nv.notes, file: nv.file };
  relock.touch();
  return true;
});

app.on('second-instance', () => win && showWin());
// macOS：点 Dock 图标时显示窗口；关闭窗口只隐藏（与 Windows 托盘行为一致），Cmd+Q 退出
app.on('activate', () => { if (win) { hideBall(); showWin(); } });
app.on('window-all-closed', () => { if (process.platform !== 'darwin' && quitting) app.quit(); });
function buildAppMenu() {
  if (process.platform !== 'darwin') return;
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'DoneDesk', submenu: [{ role: 'about' }, { type: 'separator' }, { label: L('win.settings'), accelerator: 'Cmd+,', click: () => { showWin(); send('open:settings'); } }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' }, { label: L('tray.quit'), accelerator: 'Cmd+Q', click: () => { quitting = true; app.quit(); } }] },
    { role: 'editMenu' },
    { label: 'Window', submenu: [{ role: 'minimize' }, { label: L('win.close'), accelerator: 'Cmd+W', click: () => win && win.hide() }, { role: 'front' }] },
  ]));
}
app.on('before-quit', () => { quitting = true; });
app.on('will-quit', () => globalShortcut.unregisterAll());
app.whenReady().then(async () => {
  if (process.platform === 'win32') app.setAppUserModelId('com.gusuccess.donedesk');
  settings = { ...defaults, ...readJson(F.settings(), {}) };
  state = T.normalize(readJson(F.tasks(), T.emptyState()));
  today = T.localDate(); T.rollover(state, today); R.materialize(state, today); saveTasks();
  setLang(); relock.setMinutes(settings.relockMinutes);
  applyTheme(settings.theme || 'system');
  createWindow(); createBall(); createBubble(); buildTray(); buildAppMenu();
  if (process.platform === 'darwin') { ball.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }); bub.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }); }
  try { hotkeyOk = globalShortcut.register(HOTKEY, toggleWin); } catch { hotkeyOk = false; }
  if (!hotkeyOk) {
    const msg = L('hotkey.fail', { k: HOTKEY });
    console.warn(msg); win.webContents.once('did-finish-load', () => send('notice', msg));
  }
  setInterval(checkDate, 20000);
  powerMonitor.on('resume', checkDate);
  powerMonitor.on('lock-screen', () => lockVault('screen'));
  if (process.env.TN_SMOKE) { // 冒烟测试：加载完成后自检、截图、退出 0
    const out = process.env.TN_SMOKE; const fail = (e) => { console.error('SMOKE FAIL', e); app.exit(1); };
    win.webContents.once('did-finish-load', () => setTimeout(async () => {
      try {
        const info = await win.webContents.executeJavaScript(`(async () => ({ title: document.title, tabs: document.querySelectorAll('.tab').length, brand: document.querySelector('.brand')?.textContent, v: (await window.api.call('tasks:get')).today }))()`);
        const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(out, 'smoke-window.png'), img.toPNG());
        const ok = info.title === 'DoneDesk' && info.tabs === 4 && !!info.v && !!tray && !!ball;
        fs.writeFileSync(path.join(out, 'smoke.json'), JSON.stringify({ ok, info, platform: process.platform, arch: process.arch, version: app.getVersion(), hotkeyOk }, null, 1));
        console.log('SMOKE', ok ? 'OK' : 'BAD', JSON.stringify(info));
        setTimeout(() => { quitting = true; app.exit(ok ? 0 : 2); }, Number(process.env.TN_SMOKE_HOLD || 8000));
      } catch (e) { fail(e); }
    }, 1500));
  }
  if (process.env.TN_E2E) require('./e2e').run(win, process.env.TN_E2E, { ballClick: () => { hideBall(); showWin(); }, toggle: toggleWin }).catch((e) => { console.error('E2E CRASH', e); return false; }).then((ok) => { quitting = true; app.exit(ok ? 0 : 1); });
  if (process.env.TN_SCREENSHOT) require('./shot').run(win, process.env.TN_SCREENSHOT, { ball: () => ball, bub: () => bub, update: updateBall, show: showBall }).catch((e) => console.error('SHOT FAIL', e)).then(() => { quitting = true; app.quit(); });
});
