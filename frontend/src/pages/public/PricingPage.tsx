import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export default function PricingPage() {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const plans = [
    { name: { ar: 'أساسي', en: 'Starter' }, price: { ar: 'مجاناً', en: 'Free' }, students: '1-30', features: [t('common.subjects'), t('common.attendance'), t('common.homework'), t('common.messages')] },
    { name: { ar: 'احترافي', en: 'Professional' }, price: { ar: '99 ريال/شهر', en: '$29/mo' }, students: '30-200', features: [t('student.exams'), t('student.quizzes'), t('nav.whatsapp'), t('nav.aiTutor'), t('student.reports')] },
    { name: { ar: 'مؤسسة', en: 'Enterprise' }, price: { ar: 'اتصل بنا', en: 'Contact us' }, students: '200+', features: [t('common.all'), t('nav.career'), t('nav.certificates'), t('nav.analytics'), t('common.support')] },
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
          <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">{t('auth.signIn')}</Link>
          <Link to="/register" className="text-sm font-medium bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700">{t('landing.getStarted')}</Link>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">{t('landing.footerPricing')}</span>
        <h1 className="mt-4 text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
          {language === 'ar' ? 'اختر الخطة المناسبة لمدرستك' : 'Choose the Right Plan for Your Madrasah'}
        </h1>
        <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          {language === 'ar' ? 'خطط مرنة تناسب جميع أحجام المدارس الإسلامية' : 'Flexible plans for Islamic schools of all sizes'}
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div key={i} className={`rounded-2xl p-8 border ${i === 1 ? 'border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 shadow-xl scale-105' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name[language]}</h3>
              <p className="mt-4 text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">{plan.price[language]}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? `لـ ${plan.students} طالب` : `Up to ${plan.students} students`}</p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600 dark:text-gray-400">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className={`mt-8 block w-full py-3 rounded-xl text-sm font-semibold text-center ${i === 1 ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'border border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}>
                {language === 'ar' ? 'ابدأ الآن' : 'Get Started'}
              </Link>
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
