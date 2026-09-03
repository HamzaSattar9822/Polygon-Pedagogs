const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const STATUSES = new Set(['present', 'absent', 'late']);

function todayDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isValidDate(value) {
  if (!value || typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function isValidTime(value) {
  return /^\d{2}:\d{2}$/.test(String(value || '')) &&
    Number(value.slice(0, 2)) <= 23 &&
    Number(value.slice(3, 5)) <= 59;
}

function normalizeStatus(value) {
  const s = String(value || '').trim().toLowerCase();
  return STATUSES.has(s) ? s : null;
}

function getAttendanceForDay(studentId, tutorId, attendanceDate) {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM attendance_records
       WHERE student_id = ? AND tutor_id = ? AND attendance_date = ?`
    )
    .get(studentId, tutorId, attendanceDate);
}

function upsertAttendance({
  studentId,
  tutorId,
  attendanceDate,
  status,
  startTime,
  endTime,
  remarks,
}) {
  const db = getDb();
  const existing = getAttendanceForDay(studentId, tutorId, attendanceDate);

  if (existing) {
    db.prepare(
      `UPDATE attendance_records
       SET status = ?, start_time = ?, end_time = ?, remarks = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(status, startTime, endTime, remarks, existing.id);

    return {
      created: false,
      record: getAttendanceForDay(studentId, tutorId, attendanceDate),
    };
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO attendance_records
      (id, student_id, tutor_id, attendance_date, status, start_time, end_time, remarks)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, studentId, tutorId, attendanceDate, status, startTime, endTime, remarks);

  return {
    created: true,
    record: getAttendanceForDay(studentId, tutorId, attendanceDate),
  };
}

module.exports = {
  STATUSES,
  todayDate,
  isValidDate,
  isValidTime,
  normalizeStatus,
  getAttendanceForDay,
  upsertAttendance,
};
