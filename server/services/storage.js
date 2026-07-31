const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/jpg',
]);

const ALLOWED_EXT = new Set(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']);

function safeExt(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  return ALLOWED_EXT.has(ext) ? ext : '';
}

function makeUploader(subdir) {
  const dest = path.join(config.uploadsDir, subdir);
  fs.mkdirSync(dest, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const ext = safeExt(file.originalname) || '.bin';
      cb(null, `${uuidv4()}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 12 },
    fileFilter: (_req, file, cb) => {
      const ext = safeExt(file.originalname);
      if (!ext || (!ALLOWED_MIME.has(file.mimetype) && file.mimetype !== 'application/octet-stream')) {
        return cb(new Error('File type not allowed. Use PDF, DOC, DOCX, JPG or PNG.'));
      }
      cb(null, true);
    },
  });
}

const referralUpload = makeUploader('referrals').array('documents', 10);
const tutorUpload = makeUploader('tutors').fields([
  { name: 'cv', maxCount: 1 },
  { name: 'qualifications', maxCount: 5 },
  { name: 'dbs', maxCount: 1 },
  { name: 'supporting', maxCount: 5 },
]);

function absoluteUploadPath(subdir, storedName) {
  return path.join(config.uploadsDir, subdir, storedName);
}

module.exports = {
  referralUpload,
  tutorUpload,
  absoluteUploadPath,
  ALLOWED_MIME,
};
