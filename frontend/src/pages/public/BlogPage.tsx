import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const posts = (language: 'ar' | 'en') => [
  {
    title: language === 'ar' ? 'كيف تبدأ مع مدرسة LMS' : 'Getting Started with Madrasah LMS',
    excerpt: language === 'ar' ? 'دليل شامل لبدء استخدام المنصة وإعداد مدرستك في خطوات بسيطة.' : 'A comprehensive guide to getting started with the platform and setting up your school in simple steps.',
    date: language === 'ar' ? 'يناير 2025' : 'January 2025',
    slug: 'getting-started',
  },
  {
    title: language === 'ar' ? 'أهمية التكنولوجيا في التعليم الإسلامي' : 'The Importance of Technology in Islamic Education',
    excerpt: language === 'ar' ? 'كيف يمكن للتكنولوجيا أن تساعد في تطوير المناهج الإسلامية وتحسين تجربة التعلم.' : 'How technology can help develop Islamic curricula and improve the learning experience.',
    date: language === 'ar' ? 'ديسمبر 2024' : 'December 2024',
    slug: 'technology-islamic-education',
  },
  {
    title: language === 'ar' ? 'إدارة الفصول الدراسية بفعالية' : 'Effective Classroom Management',
    excerpt: language === 'ar' ? 'أفضل الممارسات لإدارة الفصول الدراسية في المدارس الإسلامية باستخدام الأدوات الرقمية.' : 'Best practices for managing classrooms in Islamic schools using digital tools.',
    date: language === 'ar' ? 'نوفمبر 2024' : 'November 2024',
    slug: 'effective-classroom-management',
  },
];

export default function BlogPage() {
  const { dir, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const items = posts(language);

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

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-bold mb-2">{language === 'ar' ? 'المدونة' : 'Blog'}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-12">{language === 'ar' ? 'آخر المقالات والأخبار عن المنصة' : 'Latest articles and news about the platform'}</p>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((post, i) => (
            <article key={post.slug} className="group rounded-xl border dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                <span className="text-white/80 text-4xl font-bold">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="p-5">
                <p className="text-xs text-gray-400 mb-2">{post.date}</p>
                <h2 className="font-semibold mb-2 group-hover:text-emerald-600 transition-colors">{post.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">{post.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </main>

      <footer className="border-t dark:border-gray-800 py-8 text-center text-sm text-gray-500">
        <Link to="/" className="hover:text-emerald-600 transition-colors">{language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</Link>
      </footer>
    </div>
  );
}
