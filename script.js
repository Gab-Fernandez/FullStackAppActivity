// ==================== STORAGE ====================
const STORAGE_KEY = 'ipt_demo_v1';
let currentUser = null;

window.db = {
  accounts: [],
  departments: [],
  employees: [],
  requests: []
};

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { window.db = JSON.parse(raw); }
    catch { seedData(); }
  } else {
    seedData();
  }
}

function seedData() {
  window.db.accounts.push({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'Password123!',
    role: 'Admin',
    verified: true
  });
  window.db.departments.push(
    { name: 'Engineering', description: 'Software team' },
    { name: 'HR', description: 'Human Resources' }
  );
  saveToStorage();
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

// ==================== AUTH ====================
function setAuthState(isAuth, user) {
  currentUser = user;
  if (isAuth && user) {
    localStorage.setItem('auth_token', user.email);
    document.body.className = user.role === 'Admin'
      ? 'authenticated is-admin'
      : 'authenticated';
    document.getElementById('navUsername').innerText = user.firstName + ' ' + user.lastName;
  } else {
    currentUser = null;
    localStorage.removeItem('auth_token');
    document.body.className = 'not-authenticated';
    document.getElementById('navUsername').innerText = '';
  }
}

function logout() {
  setAuthState(false, null);
  navigateTo('home');
}

// ==================== ROUTING ====================
function navigateTo(path) {
  window.location.hash = '#/' + path;
}

const protectedRoutes = ['profile', 'requests', 'employees', 'accounts', 'departments'];
const adminRoutes = ['employees', 'accounts', 'departments'];

function handleRouting() {
  let hash = window.location.hash.replace('#/', '');
  if (!hash) hash = 'home';

  // Redirect unauthenticated users
  if (protectedRoutes.includes(hash) && !currentUser) {
    navigateTo('login');
    return;
  }

  // Redirect non-admins from admin routes
  if (adminRoutes.includes(hash) && currentUser && currentUser.role !== 'Admin') {
    navigateTo('profile');
    showToast('Access denied!', 'danger');
    return;
  }

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Show matching page
  const pageId = hash + '-page';
  const page = document.getElementById(pageId);
  if (page) {
    page.classList.add('active');
    // Render page data
    if (hash === 'profile') renderProfile();
    if (hash === 'employees') renderEmployeesTable();
    if (hash === 'departments') renderDepartmentsTable();
    if (hash === 'accounts') renderAccountsList();
    if (hash === 'requests') renderRequestsTable();
  } else {
    document.getElementById('home-page').classList.add('active');
  }
}

window.addEventListener('hashchange', handleRouting);

// ==================== REGISTER ====================
function handleRegister() {
  const firstName = document.getElementById('registerFirstName').value.trim();
  const lastName = document.getElementById('registerLastName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const errorEl = document.getElementById('registerError');

  errorEl.classList.add('d-none');

  if (!firstName || !lastName || !email || !password) {
    errorEl.innerText = 'All fields are required!';
    errorEl.classList.remove('d-none');
    return;
  }
  if (password.length < 6) {
    errorEl.innerText = 'Password must be at least 6 characters!';
    errorEl.classList.remove('d-none');
    return;
  }
  if (window.db.accounts.some(acc => acc.email === email)) {
    errorEl.innerText = 'Email already exists!';
    errorEl.classList.remove('d-none');
    return;
  }

  window.db.accounts.push({ firstName, lastName, email, password, role: 'User', verified: false });
  saveToStorage();
  localStorage.setItem('unverified_email', email);
  document.getElementById('verifyEmailDisplay').innerText = email;
  navigateTo('verify-email');
}

// ==================== VERIFY EMAIL ====================
function simulateVerify() {
  const email = localStorage.getItem('unverified_email');
  const acc = window.db.accounts.find(a => a.email === email);
  if (acc) {
    acc.verified = true;
    saveToStorage();
    showToast('Email verified! You may now log in.', 'success');
    navigateTo('login');
  }
}

// ==================== LOGIN ====================
function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');

  errorEl.classList.add('d-none');

  const user = window.db.accounts.find(acc =>
    acc.email === email && acc.password === password && acc.verified === true
  );

  if (!user) {
    errorEl.innerText = 'Invalid credentials or account not verified!';
    errorEl.classList.remove('d-none');
    return;
  }

  setAuthState(true, user);
  showToast('Welcome back, ' + user.firstName + '!', 'success');
  navigateTo('profile');
}

// ==================== PROFILE ====================
function renderProfile() {
  if (!currentUser) return;
  document.getElementById('profileInfo').innerHTML = `
    <p><strong>${currentUser.firstName} ${currentUser.lastName}</strong></p>
    <p><strong>Email:</strong> ${currentUser.email}</p>
    <p><strong>Role:</strong> ${currentUser.role}</p>
  `;
}

// ==================== EMPLOYEES ====================
function renderEmployeesTable() {
  const tbody = document.getElementById('employeesTable');
  if (window.db.employees.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">No employees.</td></tr>';
    return;
  }
  tbody.innerHTML = window.db.employees.map((emp, i) => {
    const dept = window.db.departments.find(d => d.name === emp.dept);
    return `<tr>
      <td>${emp.empId}</td>
      <td>${emp.email}</td>
      <td>${emp.position}</td>
      <td>${dept ? dept.name : emp.dept}</td>
      <td>
        <button class="btn btn-warning btn-sm me-1" onclick="editEmployee(${i})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteEmployee(${i})">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

function showEmployeeForm() {
  document.getElementById('employeeForm').classList.remove('d-none');
  document.getElementById('empIndex').value = '';
  document.getElementById('empId').value = '';
  document.getElementById('empEmail').value = '';
  document.getElementById('empPosition').value = '';
  document.getElementById('empHireDate').value = '';
  populateDeptDropdown('empDept');
}

function hideEmployeeForm() {
  document.getElementById('employeeForm').classList.add('d-none');
}

function populateDeptDropdown(selectId) {
  const select = document.getElementById(selectId);
  select.innerHTML = window.db.departments.map(d =>
    `<option value="${d.name}">${d.name}</option>`
  ).join('');
}

function saveEmployee() {
  const index = document.getElementById('empIndex').value;
  const empId = document.getElementById('empId').value.trim();
  const email = document.getElementById('empEmail').value.trim();
  const position = document.getElementById('empPosition').value.trim();
  const dept = document.getElementById('empDept').value;
  const hireDate = document.getElementById('empHireDate').value;

  if (!empId || !email || !position) {
    showToast('Please fill all required fields!', 'danger');
    return;
  }

  const empData = { empId, email, position, dept, hireDate };

  if (index !== '') {
    window.db.employees[parseInt(index)] = empData;
    showToast('Employee updated!', 'success');
  } else {
    window.db.employees.push(empData);
    showToast('Employee added!', 'success');
  }

  saveToStorage();
  hideEmployeeForm();
  renderEmployeesTable();
}

function editEmployee(i) {
  const emp = window.db.employees[i];
  showEmployeeForm();
  document.getElementById('empIndex').value = i;
  document.getElementById('empId').value = emp.empId;
  document.getElementById('empEmail').value = emp.email;
  document.getElementById('empPosition').value = emp.position;
  document.getElementById('empDept').value = emp.dept;
  document.getElementById('empHireDate').value = emp.hireDate;
}

function deleteEmployee(i) {
  if (confirm('Delete this employee?')) {
    window.db.employees.splice(i, 1);
    saveToStorage();
    renderEmployeesTable();
    showToast('Employee deleted!', 'danger');
  }
}

// ==================== DEPARTMENTS ====================
function renderDepartmentsTable() {
  const tbody = document.getElementById('departmentsTable');
  if (window.db.departments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">No departments.</td></tr>';
    return;
  }
  tbody.innerHTML = window.db.departments.map((dept, i) => `
    <tr>
      <td>${dept.name}</td>
      <td>${dept.description}</td>
      <td>
        <button class="btn btn-warning btn-sm me-1" onclick="editDept(${i})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteDept(${i})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function showDeptForm() {
  document.getElementById('deptForm').classList.remove('d-none');
  document.getElementById('deptIndex').value = '';
  document.getElementById('deptName').value = '';
  document.getElementById('deptDesc').value = '';
}

function hideDeptForm() {
  document.getElementById('deptForm').classList.add('d-none');
}

function saveDept() {
  const index = document.getElementById('deptIndex').value;
  const name = document.getElementById('deptName').value.trim();
  const description = document.getElementById('deptDesc').value.trim();

  if (!name) {
    showToast('Department name is required!', 'danger');
    return;
  }

  const deptData = { name, description };

  if (index !== '') {
    window.db.departments[parseInt(index)] = deptData;
    showToast('Department updated!', 'success');
  } else {
    window.db.departments.push(deptData);
    showToast('Department added!', 'success');
  }

  saveToStorage();
  hideDeptForm();
  renderDepartmentsTable();
}

function editDept(i) {
  const dept = window.db.departments[i];
  showDeptForm();
  document.getElementById('deptIndex').value = i;
  document.getElementById('deptName').value = dept.name;
  document.getElementById('deptDesc').value = dept.description;
}

function deleteDept(i) {
  if (confirm('Delete this department?')) {
    window.db.departments.splice(i, 1);
    saveToStorage();
    renderDepartmentsTable();
    showToast('Department deleted!', 'danger');
  }
}

// ==================== ACCOUNTS ====================
function renderAccountsList() {
  const tbody = document.getElementById('accountsTable');
  tbody.innerHTML = window.db.accounts.map((acc, i) => `
    <tr>
      <td>${acc.firstName} ${acc.lastName}</td>
      <td>${acc.email}</td>
      <td>${acc.role}</td>
      <td>${acc.verified ? '✅' : '❌'}</td>
      <td>
        <button class="btn btn-warning btn-sm me-1" onclick="editAccount(${i})">Edit</button>
        <button class="btn btn-info btn-sm me-1" onclick="resetPassword(${i})">Reset Password</button>
        <button class="btn btn-danger btn-sm" onclick="deleteAccount(${i})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function showAccountForm() {
  document.getElementById('accountForm').classList.remove('d-none');
  document.getElementById('accIndex').value = '';
  document.getElementById('accFirstName').value = '';
  document.getElementById('accLastName').value = '';
  document.getElementById('accEmail').value = '';
  document.getElementById('accPassword').value = '';
  document.getElementById('accRole').value = 'User';
  document.getElementById('accVerified').checked = false;
}

function hideAccountForm() {
  document.getElementById('accountForm').classList.add('d-none');
}

function saveAccount() {
  const index = document.getElementById('accIndex').value;
  const firstName = document.getElementById('accFirstName').value.trim();
  const lastName = document.getElementById('accLastName').value.trim();
  const email = document.getElementById('accEmail').value.trim();
  const password = document.getElementById('accPassword').value;
  const role = document.getElementById('accRole').value;
  const verified = document.getElementById('accVerified').checked;

  if (!firstName || !lastName || !email || !password) {
    showToast('Please fill all required fields!', 'danger');
    return;
  }

  const accData = { firstName, lastName, email, password, role, verified };

  if (index !== '') {
    window.db.accounts[parseInt(index)] = accData;
    showToast('Account updated!', 'success');
  } else {
    if (window.db.accounts.some(a => a.email === email)) {
      showToast('Email already exists!', 'danger');
      return;
    }
    window.db.accounts.push(accData);
    showToast('Account added!', 'success');
  }

  saveToStorage();
  hideAccountForm();
  renderAccountsList();
}

function editAccount(i) {
  const acc = window.db.accounts[i];
  showAccountForm();
  document.getElementById('accIndex').value = i;
  document.getElementById('accFirstName').value = acc.firstName;
  document.getElementById('accLastName').value = acc.lastName;
  document.getElementById('accEmail').value = acc.email;
  document.getElementById('accPassword').value = acc.password;
  document.getElementById('accRole').value = acc.role;
  document.getElementById('accVerified').checked = acc.verified;
}

function resetPassword(i) {
  const newPass = prompt('Enter new password (min 6 chars):');
  if (!newPass || newPass.length < 6) {
    showToast('Password too short!', 'danger');
    return;
  }
  window.db.accounts[i].password = newPass;
  saveToStorage();
  showToast('Password reset!', 'success');
}

function deleteAccount(i) {
  if (window.db.accounts[i].email === currentUser.email) {
    showToast('You cannot delete your own account!', 'danger');
    return;
  }
  if (confirm('Delete this account?')) {
    window.db.accounts.splice(i, 1);
    saveToStorage();
    renderAccountsList();
    showToast('Account deleted!', 'danger');
  }
}

// ==================== REQUESTS ====================
function renderRequestsTable() {
  if (!currentUser) return;
  const myRequests = window.db.requests.filter(r => r.employeeEmail === currentUser.email);
  const tbody = document.getElementById('requestsTable');
  const noMsg = document.getElementById('noRequestsMsg');
  const tableWrapper = document.getElementById('requestsTableWrapper');

  if (myRequests.length === 0) {
    noMsg.classList.remove('d-none');
    tableWrapper.classList.add('d-none');
    return;
  }

  noMsg.classList.add('d-none');
  tableWrapper.classList.remove('d-none');

  const badgeMap = { Pending: 'warning', Approved: 'success', Rejected: 'danger' };

  tbody.innerHTML = myRequests.map(r => `
    <tr>
      <td>${r.type}</td>
      <td>${r.items.map(it => it.name + ' x' + it.qty).join(', ')}</td>
      <td><span class="badge bg-${badgeMap[r.status] || 'secondary'}">${r.status}</span></td>
      <td>${r.date}</td>
    </tr>
  `).join('');
}

function addRequestItem() {
  const container = document.getElementById('requestItems');
  const div = document.createElement('div');
  div.className = 'd-flex gap-2 mb-2 item-row';
  div.innerHTML = `
    <input type="text" class="form-control item-name" placeholder="Item name">
    <input type="number" class="form-control item-qty" value="1" min="1" style="width:80px;">
    <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(div);
}

function submitRequest() {
  const type = document.getElementById('requestType').value;
  const rows = document.querySelectorAll('#requestItems .item-row');
  const items = [];

  rows.forEach(row => {
    const name = row.querySelector('.item-name').value.trim();
    const qty = row.querySelector('.item-qty').value;
    if (name) items.push({ name, qty });
  });

  if (items.length === 0) {
    showToast('Please add at least one item!', 'danger');
    return;
  }

  window.db.requests.push({
    type,
    items,
    status: 'Pending',
    date: new Date().toLocaleDateString(),
    employeeEmail: currentUser.email
  });

  saveToStorage();
  bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();
  showToast('Request submitted!', 'success');
  renderRequestsTable();
}

// ==================== TOAST ====================
function showToast(message, type) {
  const toastEl = document.getElementById('toastEl');
  const toastMsg = document.getElementById('toastMsg');
  toastEl.className = `toast align-items-center text-white border-0 bg-${type}`;
  toastMsg.innerText = message;
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();

  // Restore session
  const token = localStorage.getItem('auth_token');
  if (token) {
    const user = window.db.accounts.find(a => a.email === token);
    if (user) setAuthState(true, user);
  }

  if (!window.location.hash) {
    window.location.hash = '#/home';
  }

  handleRouting();
});