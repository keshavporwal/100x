/**
 * MediBridge Main Application Logic
 */

const app = {
  pendingRegistrationUser: null,
  recoveryUser: null,

  init() {
    this.updateHeaderNav();
    const currentUser = Store.getCurrentUser();
    if (currentUser) {
      this.routeUserToDashboard(currentUser);
    } else {
      this.showScreen('landing');
    }
  },

  // Navigation & Screen switching
  showScreen(screenId) {
    document.querySelectorAll('.screen-view').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
      target.classList.remove('hidden');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  updateHeaderNav() {
    const user = Store.getCurrentUser();
    const unauthNav = document.getElementById('unauth-nav');
    const authNav = document.getElementById('auth-nav');
    const badge = document.getElementById('nav-user-badge');
    const nameEl = document.getElementById('nav-user-name');

    if (user) {
      unauthNav.classList.add('hidden');
      authNav.classList.remove('hidden');
      badge.textContent = `Role: ${user.role.toUpperCase()}`;
      nameEl.textContent = user.name;
    } else {
      unauthNav.classList.remove('hidden');
      authNav.classList.add('hidden');
    }
  },

  openAuthModal(mode, rolePref = 'patient') {
    this.showScreen('auth');
    this.switchAuthTab(mode);
    if (rolePref) {
      const loginRole = document.getElementById('login-role');
      if (loginRole) loginRole.value = rolePref;
      const regRole = document.getElementById('register-role');
      if (regRole) {
        regRole.value = rolePref;
        this.toggleClinicCodeField();
      }
    }
  },

  switchAuthTab(tab) {
    const tabLogin = document.getElementById('tab-login');
    const tabReg = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formReg = document.getElementById('form-register');

    if (tab === 'login') {
      tabLogin.className = "flex-1 py-3 text-center font-semibold text-blue-600 border-b-2 border-blue-600";
      tabReg.className = "flex-1 py-3 text-center font-semibold text-slate-500 border-b-2 border-transparent hover:text-slate-700";
      formLogin.classList.remove('hidden');
      formReg.classList.add('hidden');
    } else {
      tabReg.className = "flex-1 py-3 text-center font-semibold text-blue-600 border-b-2 border-blue-600";
      tabLogin.className = "flex-1 py-3 text-center font-semibold text-slate-500 border-b-2 border-transparent hover:text-slate-700";
      formReg.classList.remove('hidden');
      formLogin.classList.add('hidden');
      this.toggleClinicCodeField();
    }
  },

  toggleClinicCodeField() {
    const role = document.getElementById('register-role').value;
    const container = document.getElementById('clinic-code-container');
    const codeInput = document.getElementById('register-clinic-code');
    if (role === 'doctor' || role === 'receptionist') {
      container.classList.remove('hidden');
      codeInput.required = true;
    } else {
      container.classList.add('hidden');
      codeInput.required = false;
      codeInput.value = '';
    }
  },

  // AUTHENTICATION & REGISTRATION
  handleLogin(e) {
    e.preventDefault();
    const role = document.getElementById('login-role').value;
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    const users = Store.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email && u.role === role);

    if (!user) {
      alert(`No account found matching email '${email}' and role '${role}'. Please register first.`);
      return;
    }

    if (user.password !== password) {
      alert('Invalid password. Please try again or click "Forgot password?".');
      return;
    }

    Store.setCurrentUser(user);
    this.updateHeaderNav();
    this.routeUserToDashboard(user);
  },

  demoLogin(role) {
    const users = Store.getUsers();
    const user = users.find(u => u.role === role);
    if (user) {
      Store.setCurrentUser(user);
      this.updateHeaderNav();
      this.routeUserToDashboard(user);
    } else {
      alert(`Demo account for ${role} not found.`);
    }
  },

  handleRegister(e) {
    e.preventDefault();
    const role = document.getElementById('register-role').value;
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim().toLowerCase();
    const password = document.getElementById('register-password').value;
    const clinicCode = document.getElementById('register-clinic-code').value.trim().toUpperCase();

    const users = Store.getUsers();
    if (users.some(u => u.email.toLowerCase() === email)) {
      alert('An account with this email already exists. Please sign in instead.');
      return;
    }

    let clinicId = null;
    if (role === 'doctor' || role === 'receptionist') {
      const clinics = Store.getClinics();
      const matchingClinic = clinics.find(c => c.code === clinicCode);
      if (!matchingClinic) {
        alert(`Invalid Unique Clinic Code '${clinicCode}'. Please obtain a valid clinic code from your Institute Administrator.`);
        return;
      }
      clinicId = matchingClinic.id;
    }

    this.pendingRegistrationUser = {
      id: 'usr-' + Date.now(),
      role,
      name,
      email,
      password,
      clinicId,
      clinicCode,
      securityQuestionsSet: false,
      securityQuestions: []
    };

    this.showScreen('security-setup');
  },

  async handleSaveSecurityQuestions(e) {
    e.preventDefault();
    if (!this.pendingRegistrationUser) {
      alert('Registration session expired. Please register again.');
      this.showScreen('auth');
      return;
    }

    const q1 = document.getElementById('sq1-q').value;
    const a1 = document.getElementById('sq1-a').value;
    const q2 = document.getElementById('sq2-q').value;
    const a2 = document.getElementById('sq2-a').value;
    const q3 = document.getElementById('sq3-q').value;
    const a3 = document.getElementById('sq3-a').value;

    const h1 = await sha256(a1);
    const h2 = await sha256(a2);
    const h3 = await sha256(a3);

    this.pendingRegistrationUser.securityQuestions = [
      { question: q1, answerHash: h1 },
      { question: q2, answerHash: h2 },
      { question: q3, answerHash: h3 }
    ];
    this.pendingRegistrationUser.securityQuestionsSet = true;

    const users = Store.getUsers();
    users.push(this.pendingRegistrationUser);
    Store.saveUsers(users);

    Store.setCurrentUser(this.pendingRegistrationUser);
    const newUser = this.pendingRegistrationUser;
    this.pendingRegistrationUser = null;

    alert('Security questions saved successfully! Registration complete.');
    this.updateHeaderNav();
    this.routeUserToDashboard(newUser);
  },

  // FORGOT PASSWORD RECOVERY
  loadUserQuestionsForRecovery() {
    const email = document.getElementById('recovery-email').value.trim().toLowerCase();
    const users = Store.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email);

    const questionsBlock = document.getElementById('recovery-questions-block');
    if (user && user.securityQuestions && user.securityQuestions.length === 3) {
      document.getElementById('lbl-rec-q1').textContent = `1. ${user.securityQuestions[0].question}`;
      document.getElementById('lbl-rec-q2').textContent = `2. ${user.securityQuestions[1].question}`;
      document.getElementById('lbl-rec-q3').textContent = `3. ${user.securityQuestions[2].question}`;
      questionsBlock.classList.remove('hidden');
    } else {
      questionsBlock.classList.add('hidden');
    }
  },

  async handleVerifyRecovery(e) {
    e.preventDefault();
    const email = document.getElementById('recovery-email').value.trim().toLowerCase();
    const users = Store.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email);

    if (!user || !user.securityQuestions || user.securityQuestions.length !== 3) {
      alert('User email not found or security questions not set up.');
      return;
    }

    const a1 = document.getElementById('rec-a1').value;
    const a2 = document.getElementById('rec-a2').value;
    const a3 = document.getElementById('rec-a3').value;

    const h1 = await sha256(a1);
    const h2 = await sha256(a2);
    const h3 = await sha256(a3);

    if (
      h1 === user.securityQuestions[0].answerHash &&
      h2 === user.securityQuestions[1].answerHash &&
      h3 === user.securityQuestions[2].answerHash
    ) {
      this.recoveryUser = user;
      this.showScreen('forgot-pwd-reset');
    } else {
      alert('One or more security answers are incorrect. Please try again.');
    }
  },

  handleResetPassword(e) {
    e.preventDefault();
    if (!this.recoveryUser) {
      alert('Recovery session expired.');
      this.showScreen('auth');
      return;
    }

    const newPwd = document.getElementById('new-password').value;
    const confirmPwd = document.getElementById('confirm-password').value;

    if (newPwd !== confirmPwd) {
      alert('Passwords do not match.');
      return;
    }

    if (newPwd.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    const users = Store.getUsers();
    const u = users.find(x => x.id === this.recoveryUser.id);
    if (u) {
      u.password = newPwd;
      Store.saveUsers(users);
    }

    alert('Password updated successfully! Please sign in with your new credentials.');
    this.recoveryUser = null;
    this.openAuthModal('login');
  },

  logout() {
    Store.setCurrentUser(null);
    this.updateHeaderNav();
    this.showScreen('landing');
  },

  routeUserToDashboard(user) {
    if (user.role === 'admin') {
      this.showScreen('admin-dashboard');
      this.renderAdminDashboard();
    } else if (user.role === 'receptionist') {
      this.showScreen('receptionist-dashboard');
      this.renderReceptionistDashboard();
    } else if (user.role === 'doctor') {
      this.showScreen('doctor-dashboard');
      this.renderDoctorDashboard();
    } else if (user.role === 'patient') {
      this.showScreen('patient-dashboard');
      this.renderPatientDashboard();
    }
  },

  // MODAL UTILITIES
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      if (modalId === 'modal-onboard-staff') {
        this.populateClinicDropdownForStaffOnboarding();
      } else if (modalId === 'modal-request-appointment') {
        this.populateClinicsDropdownInRequestModal();
      }
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
  },

  // 1. INSTITUTE ADMIN WORKFLOWS
  renderAdminDashboard() {
    const clinics = Store.getClinics();
    const users = Store.getUsers();
    const staff = users.filter(u => u.role === 'doctor' || u.role === 'receptionist');

    document.getElementById('kpi-clinics-count').textContent = clinics.length;
    document.getElementById('kpi-staff-count').textContent = staff.length;

    // Render Clinics Table
    const clinicsBody = document.getElementById('table-clinics-list');
    clinicsBody.innerHTML = clinics.map(c => `
      <tr class="hover:bg-slate-50">
        <td class="p-3 font-semibold text-slate-900">${c.name}</td>
        <td class="p-3 text-slate-600">${c.specialty}</td>
        <td class="p-3 font-mono font-bold text-blue-600 bg-blue-50/50 px-2.5 py-1 rounded w-max">${c.code}</td>
        <td class="p-3 text-slate-600">${c.email}</td>
        <td class="p-3 text-slate-600">${c.phone}</td>
        <td class="p-3 text-slate-600">${c.capacity}</td>
      </tr>
    `).join('');

    // Render Staff Roster Table
    const staffBody = document.getElementById('table-staff-list');
    staffBody.innerHTML = staff.map(s => {
      const clinic = clinics.find(c => c.id === s.clinicId) || { name: 'Unassigned' };
      return `
        <tr class="hover:bg-slate-50">
          <td class="p-3 font-semibold text-slate-900">${s.name}</td>
          <td class="p-3"><span class="px-2 py-0.5 rounded text-xs font-bold ${s.role === 'doctor' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">${s.role.toUpperCase()}</span></td>
          <td class="p-3 text-slate-600">${clinic.name} (${s.clinicCode || 'N/A'})</td>
          <td class="p-3 text-slate-600">${s.email}</td>
          <td class="p-3"><span class="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Active</span></td>
          <td class="p-3">
            <button onclick="app.deboardStaff('${s.id}')" class="px-2.5 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold">Deboard Staff</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  handleEnrollClinic(e) {
    e.preventDefault();
    const name = document.getElementById('enroll-clinic-name').value.trim();
    const specialty = document.getElementById('enroll-clinic-specialty').value.trim();
    const email = document.getElementById('enroll-clinic-email').value.trim();
    const phone = document.getElementById('enroll-clinic-phone').value.trim();
    const capacity = document.getElementById('enroll-clinic-capacity').value.trim();

    // Generate unique clinic code e.g. STJ-8821
    const prefix = name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'CLN';
    const num = Math.floor(1000 + Math.random() * 9000);
    const code = `${prefix}-${num}`;

    const clinics = Store.getClinics();
    const newClinic = {
      id: 'cln-' + Date.now(),
      name,
      specialty,
      code,
      email,
      phone,
      capacity
    };

    clinics.push(newClinic);
    Store.saveClinics(clinics);

    alert(`Clinic '${name}' enrolled successfully! Unique Clinic Code generated: ${code}`);
    this.closeModal('modal-enroll-clinic');
    this.renderAdminDashboard();
  },

  populateClinicDropdownForStaffOnboarding() {
    const clinics = Store.getClinics();
    const dropdown = document.getElementById('onboard-clinic-id');
    dropdown.innerHTML = clinics.map(c => `<option value="${c.id}">${c.name} (${c.code})</option>`).join('');
  },

  handleOnboardStaff(e) {
    e.preventDefault();
    const role = document.getElementById('onboard-role').value;
    const clinicId = document.getElementById('onboard-clinic-id').value;
    const name = document.getElementById('onboard-name').value.trim();
    const email = document.getElementById('onboard-email').value.trim().toLowerCase();

    const clinics = Store.getClinics();
    const clinic = clinics.find(c => c.id === clinicId);

    const users = Store.getUsers();
    if (users.some(u => u.email.toLowerCase() === email)) {
      alert('Staff email already registered.');
      return;
    }

    const newStaff = {
      id: 'usr-' + Date.now(),
      role,
      name,
      email,
      password: 'Password123!',
      clinicId,
      clinicCode: clinic ? clinic.code : '',
      securityQuestionsSet: false,
      securityQuestions: []
    };

    users.push(newStaff);
    Store.saveUsers(users);

    alert(`Staff ${name} onboarded! Initial password is 'Password123!'. Assigned Clinic Code: ${clinic.code}`);
    this.closeModal('modal-onboard-staff');
    this.renderAdminDashboard();
  },

  deboardStaff(staffId) {
    if (confirm('Are you sure you want to deboard this staff member and revoke institutional access?')) {
      let users = Store.getUsers();
      users = users.filter(u => u.id !== staffId);
      Store.saveUsers(users);
      this.renderAdminDashboard();
    }
  },

  // 2. PATIENT WORKFLOWS
  renderPatientDashboard() {
    const currentUser = Store.getCurrentUser();
    const appointments = Store.getAppointments().filter(a => a.patientId === currentUser.id);
    const vault = Store.getVault().filter(v => v.patientId === currentUser.id);
    const docRequests = Store.getDocRequests().filter(r => r.patientId === currentUser.id && r.status === 'Pending');

    // Appointments Table
    const appBody = document.getElementById('table-patient-appointments');
    appBody.innerHTML = appointments.length === 0 ? `<tr><td colspan="5" class="p-4 text-center text-slate-500">No appointment requests or scheduled visits.</td></tr>` :
      appointments.map(a => `
        <tr class="hover:bg-slate-50">
          <td class="p-3 font-semibold text-slate-900">${a.clinicName}</td>
          <td class="p-3 text-slate-600">${a.doctorName || 'Pending Allocation'}</td>
          <td class="p-3 font-mono text-slate-600">${a.timeSlot || a.windowRequested}</td>
          <td class="p-3">
            <span class="px-2 py-0.5 rounded-full text-xs font-bold ${a.status === 'Scheduled' ? 'bg-emerald-100 text-emerald-800' : (a.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800')}">${a.status}</span>
          </td>
          <td class="p-3 text-right">
            ${a.status !== 'Cancelled' ? `<button onclick="app.cancelAppointment('${a.id}')" class="px-2.5 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold">Cancel</button>` : '<span class="text-xs text-slate-400">N/A</span>'}
          </td>
        </tr>
      `).join('');

    // Document Requests Banner
    const docReqContainer = document.getElementById('patient-doc-requests-container');
    const docReqList = document.getElementById('patient-doc-requests-list');
    if (docRequests.length > 0) {
      docReqContainer.classList.remove('hidden');
      docReqList.innerHTML = docRequests.map(r => `
        <div class="bg-white p-3 rounded-xl border border-amber-300 flex items-center justify-between">
          <div>
            <div class="font-bold text-slate-900 text-sm">${r.doctorName} requested documents:</div>
            <div class="text-xs text-slate-600 mt-0.5">"${r.message}"</div>
          </div>
          <button onclick="app.openGrantAccessModal('${r.id}')" class="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700">Grant Access</button>
        </div>
      `).join('');
    } else {
      docReqContainer.classList.add('hidden');
    }

    // Vault Table
    const vaultBody = document.getElementById('table-patient-vault');
    vaultBody.innerHTML = vault.length === 0 ? `<tr><td colspan="5" class="p-4 text-center text-slate-500">Your vault is empty. Upload medical records or diagnostic reports.</td></tr>` :
      vault.map(v => `
        <tr class="hover:bg-slate-50">
          <td class="p-3 font-semibold text-slate-900">${v.title}</td>
          <td class="p-3 text-slate-600"><span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">${v.category}</span></td>
          <td class="p-3 text-slate-600 font-mono text-xs">${v.uploadDate}</td>
          <td class="p-3 text-slate-600">${v.sharedConsent.length > 0 ? `<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">Shared (${v.sharedConsent.length} Doctor)</span>` : '<span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">Private</span>'}</td>
          <td class="p-3 text-right">
            ${v.sharedConsent.length > 0 ? `<button onclick="app.revokeConsent('${v.id}')" class="px-2.5 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold">Revoke Access</button>` : '<span class="text-xs text-slate-400">Encrypted</span>'}
          </td>
        </tr>
      `).join('');
  },

  populateClinicsDropdownInRequestModal() {
    const clinics = Store.getClinics();
    const dropdown = document.getElementById('req-clinic-id');
    dropdown.innerHTML = clinics.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    this.updateDoctorOptionsInRequestModal();
  },

  updateDoctorOptionsInRequestModal() {
    const clinicId = document.getElementById('req-clinic-id').value;
    const users = Store.getUsers();
    const doctors = users.filter(u => u.role === 'doctor' && u.clinicId === clinicId);
    const docDropdown = document.getElementById('req-doctor-id');

    docDropdown.innerHTML = `<option value="">-- Any Available Doctor (Receptionist Triage) --</option>` +
      doctors.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
  },

  handlePatientRequestAppointment(e) {
    e.preventDefault();
    const currentUser = Store.getCurrentUser();
    const clinicId = document.getElementById('req-clinic-id').value;
    const doctorId = document.getElementById('req-doctor-id').value;
    const windowReq = document.getElementById('req-window').value;
    const symptoms = document.getElementById('req-symptoms').value.trim();

    const clinics = Store.getClinics();
    const clinic = clinics.find(c => c.id === clinicId);

    const users = Store.getUsers();
    const doctor = doctorId ? users.find(u => u.id === doctorId) : null;

    const appointments = Store.getAppointments();
    const newAppointment = {
      id: 'app-' + Date.now(),
      patientId: currentUser.id,
      patientName: currentUser.name,
      clinicId,
      clinicName: clinic ? clinic.name : 'Selected Clinic',
      doctorId: doctorId || null,
      doctorName: doctor ? doctor.name : '',
      timeSlot: null,
      windowRequested: windowReq.replace('T', ' '),
      symptoms,
      status: 'Pending'
    };

    appointments.push(newAppointment);
    Store.saveAppointments(appointments);

    alert('Appointment request submitted successfully! Receptionist will review and assign a free slot.');
    this.closeModal('modal-request-appointment');
    this.renderPatientDashboard();
  },

  handleUploadDocument(e) {
    e.preventDefault();
    const currentUser = Store.getCurrentUser();
    const title = document.getElementById('doc-title').value.trim();
    const category = document.getElementById('doc-category').value;

    const vault = Store.getVault();
    vault.push({
      id: 'doc-' + Date.now(),
      patientId: currentUser.id,
      title,
      category,
      uploadDate: new Date().toISOString().split('T')[0],
      sharedConsent: []
    });
    Store.saveVault(vault);

    alert('Document securely ingested into Private Vault!');
    this.closeModal('modal-upload-document');
    this.renderPatientDashboard();
  },

  openGrantAccessModal(docReqId) {
    const docRequests = Store.getDocRequests();
    const req = docRequests.find(r => r.id === docReqId);
    if (!req) return;

    document.getElementById('grant-req-id').value = docReqId;
    document.getElementById('grant-doctor-msg').textContent = `${req.doctorName} says: "${req.message}"`;

    const vault = Store.getVault().filter(v => v.patientId === req.patientId);
    const container = document.getElementById('grant-vault-checkboxes');
    container.innerHTML = vault.length === 0 ? `<p class="text-slate-500">No documents in vault to share. Please upload first.</p>` :
      vault.map(v => `
        <label class="flex items-center gap-2">
          <input type="checkbox" name="grant-doc" value="${v.id}" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500">
          <span class="font-medium text-slate-800">${v.title} (${v.category})</span>
        </label>
      `).join('');

    this.openModal('modal-grant-access');
  },

  handleGrantConsent(e) {
    e.preventDefault();
    const reqId = document.getElementById('grant-req-id').value;
    const selectedDocIds = Array.from(document.querySelectorAll('input[name="grant-doc"]:checked')).map(cb => cb.value);

    if (selectedDocIds.length === 0) {
      alert('Please select at least one document to grant access.');
      return;
    }

    const docRequests = Store.getDocRequests();
    const req = docRequests.find(r => r.id === reqId);
    if (req) {
      req.status = 'Granted';
      Store.saveDocRequests(docRequests);
    }

    const vault = Store.getVault();
    vault.forEach(v => {
      if (selectedDocIds.includes(v.id)) {
        if (!v.sharedConsent.includes(req.doctorId)) {
          v.sharedConsent.push(req.doctorId);
        }
      }
    });
    Store.saveVault(vault);

    alert('Consent granted! Document access authorized for requesting clinician.');
    this.closeModal('modal-grant-access');
    this.renderPatientDashboard();
  },

  revokeConsent(docId) {
    const currentUser = Store.getCurrentUser();
    const vault = Store.getVault();
    const item = vault.find(v => v.id === docId && v.patientId === currentUser.id);
    if (item) {
      item.sharedConsent = [];
      Store.saveVault(vault);
      this.renderPatientDashboard();
      alert('Consent access revoked. Clinicians can no longer view this file.');
    }
  },

  // 3. RECEPTIONIST WORKFLOWS
  renderReceptionistDashboard() {
    const currentUser = Store.getCurrentUser();
    const clinicId = currentUser.clinicId;

    const appointments = Store.getAppointments().filter(a => a.clinicId === clinicId);
    const pending = appointments.filter(a => a.status === 'Pending');

    document.getElementById('badge-pending-count').textContent = `${pending.length} Pending`;

    const pendingBody = document.getElementById('table-receptionist-requests');
    pendingBody.innerHTML = pending.length === 0 ? `<tr><td colspan="6" class="p-4 text-center text-slate-500">No pending appointment requests.</td></tr>` :
      pending.map(p => `
        <tr class="hover:bg-slate-50">
          <td class="p-3 font-semibold text-slate-900">${p.patientName}</td>
          <td class="p-3 text-slate-600">${p.clinicName}</td>
          <td class="p-3 text-slate-600">${p.doctorName ? `<strong class="text-blue-600">${p.doctorName}</strong>` : '<span class="text-slate-400 italic">Receptionist Triage (Symptom: ' + p.symptoms + ')</span>'}</td>
          <td class="p-3 font-mono text-slate-600">${p.windowRequested}</td>
          <td class="p-3"><span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">Pending</span></td>
          <td class="p-3 text-right space-x-2">
            <button onclick="app.openReviewScheduleModal('${p.id}')" class="px-3 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 text-xs">Schedule</button>
            <button onclick="app.cancelAppointment('${p.id}')" class="px-2.5 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold">Cancel</button>
          </td>
        </tr>
      `).join('');

    // Doctor Availability Grid
    const users = Store.getUsers();
    const doctors = users.filter(u => u.role === 'doctor' && u.clinicId === clinicId);
    const slots = Store.getSlots();

    const doctorsGrid = document.getElementById('receptionist-doctors-grid');
    doctorsGrid.innerHTML = doctors.length === 0 ? `<p class="text-slate-500">No doctors onboarded to this clinic facility yet.</p>` :
      doctors.map(d => {
        const docSlots = slots.filter(s => s.doctorId === d.id);
        const freeSlots = docSlots.filter(s => !s.isBooked);
        return `
          <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-900">${d.name}</span>
              <span class="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">${freeSlots.length} Free Slots</span>
            </div>
            <div class="flex flex-wrap gap-1.5 mt-2">
              ${docSlots.length === 0 ? '<span class="text-xs text-slate-400">No slots defined</span>' :
                docSlots.map(s => `
                  <span class="px-2 py-1 rounded text-xs font-mono font-medium ${s.isBooked ? 'bg-slate-200 text-slate-500 line-through' : 'bg-emerald-100 text-emerald-800'}">${s.time}</span>
                `).join('')}
            </div>
          </div>
        `;
      }).join('');
  },

  openReviewScheduleModal(reqId) {
    const appointments = Store.getAppointments();
    const req = appointments.find(a => a.id === reqId);
    if (!req) return;

    document.getElementById('sch-req-id').value = reqId;
    document.getElementById('sch-patient-name').textContent = req.patientName;
    document.getElementById('sch-requested-window').textContent = req.windowRequested;
    document.getElementById('sch-symptoms').textContent = req.symptoms;

    const currentUser = Store.getCurrentUser();
    const users = Store.getUsers();
    const doctors = users.filter(u => u.role === 'doctor' && u.clinicId === currentUser.clinicId);

    const docSelect = document.getElementById('sch-doctor-id');
    docSelect.innerHTML = doctors.map(d => `<option value="${d.id}" ${req.doctorId === d.id ? 'selected' : ''}>${d.name}</option>`).join('');

    this.renderDoctorFreeSlotsInScheduleModal();
    this.openModal('modal-review-schedule');
  },

  renderDoctorFreeSlotsInScheduleModal() {
    const docId = document.getElementById('sch-doctor-id').value;
    const slots = Store.getSlots().filter(s => s.doctorId === docId && !s.isBooked);

    const slotSelect = document.getElementById('sch-time-slot');
    if (slots.length === 0) {
      slotSelect.innerHTML = `<option value="">No free slots available for this doctor</option>`;
    } else {
      slotSelect.innerHTML = slots.map(s => `<option value="${s.time}">${s.time}</option>`).join('');
    }
  },

  handleReceptionistSchedule(e) {
    e.preventDefault();
    const reqId = document.getElementById('sch-req-id').value;
    const doctorId = document.getElementById('sch-doctor-id').value;
    const timeSlot = document.getElementById('sch-time-slot').value;

    if (!timeSlot) {
      alert('Please select a valid free time slot.');
      return;
    }

    const users = Store.getUsers();
    const doctor = users.find(u => u.id === doctorId);

    const appointments = Store.getAppointments();
    const req = appointments.find(a => a.id === reqId);

    if (req) {
      req.doctorId = doctorId;
      req.doctorName = doctor ? doctor.name : 'Assigned Doctor';
      req.timeSlot = timeSlot;
      req.status = 'Scheduled';
      Store.saveAppointments(appointments);
    }

    // Mark slot as booked
    const slots = Store.getSlots();
    const slot = slots.find(s => s.doctorId === doctorId && s.time === timeSlot);
    if (slot) {
      slot.isBooked = true;
      Store.saveSlots(slots);
    }

    alert('Appointment scheduled successfully!');
    this.closeModal('modal-review-schedule');
    this.renderReceptionistDashboard();
  },

  cancelAppointment(appId) {
    if (confirm('Are you sure you want to cancel this appointment request?')) {
      const appointments = Store.getAppointments();
      const app = appointments.find(a => a.id === appId);
      if (app) {
        app.status = 'Cancelled';
        Store.saveAppointments(appointments);

        // Free slot if previously booked
        if (app.doctorId && app.timeSlot) {
          const slots = Store.getSlots();
          const slot = slots.find(s => s.doctorId === app.doctorId && s.time === app.timeSlot);
          if (slot) {
            slot.isBooked = false;
            Store.saveSlots(slots);
          }
        }
      }

      const currentUser = Store.getCurrentUser();
      if (currentUser.role === 'patient') this.renderPatientDashboard();
      else if (currentUser.role === 'receptionist') this.renderReceptionistDashboard();
      else if (currentUser.role === 'doctor') this.renderDoctorDashboard();
    }
  },

  // 4. DOCTOR WORKFLOWS
  renderDoctorDashboard() {
    const currentUser = Store.getCurrentUser();
    const appointments = Store.getAppointments().filter(a => a.doctorId === currentUser.id && a.status === 'Scheduled');

    const appBody = document.getElementById('table-doctor-appointments');
    appBody.innerHTML = appointments.length === 0 ? `<tr><td colspan="5" class="p-4 text-center text-slate-500">No scheduled appointments in your queue today.</td></tr>` :
      appointments.map(a => `
        <tr class="hover:bg-slate-50">
          <td class="p-3 font-mono font-bold text-blue-600">${a.timeSlot}</td>
          <td class="p-3 font-semibold text-slate-900">${a.patientName}</td>
          <td class="p-3 text-slate-600">${a.symptoms}</td>
          <td class="p-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">Confirmed</span></td>
          <td class="p-3 text-right space-x-2">
            <button onclick="app.openPatientRecordModal('${a.patientId}')" class="px-2.5 py-1 rounded bg-slate-800 text-white hover:bg-slate-900 text-xs font-semibold">Open Record</button>
            <button onclick="app.cancelAppointment('${a.id}')" class="px-2.5 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold">Cancel Visit</button>
          </td>
        </tr>
      `).join('');
  },

  handleSetAvailability(e) {
    e.preventDefault();
    const currentUser = Store.getCurrentUser();
    const start = document.getElementById('avail-start').value;
    const end = document.getElementById('avail-end').value;

    const slots = Store.getSlots().filter(s => s.doctorId !== currentUser.id);

    // Generate slots
    const newSlots = [
      { id: 's-' + Date.now() + '-1', doctorId: currentUser.id, time: `${start} AM`, isBooked: false },
      { id: 's-' + Date.now() + '-2', doctorId: currentUser.id, time: '11:00 AM', isBooked: false },
      { id: 's-' + Date.now() + '-3', doctorId: currentUser.id, time: `${end} PM`, isBooked: false }
    ];

    Store.saveSlots([...slots, ...newSlots]);

    alert('Working shift availability slots updated!');
    this.closeModal('modal-set-availability');
    this.renderDoctorDashboard();
  },

  openPatientRecordModal(patientId) {
    const users = Store.getUsers();
    const patient = users.find(u => u.id === patientId);
    const currentUser = Store.getCurrentUser();

    const vault = Store.getVault().filter(v => v.patientId === patientId && v.sharedConsent.includes(currentUser.id));
    const container = document.getElementById('patient-record-content');

    container.innerHTML = `
      <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
        <div class="text-sm font-bold text-slate-900">${patient ? patient.name : 'Patient Record'}</div>
        <div class="text-slate-600">Email: ${patient ? patient.email : 'N/A'}</div>
      </div>

      <div class="space-y-2">
        <h4 class="font-bold text-slate-900">Consented Vault Documents (${vault.length} Shared)</h4>
        ${vault.length === 0 ? `
          <div class="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
            No vault documents shared by patient yet. You can issue a document request below.
          </div>
        ` : `
          <div class="space-y-1.5">
            ${vault.map(v => `
              <div class="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div class="font-semibold text-slate-900">${v.title}</div>
                  <div class="text-slate-500 text-[11px]">${v.category} • Uploaded ${v.uploadDate}</div>
                </div>
                <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold">Consented</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Doctor Document Request Form -->
      <div class="pt-4 border-t border-slate-200">
        <h4 class="font-bold text-slate-900 mb-2">Request Patient Documents</h4>
        <form onsubmit="app.handleIssueDocRequest(event, '${patientId}')" class="space-y-2">
          <textarea id="doc-req-msg" required rows="2" placeholder="e.g. Please share recent cardiology ECG traces or lipid panels from the past 6 months..." class="w-full rounded-lg border-slate-300 text-xs"></textarea>
          <button type="submit" class="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700">Dispatch Document Request</button>
        </form>
      </div>
    `;

    this.openModal('modal-patient-record');
  },

  handleIssueDocRequest(e, patientId) {
    e.preventDefault();
    const currentUser = Store.getCurrentUser();
    const msg = document.getElementById('doc-req-msg').value.trim();

    const docRequests = Store.getDocRequests();
    docRequests.push({
      id: 'req-' + Date.now(),
      doctorId: currentUser.id,
      doctorName: currentUser.name,
      patientId,
      message: msg,
      status: 'Pending'
    });
    Store.saveDocRequests(docRequests);

    alert('Document request dispatched to patient notification queue!');
    this.closeModal('modal-patient-record');
  }
};

window.addEventListener('DOMContentLoaded', () => {
  app.init();
});
