'use strict';
// 加密记事本：scrypt (N=2^17,r=8,p=1) 派生 256 位密钥 + AES-256-GCM。
const crypto = require('crypto');

const DEFAULT_KDF = { name: 'scrypt', N: 1 << 17, r: 8, p: 1, keyLen: 32 };

function deriveKey(password, salt, kdf) {
  if (typeof password !== 'string' || password.length === 0) throw new Error('密码不能为空');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password.normalize('NFKC'), salt, kdf.keyLen, { N: kdf.N, r: kdf.r, p: kdf.p, maxmem: 256 * kdf.N * kdf.r * 2 }, (e, k) => (e ? reject(e) : resolve(k)));
  });
}

function encryptWithKey(key, obj, kdf, saltB64) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const aad = Buffer.from('task-notepad-vault-v1');
  c.setAAD(aad);
  const ct = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return { v: 1, kdf: { ...kdf, salt: saltB64 }, iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), ct: ct.toString('base64') };
}

function decryptWithKey(key, file) {
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(file.iv, 'base64'));
  d.setAAD(Buffer.from('task-notepad-vault-v1'));
  d.setAuthTag(Buffer.from(file.tag, 'base64'));
  try {
    const pt = Buffer.concat([d.update(Buffer.from(file.ct, 'base64')), d.final()]);
    return JSON.parse(pt.toString('utf8'));
  } catch { const e = new Error('密码错误'); e.code = 'BAD_PASSWORD'; throw e; }
}

async function createVault(password, kdf = DEFAULT_KDF) {
  const salt = crypto.randomBytes(16);
  const key = await deriveKey(password, salt, kdf);
  const notes = { notes: [] };
  return { key, notes, file: encryptWithKey(key, notes, kdf, salt.toString('base64')) };
}

async function openVault(password, file) {
  if (!file || file.v !== 1) throw new Error('不支持的记事本文件格式');
  const { salt, ...kdf } = file.kdf;
  const key = await deriveKey(password, Buffer.from(salt, 'base64'), kdf);
  return { key, notes: decryptWithKey(key, file) };
}

function sealVault(key, notes, oldFile) {
  const { salt, ...kdf } = oldFile.kdf;
  return encryptWithKey(key, notes, kdf, salt); // 每次新 IV
}

// 闲置自动锁定计时器，可注入时钟/定时器以便测试
class RelockTimer {
  constructor(onLock, timers = { setTimeout, clearTimeout }) { this.onLock = onLock; this.t = timers; this.h = null; this.minutes = 15; }
  setMinutes(m) { this.minutes = m; if (this.h) this.touch(); }
  touch() {
    this.stop();
    if (!this.minutes || this.minutes <= 0) return; // 0 = 直到重启才锁
    this.h = this.t.setTimeout(() => { this.h = null; this.onLock(); }, this.minutes * 60000);
  }
  stop() { if (this.h) { this.t.clearTimeout(this.h); this.h = null; } }
}

// 修改密码：用旧密码打开（校验），用新密码重新派生密钥并重加密内容。notes 优先用内存中的最新数据。
async function changePassword(oldPw, newPw, file, notes) {
  if (typeof newPw !== 'string' || newPw.length === 0) throw new Error('新密码不能为空');
  if (typeof oldPw !== 'string' || oldPw.length === 0) throw new Error('密码不能为空');
  if (oldPw === newPw) throw new Error('新密码不能与旧密码相同');
  const opened = await openVault(oldPw, file);
  const data = notes && Array.isArray(notes.notes) ? notes : opened.notes;
  const nv = await createVault(newPw, file.kdf ? { name: file.kdf.name, N: file.kdf.N, r: file.kdf.r, p: file.kdf.p, keyLen: file.kdf.keyLen } : DEFAULT_KDF);
  opened.key.fill(0);
  return { key: nv.key, notes: data, file: sealVault(nv.key, data, nv.file) };
}

module.exports = { DEFAULT_KDF, createVault, openVault, sealVault, changePassword, RelockTimer };
