import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export default function PrivacyPage() {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

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

      <section className="max-w-3xl mx-auto px-6 py-20">
        <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">{t('landing.footerPrivacy')}</span>
        <h1 className="mt-4 text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
          {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
        </h1>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'آخر تحديث: يناير 2025' : 'Last updated: January 2025'}</p>

        <div className="mt-10 space-y-8 text-gray-600 dark:text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{language === 'ar' ? 'المقدمة' : 'Introduction'}</h2>
            <p>{language === 'ar'
              ? 'نحن في مدرسة LMS نلتزم بحماية خصوصية مستخدمينا. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك الشخصية.'
              : 'At Madrasah LMS, we are committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information.'}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{language === 'ar' ? 'المعلومات التي نجمعها' : 'Information We Collect'}</h2>
            <p>{language === 'ar'
              ? 'نجمع المعلومات الأساسية اللازمة لتشغيل المنصة: الاسم، البريد الإلكتروني، الدور (طالب، معلم، ولي أمر، مدير)، وبيانات الأداء الأكاديمي.'
              : 'We collect basic information needed to operate the platform: name, email, role (student, teacher, parent, admin), and academic performance data.'}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{language === 'ar' ? 'كيف نستخدم معلوماتك' : 'How We Use Your Information'}</h2>
            <p>{language === 'ar'
              ? 'نستخدم معلوماتك فقط لتوفير وتحسين خدمات المنصة، والتواصل معك بشأن المدرسة، ولأغراض تحليلية داخلية. لا نشارك معلوماتك مع أطراف ثالثة.'
              : 'We use your information solely to provide and improve the platform, communicate with you about school matters, and for internal analytics. We do not share your data with third parties.'}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{language === 'ar' ? 'حماية البيانات' : 'Data Security'}</h2>
            <p>{language === 'ar'
              ? 'نستخدم التشفير المعياري لحماية بياناتك أثناء النقل والتخزين. نقوم بنسخ احتياطي للبيانات بشكل منتظم. يمكنك طلب حذف بياناتك في أي وقت.'
              : 'We use industry-standard encryption to protect your data in transit and at rest. Regular backups are performed. You may request deletion of your data at any time.'}</p>
          </section>
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
