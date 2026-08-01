import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const SUPPORT_EMAIL = 'support@madrasah-lms.com';

export default function ContactPage() {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [sent, setSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const l = (en: string, ar: string) => (language === 'ar' ? ar : en);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Contact request from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  };

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

      <section className="max-w-2xl mx-auto px-6 py-20">
        <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">{t('landing.footerContactUs')}</span>
        <h1 className="mt-4 text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
          {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
        </h1>
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          {language === 'ar' ? 'يسعدنا التواصل معك. أرسل لنا رسالة وسنرد في أقرب وقت.' : "We'd love to hear from you. Send us a message and we'll respond as soon as possible."}
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-colors hover:border-emerald-300 dark:hover:border-emerald-600">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{l('Email', 'البريد الإلكتروني')}</div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{SUPPORT_EMAIL}</div>
            </div>
          </a>
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{l('Response time', 'وقت الاستجابة')}</div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{l('Within 24 hours', 'خلال 24 ساعة')}</div>
            </div>
          </div>
        </div>

        {sent ? (
          <div className="mt-12 p-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-center border border-emerald-200 dark:border-emerald-800">
            <svg className="w-16 h-16 mx-auto text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              {language === 'ar' ? 'تم إرسال رسالتك!' : 'Your message has been sent!'}
            </p>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {language === 'ar' ? 'تم فتح تطبيق البريد لديك لإكمال الإرسال. سنعود إليك في أقرب وقت ممكن.' : "Your email app has been opened to finish sending. We'll get back to you as soon as possible."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-12 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.email')}</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الرسالة' : 'Message'}</label>
              <textarea rows={5} required value={message} onChange={e => setMessage(e.target.value)} className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
            </div>
            <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
              {language === 'ar' ? 'إرسال' : 'Send Message'}
            </button>
          </form>
        )}
      </section>

      <footer className="bg-gray-900 dark:bg-black text-gray-400 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm">
          <Link to="/" className="hover:text-white transition-colors">{language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</Link>
        </div>
      </footer>
    </div>
  );
}
