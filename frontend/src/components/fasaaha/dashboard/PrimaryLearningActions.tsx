import { motion, useReducedMotion } from 'framer-motion';
import { Bot, Clock, Gauge, Mic, Target, Trophy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { useFasaahaMissions } from '../../../hooks/useFasaaha';
import type { FasaahaStudentDashboard, Mission, MissionType } from '../../../types';
import { MISSION_TYPE_ICONS, MISSION_TYPE_LABELS } from '../../../types';

interface PrimaryLearningActionsProps {
  dashboard: FasaahaStudentDashboard;
}

const DIFF_CHIP: Record<number, string> = {
  1: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  3: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  4: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  5: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const DIFF_LABEL: Record<number, string> = {
  1: 'fasaaha.beginner',
  2: 'fasaaha.intermediate',
  3: 'fasaaha.advanced',
  4: 'fasaaha.expert',
  5: 'fasaaha.expert',
};

export default function PrimaryLearningActions({ dashboard }: PrimaryLearningActionsProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  const levelNumber = dashboard.current_level?.number;
  const { data: missions = [] } = useFasaahaMissions({ level: levelNumber ?? undefined });
  const featured = missions.filter((m) => m.is_active).slice(0, 3);
  const hasStarted = dashboard.total_attempts > 0;

  const steps = [
    { icon: Mic, key: 'fasaaha.stepRecord' },
    { icon: Gauge, key: 'fasaaha.stepFeedback' },
    { icon: Trophy, key: 'fasaaha.stepEarn' },
  ];

  const scenarios = [
    { key: 'fasaaha.scenarioIntro', ar: 'التعريف بنفسي' },
    { key: 'fasaaha.scenarioRoutine', ar: 'روتيني اليومي' },
    { key: 'fasaaha.scenarioMarket', ar: 'في السوق' },
  ];

  const openMission = (m: Mission) =>
    navigate(m.mission_type === 'reading' ? `/student/fasaaha/read/${m.id}` : `/student/fasaaha/speak/${m.id}`);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('fasaaha.whatToPractice')}
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t('fasaaha.practiceDesc')}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── Free Speaking ── */}
        <motion.section
          className="flex flex-col rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-white shadow-lg shadow-primary-900/10"
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <Mic className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-bold">{t('fasaaha.speakCardTitle')}</h3>
              <p className="text-xs text-white/75">{t('fasaaha.speakNow')}</p>
            </div>
          </div>

          <p className="mt-4 text-sm text-white/85">{t('fasaaha.speakCardDesc')}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {[5, 10, 15].map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"
              >
                <Clock className="h-3 w-3" aria-hidden />
                {m} {t('fasaaha.minutesShort')}
              </span>
            ))}
          </div>

          <p dir="rtl" lang="ar" className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white/90" style={{ fontFamily: 'var(--font-arabic, "Cairo")' }}>
            {t('fasaaha.heroPrompt')}
          </p>

          <div className="mt-4 rounded-xl bg-white/10 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/70">
              {t('fasaaha.whatHappens')}
            </p>
            <ul className="space-y-1.5">
              {steps.map((s) => {
                const Icon = s.icon;
                return (
                  <li key={s.key} className="flex items-center gap-2 text-xs text-white/90">
                    <Icon className="h-3.5 w-3.5 text-emerald-200" aria-hidden />
                    {t(s.key)}
                  </li>
                );
              })}
            </ul>
          </div>

          <Link
            to="/student/fasaaha/speak/0"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-primary-800 transition-all hover:-translate-y-0.5 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Mic className="h-4 w-4" aria-hidden />
            {t('fasaaha.heroStartSpeaking')}
          </Link>
        </motion.section>

        {/* ── Missions ── */}
        <motion.section
          className="flex flex-col rounded-3xl border p-6 card-hover"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                <Target className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {t('fasaaha.missionsTitle')}
                </h3>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {t('fasaaha.level')} {levelNumber ?? '–'}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {t('fasaaha.missionsCardDesc')}
          </p>

          <div className="mt-4 flex-1 space-y-2">
            {featured.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-center text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                {t('fasaaha.noMissions')}
              </div>
            ) : (
              featured.map((m) => {
                const mType = (m.mission_type || 'pronunciation') as MissionType;
                const title = language === 'ar' ? m.title_ar || m.title : m.title;
                return (
                  <button
                    key={m.id}
                    onClick={() => openMission(m)}
                    className="group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    style={{ borderColor: 'var(--color-border-light)' }}
                  >
                    <span className="shrink-0 text-xl" aria-hidden>{MISSION_TYPE_ICONS[mType] ?? '🗣️'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {title}
                      </span>
                      <span className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        <span>{m.max_time_seconds}s</span>
                        <span>·</span>
                        <span>{MISSION_TYPE_LABELS[mType] ?? mType}</span>
                      </span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${DIFF_CHIP[m.difficulty] ?? DIFF_CHIP[2]}`}>
                      {t(DIFF_LABEL[m.difficulty] ?? 'fasaaha.intermediate')}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <Link
            to="/student/fasaaha/missions"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/20"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
          >
            {t('fasaaha.viewAllMissions')}
          </Link>
        </motion.section>

        {/* ── AI Conversation ── */}
        <motion.section
          className="flex flex-col rounded-3xl border p-6 card-hover"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.16, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
              <Bot className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {t('fasaaha.conversation')}
              </h3>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {t('fasaaha.overall')}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {t('fasaaha.conversationCardDesc')}
          </p>

          <div className="mt-4 flex-1 space-y-2">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md border px-3 py-2 text-xs" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}>
              <p dir="rtl" lang="ar" style={{ fontFamily: 'var(--font-arabic, "Cairo")' }}>
                أهلاً بك! كيف حالك اليوم؟
              </p>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary-600 px-3 py-2 text-xs text-white">
                <p dir="rtl" lang="ar" style={{ fontFamily: 'var(--font-arabic, "Cairo")' }}>
                  الحمد لله، بخير. وأنت؟
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              {t('fasaaha.scenarios')}
            </p>
            <div className="flex flex-wrap gap-2">
              {scenarios.map((s) => (
                <Link
                  key={s.key}
                  to="/student/fasaaha/conversation"
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  <span dir="rtl" style={{ fontFamily: 'var(--font-arabic, "Cairo")' }}>{s.ar}</span>
                  <span className="sr-only">({t(s.key)})</span>
                </Link>
              ))}
            </div>
          </div>

          <Link
            to="/student/fasaaha/conversation"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <Bot className="h-4 w-4" aria-hidden />
            {hasStarted ? t('fasaaha.startConversation') : t('fasaaha.readyChallenge')}
          </Link>
        </motion.section>
      </div>
    </div>
  );
}
