const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!config.mail.host) return null;
  transporter = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: config.mail.user
      ? { user: config.mail.user, pass: config.mail.pass }
      : undefined,
  });
  return transporter;
}

const TYPE_LABELS = {
  referral: 'Professional Referral',
  parent: 'Parent / Carer Enquiry',
  tutor: 'Tutor Application',
  contact: 'General Contact',
};

function pickRecipient(type) {
  const t = config.mail.to;
  if (type === 'referral') return t.referrals || t.general;
  if (type === 'tutor') return t.tutors || t.general;
  if (type === 'parent') return t.general;
  return t.general;
}

function formatPayload(payload) {
  return Object.entries(payload)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => {
      const value = Array.isArray(v) ? v.join(', ') : String(v);
      return `${k}: ${value}`;
    })
    .join('\n');
}

async function notifySubmission({ type, id, payload, submitterName, submitterEmail, files = [] }) {
  const label = TYPE_LABELS[type] || type;
  const to = pickRecipient(type);
  const subject = `[Polygon Pedagogs] New ${label} — ${id.slice(0, 8)}`;
  const body = [
    `New ${label} received.`,
    '',
    `Submission ID: ${id}`,
    `Name: ${submitterName || '—'}`,
    `Email: ${submitterEmail || '—'}`,
    '',
    '--- Details ---',
    formatPayload(payload),
    '',
    files.length
      ? `Attachments stored: ${files.map((f) => f.original_name).join(', ')}`
      : 'No attachments.',
    '',
    'Review in admin: /admin/',
  ].join('\n');

  const transport = getTransporter();
  if (!transport || !to) {
    console.log('\n[email skipped — configure SMTP / MAIL_TO_*]\n', subject, '\n', body, '\n');
    return { sent: false, reason: 'smtp_not_configured' };
  }

  await transport.sendMail({
    from: config.mail.from,
    to,
    replyTo: submitterEmail || undefined,
    subject,
    text: body,
  });

  return { sent: true };
}

module.exports = { notifySubmission, TYPE_LABELS };
