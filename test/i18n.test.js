const test = require('node:test'); const assert = require('node:assert');
const fs = require('fs'); const path = require('path');
const I = require('../src/renderer/i18n');
test('zh/en 键集合一致', () => {
  assert.deepEqual(Object.keys(I.dict.en).sort(), Object.keys(I.dict.zh).sort());
});
test('HTML 中引用的 i18n 键都存在', () => {
  const html = fs.readFileSync(path.join(__dirname, '../src/renderer/index.html'), 'utf8');
  const keys = [...html.matchAll(/data-i18n(?:-ph|-title)?="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(keys.length > 40);
  for (const k of keys) assert.ok(k in I.dict.zh && k in I.dict.en, k);
});
test('app.js 中 t() 引用的键都存在', () => {
  const js = fs.readFileSync(path.join(__dirname, '../src/renderer/app.js'), 'utf8') + fs.readFileSync(path.join(__dirname, '../src/main.js'), 'utf8');
  for (const m of js.matchAll(/\b[tL]\('([\w.]+)'/g)) assert.ok(m[1] in I.dict.en, m[1]);
});
test('插值与回退', () => {
  const en = I.make('en'), zh = I.make('zh'), xx = I.make('fr');
  assert.equal(en('remain', { n: 3 }), '3 left'); assert.equal(zh('remain', { n: 3 }), '剩余 3 项');
  assert.equal(xx.lang, 'zh'); assert.equal(xx('today'), '今天');
  assert.equal(en('no.such.key'), 'no.such.key');
});
test('语言解析：默认跟随系统，未知回退中文', () => {
  assert.equal(I.resolveLang('system', 'zh-CN'), 'zh'); assert.equal(I.resolveLang('system', 'en-US'), 'en');
  assert.equal(I.resolveLang('system', 'de-DE'), 'en'); assert.equal(I.resolveLang(undefined, ''), 'zh');
  assert.equal(I.resolveLang('en', 'zh-CN'), 'en'); assert.equal(I.resolveLang('zh', 'en-US'), 'zh');
});
test('错误信息翻译', () => {
  const en = I.make('en'), zh = I.make('zh');
  assert.equal(en.err('密码错误'), 'Wrong password'); assert.equal(zh.err('密码错误'), '密码错误');
  assert.equal(en.err('尝试过多，请 12 秒后再试'), 'Too many attempts, try again in 12s');
  for (const v of Object.values(I.errs)) assert.ok(/^[\x20-\x7e]+$/.test(v));
});
test('所有模块抛出的中文错误都有英文翻译', () => {
  for (const f of ['tasks.js', 'recur.js', 'vault.js', 'main.js']) {
    const src = fs.readFileSync(path.join(__dirname, '../src', f), 'utf8');
    for (const m of src.matchAll(/new Error\('([^']+)'\)/g)) assert.ok(m[1] in I.errs, `${f}: ${m[1]}`);
  }
});
