const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { requireAdmin } = require('../middleware/auth');
const { getDb } = require('../db');
const {
  todayDate,
  isValidDate,
  isValidTime,
  normalizeStatus,
  upsertAttendance,
} = require('../services/attendance');

const router = express.Router();

function clean(v) {
  return String(v || '').trim();
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    full_name: row.full_name,
    email: row.email,
    role: row.role,
    active: Boolean(row.active),
    created_at: row.created_at,
    updated_at: row.updated_at,
    student_count: row.student_count ?? undefined,
  };
}

function mapStudent(row) {
  if (!row) return null;
  return {
    id: row.id,
    full_name: row.full_name,
    notes: row.notes,
    active: Boolean(row.active),
    created_at: row.created_at,
    updated_at: row.updated_at,
    tutor_count: row.tutor_count ?? undefined,
  };
}

// ——— Tutors ———

router.get('/tutors', requireAdmin, (_req, res) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT u.*,
              (SELECT COUNT(*) FROM tutor_student_assignments a
               WHERE a.tutor_id = u.id AND a.active = 1) AS student_count
       FROM users u
       WHERE u.role = 'tutor'
       ORDER BY u.full_name COLLATE NOCASE`
    )
    .all()
    .map(mapUser);
  res.json({ tutors: rows });
});

router.post('/tutors', requireAdmin, express.json(), async (req, res) => {
  try {
    const username = clean(req.body?.username).toLowerCase();
    const password = String(req.body?.password || '');
    const fullName = clean(req.body?.full_name);
    const email = clean(req.body?.email) || null;

    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (!fullName) return res.status(400).json({ error: 'Full name is required.' });
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const db = getDb();
    const existing = db.prepare(`SELECT id FROM users WHERE username = ? COLLATE NOCASE`).get(username);
    if (existing) return res.status(409).json({ error: 'Username already exists.' });

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    db.prepare(
      `INSERT INTO users (id, username, password_hash, full_name, email, role)
       VALUES (?, ?, ?, ?, ?, 'tutor')`
    ).run(id, username, passwordHash, fullName, email);

    const tutor = mapUser(db.prepare(`SELECT * FROM users WHERE id = ?`).get(id));
    res.status(201).json({ ok: true, tutor });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not create tutor.' });
  }
});

router.patch('/tutors/:id', requireAdmin, express.json(), async (req, res) => {
  try {
    const db = getDb();
    const tutor = db.prepare(`SELECT * FROM users WHERE id = ? AND role = 'tutor'`).get(req.params.id);
    if (!tutor) return res.status(404).json({ error: 'Tutor not found.' });

    const fullName = req.body?.full_name !== undefined ? clean(req.body.full_name) : tutor.full_name;
    const email = req.body?.email !== undefined ? clean(req.body.email) || null : tutor.email;
    const active =
      req.body?.active !== undefined ? (req.body.active ? 1 : 0) : tutor.active;

    if (!fullName) return res.status(400).json({ error: 'Full name is required.' });

    let passwordHash = tutor.password_hash;
    if (req.body?.password) {
      if (String(req.body.password).length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }
      passwordHash = await bcrypt.hash(String(req.body.password), 10);
    }

    db.prepare(
      `UPDATE users
       SET full_name = ?, email = ?, active = ?, password_hash = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(fullName, email, active, passwordHash, tutor.id);

    res.json({ ok: true, tutor: mapUser(db.prepare(`SELECT * FROM users WHERE id = ?`).get(tutor.id)) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not update tutor.' });
  }
});

// ——— Students ———

router.get('/students', requireAdmin, (_req, res) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT s.*,
              (SELECT COUNT(*) FROM tutor_student_assignments a
               WHERE a.student_id = s.id AND a.active = 1) AS tutor_count
       FROM students s
       ORDER BY s.full_name COLLATE NOCASE`
    )
    .all()
    .map(mapStudent);
  res.json({ students: rows });
});

router.post('/students', requireAdmin, express.json(), (req, res) => {
  try {
    const fullName = clean(req.body?.full_name);
    const notes = clean(req.body?.notes) || null;
    if (!fullName) return res.status(400).json({ error: 'Full name is required.' });

    const db = getDb();
    const id = uuidv4();
    db.prepare(
      `INSERT INTO students (id, full_name, notes) VALUES (?, ?, ?)`
    ).run(id, fullName, notes);

    res.status(201).json({
      ok: true,
      student: mapStudent(db.prepare(`SELECT * FROM students WHERE id = ?`).get(id)),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not create student.' });
  }
});

router.patch('/students/:id', requireAdmin, express.json(), (req, res) => {
  try {
    const db = getDb();
    const student = db.prepare(`SELECT * FROM students WHERE id = ?`).get(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const fullName = req.body?.full_name !== undefined ? clean(req.body.full_name) : student.full_name;
    const notes = req.body?.notes !== undefined ? clean(req.body.notes) || null : student.notes;
    const active =
      req.body?.active !== undefined ? (req.body.active ? 1 : 0) : student.active;

    if (!fullName) return res.status(400).json({ error: 'Full name is required.' });

    db.prepare(
      `UPDATE students
       SET full_name = ?, notes = ?, active = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(fullName, notes, active, student.id);

    res.json({
      ok: true,
      student: mapStudent(db.prepare(`SELECT * FROM students WHERE id = ?`).get(student.id)),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not update student.' });
  }
});

// ——— Assignments ———

router.get('/assignments', requireAdmin, (req, res) => {
  const db = getDb();
  let sql = `
    SELECT a.id, a.active, a.created_at,
           t.id AS tutor_id, t.full_name AS tutor_name, t.username AS tutor_username,
           s.id AS student_id, s.full_name AS student_name
    FROM tutor_student_assignments a
    JOIN users t ON t.id = a.tutor_id
    JOIN students s ON s.id = a.student_id
    WHERE 1=1`;
  const params = [];
  if (req.query.tutor_id) {
    sql += ` AND a.tutor_id = ?`;
    params.push(req.query.tutor_id);
  }
  if (req.query.student_id) {
    sql += ` AND a.student_id = ?`;
    params.push(req.query.student_id);
  }
  if (req.query.active === '1' || req.query.active === '0') {
    sql += ` AND a.active = ?`;
    params.push(Number(req.query.active));
  }
  sql += ` ORDER BY t.full_name COLLATE NOCASE, s.full_name COLLATE NOCASE`;

  const assignments = db.prepare(sql).all(...params).map((row) => ({
    id: row.id,
    active: Boolean(row.active),
    created_at: row.created_at,
    tutor: { id: row.tutor_id, full_name: row.tutor_name, username: row.tutor_username },
    student: { id: row.student_id, full_name: row.student_name },
  }));
  res.json({ assignments });
});

router.post('/assignments', requireAdmin, express.json(), (req, res) => {
  try {
    const tutorId = clean(req.body?.tutor_id);
    const studentId = clean(req.body?.student_id);
    if (!tutorId || !studentId) {
      return res.status(400).json({ error: 'Tutor and student are required.' });
    }

    const db = getDb();
    const tutor = db.prepare(`SELECT id FROM users WHERE id = ? AND role = 'tutor'`).get(tutorId);
    const student = db.prepare(`SELECT id FROM students WHERE id = ?`).get(studentId);
    if (!tutor) return res.status(404).json({ error: 'Tutor not found.' });
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const existing = db
      .prepare(`SELECT id, active FROM tutor_student_assignments WHERE tutor_id = ? AND student_id = ?`)
      .get(tutorId, studentId);

    if (existing) {
      if (existing.active) {
        return res.status(409).json({ error: 'Student is already assigned to this tutor.' });
      }
      db.prepare(
        `UPDATE tutor_student_assignments SET active = 1 WHERE id = ?`
      ).run(existing.id);
      return res.json({ ok: true, assignment_id: existing.id, reactivated: true });
    }

    const id = uuidv4();
    db.prepare(
      `INSERT INTO tutor_student_assignments (id, tutor_id, student_id) VALUES (?, ?, ?)`
    ).run(id, tutorId, studentId);
    res.status(201).json({ ok: true, assignment_id: id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not create assignment.' });
  }
});

router.patch('/assignments/:id', requireAdmin, express.json(), (req, res) => {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM tutor_student_assignments WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Assignment not found.' });

  if (req.body?.active === undefined) {
    return res.status(400).json({ error: 'Active flag is required.' });
  }
  const active = req.body.active ? 1 : 0;
  db.prepare(`UPDATE tutor_student_assignments SET active = ? WHERE id = ?`).run(active, row.id);
  res.json({ ok: true, active: Boolean(active) });
});

// ——— Attendance ———

router.get('/attendance', requireAdmin, (req, res) => {
  const db = getDb();
  let sql = `
    SELECT ar.*,
           s.full_name AS student_name,
           t.full_name AS tutor_name, t.username AS tutor_username
    FROM attendance_records ar
    JOIN students s ON s.id = ar.student_id
    JOIN users t ON t.id = ar.tutor_id
    WHERE 1=1`;
  const params = [];

  if (isValidDate(req.query.date)) {
    sql += ` AND ar.attendance_date = ?`;
    params.push(req.query.date);
  }
  if (req.query.date_from && isValidDate(req.query.date_from)) {
    sql += ` AND ar.attendance_date >= ?`;
    params.push(req.query.date_from);
  }
  if (req.query.date_to && isValidDate(req.query.date_to)) {
    sql += ` AND ar.attendance_date <= ?`;
    params.push(req.query.date_to);
  }
  if (req.query.tutor_id) {
    sql += ` AND ar.tutor_id = ?`;
    params.push(req.query.tutor_id);
  }
  if (req.query.student_id) {
    sql += ` AND ar.student_id = ?`;
    params.push(req.query.student_id);
  }
  if (normalizeStatus(req.query.status)) {
    sql += ` AND ar.status = ?`;
    params.push(normalizeStatus(req.query.status));
  }

  sql += ` ORDER BY ar.attendance_date DESC, t.full_name COLLATE NOCASE, s.full_name COLLATE NOCASE LIMIT 500`;

  const records = db.prepare(sql).all(...params).map((row) => ({
    id: row.id,
    attendance_date: row.attendance_date,
    status: row.status,
    start_time: row.start_time,
    end_time: row.end_time,
    remarks: row.remarks,
    created_at: row.created_at,
    updated_at: row.updated_at,
    student: { id: row.student_id, full_name: row.student_name },
    tutor: { id: row.tutor_id, full_name: row.tutor_name, username: row.tutor_username },
  }));

  res.json({ records });
});

router.get('/attendance/student/:studentId', requireAdmin, (req, res) => {
  const db = getDb();
  const student = db.prepare(`SELECT * FROM students WHERE id = ?`).get(req.params.studentId);
  if (!student) return res.status(404).json({ error: 'Student not found.' });

  const records = db
    .prepare(
      `SELECT ar.*, t.full_name AS tutor_name, t.username AS tutor_username
       FROM attendance_records ar
       JOIN users t ON t.id = ar.tutor_id
       WHERE ar.student_id = ?
       ORDER BY ar.attendance_date DESC
       LIMIT 365`
    )
    .all(student.id)
    .map((row) => ({
      id: row.id,
      attendance_date: row.attendance_date,
      status: row.status,
      start_time: row.start_time,
      end_time: row.end_time,
      remarks: row.remarks,
      tutor: { id: row.tutor_id, full_name: row.tutor_name, username: row.tutor_username },
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

  res.json({ student: mapStudent(student), records });
});

router.post('/attendance', requireAdmin, express.json(), (req, res) => {
  try {
    const body = req.body || {};
    const studentId = clean(body.student_id);
    const tutorId = clean(body.tutor_id);
    const date = isValidDate(body.attendance_date) ? body.attendance_date : todayDate();
    const status = normalizeStatus(body.status);
    const startTime = clean(body.start_time) || null;
    const endTime = clean(body.end_time) || null;
    const remarks = clean(body.remarks) || null;

    if (!studentId || !tutorId) {
      return res.status(400).json({ error: 'Tutor and student are required.' });
    }
    if (!status) return res.status(400).json({ error: 'Attendance status is required.' });
    if (startTime && !isValidTime(startTime)) {
      return res.status(400).json({ error: 'Start time must be HH:MM.' });
    }
    if (endTime && !isValidTime(endTime)) {
      return res.status(400).json({ error: 'End time must be HH:MM.' });
    }

    const db = getDb();
    const assignment = db
      .prepare(
        `SELECT id FROM tutor_student_assignments
         WHERE tutor_id = ? AND student_id = ? AND active = 1`
      )
      .get(tutorId, studentId);
    if (!assignment) {
      return res.status(400).json({ error: 'Student is not assigned to this tutor.' });
    }

    const result = upsertAttendance({
      studentId,
      tutorId,
      attendanceDate: date,
      status,
      startTime: status === 'absent' ? null : startTime,
      endTime: status === 'absent' ? null : endTime,
      remarks,
    });

    res.json({
      ok: true,
      message: result.created
        ? 'Attendance submitted successfully.'
        : 'Attendance updated successfully.',
      attendance: result.record,
      created: result.created,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not save attendance.' });
  }
});

module.exports = router;
