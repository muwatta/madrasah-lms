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
};

export const subjectAPI = {
  list: () => api.get('/subjects/'),
  get: (id: number) => api.get(`/subjects/${id}/`),
  create: (data: any) => api.post('/subjects/', data),
  update: (id: number, data: any) => api.put(`/subjects/${id}/`, data),
  delete: (id: number) => api.delete(`/subjects/${id}/`),
  getTopics: (subjectId: number) => api.get(`/subjects/${subjectId}/topics/`),
  createTopic: (subjectId: number, data: any) =>
    api.post(`/subjects/${subjectId}/topics/`, data),
};

export const schoolClassAPI = {
  list: () => api.get('/subjects/classes/'),
};

export const questionAPI = {
  list: (params?: any) => api.get('/questions/', { params }),
  get: (id: number) => api.get(`/questions/${id}/`),
  create: (data: any) => api.post('/questions/', data),
  update: (id: number, data: any) => api.put(`/questions/${id}/`, data),
  delete: (id: number) => api.delete(`/questions/${id}/`),
  bulkUpload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/questions/bulk-upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const quizAPI = {
  list: (params?: any) => api.get('/quizzes/', { params }),
  get: (id: number) => api.get(`/quizzes/${id}/`),
  create: (data: any) => api.post('/quizzes/', data),
  update: (id: number, data: any) => api.put(`/quizzes/${id}/`, data),
  delete: (id: number) => api.delete(`/quizzes/${id}/`),
  publish: (id: number) => api.post(`/quizzes/${id}/publish/`),
  analytics: (id: number) => api.get(`/quizzes/${id}/analytics/`),
};

export const attemptAPI = {
  start: (quizId: number) => api.post('/quiz-attempts/', { quiz: quizId }),
  submit: (attemptId: number, answers: Record<string, string>) =>
    api.put(`/quiz-attempts/${attemptId}/submit/`, { answers }),
  get: (attemptId: number) => api.get(`/quiz-attempts/${attemptId}/`),
  myAttempts: () => api.get('/my-attempts/'),
};

export const examAPI = {
  list: (params?: any) => api.get('/exams/', { params }),
  get: (id: number) => api.get(`/exams/${id}/`),
  create: (data: any) => api.post('/exams/', data),
  update: (id: number, data: any) => api.put(`/exams/${id}/`, data),
  delete: (id: number) => api.delete(`/exams/${id}/`),
  getResults: (examId: number) => api.get(`/exams/${examId}/results/`),
  recordResult: (examId: number, data: any) =>
    api.post(`/exams/${examId}/results/`, data),
  bulkUpload: (examId: number, results: any[]) =>
    api.post(`/exams/${examId}/results/bulk/`, { results }),
  myResults: () => api.get('/student/exams/'),
};

export const enrollmentAPI = {
  list: (params?: any) => api.get('/enrollments/', { params }),
  create: (data: any) => api.post('/enrollments/', data),
  myEnrollments: () => api.get('/enrollments/my/'),
  teacherStudents: () => api.get('/enrollments/teacher/students/'),
};

export const dashboardAPI = {
  student: () => api.get('/student/dashboard/'),
  studentProgress: () => api.get('/student/progress/'),
  teacher: () => api.get('/teacher/dashboard/'),
  teacherStudentPerformance: (studentId: number) =>
    api.get(`/teacher/student/${studentId}/performance/`),
  parent: () => api.get('/parent/dashboard/'),
  admin: () => api.get('/admin/dashboard/'),
  board: () => api.get('/board/dashboard/'),
};

export const userAPI = {
  list: (params?: any) => api.get('/auth/', { params }),
  get: (id: number) => api.get(`/auth/${id}/`),
  create: (data: any) => api.post('/auth/register/', data),
  update: (id: number, data: any) => api.put(`/auth/${id}/`, data),
  delete: (id: number) => api.delete(`/auth/${id}/`),
  bulkImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/auth/bulk-import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const messageAPI = {
  list: (params?: any) => api.get('/auth/messages/', { params }),
  get: (id: number) => api.get(`/auth/messages/${id}/`),
  create: (data: any) => api.post('/auth/messages/', data),
  unreadCount: () => api.get('/auth/messages/unread-count/'),
  parentStudents: () => api.get('/auth/parent-students/'),
  teacherParents: () => api.get('/auth/teacher-parents/'),
};

export const interventionAPI = {
  alerts: () => api.get('/auth/intervention-alerts/'),
  engagement: () => api.get('/auth/admin-engagement/'),
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
