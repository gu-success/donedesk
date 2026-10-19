'use strict';
// 原子写入 JSON（写临时文件 -> fsync -> rename），并保留 .bak 防止损坏丢数据
const fs = require('fs');
const path = require('path');
function readJson(file, fallback) {
  for (const f of [file, file + '.bak']) {
    try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') console.error('读取失败', f, e.message); }
  }
  return fallback;
}
function writeJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  const fd = fs.openSync(tmp, 'w', 0o600);
  try { fs.writeSync(fd, JSON.stringify(obj, null, 1)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  if (fs.existsSync(file)) { try { fs.copyFileSync(file, file + '.bak'); } catch {} }
  renameRetry(tmp, file);
}
// Windows 上杀毒/索引程序短暂占用文件时 rename 会报 EPERM/EBUSY/EACCES，稍等重试
function renameRetry(from, to, tries = 5) {
  for (let i = 0; ; i++) {
    try { return fs.renameSync(from, to); } catch (e) {
      if (i >= tries - 1 || !['EPERM', 'EBUSY', 'EACCES'].includes(e.code)) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50 * (i + 1));
    }
  }
}
module.exports = { readJson, writeJson };
