# Polygon Pedagogues

Multi-page website for Polygon Pedagogues with working form submissions, private file uploads, email notifications, and an admin inbox.

## Quick start

```bash
cp .env.example .env
npm install
npm start
```

Open:
- Site: http://localhost:3000
- Admin: http://localhost:3000/admin/

Default admin login (change in `.env` before production):
- Username: `admin`
- Password: `change-me-now`

## What works

- Professional referral form (with document uploads)
- Parent / carer enquiry form
- Tutor application form (CV and supporting documents)
- General contact form
- Submissions saved to SQLite (`data/polygon.db`)
- Uploads stored privately in `uploads/` (not publicly downloadable)
- Admin inbox to filter, view, update status, and download files
- Optional SMTP email alerts (logs to console if SMTP is not configured)
- Privacy Notice, Cookie Notice, and cookie banner

## Environment

Copy `.env.example` to `.env` and set:

- `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `SESSION_SECRET`
- SMTP settings and `MAIL_TO_*` addresses when you want live email

Contact details on the public pages (emails, phone, location, DSL) are still placeholders and can be filled in later.

## Scripts

- `npm start` — run the server
- `npm run dev` — run with Node watch mode
- `npm run init-db` — initialise the database folders/tables

## Notes

- Do not commit `.env`, `data/`, or `uploads/`
- Review safeguarding and privacy wording with a competent professional before public launch
- Add final policy PDFs under Safeguarding when ready
