import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export default function AboutPage() {
  const { dir, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

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
        <h1 className="text-4xl font-bold mb-4">{language === 'ar' ? 'عن المنصة' : 'About Madrasah LMS'}</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-12">{language === 'ar' ? 'منصة متكاملة لإدارة المدارس الإسلامية' : 'A comprehensive management platform for Islamic schools'}</p>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">{language === 'ar' ? 'رسالتنا' : 'Our Mission'}</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{language === 'ar' ? 'نسعى لتوفير حل تقني متكامل يلبي احتياجات المدارس الإسلامية، ويسهل إدارة العمليات التعليمية والإدارية، مع الحفاظ على الهوية الإسلامية واللغة العربية.' : 'We aim to provide a complete technical solution that meets the needs of Islamic schools, streamlining educational and administrative operations while preserving Islamic identity and the Arabic language.'}</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">{language === 'ar' ? 'رؤيتنا' : 'Our Vision'}</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{language === 'ar' ? 'أن نكون المنصة الرائدة في إدارة المدارس الإسلامية على مستوى العالم، نساهم في تطوير التعليم الإسلامي من خلال التكنولوجيا.' : 'To be the leading platform for Islamic school management worldwide, contributing to the advancement of Islamic education through technology.'}</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">{language === 'ar' ? 'قيمنا' : 'Our Values'}</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { ar: 'الجودة', en: 'Quality' },
              { ar: 'الأمانة', en: 'Trustworthiness' },
              { ar: 'الابتكار', en: 'Innovation' },
              { ar: 'الشمولية', en: 'Comprehensiveness' },
            ].map(v => (
              <div key={v.en} className="rounded-xl border p-5 dark:border-gray-700">
                <h3 className="font-semibold text-lg mb-2">{language === 'ar' ? v.ar : v.en}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? `نلتزم بـ ${v.ar} في كل ما نقدمه` : `We are committed to ${v.en} in everything we deliver`}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t dark:border-gray-800 py-8 text-center text-sm text-gray-500">
        <Link to="/" className="hover:text-emerald-600 transition-colors">{language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</Link>
      </footer>
    </div>
  );
}
