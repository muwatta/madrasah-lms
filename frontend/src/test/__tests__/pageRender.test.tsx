import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, act } from '@testing-library/react'
import { LanguageProvider } from '../../context/LanguageContext'
import { ThemeProvider } from '../../context/ThemeContext'
import type { User } from '../../types'

const GROUP_NAMES = vi.hoisted(() => [
  'academicAPI', 'admissionsAPI', 'analyticsAPI', 'announcementAPI', 'attendanceAPI',
  'auditAPI', 'authAPI', 'certificateAPI', 'characterAPI', 'classSubjectAPI',
  'dashboardAPI', 'enrollmentAPI', 'examAPI', 'fasaahaAPI', 'feeAPI', 'feeStructureAPI',
  'guidanceAPI', 'interventionAPI', 'learningAPI', 'legacyAttemptAPI', 'legacyQuizAPI',
  'lessonAPI', 'messageAPI', 'notificationAPI', 'pushAPI', 'questionAPI',
  'questionBankAPI', 'questionGeneratorAPI', 'quizAPI', 'quizzesAPI', 'quranAPI',
  'resultsAPI', 'schoolAPI', 'schoolClassAPI', 'searchAPI', 'subjectAPI', 'userAPI',
  'whatsappAPI',
])

const mockApi = vi.hoisted(() => {
  const mkGroup = (): unknown => {
    const handler = () => Promise.resolve({ data: [] })
    return new Proxy(handler as unknown as Record<string, unknown>, {
      get: (target, prop) => {
        if (prop === 'then') return undefined
        if (prop in target) return target[prop]
        return mkGroup()
      },
    })
  }
  const groups: Record<string, unknown> = {}
  for (const name of GROUP_NAMES) groups[name] = mkGroup()
  return groups
})

vi.mock('../../api', () => ({ ...mockApi, default: {} }))

const mockClient = vi.hoisted(() => {
  const http = new Proxy({} as Record<string, unknown>, {
    get: (_t, prop) => {
      if (prop === 'then') return undefined
      return async () => ({ data: {} })
    },
  })
  return {
    http,
    fetchAllPages: async () => [] as unknown[],
    unwrapPaginated: (data: unknown) =>
      Array.isArray(data) ? data : (data && typeof data === 'object' && Array.isArray((data as { results?: unknown }).results)) ? (data as { results: unknown[] }).results : [],
  }
})

vi.mock('../../api/client', () => ({
  default: mockClient.http,
  fetchAllPages: mockClient.fetchAllPages,
  unwrapPaginated: mockClient.unwrapPaginated,
}))

const mockAuth = vi.hoisted(() => {
  let state: { user: User | null; loading: boolean; isAuthenticated: boolean } = {
    user: null,
    loading: false,
    isAuthenticated: false,
  }
  return {
    setUser: (u: User | null) => {
      state = { user: u, loading: false, isAuthenticated: !!u }
    },
    useAuth: () => state,
    AuthProvider: ({ children }: { children: React.ReactNode }) => children as React.ReactElement,
  }
})

vi.mock('../../context/AuthContext', () => ({
  useAuth: mockAuth.useAuth,
  AuthProvider: mockAuth.AuthProvider,
}))

function makeUser(role: User['role']): User {
  return {
    id: 1,
    email: 'test@madrasah.com',
    first_name: 'Test',
    last_name: 'User',
    full_name: 'Test User',
    role,
    madrasah: 1,
    madrasah_name: 'Test Madrasah',
    is_active: true,
    email_verified: true,
    date_of_birth: null,
    date_joined: '2024-01-01T00:00:00Z',
    student_ids: role === 'parent' ? [2] : undefined,
  }
}

type PageCase = {
  role: User['role']
  route: string
  path: string
  element: React.ReactElement
}

const student = 'student' as const
const ustaadh = 'ustaadh' as const
const parent = 'parent' as const
const mudeer = 'mudeer' as const
const idaarah = 'idaarah' as const
const guest = 'guest' as const

const cases: PageCase[] = [
  // ── Auth & public ────────────────────────────────────────────────────────
  { role: guest, route: '/login', path: '/login', element: <LoginPage /> },
  { role: guest, route: '/register', path: '/register', element: <RegisterPage /> },
  { role: guest, route: '/forgot-password', path: '/forgot-password', element: <ForgotPasswordPage /> },
  { role: guest, route: '/reset-password', path: '/reset-password?uidb64=abc&token=xyz', element: <ResetPasswordPage /> },
  { role: guest, route: '/verify-email', path: '/verify-email?uidb64=abc&token=xyz', element: <VerifyEmailPage /> },
  { role: guest, route: '/guest/pending', path: '/guest/pending', element: <GuestPendingPage /> },
  { role: guest, route: '/change-password', path: '/change-password', element: <ChangePasswordPage /> },
  { role: guest, route: '/', path: '/', element: <LandingPage /> },
  { role: guest, route: '/pricing', path: '/pricing', element: <PricingPage /> },
  { role: guest, route: '/docs', path: '/docs', element: <DocsPage /> },
  { role: guest, route: '/contact', path: '/contact', element: <ContactPage /> },
  { role: guest, route: '/help', path: '/help', element: <HelpCenterPage /> },
  { role: guest, route: '/community', path: '/community', element: <CommunityPage /> },
  { role: guest, route: '/privacy', path: '/privacy', element: <PrivacyPage /> },
  { role: guest, route: '/terms', path: '/terms', element: <TermsPage /> },
  { role: guest, route: '/about', path: '/about', element: <AboutPage /> },
  { role: guest, route: '/faq', path: '/faq', element: <FAQPage /> },
  { role: guest, route: '/blog', path: '/blog', element: <BlogPage /> },
  { role: guest, route: '/profile', path: '/profile', element: <ProfilePage /> },

  // ── Student ──────────────────────────────────────────────────────────────
  { role: student, route: '/student/dashboard', path: '/student/dashboard', element: <StudentDashboard /> },
  { role: student, route: '/student/quizzes', path: '/student/quizzes', element: <QuizListPage /> },
  { role: student, route: '/student/quizzes/:quizId/take', path: '/student/quizzes/1/take', element: <QuizTakePage /> },
  { role: student, route: '/student/results', path: '/student/results', element: <QuizResultsPage /> },
  { role: student, route: '/student/exams', path: '/student/exams', element: <ExamResultsPage /> },
  { role: student, route: '/student/progress', path: '/student/progress', element: <StudentProgressPage /> },
  { role: student, route: '/student/messages', path: '/student/messages', element: <MessagesPage /> },
  { role: student, route: '/student/attendance', path: '/student/attendance', element: <StudentAttendancePage /> },
  { role: student, route: '/student/announcements', path: '/student/announcements', element: <AnnouncementsPage /> },
  { role: student, route: '/student/homework', path: '/student/homework', element: <StudentHomeworkPage /> },
  { role: student, route: '/student/portfolio', path: '/student/portfolio', element: <PortfolioPage /> },
  { role: student, route: '/student/certificates', path: '/student/certificates', element: <CertificatesPage /> },
  { role: student, route: '/student/calendar', path: '/student/calendar', element: <CalendarPage /> },
  { role: student, route: '/student/career', path: '/student/career', element: <CareerGuidancePage /> },
  { role: student, route: '/student/tutor', path: '/student/tutor', element: <AITutorPage /> },
  { role: student, route: '/student/path', path: '/student/path', element: <LearningPathPage /> },
  { role: student, route: '/student/flashcards', path: '/student/flashcards', element: <FlashCardPage /> },
  { role: student, route: '/student/character', path: '/student/character', element: <StudentCharacterPage /> },
  { role: student, route: '/student/my-results', path: '/student/my-results', element: <MyResultsPage /> },
  { role: student, route: '/student/fasaaha', path: '/student/fasaaha', element: <FasaahaStudentDashboard /> },
  { role: student, route: '/student/fasaaha/missions', path: '/student/fasaaha/missions', element: <FasaahaMissionBrowser /> },
  { role: student, route: '/student/fasaaha/speak/:missionId', path: '/student/fasaaha/speak/1', element: <FasaahaSpeakPage /> },
  { role: student, route: '/student/fasaaha/read/:missionId', path: '/student/fasaaha/read/1', element: <FasaahaReadingPage /> },
  { role: student, route: '/student/fasaaha/progress', path: '/student/fasaaha/progress', element: <FasaahaMyProgress /> },
  { role: student, route: '/student/fasaaha/badges', path: '/student/fasaaha/badges', element: <FasaahaMyBadges /> },
  { role: student, route: '/student/fasaaha/conversation', path: '/student/fasaaha/conversation', element: <FasaahaConversation /> },
  { role: student, route: '/student/fasaaha/leaderboard', path: '/student/fasaaha/leaderboard', element: <FasaahaLeaderboard /> },
  { role: student, route: '/student/fasaaha/goals', path: '/student/fasaaha/goals', element: <FasaahaDailyGoals /> },
  { role: student, route: '/student/fasaaha/trends', path: '/student/fasaaha/trends', element: <FasaahaScoreTrends /> },
  { role: student, route: '/student/profile', path: '/student/profile', element: <ProfilePage /> },
  { role: student, route: '/student/change-password', path: '/student/change-password', element: <ChangePasswordPage /> },

  // ── Teacher ──────────────────────────────────────────────────────────────
  { role: ustaadh, route: '/teacher/dashboard', path: '/teacher/dashboard', element: <TeacherDashboard /> },
  { role: ustaadh, route: '/teacher/quizzes', path: '/teacher/quizzes', element: <QuizManagerPage /> },
  { role: ustaadh, route: '/teacher/quiz/builder', path: '/teacher/quiz/builder', element: <QuizBuilderPage /> },
  { role: ustaadh, route: '/teacher/quiz/builder/:quizId', path: '/teacher/quiz/builder/1', element: <QuizBuilderPage /> },
  { role: ustaadh, route: '/teacher/quizzes/:id/analytics', path: '/teacher/quizzes/1/analytics', element: <QuizAnalyticsPage /> },
  { role: ustaadh, route: '/teacher/questions', path: '/teacher/questions', element: <QuestionBankPage /> },
  { role: ustaadh, route: '/teacher/question-banks', path: '/teacher/question-banks', element: <TermQuestionBanksPage /> },
  { role: ustaadh, route: '/teacher/question-banks/:id', path: '/teacher/question-banks/1', element: <QuestionBankEditorPage /> },
  { role: ustaadh, route: '/teacher/students', path: '/teacher/students', element: <StudentPerformancePage /> },
  { role: ustaadh, route: '/teacher/messages', path: '/teacher/messages', element: <MessagesPage /> },
  { role: ustaadh, route: '/teacher/attendance', path: '/teacher/attendance', element: <AttendancePage /> },
  { role: ustaadh, route: '/teacher/announcements', path: '/teacher/announcements', element: <AnnouncementsPage /> },
  { role: ustaadh, route: '/teacher/lesson-planner', path: '/teacher/lesson-planner', element: <LessonPlannerPage /> },
  { role: ustaadh, route: '/teacher/homework', path: '/teacher/homework', element: <HomeworkPage /> },
  { role: ustaadh, route: '/teacher/quran', path: '/teacher/quran', element: <QuranPage /> },
  { role: ustaadh, route: '/teacher/character', path: '/teacher/character', element: <TeacherCharacterPage /> },
  { role: ustaadh, route: '/teacher/timetable', path: '/teacher/timetable', element: <TeacherTimetablePage /> },
  { role: ustaadh, route: '/teacher/results', path: '/teacher/results', element: <ResultEntryPage /> },
  { role: ustaadh, route: '/teacher/fasaaha', path: '/teacher/fasaaha', element: <FasaahaTeacherDashboard /> },
  { role: ustaadh, route: '/teacher/fasaaha/missions', path: '/teacher/fasaaha/missions', element: <FasaahaMissionManager /> },
  { role: ustaadh, route: '/teacher/fasaaha/review', path: '/teacher/fasaaha/review', element: <FasaahaReviewPage /> },
  { role: ustaadh, route: '/teacher/fasaaha/analytics', path: '/teacher/fasaaha/analytics', element: <FasaahaAnalyticsPage /> },
  { role: ustaadh, route: '/teacher/fasaaha/assignments', path: '/teacher/fasaaha/assignments', element: <FasaahaAssignmentsPage /> },
  { role: ustaadh, route: '/teacher/qr-scanner', path: '/teacher/qr-scanner', element: <QRScannerPage /> },
  { role: ustaadh, route: '/teacher/class-subjects', path: '/teacher/class-subjects', element: <TeacherClassSubjectsPage /> },
  { role: ustaadh, route: '/teacher/profile', path: '/teacher/profile', element: <ProfilePage /> },
  { role: ustaadh, route: '/teacher/change-password', path: '/teacher/change-password', element: <ChangePasswordPage /> },

  // ── Parent ───────────────────────────────────────────────────────────────
  { role: parent, route: '/parent/dashboard', path: '/parent/dashboard', element: <ParentDashboard /> },
  { role: parent, route: '/parent/messages', path: '/parent/messages', element: <MessagesPage /> },
  { role: parent, route: '/parent/fees', path: '/parent/fees', element: <FeeStatusPage /> },
  { role: parent, route: '/parent/attendance', path: '/parent/attendance', element: <StudentAttendancePage /> },
  { role: parent, route: '/parent/announcements', path: '/parent/announcements', element: <AnnouncementsPage /> },
  { role: parent, route: '/parent/whatsapp', path: '/parent/whatsapp', element: <WhatsAppOptInPage /> },
  { role: parent, route: '/parent/child-results', path: '/parent/child-results', element: <MyResultsPage /> },
  { role: parent, route: '/parent/profile', path: '/parent/profile', element: <ProfilePage /> },
  { role: parent, route: '/parent/change-password', path: '/parent/change-password', element: <ChangePasswordPage /> },

  // ── Admin ────────────────────────────────────────────────────────────────
  { role: mudeer, route: '/admin/dashboard', path: '/admin/dashboard', element: <AdminDashboard /> },
  { role: mudeer, route: '/admin/users', path: '/admin/users', element: <UserManagementPage /> },
  { role: mudeer, route: '/admin/subjects', path: '/admin/subjects', element: <SubjectManagementPage /> },
  { role: mudeer, route: '/admin/enrollments', path: '/admin/enrollments', element: <EnrollmentManagementPage /> },
  { role: mudeer, route: '/admin/class-subjects', path: '/admin/class-subjects', element: <AdminClassSubjectsPage /> },
  { role: mudeer, route: '/admin/exams', path: '/admin/exams', element: <ExamManagementPage /> },
  { role: mudeer, route: '/admin/parent-students', path: '/admin/parent-students', element: <ParentStudentPage /> },
  { role: mudeer, route: '/admin/interventions', path: '/admin/interventions', element: <InterventionAlertsPage /> },
  { role: mudeer, route: '/admin/engagement', path: '/admin/engagement', element: <AdminEngagementPage /> },
  { role: mudeer, route: '/admin/messages', path: '/admin/messages', element: <MessagesPage /> },
  { role: mudeer, route: '/admin/finance', path: '/admin/finance', element: <FinancePage /> },
  { role: mudeer, route: '/admin/attendance', path: '/admin/attendance', element: <AttendancePage /> },
  { role: mudeer, route: '/admin/announcements', path: '/admin/announcements', element: <AnnouncementsPage /> },
  { role: mudeer, route: '/admin/reports', path: '/admin/reports', element: <StudentReportPage /> },
  { role: mudeer, route: '/admin/academic', path: '/admin/academic', element: <AcademicPage /> },
  { role: mudeer, route: '/admin/admissions', path: '/admin/admissions', element: <AdmissionsPage /> },
  { role: mudeer, route: '/admin/at-risk', path: '/admin/at-risk', element: <AtRiskPage /> },
  { role: mudeer, route: '/admin/teacher-workload', path: '/admin/teacher-workload', element: <TeacherWorkloadPage /> },
  { role: mudeer, route: '/admin/character', path: '/admin/character', element: <TeacherCharacterPage /> },
  { role: mudeer, route: '/admin/whatsapp', path: '/admin/whatsapp', element: <WhatsAppPage /> },
  { role: mudeer, route: '/admin/results', path: '/admin/results', element: <ResultsPublishPage /> },
  { role: mudeer, route: '/admin/audit', path: '/admin/audit', element: <AuditLogPage /> },
  { role: mudeer, route: '/admin/certificates', path: '/admin/certificates', element: <AdminCertificatesPage /> },
  { role: mudeer, route: '/admin/timetable', path: '/admin/timetable', element: <AdminTimetablePage /> },
  { role: mudeer, route: '/admin/profile', path: '/admin/profile', element: <ProfilePage /> },

  // ── Board ────────────────────────────────────────────────────────────────
  { role: idaarah, route: '/board/dashboard', path: '/board/dashboard', element: <BoardDashboard /> },
  { role: idaarah, route: '/board/finance', path: '/board/finance', element: <FinancePage /> },
  { role: idaarah, route: '/board/attendance', path: '/board/attendance', element: <AttendancePage /> },
  { role: idaarah, route: '/board/announcements', path: '/board/announcements', element: <AnnouncementsPage /> },
  { role: idaarah, route: '/board/messages', path: '/board/messages', element: <MessagesPage /> },
  { role: idaarah, route: '/board/lesson-planner', path: '/board/lesson-planner', element: <LessonPlannerPage /> },
  { role: idaarah, route: '/board/homework', path: '/board/homework', element: <HomeworkPage /> },
  { role: idaarah, route: '/board/reports', path: '/board/reports', element: <StudentReportPage /> },
  { role: idaarah, route: '/board/engagement', path: '/board/engagement', element: <AdminEngagementPage /> },
  { role: idaarah, route: '/board/profile', path: '/board/profile', element: <ProfilePage /> },
  { role: idaarah, route: '/board/change-password', path: '/board/change-password', element: <ChangePasswordPage /> },
]

describe('role-based page render smoke tests', () => {
  it.each(cases)('renders $route (role=$role)', async ({ role, route, path, element }) => {
    mockAuth.setUser(makeUser(role))

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: 0, staleTime: 0, refetchOnWindowFocus: false },
        mutations: { retry: 0 },
      },
    })

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <LanguageProvider>
            <ThemeProvider>
              <Routes>
                <Route path={route} element={element} />
              </Routes>
            </ThemeProvider>
          </LanguageProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(container).toBeTruthy()
  })
})

import LoginPage from '../../pages/auth/LoginPage'
import RegisterPage from '../../pages/auth/RegisterPage'
import ForgotPasswordPage from '../../pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '../../pages/auth/ResetPasswordPage'
import VerifyEmailPage from '../../pages/auth/VerifyEmailPage'
import GuestPendingPage from '../../pages/auth/GuestPendingPage'
import ChangePasswordPage from '../../pages/auth/ChangePasswordPage'
import LandingPage from '../../pages/public/LandingPage'
import PricingPage from '../../pages/public/PricingPage'
import DocsPage from '../../pages/public/DocsPage'
import ContactPage from '../../pages/public/ContactPage'
import HelpCenterPage from '../../pages/public/HelpCenterPage'
import CommunityPage from '../../pages/public/CommunityPage'
import PrivacyPage from '../../pages/public/PrivacyPage'
import TermsPage from '../../pages/public/TermsPage'
import AboutPage from '../../pages/public/AboutPage'
import FAQPage from '../../pages/public/FAQPage'
import BlogPage from '../../pages/public/BlogPage'
import ProfilePage from '../../pages/shared/ProfilePage'
import MessagesPage from '../../pages/shared/MessagesPage'
import AnnouncementsPage from '../../pages/shared/AnnouncementsPage'

import StudentDashboard from '../../pages/student/StudentDashboard'
import QuizListPage from '../../pages/student/quiz/QuizListPage'
import QuizTakePage from '../../pages/student/quiz/QuizTakePage'
import QuizResultsPage from '../../pages/student/quiz/QuizResultsPage'
import ExamResultsPage from '../../pages/student/ExamResultsPage'
import StudentProgressPage from '../../pages/student/StudentProgressPage'
import StudentAttendancePage from '../../pages/student/StudentAttendancePage'
import StudentHomeworkPage from '../../pages/student/StudentHomeworkPage'
import PortfolioPage from '../../pages/student/PortfolioPage'
import CertificatesPage from '../../pages/student/CertificatesPage'
import CalendarPage from '../../pages/student/CalendarPage'
import CareerGuidancePage from '../../pages/student/CareerGuidancePage'
import AITutorPage from '../../pages/student/AITutorPage'
import LearningPathPage from '../../pages/student/LearningPathPage'
import FlashCardPage from '../../pages/student/FlashCardPage'
import StudentCharacterPage from '../../pages/student/CharacterPage'
import MyResultsPage from '../../pages/student/MyResultsPage'
import FasaahaStudentDashboard from '../../pages/student/fasaaha/FasaahaStudentDashboard'
import FasaahaMissionBrowser from '../../pages/student/fasaaha/FasaahaMissionBrowser'
import FasaahaSpeakPage from '../../pages/student/fasaaha/FasaahaSpeakPage'
import FasaahaReadingPage from '../../pages/student/fasaaha/FasaahaReadingPage'
import FasaahaMyProgress from '../../pages/student/fasaaha/FasaahaMyProgress'
import FasaahaMyBadges from '../../pages/student/fasaaha/FasaahaMyBadges'
import FasaahaConversation from '../../pages/student/fasaaha/FasaahaConversation'
import FasaahaLeaderboard from '../../pages/student/fasaaha/FasaahaLeaderboard'
import FasaahaDailyGoals from '../../pages/student/fasaaha/FasaahaDailyGoals'
import FasaahaScoreTrends from '../../pages/student/fasaaha/FasaahaScoreTrends'

import TeacherDashboard from '../../pages/teacher/TeacherDashboard'
import QuizManagerPage from '../../pages/teacher/quiz/QuizManagerPage'
import QuizBuilderPage from '../../pages/teacher/quiz/QuizBuilderPage'
import QuizAnalyticsPage from '../../pages/teacher/quiz/QuizAnalyticsPage'
import QuestionBankPage from '../../pages/teacher/quiz/QuestionBankPage'
import TermQuestionBanksPage from '../../pages/teacher/question-banks/QuestionBanksPage'
import QuestionBankEditorPage from '../../pages/teacher/question-banks/QuestionBankEditorPage'
import StudentPerformancePage from '../../pages/teacher/StudentPerformancePage'
import AttendancePage from '../../pages/teacher/AttendancePage'
import LessonPlannerPage from '../../pages/teacher/LessonPlannerPage'
import HomeworkPage from '../../pages/teacher/HomeworkPage'
import QuranPage from '../../pages/teacher/QuranPage'
import TeacherCharacterPage from '../../pages/teacher/CharacterPage'
import TeacherTimetablePage from '../../pages/teacher/TimetablePage'
import ResultEntryPage from '../../pages/teacher/ResultEntryPage'
import FasaahaTeacherDashboard from '../../pages/teacher/fasaaha/FasaahaTeacherDashboard'
import FasaahaMissionManager from '../../pages/teacher/fasaaha/FasaahaMissionManager'
import FasaahaReviewPage from '../../pages/teacher/fasaaha/FasaahaReviewPage'
import FasaahaAnalyticsPage from '../../pages/teacher/fasaaha/FasaahaAnalyticsPage'
import FasaahaAssignmentsPage from '../../pages/teacher/fasaaha/FasaahaAssignmentsPage'
import QRScannerPage from '../../pages/teacher/QRScannerPage'
import TeacherClassSubjectsPage from '../../pages/teacher/ClassSubjectsPage'

import ParentDashboard from '../../pages/parent/ParentDashboard'
import FeeStatusPage from '../../pages/parent/FeeStatusPage'
import WhatsAppOptInPage from '../../pages/parent/WhatsAppOptInPage'

import AdminDashboard from '../../pages/admin/AdminDashboard'
import UserManagementPage from '../../pages/admin/UserManagementPage'
import SubjectManagementPage from '../../pages/admin/SubjectManagementPage'
import EnrollmentManagementPage from '../../pages/admin/EnrollmentManagementPage'
import AdminClassSubjectsPage from '../../pages/admin/ClassSubjectsPage'
import ExamManagementPage from '../../pages/admin/ExamManagementPage'
import ParentStudentPage from '../../pages/admin/ParentStudentPage'
import InterventionAlertsPage from '../../pages/admin/InterventionAlertsPage'
import AdminEngagementPage from '../../pages/admin/AdminEngagementPage'
import FinancePage from '../../pages/admin/FinancePage'
import StudentReportPage from '../../pages/admin/StudentReportPage'
import AcademicPage from '../../pages/admin/AcademicPage'
import AdmissionsPage from '../../pages/admin/AdmissionsPage'
import AtRiskPage from '../../pages/admin/AtRiskPage'
import TeacherWorkloadPage from '../../pages/admin/TeacherWorkloadPage'
import WhatsAppPage from '../../pages/admin/WhatsAppPage'
import ResultsPublishPage from '../../pages/admin/ResultsPublishPage'
import AuditLogPage from '../../pages/admin/AuditLogPage'
import AdminCertificatesPage from '../../pages/admin/AdminCertificatesPage'
import AdminTimetablePage from '../../pages/admin/AdminTimetablePage'

import BoardDashboard from '../../pages/board/BoardDashboard'
