import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
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

function App() {
  return (
      <LanguageProvider>
      <AuthProvider>
        <Router>
          <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="text-emerald-600 text-lg">Loading...</div></div>}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

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
              <Route path="questions" element={<QuestionBankPage />} />
              <Route path="students" element={<StudentPerformancePage />} />
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
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
      </LanguageProvider>
  );
}

export default App;
