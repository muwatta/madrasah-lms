import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export default function DocsPage() {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const sections = [
    { title: { ar: 'بدء الاستخدام', en: 'Getting Started' }, items: [
      { ar: 'إنشاء حساب جديد', en: 'Creating a new account' },
      { ar: 'إعداد المدرسة والصفوف', en: 'Setting up your school and classes' },
      { ar: 'إضافة الطلاب والمعلمين', en: 'Adding students and teachers' },
    ]},
    { title: { ar: 'الميزات الأساسية', en: 'Core Features' }, items: [
      { ar: 'إدارة الاختبارات والواجبات', en: 'Managing quizzes and homework' },
      { ar: 'تسجيل الحضور', en: 'Taking attendance' },
      { ar: 'التواصل مع أولياء الأمور', en: 'Communicating with parents' },
    ]},
    { title: { ar: 'الميزات المتقدمة', en: 'Advanced Features' }, items: [
      { ar: 'المدرس الذكي بالذكاء الاصطناعي', en: 'AI Tutor' },
      { ar: 'تتبع حفظ القرآن', en: 'Quran memorisation tracking' },
      { ar: 'التقارير والتحليلات', en: 'Reports and analytics' },
    ]},
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 antialiased" dir={dir}>
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-lg">M</div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">Madrasah<span className="text-emerald-600 dark:text-emerald-400">LMS</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={toggleLanguage} className="w-8 h-8 rounded-lg text-xs font-bold border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">{language === 'ar' ? 'EN' : 'ع'}</button>
          <button onClick={toggleTheme} className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
            {theme === 'dark' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">{t('landing.footerDocumentation')}</span>
        <h1 className="mt-4 text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
          {language === 'ar' ? 'توثيق المنصة' : 'Platform Documentation'}
        </h1>
        <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-2xl">
          {language === 'ar' ? 'كل ما تحتاج لمعرفته عن منصة مدرسة LMS' : 'Everything you need to know about Madrasah LMS'}
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {sections.map((section, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{section.title[language]}</h2>
              <ul className="space-y-3">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    {item[language]}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-gray-900 dark:bg-black text-gray-400 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm">
          <Link to="/" className="hover:text-white transition-colors">{language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</Link>
        </div>
      </footer>
    </div>
  );
}
