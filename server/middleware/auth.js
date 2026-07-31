const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');
const config = require('../config');

const COOKIE_NAME = 'pp_admin_session';
const SESSION_DAYS = 7;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createSession() {
  const db = getDb();
  const raw = crypto.randomBytes(32).toString('hex');
  const token = hashToken(raw);
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  db.prepare(
    `INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)`
  ).run(token, expires.toISOString());
  return { raw, expires };
}

function destroySession(rawToken) {
  if (!rawToken) return;
  const db = getDb();
  db.prepare(`DELETE FROM admin_sessions WHERE token = ?`).run(hashToken(rawToken));
}

function getValidSession(rawToken) {
  if (!rawToken) return null;
  const db = getDb();
  const row = db
    .prepare(`SELECT token, expires_at FROM admin_sessions WHERE token = ?`)
    .get(hashToken(rawToken));
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    db.prepare(`DELETE FROM admin_sessions WHERE token = ?`).run(row.token);
    return null;
  }
  return row;
}

async function verifyCredentials(username, password) {
  if (username !== config.adminUsername) {
    await bcrypt.compare(password || 'x', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012');
    return false;
  }
  const a = Buffer.from(String(password || ''));
  const b = Buffer.from(String(config.adminPassword));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function requireAdmin(req, res, next) {
  const raw = req.cookies?.[COOKIE_NAME];
  const session = getValidSession(raw);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  req.admin = true;
  next();
}

function setSessionCookie(res, raw, expires) {
  res.cookie(COOKIE_NAME, raw, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    expires,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

module.exports = {
  COOKIE_NAME,
  createSession,
  destroySession,
  getValidSession,
  verifyCredentials,
  requireAdmin,
  setSessionCookie,
  clearSessionCookie,
};
