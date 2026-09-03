const loginView = document.getElementById('loginView');
const appView = document.getElementById('appView');
const dashboardView = document.getElementById('dashboardView');
const formView = document.getElementById('formView');
const studentList = document.getElementById('studentList');
const attendanceDateInput = document.getElementById('attendanceDate');

let currentTutor = null;
let selectedStudent = null;
let currentDate = todayLocal();

attendanceDateInput.value = currentDate;

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers:
      options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json', ...(options.headers || {}) }
        : options.headers,
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

function todayLocal() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateLabel(isoDate) {
  try {
    const [y, m, d] = isoDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showLogin() {
  loginView.hidden = false;
  appView.hidden = true;
}

function showApp() {
  loginView.hidden = true;
  appView.hidden = false;
  document.getElementById('tutorName').textContent = currentTutor?.full_name || 'Tutor';
}

function showDashboard() {
  dashboardView.hidden = false;
  formView.hidden = true;
  selectedStudent = null;
}

function showForm() {
  dashboardView.hidden = true;
  formView.hidden = false;
}

async function checkAuth() {
  try {
    const data = await api('/api/tutor/me');
    currentTutor = data.tutor;
    showApp();
    showDashboard();
    await loadStudents();
  } catch {
    showLogin();
  }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('loginError');
  errEl.hidden = true;
  const fd = new FormData(e.target);
  try {
    const data = await api('/api/tutor/login', {
      method: 'POST',
      body: JSON.stringify({
        username: fd.get('username'),
        password: fd.get('password'),
      }),
    });
    currentTutor = data.tutor;
    e.target.reset();
    showApp();
    showDashboard();
    await loadStudents();
  } catch (err) {
    errEl.textContent = err.message || 'Login failed';
    errEl.hidden = false;
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await api('/api/tutor/logout', { method: 'POST' });
  currentTutor = null;
  selectedStudent = null;
  showLogin();
});

document.getElementById('backBtn').addEventListener('click', () => {
  showDashboard();
  loadStudents();
});

attendanceDateInput.addEventListener('change', () => {
  currentDate = attendanceDateInput.value || todayLocal();
  loadStudents();
});

async function loadStudents() {
  const errEl = document.getElementById('dashboardError');
  const emptyEl = document.getElementById('dashboardEmpty');
  errEl.hidden = true;
  emptyEl.hidden = true;
  studentList.innerHTML = '';

  try {
    const data = await api(`/api/tutor/students?date=${encodeURIComponent(currentDate)}`);
    currentDate = data.date;
    attendanceDateInput.value = currentDate;

    if (!data.students.length) {
      emptyEl.hidden = false;
      return;
    }

    for (const student of data.students) {
      const li = document.createElement('li');
      li.className = 'tutor-student-card';
      const att = student.today_attendance;
      const badge = att
        ? `<span class="tutor-badge ${escapeHtml(att.status)}">${escapeHtml(att.status)}</span>`
        : `<span class="tutor-badge pending">Not marked</span>`;
      const actionLabel = att ? 'Edit Attendance' : 'Mark Attendance';

      li.innerHTML = `
        <div>
          <h2>${escapeHtml(student.full_name)}</h2>
          <p>${escapeHtml(formatDateLabel(currentDate))}</p>
          ${badge}
        </div>
        <button type="button" class="pp-btn pp-btn-primary" data-id="${escapeHtml(student.id)}">${actionLabel}</button>
      `;
      li.querySelector('button').addEventListener('click', () => openAttendanceForm(student));
      studentList.appendChild(li);
    }
  } catch (err) {
    errEl.textContent = err.message || 'Could not load students.';
    errEl.hidden = false;
  }
}

function openAttendanceForm(student) {
  selectedStudent = student;
  showForm();

  document.getElementById('studentId').value = student.id;
  document.getElementById('formStudentName').textContent = student.full_name;
  document.getElementById('formDateLabel').textContent = `Attendance for ${formatDateLabel(currentDate)}`;
  document.getElementById('formError').hidden = true;
  document.getElementById('formSuccess').hidden = true;

  const att = student.today_attendance;
  const status = att?.status || '';
  for (const input of document.querySelectorAll('input[name="status"]')) {
    input.checked = input.value === status;
  }

  document.getElementById('startTime').value = att?.start_time || '';
  document.getElementById('endTime').value = att?.end_time || '';
  document.getElementById('remarks').value = att?.remarks || '';
  syncTimeFields();

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.textContent = att ? 'Update Attendance' : 'Submit Attendance';
}

function syncTimeFields() {
  const status = document.querySelector('input[name="status"]:checked')?.value;
  const start = document.getElementById('startTime');
  const end = document.getElementById('endTime');
  const disabled = status === 'absent';
  start.disabled = disabled;
  end.disabled = disabled;
  if (disabled) {
    start.value = '';
    end.value = '';
  }
  start.required = status === 'present' || status === 'late';
}

document.querySelectorAll('input[name="status"]').forEach((input) => {
  input.addEventListener('change', syncTimeFields);
});

document.getElementById('attendanceForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('formError');
  const okEl = document.getElementById('formSuccess');
  const submitBtn = document.getElementById('submitBtn');
  errEl.hidden = true;
  okEl.hidden = true;

  const status = document.querySelector('input[name="status"]:checked')?.value;
  if (!status) {
    errEl.textContent = 'Please select an attendance status.';
    errEl.hidden = false;
    return;
  }

  const payload = {
    student_id: document.getElementById('studentId').value,
    attendance_date: currentDate,
    status,
    start_time: document.getElementById('startTime').value || null,
    end_time: document.getElementById('endTime').value || null,
    remarks: document.getElementById('remarks').value.trim() || null,
  };

  submitBtn.disabled = true;
  const previousLabel = submitBtn.textContent;
  submitBtn.textContent = 'Saving…';

  try {
    const data = await api('/api/tutor/attendance', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    okEl.textContent = data.message || 'Attendance submitted successfully.';
    okEl.hidden = false;
    selectedStudent.today_attendance = data.attendance;
    submitBtn.textContent = 'Update Attendance';
  } catch (err) {
    errEl.textContent = err.message || 'Could not save attendance.';
    errEl.hidden = false;
    submitBtn.textContent = previousLabel;
  } finally {
    submitBtn.disabled = false;
  }
});

checkAuth();
