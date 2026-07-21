import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

interface Stats {
  students: number;
  teachers: number;
  schools: number;
  graduates: number;
}

function useAnimatedCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };
    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [target, duration]);

  return count;
}

function StatCard({ value, label }: { value: number; label: string }) {
  const animated = useAnimatedCounter(value);
  return (
    <div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10">
      <div className="text-5xl md:text-6xl font-bold text-white tabular-nums tracking-tight">
        {animated.toLocaleString()}
      </div>
      <div className="mt-2 text-emerald-200/80 text-sm md:text-base uppercase tracking-widest font-medium">
        {label}
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}

// ---------- Icons (Heroicons outline) ----------
const IconCheck = () => (
  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const IconAcademic = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
  </svg>
);

const IconHomework = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const IconTimetable = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

const IconAttendance = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const IconQuran = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);

const IconAI = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.5 20.25l-.105.42a1.875 1.875 0 0 1-1.289 1.29l-.42.105.42.105a1.875 1.875 0 0 1 1.289 1.29l.105.42.105-.42a1.875 1.875 0 0 1 1.289-1.29l.42-.105-.42-.105a1.875 1.875 0 0 1-1.289-1.29L16.5 20.25Z" />
  </svg>
);

const IconWhatsApp = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-7.5 3.75h.375m3.375 0h.375m3.375 0h.375M4.5 21V6.375A2.625 2.625 0 0 1 7.125 3.75h9.75A2.625 2.625 0 0 1 19.5 6.375V21l-3.75-2.25L12 21l-3.75-2.25L4.5 21Z" />
  </svg>
);

const IconCertificate = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35M8.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228m5.469-4.672A6.003 6.003 0 0 1 19.5 4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.726 6.726 0 0 1-2.748 1.35M15 4.236V4.5c0 2.108-.966 3.99-2.48 5.228" />
  </svg>
);

const IconFinance = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
  </svg>
);

const IconCharacter = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);

// ---------- Feature data (expanded) ----------
const featureList = [
  { title: 'Assessments & Quizzes', desc: 'Multiple question types, auto‑grading, and a reusable question bank. Students get instant feedback.', icon: <IconAcademic /> },
  { title: 'Homework Management', desc: 'Assign, submit, grade, and track homework with attachments and overdue highlights.', icon: <IconHomework /> },
  { title: 'Timetable & Calendar', desc: 'Personalised schedules for students and teachers, plus an academic calendar with holidays and events.', icon: <IconTimetable /> },
  { title: 'Attendance & QR Scanning', desc: 'One‑click QR code attendance with real‑time reports — no hardware needed.', icon: <IconAttendance /> },
  { title: 'Quran Memorisation', desc: 'Track surah/ayah progress with tajwid assessment — a unique feature for Islamic schools.', icon: <IconQuran /> },
  { title: 'AI Tutor', desc: 'OpenAI‑powered tutor answers student questions in English and Arabic, 24/7.', icon: <IconAI /> },
  { title: 'WhatsApp Notifications', desc: 'Parents receive attendance, fee, and announcement alerts via WhatsApp — no app required.', icon: <IconWhatsApp /> },
  { title: 'Certificates & Achievements', desc: 'Generate professional PDF certificates for academic and Quran milestones, with unique verification.', icon: <IconCertificate /> },
  { title: 'Finance & Admissions', desc: 'Track fee payments, manage outstanding balances, and handle online admissions from application to enrollment.', icon: <IconFinance /> },
  { title: 'Character Education', desc: 'Evaluate soft skills (responsibility, teamwork, honesty) and report progress to parents.', icon: <IconCharacter /> },
];

// ---------- Achievements ----------
const achievements = [
  'Complete Academic Cycle – lesson planning, homework, quizzes, exams, grading, progress tracking',
  'AI‑Powered Tools – real‑time AI tutor and auto‑generated quiz questions',
  'WhatsApp Integration – attendance alerts, fee reminders, announcements directly on WhatsApp',
  'Smart Attendance – QR code scanning – no roll calls, no paper registers',
  'Islamic Education Focus – Quran memorisation tracker, tajwid assessment, prayer times',
  'Bilingual from Day One – full Arabic and English interface with RTL support',
  '24/7 Access – students and parents access everything anytime, anywhere',
  'Data‑Driven Insights – at‑risk prediction, workload analytics, subject‑level reports',
];

// ---------- Roles ----------
const roles = [
  { title: 'Student', desc: 'Take quizzes & exams, submit homework, view timetable, track progress, use AI tutor, memorise Quran, earn certificates.' },
  { title: 'Teacher', desc: 'Create quizzes, grade work, plan lessons, take attendance, communicate with parents, view analytics.' },
  { title: 'Parent', desc: 'Monitor grades, attendance, fee status, receive WhatsApp notifications, message teachers.' },
  { title: 'Administrator', desc: 'Manage users, classes, timetables, fees, admissions, announcements, view school‑wide analytics.' },
];

// ---------- Testimonials (updated) ----------
const testimonials = [
  {
    name: 'Ustadh Ibrahim',
    role: 'Teacher, Al‑Noor Madrasah',
    text: 'The AI tutor and QR attendance have saved me hours every week. My students love the instant feedback on quizzes.',
  },
  {
    name: 'Sister Fatima',
    role: 'Parent',
    text: 'WhatsApp notifications keep me informed about my children’s attendance and fees. I don’t need to install another app.',
  },
  {
    name: 'Mudeer Ahmad',
    role: 'Administrator',
    text: 'The analytics dashboard gives me a clear picture of our entire madrasah’s performance at a glance. A game‑changer.',
  },
];

// ---------- Hook for scroll animations ----------
function useOnScreen(ref: React.RefObject<Element | null>, threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref, threshold]);

  return isVisible;
}

export default function LandingPage() {
  const [stats, setStats] = useState<Stats>({ students: 0, teachers: 0, schools: 0, graduates: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);

  const statsRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const achievementsRef = useRef<HTMLDivElement>(null);
  const rolesRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const summaryVisible = useOnScreen(summaryRef);
  const achievementsVisible = useOnScreen(achievementsRef);
  const rolesVisible = useOnScreen(rolesRef);
  const featuresVisible = useOnScreen(featuresRef);
  const statusVisible = useOnScreen(statusRef);
  const testimonialsVisible = useOnScreen(testimonialsRef);
  const ctaVisible = useOnScreen(ctaRef);
  const statsVisible = useOnScreen(statsRef);

  useEffect(() => {
    api.get('/landing/stats/')
      .then((res) => {
        setStats(res.data);
        setStatsLoaded(true);
      })
      .catch(() => setStatsLoaded(true));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 antialiased">
      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/25">
            M
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Madrasah<span className="text-emerald-600 dark:text-emerald-400">LMS</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="text-sm font-medium bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-all hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/10 to-transparent rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6 py-32 md:py-48 text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-emerald-100 text-sm font-medium mb-6">
            🕌 School Management Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Modern Learning for<br />
            <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
              Traditional Values
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
            A comprehensive platform for managing madrasah operations — from enrollment and attendance to Quran tracking and financial management.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-emerald-800 font-semibold rounded-xl hover:bg-emerald-50 transition-all shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-1"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 border-2 border-emerald-300/50 text-emerald-100 font-semibold rounded-xl hover:bg-emerald-800/50 transition-all hover:border-emerald-300 hover:-translate-y-1 backdrop-blur-sm"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      {statsLoaded && (
        <section
          ref={statsRef}
          className="relative -mt-12 z-10 transition-all duration-700 transform"
          style={{
            opacity: statsVisible ? 1 : 0,
            transform: statsVisible ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 bg-gradient-to-r from-emerald-800/90 to-emerald-900/90 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl shadow-emerald-900/30 p-6 md:p-8">
              <StatCard value={stats.students} label="Students" />
              <StatCard value={stats.teachers} label="Teachers" />
              <StatCard value={stats.schools} label="Madaris" />
              <StatCard value={stats.graduates} label="Graduates" />
            </div>
          </div>
        </section>
      )}

      {/* Executive Summary */}
      <section
        ref={summaryRef}
        className="max-w-4xl mx-auto px-6 py-16 transition-all duration-700 delay-100"
        style={{
          opacity: summaryVisible ? 1 : 0,
          transform: summaryVisible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            Executive Summary — July 2026
          </span>
        </div>
        <div className="prose prose-emerald dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-center leading-relaxed">
          <p className="text-lg">
            <strong>Madrasah LMS</strong> is a comprehensive digital platform purpose‑built for Islamic schools. It replaces paper‑based processes with a single online system that teachers, students, parents, and administrators use every day — from taking quizzes and submitting homework to tracking fees, attendance, and student progress. The platform is fully bilingual (English / Arabic), works on any device with a browser, and is ready for production deployment.
          </p>
        </div>
      </section>

      {/* Key Achievements */}
      <section
        ref={achievementsRef}
        className="bg-gray-50 dark:bg-gray-800/50 border-y border-gray-200 dark:border-gray-700 transition-all duration-700 delay-150"
        style={{
          opacity: achievementsVisible ? 1 : 0,
          transform: achievementsVisible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              Achievements
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Key Milestones
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {achievements.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white dark:hover:bg-gray-800/50 transition-colors">
                <IconCheck />
                <span className="text-gray-700 dark:text-gray-300 text-sm md:text-base">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Uses the Platform */}
      <section
        ref={rolesRef}
        className="max-w-7xl mx-auto px-6 py-16 transition-all duration-700 delay-200"
        style={{
          opacity: rolesVisible ? 1 : 0,
          transform: rolesVisible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            For Everyone
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Who Uses the Platform
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role, idx) => (
            <div
              key={role.title}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-emerald-900/20"
              style={{ transitionDelay: `${idx * 50}ms` }}
            >
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">{role.title}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{role.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features (expanded) */}
      <section
        ref={featuresRef}
        className="bg-gray-50 dark:bg-gray-800/50 border-y border-gray-200 dark:border-gray-700 transition-all duration-700 delay-300"
        style={{
          opacity: featuresVisible ? 1 : 0,
          transform: featuresVisible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              Features
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Everything You Need
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureList.map((f, idx) => (
              <div
                key={f.title}
                className="group relative p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-emerald-500/10 dark:hover:shadow-emerald-900/20"
                style={{ transitionDelay: `${idx * 50}ms` }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-all group-hover:scale-110 group-hover:rotate-3">
                    {f.icon}
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">{f.title}</h3>
                  <p className="mt-3 text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Status & Tech Stack */}
      <section
        ref={statusRef}
        className="max-w-7xl mx-auto px-6 py-16 transition-all duration-700 delay-400"
        style={{
          opacity: statusVisible ? 1 : 0,
          transform: statusVisible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            Status
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Project Readiness
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">✅ Status</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2"><span className="text-emerald-500">✔</span> Core academic features complete</li>
              <li className="flex items-center gap-2"><span className="text-emerald-500">✔</span> All major modules built &amp; tested</li>
              <li className="flex items-center gap-2"><span className="text-emerald-500">✔</span> 64 automated backend tests passing</li>
              <li className="flex items-center gap-2"><span className="text-emerald-500">✔</span> Production‑ready</li>
            </ul>
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Enhancements planned: two‑way WhatsApp, bulk SMS/email, advanced exam scheduling.
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🛠️ Technology Stack</h3>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li><span className="font-medium">Backend:</span> Django (Python) + REST Framework</li>
              <li><span className="font-medium">Frontend:</span> React 19 + TypeScript + Tailwind CSS</li>
              <li><span className="font-medium">Database:</span> PostgreSQL (prod) / SQLite (dev)</li>
              <li><span className="font-medium">Email:</span> Resend.com</li>
              <li><span className="font-medium">AI:</span> OpenAI API</li>
              <li><span className="font-medium">WhatsApp:</span> Meta WhatsApp Cloud API</li>
              <li><span className="font-medium">PDF:</span> ReportLab</li>
              <li><span className="font-medium">Hosting:</span> Standard web server / cloud</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        ref={testimonialsRef}
        className="bg-gray-50 dark:bg-gray-800/50 border-y border-gray-200 dark:border-gray-700 transition-all duration-700 delay-500"
        style={{
          opacity: testimonialsVisible ? 1 : 0,
          transform: testimonialsVisible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
              Testimonials
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Trusted by Educators
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div
                key={t.name}
                className="relative bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="absolute -top-3 -left-3 text-6xl text-emerald-200 dark:text-emerald-800/30 font-serif leading-none">
                  &ldquo;
                </div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed relative z-10">
                  {t.text}
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center font-semibold text-lg shadow-lg shadow-emerald-500/25">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        ref={ctaRef}
        className="max-w-7xl mx-auto px-6 py-16 text-center transition-all duration-700 delay-600"
        style={{
          opacity: ctaVisible ? 1 : 0,
          transform: ctaVisible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div className="relative inline-block">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl blur-2xl opacity-30 animate-pulse" />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl px-8 py-16 md:px-16 border border-gray-200 dark:border-gray-700 shadow-xl">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              Ready to Transform Your Madrasah?
            </h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-lg">
              Join hundreds of institutions already using Madrasah LMS to deliver quality Islamic education.
            </p>
            <div className="mt-8">
              <Link
                to="/register"
                className="inline-block px-12 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-1 text-lg"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-400 border-t border-gray-800 dark:border-gray-950">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                M
              </div>
              <span className="text-white font-semibold tracking-tight">
                Madrasah<span className="text-emerald-400">LMS</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Modern technology for Islamic educational institutions worldwide.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <a href="#" className="hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 dark:border-gray-950 text-center py-6 text-sm">
          &copy; {new Date().getFullYear()} Madrasah LMS. All rights reserved.
        </div>
      </footer>
    </div>
  );
}