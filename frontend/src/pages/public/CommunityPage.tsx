import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export default function CommunityPage() {
  const { dir, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const l = (en: string, ar: string) => (language === 'ar' ? ar : en);

  const cards = [
    {
      title: l('Follow us on GitHub', 'تابعنا على GitHub'),
      desc: l('Explore the source code and watch the project grow.', 'استكشف الكود المصدري وتابع نمو المشروع.'),
      href: 'https://github.com/madrasah-lms',
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
      ),
    },
    {
      title: l('Report a bug', 'أبلغ عن مشكلة'),
      desc: l('Found something wrong? Let us know so we can fix it.', 'وجدت مشكلة؟ أخبرنا حتى نتمكن من إصلاحها.'),
      href: 'https://github.com/madrasah-lms/issues',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      ),
    },
    {
      title: l('Request a feature', 'اطلب ميزة جديدة'),
      desc: l('Tell us what you would like to see next.', 'أخبرنا بما تود رؤيته في المستقبل.'),
      href: 'https://github.com/madrasah-lms/issues',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
      ),
    },
    {
      title: l('Contribute', 'ساهم في التطوير'),
      desc: l('Help improve the platform — every contribution counts.', 'ساعد في تحسين المنصة — كل مساهمة مهمة.'),
      href: 'https://github.com/madrasah-lms',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
      ),
    },
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
            {l('Community', 'المجتمع')}
          </span>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">{l('Join the Madrasah LMS community', 'انضم إلى مجتمع منصة مدرسة LMS')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-gray-500 dark:text-gray-400">
            {l('Share ideas, report issues and help shape the future of the platform.', 'شارك أفكارك، وأبلغ عن المشكلات، وساعد في رسم مستقبل المنصة.')}
          </p>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {cards.map(card => (
            <a
              key={card.title}
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 transition-all hover:-translate-y-1 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{card.title}</h2>
                <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{card.desc}</p>
            </a>
          ))}
        </div>
      </main>

      <footer className="mt-12 border-t dark:border-gray-800 py-8 text-center text-sm text-gray-500">
        <Link to="/" className="hover:text-emerald-600 transition-colors">{l('Back to Home', 'العودة للرئيسية')}</Link>
      </footer>
    </div>
  );
}
