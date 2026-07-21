import api from './client';

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }),

  register: (data: {
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    role: string;
    madrasah: number;
  }) => api.post('/auth/register/', data),

  refreshToken: (refresh: string) =>
    api.post('/auth/refresh-token/', { refresh }),

  getMe: () => api.get('/auth/me/'),

  forgotPassword: (email: string) =>
    api.post('/auth/password-reset/', { email }),

  resetPassword: (uidb64: string, token: string, new_password: string) =>
    api.post('/auth/password-reset/confirm/', { uidb64, token, new_password }),

  changePassword: (old_password: string, new_password: string) =>
    api.post('/auth/change-password/', { old_password, new_password }),

  requestVerifyEmail: (email: string) =>
    api.post('/auth/verify-email/', { email }),

  verifyEmailConfirm: (uidb64: string, token: string) =>
    api.post('/auth/verify-email/confirm/', { uidb64, token }),
};

export const subjectAPI = {
  list: () => api.get('/curriculum/'),
  get: (id: number | string) => api.get(`/curriculum/${id}/`),
  create: (data: any) => api.post('/curriculum/', data),
  update: (id: number | string, data: any) => api.put(`/curriculum/${id}/`, data),
  delete: (id: number | string) => api.delete(`/curriculum/${id}/`),
  getTopics: (subjectId: number | string) => api.get(`/curriculum/${subjectId}/topics/`),
  createTopic: (subjectId: number | string, data: any) =>
    api.post(`/curriculum/${subjectId}/topics/`, data),
};

export const schoolClassAPI = {
  list: () => api.get('/curriculum/classes/'),
};

export const questionAPI = {
  list: (params?: any) => api.get('/assessments/questions/', { params }),
  get: (id: number) => api.get(`/assessments/questions/${id}/`),
  create: (data: any) => api.post('/assessments/questions/', data),
  update: (id: number, data: any) => api.put(`/assessments/questions/${id}/`, data),
  delete: (id: number) => api.delete(`/assessments/questions/${id}/`),
  bulkUpload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/assessments/questions/bulk-upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const quizAPI = {
  list: (params?: any) => api.get('/assessments/quizzes/', { params }),
  get: (id: number) => api.get(`/assessments/quizzes/${id}/`),
  create: (data: any) => api.post('/assessments/quizzes/', data),
  update: (id: number, data: any) => api.put(`/assessments/quizzes/${id}/`, data),
  delete: (id: number) => api.delete(`/assessments/quizzes/${id}/`),
  publish: (id: number) => api.post(`/assessments/quizzes/${id}/publish/`),
  analytics: (id: number) => api.get(`/assessments/quizzes/${id}/analytics/`),
};

export const attemptAPI = {
  start: (quizId: number) => api.post('/assessments/quiz-attempts/', { quiz: quizId }),
  submit: (attemptId: number, answers: Record<string, string>) =>
    api.put(`/assessments/quiz-attempts/${attemptId}/submit/`, { answers }),
  get: (attemptId: number) => api.get(`/assessments/quiz-attempts/${attemptId}/`),
  myAttempts: () => api.get('/assessments/my-attempts/'),
};

export const examAPI = {
  list: (params?: any) => api.get('/results/exams/', { params }),
  get: (id: number) => api.get(`/results/exams/${id}/`),
  create: (data: any) => api.post('/results/exams/', data),
  update: (id: number, data: any) => api.put(`/results/exams/${id}/`, data),
  delete: (id: number) => api.delete(`/results/exams/${id}/`),
  getResults: (examId: number) => api.get(`/results/exams/${examId}/results/`),
  recordResult: (examId: number, data: any) =>
    api.post(`/results/exams/${examId}/results/`, data),
  bulkUpload: (examId: number, results: any[]) =>
    api.post(`/results/exams/${examId}/results/bulk/`, { results }),
  myResults: () => api.get('/results/my-exams/'),
};

export const resultsAPI = {
  teacher: {
    subjects: () => api.get('/results/teacher/subjects/'),
    terms: () => api.get('/results/teacher/terms/'),
    components: (params?: any) => api.get('/results/components/', { params }),
    generateComponents: (data: any) => api.post('/results/components/generate/', data),
    createComponent: (data: any) => api.post('/results/components/', data),
    updateComponent: (id: number, data: any) => api.put(`/results/components/${id}/`, data),
    deleteComponent: (id: number) => api.delete(`/results/components/${id}/`),
    scores: (params?: any) => api.get('/results/scores/', { params }),
    bulkScores: (componentId: number, data: any) => api.post(`/results/scores/bulk/${componentId}/`, data),
    submit: (data: any) => api.post('/results/teacher/submit/', data),
  },
  admin: {
    templates: (params?: any) => api.get('/results/templates/', { params }),
    createTemplate: (data: any) => api.post('/results/templates/', data),
    getTemplate: (id: number) => api.get(`/results/templates/${id}/`),
    updateTemplate: (id: number, data: any) => api.put(`/results/templates/${id}/`, data),
    deleteTemplate: (id: number) => api.delete(`/results/templates/${id}/`),
    saveTemplateItems: (templateId: number, data: any) => api.post(`/results/templates/${templateId}/items/`, data),
    pending: (params?: any) => api.get('/results/admin/pending/', { params }),
    publish: (data: any) => api.post('/results/admin/publish/', data),
  },
  student: {
    myResults: (params?: any) => api.get('/results/my-results/', { params }),
  },
  parent: {
    childResults: (params?: any) => api.get('/results/child-results/', { params }),
  },
};

export const enrollmentAPI = {
  list: (params?: any) => api.get('/enrollments/', { params }),
  create: (data: any) => api.post('/enrollments/', data),
  myEnrollments: () => api.get('/enrollments/my/'),
  teacherStudents: () => api.get('/enrollments/teacher/students/'),
  teacherClasses: () => api.get('/enrollments/teacher/classes/'),
};

export const dashboardAPI = {
  student: () => api.get('/dashboard/student/'),
  studentProgress: () => api.get('/assessments/progress/'),
  teacher: () => api.get('/dashboard/teacher/'),
  teacherStudentPerformance: (studentId: number) =>
    api.get(`/dashboard/teacher/student/${studentId}/performance/`),
  parent: () => api.get('/dashboard/parent/'),
  admin: () => api.get('/dashboard/admin/'),
  board: () => api.get('/dashboard/board/'),
};

export const userAPI = {
  list: (params?: any) => api.get('/users/', { params }),
  get: (id: number) => api.get(`/users/${id}/`),
  create: (data: any) => api.post('/auth/register/', data),
  update: (id: number, data: any) => api.put(`/users/${id}/`, data),
  delete: (id: number) => api.delete(`/users/${id}/`),
  bulkImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/bulk-import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const messageAPI = {
  list: (params?: any) => api.get('/users/messages/', { params }),
  get: (id: number) => api.get(`/users/messages/${id}/`),
  create: (data: any) => api.post('/users/messages/', data),
  unreadCount: () => api.get('/users/messages/unread-count/'),
  parentStudents: () => api.get('/users/parent-students/'),
  teacherParents: () => api.get('/users/teacher-parents/'),
};

export const interventionAPI = {
  alerts: () => api.get('/users/intervention-alerts/'),
  engagement: () => api.get('/users/admin-engagement/'),
};

export const schoolAPI = {
  studentReport: (studentId: number) => api.get(`/school/reports/student/${studentId}/`),
};

export const feeStructureAPI = {
  list: () => api.get('/school/fee-structures/'),
  create: (data: any) => api.post('/school/fee-structures/', data),
};

export const feeAPI = {
  list: (params?: any) => api.get('/school/fees/', { params }),
  create: (data: any) => api.post('/school/fees/', data),
  update: (id: number, data: any) => api.put(`/school/fees/${id}/`, data),
  delete: (id: number) => api.delete(`/school/fees/${id}/`),
  bulkCreate: (data: any) => api.post('/school/fees/bulk-create/', data),
  pay: (feeId: number, data: any) => api.post(`/school/fees/${feeId}/pay/`, data),
  analytics: () => api.get('/school/fees/analytics/'),
};

export const attendanceAPI = {
  list: (params?: any) => api.get('/school/attendance/', { params }),
  bulk: (data: { date: string; records: any[] }) => api.post('/school/attendance/bulk/', data),
  analytics: () => api.get('/school/attendance/analytics/'),
  qrClass: (classId: number) => api.get(`/school/attendance/qr/class/${classId}/`),
  qrStudent: (studentId: number) => api.get(`/school/attendance/qr/student/${studentId}/`),
  scan: (data: { qr_data?: string; student_identifier?: string; scanner_location?: string }) =>
    api.post('/school/attendance/scan/', data),
  scans: (params?: any) => api.get('/school/attendance/scans/', { params }),
};

export const announcementAPI = {
  list: () => api.get('/school/announcements/'),
  create: (data: any) => api.post('/school/announcements/', data),
  delete: (id: number) => api.delete(`/school/announcements/${id}/`),
};

export const notificationAPI = {
  list: (params?: any) => api.get('/school/notifications/', { params }),
  unreadCount: () => api.get('/school/notifications/unread-count/'),
  markRead: (id: number) => api.post(`/school/notifications/mark-read/${id}/`),
  markAllRead: () => api.post('/school/notifications/mark-all-read/'),
};

export const academicAPI = {
  sessions: {
    list: (params?: any) => api.get('/academic/sessions/', { params }),
    create: (data: any) => api.post('/academic/sessions/', data),
    update: (id: number, data: any) => api.put(`/academic/sessions/${id}/`, data),
    delete: (id: number) => api.delete(`/academic/sessions/${id}/`),
  },
  terms: {
    list: (params?: any) => api.get('/academic/terms/', { params }),
    create: (data: any) => api.post('/academic/terms/', data),
    update: (id: number, data: any) => api.put(`/academic/terms/${id}/`, data),
    delete: (id: number) => api.delete(`/academic/terms/${id}/`),
  },
  calendarEvents: {
    list: (params?: any) => api.get('/academic/calendar-events/', { params }),
    create: (data: any) => api.post('/academic/calendar-events/', data),
    update: (id: number, data: any) => api.put(`/academic/calendar-events/${id}/`, data),
    delete: (id: number) => api.delete(`/academic/calendar-events/${id}/`),
  },
  classArms: {
    list: (params?: any) => api.get('/academic/class-arms/', { params }),
    create: (data: any) => api.post('/academic/class-arms/', data),
  },
  timetables: {
    list: (params?: any) => api.get('/academic/timetables/', { params }),
    get: (id: number) => api.get(`/academic/timetables/${id}/`),
    create: (data: any) => api.post('/academic/timetables/', data),
    update: (id: number, data: any) => api.put(`/academic/timetables/${id}/`, data),
    delete: (id: number) => api.delete(`/academic/timetables/${id}/`),
    generate: (id: number) => api.post(`/academic/timetables/${id}/generate/`),
    slots: (id: number) => api.get(`/academic/timetables/${id}/slots/`),
    bulkSlots: (id: number, data: any) => api.put(`/academic/timetables/${id}/bulk/`, data),
    detectConflicts: (id: number) => api.get(`/academic/timetables/${id}/detect_conflicts/`),
  },
  timetableSlots: {
    list: (params?: any) => api.get('/academic/timetable-slots/', { params }),
    create: (data: any) => api.post('/academic/timetable-slots/', data),
    update: (id: number, data: any) => api.put(`/academic/timetable-slots/${id}/`, data),
    delete: (id: number) => api.delete(`/academic/timetable-slots/${id}/`),
  },
  studentTimetable: () => api.get('/academic/student/timetable/'),
  teacherTimetable: () => api.get('/academic/teacher/timetable/'),
  studentCalendarEvents: () => api.get('/academic/student/calendar-events/'),
};

export const admissionsAPI = {
  list: (params?: any) => api.get('/admissions/applications/', { params }),
  get: (id: number) => api.get(`/admissions/applications/${id}/`),
  create: (data: any) => api.post('/admissions/applications/', data),
  update: (id: number, data: any) => api.put(`/admissions/applications/${id}/`, data),
  accept: (id: number) => api.post(`/admissions/applications/${id}/accept/`),
  reject: (id: number, data: any) => api.post(`/admissions/applications/${id}/reject/`, data),
  enroll: (id: number) => api.post(`/admissions/applications/${id}/enroll/`),
  documents: (id: number) => api.get(`/admissions/applications/${id}/documents/`),
  uploadDocument: (id: number, data: FormData) => api.post(`/admissions/applications/${id}/documents/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteDocument: (id: number, docId: number) => api.delete(`/admissions/applications/${id}/documents/${docId}/`),
};

export const lessonAPI = {
  lessonPlans: {
    list: (params?: any) => api.get('/lessons/lesson-plans/', { params }),
    get: (id: number) => api.get(`/lessons/lesson-plans/${id}/`),
    create: (data: any) => api.post('/lessons/lesson-plans/', data),
    update: (id: number, data: any) => api.put(`/lessons/lesson-plans/${id}/`, data),
    delete: (id: number) => api.delete(`/lessons/lesson-plans/${id}/`),
    approve: (id: number, data: any) => api.patch(`/lessons/lesson-plans/${id}/approve/`, data),
  },
  homework: {
    list: (params?: any) => api.get('/lessons/homework/', { params }),
    get: (id: number) => api.get(`/lessons/homework/${id}/`),
    create: (data: any) => {
      if (data instanceof FormData) {
        return api.post('/lessons/homework/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      return api.post('/lessons/homework/', data);
    },
    update: (id: number, data: any) => {
      if (data instanceof FormData) {
        return api.put(`/lessons/homework/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      return api.put(`/lessons/homework/${id}/`, data);
    },
    delete: (id: number) => api.delete(`/lessons/homework/${id}/`),
    submissions: (id: number) => api.get(`/lessons/homework/${id}/submissions/`),
    submit: (id: number, data: any) => {
      if (data instanceof FormData) {
        return api.post(`/lessons/homework/${id}/submissions/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      return api.post(`/lessons/homework/${id}/submissions/`, data);
    },
    pendingGrading: () => api.get('/lessons/homework/submissions/pending/'),
    grade: (submissionId: number, data: any) => api.patch(`/lessons/homework/submissions/${submissionId}/grade/`, data),
  },
};

export const quranAPI = {
  memorization: {
    list: (params?: any) => api.get('/quran/memorization/', { params }),
    create: (data: any) => api.post('/quran/memorization/', data),
    update: (id: number, data: any) => api.put(`/quran/memorization/${id}/`, data),
    delete: (id: number) => api.delete(`/quran/memorization/${id}/`),
  },
  revision: {
    list: (params?: any) => api.get('/quran/revision/', { params }),
    create: (data: any) => api.post('/quran/revision/', data),
    markComplete: (id: number) => api.patch(`/quran/revision/mark-complete/${id}/`),
  },
  tajwid: {
    list: (params?: any) => api.get('/quran/tajwid/', { params }),
    create: (data: any) => api.post('/quran/tajwid/', data),
  },
  prayerTimes: {
    list: (params?: any) => api.get('/quran/prayer-times/', { params }),
    create: (data: any) => api.post('/quran/prayer-times/', data),
    today: () => api.get('/quran/prayer-times/today/'),
  },
  studentProgress: (studentId: number) => api.get(`/quran/student-progress/${studentId}/`),
};

export const analyticsAPI = {
  atRisk: {
    list: (params?: any) => api.get('/analytics/at-risk/', { params }),
    get: (id: number) => api.get(`/analytics/at-risk/${id}/`),
    generate: () => api.post('/analytics/at-risk/generate/'),
  },
  skills: {
    list: (params?: any) => api.get('/analytics/skills/', { params }),
    create: (data: any) => api.post('/analytics/skills/', data),
    update: (id: number, data: any) => api.put(`/analytics/skills/${id}/`, data),
    delete: (id: number) => api.delete(`/analytics/skills/${id}/`),
  },
  portfolio: {
    list: (params?: any) => api.get('/analytics/portfolio/', { params }),
    create: (data: any) => api.post('/analytics/portfolio/', data),
    update: (id: number, data: any) => api.put(`/analytics/portfolio/${id}/`, data),
    delete: (id: number) => api.delete(`/analytics/portfolio/${id}/`),
  },
  teacherWorkload: {
    all: () => api.get('/analytics/teacher-workload/'),
    me: () => api.get('/analytics/teacher-workload/me/'),
  },
  adminDashboard: () => api.get('/analytics/dashboard/admin/'),
};

export const questionGeneratorAPI = {
  generate: (data: any) => api.post('/assessments/generate-questions/', data),
};

export const learningAPI = {
  paths: {
    list: (params?: any) => api.get('/learning/paths/', { params }),
    get: (id: number) => api.get(`/learning/paths/${id}/`),
    generate: (data: any) => api.post('/learning/paths/generate/', data),
    completeItem: (pathId: number, itemId: number, data?: any) =>
      api.patch(`/learning/paths/${pathId}/items/${itemId}/complete/`, data),
  },
  decks: {
    list: (params?: any) => api.get('/learning/decks/', { params }),
    create: (data: any) => api.post('/learning/decks/', data),
    update: (id: number, data: any) => api.put(`/learning/decks/${id}/`, data),
    delete: (id: number) => api.delete(`/learning/decks/${id}/`),
    cards: (deckId: number) => api.get(`/learning/decks/${deckId}/cards/`),
    addCard: (deckId: number, data: any) => api.post(`/learning/decks/${deckId}/cards/`, data),
    updateCard: (deckId: number, cardId: number, data: any) =>
      api.put(`/learning/decks/${deckId}/cards/${cardId}/`, data),
    deleteCard: (deckId: number, cardId: number) =>
      api.delete(`/learning/decks/${deckId}/cards/${cardId}/`),
    reviewCard: (deckId: number, cardId: number, data: any) =>
      api.post(`/learning/decks/${deckId}/cards/review/${cardId}/`, data),
    dueCards: (deckId: number) => api.get(`/learning/decks/${deckId}/cards/due/`),
  },
};

export const guidanceAPI = {
  career: {
    generate: (studentId: number) => api.post('/guidance/career/generate/', { student_id: studentId }),
    list: (params?: any) => api.get('/guidance/career/', { params }),
  },
  tutor: {
    ask: (data: { question: string; subject_id?: number; session_id?: string; files?: File[] }) => {
      if (data.files && data.files.length > 0) {
        const fd = new FormData();
        fd.append('question', data.question);
        if (data.subject_id) fd.append('subject_id', String(data.subject_id));
        if (data.session_id) fd.append('session_id', data.session_id);
        data.files.forEach((f, i) => fd.append(`file_${i}`, f));
        return api.post('/guidance/tutor/ask/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      return api.post('/guidance/tutor/ask/', data);
    },
    history: () => api.get('/guidance/tutor/history/'),
    clearHistory: () => api.delete('/guidance/tutor/history/'),
    transcribe: (fd: FormData) => api.post('/guidance/transcribe/', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  },
};

export const characterAPI = {
  traits: {
    list: (params?: any) => api.get('/character/traits/', { params }),
    create: (data: any) => api.post('/character/traits/', data),
    update: (id: number, data: any) => api.put(`/character/traits/${id}/`, data),
    delete: (id: number) => api.delete(`/character/traits/${id}/`),
  },
  evaluations: {
    list: (params?: any) => api.get('/character/evaluations/', { params }),
    get: (id: number) => api.get(`/character/evaluations/${id}/`),
    create: (data: any) => api.post('/character/evaluations/', data),
    update: (id: number, data: any) => api.put(`/character/evaluations/${id}/`, data),
    delete: (id: number) => api.delete(`/character/evaluations/${id}/`),
    summary: (params?: any) => api.get('/character/evaluations/summary/', { params }),
  },
};

export const whatsappAPI = {
  recipients: {
    list: (params?: any) => api.get('/whatsapp/recipients/', { params }),
    optIn: (data: { parent_id: number; phone_number: string; language?: string }) =>
      api.post('/whatsapp/recipients/opt_in/', data),
    optOut: (recipientId: number) =>
      api.post(`/whatsapp/recipients/${recipientId}/opt_out/`),
  },
  templates: {
    list: (params?: any) => api.get('/whatsapp/templates/', { params }),
    create: (data: any) => api.post('/whatsapp/templates/', data),
    update: (id: number, data: any) => api.put(`/whatsapp/templates/${id}/`, data),
    delete: (id: number) => api.delete(`/whatsapp/templates/${id}/`),
  },
  messages: {
    list: (params?: any) => api.get('/whatsapp/messages/', { params }),
  },
  send: (data: any) => api.post('/whatsapp/send/', data),
};

export const certificateAPI = {
  list: (params?: any) => api.get('/certificates/', { params }),
  get: (id: string) => api.get(`/certificates/${id}/`),
  generate: (data: any) => api.post('/certificates/generate/', data),
  download: (id: string) => api.get(`/certificates/${id}/download/`, { responseType: 'blob' }),
};
