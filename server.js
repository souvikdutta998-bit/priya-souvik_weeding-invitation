require('dotenv').config();
const express = require('express');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const port = Number(process.env.PORT || 3000);
const adminPassword = process.env.ADMIN_PASSWORD;
const secret = process.env.SESSION_SECRET;
if (!adminPassword || !secret) {
  console.error('Set ADMIN_PASSWORD and SESSION_SECRET before starting the server.');
  process.exit(1);
}
const dbPath = path.resolve(process.env.DB_PATH || './data/blessings.sqlite');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS blessings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  message TEXT NOT NULL CHECK(length(message) <= 500),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);
app.use(express.json({ limit: '12kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function safeEqual(a, b) {
  const aa = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function makeToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}
function isAdmin(req) {
  const token = req.headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith('ps_admin='))?.slice(9);
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  if (!safeEqual(sig, expected)) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now(); }
  catch { return false; }
}
function requireAdmin(req, res, next) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Please sign in again.' });
  next();
}

app.post('/api/blessings', (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim().slice(0, 80) : '';
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!message) return res.status(400).json({ error: 'Please write a blessing before sending.' });
  if (message.length > 500) return res.status(400).json({ error: 'Blessings must be 500 characters or fewer.' });
  const result = db.prepare('INSERT INTO blessings (name, message) VALUES (?, ?)').run(name || 'A well-wisher', message);
  res.status(201).json({ ok: true, id: result.lastInsertRowid });
});
app.post('/api/admin/login', (req, res) => {
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!safeEqual(password, adminPassword)) return res.status(401).json({ error: 'That password is not correct.' });
  res.setHeader('Set-Cookie', `ps_admin=${makeToken()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  res.json({ ok: true });
});
app.get('/api/admin/blessings', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT id, name, message, created_at FROM blessings ORDER BY id DESC').all();
  res.json({ blessings: rows });
});
app.post('/api/admin/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'ps_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  res.json({ ok: true });
});
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(port, () => console.log(`Priya & Souvik invitation running on http://localhost:${port}`));
