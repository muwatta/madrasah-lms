import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export default function HelpCenterPage() {
  const { dir, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const l = (en: string, ar: string) => (language === 'ar' ? ar : en);

  const channels = [
    {
      title: l('Platform Documentation', 'توثيق المنصة'),
      desc: l('Step-by-step guides for every part of Madrasah LMS.', 'أدلة خطوة بخطوة لكل جزء من منصة مدرسة LMS.'),
      to: '/docs',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
      ),
    },
    {
      title: l('FAQ', 'الأسئلة الشائعة'),
      desc: l('Quick answers to the most common questions.', 'إجابات سريعة على أكثر الأسئلة شيوعاً.'),
      to: '/faq',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ),
    },
    {
      title: l('Contact Support', 'تواصل مع الدعم'),
      desc: l('Send us a message and we will reply as soon as possible.', 'أرسل لنا رسالة وسنرد عليك في أقرب وقت ممكن.'),
      to: '/contact',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
      ),
    },
    {
      title: l('Community', 'المجتمع'),
      desc: l('Share ideas, ask questions and help shape the platform.', 'شارك أفكارك واطرح أسئلتك وساعد في تطوير المنصة.'),
      to: '/community',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      ),
    },
  ];

  const quickLinks = [
    { label: l('Creating a new account', 'إنشاء حساب جديد'), to: '/docs' },
    { label: l('Setting up your school and classes', 'إعداد المدرسة والصفوف'), to: '/docs' },
    { label: l('Adding students and teachers', 'إضافة الطلاب والمعلمين'), to: '/docs' },
    { label: l('Managing quizzes and homework', 'إدارة الاختبارات والواجبات'), to: '/docs' },
    { label: l('Taking attendance', 'تسجيل الحضور'), to: '/docs' },
    { label: l('Communicating with parents', 'التواصل مع أولياء الأمور'), to: '/docs' },
  ];

  return (
    <div dir={dir} className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased">
      <nav className="sticky top-0 z-50 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm" style={{ borderColor: 'var(--color-border)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-lg font-bold text-white">M</div>
            <span className="text-xl font-bold tracking-tight">Madrasah<span className="text-emerald-600 dark:text-emerald-400">LMS</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              {theme === 'dark' ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            </button>
            <button onClick={toggleLanguage} className="h-8 w-8 rounded-lg text-xs font-bold border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">{language === 'ar' ? 'EN' : 'ع'}</button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <header className="text-center">
          <span className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            {l('Help Center', 'مركز المساعدة')}
          </span>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">{l('How can we help you?', 'كيف يمكننا مساعدتك؟')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-gray-500 dark:text-gray-400">
            {l('Browse the documentation, check the FAQ, or get in touch with our team.', 'تصفح التوثيق، أو راجع الأسئلة الشائعة، أو تواصل مع فريقنا.')}
          </p>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {channels.map(channel => (
            <Link
              key={channel.title}
              to={channel.to}
              className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 transition-all hover:-translate-y-1 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                {channel.icon}
              </div>
              <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">{channel.title}</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{channel.desc}</p>
            </Link>
          ))}
        </div>

        <section className="mt-16">
          <h2 className="text-center text-xl font-bold text-gray-900 dark:text-white">{l('Popular topics', 'موضوعات شائعة')}</h2>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickLinks.map(link => (
              <Link key={link.label} to={link.to} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-600 dark:text-gray-300 transition-colors hover:border-emerald-300 dark:hover:border-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400">
                <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-12 border-t dark:border-gray-800 py-8 text-center text-sm text-gray-500">
        <Link to="/" className="hover:text-emerald-600 transition-colors">{l('Back to Home', 'العودة للرئيسية')}</Link>
      </footer>
    </div>
  );
}
