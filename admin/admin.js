const loginView = document.getElementById('loginView');
const appView = document.getElementById('appView');
const listEl = document.getElementById('submissionList');
const detailPane = document.getElementById('detailPane');

let selectedId = null;

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: options.body && !(options.body instanceof FormData)
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
      const full = display.length > 80 || key.includes('summary') || key.includes('message') || key.includes('profile') || key.includes('overview') || key.includes('history') || key.includes('approach') || key.includes('address');
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
        <label>Status
          <select id="statusSelect">
            <option value="new">New</option>
            <option value="in_progress">In progress</option>
            <option value="closed">Closed</option>
          </select>
        </label>
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
