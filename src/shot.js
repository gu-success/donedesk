'use strict';
// 截图自动化（仅在 TN_SCREENSHOT 环境变量设置时运行）
const fs = require('fs'); const path = require('path');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
exports.run = async (win, dir, extra) => {
  const shots115 = async () => {
    const W = [1, 2, 3, 4, 5];
    for (const [lg, th, op] of [['en', 'light', 1], ['zh', 'light', 1], ['en', 'dark', 1], ['zh', 'dark', 0.55], ['en', 'light', 0.55]]) {
      await set('lang', lg); await set('theme', th); await set('opacity', op); await seed(lg); await wait(300);
      const tag = `${lg}-${th}${op < 1 ? '-op55' : ''}`;
      await js(`window.__tn.showTab('tasks'); window.__tn.openPop({mode:'arm'}); window.__tn.setFreq('weekly'); document.querySelectorAll('#rWeek input').forEach(c=>c.checked=${JSON.stringify(W)}.includes(Number(c.value)));`); await snap(`pop-weekly-${tag}.png`);
      await js(`window.__tn.setFreq('monthly');`); await snap(`pop-monthly-${tag}.png`);
      await js(`window.__tn.setFreq('weekly'); document.getElementById('rOk').click(); await new Promise(r=>setTimeout(r,200)); document.getElementById('newText').value=${JSON.stringify(lg === 'en' ? 'Gym session' : '健身')};`); await snap(`pop-armed-${tag}.png`);
      await js(`window.__tn.setRecur(null); document.getElementById('newText').value=''; window.__tn.showTab('recurring'); const c=window.api.call;
        let v=await c('tasks:get'); if (v.recurring.length<3) { v=await c('recur:add',{text:${JSON.stringify(lg === 'en' ? 'Water the plants' : '给植物浇水')},urgent:false,rule:{type:'monthly',day:1,time:'08:00'}});
        v=await c('recur:add',{text:${JSON.stringify(lg === 'en' ? 'Pay rent' : '交房租')},urgent:true,rule:{type:'monthly',day:28,time:'20:00'}}); v=await c('recur:update',v.recurring[1].id,{paused:true}); }
        window.__tn.render(v);`); await snap(`recur-tab-${tag}.png`);
      await js(`window.__tn.openPop({mode:'new'}); window.__tn.setFreq('daily');`); await snap(`recur-new-${tag}.png`);
      await js(`window.__tn.closePop(); window.__tn.showTab('tasks'); window.__tn.celebrate();`); await wait(450); { const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(dir, `cele-${tag}.png`), img.toPNG()); } await wait(1700);
    }
    await set('opacity', 1); await set('theme', 'light');
  };
  fs.mkdirSync(dir, { recursive: true });
  win.webContents.on('console-message', (_e, l, m, line) => console.log('[renderer]', m, line));
  await new Promise((r) => win.webContents.once('did-finish-load', r)); await wait(500);
  const js = (c) => win.webContents.executeJavaScript(`(async()=>{${c}})()`);
  const set = (k, v) => js(`await window.api.call('settings:set', ${JSON.stringify(k)}, ${JSON.stringify(v)})`);
  const snap = async (name, w = win) => { console.log('snap', name); await wait(600); const img = await w.webContents.capturePage(); fs.writeFileSync(path.join(dir, name), img.toPNG()); };
  const SAMPLE = {
    zh: { tasks: [['给客户回电话，确认合同细节', true], ['写本周周报', false], ['买牛奶', false], ['交电费', true], ['整理桌面文件', false], ['预约牙医', false]], done: '买牛奶', drag: '写本周周报', recur: '晨会' },
    en: { tasks: [['Call the client about the contract', true], ['Write the weekly report', false], ['Buy milk', false], ['Pay the electricity bill', true], ['Tidy up desktop files', false], ['Book a dentist appointment', false]], done: 'Buy milk', drag: 'Write the weekly report', recur: 'Stand-up meeting' } };
  const seed = async (lg) => { await js(`window.__S=${JSON.stringify(SAMPLE[lg])};` + SEED + `window.__tn.render(v);`); await wait(300); };
  await set('lang', 'zh'); await set('theme', 'light'); await wait(300);
  const SEED = `
    const c = window.api.call; let v;
    v = await c('tasks:get'); for (const r of v.recurring) v = await c('recur:delete', r.id); for (const x of v.tasks) v = await c('tasks:delete', x.id);
    for (const [t,u] of window.__S.tasks) v = await c('tasks:add', t, u);
    v = await c('tasks:update', v.tasks.find(t=>t.text===window.__S.done).id, {done:true});
    v = await c('recur:add', {text:window.__S.recur, urgent:false, rule:{type:'weekly', weekdays:[1,2,3,4,5], time:'09:30'}});
`;
  await seed('zh');
  if (process.env.TN_SHOT_ONLY === '115') { await shots115(); return; }
  await snap('zh-light-tasks.png');
  // 拖动中
  await js(`const li=[...document.querySelectorAll('#list li')].find(l=>l.textContent.includes(window.__S.drag)); const r=li.getBoundingClientRect();
    window.__tn.drag.startDrag(li, r.left+60, r.top+r.height/2); await new Promise(r=>setTimeout(r,250));
    for (let i=1;i<=6;i++){ window.__tn.drag.moveDrag(r.left+70, r.top+r.height/2+i*15); await new Promise(r=>setTimeout(r,40)); }`);
  await snap('zh-light-dragging.png');
  await js(`window.__tn.drag.endDrag();`); await wait(600);
  await js(`window.__tn.openSettings(true);`); await snap('zh-light-settings.png');
  await js(`window.__tn.openSettings(false); window.__tn.showTab('notes');`); await snap('zh-light-notes-setup.png');
  await js(`window.__tn.showTab('tasks');`);
  await set('lang', 'en'); await seed('en'); await snap('en-light-tasks.png');
  await js(`window.__tn.showTab('history');`); await wait(400); await snap('en-light-history.png');
  await js(`const q=document.getElementById('hQ'); q.value='report'; q.dispatchEvent(new Event('input'));`); await wait(500); await snap('en-light-history-search.png');
  await js(`const q=document.getElementById('hQ'); q.value=''; q.dispatchEvent(new Event('input')); document.getElementById('hPrev').click();`); await wait(500); await snap('en-light-history-day.png');
  await js(`document.getElementById('hAll').click(); window.__tn.showTab('tasks');`); await wait(300);
  await js(`window.__tn.openSettings(true);`); await snap('en-light-settings.png');
  await set('theme', 'dark'); await snap('en-dark-settings.png');
  await js(`window.__tn.openSettings(false);`); await snap('en-dark-tasks.png');
  await js(`window.__tn.showTab('history');`); await snap('en-dark-history.png'); await set('opacity', 0.55); await snap('en-dark-history-opacity55.png'); await set('opacity', 1); await js(`window.__tn.showTab('tasks');`);
  await set('lang', 'zh'); await seed('zh'); await snap('zh-dark-tasks.png');
  await set('opacity', 0.55); await snap('zh-dark-opacity55.png');
  await set('theme', 'light'); await snap('zh-light-opacity55.png');
  await js(`window.__tn.openSettings(true);`); await snap('zh-light-opacity55-settings.png');
  await js(`window.__tn.openSettings(false);`); await set('opacity', 1);
  // --- 1.1.3：折叠输入栏 / 周期弹出 / 改密 / 字体 ---
  await set('lang', 'en'); await set('theme', 'light'); await seed('en'); await wait(300);
  await js(`window.__tn.collapseAdd();`); await wait(500); await snap('en-light-add-collapsed.png');
  await js(`window.__tn.expandAdd();`); await wait(400); await snap('en-light-add-expanded.png');
  await js(`window.__tn.openPop({mode:'arm'}); window.__tn.setFreq('weekly');`); await wait(400); await snap('en-light-recur-pop.png');
  await js(`document.getElementById('rOk').click();`); await wait(300);
  await js(`document.getElementById('newText').value='Team standup';`); await snap('en-light-recur-armed.png');
  await js(`window.__tn.setRecur(null); document.getElementById('newText').value=''; window.__tn.collapseAdd();`);
  // 改密成功
  await js(`
    const c=window.api.call;
    try { await c('vault:setup','oldpass'); } catch (e) {}
    window.__tn.openSettings(true);
    await new Promise(r=>setTimeout(r,200));
    const det=document.querySelector('#settings details'); det.open=true;
    det.scrollIntoView({block:'center'});
    document.getElementById('cp0').value='oldpass';
    document.getElementById('cp1').value='newpass';
    document.getElementById('cp2').value='newpass';
    document.getElementById('cpBtn').click();
    await new Promise(r=>setTimeout(r,3000));
    det.scrollIntoView({block:'center'});`);
  await snap('en-light-password-changed.png');
  await js(`window.__tn.openSettings(false); await window.api.call('vault:lock');`);
  // 字体预览
  await set('font', 'yahei'); await wait(300); await snap('en-light-font-yahei.png');
  await set('font', 'inter'); await wait(300); await snap('en-light-font-inter.png');
  await js(`window.__tn.openSettings(true);`); await wait(300); await snap('en-light-font-settings.png');
  await js(`window.__tn.openSettings(false);`); await set('font', 'system');
  await js(`window.__tn.showTab('history');`); await wait(400); await snap('en-light-history-113.png');
  // 悬浮球 + 气泡
  win.minimize(); await wait(800); extra.show(); await wait(800);
  for (const [th, lg] of [['light', 'zh'], ['dark', 'en']]) {
    await set('theme', th); await set('lang', lg); await seed(lg); await wait(500); extra.ball().setBounds({ x: 700, y: 400, width: 64, height: 64 }); extra.update(); await wait(700);
    await snap(`ball-${th}.png`, extra.ball()); await snap(`bubble-${th}.png`, extra.bub());
    fs.writeFileSync(path.join(dir, `ball-${th}.json`), JSON.stringify({ ball: extra.ball().getBounds(), bub: extra.bub().getBounds(), ballVisible: extra.ball().isVisible(), bubVisible: extra.bub().isVisible() }));
    if (th === 'light') for (const [nm, px, py] of [['edge-right', 1280 - 70, 400], ['edge-topleft', 20, 10], ['edge-topright', 1280 - 70, 10]]) {
      extra.ball().setBounds({ x: px, y: py, width: 64, height: 64 }); extra.update(); await wait(700);
      await snap(`ball-${nm}.png`, extra.ball()); await snap(`bubble-${nm}.png`, extra.bub());
      fs.writeFileSync(path.join(dir, `ball-${nm}.json`), JSON.stringify({ ball: extra.ball().getBounds(), bub: extra.bub().getBounds() }));
    }
  }
};
