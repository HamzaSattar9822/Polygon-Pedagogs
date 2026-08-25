const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  rootDir: path.join(__dirname, '..'),
  dataDir: path.join(__dirname, '..', 'data'),
  uploadsDir: path.join(__dirname, '..', 'uploads'),
  dbPath: path.join(__dirname, '..', 'data', 'polygon.db'),
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'change-me-now',
  sessionSecret: process.env.SESSION_SECRET || 'dev-insecure-secret-change-me',
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB) || 10,
  mail: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'Polygon Pedagogues <noreply@example.com>',
    to: {
      general: process.env.MAIL_TO_GENERAL || '',
      referrals: process.env.MAIL_TO_REFERRALS || '',
      tutors: process.env.MAIL_TO_TUTORS || '',
      safeguarding: process.env.MAIL_TO_SAFEGUARDING || '',
    },
  },
};

module.exports = config;
