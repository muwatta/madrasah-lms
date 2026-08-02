import { Clock, Mic, Sparkles } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import type { Mission } from '../../../types';
import MissionStatusBadge from './MissionStatusBadge';
import type { MissionProgressInfo } from './missionStatus';

interface RecommendedMissionProps {
  mission: Mission;
  progress: MissionProgressInfo;
  onStart: (missionId: number) => void;
}

export default function RecommendedMission({ mission, progress, onStart }: RecommendedMissionProps) {
  const { t, language } = useLanguage();
  const title = language === 'ar' ? mission.title_ar || mission.title : mission.title;

  const ctaLabel = progress.status === 'notStarted' ? t('fasaaha.startSpeaking') : t('fasaaha.continueMission');

  return (
    <section
      className="relative overflow-hidden rounded-2xl border-2 border-primary-200 bg-primary-50/60 p-5 dark:border-primary-800 dark:bg-primary-950/30 sm:p-6"
    >
      <div aria-hidden className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary-200/40 blur-3xl dark:bg-primary-900/40" />

      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 lg:max-w-xl">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-3 py-1 text-[11px] font-bold text-white">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t('fasaaha.recommendedForYou')}
          </p>
          <h2 className="mt-2.5 truncate text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h2>
          <p className="mt-1 line-clamp-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {mission.prompt_translation}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            <MissionStatusBadge status={progress.status} bestScore={progress.bestScore} />
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden />
              {Math.round((mission.max_time_seconds ?? 60) / 60)} {t('fasaaha.minutesShort')}
            </span>
            {progress.attemptsCount > 0 && (
              <span>{progress.attemptsCount === 1 ? t('fasaaha.once') : `${progress.attemptsCount} ${t('fasaaha.attemptedTimes')}`}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <p
            dir="rtl"
            lang="ar"
            className="hidden rounded-xl bg-white/70 px-4 py-3 text-base font-semibold leading-relaxed sm:block"
            style={{ fontFamily: 'var(--font-arabic, "Cairo")', color: 'var(--color-text-primary)' }}
          >
            {mission.prompt_ar}
          </p>
          <button
            onClick={() => onStart(mission.id)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <Mic className="h-4 w-4" aria-hidden />
            {ctaLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
