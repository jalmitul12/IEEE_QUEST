const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const WAIT_ARRAY = new Int32Array(new SharedArrayBuffer(4));
const LOCK_STALE_MS = 15000;

fs.mkdirSync(DATA_DIR, { recursive: true });

function safeName(name) {
  if (typeof name !== 'string' || !/^[a-zA-Z0-9._-]+\.json$/.test(name)) throw new Error('Invalid data file name.');
  return name;
}
function file(name) { return path.join(DATA_DIR, safeName(name)); }
function sleep(ms) { Atomics.wait(WAIT_ARRAY, 0, 0, ms); }
function rawRead(name, fallback) {
  try {
    const text = fs.readFileSync(file(name), 'utf8');
    return JSON.parse(text);
  } catch (err) {
    if (err.code === 'ENOENT') return structuredClone(fallback);
    if (err instanceof SyntaxError) {
      const e = new Error(`Data file ${name} contains invalid JSON and was not overwritten.`);
      e.code = 'DATA_CORRUPT';
      throw e;
    }
    throw err;
  }
}
function atomicWrite(name, value) {
  const target = file(name);
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  const payload = JSON.stringify(value, null, 2) + '\n';
  let fd;
  try {
    fd = fs.openSync(tmp, 'w', 0o600);
    fs.writeFileSync(fd, payload, 'utf8');
    fs.fsyncSync(fd);
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
  fs.renameSync(tmp, target);
  try { fs.chmodSync(target, 0o600); } catch {}
  return value;
}
function lockIsStale(lock) {
  try { return Date.now() - fs.statSync(lock).mtimeMs > LOCK_STALE_MS; }
  catch { return false; }
}
function withLock(name, fn) {
  const lock = `${file(name)}.lock`;
  const deadline = Date.now() + 4000;
  let fd;
  while (fd === undefined) {
    try {
      fd = fs.openSync(lock, 'wx', 0o600);
      fs.writeFileSync(fd, `${process.pid}\n${Date.now()}\n`, 'utf8');
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      if (lockIsStale(lock)) {
        try { fs.unlinkSync(lock); } catch {}
        continue;
      }
      if (Date.now() >= deadline) throw new Error(`Timed out waiting for data lock: ${name}`);
      sleep(20);
    }
  }
  try { return fn(); }
  finally {
    try { fs.closeSync(fd); } catch {}
    try { fs.unlinkSync(lock); } catch {}
  }
}
function readJson(name, fallback = []) { return rawRead(name, fallback); }
function writeJson(name, value) { return withLock(name, () => atomicWrite(name, value)); }
function updateJson(name, fallback, updater) {
  return withLock(name, () => {
    const current = rawRead(name, fallback);
    const next = updater(current);
    if (next === undefined) throw new Error('updateJson updater must return a value.');
    atomicWrite(name, next);
    return next;
  });
}
module.exports = { readJson, writeJson, updateJson, file, DATA_DIR };
