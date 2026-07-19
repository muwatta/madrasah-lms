import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import QuizListPage from './pages/student/QuizListPage';
import QuizTakePage from './pages/student/QuizTakePage';
import QuizResultsPage from './pages/student/QuizResultsPage';
import ExamResultsPage from './pages/student/ExamResultsPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import QuizManagementPage from './pages/teacher/QuizManagementPage';
import QuestionBankPage from './pages/teacher/QuestionBankPage';
import StudentPerformancePage from './pages/teacher/StudentPerformancePage';
import ParentDashboard from './pages/parent/ParentDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import SubjectManagementPage from './pages/admin/SubjectManagementPage';
import EnrollmentManagementPage from './pages/admin/EnrollmentManagementPage';
import ExamManagementPage from './pages/admin/ExamManagementPage';
import ParentStudentPage from './pages/admin/ParentStudentPage';
import BoardDashboard from './pages/board/BoardDashboard';

function App() {
  return (
      <LanguageProvider>
      <AuthProvider>
        <Router>
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
        </Router>
      </AuthProvider>
      </LanguageProvider>
  );
}

export default App;
