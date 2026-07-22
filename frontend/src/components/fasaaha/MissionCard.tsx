import { useLanguage } from '../../context/LanguageContext';
import type { Mission } from '../../types';

interface MissionCardProps {
  mission: Mission;
  onStart: (missionId: number) => void;
}

const diffColors: Record<number, string> = {
  1: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  3: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  4: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  5: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const diffLabels: Record<number, string> = { 1: 'fasaaha.beginner', 2: 'fasaaha.intermediate', 3: 'fasaaha.advanced', 4: 'fasaaha.expert', 5: 'fasaaha.expert' };

export default function MissionCard({ mission, onStart }: MissionCardProps) {
  const { t, language } = useLanguage();

  return (
    <div className="rounded-xl border p-5 flex flex-col gap-3 card-hover" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{mission.title}</h3>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${diffColors[mission.difficulty] ?? diffColors[2]}`}>
          {t(diffLabels[mission.difficulty] ?? 'fasaaha.intermediate')}
        </span>
      </div>

      {mission.category_name && (
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{mission.category_name}</span>
      )}

      {mission.prompt_ar && (
        <p className="text-lg leading-relaxed text-center py-2" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-arabic, serif)' }}>
          {mission.prompt_ar.length > 80 ? mission.prompt_ar.slice(0, 80) + '...' : mission.prompt_ar}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <span>{mission.max_time_seconds}s</span>
          <span>{mission.attempt_count} {t('fasaaha.totalAttempts')}</span>
        </div>
        <button onClick={() => onStart(mission.id)} className="btn-press text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">
          {t('fasaaha.startMission')}
        </button>
      </div>
    </div>
  );
}
