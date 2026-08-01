import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

type Text = { en: string; ar: string };

type DocBlock =
  | { type: 'p'; text: Text }
  | { type: 'h'; text: Text }
  | { type: 'ol'; items: Text[] }
  | { type: 'ul'; items: Text[] }
  | { type: 'tip'; text: Text };

type DocTopic = {
  id: string;
  title: Text;
  blocks: DocBlock[];
};

type DocSection = {
  title: Text;
  topics: DocTopic[];
};

const docs: DocSection[] = [
  {
    title: { en: 'Getting Started', ar: 'بدء الاستخدام' },
    topics: [
      {
        id: 'create-account',
        title: { en: 'Creating a new account', ar: 'إنشاء حساب جديد' },
        blocks: [
          { type: 'p', text: { en: 'Learn how to create your Madrasah LMS account and complete the signup process.', ar: 'تعرف على كيفية إنشاء حسابك في منصة مدرسة LMS وإكمال عملية التسجيل.' } },
          { type: 'h', text: { en: 'Steps', ar: 'الخطوات' } },
          { type: 'ol', items: [
            { en: 'Click "Start Free Trial" or "Register" on the landing page.', ar: 'اضغط على "ابدأ النسخة التجريبية المجانية" أو "سجّل" في الصفحة الرئيسية.' },
            { en: 'Fill in your full name, work email, and a secure password.', ar: 'أدخل اسمك الكامل والبريد الإلكتروني وكلمة مرور آمنة.' },
            { en: 'Submit the registration form.', ar: 'أرسل نموذج التسجيل.' },
            { en: 'Verify your email address using the link we send you.', ar: 'أكّد عنوان بريدك الإلكتروني عبر الرابط الذي نرسله إليك.' },
            { en: 'Your account enters a review queue — once approved, you can log in.', ar: 'يدخل حسابك قائمة المراجعة — وبعد الموافقة يمكنك تسجيل الدخول.' },
          ] },
          { type: 'tip', text: { en: 'Use an email you check regularly — all platform notifications, quiz results and announcements are delivered there.', ar: 'استخدم بريداً إلكترونياً تتفقده باستمرار — إذ تُرسل إليه جميع إشعارات المنصة ونتائج الاختبارات والإعلانات.' } },
        ],
      },
      {
        id: 'setup-school',
        title: { en: 'Setting up your school and classes', ar: 'إعداد المدرسة والصفوف' },
        blocks: [
          { type: 'p', text: { en: 'Configure your school profile, academic year, classes and subjects.', ar: 'قم بإعداد بيانات مدرستك والعام الدراسي والصفوف والمواد.' } },
          { type: 'h', text: { en: 'Steps', ar: 'الخطوات' } },
          { type: 'ol', items: [
            { en: 'From the Admin dashboard, open Settings → School.', ar: 'من لوحة تحكم المدير، افتح الإعدادات ← المدرسة.' },
            { en: 'Enter your school name, logo, contact details, and academic year.', ar: 'أدخل اسم المدرسة والشعار وبيانات التواصل والعام الدراسي.' },
            { en: 'Create classes (e.g., Grade 4A) and assign each to a teacher.', ar: 'أنشئ الصفوف (مثل: الصف الرابع أ) وخصّص معلم لكل صف.' },
            { en: 'Add the subjects your classes will study.', ar: 'أضف المواد التي سيدرسها الطلاب.' },
          ] },
          { type: 'tip', text: { en: 'Classes and subjects created here appear everywhere — attendance, quizzes, homework and reports.', ar: 'تظهر الصفوف والمواد التي تنشئها هنا في كل مكان — الحضور والاختبارات والواجبات والتقارير.' } },
        ],
      },
      {
        id: 'add-users',
        title: { en: 'Adding students and teachers', ar: 'إضافة الطلاب والمعلمين' },
        blocks: [
          { type: 'p', text: { en: 'Invite students and teachers to the platform and organise them into classes.', ar: 'أضف الطلاب والمعلمين إلى المنصة ونظّمهم داخل الصفوف.' } },
          { type: 'h', text: { en: 'Steps', ar: 'الخطوات' } },
          { type: 'ol', items: [
            { en: 'Go to Admin → Users and click "Add User".', ar: 'انتقل إلى المدير ← المستخدمون واضغط "إضافة مستخدم".' },
            { en: 'Choose a role — Student or Teacher.', ar: 'اختر الدور — طالب أو معلم.' },
            { en: 'Enter their name and email; add the parent contact for students.', ar: 'أدخل الاسم والبريد الإلكتروني، وأضف بيانات ولي الأمر للطلاب.' },
            { en: 'Assign students to a class and teachers to their subjects.', ar: 'خصّص الطلاب لصفوفهم والمعلمين لموادهم.' },
          ] },
          { type: 'p', text: { en: 'You can also add many users at once with CSV import — download the template from the Users page.', ar: 'يمكنك أيضاً إضافة عدد كبير من المستخدمين دفعة واحدة عبر استيراد ملف CSV — حمّل القالب من صفحة المستخدمين.' } },
        ],
      },
    ],
  },
  {
    title: { en: 'Core Features', ar: 'الميزات الأساسية' },
    topics: [
      {
        id: 'quizzes-homework',
        title: { en: 'Managing quizzes and homework', ar: 'إدارة الاختبارات والواجبات' },
        blocks: [
          { type: 'p', text: { en: 'Madrasah LMS lets teachers build quizzes and homework quickly and track completion automatically.', ar: 'تتيح منصة مدرسة LMS للمعلمين إنشاء الاختبارات والواجبات بسرعة ومتابعة إنجازها تلقائياً.' } },
          { type: 'h', text: { en: 'Steps', ar: 'الخطوات' } },
          { type: 'ol', items: [
            { en: 'From the Teacher dashboard, open Quizzes → Create Quiz.', ar: 'من لوحة تحكم المعلم، افتح الاختبارات ← إنشاء اختبار.' },
            { en: 'Pick the class and subject, then add questions (MCQ, true/false, or short answer).', ar: 'اختر الصف والمادة، ثم أضف الأسئلة (اختيار من متعدد، صح/خطأ، أو إجابة قصيرة).' },
            { en: 'Set a due date and, optionally, a time limit.', ar: 'حدد تاريخ الاستحقاق وحداً زمنياً اختيارياً.' },
            { en: 'Publish — students see it on their dashboard immediately.', ar: 'انشر — وسيظهر الاختبار للطلاب في لوحاتهم فوراً.' },
          ] },
          { type: 'tip', text: { en: 'After a quiz, students receive AI gap analysis that highlights the topics they need to revise.', ar: 'بعد الاختبار، يحصل الطلاب على تحليل فجوات بالذكاء الاصطناعي يوضح الموضوعات التي تحتاج إلى مراجعة.' } },
        ],
      },
      {
        id: 'attendance',
        title: { en: 'Taking attendance', ar: 'تسجيل الحضور' },
        blocks: [
          { type: 'p', text: { en: 'Record attendance quickly and keep an accurate register for every class.', ar: 'سجّل الحضور بسرعة واحتفظ بسجل دقيق لكل صف.' } },
          { type: 'h', text: { en: 'Steps', ar: 'الخطوات' } },
          { type: 'ol', items: [
            { en: 'Open Attendance from the Teacher dashboard.', ar: 'افتح الحضور من لوحة تحكم المعلم.' },
            { en: 'Select today\'s class and date.', ar: 'اختر صف اليوم وتاريخه.' },
            { en: 'Mark each student Present, Absent, or Late — or use the bulk actions.', ar: 'حدد لكل طالب "حاضر" أو "غائب" أو "متأخر" — أو استخدم الإجراءات الجماعية.' },
            { en: 'Save — the record updates the class register instantly.', ar: 'احفظ — ويُحدَّث سجل الصف فوراً.' },
          ] },
          { type: 'p', text: { en: 'Parents can view attendance in their portal, so everyone stays informed.', ar: 'يمكن لأولياء الأمور متابعة الحضور في بوابتهم، فيبقى الجميع على اطلاع.' } },
        ],
      },
      {
        id: 'parent-communication',
        title: { en: 'Communicating with parents', ar: 'التواصل مع أولياء الأمور' },
        blocks: [
          { type: 'p', text: { en: 'Keep parents informed through built-in messages and announcements.', ar: 'أبقِ أولياء الأمور على اطلاع من خلال الرسائل والإعلانات المدمجة.' } },
          { type: 'h', text: { en: 'Steps', ar: 'الخطوات' } },
          { type: 'ol', items: [
            { en: 'Use Announcements to publish notices to a class or the whole school.', ar: 'استخدم الإعلانات لنشر التنبيهات إلى صف واحد أو المدرسة بأكملها.' },
            { en: 'Use Messages for direct, one-to-one conversations.', ar: 'استخدم الرسائل لإجراء محادثات مباشرة فردية.' },
            { en: 'Optionally enable WhatsApp so updates reach parents\' phones.', ar: 'فعّل واتساب اختيارياً لتصل التحديثات إلى هواتف أولياء الأمور.' },
          ] },
          { type: 'tip', text: { en: 'Published announcements are archived and cannot be edited, so review before you post.', ar: 'تُؤرشف الإعلانات المنشورة ولا يمكن تعديلها، لذلك راجعها قبل النشر.' } },
        ],
      },
    ],
  },
  {
    title: { en: 'Advanced Features', ar: 'الميزات المتقدمة' },
    topics: [
      {
        id: 'ai-tutor',
        title: { en: 'AI Tutor', ar: 'المدرس الذكي بالذكاء الاصطناعي' },
        blocks: [
          { type: 'p', text: { en: 'The AI Tutor gives every student a personal study assistant.', ar: 'يمنح المدرس الذكي بالذكاء الاصطناعي كل طالب مساعداً دراسياً خاصاً.' } },
          { type: 'p', text: { en: 'Students can ask questions about any subject, get step-by-step explanations, and revise the weak topics highlighted after each quiz.', ar: 'يمكن للطلاب طرح أسئلة حول أي مادة والحصول على شروحات خطوة بخطوة ومراجعة الموضوعات الضعيفة التي تظهر بعد كل اختبار.' } },
          { type: 'tip', text: { en: 'The tutor adapts to the student\'s level — the more specific the question, the better the explanation.', ar: 'يتكيف المدرس الذكي مع مستوى الطالب — كلما كان السؤال أكثر تحديداً، كان الشرح أفضل.' } },
        ],
      },
      {
        id: 'quran-tracking',
        title: { en: 'Quran memorisation tracking', ar: 'تتبع حفظ القرآن' },
        blocks: [
          { type: 'p', text: { en: 'Track each student\'s hifdh progress day by day.', ar: 'تابع تقدم حفظ كل طالب يوماً بيوم.' } },
          { type: 'h', text: { en: 'Steps', ar: 'الخطوات' } },
          { type: 'ol', items: [
            { en: 'Open the Quran page from the teacher dashboard.', ar: 'افتح صفحة القرآن من لوحة تحكم المعلم.' },
            { en: 'Select the student and the Surah or Juz currently being memorised.', ar: 'اختر الطالب والسورة أو الجزء الجاري حفظه.' },
            { en: 'Mark what was memorised or revised each day.', ar: 'حدد ما تم حفظه أو مراجعته كل يوم.' },
          ] },
          { type: 'p', text: { en: 'Progress builds into reports that parents can see.', ar: 'تتجمع بيانات التقدم في تقارير يمكن لأولياء الأمور الاطلاع عليها.' } },
        ],
      },
      {
        id: 'reports-analytics',
        title: { en: 'Reports and analytics', ar: 'التقارير والتحليلات' },
        blocks: [
          { type: 'p', text: { en: 'Turn raw data into insight with role-based dashboards and exportable reports.', ar: 'حوّل البيانات الخام إلى رؤى عبر لوحات تحكم مخصصة لكل دور وتقارير قابلة للتصدير.' } },
          { type: 'ul', items: [
            { en: 'Attendance reports per class or per student', ar: 'تقارير الحضور لكل صف أو لكل طالب' },
            { en: 'Quiz and exam performance with class averages', ar: 'أداء الاختبارات والامتحانات مع متوسطات الصف' },
            { en: 'Teacher workload overview', ar: 'نظرة عامة على أعباء المعلمين' },
            { en: 'CSV and PDF export for every report', ar: 'تصدير جميع التقارير بصيغة CSV و PDF' },
          ] },
          { type: 'tip', text: { en: 'Use the At-Risk view to spot students who need support early.', ar: 'استخدم عرض "المعرضون للخطر" لاكتشاف الطلاب الذين يحتاجون إلى دعم مبكراً.' } },
        ],
      },
    ],
  },
];

const allTopics = docs.flatMap(section => section.topics);

function Block({ block }: { block: DocBlock }) {
  const { language } = useLanguage();
  const t = (text: Text) => text[language];

  switch (block.type) {
    case 'h':
      return <h3 className="mt-8 mb-3 text-lg font-bold text-gray-900 dark:text-white">{t(block.text)}</h3>;
    case 'p':
      return <p className="mb-4 text-gray-600 dark:text-gray-300 leading-relaxed">{t(block.text)}</p>;
    case 'ol':
      return (
        <ol className="mb-4 space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-xs font-bold text-emerald-700 dark:text-emerald-400">{i + 1}</span>
              <span className="leading-relaxed">{t(item)}</span>
            </li>
          ))}
        </ol>
      );
    case 'ul':
      return (
        <ul className="mb-4 space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
              <svg className="mt-1 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className="leading-relaxed">{t(item)}</span>
            </li>
          ))}
        </ul>
      );
    case 'tip':
      return (
        <div className="mt-4 mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">{t(block.text)}</p>
        </div>
      );
  }
}

export default function DocsPage() {
  const { dir, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [activeId, setActiveId] = useState(allTopics[0].id);

  const activeTopic = allTopics.find(topic => topic.id === activeId) ?? allTopics[0];

  useEffect(() => { window.scrollTo(0, 0); }, [activeId]);

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

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <span className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            {language === 'ar' ? 'التوثيق' : 'Documentation'}
          </span>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">{language === 'ar' ? 'توثيق المنصة' : 'Platform Documentation'}</h1>
          <p className="mt-3 max-w-2xl text-gray-500 dark:text-gray-400">
            {language === 'ar' ? 'كل ما تحتاج لمعرفته عن منصة مدرسة LMS' : 'Everything you need to know about Madrasah LMS'}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <nav className="space-y-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              {docs.map(section => (
                <div key={section.title.en}>
                  <h2 className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{section.title[language]}</h2>
                  <ul className="space-y-1">
                    {section.topics.map(topic => {
                      const active = topic.id === activeId;
                      return (
                        <li key={topic.id}>
                          <button
                            onClick={() => setActiveId(topic.id)}
                            className={`w-full rounded-lg px-2 py-2 text-left text-sm font-medium transition-colors ${active ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                          >
                            {topic.title[language]}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          <article className="min-w-0 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 sm:p-8">
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{activeTopic.title[language]}</h2>
            <div className="mt-2">
              {activeTopic.blocks.map((block, i) => <Block key={i} block={block} />)}
            </div>
          </article>
        </div>
      </main>

      <footer className="mt-12 border-t dark:border-gray-800 py-8 text-center text-sm text-gray-500">
        <Link to="/" className="hover:text-emerald-600 transition-colors">{language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</Link>
      </footer>
    </div>
  );
}
