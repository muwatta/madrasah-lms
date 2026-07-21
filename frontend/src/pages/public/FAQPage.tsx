import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const faqs = (language: 'ar' | 'en') => [
  {
    q: language === 'ar' ? 'ما هي منصة مدرسة LMS؟' : 'What is Madrasah LMS?',
    a: language === 'ar' ? 'منصة متكاملة لإدارة المدارس الإسلامية، توفر أدوات لإدارة الطلاب والمعلمين والمناهج والجدول الدراسي والاختبارات والنتائج والتواصل.' : 'A comprehensive Islamic school management platform providing tools for managing students, teachers, curricula, schedules, exams, results, and communication.',
  },
  {
    q: language === 'ar' ? 'هل المنصة مجانية؟' : 'Is the platform free?',
    a: language === 'ar' ? 'نوفر خطة مجانية للمدارس الصغيرة مع ميزات أساسية. للاطلاع على الخطط المدفوعة والميزات المتقدمة، زر صفحة التسعير.' : 'We offer a free plan for small schools with basic features. For paid plans and advanced features, visit our pricing page.',
  },
  {
    q: language === 'ar' ? 'هل تدعم المنصة اللغة العربية؟' : 'Does the platform support Arabic?',
    a: language === 'ar' ? 'نعم، المنصة تدعم اللغة العربية بالكامل مع واجهة من اليمين إلى اليسار (RTL)، ويمكن التبديل بين العربية والإنجليزية بسهولة.' : 'Yes, the platform fully supports Arabic with a right-to-left (RTL) interface. You can easily switch between Arabic and English.',
  },
  {
    q: language === 'ar' ? 'كيف يمكنني التسجيل؟' : 'How do I sign up?',
    a: language === 'ar' ? 'يمكنك التسجيل عبر صفحة التسجيل باستخدام البريد الإلكتروني. بعد التسجيل، سيتم مراجعة طلبك من قبل فريقنا.' : 'You can sign up through the registration page using your email. After registration, your request will be reviewed by our team.',
  },
  {
    q: language === 'ar' ? 'هل البيانات آمنة؟' : 'Is my data secure?',
    a: language === 'ar' ? 'نعم، نستخدم أحدث معايير التشفير لحماية بياناتك. راجع سياسة الخصوصية للمزيد من التفاصيل.' : 'Yes, we use the latest encryption standards to protect your data. See our privacy policy for details.',
  },
  {
    q: language === 'ar' ? 'هل يمكن تصدير البيانات؟' : 'Can I export data?',
    a: language === 'ar' ? 'نعم، يمكنك تصدير البيانات بصيغة CSV و PDF للتقارير والنتائج والكشوفات.' : 'Yes, you can export data in CSV and PDF formats for reports, results, and statements.',
  },
];

export default function FAQPage() {
  const { dir, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const items = faqs(language);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div dir={dir} className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <nav className="sticky top-0 z-50 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm" style={{ borderColor: 'var(--color-border)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="text-xl font-bold tracking-tight">Madrasah<span className="text-emerald-500">LMS</span></Link>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="w-8 h-8 rounded-lg text-xs border flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">
              {theme === 'dark' ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            </button>
            <button onClick={toggleLanguage} className="w-8 h-8 rounded-lg text-xs font-bold border hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">{language === 'ar' ? 'EN' : 'ع'}</button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-bold mb-2">{language === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-12">{language === 'ar' ? 'أجوبة لأكثر الأسئلة شيوعاً' : 'Answers to the most common questions'}</p>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <span>{item.q}</span>
                <svg className={`h-5 w-5 shrink-0 transition-transform ${openIdx === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIdx === i && (
                <div className="border-t px-5 py-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed dark:border-gray-700">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t dark:border-gray-800 py-8 text-center text-sm text-gray-500">
        <Link to="/" className="hover:text-emerald-600 transition-colors">{language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</Link>
      </footer>
    </div>
  );
}
