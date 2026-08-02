import { Clock, Mic } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import type { Mission, MissionType } from '../../../types';
import { MISSION_TYPE_ICONS, MISSION_TYPE_LABELS } from '../../../types';
import MissionStatusBadge from './MissionStatusBadge';
import type { MissionProgressInfo } from './missionStatus';

interface MissionCardProps {
  mission: Mission;
  progress: MissionProgressInfo;
  onStart: (missionId: number) => void;
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
  5: 'fasaaha.master',
};

export default function MissionCard({ mission, progress, onStart }: MissionCardProps) {
  const { t, language } = useLanguage();
  const mType = (mission.mission_type || 'pronunciation') as MissionType;
  const title = language === 'ar' ? mission.title_ar || mission.title : mission.title;

  const ctaLabel = {
    notStarted: t('fasaaha.startMission'),
    inProgress: t('fasaaha.continueMission'),
    needsPractice: t('fasaaha.tryAgain'),
    completed: t('fasaaha.practiceAgain'),
  }[progress.status];

  return (
    <article
      className="flex h-full flex-col rounded-2xl border p-5 transition-all card-hover"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${DIFF_CHIP[mission.difficulty] ?? DIFF_CHIP[2]}`}>
          {t(DIFF_LABEL[mission.difficulty] ?? 'fasaaha.intermediate')}
        </span>
        <MissionStatusBadge status={progress.status} bestScore={progress.bestScore} />
      </div>

      <h3 className="mt-3 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </h3>
      <p className="mt-0.5 text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
        {mission.category_name ?? t('fasaaha.allCategories')}
        {' · '}
        <span className="inline-flex items-center gap-1">
          {MISSION_TYPE_ICONS[mType] ?? '🗣️'}
          {MISSION_TYPE_LABELS[mType] ?? mType}
        </span>
      </p>

      <div
        dir="rtl"
        lang="ar"
        className="mt-3 rounded-xl px-4 py-3 text-center text-xl font-semibold leading-relaxed"
        style={{
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-arabic, "Cairo")',
        }}
      >
        {mission.prompt_ar}
      </div>

      {mission.prompt_translation && (
        <p className="mt-2 line-clamp-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {mission.prompt_translation}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden />
          {Math.round((mission.max_time_seconds ?? 60) / 60)} {t('fasaaha.minutesShort')}
        </span>
        {progress.attemptsCount > 0 && (
          <span>
            {progress.attemptsCount === 1 ? t('fasaaha.once') : `${progress.attemptsCount} ${t('fasaaha.attemptedTimes')}`}
          </span>
        )}
      </div>

      <div className="mt-4 flex-1" />

      <button
        onClick={() => onStart(mission.id)}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      >
        <Mic className="h-4 w-4" aria-hidden />
        {ctaLabel}
      </button>
    </article>
  );
}
