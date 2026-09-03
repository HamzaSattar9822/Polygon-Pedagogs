const loginView = document.getElementById('loginView');
const appView = document.getElementById('appView');
const listEl = document.getElementById('submissionList');
const detailPane = document.getElementById('detailPane');

let selectedId = null;
let currentTab = 'inbox';
let tutorsCache = [];
let studentsCache = [];

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

async function checkAuth() {
  try {
    await api('/api/admin/me');
    showApp();
    await loadList();
  } catch {
    showLogin();
  }
}

function showLogin() {
  loginView.hidden = false;
  appView.hidden = true;
}

function showApp() {
  loginView.hidden = true;
  appView.hidden = false;
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('loginError');
  errEl.hidden = true;
  const fd = new FormData(e.target);
  try {
    await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        username: fd.get('username'),
        password: fd.get('password'),
      }),
    });
    e.target.reset();
    showApp();
    setTab('inbox');
    await loadList();
  } catch (err) {
    errEl.textContent = err.message || 'Login failed';
    errEl.hidden = false;
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await api('/api/admin/logout', { method: 'POST' });
  selectedId = null;
  showLogin();
});

document.querySelectorAll('.admin-nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => setTab(btn.dataset.tab));
});

function setTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.admin-nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.admin-tab').forEach((section) => {
    section.hidden = section.id !== `tab-${tab}`;
  });

  if (tab === 'people') loadPeople();
  if (tab === 'attendance') loadAttendanceFilters().then(loadAttendance);
}

['filterType', 'filterStatus'].forEach((id) => {
  document.getElementById(id).addEventListener('change', () => loadList());
});
document.getElementById('filterQ').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadList();
});
document.getElementById('refreshBtn').addEventListener('click', () => loadList());

async function loadList() {
  const type = document.getElementById('filterType').value;
  const status = document.getElementById('filterStatus').value;
  const q = document.getElementById('filterQ').value.trim();
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (status) params.set('status', status);
  if (q) params.set('q', q);

  const data = await api(`/api/admin/submissions?${params}`);
  listEl.innerHTML = '';

  if (!data.submissions.length) {
    listEl.innerHTML = '<li><button type="button" disabled>No submissions found</button></li>';
    return;
  }

  for (const item of data.submissions) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = item.id === selectedId ? 'active' : '';
    btn.innerHTML = `
      <div class="meta">
        <span>${escapeHtml(item.type_label)}</span>
        <span class="admin-badge ${escapeHtml(item.status)}">${escapeHtml(item.status.replace('_', ' '))}</span>
      </div>
      <div class="name">${escapeHtml(item.submitter_name || 'Untitled')}</div>
      <div class="meta"><span>${escapeHtml(item.submitter_email || '')}</span><span>${formatDate(item.created_at)}</span></div>
    `;
    btn.addEventListener('click', () => openDetail(item.id));
    li.appendChild(btn);
    listEl.appendChild(li);
  }
}

async function openDetail(id) {
  selectedId = id;
  [...listEl.querySelectorAll('button')].forEach((b) => b.classList.remove('active'));
  await loadList();

  const item = await api(`/api/admin/submissions/${id}`);
  const rows = Object.entries(item.payload || {})
    .map(([key, value]) => {
      const display = Array.isArray(value) ? value.join(', ') : String(value ?? '');
      const full =
        display.length > 80 ||
        key.includes('summary') ||
        key.includes('message') ||
        key.includes('profile') ||
        key.includes('overview') ||
        key.includes('history') ||
        key.includes('approach') ||
        key.includes('address');
      return `<div class="payload-item${full ? ' full' : ''}"><dt>${escapeHtml(labelize(key))}</dt><dd>${escapeHtml(display)}</dd></div>`;
    })
    .join('');

  const files = (item.files || [])
    .map(
      (f) =>
        `<li><a href="/api/admin/files/${encodeURIComponent(f.id)}" target="_blank" rel="noopener">${escapeHtml(f.original_name)}</a> <span class="meta">(${escapeHtml(f.field_name)}, ${Math.round((f.size || 0) / 1024)} KB)</span></li>`
    )
    .join('');

  detailPane.innerHTML = `
    <div class="admin-detail-head">
      <div>
        <h2>${escapeHtml(item.type_label)}</h2>
        <p class="sub">${escapeHtml(item.submitter_name || '')} · ${escapeHtml(item.submitter_email || '')}<br>ID: ${escapeHtml(item.id)} · ${formatDate(item.created_at)}</p>
      </div>
      <div class="admin-actions">
        <label for="statusSelect">Status</label>
        <select id="statusSelect">
          <option value="new">New</option>
          <option value="in_progress">In progress</option>
          <option value="closed">Closed</option>
        </select>
      </div>
    </div>
    <div class="payload-grid">${rows || '<p>No fields</p>'}</div>
    ${files ? `<h3 style="margin-top:24px;">Files</h3><ul class="file-list">${files}</ul>` : ''}
  `;

  const statusSelect = document.getElementById('statusSelect');
  statusSelect.value = item.status;
  statusSelect.addEventListener('change', async () => {
    await api(`/api/admin/submissions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: statusSelect.value }),
    });
    await loadList();
  });
}

async function loadPeople() {
  await Promise.all([loadTutors(), loadStudents(), loadAssignments()]);
  fillAssignSelects();
}

async function loadTutors() {
  const data = await api('/api/admin/tutors');
  tutorsCache = data.tutors || [];
  const list = document.getElementById('tutorList');
  list.innerHTML = '';
  if (!tutorsCache.length) {
    list.innerHTML = '<li class="muted">No tutors yet.</li>';
    return;
  }
  for (const tutor of tutorsCache) {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${escapeHtml(tutor.full_name)}</strong>
        <div class="meta">@${escapeHtml(tutor.username)} · ${tutor.student_count || 0} students
          ${tutor.active ? '' : ' · <span class="admin-badge closed">inactive</span>'}
        </div>
      </div>
      <button type="button" class="pp-btn pp-btn-outline pp-btn-small" data-id="${escapeHtml(tutor.id)}">
        ${tutor.active ? 'Deactivate' : 'Activate'}
      </button>
    `;
    li.querySelector('button').addEventListener('click', async () => {
      await api(`/api/admin/tutors/${tutor.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !tutor.active }),
      });
      await loadPeople();
    });
    list.appendChild(li);
  }
}

async function loadStudents() {
  const data = await api('/api/admin/students');
  studentsCache = data.students || [];
  const list = document.getElementById('studentList');
  list.innerHTML = '';
  if (!studentsCache.length) {
    list.innerHTML = '<li class="muted">No students yet.</li>';
    return;
  }
  for (const student of studentsCache) {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${escapeHtml(student.full_name)}</strong>
        <div class="meta">${student.tutor_count || 0} tutors
          ${student.notes ? ` · ${escapeHtml(student.notes)}` : ''}
          ${student.active ? '' : ' · <span class="admin-badge closed">inactive</span>'}
        </div>
      </div>
      <div class="admin-row-actions">
        <button type="button" class="pp-btn pp-btn-outline pp-btn-small" data-history="${escapeHtml(student.id)}">History</button>
        <button type="button" class="pp-btn pp-btn-outline pp-btn-small" data-toggle="${escapeHtml(student.id)}">
          ${student.active ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    `;
    li.querySelector('[data-toggle]').addEventListener('click', async () => {
      await api(`/api/admin/students/${student.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !student.active }),
      });
      await loadPeople();
    });
    li.querySelector('[data-history]').addEventListener('click', () => {
      setTab('attendance');
      document.getElementById('attStudent').value = student.id;
      document.getElementById('attDate').value = '';
      loadAttendance();
    });
    list.appendChild(li);
  }
}

async function loadAssignments() {
  const data = await api('/api/admin/assignments?active=1');
  const list = document.getElementById('assignmentList');
  list.innerHTML = '';
  if (!data.assignments.length) {
    list.innerHTML = '<li class="muted">No active assignments.</li>';
    return;
  }
  for (const item of data.assignments) {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${escapeHtml(item.student.full_name)}</strong>
        <div class="meta">Tutor: ${escapeHtml(item.tutor.full_name)} (@${escapeHtml(item.tutor.username)})</div>
      </div>
      <button type="button" class="pp-btn pp-btn-outline pp-btn-small">Unassign</button>
    `;
    li.querySelector('button').addEventListener('click', async () => {
      await api(`/api/admin/assignments/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: false }),
      });
      await loadPeople();
    });
    list.appendChild(li);
  }
}

function fillAssignSelects() {
  const tutorSelect = document.getElementById('assignTutor');
  const studentSelect = document.getElementById('assignStudent');
  tutorSelect.innerHTML = tutorsCache
    .filter((t) => t.active)
    .map((t) => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.full_name)} (@${escapeHtml(t.username)})</option>`)
    .join('') || '<option value="">No active tutors</option>';
  studentSelect.innerHTML = studentsCache
    .filter((s) => s.active)
    .map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.full_name)}</option>`)
    .join('') || '<option value="">No active students</option>';
}

document.getElementById('tutorForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('tutorFormError');
  const okEl = document.getElementById('tutorFormSuccess');
  errEl.hidden = true;
  okEl.hidden = true;
  const fd = new FormData(e.target);
  try {
    await api('/api/admin/tutors', {
      method: 'POST',
      body: JSON.stringify({
        full_name: fd.get('full_name'),
        username: fd.get('username'),
        email: fd.get('email'),
        password: fd.get('password'),
      }),
    });
    e.target.reset();
    okEl.textContent = 'Tutor created successfully.';
    okEl.hidden = false;
    await loadPeople();
  } catch (err) {
    errEl.textContent = err.message || 'Could not create tutor.';
    errEl.hidden = false;
  }
});

document.getElementById('studentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('studentFormError');
  const okEl = document.getElementById('studentFormSuccess');
  errEl.hidden = true;
  okEl.hidden = true;
  const fd = new FormData(e.target);
  try {
    await api('/api/admin/students', {
      method: 'POST',
      body: JSON.stringify({
        full_name: fd.get('full_name'),
        notes: fd.get('notes'),
      }),
    });
    e.target.reset();
    okEl.textContent = 'Student created successfully.';
    okEl.hidden = false;
    await loadPeople();
  } catch (err) {
    errEl.textContent = err.message || 'Could not create student.';
    errEl.hidden = false;
  }
});

document.getElementById('assignForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('assignFormError');
  const okEl = document.getElementById('assignFormSuccess');
  errEl.hidden = true;
  okEl.hidden = true;
  const fd = new FormData(e.target);
  try {
    await api('/api/admin/assignments', {
      method: 'POST',
      body: JSON.stringify({
        tutor_id: fd.get('tutor_id'),
        student_id: fd.get('student_id'),
      }),
    });
    okEl.textContent = 'Assignment saved.';
    okEl.hidden = false;
    await loadPeople();
  } catch (err) {
    errEl.textContent = err.message || 'Could not assign student.';
    errEl.hidden = false;
  }
});

async function loadAttendanceFilters() {
  const [tutors, students] = await Promise.all([
    api('/api/admin/tutors'),
    api('/api/admin/students'),
  ]);
  tutorsCache = tutors.tutors || [];
  studentsCache = students.students || [];

  const tutorSelect = document.getElementById('attTutor');
  const studentSelect = document.getElementById('attStudent');
  const tutorVal = tutorSelect.value;
  const studentVal = studentSelect.value;

  tutorSelect.innerHTML =
    '<option value="">All tutors</option>' +
    tutorsCache.map((t) => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.full_name)}</option>`).join('');
  studentSelect.innerHTML =
    '<option value="">All students</option>' +
    studentsCache.map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.full_name)}</option>`).join('');

  tutorSelect.value = tutorVal;
  studentSelect.value = studentVal;
}

async function loadAttendance() {
  const params = new URLSearchParams();
  const date = document.getElementById('attDate').value;
  const tutorId = document.getElementById('attTutor').value;
  const studentId = document.getElementById('attStudent').value;
  const status = document.getElementById('attStatus').value;
  if (date) params.set('date', date);
  if (tutorId) params.set('tutor_id', tutorId);
  if (studentId) params.set('student_id', studentId);
  if (status) params.set('status', status);

  const data = await api(`/api/admin/attendance?${params}`);
  const body = document.getElementById('attendanceBody');
  if (!data.records.length) {
    body.innerHTML = '<tr><td colspan="7">No attendance records match these filters.</td></tr>';
    return;
  }

  body.innerHTML = data.records
    .map(
      (r) => `
      <tr>
        <td>${escapeHtml(r.attendance_date)}</td>
        <td>${escapeHtml(r.student.full_name)}</td>
        <td>${escapeHtml(r.tutor.full_name)}</td>
        <td><span class="admin-badge ${escapeHtml(r.status)}">${escapeHtml(r.status)}</span></td>
        <td>${escapeHtml(r.start_time || '—')}</td>
        <td>${escapeHtml(r.end_time || '—')}</td>
        <td class="remarks-cell">${escapeHtml(r.remarks || '—')}</td>
      </tr>`
    )
    .join('');
}

['attDate', 'attTutor', 'attStudent', 'attStatus'].forEach((id) => {
  document.getElementById(id).addEventListener('change', () => loadAttendance());
});
document.getElementById('attRefreshBtn').addEventListener('click', () => loadAttendance());

function labelize(key) {
  return key.replace(/_/g, ' ');
}

function formatDate(iso) {
  try {
    return new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).toLocaleString();
  } catch {
    return iso;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

checkAuth();
