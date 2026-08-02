import { motion, useReducedMotion } from 'framer-motion';
import { Mic, Sparkles, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import type { FasaahaStudentDashboard } from '../../../types';

interface FasaahaHeroProps {
  dashboard: FasaahaStudentDashboard;
}

const WAVEFORM_HEIGHTS = [14, 26, 40, 22, 48, 30, 56, 26, 42, 18, 34, 22];

export default function FasaahaHero({ dashboard }: FasaahaHeroProps) {
  const { t, language } = useLanguage();
  const reducedMotion = useReducedMotion();

  const hasProgress = dashboard.total_attempts > 0 || dashboard.completed_missions > 0;
  const level = dashboard.current_level;
  const levelName = language === 'ar' ? level?.name_ar : level?.name;

  return (
    <section
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-800 to-emerald-950 text-white shadow-lg shadow-primary-900/10"
    >
      <div aria-hidden className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-2xl" />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -left-4 select-none text-[9rem] leading-none font-bold text-white/[0.06]"
        style={{ fontFamily: 'var(--font-arabic, "Cairo")' }}
      >
        فصاحة
      </span>

      <div className="relative z-10 grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1.25fr_0.75fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t('fasaaha.subtitle')}
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            {t('fasaaha.dashboardTitle')}
          </h1>

          {level && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-200">
              <Trophy className="h-4 w-4" aria-hidden />
              {t('fasaaha.level')} {level.number}
              {levelName ? ` · ${levelName}` : ''}
            </p>
          )}

          <p className="mt-3 max-w-xl text-lg font-semibold text-white">
            {hasProgress ? t('fasaaha.heroProgressTitle') : t('fasaaha.heroZeroTitle')}
          </p>
          <p className="mt-1 max-w-xl text-sm text-white/75">
            {hasProgress ? t('fasaaha.heroProgressDesc') : t('fasaaha.heroZeroDesc')}
          </p>

          <p
            dir="rtl"
            lang="ar"
            className="mt-5 inline-block rounded-xl bg-white/10 px-4 py-3 text-lg font-semibold text-white backdrop-blur"
            style={{ fontFamily: 'var(--font-arabic, "Cairo")' }}
          >
            {t('fasaaha.heroPrompt')}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/student/fasaaha/speak/0"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-primary-800 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Mic className="h-4 w-4" aria-hidden />
              {t('fasaaha.heroStartSpeaking')}
            </Link>
            <Link
              to="/student/fasaaha/missions"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t('fasaaha.heroBrowseMissions')}
            </Link>
          </div>
        </div>

        <div className="relative hidden items-center justify-center lg:flex" aria-hidden>
          <div className="relative flex h-44 w-44 items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full bg-white/15"
              animate={reducedMotion ? undefined : { scale: [1, 1.18, 1], opacity: [0.7, 0.25, 0.7] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white/15 backdrop-blur">
              <Mic className="h-12 w-12 text-white" />
            </div>
          </div>

          <div className="absolute bottom-0 flex items-end gap-1.5">
            {WAVEFORM_HEIGHTS.map((h, i) => (
              <motion.span
                key={i}
                className="w-1.5 rounded-full bg-white/70"
                style={{ height: reducedMotion ? h : undefined }}
                initial={reducedMotion ? { height: h } : { height: 6 }}
                animate={reducedMotion ? { height: h } : { height: [6, h, 6] }}
                transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
