const test = require('node:test'); const assert = require('node:assert');
const V = require('../src/vault');
const FAST = { name: 'scrypt', N: 1 << 14, r: 8, p: 1, keyLen: 32 };
test('加密往返与错误密码', async () => {
  const { key, notes, file } = await V.createVault('正确密码', FAST);
  notes.notes.push({ id: '1', title: '银行', body: '秘密 123' });
  const sealed = V.sealVault(key, notes, file);
  assert.ok(!JSON.stringify(sealed).includes('秘密'));
  const sealed2 = V.sealVault(key, notes, file); assert.notEqual(sealed.iv, sealed2.iv, 'IV 每次不同');
  const o = await V.openVault('正确密码', sealed);
  assert.equal(o.notes.notes[0].body, '秘密 123');
  await assert.rejects(V.openVault('错误', sealed), { code: 'BAD_PASSWORD' });
  const tampered = { ...sealed, ct: Buffer.from('x' + sealed.ct).toString('base64') };
  await assert.rejects(V.openVault('正确密码', tampered));
});
test('默认 KDF 强度', async () => {
  assert.ok(V.DEFAULT_KDF.N >= 1 << 17);
  const { file } = await V.createVault('p'); await V.openVault('p', file);
});
test('自动锁定计时器', () => {
  let now = 0; const q = [];
  const timers = { setTimeout: (f, ms) => { const h = { f, at: now + ms }; q.push(h); return h; }, clearTimeout: (h) => { h.f = null; } };
  const tick = (ms) => { now += ms; for (const h of q) if (h.f && h.at <= now) { const f = h.f; h.f = null; f(); } };
  let locked = 0; const t = new V.RelockTimer(() => locked++, timers);
  t.setMinutes(5); t.touch();
  tick(4 * 60000); assert.equal(locked, 0);
  t.touch(); tick(4 * 60000); assert.equal(locked, 0, '活动后重新计时');
  tick(60000); assert.equal(locked, 1);
  t.setMinutes(0); t.touch(); tick(1e9); assert.equal(locked, 1, '“直到重启”不锁');
});
test('密码不限长度：1 个字符可用，空密码拒绝', async () => {
  const V = require('../src/vault');
  const v = await V.createVault('x'); const f = V.sealVault(v.key, { notes: [{ id: '1', title: 't', body: 'b' }] }, v.file);
  const o = await V.openVault('x', f); assert.equal(o.notes.notes[0].body, 'b');
  await assert.rejects(() => V.createVault(''));
  const src = require('fs').readFileSync(require('path').join(__dirname, '../src/main.js'), 'utf8');
  assert.ok(!/length\s*<\s*[2-9]/.test(src), 'main.js 不应有最小长度限制');
});

test('修改密码：重加密后旧密码失效、新密码可读', async () => {
  const FAST = { name: 'scrypt', N: 1 << 14, r: 8, p: 1, keyLen: 32 };
  let v = await V.createVault('old-pw', FAST);
  v.notes = { notes: [{ id: '1', title: '卡', body: '密文内容' }] };
  v.file = V.sealVault(v.key, v.notes, v.file);
  const nv = await V.changePassword('old-pw', 'new-pw', v.file, v.notes);
  const o = await V.openVault('new-pw', nv.file);
  assert.equal(o.notes.notes[0].body, '密文内容');
  await assert.rejects(V.openVault('old-pw', nv.file), { code: 'BAD_PASSWORD' });
});
test('修改密码：空/相同/错误旧密码均拒绝', async () => {
  const FAST = { name: 'scrypt', N: 1 << 14, r: 8, p: 1, keyLen: 32 };
  const v = await V.createVault('abc', FAST);
  await assert.rejects(() => V.changePassword('abc', '', v.file, v.notes));
  await assert.rejects(() => V.changePassword('abc', 'abc', v.file, v.notes));
  await assert.rejects(() => V.changePassword('wrong', 'xyz', v.file, v.notes), { code: 'BAD_PASSWORD' });
  await assert.rejects(() => V.changePassword('', 'xyz', v.file, v.notes));
});
test('修改密码：未传入 notes 时从文件解密', async () => {
  const FAST = { name: 'scrypt', N: 1 << 14, r: 8, p: 1, keyLen: 32 };
  let v = await V.createVault('a', FAST);
  v.notes = { notes: [{ id: '1', title: '', body: 'from-file' }] };
  v.file = V.sealVault(v.key, v.notes, v.file);
  const nv = await V.changePassword('a', 'b', v.file, null);
  assert.equal((await V.openVault('b', nv.file)).notes.notes[0].body, 'from-file');
});
