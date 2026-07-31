const fs = require('fs');
const Database = require('better-sqlite3');
const config = require('./config');

function ensureDirs() {
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.mkdirSync(config.uploadsDir, { recursive: true });
  fs.mkdirSync(pathJoin(config.uploadsDir, 'referrals'), { recursive: true });
  fs.mkdirSync(pathJoin(config.uploadsDir, 'tutors'), { recursive: true });
}

function pathJoin(...parts) {
  return require('path').join(...parts);
}

function createDb() {
  ensureDirs();
  const db = new Database(config.dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('referral', 'parent', 'tutor', 'contact')),
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'in_progress', 'closed')),
      payload TEXT NOT NULL,
      submitter_name TEXT,
      submitter_email TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime_type TEXT,
      size INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_submissions_type ON submissions(type);
    CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
    CREATE INDEX IF NOT EXISTS idx_submissions_created ON submissions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_uploads_submission ON uploads(submission_id);
  `);

  return db;
}

let db;

function getDb() {
  if (!db) db = createDb();
  return db;
}

if (require.main === module) {
  getDb();
  console.log('Database initialised at', config.dbPath);
}

module.exports = { getDb, ensureDirs };
