import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';

interface NavLink {
  label: string;
  path: string;
  icon: string;
}

const roleNavLinks: Record<User['role'], NavLink[]> = {
  student: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Available Quizzes', path: '/quizzes', icon: '📝' },
    { label: 'My Results', path: '/results', icon: '📈' },
    { label: 'Exams', path: '/exams', icon: '📋' },
  ],
  ustaadh: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'My Quizzes', path: '/quizzes', icon: '📝' },
    { label: 'Questions Bank', path: '/questions', icon: '❓' },
    { label: 'Students', path: '/students', icon: '👥' },
  ],
  parent: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'My Children', path: '/children', icon: '👨‍👩‍👧' },
  ],
  mudeer: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Users', path: '/users', icon: '👤' },
    { label: 'Subjects', path: '/subjects', icon: '📚' },
    { label: 'Quizzes', path: '/quizzes', icon: '📝' },
    { label: 'Exams', path: '/exams', icon: '📋' },
    { label: 'Enrollments', path: '/enrollments', icon: '🎓' },
  ],
  idaarah: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  ],
};

const rolePrefixMap: Record<User['role'], string> = {
  student: '/student',
  ustaadh: '/teacher',
  parent: '/parent',
  mudeer: '/admin',
  idaarah: '/board',
};

const roleLabels: Record<User['role'], string> = {
  student: 'Student',
  ustaadh: 'Ustaadh',
  parent: 'Parent',
  mudeer: 'Mudeer',
  idaarah: 'Idaarah',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = user ? roleNavLinks[user.role].map(l => ({
    ...l,
    path: `${rolePrefixMap[user.role]}${l.path}`,
  })) : [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-islamic-dark text-white">
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
        <span className="text-lg font-bold text-islamic-gold">🕌</span>
        <span className="text-lg font-semibold">Madrasah LMS</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="border-t border-white/10 p-4">
          <p className="text-xs text-gray-400">{roleLabels[user.role]}</p>
          <p className="truncate text-sm font-medium">{user.full_name}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">{sidebarContent}</aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-islamic-dark">
              {user?.madrasah_name || 'Madrasah LMS'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                <p className="text-xs text-gray-500">{roleLabels[user.role]}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
