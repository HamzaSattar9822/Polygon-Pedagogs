const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { notifySubmission } = require('../services/email');

function asArray(value) {
  if (value === undefined || value === null || value === '') return [];
  return Array.isArray(value) ? value : [value];
}

function cleanString(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function requireFields(payload, fields) {
  const missing = fields.filter((f) => !cleanString(payload[f]));
  return missing;
}

function saveSubmission({ type, payload, submitterName, submitterEmail, files = [] }) {
  const db = getDb();
  const id = uuidv4();
  const insertSub = db.prepare(`
    INSERT INTO submissions (id, type, payload, submitter_name, submitter_email)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertFile = db.prepare(`
    INSERT INTO uploads (id, submission_id, field_name, original_name, stored_name, mime_type, size)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    insertSub.run(id, type, JSON.stringify(payload), submitterName || null, submitterEmail || null);
    for (const file of files) {
      insertFile.run(
        uuidv4(),
        id,
        file.fieldname,
        file.originalname,
        file.filename,
        file.mimetype,
        file.size
      );
    }
  });
  tx();

  return {
    id,
    files: files.map((f) => ({
      field_name: f.fieldname,
      original_name: f.originalname,
      stored_name: f.filename,
    })),
  };
}

async function persistAndNotify(opts) {
  const result = saveSubmission(opts);
  try {
    await notifySubmission({
      type: opts.type,
      id: result.id,
      payload: opts.payload,
      submitterName: opts.submitterName,
      submitterEmail: opts.submitterEmail,
      files: result.files,
    });
  } catch (err) {
    console.error('Email notification failed:', err.message);
  }
  return result;
}

function multerErrorHandler(err, _req, res, next) {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'A file is too large. Please upload smaller files.' });
  }
  if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Too many files uploaded.' });
  }
  return res.status(400).json({ error: err.message || 'Upload failed.' });
}

module.exports = {
  asArray,
  cleanString,
  requireFields,
  saveSubmission,
  persistAndNotify,
  multerErrorHandler,
};
