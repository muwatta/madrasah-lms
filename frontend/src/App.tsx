import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';

const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const ChangePasswordPage = lazy(() => import('./pages/auth/ChangePasswordPage'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const QuizListPage = lazy(() => import('./pages/student/QuizListPage'));
const QuizTakePage = lazy(() => import('./pages/student/QuizTakePage'));
const QuizResultsPage = lazy(() => import('./pages/student/QuizResultsPage'));
const ExamResultsPage = lazy(() => import('./pages/student/ExamResultsPage'));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const QuizManagementPage = lazy(() => import('./pages/teacher/QuizManagementPage'));
const QuestionBankPage = lazy(() => import('./pages/teacher/QuestionBankPage'));
const StudentPerformancePage = lazy(() => import('./pages/teacher/StudentPerformancePage'));
const ParentDashboard = lazy(() => import('./pages/parent/ParentDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'));
const SubjectManagementPage = lazy(() => import('./pages/admin/SubjectManagementPage'));
const EnrollmentManagementPage = lazy(() => import('./pages/admin/EnrollmentManagementPage'));
const ExamManagementPage = lazy(() => import('./pages/admin/ExamManagementPage'));
const ParentStudentPage = lazy(() => import('./pages/admin/ParentStudentPage'));
const BoardDashboard = lazy(() => import('./pages/board/BoardDashboard'));
const QuizAnalyticsPage = lazy(() => import('./pages/teacher/QuizAnalyticsPage'));
const StudentProgressPage = lazy(() => import('./pages/student/StudentProgressPage'));
const MessagesPage = lazy(() => import('./pages/shared/MessagesPage'));
const InterventionAlertsPage = lazy(() => import('./pages/admin/InterventionAlertsPage'));
const AdminEngagementPage = lazy(() => import('./pages/admin/AdminEngagementPage'));
const FinancePage = lazy(() => import('./pages/admin/FinancePage'));
const StudentReportPage = lazy(() => import('./pages/admin/StudentReportPage'));
const AnnouncementsPage = lazy(() => import('./pages/shared/AnnouncementsPage'));
const AttendancePage = lazy(() => import('./pages/teacher/AttendancePage'));
const StudentAttendancePage = lazy(() => import('./pages/student/StudentAttendancePage'));
const FeeStatusPage = lazy(() => import('./pages/parent/FeeStatusPage'));
const AcademicPage = lazy(() => import('./pages/admin/AcademicPage'));
const AdmissionsPage = lazy(() => import('./pages/admin/AdmissionsPage'));
const LessonPlannerPage = lazy(() => import('./pages/teacher/LessonPlannerPage'));
const HomeworkPage = lazy(() => import('./pages/teacher/HomeworkPage'));
const QuranPage = lazy(() => import('./pages/teacher/QuranPage'));
const StudentHomeworkPage = lazy(() => import('./pages/student/StudentHomeworkPage'));
const PortfolioPage = lazy(() => import('./pages/student/PortfolioPage'));
const PrayerTimesPage = lazy(() => import('./pages/shared/PrayerTimesPage'));
const AtRiskPage = lazy(() => import('./pages/admin/AtRiskPage'));
const TeacherWorkloadPage = lazy(() => import('./pages/admin/TeacherWorkloadPage'));
const LearningPathPage = lazy(() => import('./pages/student/LearningPathPage'));
const FlashCardPage = lazy(() => import('./pages/student/FlashCardPage'));
const CareerGuidancePage = lazy(() => import('./pages/student/CareerGuidancePage'));
const StudentCharacterPage = lazy(() => import('./pages/student/CharacterPage'));
const AITutorPage = lazy(() => import('./pages/student/AITutorPage'));
const WhatsAppOptInPage = lazy(() => import('./pages/parent/WhatsAppOptInPage'));

const CharacterPage = lazy(() => import('./pages/teacher/CharacterPage'));
const WhatsAppPage = lazy(() => import('./pages/admin/WhatsAppPage'));
const CertificatesPage = lazy(() => import('./pages/student/CertificatesPage'));
const CalendarPage = lazy(() => import('./pages/student/CalendarPage'));
const TeacherTimetablePage = lazy(() => import('./pages/teacher/TimetablePage'));
const ResultEntryPage = lazy(() => import('./pages/teacher/ResultEntryPage'));
const QRScannerPage = lazy(() => import('./pages/teacher/QRScannerPage'));
const ResultsPublishPage = lazy(() => import('./pages/admin/ResultsPublishPage'));
const MyResultsPage = lazy(() => import('./pages/student/MyResultsPage'));
const PricingPage = lazy(() => import('./pages/public/PricingPage'));
const DocsPage = lazy(() => import('./pages/public/DocsPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const PrivacyPage = lazy(() => import('./pages/public/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/public/TermsPage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const FAQPage = lazy(() => import('./pages/public/FAQPage'));
const BlogPage = lazy(() => import('./pages/public/BlogPage'));

import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
      <LanguageProvider>
      <ThemeProvider>
      <AuthProvider>
        <Router>
          <ErrorBoundary>
          <Toaster position="top-left" />
          <Suspense fallback={<div className="flex h-64 items-center justify-center animate-fade-in"><LoadingSpinner size="lg" /></div>}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="quizzes" element={<QuizListPage />} />
              <Route path="quizzes/:quizId/take" element={<QuizTakePage />} />
              <Route path="results" element={<QuizResultsPage />} />
              <Route path="exams" element={<ExamResultsPage />} />
              <Route path="progress" element={<StudentProgressPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="attendance" element={<StudentAttendancePage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="homework" element={<StudentHomeworkPage />} />
              <Route path="portfolio" element={<PortfolioPage />} />
              <Route path="certificates" element={<CertificatesPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="prayer-times" element={<PrayerTimesPage />} />
              <Route path="career" element={<CareerGuidancePage />} />
              <Route path="tutor" element={<AITutorPage />} />
              <Route path="path" element={<LearningPathPage />} />
              <Route path="flashcards" element={<FlashCardPage />} />
              <Route path="character" element={<StudentCharacterPage />} />
              <Route path="my-results" element={<MyResultsPage />} />
              <Route path="change-password" element={<ChangePasswordPage />} />
            </Route>

            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={['ustaadh']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="quizzes" element={<QuizManagementPage />} />
              <Route path="quizzes/:id/analytics" element={<QuizAnalyticsPage />} />
              <Route path="questions" element={<QuestionBankPage />} />
              <Route path="students" element={<StudentPerformancePage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="lesson-planner" element={<LessonPlannerPage />} />
              <Route path="homework" element={<HomeworkPage />} />
              <Route path="quran" element={<QuranPage />} />
              <Route path="character" element={<CharacterPage />} />
              <Route path="prayer-times" element={<PrayerTimesPage />} />
              <Route path="timetable" element={<TeacherTimetablePage />} />
              <Route path="results" element={<ResultEntryPage />} />
              <Route path="qr-scanner" element={<QRScannerPage />} />
              <Route path="change-password" element={<ChangePasswordPage />} />
            </Route>

            <Route
              path="/parent"
              element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ParentDashboard />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="fees" element={<FeeStatusPage />} />
              <Route path="attendance" element={<StudentAttendancePage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="prayer-times" element={<PrayerTimesPage />} />
              <Route path="whatsapp" element={<WhatsAppOptInPage />} />
              <Route path="child-results" element={<MyResultsPage />} />
              <Route path="change-password" element={<ChangePasswordPage />} />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['mudeer']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="subjects" element={<SubjectManagementPage />} />
              <Route path="enrollments" element={<EnrollmentManagementPage />} />
              <Route path="exams" element={<ExamManagementPage />} />
              <Route path="parent-students" element={<ParentStudentPage />} />
              <Route path="interventions" element={<InterventionAlertsPage />} />
              <Route path="engagement" element={<AdminEngagementPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="reports" element={<StudentReportPage />} />
              <Route path="academic" element={<AcademicPage />} />
              <Route path="admissions" element={<AdmissionsPage />} />
              <Route path="at-risk" element={<AtRiskPage />} />
              <Route path="teacher-workload" element={<TeacherWorkloadPage />} />
              <Route path="character" element={<CharacterPage />} />
              <Route path="whatsapp" element={<WhatsAppPage />} />
              <Route path="prayer-times" element={<PrayerTimesPage />} />
              <Route path="results" element={<ResultsPublishPage />} />
            </Route>

            <Route
              path="/board"
              element={
                <ProtectedRoute allowedRoles={['idaarah']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<BoardDashboard />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="lesson-planner" element={<LessonPlannerPage />} />
              <Route path="homework" element={<HomeworkPage />} />
              <Route path="reports" element={<StudentReportPage />} />
              <Route path="engagement" element={<AdminEngagementPage />} />
              <Route path="prayer-times" element={<PrayerTimesPage />} />
              <Route path="change-password" element={<ChangePasswordPage />} />
            </Route>

            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </Suspense>
          </ErrorBoundary>
        </Router>
      </AuthProvider>
      </ThemeProvider>
      </LanguageProvider>
  );
}

export default App;
