import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Mic, Target, Trophy } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface MissionsHeroProps {
  completed: number;
  total: number;
  hasProgress: boolean;
  recommendedMissionId: number | null;
  recommendedTitle: string | null;
  onStartRecommended: (missionId: number) => void;
}

export default function MissionsHero({
  completed,
  total,
  hasProgress,
  recommendedMissionId,
  recommendedTitle,
  onStartRecommended,
}: MissionsHeroProps) {
  const { t, language } = useLanguage();
  const reducedMotion = useReducedMotion();
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-800 to-emerald-950 text-white shadow-lg shadow-primary-900/10">
      <div aria-hidden className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-2xl" />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -right-4 select-none text-[9rem] leading-none font-bold text-white/[0.06]"
        style={{ fontFamily: 'var(--font-arabic, "Cairo")' }}
      >
        مهمات
      </span>

      <div className="relative z-10 p-6 sm:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
              <Target className="h-3.5 w-3.5" aria-hidden />
              {t('fasaaha.learningPath')}
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{t('fasaaha.missionsHeroTitle')}</h1>
            <p className="mt-3 text-sm text-white/75">{t('fasaaha.missionsHeroDesc')}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  if (recommendedMissionId !== null) onStartRecommended(recommendedMissionId);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-primary-800 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Mic className="h-4 w-4" aria-hidden />
                {hasProgress ? t('fasaaha.continueNextMission') : t('fasaaha.startFirstMission')}
              </button>
              {recommendedMissionId !== null && recommendedTitle && (
                <span className="inline-flex max-w-xs items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1.5 text-xs font-medium text-emerald-100">
                  <Trophy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{recommendedTitle}</span>
                </span>
              )}
            </div>
          </div>

          <div className="w-full max-w-sm rounded-2xl bg-white/10 p-5 backdrop-blur lg:w-80">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden />
                {t('fasaaha.missionsCompletedLabel')}
              </span>
              <span className="text-2xl font-bold">
                {completed}
                <span className="text-sm font-medium text-white/60"> / {total}</span>
              </span>
            </div>
            <div
              className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/20"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('fasaaha.missionsCompletedLabel')}
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300"
                initial={reducedMotion ? { width: `${pct}%` } : { width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <p className="mt-2 text-[11px] text-white/70" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {t('fasaaha.missionsAvailableLabel')}: {Math.max(0, total - completed)}
            </p>
            {hasProgress && recommendedTitle && (
              <button
                onClick={() => recommendedMissionId !== null && onStartRecommended(recommendedMissionId)}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {t('fasaaha.recommendedForYou')}
                <ArrowRight className={`h-3.5 w-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} aria-hidden />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
