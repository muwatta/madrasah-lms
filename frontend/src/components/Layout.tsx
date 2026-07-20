import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { notificationAPI } from '../api';
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
    { labelKey: 'nav.progress', path: '/progress' },
    { labelKey: 'nav.attendance', path: '/attendance' },
    { labelKey: 'nav.homework', path: '/homework' },
    { labelKey: 'nav.portfolio', path: '/portfolio' },
    { labelKey: 'nav.announcements', path: '/announcements' },
    { labelKey: 'nav.messages', path: '/messages' },
    { labelKey: 'nav.prayerTimes', path: '/prayer-times' },
    { labelKey: 'nav.career', path: '/career' },
    { labelKey: 'nav.aiTutor', path: '/tutor' },
    { labelKey: 'nav.learningPath', path: '/path' },
    { labelKey: 'nav.flashcards', path: '/flashcards' },
    { labelKey: 'nav.character', path: '/character' },
  ],
  ustaadh: [
    { labelKey: 'nav.dashboard', path: '/dashboard' },
    { labelKey: 'nav.myQuizzes', path: '/quizzes' },
    { labelKey: 'nav.questionBank', path: '/questions' },
    { labelKey: 'nav.students', path: '/students' },
    { labelKey: 'nav.lessonPlanner', path: '/lesson-planner' },
    { labelKey: 'nav.homework', path: '/homework' },
    { labelKey: 'nav.quran', path: '/quran' },
    { labelKey: 'nav.character', path: '/character' },
    { labelKey: 'nav.attendance', path: '/attendance' },
    { labelKey: 'nav.announcements', path: '/announcements' },
    { labelKey: 'nav.messages', path: '/messages' },
    { labelKey: 'nav.prayerTimes', path: '/prayer-times' },
  ],
  parent: [
    { labelKey: 'nav.dashboard', path: '/dashboard' },
    { labelKey: 'nav.messages', path: '/messages' },
    { labelKey: 'nav.attendance', path: '/attendance' },
    { labelKey: 'nav.feeStatus', path: '/fees' },
    { labelKey: 'nav.announcements', path: '/announcements' },
    { labelKey: 'nav.prayerTimes', path: '/prayer-times' },
  ],
  mudeer: [
    { labelKey: 'nav.dashboard', path: '/dashboard' },
    { labelKey: 'nav.users', path: '/users' },
    { labelKey: 'nav.subjects', path: '/subjects' },
    { labelKey: 'nav.exams', path: '/exams' },
    { labelKey: 'nav.enrollments', path: '/enrollments' },
    { labelKey: 'nav.finance', path: '/finance' },
    { labelKey: 'nav.attendance', path: '/attendance' },
    { labelKey: 'nav.announcements', path: '/announcements' },
    { labelKey: 'nav.reports', path: '/reports' },
    { labelKey: 'nav.interventions', path: '/interventions' },
    { labelKey: 'nav.engagement', path: '/engagement' },
    { labelKey: 'nav.messages', path: '/messages' },
    { labelKey: 'nav.academic', path: '/academic' },
    { labelKey: 'nav.admissions', path: '/admissions' },
    { labelKey: 'nav.atRisk', path: '/at-risk' },
    { labelKey: 'nav.teacherWorkload', path: '/teacher-workload' },
    { labelKey: 'nav.character', path: '/character' },
    { labelKey: 'nav.whatsapp', path: '/whatsapp' },
    { labelKey: 'nav.prayerTimes', path: '/prayer-times' },
  ],
  idaarah: [
    { labelKey: 'nav.dashboard', path: '/dashboard' },
    { labelKey: 'nav.finance', path: '/finance' },
    { labelKey: 'nav.attendance', path: '/attendance' },
    { labelKey: 'nav.announcements', path: '/announcements' },
    { labelKey: 'nav.reports', path: '/reports' },
    { labelKey: 'nav.engagement', path: '/engagement' },
    { labelKey: 'nav.prayerTimes', path: '/prayer-times' },
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

const roleColors: Record<User['role'], string> = {
  student: 'bg-emerald-500',
  ustaadh: 'bg-blue-500',
  parent: 'bg-purple-500',
  mudeer: 'bg-amber-500',
  idaarah: 'bg-rose-500',
};

export default function Layout() {
  const { user, logout, switchAccount, getStoredSessions, removeStoredSession } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    notificationAPI.unreadCount()
      .then(res => setUnreadCount(res.data.count))
      .catch(() => {});
  }, []);

  const loadNotifications = () => {
    notificationAPI.list()
      .then(res => setNotifications(res.data.results ?? res.data))
      .catch(() => {});
  };

  const handleMarkAllRead = () => {
    notificationAPI.markAllRead().then(() => {
      setUnreadCount(0);
      setNotifications([]);
    }).catch(() => {});
  };

  const handleMarkRead = (id: number) => {
    notificationAPI.markRead(id).then(() => {
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.filter(n => n.id !== id));
    }).catch(() => {});
  };

  const toggleNotifMenu = () => {
    if (!notifMenuOpen) {
      loadNotifications();
    }
    setNotifMenuOpen(!notifMenuOpen);
  };

  const links = user ? roleNavLinks[user.role].map(l => ({
    ...l,
    label: t(l.labelKey),
    path: `${rolePrefixMap[user.role]}${l.path}`,
  })) : [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchAccount = (email: string) => {
    const success = switchAccount(email);
    if (success) {
      setAccountMenuOpen(false);
      const sessions = getStoredSessions();
      const session = sessions.find(s => s.user.email === email);
      if (session) {
        const prefix = rolePrefixMap[session.user.role];
        navigate(`${prefix}/dashboard`);
      }
    }
  };

  const handleRemoveAccount = (email: string) => {
    removeStoredSession(email);
    setAccountMenuOpen(false);
  };

  const storedSessions = getStoredSessions();
  const otherAccounts = storedSessions.filter(s => s.user.email !== user?.email);

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

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="btn-press flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              title={t('common.toggleLanguage')}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span className="hidden sm:inline">{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={toggleNotifMenu}
                className="btn-press relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
                title={t('common.notifications')}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {notifMenuOpen && (
                <div className="absolute end-0 top-full z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg animate-scale-in">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">{t('common.notifications')}</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        {t('common.markAllRead')}
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 && (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm text-gray-400">{t('common.noNotifications')}</p>
                      </div>
                    )}
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="flex items-start gap-3 border-b border-gray-50 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                          {notif.message && (
                            <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{notif.message}</p>
                          )}
                          <p className="mt-1 text-[11px] text-gray-400">{notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkRead(notif.id); }}
                          className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                          title={t('common.markRead')}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Account switcher */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="btn-press flex items-center gap-2 rounded-lg border border-gray-200 py-1.5 ps-1.5 pe-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {user && (
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ${roleColors[user.role]}`}>
                    {user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                )}
                <svg className={`h-3.5 w-3.5 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {accountMenuOpen && (
                <div className="absolute end-0 top-full z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white py-2 shadow-lg animate-scale-in">
                  {/* Current account */}
                  {user && (
                    <div className="border-b border-gray-100 px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[11px] font-medium uppercase text-gray-400">{t('common.currentAccount')}</p>
                        <button
                          onClick={handleLogout}
                          className="text-[11px] font-medium text-red-500 hover:text-red-600 transition-colors"
                        >
                          {t('nav.logout')}
                        </button>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${roleColors[user.role]}`}>
                          {user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Other accounts */}
                  {otherAccounts.length > 0 && (
                    <div className="px-2 py-1">
                      <p className="px-2 py-1 text-[11px] font-medium uppercase text-gray-400">{t('common.savedAccounts')}</p>
                      {otherAccounts.map((session) => (
                        <div key={session.user.email} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-50 transition-colors group">
                          <button
                            onClick={() => handleSwitchAccount(session.user.email)}
                            className="flex flex-1 items-center gap-2.5 text-start"
                          >
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${roleColors[session.user.role]}`}>
                              {session.user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{session.user.full_name}</p>
                              <p className="text-xs text-gray-500 truncate">{t('roles.' + session.user.role)} — {session.user.email}</p>
                            </div>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveAccount(session.user.email); }}
                            className="shrink-0 rounded p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                            title={t('common.removeAccount')}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {otherAccounts.length === 0 && (
                    <div className="px-4 py-3 text-center">
                      <p className="text-xs text-gray-400">{t('common.noOtherAccounts')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="page-enter"><Outlet /></div></main>
      </div>
    </div>
  );
}
