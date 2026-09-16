/**
 * MediBridge Client-Side LocalStorage Data Store & Seed Logic
 */

const STORAGE_KEYS = {
  USERS: 'medibridge_users',
  CLINICS: 'medibridge_clinics',
  APPOINTMENTS: 'medibridge_appointments',
  SLOTS: 'medibridge_slots',
  VAULT: 'medibridge_vault',
  DOC_REQUESTS: 'medibridge_doc_requests',
  CURRENT_USER: 'medibridge_current_user'
};

// SHA-256 Helper using Web Crypto API
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const Store = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.CLINICS)) {
      this.seedData();
    }
  },

  seedData() {
    const initialClinics = [
      {
        id: 'cln-1',
        name: 'St. Jude Regional Hospital',
        specialty: 'Cardiology & Emergency Triage',
        code: 'STJ-8821',
        email: 'admin@stjude.org',
        phone: '+1 (555) 019-2831',
        capacity: '150 Patients / Day'
      },
      {
        id: 'cln-2',
        name: 'Apex Health Center',
        specialty: 'Orthopedics & Family Care',
        code: 'APX-4412',
        email: 'contact@apexhealth.org',
        phone: '+1 (555) 018-9920',
        capacity: '80 Patients / Day'
      }
    ];

    const initialUsers = [
      {
        id: 'usr-admin',
        role: 'admin',
        name: 'Regional Operations Director',
        email: 'admin@medibridge.org',
        password: 'Password123!',
        securityQuestionsSet: true,
        securityQuestions: [
          { question: 'In what city were you born?', answerHash: '01869e06a3e5c9b60677c73a0e695b116d97c36a287236e78ec3394c8b6b1076' }, // 'chicago'
          { question: 'What was the make of your first vehicle?', answerHash: 'ff617d1e8d91c28c6883f3e82d8c36ec3b9070a2412e0220c42289668efb3e70' }, // 'ford'
          { question: 'What is the name of your favorite pet?', answerHash: '72e01f0161491763e00cf05b5c90b8f415039f939798544d6e902b4d960953a9' } // 'buddy'
        ]
      },
      {
        id: 'usr-doc1',
        role: 'doctor',
        clinicId: 'cln-1',
        clinicCode: 'STJ-8821',
        name: 'Dr. Sarah Jenkins',
        email: 'dr.smith@stjude.org',
        password: 'Password123!',
        securityQuestionsSet: true,
        securityQuestions: [
          { question: 'In what city were you born?', answerHash: '01869e06a3e5c9b60677c73a0e695b116d97c36a287236e78ec3394c8b6b1076' },
          { question: 'What was the make of your first vehicle?', answerHash: 'ff617d1e8d91c28c6883f3e82d8c36ec3b9070a2412e0220c42289668efb3e70' },
          { question: 'What is the name of your favorite pet?', answerHash: '72e01f0161491763e00cf05b5c90b8f415039f939798544d6e902b4d960953a9' }
        ]
      },
      {
        id: 'usr-rec1',
        role: 'receptionist',
        clinicId: 'cln-1',
        clinicCode: 'STJ-8821',
        name: 'Elena Vance',
        email: 'desk@stjude.org',
        password: 'Password123!',
        securityQuestionsSet: true,
        securityQuestions: [
          { question: 'In what city were you born?', answerHash: '01869e06a3e5c9b60677c73a0e695b116d97c36a287236e78ec3394c8b6b1076' },
          { question: 'What was the make of your first vehicle?', answerHash: 'ff617d1e8d91c28c6883f3e82d8c36ec3b9070a2412e0220c42289668efb3e70' },
          { question: 'What is the name of your favorite pet?', answerHash: '72e01f0161491763e00cf05b5c90b8f415039f939798544d6e902b4d960953a9' }
        ]
      },
      {
        id: 'usr-pat1',
        role: 'patient',
        name: 'Marcus Chen',
        email: 'marcus.chen@example.com',
        password: 'Password123!',
        securityQuestionsSet: true,
        securityQuestions: [
          { question: 'In what city were you born?', answerHash: '01869e06a3e5c9b60677c73a0e695b116d97c36a287236e78ec3394c8b6b1076' },
          { question: 'What was the make of your first vehicle?', answerHash: 'ff617d1e8d91c28c6883f3e82d8c36ec3b9070a2412e0220c42289668efb3e70' },
          { question: 'What is the name of your favorite pet?', answerHash: '72e01f0161491763e00cf05b5c90b8f415039f939798544d6e902b4d960953a9' }
        ]
      }
    ];

    const initialSlots = [
      { id: 's-1', doctorId: 'usr-doc1', time: '09:00 AM', isBooked: false },
      { id: 's-2', doctorId: 'usr-doc1', time: '10:00 AM', isBooked: false },
      { id: 's-3', doctorId: 'usr-doc1', time: '11:30 AM', isBooked: false },
      { id: 's-4', doctorId: 'usr-doc1', time: '02:00 PM', isBooked: false },
      { id: 's-5', doctorId: 'usr-doc1', time: '03:30 PM', isBooked: false }
    ];

    const initialAppointments = [
      {
        id: 'app-1',
        patientId: 'usr-pat1',
        patientName: 'Marcus Chen',
        clinicId: 'cln-1',
        clinicName: 'St. Jude Regional Hospital',
        doctorId: 'usr-doc1',
        doctorName: 'Dr. Sarah Jenkins',
        timeSlot: '09:00 AM',
        windowRequested: 'Tomorrow Morning',
        symptoms: 'Post-op cardiology consultation and ECG review.',
        status: 'Scheduled'
      }
    ];

    const initialVault = [
      {
        id: 'doc-1',
        patientId: 'usr-pat1',
        title: '6-Month ECG Traces & Cardiology Summary',
        category: 'Diagnostic Imaging / ECG',
        uploadDate: '2025-02-10',
        sharedConsent: ['usr-doc1']
      },
      {
        id: 'doc-2',
        patientId: 'usr-pat1',
        title: 'Full Lipid Panel & Metabolic Results',
        category: 'Lab Report',
        uploadDate: '2025-01-15',
        sharedConsent: []
      }
    ];

    const initialDocRequests = [];

    localStorage.setItem(STORAGE_KEYS.CLINICS, JSON.stringify(initialClinics));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
    localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(initialSlots));
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(initialAppointments));
    localStorage.setItem(STORAGE_KEYS.VAULT, JSON.stringify(initialVault));
    localStorage.setItem(STORAGE_KEYS.DOC_REQUESTS, JSON.stringify(initialDocRequests));
  },

  getClinics() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLINICS) || '[]');
  },

  saveClinics(clinics) {
    localStorage.setItem(STORAGE_KEYS.CLINICS, JSON.stringify(clinics));
  },

  getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  },

  saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getAppointments() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS) || '[]');
  },

  saveAppointments(appointments) {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  },

  getSlots() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SLOTS) || '[]');
  },

  saveSlots(slots) {
    localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
  },

  getVault() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.VAULT) || '[]');
  },

  saveVault(vault) {
    localStorage.setItem(STORAGE_KEYS.VAULT, JSON.stringify(vault));
  },

  getDocRequests() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DOC_REQUESTS) || '[]');
  },

  saveDocRequests(requests) {
    localStorage.setItem(STORAGE_KEYS.DOC_REQUESTS, JSON.stringify(requests));
  },

  getCurrentUser() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
  },

  setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }
};

Store.init();
