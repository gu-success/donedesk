'use strict';
// 端到端交互测试（仅在 TN_E2E 环境变量设置时运行）：用真实的鼠标/键盘输入事件驱动窗口，
// 校验输入框在各种操作之后都能输入。结果写入 <dir>/e2e.json，进程以 0（全部通过）/1 退出。
const fs = require('fs'); const path = require('path');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
exports.run = async (win, dir, hooks) => {
  fs.mkdirSync(dir, { recursive: true });
  const wc = win.webContents; const results = [];
  await new Promise((r) => wc.once('did-finish-load', r)); await wait(700);
  const js = (c) => wc.executeJavaScript(`(async()=>{${c}})()`);
  const center = async (sel) => { const r = await js(`const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; const b=e.getBoundingClientRect(); return {x:Math.round(b.left+b.width/2), y:Math.round(b.top+b.height/2), w:b.width}`); if (!r || !r.w) throw new Error('not visible: ' + sel); return r; };
  const click = async (sel) => {  const { x, y } = await center(sel); wc.sendInputEvent({ type: 'mouseMove', x, y }); wc.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 }); await wait(30); wc.sendInputEvent({ type: 'mouseUp', x, y, button: 'left', clickCount: 1 }); await wait(120); };
  const type = async (s) => { for (const ch of s) { wc.sendInputEvent({ type: 'char', keyCode: ch }); await wait(8); } await wait(80); };
  const key = async (k) => { wc.sendInputEvent({ type: 'keyDown', keyCode: k }); if (k === 'Enter') wc.sendInputEvent({ type: 'char', keyCode: '\r' }); wc.sendInputEvent({ type: 'keyUp', keyCode: k }); await wait(250); };
  const focusAdd = async () => {  if (await js(`return document.getElementById('addWrap').classList.contains('collapsed')`)) await click('#addFab'); else await click('#newText'); };
  const val = (sel) => js(`return document.querySelector(${JSON.stringify(sel)}).value`);
  const step = async (name, fn) => { try { await Promise.race([fn(), wait(15000).then(() => { throw new Error('timeout'); })]); results.push({ name, ok: true }); console.log('E2E ok  ', name); } catch (e) { results.push({ name, ok: false, err: String(e && e.message || e) }); console.log('E2E FAIL', name, e && e.message); } };
  const eq = (a, b, m) => { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
  const shot = async (n) => fs.writeFileSync(path.join(dir, n), (await wc.capturePage()).toPNG());
  await js(`const c=window.api.call; let v=await c('tasks:get'); for (const r of v.recurring) await c('recur:delete', r.id); for (const x of v.tasks) await c('tasks:delete', x.id); await c('settings:set','lang','en'); window.__tn.render(await c('tasks:get'));`); await wait(400);

  await step('type into collapsed add bar', async () => { await click('#addFab'); await type('Buy milk'); eq(await val('#newText'), 'Buy milk', 'newText'); await key('Enter'); eq(await js(`return document.querySelectorAll('#list li').length`), 1, 'tasks'); eq(await val('#newText'), '', 'cleared'); });
  await step('keep typing right after submit', async () => { await type('Call mom'); await key('Enter'); eq(await js(`return document.querySelectorAll('#list li').length`), 2, 'tasks'); });
  await step('type after in-app delete confirm', async () => {
    await js(`document.querySelector('#list li .del').click()`); await wait(200);
    eq(await js(`return !document.getElementById('dlg').hidden`), true, 'dialog shown'); await click('#dlgYes'); await wait(200);
    eq(await js(`return document.querySelectorAll('#list li').length`), 1, 'deleted');
    await focusAdd(); await type('Pay rent'); eq(await val('#newText'), 'Pay rent', 'newText after delete'); await key('Enter');
  });
  await step('type after minimize -> ball -> restore (no click)', async () => {
    await focusAdd(); win.minimize(); await wait(500); hooks.ballClick(); await wait(600);
    await type('Walk'); eq(await val('#newText'), 'Walk', 'focus restored'); await js(`document.getElementById('newText').value=''`);
  });
  await step('type after hide -> hotkey toggle show', async () => { await focusAdd(); win.hide(); await wait(300); hooks.toggle(); await wait(500); await type('Gym'); eq(await val('#newText'), 'Gym', 'after toggle'); await js(`document.getElementById('newText').value=''`); });
  await step('type after settings modal open/close', async () => { await click('#wSet'); await wait(250); await click('#sClose'); await wait(250); await focusAdd(); await type('Read'); eq(await val('#newText'), 'Read', 'after settings'); await js(`document.getElementById('newText').value=''`); });
  await step('recurrence: pick first, then add', async () => {
    await focusAdd(); await click('#recurBtn'); await wait(250);
    eq(await js(`return !document.getElementById('recurPop').hidden`), true, 'popover open');
    await click('#rFreq [data-f="weekly"]'); await click('#rOk'); await wait(200);
    eq(await js(`return document.getElementById('recurPop').hidden && !document.getElementById('recurChip').hidden`), true, 'armed chip');
    eq(await js(`return document.activeElement.id`), 'newText', 'input focused');
    await type('Stand-up'); await key('Enter'); await wait(300);
    eq(await js(`return (await window.api.call('tasks:get')).recurring.map(r=>r.text+':'+r.rule.type).join()`), 'Stand-up:weekly', 'recurring created');
    eq(await js(`return document.getElementById('recurChip').hidden`), true, 'chip cleared');
  });
  await step('recurring tab: add, pause, edit', async () => {
    await click('.tab[data-tab="recurring"]'); await wait(250);
    await click('#rcAdd'); await wait(200); await type('Water plants'); await click('#rFreq [data-f="monthly"]'); await click('#rOk'); await wait(300);
    eq(await js(`return document.querySelectorAll('#recurList li').length`), 2, 'two rules');
    await js(`document.querySelector('#recurList li button[title="Pause"]').click()`); await wait(250);
    eq(await js(`return document.querySelectorAll('#recurList li.paused').length`), 1, 'paused');
    await js(`document.querySelector('#recurList li button[title="Edit"]').click()`); await wait(200);
    await click('#rText'); await js(`document.getElementById('rText').select()`); await type('Team stand-up'); await click('#rOk'); await wait(250);
    eq(await js(`return [...document.querySelectorAll('#recurList .rt>div:first-child')].map(e=>e.textContent).includes('Team stand-up')`), true, 'edited');
    await shot('e2e-recurring.png'); await click('.tab[data-tab="tasks"]');
  });
  await step('notes textarea typing (and after tab switches)', async () => {
    await click('.tab[data-tab="notes"]'); await wait(400);
    if (await js(`return !document.getElementById('vSetup').hidden`)) { await click('#sp1'); await type('pw'); await click('#sp2'); await type('pw'); await click('#spBtn'); await wait(1500); }
    else if (await js(`return !document.getElementById('vLock').hidden`)) { await click('#up'); await type('pw'); await key('Enter'); await wait(1500); }
    if (await js(`return document.getElementById('nEditView').hidden`)) { await click('#nNew'); await wait(200); }
    await click('#nBody'); await type('hello'); eq(await val('#nBody'), 'hello', 'textarea');
    await click('.tab[data-tab="tasks"]'); await click('.tab[data-tab="notes"]'); await wait(300); await click('#nBody'); await type(' world'); eq(await val('#nBody'), 'hello world', 'textarea after tab switch');
    win.minimize(); await wait(400); hooks.ballClick(); await wait(600); await type('!'); eq(await val('#nBody'), 'hello world!', 'textarea after restore');
    await click('.tab[data-tab="tasks"]');
  });
  await step('celebration on last task done (not on load)', async () => {
    eq(await js(`return document.getElementById('cele').hidden`), true, 'not on load');
    const n = await js(`return document.querySelectorAll('#list li:not(.done) .cbx').length`);
    for (let i = 0; i < n; i++) { await click('#list li:not(.done) .cbx'); await wait(450); }
    eq(await js(`return !document.getElementById('cele').hidden`), true, 'celebration visible'); await wait(1700);
    eq(await js(`return document.getElementById('cele').hidden`), true, 'auto-hides');
  });
  const ok = results.every((r) => r.ok);
  fs.writeFileSync(path.join(dir, 'e2e.json'), JSON.stringify({ ok, results }, null, 1));
  console.log(ok ? 'E2E PASS' : 'E2E FAILED', results.filter((r) => r.ok).length + '/' + results.length);
  return ok;
};
