import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { User } from '../types';

interface NavLink {
  labelKey: string;
  path: string;
}

const roleNavLinks: Record<User['role'], NavLink[]> = {
  student: [
    { labelKey: 'nav.dashboard', path: '/dashboard' },
    { labelKey: 'nav.availableQuizzes', path: '/quizzes' },
    { labelKey: 'nav.myResults', path: '/results' },
    { labelKey: 'nav.exams', path: '/exams' },
  ],
  ustaadh: [
    { labelKey: 'nav.dashboard', path: '/dashboard' },
    { labelKey: 'nav.myQuizzes', path: '/quizzes' },
    { labelKey: 'nav.questionBank', path: '/questions' },
    { labelKey: 'nav.students', path: '/students' },
  ],
  parent: [
    { labelKey: 'nav.dashboard', path: '/dashboard' },
  ],
  mudeer: [
    { labelKey: 'nav.dashboard', path: '/dashboard' },
    { labelKey: 'nav.users', path: '/users' },
    { labelKey: 'nav.subjects', path: '/subjects' },
    { labelKey: 'nav.exams', path: '/exams' },
    { labelKey: 'nav.enrollments', path: '/enrollments' },
  ],
  idaarah: [
    { labelKey: 'nav.dashboard', path: '/dashboard' },
  ],
};

const rolePrefixMap: Record<User['role'], string> = {
  student: '/student',
  ustaadh: '/teacher',
  parent: '/parent',
  mudeer: '/admin',
  idaarah: '/board',
};

const roleLabelKeys: Record<User['role'], string> = {
  student: 'roles.student',
  ustaadh: 'roles.ustaadh',
  parent: 'roles.parent',
  mudeer: 'roles.mudeer',
  idaarah: 'roles.idaarah',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = user ? roleNavLinks[user.role].map(l => ({
    ...l,
    label: t(l.labelKey),
    path: `${rolePrefixMap[user.role]}${l.path}`,
  })) : [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-islamic-dark text-white">
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
        <span className="text-lg font-semibold">{t('nav.schoolLms')}</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link, i) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setSidebarOpen(false)}
              className={`nav-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium opacity-0 animate-slide-up ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="border-t border-white/10 p-4">
          <p className="text-xs text-gray-400">{t(roleLabelKeys[user.role])}</p>
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
        <div className="fixed inset-0 z-40 lg:hidden animate-fade-in">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 end-0 z-50 w-64 sidebar-slide-enter">
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
              className="btn-press rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
              aria-label={t('common.openMenu')}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-islamic-dark">
              {user?.madrasah_name || t('nav.schoolLms')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="btn-press flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              title={t('common.toggleLanguage')}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              {language === 'ar' ? 'EN' : 'عربي'}
            </button>

            {user && (
              <div className="hidden text-end sm:block">
                <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                <p className="text-xs text-gray-500">{t(roleLabelKeys[user.role])}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="btn-press rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t('nav.logout')}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="page-enter"><Outlet /></div></main>
      </div>
    </div>
  );
}
