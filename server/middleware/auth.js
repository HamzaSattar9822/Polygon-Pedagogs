const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');
const config = require('../config');

const COOKIE_NAME = 'pp_admin_session';
const TUTOR_COOKIE_NAME = 'pp_tutor_session';
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

function createTutorSession(userId) {
  const db = getDb();
  const raw = crypto.randomBytes(32).toString('hex');
  const token = hashToken(raw);
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  db.prepare(
    `INSERT INTO tutor_sessions (token, user_id, expires_at) VALUES (?, ?, ?)`
  ).run(token, userId, expires.toISOString());
  return { raw, expires };
}

function destroyTutorSession(rawToken) {
  if (!rawToken) return;
  const db = getDb();
  db.prepare(`DELETE FROM tutor_sessions WHERE token = ?`).run(hashToken(rawToken));
}

function getValidTutorSession(rawToken) {
  if (!rawToken) return null;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT ts.token, ts.expires_at, ts.user_id,
              u.id AS id, u.username, u.full_name, u.email, u.role, u.active
       FROM tutor_sessions ts
       JOIN users u ON u.id = ts.user_id
       WHERE ts.token = ?`
    )
    .get(hashToken(rawToken));
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    db.prepare(`DELETE FROM tutor_sessions WHERE token = ?`).run(row.token);
    return null;
  }
  if (!row.active || row.role !== 'tutor') {
    db.prepare(`DELETE FROM tutor_sessions WHERE token = ?`).run(row.token);
    return null;
  }
  return row;
}

async function verifyTutorCredentials(username, password) {
  const db = getDb();
  const user = db
    .prepare(
      `SELECT id, username, password_hash, full_name, email, role, active
       FROM users WHERE username = ? COLLATE NOCASE`
    )
    .get(String(username || '').trim());

  if (!user || !user.active || user.role !== 'tutor') {
    await bcrypt.compare(password || 'x', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012');
    return null;
  }

  const ok = await bcrypt.compare(String(password || ''), user.password_hash);
  if (!ok) return null;
  return user;
}

function requireTutor(req, res, next) {
  const raw = req.cookies?.[TUTOR_COOKIE_NAME];
  const session = getValidTutorSession(raw);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  req.tutor = {
    id: session.user_id,
    username: session.username,
    full_name: session.full_name,
    email: session.email,
    role: session.role,
  };
  next();
}

function setTutorSessionCookie(res, raw, expires) {
  res.cookie(TUTOR_COOKIE_NAME, raw, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    expires,
    path: '/',
  });
}

function clearTutorSessionCookie(res) {
  res.clearCookie(TUTOR_COOKIE_NAME, { path: '/' });
}

function tutorHasStudent(tutorId, studentId) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id FROM tutor_student_assignments
       WHERE tutor_id = ? AND student_id = ? AND active = 1`
    )
    .get(tutorId, studentId);
  return Boolean(row);
}

module.exports = {
  COOKIE_NAME,
  TUTOR_COOKIE_NAME,
  createSession,
  destroySession,
  getValidSession,
  verifyCredentials,
  requireAdmin,
  setSessionCookie,
  clearSessionCookie,
  createTutorSession,
  destroyTutorSession,
  getValidTutorSession,
  verifyTutorCredentials,
  requireTutor,
  setTutorSessionCookie,
  clearTutorSessionCookie,
  tutorHasStudent,
};
