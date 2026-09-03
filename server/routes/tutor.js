const express = require('express');
const {
  createTutorSession,
  destroyTutorSession,
  verifyTutorCredentials,
  requireTutor,
  setTutorSessionCookie,
  clearTutorSessionCookie,
  getValidTutorSession,
  tutorHasStudent,
  TUTOR_COOKIE_NAME,
} = require('../middleware/auth');
const { getDb } = require('../db');
const {
  todayDate,
  isValidDate,
  isValidTime,
  normalizeStatus,
  upsertAttendance,
  getAttendanceForDay,
} = require('../services/attendance');

const router = express.Router();

router.post('/login', express.json(), async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const user = await verifyTutorCredentials(String(username || ''), String(password || ''));
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    const { raw, expires } = createTutorSession(user.id);
    setTutorSessionCookie(res, raw, expires);
    res.json({
      ok: true,
      tutor: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed.' });
  }
});

router.post('/logout', (req, res) => {
  destroyTutorSession(req.cookies?.[TUTOR_COOKIE_NAME]);
  clearTutorSessionCookie(res);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const session = getValidTutorSession(req.cookies?.[TUTOR_COOKIE_NAME]);
  if (!session) return res.status(401).json({ authenticated: false });
  res.json({
    authenticated: true,
    tutor: {
      id: session.user_id,
      username: session.username,
      full_name: session.full_name,
      email: session.email,
    },
  });
});

router.get('/students', requireTutor, (req, res) => {
  const db = getDb();
  const date = isValidDate(req.query.date) ? req.query.date : todayDate();
  const students = db
    .prepare(
      `SELECT s.id, s.full_name, s.notes,
              a.id AS assignment_id,
              ar.id AS attendance_id,
              ar.status AS attendance_status,
              ar.start_time, ar.end_time, ar.remarks
       FROM tutor_student_assignments a
       JOIN students s ON s.id = a.student_id
       LEFT JOIN attendance_records ar
         ON ar.student_id = s.id
        AND ar.tutor_id = a.tutor_id
        AND ar.attendance_date = ?
       WHERE a.tutor_id = ? AND a.active = 1 AND s.active = 1
       ORDER BY s.full_name COLLATE NOCASE`
    )
    .all(date, req.tutor.id)
    .map((row) => ({
      id: row.id,
      full_name: row.full_name,
      notes: row.notes,
      assignment_id: row.assignment_id,
      today_attendance: row.attendance_id
        ? {
            id: row.attendance_id,
            status: row.attendance_status,
            start_time: row.start_time,
            end_time: row.end_time,
            remarks: row.remarks,
            attendance_date: date,
          }
        : null,
    }));

  res.json({ date, students });
});

router.get('/students/:studentId/attendance', requireTutor, (req, res) => {
  if (!tutorHasStudent(req.tutor.id, req.params.studentId)) {
    return res.status(403).json({ error: 'Student is not assigned to you.' });
  }
  const date = isValidDate(req.query.date) ? req.query.date : todayDate();
  const record = getAttendanceForDay(req.params.studentId, req.tutor.id, date);
  res.json({ date, attendance: record || null });
});

router.post('/attendance', requireTutor, express.json(), (req, res) => {
  try {
    const body = req.body || {};
    const studentId = String(body.student_id || '').trim();
    const date = isValidDate(body.attendance_date) ? body.attendance_date : todayDate();
    const status = normalizeStatus(body.status);
    const startTime = cleanOptional(body.start_time);
    const endTime = cleanOptional(body.end_time);
    const remarks = cleanOptional(body.remarks);

    if (!studentId) return res.status(400).json({ error: 'Student is required.' });
    if (!status) return res.status(400).json({ error: 'Attendance status is required.' });
    if (!tutorHasStudent(req.tutor.id, studentId)) {
      return res.status(403).json({ error: 'Student is not assigned to you.' });
    }
    if (startTime && !isValidTime(startTime)) {
      return res.status(400).json({ error: 'Start time must be HH:MM.' });
    }
    if (endTime && !isValidTime(endTime)) {
      return res.status(400).json({ error: 'End time must be HH:MM.' });
    }
    if (status === 'absent' && (startTime || endTime)) {
      // Allow empty times for absent; ignore any accidental values.
    }
    if (status !== 'absent' && !startTime) {
      return res.status(400).json({ error: 'Arrival time is required for present or late.' });
    }

    const result = upsertAttendance({
      studentId,
      tutorId: req.tutor.id,
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

function cleanOptional(v) {
  const s = String(v || '').trim();
  return s || null;
}

module.exports = router;
