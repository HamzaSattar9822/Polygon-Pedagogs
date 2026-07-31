const express = require('express');
const path = require('path');
const fs = require('fs');
const {
  createSession,
  destroySession,
  verifyCredentials,
  requireAdmin,
  setSessionCookie,
  clearSessionCookie,
  COOKIE_NAME,
} = require('../middleware/auth');
const { getDb } = require('../db');
const { TYPE_LABELS } = require('../services/email');
const config = require('../config');

const router = express.Router();

router.post('/login', express.json(), async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const ok = await verifyCredentials(String(username || ''), String(password || ''));
    if (!ok) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    const { raw, expires } = createSession();
    setSessionCookie(res, raw, expires);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed.' });
  }
});

router.post('/logout', (req, res) => {
  destroySession(req.cookies?.[COOKIE_NAME]);
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const { getValidSession } = require('../middleware/auth');
  const session = getValidSession(req.cookies?.[COOKIE_NAME]);
  if (!session) return res.status(401).json({ authenticated: false });
  res.json({ authenticated: true });
});

router.get('/submissions', requireAdmin, (req, res) => {
  const db = getDb();
  const type = req.query.type;
  const status = req.query.status;
  const q = clean(req.query.q);

  let sql = `SELECT id, type, status, submitter_name, submitter_email, created_at, updated_at FROM submissions WHERE 1=1`;
  const params = [];
  if (type) {
    sql += ` AND type = ?`;
    params.push(type);
  }
  if (status) {
    sql += ` AND status = ?`;
    params.push(status);
  }
  if (q) {
    sql += ` AND (submitter_name LIKE ? OR submitter_email LIKE ? OR id LIKE ?)`;
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  sql += ` ORDER BY created_at DESC LIMIT 200`;

  const rows = db.prepare(sql).all(...params).map((r) => ({
    ...r,
    type_label: TYPE_LABELS[r.type] || r.type,
  }));
  res.json({ submissions: rows });
});

router.get('/submissions/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM submissions WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const files = db
    .prepare(
      `SELECT id, field_name, original_name, mime_type, size, created_at FROM uploads WHERE submission_id = ?`
    )
    .all(row.id);
  res.json({
    ...row,
    type_label: TYPE_LABELS[row.type] || row.type,
    payload: JSON.parse(row.payload),
    files,
  });
});

router.patch('/submissions/:id', requireAdmin, express.json(), (req, res) => {
  const status = req.body?.status;
  if (!['new', 'in_progress', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  const db = getDb();
  const result = db
    .prepare(`UPDATE submissions SET status = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(status, req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true, status });
});

router.get('/files/:uploadId', requireAdmin, (req, res) => {
  const db = getDb();
  const file = db
    .prepare(
      `SELECT u.*, s.type FROM uploads u JOIN submissions s ON s.id = u.submission_id WHERE u.id = ?`
    )
    .get(req.params.uploadId);
  if (!file) return res.status(404).json({ error: 'File not found' });

  const subdir = file.type === 'tutor' ? 'tutors' : 'referrals';
  const abs = path.join(config.uploadsDir, subdir, file.stored_name);
  if (!fs.existsSync(abs)) return res.status(404).json({ error: 'File missing on disk' });

  res.download(abs, file.original_name);
});

function clean(v) {
  return String(v || '').trim();
}

module.exports = router;
