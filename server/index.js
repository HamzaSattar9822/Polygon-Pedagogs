const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config');
const { getDb, ensureDirs } = require('./db');
const apiForms = require('./routes/apiForms');
const adminRoutes = require('./routes/admin');

ensureDirs();
getDb();

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'polygon-pedagogs' });
});

app.use('/api/forms', apiForms);
app.use('/api/admin', adminRoutes);

app.use('/uploads', (_req, res) => {
  res.status(403).json({ error: 'Forbidden' });
});

app.use('/admin', express.static(path.join(config.rootDir, 'admin'), { index: 'index.html' }));
app.use('/assets', express.static(path.join(config.rootDir, 'assets')));

const pages = [
  'index.html',
  'who-we-support.html',
  'services.html',
  'safeguarding.html',
  'referral-process.html',
  'tutor-recruitment.html',
  'join-us.html',
  'contact.html',
  'privacy.html',
  'cookies.html',
];

for (const page of pages) {
  const route = page === 'index.html' ? '/' : `/${page.replace(/\.html$/, '')}`;
  app.get([route, `/${page}`], (_req, res) => {
    res.sendFile(path.join(config.rootDir, page));
  });
}

app.use((_req, res) => {
  res.status(404).send('Not found');
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

app.listen(config.port, () => {
  console.log(`Polygon Pedagogues running at http://localhost:${config.port}`);
  console.log(`Admin inbox: http://localhost:${config.port}/admin/`);
});
