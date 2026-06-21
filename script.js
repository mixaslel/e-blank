// E-Blank State & Logic
const state = {
  currentUser: null,
  myDocuments: [],
  sharedDocuments: [],
  users: [], // {email, name, password, role}
  roles: ['Viewer', 'Editor', 'Manager', 'Admin']
};

// DOM
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const authNav = document.getElementById('auth-nav');
const userNav = document.getElementById('user-nav');
const roleBadge = document.getElementById('role-badge');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authMessage = document.getElementById('auth-message');
const usernameDisplay = document.getElementById('username-display');
const myDocsList = document.getElementById('my-documents-list');
const sharedDocsList = document.getElementById('shared-documents-list');
const fileInput = document.getElementById('file-input');
const searchInput = document.getElementById('doc-search');

// Admin DOM
const adminLink = document.getElementById('admin-link');
const adminUsersList = document.getElementById('admin-users-list');
const distDocSelect = document.getElementById('dist-doc-select');
const distRecipientsList = document.getElementById('dist-recipients-list');
const sendDocBtn = document.getElementById('send-doc-btn');
const distMessage = document.getElementById('dist-message');

// Init Mock Data
function initMockData() {
  if (!localStorage.getItem('eb_users')) {
    const defaultAdmin = { email: 'admin@eblank.com', name: 'System Admin', password: 'Admin123!', role: 'Admin' };
    localStorage.setItem('eb_users', JSON.stringify([defaultAdmin]));
  }
  state.users = JSON.parse(localStorage.getItem('eb_users'));
}

// Tab Switching (Auth)
document.querySelectorAll('.auth-tabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    loginForm.classList.toggle('hidden', tab.dataset.tab !== 'login');
    registerForm.classList.toggle('hidden', tab.dataset.tab !== 'register');
  });
});
document.getElementById('switch-to-register').addEventListener('click', e => { e.preventDefault(); document.querySelector('[data-tab="register"]').click(); });
document.getElementById('switch-to-login').addEventListener('click', e => { e.preventDefault(); document.querySelector('[data-tab="login"]').click(); });

// Auth Message
function showAuthMessage(msg, type) {
  authMessage.textContent = msg;
  authMessage.className = `message ${type}`;
  authMessage.classList.remove('hidden');
  setTimeout(() => authMessage.classList.add('hidden'), 3000);
}

// Login
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const user = state.users.find(u => u.email === email);
  
  if (user && user.password === password) {
    state.currentUser = user;
    loadUserData();
    showAuthMessage('Login successful!', 'success');
  } else {
    showAuthMessage('Invalid credentials', 'error');
  }
});

// Register
registerForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;

  if (password !== confirm) return showAuthMessage('Passwords do not match', 'error');
  if (state.users.find(u => u.email === email)) return showAuthMessage('Email already registered', 'error');

  const newUser = { email, name, password, role: 'Viewer' };
  state.users.push(newUser);
  saveUsers();
  state.currentUser = newUser;
  loadUserData();
  showAuthMessage('Account created successfully!', 'success');
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
  state.currentUser = null;
  state.myDocuments = [];
  state.sharedDocuments = [];
  authView.classList.remove('hidden');
  dashboardView.classList.add('hidden');
  authNav.classList.remove('hidden');
  userNav.classList.add('hidden');
});

// Load User Data & UI
function loadUserData() {
  authView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  authNav.classList.add('hidden');
  userNav.classList.remove('hidden');
  usernameDisplay.textContent = state.currentUser.name.split(' ')[0];
  
  // Role Badge
  roleBadge.textContent = state.currentUser.role;
  roleBadge.className = `badge ${state.currentUser.role.toLowerCase()}`;
  roleBadge.classList.remove('hidden');

  // Admin Access
  adminLink.classList.toggle('hidden', state.currentUser.role !== 'Admin');

  loadDocuments();
  loadSharedDocuments();
  switchView('my-docs');
}

// View Switching
function switchView(view) {
  document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
  document.getElementById(`${view}-view`).classList.remove('hidden');
  document.querySelectorAll('.nav-links li').forEach(li => li.classList.toggle('active', li.dataset.view === view));
  
  if (view === 'shared-docs') renderSharedDocs();
  if (view === 'admin') renderAdminPanel();
}

document.querySelectorAll('.nav-links li[data-view]').forEach(li => {
  li.addEventListener('click', () => switchView(li.dataset.view));
});
adminLink.addEventListener('click', () => switchView('admin'));

// Document Handling
function loadDocuments() {
  const key = `docs_${state.currentUser.email}`;
  state.myDocuments = JSON.parse(localStorage.getItem(key) || '[]');
  renderMyDocs();
}

function saveMyDocs() {
  localStorage.setItem(`docs_${state.currentUser.email}`, JSON.stringify(state.myDocuments));
}

function renderMyDocs(filter = '') {
  myDocsList.innerHTML = '';
  const filtered = state.myDocuments.filter(d => d.name.toLowerCase().includes(filter.toLowerCase()));
  document.getElementById('my-empty-state').classList.toggle('hidden', filtered.length > 0);

  filtered.forEach((doc, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><i class="fa fa-file" style="color:#2563eb;margin-right:0.5rem;"></i>${doc.name}</td>
      <td>${(doc.size/1024).toFixed(1)} KB</td>
      <td>${new Date(doc.date).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="downloadDoc(${i})"><i class="fa fa-download"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteDoc(${i})"><i class="fa fa-trash"></i></button>
      </td>`;
    myDocsList.appendChild(tr);
  });
  updateDistDocSelect();
}

fileInput.addEventListener('change', e => {
  Array.from(e.target.files).forEach(file => {
    state.myDocuments.push({ id: Date.now() + Math.random(), name: file.name, size: file.size, date: new Date().toISOString() });
  });
  saveMyDocs();
  renderMyDocs();
});

searchInput.addEventListener('input', e => renderMyDocs(e.target.value));

window.downloadDoc = (idx) => alert(`Demo: Downloading ${state.myDocuments[idx].name}`);
window.deleteDoc = (idx) => {
  if (confirm('Delete?')) { state.myDocuments.splice(idx, 1); saveMyDocs(); renderMyDocs(searchInput.value); }
};

// Shared Docs
function loadSharedDocuments() {
  const key = `shared_${state.currentUser.email}`;
  state.sharedDocuments = JSON.parse(localStorage.getItem(key) || '[]');
}

function renderSharedDocs() {
  sharedDocsList.innerHTML = '';
  document.getElementById('shared-empty-state').classList.toggle('hidden', state.sharedDocuments.length > 0);
  state.sharedDocuments.forEach(doc => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><i class="fa fa-file-alt" style="color:#10b981;margin-right:0.5rem;"></i>${doc.name}</td>
                    <td>${doc.from}</td><td>${doc.role}</td><td>${new Date(doc.date).toLocaleDateString()}</td>`;
    sharedDocsList.appendChild(tr);
  });
}

// Admin Panel
function renderAdminPanel() {
  adminUsersList.innerHTML = '';
  state.users.forEach(user => {
    if (user.email === state.currentUser.email) return; // Don't edit self
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>
        <select class="role-select" data-email="${user.email}">
          ${state.roles.map(r => `<option value="${r}" ${user.role === r ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
      </td>
      <td><button class="btn btn-sm btn-primary" onclick="saveUserRole('${user.email}')">Save</button></td>`;
    adminUsersList.appendChild(tr);
  });
  renderDistRecipients();
}

window.saveUserRole = (email) => {
  const select = document.querySelector(`select[data-email="${email}"]`);
  const user = state.users.find(u => u.email === email);
  user.role = select.value;
  saveUsers();
  alert(`Role updated for ${user.name}`);
};

function saveUsers() {
  localStorage.setItem('eb_users', JSON.stringify(state.users));
}

function renderDistRecipients() {
  distRecipientsList.innerHTML = '';
  state.users.forEach(user => {
    if (user.email === state.currentUser.email) return;
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" value="${user.email}"> ${user.name}`;
    distRecipientsList.appendChild(label);
  });
}

function updateDistDocSelect() {
  distDocSelect.innerHTML = '<option value="">-- Choose --</option>';
  state.myDocuments.forEach((doc, i) => {
    distDocSelect.innerHTML += `<option value="${i}">${doc.name}</option>`;
  });
}

document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('admin-users-tab').classList.toggle('hidden', tab.dataset.adminTab !== 'users');
    document.getElementById('admin-distribute-tab').classList.toggle('hidden', tab.dataset.adminTab !== 'distribute');
  });
});

sendDocBtn.addEventListener('click', () => {
  const docIdx = distDocSelect.value;
  const recipients = Array.from(distRecipientsList.querySelectorAll('input:checked')).map(cb => cb.value);
  
  if (docIdx === '' || recipients.length === 0) {
    distMessage.textContent = 'Select document and at least one recipient.';
    distMessage.className = 'message error';
    return distMessage.classList.remove('hidden');
  }

  const doc = state.myDocuments[docIdx];
  recipients.forEach(email => {
    const key = `shared_${email}`;
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    current.push({ ...doc, from: state.currentUser.name, role: state.users.find(u => u.email === email)?.role || 'Viewer', date: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(current));
  });

  distMessage.textContent = `Document sent to ${recipients.length} employee(s).`;
  distMessage.className = 'message success';
  distMessage.classList.remove('hidden');
  setTimeout(() => distMessage.classList.add('hidden'), 3000);
});

// Drag & Drop
const uploadZone = document.getElementById('upload-zone');
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.borderColor = 'var(--primary)'; });
uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = 'var(--border)'; });
uploadZone.addEventListener('drop', e => {
  e.preventDefault(); uploadZone.style.borderColor = 'var(--border)';
  fileInput.files = e.dataTransfer.files;
  fileInput.dispatchEvent(new Event('change'));
});

// Init
initMockData();