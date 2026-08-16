import api from './client';
import type { PaginatedData } from './client';
import type * as T from '../types';

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password } as T.LoginPayload),

  register: (data: T.RegisterPayload) => api.post('/auth/register/', data),

  refreshToken: (refresh: string) =>
    api.post('/auth/refresh-token/', { refresh }),

  getMe: () => api.get<T.User>('/auth/me/'),

  updateProfile: (data: T.UpdateProfilePayload) => api.patch('/auth/me/', data),

  forgotPassword: (email: string) =>
    api.post('/auth/password-reset/', { email }),

  resetPassword: (uidb64: string, token: string, password: string) =>
    api.post('/auth/password-reset/confirm/', { uidb64, token, password }),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/auth/change-password/', { old_password: oldPassword, new_password: newPassword }),

  requestVerifyEmail: (email: string) =>
    api.post('/auth/verify-email/', { email }),

  verifyEmailConfirm: (uidb64: string, token: string) =>
    api.post('/auth/verify-email/confirm/', { uidb64, token }),
};

export const subjectAPI = {
  list: (params?: Record<string, unknown>) => api.get<T.Subject[]>('/curriculum/', { params }),
  get: (id: number | string) => api.get<T.Subject>(`/curriculum/${id}/`),
  create: (data: T.SubjectPayload) => api.post<T.Subject>('/curriculum/', data),
  update: (id: number | string, data: T.SubjectPayload) => api.put<T.Subject>(`/curriculum/${id}/`, data),
  delete: (id: number | string) => api.delete(`/curriculum/${id}/`),
  getTopics: (subjectId: number | string) => api.get<T.Topic[]>(`/curriculum/${subjectId}/topics/`),
  createTopic: (subjectId: number | string, data: T.TopicPayload) =>
    api.post<T.Topic>(`/curriculum/${subjectId}/topics/`, data),
};

export const schoolClassAPI = {
  list: (params?: Record<string, unknown>) => api.get<T.SchoolClass[]>('/curriculum/classes/', { params }),
  update: (id: number, data: T.SchoolClassPayload) => api.put<T.SchoolClass>(`/curriculum/classes/${id}/`, data),
};

export const classSubjectAPI = {
  list: (params?: Record<string, unknown>) => api.get<T.ClassSubject[]>('/curriculum/class-subjects/', { params }),
  create: (data: T.ClassSubjectPayload) => api.post<T.ClassSubject>('/curriculum/class-subjects/', data),
  delete: (id: number) => api.delete(`/curriculum/class-subjects/${id}/`),
};

export const questionAPI = {
  list: (params?: Record<string, unknown>) => api.get<PaginatedData<T.Question>>('/assessments/questions/', { params }),
  get: (id: number) => api.get<T.Question>(`/assessments/questions/${id}/`),
  create: (data: T.QuestionPayload) => api.post<T.Question>('/assessments/questions/', data),
  update: (id: number, data: T.QuestionPayload) => api.put<T.Question>(`/assessments/questions/${id}/`, data),
  delete: (id: number) => api.delete(`/assessments/questions/${id}/`),
  bulkUpload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/assessments/questions/bulk-upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const legacyQuizAPI = {
  list: (params?: Record<string, unknown>) => api.get<T.Quiz[]>('/assessments/quizzes/', { params }),
  get: (id: number) => api.get<T.Quiz>(`/assessments/quizzes/${id}/`),
  create: (data: T.QuizPayload) => api.post<T.Quiz>('/assessments/quizzes/', data),
  update: (id: number, data: T.QuizPayload) => api.put<T.Quiz>(`/assessments/quizzes/${id}/`, data),
  delete: (id: number) => api.delete(`/assessments/quizzes/${id}/`),
  publish: (id: number) => api.post(`/assessments/quizzes/${id}/publish/`),
  analytics: (id: number) => api.get(`/assessments/quizzes/${id}/analytics/`),
};

export const legacyAttemptAPI = {
  start: (quizId: number) => api.post('/assessments/quiz-attempts/', { quiz: quizId }),
  submit: (attemptId: number, answers: Record<string, string>) =>
    api.put(`/assessments/quiz-attempts/${attemptId}/submit/`, { answers }),
  get: (attemptId: number) => api.get<T.QuizAttempt>(`/assessments/quiz-attempts/${attemptId}/`),
  myAttempts: () => api.get<T.QuizAttempt[]>('/assessments/my-attempts/'),
};

export const examAPI = {
  list: (params?: Record<string, unknown>) => api.get<T.Exam[]>('/results/exams/', { params }),
  get: (id: number) => api.get<T.Exam>(`/results/exams/${id}/`),
  create: (data: T.ExamPayload) => api.post<T.Exam>('/results/exams/', data),
  update: (id: number, data: T.ExamPayload) => api.put<T.Exam>(`/results/exams/${id}/`, data),
  delete: (id: number) => api.delete(`/results/exams/${id}/`),
  getResults: (examId: number) => api.get<T.ExamResult[]>(`/results/exams/${examId}/results/`),
  recordResult: (examId: number, data: T.ExamResultPayload) =>
    api.post<T.ExamResult>(`/results/exams/${examId}/results/`, data),
  bulkUpload: (examId: number, results: T.ExamResultPayload[]) =>
    api.post(`/results/exams/${examId}/results/bulk/`, { results }),
  myResults: (params?: Record<string, unknown>) => api.get('/results/my-results/', { params }),
};

export const resultsAPI = {
  teacher: {
    subjects: (params?: Record<string, unknown>) => api.get<T.TeacherSubject[]>('/results/teacher/subjects/', { params }),
    terms: () => api.get<T.AcademicTerm[]>('/results/teacher/terms/'),
    components: (params?: Record<string, unknown>) => api.get<T.ResultComponent[]>('/results/components/', { params }),
    generateComponents: (data: { subject: number; term: number; school_class: number }) =>
      api.post('/results/components/generate/', data),
    createComponent: (data: T.ResultComponentPayload) => api.post<T.ResultComponent>('/results/components/', data),
    updateComponent: (id: number, data: T.ResultComponentPayload) => api.put<T.ResultComponent>(`/results/components/${id}/`, data),
    deleteComponent: (id: number) => api.delete(`/results/components/${id}/`),
    scores: (params?: Record<string, unknown>) => api.get<T.StudentResult[]>('/results/legacy-scores/', { params }),
    bulkScores: (componentId: number, data: T.BulkScorePayload) =>
      api.post(`/results/legacy-scores/bulk/${componentId}/`, data),
    submit: (data: T.ResultSubmitPayload) => api.post('/results/teacher/submit/', data),
  },
  admin: {
    templates: (params?: Record<string, unknown>) => api.get<T.ResultTemplate[]>('/results/templates/', { params }),
    createTemplate: (data: T.ResultTemplatePayload) => api.post<T.ResultTemplate>('/results/templates/', data),
    getTemplate: (id: number) => api.get<T.ResultTemplate>(`/results/templates/${id}/`),
    updateTemplate: (id: number, data: T.ResultTemplatePayload) => api.put<T.ResultTemplate>(`/results/templates/${id}/`, data),
    deleteTemplate: (id: number) => api.delete(`/results/templates/${id}/`),
    saveTemplateItems: (templateId: number, data: { items: T.ResultTemplateItemPayload[] }) =>
      api.post(`/results/templates/${templateId}/items/`, data),
    pending: (params?: Record<string, unknown>) => api.get<T.SubjectResult[]>('/results/admin/pending/', { params }),
    publish: (data: T.ResultPublishPayload) => api.post('/results/admin/publish/', data),
  },
  student: {
    myResults: (params?: Record<string, unknown>) => api.get('/results/my-results/', { params }),
  },
  parent: {
    childResults: (params?: Record<string, unknown>) => api.get('/results/child-results/', { params }),
  },
  export: {
    students: (params?: Record<string, unknown>) => api.get('/results/export/students/', { params, responseType: 'blob' }),
    subjectResults: (params?: Record<string, unknown>) => api.get('/results/export/subject-results/', { params, responseType: 'blob' }),
    termResults: (params?: Record<string, unknown>) => api.get('/results/export/term-results/', { params, responseType: 'blob' }),
  },
  reportCard: {
    pdf: (uuid: string) => api.get(`/results/report-cards/${uuid}/pdf/`, { responseType: 'blob' }),
    pdfByStudentTerm: (studentId: number, termId: number) =>
      api.get(`/results/report-cards/student/${studentId}/term/${termId}/pdf/`, { responseType: 'blob' }),
  },
};

export const enrollmentAPI = {
  list: (params?: Record<string, unknown>) => api.get<T.Enrollment[]>('/enrollments/', { params }),
  create: (data: T.EnrollmentPayload) => api.post<T.Enrollment>('/enrollments/', data),
  delete: (id: number) => api.delete(`/enrollments/${id}/`),
  myEnrollments: () => api.get<T.Enrollment[]>('/enrollments/my/'),
  teacherStudents: (params?: Record<string, unknown>) => api.get<T.Enrollment[]>('/enrollments/teacher/students/', { params }),
  teacherClasses: (params?: Record<string, unknown>) => api.get<T.Enrollment[]>('/enrollments/teacher/classes/', { params }),
  classTeacherClasses: () => api.get<T.SchoolClass[]>('/enrollments/class-teacher/classes/'),
};

export const dashboardAPI = {
  student: () => api.get<T.StudentDashboard>('/dashboard/student/'),
  studentProgress: () => api.get('/assessments/progress/'),
  teacher: () => api.get<T.TeacherDashboard>('/dashboard/teacher/'),
  teacherStudentPerformance: (studentId: number) =>
    api.get(`/dashboard/teacher/student/${studentId}/performance/`),
  parent: () => api.get<T.ParentDashboard>('/dashboard/parent/'),
  admin: () => api.get<T.AdminDashboard>('/dashboard/admin/'),
  board: () => api.get<T.BoardDashboard>('/dashboard/board/'),
};

export const userAPI = {
  list: (params?: T.UserListParams) => api.get<T.User[]>('/users/', { params }),
  get: (id: number) => api.get<T.User>(`/users/${id}/`),
  create: (data: T.UserCreatePayload) => api.post<T.User>('/users/create/', data),
  update: (id: number, data: T.UserUpdatePayload) => api.put<T.User>(`/users/${id}/`, data),
  delete: (id: number) => api.delete(`/users/${id}/`),
  approve: (id: number, data: T.UserApprovePayload) => api.post(`/users/${id}/approve/`, data),
  bulkImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/bulk-import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  export: (params?: Record<string, unknown>) => api.get('/users/export/', { params, responseType: 'blob' }),
};

export const messageAPI = {
  list: (params?: Record<string, unknown>) => api.get<T.Message[]>('/users/messages/', { params }),
  get: (id: number) => api.get<T.Message>(`/users/messages/${id}/`),
  create: (data: T.MessagePayload) => api.post<T.Message>('/users/messages/', data),
  unreadCount: () => api.get<{ unread_count: number }>('/users/messages/unread-count/'),
  parentStudents: () => api.get<T.MessageRecipient[]>('/users/parent-students/'),
  teacherParents: () => api.get<T.MessageRecipient[]>('/users/teacher-parents/'),
};

export const interventionAPI = {
  alerts: () => api.get<T.InterventionResponse>('/users/intervention-alerts/'),
  engagement: () => api.get<T.AdminEngagement>('/users/admin-engagement/'),
};

export const schoolAPI = {
  studentReport: (studentId: number) => api.get<T.StudentReportPayload>(`/school/reports/student/${studentId}/`),
};

export const feeStructureAPI = {
  list: (params?: Record<string, unknown>) => api.get<T.FeeStructure[]>('/school/fee-structures/', { params }),
  create: (data: T.FeeStructurePayload) => api.post<T.FeeStructure>('/school/fee-structures/', data),
};

export const feeAPI = {
  list: (params?: Record<string, unknown>) => api.get<T.Fee[]>('/school/fees/', { params }),
  create: (data: T.FeePayload) => api.post<T.Fee>('/school/fees/', data),
  update: (id: number, data: T.FeePayload) => api.put<T.Fee>(`/school/fees/${id}/`, data),
  delete: (id: number) => api.delete(`/school/fees/${id}/`),
  bulkCreate: (data: T.FeeBulkPayload) => api.post('/school/fees/bulk-create/', data),
  pay: (feeId: number, data: T.FeePayPayload) => api.post(`/school/fees/${feeId}/pay/`, data),
  analytics: () => api.get('/school/fees/analytics/'),
  export: (params?: Record<string, unknown>) => api.get('/school/fees/export/', { params, responseType: 'blob' }),
  exportPayments: (params?: Record<string, unknown>) => api.get('/school/fees/payments/export/', { params, responseType: 'blob' }),
};

export const attendanceAPI = {
  list: (params?: Record<string, unknown>) => api.get<T.AttendanceRecord[]>('/school/attendance/', { params }),
  bulk: (data: T.AttendanceBulkPayload) => api.post('/school/attendance/bulk/', data),
  analytics: () => api.get<T.AttendanceAnalytics>('/school/attendance/analytics/'),
  qrClass: (classId: number) => api.get<T.QRCodeResult>(`/school/attendance/qr/class/${classId}/`),
  qrStudent: (studentId: number) => api.get<T.QRCodeResult>(`/school/attendance/qr/student/${studentId}/`),
  scan: (data: T.AttendanceScanPayload) =>
    api.post<T.AttendanceScanResult>('/school/attendance/scan/', data),
  scans: (params?: Record<string, unknown>) => api.get<T.AttendanceQRScan[]>('/school/attendance/scans/', { params }),
  export: (params?: Record<string, unknown>) => api.get('/school/attendance/export/', { params, responseType: 'blob' }),
};

export const announcementAPI = {
  list: (params?: Record<string, unknown>) => api.get<T.Announcement[]>('/school/announcements/', { params }),
  create: (data: T.AnnouncementPayload) => api.post<T.Announcement>('/school/announcements/', data),
  delete: (id: number) => api.delete(`/school/announcements/${id}/`),
};

export const notificationAPI = {
  list: (params?: Record<string, unknown>) => api.get<T.AppNotification[]>('/school/notifications/', { params }),
  unreadCount: () => api.get<{ count: number }>('/school/notifications/unread-count/'),
  markRead: (id: number) => api.post(`/school/notifications/mark-read/${id}/`),
  markAllRead: () => api.post('/school/notifications/mark-all-read/'),
};

export const pushAPI = {
  vapidKey: () => api.get<T.VapidKey>('/school/push/vapid-key/'),
  subscribe: (sub: T.PushSubscriptionPayload) => api.post('/school/push/subscribe/', sub),
  unsubscribe: (endpoint: string) => api.post('/school/push/unsubscribe/', { endpoint }),
};

export const academicAPI = {
  sessions: {
    list: (params?: Record<string, unknown>) => api.get<T.AcademicSession[]>('/academic/sessions/', { params }),
    create: (data: T.AcademicSessionPayload) => api.post<T.AcademicSession>('/academic/sessions/', data),
    update: (id: number, data: T.AcademicSessionPayload) => api.put<T.AcademicSession>(`/academic/sessions/${id}/`, data),
    delete: (id: number) => api.delete(`/academic/sessions/${id}/`),
  },
  terms: {
    list: (params?: Record<string, unknown>) => api.get<T.AcademicTerm[]>('/academic/terms/', { params }),
    create: (data: T.AcademicTermPayload) => api.post<T.AcademicTerm>('/academic/terms/', data),
    update: (id: number, data: T.AcademicTermPayload) => api.put<T.AcademicTerm>(`/academic/terms/${id}/`, data),
    delete: (id: number) => api.delete(`/academic/terms/${id}/`),
  },
  calendarEvents: {
    list: (params?: Record<string, unknown>) => api.get<T.AcademicCalendarEvent[]>('/academic/calendar-events/', { params }),
    create: (data: T.AcademicCalendarEventPayload) => api.post<T.AcademicCalendarEvent>('/academic/calendar-events/', data),
    update: (id: number, data: T.AcademicCalendarEventPayload) => api.put<T.AcademicCalendarEvent>(`/academic/calendar-events/${id}/`, data),
    delete: (id: number) => api.delete(`/academic/calendar-events/${id}/`),
  },
  classArms: {
    list: (params?: Record<string, unknown>) => api.get<T.ClassArm[]>('/academic/class-arms/', { params }),
    create: (data: T.ClassArmPayload) => api.post<T.ClassArm>('/academic/class-arms/', data),
  },
  timetables: {
    list: (params?: Record<string, unknown>) => api.get<T.Timetable[]>('/academic/timetables/', { params }),
    get: (id: number) => api.get<T.TimetableDetail>(`/academic/timetables/${id}/`),
    create: (data: T.TimetablePayload) => api.post<T.Timetable>('/academic/timetables/', data),
    update: (id: number, data: T.TimetablePayload) => api.put<T.Timetable>(`/academic/timetables/${id}/`, data),
    delete: (id: number) => api.delete(`/academic/timetables/${id}/`),
    generate: (id: number) => api.post(`/academic/timetables/${id}/generate/`),
    slots: (id: number) => api.get<T.TimetableSlot[]>(`/academic/timetables/${id}/slots/`),
    bulkSlots: (id: number, data: T.TimetableBulkSlotsPayload) => api.put(`/academic/timetables/${id}/bulk/`, data),
    detectConflicts: (id: number) => api.get<T.TimetableConflictResponse>(`/academic/timetables/${id}/detect_conflicts/`),
  },
  timetableSlots: {
    list: (params?: Record<string, unknown>) => api.get<T.TimetableSlot[]>('/academic/timetable-slots/', { params }),
    create: (data: T.TimetableSlotPayload) => api.post<T.TimetableSlot>('/academic/timetable-slots/', data),
    update: (id: number, data: T.TimetableSlotPayload) => api.put<T.TimetableSlot>(`/academic/timetable-slots/${id}/`, data),
    delete: (id: number) => api.delete(`/academic/timetable-slots/${id}/`),
  },
  studentTimetable: () => api.get<T.TimetableSlot[]>('/academic/student/timetable/'),
  teacherTimetable: () => api.get<T.TimetableSlot[]>('/academic/teacher/timetable/'),
  studentCalendarEvents: () => api.get<T.StudentCalendarEvents>('/academic/student/calendar-events/'),
};

export const admissionsAPI = {
  list: (params?: Record<string, unknown>) => api.get<T.AdmissionApplicationListItem[]>('/admissions/applications/', { params }),
  get: (id: number) => api.get<T.AdmissionApplication>(`/admissions/applications/${id}/`),
  create: (data: T.AdmissionApplicationPayload) => api.post<T.AdmissionApplication>('/admissions/applications/', data),
  update: (id: number, data: T.AdmissionApplicationPayload) => api.put<T.AdmissionApplication>(`/admissions/applications/${id}/`, data),
  accept: (id: number) => api.post<T.AdmissionApplication>(`/admissions/applications/${id}/accept/`),
  reject: (id: number, data: { reason?: string }) => api.post<T.AdmissionApplication>(`/admissions/applications/${id}/reject/`, data),
  enroll: (id: number) => api.post<T.AdmissionEnrollResult>(`/admissions/applications/${id}/enroll/`),
  documents: (id: number) => api.get<T.AdmissionDocument[]>(`/admissions/applications/${id}/documents/`),
  uploadDocument: (id: number, data: FormData) => api.post(`/admissions/applications/${id}/documents/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteDocument: (id: number, docId: number) => api.delete(`/admissions/applications/${id}/documents/${docId}/`),
};

export const lessonAPI = {
  lessonPlans: {
    list: (params?: Record<string, unknown>) => api.get<T.LessonPlan[]>('/lessons/lesson-plans/', { params }),
    get: (id: number) => api.get<T.LessonPlan>(`/lessons/lesson-plans/${id}/`),
    create: (data: T.LessonPlanPayload) => api.post<T.LessonPlan>('/lessons/lesson-plans/', data),
    update: (id: number, data: T.LessonPlanPayload) => api.put<T.LessonPlan>(`/lessons/lesson-plans/${id}/`, data),
    delete: (id: number) => api.delete(`/lessons/lesson-plans/${id}/`),
    approve: (id: number, data: T.LessonPlanApprovalPayload) => api.patch(`/lessons/lesson-plans/${id}/approve/`, data),
  },
  homework: {
    list: (params?: Record<string, unknown>) => api.get<T.Homework[]>('/lessons/homework/', { params }),
    get: (id: number) => api.get<T.Homework>(`/lessons/homework/${id}/`),
    create: (data: T.HomeworkPayload | FormData) => {
      if (data instanceof FormData) {
        return api.post<T.Homework>('/lessons/homework/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      return api.post<T.Homework>('/lessons/homework/', data);
    },
    update: (id: number, data: T.HomeworkPayload | FormData) => {
      if (data instanceof FormData) {
        return api.put<T.Homework>(`/lessons/homework/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      return api.put<T.Homework>(`/lessons/homework/${id}/`, data);
    },
    delete: (id: number) => api.delete(`/lessons/homework/${id}/`),
    submissions: (id: number) => api.get<T.HomeworkSubmission[]>(`/lessons/homework/${id}/submissions/`),
    submit: (id: number, data: T.HomeworkSubmitPayload | FormData) => {
      if (data instanceof FormData) {
        return api.post(`/lessons/homework/${id}/submissions/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      return api.post(`/lessons/homework/${id}/submissions/`, data);
    },
    pendingGrading: () => api.get<T.HomeworkSubmission[]>('/lessons/homework/submissions/pending/'),
    grade: (submissionId: number, data: T.HomeworkGradePayload) => api.patch(`/lessons/homework/submissions/${submissionId}/grade/`, data),
  },
};

export const quranAPI = {
  memorization: {
    list: (params?: Record<string, unknown>) => api.get<T.QuranMemorization[]>('/quran/memorization/', { params }),
    create: (data: T.QuranMemorizationPayload) => api.post<T.QuranMemorization>('/quran/memorization/', data),
    update: (id: number, data: T.QuranMemorizationPayload) => api.put<T.QuranMemorization>(`/quran/memorization/${id}/`, data),
    delete: (id: number) => api.delete(`/quran/memorization/${id}/`),
  },
  revision: {
    list: (params?: Record<string, unknown>) => api.get<T.QuranRevision[]>('/quran/revision/', { params }),
    create: (data: T.QuranRevisionPayload) => api.post<T.QuranRevision>('/quran/revision/', data),
    markComplete: (id: number) => api.patch<T.QuranRevision>(`/quran/revision/mark-complete/${id}/`),
  },
  tajwid: {
    list: (params?: Record<string, unknown>) => api.get<T.QuranTajwid[]>('/quran/tajwid/', { params }),
    create: (data: T.QuranTajwidPayload) => api.post<T.QuranTajwid>('/quran/tajwid/', data),
  },
  studentProgress: (studentId: number) => api.get<T.QuranStudentProgress>(`/quran/student-progress/${studentId}/`),
};

export const analyticsAPI = {
  atRisk: {
    list: (params?: Record<string, unknown>) => api.get<T.AtRiskStudent[]>('/analytics/at-risk/', { params }),
    get: (id: number) => api.get<T.AtRiskStudent>(`/analytics/at-risk/${id}/`),
    generate: () => api.post<T.AtRiskStudent[]>('/analytics/at-risk/generate/'),
  },
  skills: {
    list: (params?: Record<string, unknown>) => api.get<T.SkillAssessment[]>('/analytics/skills/', { params }),
    create: (data: T.SkillAssessmentPayload) => api.post<T.SkillAssessment>('/analytics/skills/', data),
    update: (id: number, data: T.SkillAssessmentPayload) => api.put<T.SkillAssessment>(`/analytics/skills/${id}/`, data),
    delete: (id: number) => api.delete(`/analytics/skills/${id}/`),
  },
  portfolio: {
    list: (params?: Record<string, unknown>) => api.get<T.PortfolioItem[]>('/analytics/portfolio/', { params }),
    create: (data: T.PortfolioItemPayload) => api.post<T.PortfolioItem>('/analytics/portfolio/', data),
    update: (id: number, data: T.PortfolioItemPayload) => api.put<T.PortfolioItem>(`/analytics/portfolio/${id}/`, data),
    delete: (id: number) => api.delete(`/analytics/portfolio/${id}/`),
  },
  teacherWorkload: {
    all: () => api.get<T.TeacherWorkload[]>('/analytics/teacher-workload/'),
    me: () => api.get<T.TeacherWorkload[]>('/analytics/teacher-workload/me/'),
  },
  adminDashboard: () => api.get<T.AdminAnalyticsDashboard>('/analytics/dashboard/admin/'),
};

export const questionGeneratorAPI = {
  generate: (data: T.QuestionGeneratePayload) => api.post('/assessments/generate-questions/', data),
};

export const learningAPI = {
  paths: {
    list: (params?: Record<string, unknown>) => api.get<T.LearningPath[]>('/learning/paths/', { params }),
    get: (id: number) => api.get<T.LearningPath>(`/learning/paths/${id}/`),
    generate: (data: T.LearningPathGeneratePayload) => api.post<T.LearningPath>('/learning/paths/generate/', data),
    completeItem: (pathId: number, itemId: number, data?: T.LearningPathCompletePayload) =>
      api.patch<T.LearningPath>(`/learning/paths/${pathId}/items/${itemId}/complete/`, data),
  },
  decks: {
    list: (params?: Record<string, unknown>) => api.get<T.FlashCardDeck[]>('/learning/decks/', { params }),
    create: (data: T.FlashCardDeckPayload) => api.post<T.FlashCardDeck>('/learning/decks/', data),
    update: (id: number, data: T.FlashCardDeckPayload) => api.put<T.FlashCardDeck>(`/learning/decks/${id}/`, data),
    delete: (id: number) => api.delete(`/learning/decks/${id}/`),
    cards: (deckId: number, params?: Record<string, unknown>) => api.get<T.FlashCard[]>(`/learning/decks/${deckId}/cards/`, { params }),
    addCard: (deckId: number, data: T.FlashCardPayload) => api.post<T.FlashCard>(`/learning/decks/${deckId}/cards/`, data),
    updateCard: (deckId: number, cardId: number, data: T.FlashCardPayload) =>
      api.put<T.FlashCard>(`/learning/decks/${deckId}/cards/${cardId}/`, data),
    deleteCard: (deckId: number, cardId: number) =>
      api.delete(`/learning/decks/${deckId}/cards/${cardId}/`),
    reviewCard: (deckId: number, cardId: number, data: T.FlashCardReviewPayload) =>
      api.post<T.FlashCard>(`/learning/decks/${deckId}/cards/review/${cardId}/`, data),
    dueCards: (deckId: number) => api.get<T.FlashCard[]>(`/learning/decks/${deckId}/cards/due/`),
  },
};

export const guidanceAPI = {
  career: {
    generate: (studentId: number) => api.post<T.CareerRecommendation>('/guidance/career/generate/', { student_id: studentId }),
    list: (params?: Record<string, unknown>) => api.get<T.CareerRecommendation[]>('/guidance/career/', { params }),
  },
  tutor: {
    ask: (data: T.AITutorAskPayload) => {
      if (data.files && data.files.length > 0) {
        const fd = new FormData();
        fd.append('question', data.question);
        if (data.subject_id) fd.append('subject_id', String(data.subject_id));
        if (data.session_id) fd.append('session_id', data.session_id);
        data.files.forEach((f, i) => fd.append(`file_${i}`, f));
        return api.post<T.AITutorSession>('/guidance/tutor/ask/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      return api.post<T.AITutorSession>('/guidance/tutor/ask/', data);
    },
    history: () => api.get<T.AITutorSession[]>('/guidance/tutor/history/'),
    clearHistory: () => api.delete('/guidance/tutor/history/'),
    transcribe: (fd: FormData) => api.post<T.TranscriptionResult>('/guidance/transcribe/', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  },
};

export const characterAPI = {
  traits: {
    list: (params?: Record<string, unknown>) => api.get<T.CharacterTrait[]>('/character/traits/', { params }),
    create: (data: T.CharacterTraitPayload) => api.post<T.CharacterTrait>('/character/traits/', data),
    update: (id: number, data: T.CharacterTraitPayload) => api.put<T.CharacterTrait>(`/character/traits/${id}/`, data),
    delete: (id: number) => api.delete(`/character/traits/${id}/`),
  },
  evaluations: {
    list: (params?: Record<string, unknown>) => api.get<T.CharacterEvaluation[]>('/character/evaluations/', { params }),
    get: (id: number) => api.get<T.CharacterEvaluation>(`/character/evaluations/${id}/`),
    create: (data: T.CharacterEvaluationPayload) => api.post<T.CharacterEvaluation>('/character/evaluations/', data),
    update: (id: number, data: T.CharacterEvaluationPayload) => api.put<T.CharacterEvaluation>(`/character/evaluations/${id}/`, data),
    delete: (id: number) => api.delete(`/character/evaluations/${id}/`),
    summary: (params?: Record<string, unknown>) => api.get(`/character/evaluations/summary/`, { params }),
  },
};

export const whatsappAPI = {
  recipients: {
    list: (params?: Record<string, unknown>) => api.get<T.WhatsAppRecipient[]>('/whatsapp/recipients/', { params }),
    optIn: (data: T.WhatsAppOptInPayload) =>
      api.post<T.WhatsAppRecipient>('/whatsapp/recipients/opt_in/', data),
    optOut: (recipientId: number) =>
      api.post(`/whatsapp/recipients/${recipientId}/opt_out/`),
  },
  templates: {
    list: (params?: Record<string, unknown>) => api.get<T.WhatsAppTemplate[]>('/whatsapp/templates/', { params }),
    create: (data: T.WhatsAppTemplatePayload) => api.post<T.WhatsAppTemplate>('/whatsapp/templates/', data),
    update: (id: number, data: T.WhatsAppTemplatePayload) => api.put<T.WhatsAppTemplate>(`/whatsapp/templates/${id}/`, data),
    delete: (id: number) => api.delete(`/whatsapp/templates/${id}/`),
  },
  messages: {
    list: (params?: Record<string, unknown>) => api.get<T.WhatsAppMessage[]>('/whatsapp/messages/', { params }),
  },
  send: (data: T.WhatsAppSendPayload) => api.post<T.WhatsAppMessage>('/whatsapp/send/', data),
};

export const certificateAPI = {
  list: (params?: Record<string, unknown>) => api.get<T.Certificate[]>('/certificates/', { params }),
  get: (id: string) => api.get<T.Certificate>(`/certificates/${id}/`),
  generate: (data: T.CertificateGeneratePayload) => api.post<T.Certificate>('/certificates/generate/', data),
  download: (id: string) => api.get(`/certificates/${id}/download/`, { responseType: 'blob' }),
  delete: (id: string) => api.delete(`/certificates/${id}/`),
};

export const quizzesAPI = {
  questions: {
    list: (params?: Record<string, unknown>) => api.get<T.QuizQuestion[]>('/quizzes/questions/', { params }),
    get: (id: number) => api.get<T.QuizQuestion>(`/quizzes/questions/${id}/`),
    create: (data: Record<string, unknown>) => api.post<T.QuizQuestion>('/quizzes/questions/', data),
    update: (id: number, data: Record<string, unknown>) => api.put<T.QuizQuestion>(`/quizzes/questions/${id}/`, data),
    delete: (id: number) => api.delete(`/quizzes/questions/${id}/`),
    duplicate: (id: number) => api.post<T.QuizQuestion>(`/quizzes/questions/${id}/duplicate/`),
  },
  quizzes: {
    list: (params?: Record<string, unknown>) => api.get<T.Quiz[]>('/quizzes/', { params }),
    get: (id: number) => api.get<T.Quiz>(`/quizzes/${id}/`),
    create: (data: Record<string, unknown>) => api.post<T.Quiz>('/quizzes/', data),
    update: (id: number, data: Record<string, unknown>) => api.put<T.Quiz>(`/quizzes/${id}/`, data),
    delete: (id: number) => api.delete(`/quizzes/${id}/`),
    publish: (id: number) => api.post(`/quizzes/${id}/publish/`),
    archive: (id: number) => api.post(`/quizzes/${id}/archive/`),
    questions: (id: number) => api.get<T.QuizQuestion[]>(`/quizzes/${id}/questions/`),
    addQuestion: (id: number, questionId: number) => api.post(`/quizzes/${id}/questions/add/`, { question_id: questionId }),
    removeQuestion: (id: number, questionId: number) => api.delete(`/quizzes/${id}/questions/${questionId}/remove/`),
    results: (id: number) => api.get<T.QuizAttempt[]>(`/quizzes/${id}/results/`),
    stats: (id: number) => api.get(`/quizzes/${id}/stats/`),
    analysis: (id: number) => api.get(`/quizzes/${id}/analysis/`),
    violations: (id: number) => api.get<T.ViolationLog[]>(`/quizzes/${id}/violations/`),
  },
  attempts: {
    start: (quizId: number) => api.post<T.QuizAttempt>('/quizzes/start/', { quiz_id: quizId }),
    get: (attemptUuid: string) => api.get<T.QuizAttempt>(`/quizzes/attempt/${attemptUuid}/`),
    saveAnswer: (attemptUuid: string, data: T.QuizSaveAnswerPayload) =>
      api.post(`/quizzes/attempt/${attemptUuid}/answer/`, data),
    flag: (attemptUuid: string, questionId: number) =>
      api.post(`/quizzes/attempt/${attemptUuid}/flag/`, { question_id: questionId }),
    submit: (attemptUuid: string) => api.post(`/quizzes/attempt/${attemptUuid}/submit/`),
    reportViolation: (attemptUuid: string, data: T.QuizViolationPayload) =>
      api.post(`/quizzes/attempt/${attemptUuid}/violation/`, data),
  },
  overview: () => api.get('/quizzes/overview/'),
};

export const fasaahaAPI = {
  levels: {
    list: (params?: Record<string, unknown>) => api.get<T.SpeakingLevel[]>('/fasaaha/levels/', { params }),
    get: (id: number) => api.get<T.SpeakingLevel>(`/fasaaha/levels/${id}/`),
    create: (data: T.SpeakingLevelPayload) => api.post<T.SpeakingLevel>('/fasaaha/levels/', data),
    update: (id: number, data: T.SpeakingLevelPayload) => api.put<T.SpeakingLevel>(`/fasaaha/levels/${id}/`, data),
    delete: (id: number) => api.delete(`/fasaaha/levels/${id}/`),
  },
  categories: {
    list: (params?: Record<string, unknown>) => api.get<T.MissionCategory[]>('/fasaaha/categories/', { params }),
    get: (id: number) => api.get<T.MissionCategory>(`/fasaaha/categories/${id}/`),
    create: (data: T.MissionCategoryPayload) => api.post<T.MissionCategory>('/fasaaha/categories/', data),
    update: (id: number, data: T.MissionCategoryPayload) => api.put<T.MissionCategory>(`/fasaaha/categories/${id}/`, data),
    delete: (id: number) => api.delete(`/fasaaha/categories/${id}/`),
  },
  missions: {
    list: (params?: Record<string, unknown>) => api.get<T.Mission[]>('/fasaaha/missions/', { params }),
    get: (id: number) => api.get<T.Mission>(`/fasaaha/missions/${id}/`),
    create: (data: T.MissionPayload) => api.post<T.Mission>('/fasaaha/missions/', data),
    update: (id: number, data: T.MissionPayload) => api.put<T.Mission>(`/fasaaha/missions/${id}/`, data),
    delete: (id: number) => api.delete(`/fasaaha/missions/${id}/`),
    forLevel: (levelId: number) => api.get<T.Mission[]>(`/fasaaha/levels/${levelId}/missions/`),
  },
  attempts: {
    list: (params?: Record<string, unknown>) => api.get<T.SpeakingAttempt[]>('/fasaaha/attempts/', { params }),
    get: (id: number) => api.get<T.SpeakingAttempt>(`/fasaaha/attempts/${id}/`),
    submit: (data: FormData) => api.post<T.SpeakingAttempt>('/fasaaha/attempts/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    retry: (id: number, data: FormData) => api.post<T.SpeakingAttempt>(`/fasaaha/attempts/${id}/retry/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  },
  analysis: {
    get: (attemptId: number) => api.get<T.AIAnalysis>(`/fasaaha/attempts/${attemptId}/analysis/`),
  },
  reviews: {
    list: (params?: Record<string, unknown>) => api.get<T.TeacherReview[]>('/fasaaha/reviews/', { params }),
    pending: (params?: Record<string, unknown>) => api.get<T.SpeakingAttempt[]>('/fasaaha/reviews/pending/', { params }),
    create: (data: T.FasaahaReviewPayload) => api.post<T.TeacherReview>('/fasaaha/reviews/', data),
    update: (id: number, data: T.FasaahaReviewUpdatePayload) => api.put<T.TeacherReview>(`/fasaaha/reviews/${id}/`, data),
  },
  assignments: {
    list: (params?: Record<string, unknown>) => api.get<T.MissionAssignment[]>('/fasaaha/assignments/', { params }),
    get: (id: number) => api.get<T.MissionAssignment>(`/fasaaha/assignments/${id}/`),
    create: (data: T.FasaahaAssignmentPayload) => api.post<T.MissionAssignment>('/fasaaha/assignments/', data),
    delete: (id: number) => api.delete(`/fasaaha/assignments/${id}/`),
  },
  progress: {
    list: (params?: Record<string, unknown>) => api.get<T.StudentLevelProgress[]>('/fasaaha/progress/', { params }),
    level: (levelId: number, params?: Record<string, unknown>) => api.get<T.StudentLevelProgress[]>(`/fasaaha/progress/${levelId}/`, { params }),
  },
  streaks: {
    get: (params?: Record<string, unknown>) => api.get<T.StudentStreak[]>('/fasaaha/progress/streak/', { params }),
  },
  badges: {
    list: (params?: Record<string, unknown>) => api.get<T.Badge[]>('/fasaaha/badges/', { params }),
    create: (data: T.FasaahaBadgePayload) => api.post<T.Badge>('/fasaaha/badges/create/', data),
    myBadges: (params?: Record<string, unknown>) => api.get<T.StudentBadge[]>('/fasaaha/badges/my/', { params }),
  },
  analytics: {
    class: (params?: Record<string, unknown>) => api.get(`/fasaaha/analytics/class/`, { params }),
    student: (studentId: number, params?: Record<string, unknown>) => api.get(`/fasaaha/analytics/student/${studentId}/`, { params }),
    school: (params?: Record<string, unknown>) => api.get(`/fasaaha/analytics/school/`, { params }),
  },
  dashboards: {
    student: () => api.get<T.FasaahaStudentDashboard>('/fasaaha/dashboard/student/'),
    teacher: () => api.get<T.FasaahaTeacherDashboard>('/fasaaha/dashboard/teacher/'),
  },
  dialogue: {
    start: (data: T.FasaahaDialogueStartPayload) =>
      api.post<T.DialogueSession>('/fasaaha/dialogues/start/', data),
    get: (uuid: string) => api.get<T.DialogueSession & { turns: T.DialogueTurn[] }>(`/fasaaha/dialogues/${uuid}/`),
    turn: (uuid: string, data: T.FasaahaDialogueTurnPayload) =>
      api.post<T.DialogueTurnResponse>(`/fasaaha/dialogues/${uuid}/turn/`, data),
    complete: (uuid: string) => api.post(`/fasaaha/dialogues/${uuid}/complete/`),
    list: () => api.get<T.DialogueSession[]>('/fasaaha/dialogues/'),
  },
  goals: {
    today: () => api.get<T.DailyGoal>(`/fasaaha/goals/today/`),
    weekly: () => api.get<T.DailyGoal[]>('/fasaaha/goals/weekly/'),
  },
  leaderboard: {
    get: (params?: { period?: string }) => api.get<T.LeaderboardEntry[]>('/fasaaha/leaderboard/', { params }),
    refresh: (data?: { period?: string }) => api.post('/fasaaha/leaderboard/refresh/', data ?? {}),
  },
  trends: {
    get: (studentId?: number, params?: { days?: number }) => {
      const base = studentId
        ? `/fasaaha/trends/${studentId}/`
        : '/fasaaha/trends/';
      return api.get<T.ScoreTrend[]>(base, { params });
    },
  },
};

export const quizAPI = {
  questions: {
    list: (params?: Record<string, unknown>) => api.get<T.QuizQuestion[]>('/quizzes/questions/', { params }),
    get: (id: number) => api.get<T.QuizQuestion>(`/quizzes/questions/${id}/`),
    create: (data: Record<string, unknown>) => api.post<T.QuizQuestion>('/quizzes/questions/', data),
    update: (id: number, data: Record<string, unknown>) => api.put<T.QuizQuestion>(`/quizzes/questions/${id}/`, data),
    delete: (id: number) => api.delete(`/quizzes/questions/${id}/`),
    duplicate: (id: number) => api.post<T.QuizQuestion>(`/quizzes/questions/${id}/duplicate/`),
  },
  quizzes: {
    list: (params?: Record<string, unknown>) => api.get<T.Quiz[]>('/quizzes/', { params }),
    get: (id: number) => api.get<T.Quiz>(`/quizzes/${id}/`),
    create: (data: Record<string, unknown>) => api.post<T.Quiz>('/quizzes/', data),
    update: (id: number, data: Record<string, unknown>) => api.put<T.Quiz>(`/quizzes/${id}/`, data),
    delete: (id: number) => api.delete(`/quizzes/${id}/`),
    publish: (id: number) => api.post(`/quizzes/${id}/publish/`),
    archive: (id: number) => api.post(`/quizzes/${id}/archive/`),
    questions: (id: number) => api.get<T.QuizQuestion[]>(`/quizzes/${id}/questions/`),
    addQuestion: (id: number, questionId: number) => api.post(`/quizzes/${id}/questions/add/`, { question_id: questionId }),
    removeQuestion: (id: number, questionId: number) => api.delete(`/quizzes/${id}/questions/${questionId}/remove/`),
    results: (id: number) => api.get<T.QuizAttempt[]>(`/quizzes/${id}/results/`),
    stats: (id: number) => api.get(`/quizzes/${id}/stats/`),
    analysis: (id: number) => api.get(`/quizzes/${id}/analysis/`),
    violations: (id: number) => api.get<T.ViolationLog[]>(`/quizzes/${id}/violations/`),
    myResults: (params?: Record<string, unknown>) => api.get<PaginatedData<T.QuizAttempt>>('/quizzes/my-results/', { params }),
  },
  attempts: {
    start: (quizId: number) => api.post<T.QuizAttempt>('/quizzes/start/', { quiz_id: quizId }),
    get: (attemptUuid: string) => api.get<T.QuizAttempt>(`/quizzes/attempt/${attemptUuid}/`),
    saveAnswer: (attemptUuid: string, data: T.QuizSaveAnswerPayload) =>
      api.post(`/quizzes/attempt/${attemptUuid}/answer/`, data),
    flag: (attemptUuid: string, questionId: number) =>
      api.post(`/quizzes/attempt/${attemptUuid}/flag/`, { question_id: questionId }),
    submit: (attemptUuid: string) => api.post(`/quizzes/attempt/${attemptUuid}/submit/`),
    reportViolation: (attemptUuid: string, data: T.QuizViolationPayload) =>
      api.post(`/quizzes/attempt/${attemptUuid}/violation/`, data),
  },
  overview: () => api.get('/quizzes/overview/'),
};

export interface SearchResult {
  model: string;
  id: number | string;
  title: string;
  subtitle: string;
  preview: string;
  url: string;
}

export const searchAPI = {
  search: (q: string) => api.get<SearchResult[]>('/search/', { params: { q } }),
};

export const auditAPI = {
  list: (params?: Record<string, string> & { url?: string }) => {
    if (params?.url) {
      // When using a next/prev URL, extract the path + query
      const url = new URL(params.url, window.location.origin);
      const basePath = new URL(api.defaults.baseURL ?? '', window.location.origin).pathname;
      if (!url.pathname.startsWith(basePath) || url.pathname.includes('..')) {
        return api.get('/audit/logs/');
      }
      return api.get(url.pathname + url.search);
    }
    return api.get('/audit/logs/', { params });
  },
};

export const questionBankAPI = {
  list: (params?: Record<string, unknown>) => api.get<T.QuestionBank[]>('/question-banks/', { params }),
  get: (id: number) => api.get<T.QuestionBank>(`/question-banks/${id}/`),
  create: (formData: FormData) =>
    api.post<T.QuestionBank>('/question-banks/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number) => api.delete(`/question-banks/${id}/`),
  convert: (id: number) => api.post<T.QuestionBank>(`/question-banks/${id}/convert/`),
  questions: (id: number) => api.get<T.QuizQuestion[]>(`/question-banks/${id}/questions/`),
  gapAnalysis: (bankId: number, attemptUuid: string) =>
    api.get<T.GapAnalysis>(`/question-banks/${bankId}/gap-analysis/${attemptUuid}/`),
};
