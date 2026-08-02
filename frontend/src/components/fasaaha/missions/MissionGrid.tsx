import { motion } from 'framer-motion';
import { AlertCircle, SearchX } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { SkeletonCard } from '../../Skeleton';
import type { Mission } from '../../../types';
import MissionCard from './MissionCard';
import type { MissionProgressInfo } from './missionStatus';

interface MissionGridProps {
  missions: Mission[];
  progressByMission: Map<number, MissionProgressInfo>;
  onStart: (missionId: number) => void;
  isLoading: boolean;
  isError: boolean;
  hasActiveFilters: boolean;
  hasAnyProgress: boolean;
  onClearFilters: () => void;
  visibleCount: number;
}

export default function MissionGrid({
  missions,
  progressByMission,
  onStart,
  isLoading,
  isError,
  hasActiveFilters,
  hasAnyProgress,
  onClearFilters,
  visibleCount,
}: MissionGridProps) {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <AlertCircle className="h-10 w-10 text-red-500" aria-hidden />
        <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {t('fasaaha.missionsLoadError')}
        </p>
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <SearchX className="h-10 w-10" style={{ color: 'var(--color-text-muted)' }} aria-hidden />
        <p className="mt-3 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {hasActiveFilters ? t('fasaaha.noFilterMatches') : t('fasaaha.allMissions')}
        </p>
        <p className="mt-1 max-w-sm text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {hasActiveFilters ? t('fasaaha.clearFilters') : hasAnyProgress ? t('fasaaha.noCompletedEmpty') : t('fasaaha.newLearnerEmpty')}
        </p>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="mt-4 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-700"
          >
            {t('fasaaha.clearFilters')}
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
        {visibleCount} {t('fasaaha.resultsCount')}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {missions.map((mission, i) => (
          <motion.div
            key={mission.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3) }}
          >
            <MissionCard mission={mission} progress={progressByMission.get(mission.id) ?? emptyProgress} onStart={onStart} />
          </motion.div>
        ))}
      </div>
    </>
  );
}

const emptyProgress: MissionProgressInfo = {
  status: 'notStarted',
  bestScore: null,
  attemptsCount: 0,
  lastAttemptedAt: null,
  isHighScore: false,
};
