// ====================================================================
// ASHU MODS - ADMIN CONSOLE ENGINE
// Backend: Supabase (kjqwundpnxnlqehznqyb)
// ====================================================================

const CONFIG = {
  supabaseUrl: 'https://kjqwundpnxnlqehznqyb.supabase.co',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqcXd1bmRwbnhubHFlaHpucXliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDIzMDc3NywiZXhwIjoyMTA1ODA2Nzc3fQ.zI4m8wYyyUERKwfs3WkQjnoKVeERvm_WpU3rMiaL4MM'
};

const headers = {
  'apikey': CONFIG.serviceKey,
  'Authorization': `Bearer ${CONFIG.serviceKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

// State
let currentSection = 'dashboard';

// ====================================================================
// API HELPERS
// ====================================================================
async function apiGet(endpoint) {
  try {
    const res = await fetch(`${CONFIG.supabaseUrl}/rest/v1/${endpoint}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('apiGet error:', err);
    showToast(`Error: ${err.message}`, 'error');
    return [];
  }
}

async function apiPost(endpoint, body) {
  try {
    const res = await fetch(`${CONFIG.supabaseUrl}/rest/v1/${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (err) {
    console.error('apiPost error:', err);
    showToast(`Failed: ${err.message}`, 'error');
    throw err;
  }
}

async function apiPatch(endpoint, body) {
  try {
    const res = await fetch(`${CONFIG.supabaseUrl}/rest/v1/${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (err) {
    console.error('apiPatch error:', err);
    showToast(`Failed: ${err.message}`, 'error');
    throw err;
  }
}

async function apiDelete(endpoint) {
  try {
    const res = await fetch(`${CONFIG.supabaseUrl}/rest/v1/${endpoint}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch (err) {
    console.error('apiDelete error:', err);
    showToast(`Delete failed: ${err.message}`, 'error');
    return false;
  }
}

// ====================================================================
// INITIALIZATION & AUTH
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupModals();
  setupForms();

  const isAuth = sessionStorage.getItem('ashu_admin_auth') === 'true';
  if (isAuth) {
    showDashboardView();
  } else {
    showLoginView();
  }

  document.getElementById('admin-login-form').addEventListener('submit', handleLogin);
  document.getElementById('admin-logout-btn').addEventListener('click', handleLogout);
  document.getElementById('refresh-all-btn').addEventListener('click', () => loadSectionData(currentSection));
});

function showLoginView() {
  document.getElementById('login-view').style.display = 'flex';
  document.getElementById('app-layout').style.display = 'none';
}

function showDashboardView() {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('app-layout').style.display = 'flex';
  loadSectionData(currentSection);
}

function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('login-username').value.trim();
  const pass = document.getElementById('login-password').value.trim();

  // Validate admin credential
  if (user === 'admin' && pass === 'ashu123') {
    sessionStorage.setItem('ashu_admin_auth', 'true');
    showToast('Administrator authenticated successfully!', 'success');
    showDashboardView();
  } else {
    showToast('Invalid credentials. Please verify your admin password.', 'error');
  }
}

function handleLogout() {
  sessionStorage.removeItem('ashu_admin_auth');
  showToast('Logged out of Admin Console', 'success');
  showLoginView();
}

// ====================================================================
// NAVIGATION
// ====================================================================
function setupNavigation() {
  const items = document.querySelectorAll('.sidebar-menu .menu-item');
  items.forEach(item => {
    item.addEventListener('click', () => {
      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const sec = item.getAttribute('data-section');
      switchSection(sec);
    });
  });
}

function switchSection(sec) {
  currentSection = sec;
  document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
  
  const target = document.getElementById(`section-${sec}`);
  if (target) {
    target.style.display = 'block';
  }

  const titles = {
    'dashboard': 'Dashboard Overview',
    'licenses': 'License Keys Management',
    'devices': 'Bound Devices & Users',
    'social': 'First-Time Social Onboarding',
    'app-config': 'Remote App Configuration',
    'files': 'Remote File Operations & Patches',
    'versions': 'Application Releases & Policies',
    'security-logs': 'Security & Anti-Tamper Logs',
    'settings': 'Cloud Integration & Settings'
  };

  document.getElementById('current-section-title').textContent = titles[sec] || 'Admin Console';
  loadSectionData(sec);
}

function loadSectionData(sec) {
  switch (sec) {
    case 'dashboard':
      loadDashboardStats();
      break;
    case 'licenses':
      loadLicenses();
      break;
    case 'devices':
      loadDevices();
      break;
    case 'social':
      loadSocialLinks();
      break;
    case 'app-config':
      loadAppConfig();
      break;
    case 'files':
      loadFiles();
      break;
    case 'versions':
      loadVersions();
      break;
    case 'security-logs':
      loadSecurityLogs();
      break;
    default:
      break;
  }
}

// ====================================================================
// 1. DASHBOARD STATS
// ====================================================================
async function loadDashboardStats() {
  try {
    const licenses = await apiGet('licenses?select=status');
    const devices = await apiGet('devices?select=id');
    const files = await apiGet('file_configs?select=id&enabled=eq.true');
    const recentLogs = await apiGet('audit_logs?select=*&order=created_at.desc&limit=8');

    document.getElementById('stat-total-licenses').textContent = licenses.length;
    document.getElementById('stat-active-licenses').textContent = licenses.filter(l => l.status === 'active').length;
    document.getElementById('stat-total-devices').textContent = devices.length;
    document.getElementById('stat-total-files').textContent = files.length;

    // Render Recent Logs table
    const tbody = document.getElementById('dashboard-recent-logs');
    if (!recentLogs.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No security events recorded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = recentLogs.map(log => `
      <tr>
        <td><strong>${log.event_type}</strong></td>
        <td><span class="status-pill ${getSeverityClass(log.severity)}">${log.severity}</span></td>
        <td><span class="code-badge">${log.device_id || 'N/A'}</span></td>
        <td>${log.license_key || '—'}</td>
        <td style="color:var(--text-secondary);">${new Date(log.created_at).toLocaleString()}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Stats error:', err);
  }
}

function getSeverityClass(sev) {
  if (sev === 'critical') return 'status-revoked';
  if (sev === 'warning' || sev === 'security_alert') return 'status-expired';
  return 'status-active';
}

// ====================================================================
// 2. LICENSES MANAGEMENT
// ====================================================================
async function loadLicenses() {
  const tbody = document.getElementById('licenses-table-body');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">Loading licenses...</td></tr>';

  const licenses = await apiGet('licenses?select=*&order=created_at.desc');
  if (!licenses.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No licenses created yet.</td></tr>';
    return;
  }

  tbody.innerHTML = licenses.map(l => `
    <tr>
      <td><span class="code-badge" style="font-weight:700; color:var(--text-primary); font-size:13px;">${l.license_key}</span></td>
      <td><span class="status-pill status-${l.status}">${l.status}</span></td>
      <td>${l.duration_days} Days</td>
      <td>${l.device_limit} Device(s)</td>
      <td style="color:var(--text-secondary);">${l.activated_at ? new Date(l.activated_at).toLocaleDateString() : 'Pending'}</td>
      <td style="color:var(--text-secondary);">${l.expires_at ? new Date(l.expires_at).toLocaleDateString() : '—'}</td>
      <td>
        <div style="display:flex; gap:6px;">
          ${l.status === 'active' ? `
            <button class="btn btn-secondary btn-sm" onclick="updateLicenseStatus('${l.id}', 'suspended')">Suspend</button>
            <button class="btn btn-danger btn-sm" onclick="updateLicenseStatus('${l.id}', 'revoked')">Revoke</button>
          ` : `
            <button class="btn btn-primary btn-sm" onclick="updateLicenseStatus('${l.id}', 'active')">Activate</button>
          `}
          <button class="btn btn-danger btn-sm" onclick="deleteLicense('${l.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function updateLicenseStatus(id, newStatus) {
  await apiPatch(`licenses?id=eq.${id}`, { status: newStatus });
  showToast(`License marked as ${newStatus}`, 'success');
  loadLicenses();
}

async function deleteLicense(id) {
  if (!confirm('Are you sure you want to delete this license and all associated device bindings?')) return;
  await apiDelete(`licenses?id=eq.${id}`);
  showToast('License deleted successfully', 'success');
  loadLicenses();
}

// ====================================================================
// 3. USERS & DEVICES
// ====================================================================
async function loadDevices() {
  const tbody = document.getElementById('devices-table-body');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">Loading devices...</td></tr>';

  const devices = await apiGet('devices?select=*,licenses(license_key)&order=last_seen.desc');
  if (!devices.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No devices bound to licenses yet.</td></tr>';
    return;
  }

  tbody.innerHTML = devices.map(d => `
    <tr>
      <td><span class="code-badge">${d.device_identifier}</span></td>
      <td><strong>${d.device_model || 'Unknown'}</strong></td>
      <td>Android ${d.android_version || 'N/A'}</td>
      <td>v${d.app_version || '1.0.0'}</td>
      <td style="color:var(--text-secondary);">${new Date(d.last_seen).toLocaleString()}</td>
      <td>
        <span class="status-pill ${d.is_blocked ? 'status-revoked' : 'status-active'}">
          ${d.is_blocked ? 'BLOCKED' : 'AUTHORIZED'}
        </span>
      </td>
      <td>
        <button class="btn ${d.is_blocked ? 'btn-primary' : 'btn-danger'} btn-sm" onclick="toggleDeviceBlock('${d.id}', ${!d.is_blocked})">
          ${d.is_blocked ? 'Unblock' : 'Block Device'}
        </button>
      </td>
    </tr>
  `).join('');
}

async function toggleDeviceBlock(id, block) {
  await apiPatch(`devices?id=eq.${id}`, { is_blocked: block });
  showToast(`Device ${block ? 'blocked' : 'unblocked'} successfully`, 'success');
  loadDevices();
}

// ====================================================================
// 4. SOCIAL LINKS
// ====================================================================
async function loadSocialLinks() {
  const links = await apiGet('social_links?id=eq.1');
  if (!links.length) return;
  const s = links[0];

  document.getElementById('social-wa-name').value = s.whatsapp_name || '';
  document.getElementById('social-wa-url').value = s.whatsapp_url || '';
  document.getElementById('social-wa-enabled').checked = s.whatsapp_enabled !== false;

  document.getElementById('social-yt-name').value = s.youtube_name || '';
  document.getElementById('social-yt-url').value = s.youtube_url || '';
  document.getElementById('social-yt-enabled').checked = s.youtube_enabled !== false;

  document.getElementById('social-tg-name').value = s.telegram_name || '';
  document.getElementById('social-tg-url').value = s.telegram_url || '';
  document.getElementById('social-tg-enabled').checked = s.telegram_enabled !== false;

  document.getElementById('social-tg2-name').value = s.telegram2_name || '';
  document.getElementById('social-tg2-url').value = s.telegram2_url || '';
  document.getElementById('social-tg2-enabled').checked = s.telegram2_enabled !== false;
}

async function saveSocialLinks() {
  const body = {
    whatsapp_name: document.getElementById('social-wa-name').value.trim(),
    whatsapp_url: document.getElementById('social-wa-url').value.trim(),
    whatsapp_enabled: document.getElementById('social-wa-enabled').checked,

    youtube_name: document.getElementById('social-yt-name').value.trim(),
    youtube_url: document.getElementById('social-yt-url').value.trim(),
    youtube_enabled: document.getElementById('social-yt-enabled').checked,

    telegram_name: document.getElementById('social-tg-name').value.trim(),
    telegram_url: document.getElementById('social-tg-url').value.trim(),
    telegram_enabled: document.getElementById('social-tg-enabled').checked,

    telegram2_name: document.getElementById('social-tg2-name').value.trim(),
    telegram2_url: document.getElementById('social-tg2-url').value.trim(),
    telegram2_enabled: document.getElementById('social-tg2-enabled').checked,

    updated_at: new Date().toISOString()
  };

  await apiPatch('social_links?id=eq.1', body);
  showToast('Social onboarding links updated live in Supabase!', 'success');
}

// ====================================================================
// 5. APP CONFIGURATION
// ====================================================================
async function loadAppConfig() {
  const configs = await apiGet('app_config?id=eq.1');
  if (!configs.length) return;
  const c = configs[0];

  document.getElementById('cfg-app-name').value = c.app_name || '';
  document.getElementById('cfg-home-title').value = c.home_title || '';
  document.getElementById('cfg-login-title').value = c.login_title || '';
  document.getElementById('cfg-get-key-url').value = c.get_key_url || '';
  document.getElementById('cfg-min-version').value = c.minimum_version || '1.0.0';
  document.getElementById('cfg-signature').value = c.config_signature || 'ASHU_MODS_SECURE_SIG_V1';

  const mm = document.getElementById('cfg-maintenance-mode');
  mm.checked = c.maintenance_mode === true;
  document.getElementById('cfg-maintenance-text').textContent = mm.checked ? 'ENABLED' : 'Disabled';
  document.getElementById('cfg-maintenance-text').style.color = mm.checked ? 'var(--accent-red)' : 'var(--text-secondary)';
  document.getElementById('cfg-maintenance-msg').value = c.maintenance_message || '';
}

async function saveAppConfig() {
  const mm = document.getElementById('cfg-maintenance-mode').checked;
  const body = {
    app_name: document.getElementById('cfg-app-name').value.trim(),
    home_title: document.getElementById('cfg-home-title').value.trim(),
    login_title: document.getElementById('cfg-login-title').value.trim(),
    get_key_url: document.getElementById('cfg-get-key-url').value.trim(),
    minimum_version: document.getElementById('cfg-min-version').value.trim(),
    maintenance_mode: mm,
    maintenance_message: document.getElementById('cfg-maintenance-msg').value.trim(),
    updated_at: new Date().toISOString()
  };

  await apiPatch('app_config?id=eq.1', body);
  showToast('App configuration updated live without rebuilding APK!', 'success');
  loadAppConfig();
}

// ====================================================================
// 6. FILES & OPERATIONS
// ====================================================================
async function loadFiles() {
  const tbody = document.getElementById('files-table-body');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Loading files...</td></tr>';

  const files = await apiGet('file_configs?select=*&order=sort_order.asc');
  if (!files.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No file operations defined yet.</td></tr>';
    return;
  }

  tbody.innerHTML = files.map(f => `
    <tr>
      <td><strong>${f.name}</strong></td>
      <td><span class="code-badge">${f.target_path}</span></td>
      <td><span class="status-pill status-active">${f.operation_type}</span></td>
      <td>v${f.version}</td>
      <td>
        <label class="switch-label">
          <input type="checkbox" class="switch-input" ${f.enabled ? 'checked' : ''} onchange="toggleFileEnabled('${f.id}', this.checked)">
        </label>
      </td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteFile('${f.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function toggleFileEnabled(id, enabled) {
  await apiPatch(`file_configs?id=eq.${id}`, { enabled });
  showToast(`File operation ${enabled ? 'enabled' : 'disabled'}`, 'success');
}

async function deleteFile(id) {
  if (!confirm('Are you sure you want to remove this remote file operation?')) return;
  await apiDelete(`file_configs?id=eq.${id}`);
  showToast('File definition removed', 'success');
  loadFiles();
}

// ====================================================================
// 7. APP VERSIONS
// ====================================================================
async function loadVersions() {
  const tbody = document.getElementById('versions-table-body');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Loading versions...</td></tr>';

  const versions = await apiGet('app_versions?select=*&order=version_code.desc');
  if (!versions.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No version entries configured.</td></tr>';
    return;
  }

  tbody.innerHTML = versions.map(v => `
    <tr>
      <td><strong>v${v.version_name}</strong></td>
      <td>Build #${v.version_code}</td>
      <td><a href="${v.download_url}" target="_blank" style="color:var(--accent-blue); text-decoration:none;">${v.download_url || 'N/A'}</a></td>
      <td><span class="status-pill ${v.is_force_update ? 'status-revoked' : 'status-active'}">${v.is_force_update ? 'FORCE UPDATE' : 'OPTIONAL'}</span></td>
      <td><span class="status-pill ${v.is_active ? 'status-active' : 'status-expired'}">${v.is_active ? 'ACTIVE' : 'INACTIVE'}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="toggleForceUpdate('${v.id}', ${!v.is_force_update})">Toggle Force</button>
      </td>
    </tr>
  `).join('');
}

async function toggleForceUpdate(id, force) {
  await apiPatch(`app_versions?id=eq.${id}`, { is_force_update: force });
  showToast('Version policy updated', 'success');
  loadVersions();
}

// ====================================================================
// 8. SECURITY LOGS
// ====================================================================
async function loadSecurityLogs() {
  const tbody = document.getElementById('audit-table-body');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Loading logs...</td></tr>';

  const logs = await apiGet('audit_logs?select=*&order=created_at.desc&limit=50');
  if (!logs.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No security events recorded.</td></tr>';
    return;
  }

  tbody.innerHTML = logs.map(l => `
    <tr>
      <td><strong>${l.event_type}</strong></td>
      <td><span class="status-pill ${getSeverityClass(l.severity)}">${l.severity}</span></td>
      <td><span class="code-badge">${l.device_id || 'Unknown'}</span></td>
      <td>${l.license_key || '—'}</td>
      <td style="font-size:11px; max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
        ${JSON.stringify(l.details || {})}
      </td>
      <td style="color:var(--text-secondary);">${new Date(l.created_at).toLocaleString()}</td>
    </tr>
  `).join('');
}

// ====================================================================
// MODAL & FORM HANDLERS
// ====================================================================
function setupModals() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      document.getElementById(modalId).classList.remove('open');
    });
  });

  document.getElementById('open-create-license-btn').addEventListener('click', () => {
    document.getElementById('modal-create-license').classList.add('open');
    document.getElementById('new-license-key').value = generateKey();
  });

  document.getElementById('open-add-file-btn').addEventListener('click', () => {
    document.getElementById('modal-add-file').classList.add('open');
  });

  document.getElementById('btn-generate-key').addEventListener('click', () => {
    document.getElementById('new-license-key').value = generateKey();
  });
}

function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const seg1 = Array.from({length: 4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  const seg2 = Array.from({length: 4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  const seg3 = Array.from({length: 4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  return `ASHU-${seg1}-${seg2}-${seg3}`;
}

function setupForms() {
  document.getElementById('save-social-btn').addEventListener('click', saveSocialLinks);
  document.getElementById('save-app-config-btn').addEventListener('click', saveAppConfig);

  // Maintenance mode checkbox change listener
  document.getElementById('cfg-maintenance-mode').addEventListener('change', (e) => {
    const txt = document.getElementById('cfg-maintenance-text');
    txt.textContent = e.target.checked ? 'ENABLED' : 'Disabled';
    txt.style.color = e.target.checked ? 'var(--accent-red)' : 'var(--text-secondary)';
  });

  // Create License Form
  document.getElementById('create-license-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = document.getElementById('new-license-key').value.trim();
    const days = parseInt(document.getElementById('new-license-days').value, 10);
    const devices = parseInt(document.getElementById('new-license-devices').value, 10);
    const notes = document.getElementById('new-license-notes').value.trim();

    try {
      await apiPost('licenses', {
        license_key: key,
        duration_days: days,
        device_limit: devices,
        status: 'active',
        notes: notes
      });

      showToast(`License ${key} generated successfully!`, 'success');
      document.getElementById('modal-create-license').classList.remove('open');
      loadLicenses();
      loadDashboardStats();
    } catch (err) {
      showToast(`Creation error: ${err.message}`, 'error');
    }
  });

  // Add File Config Form
  document.getElementById('add-file-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('file-name').value.trim();
    const path = document.getElementById('file-path').value.trim();
    const op = document.getElementById('file-op-type').value;
    const content = document.getElementById('file-content').value;
    const url = document.getElementById('file-url').value.trim();
    const order = parseInt(document.getElementById('file-order').value, 10) || 1;

    try {
      await apiPost('file_configs', {
        name: name,
        target_path: path,
        operation_type: op,
        file_content: content,
        resource_url: url,
        sort_order: order,
        enabled: true,
        version: '1.0.0',
        signature: 'SIG_' + Math.random().toString(36).substring(2, 9).toUpperCase()
      });

      showToast(`File operation '${name}' created!`, 'success');
      document.getElementById('modal-add-file').classList.remove('open');
      document.getElementById('add-file-form').reset();
      loadFiles();
      loadDashboardStats();
    } catch (err) {
      showToast(`Error adding file config: ${err.message}`, 'error');
    }
  });
}

// ====================================================================
// TOAST NOTIFICATIONS
// ====================================================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : '⚠️'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
