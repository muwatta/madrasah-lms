import { useLanguage } from '../../context/LanguageContext';

interface MissionCardProps {
  mission: {
    id: number;
    title: string;
    title_en: string;
    description: string;
    arabic_text: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    points: number;
    attempt_count: number;
    avg_score: number;
    category_name: string | null;
  };
  onStart: (missionId: number) => void;
}

const diffColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  advanced: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  expert: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function MissionCard({ mission, onStart }: MissionCardProps) {
  const { t, language } = useLanguage();
  const title = language === 'ar' ? mission.title : mission.title_en || mission.title;
  const diffKey = `fasaaha.${mission.difficulty}` as const;

  return (
    <div className="rounded-xl border p-5 flex flex-col gap-3 card-hover" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${diffColors[mission.difficulty] ?? ''}`}>
          {t(diffKey)}
        </span>
      </div>

      {mission.category_name && (
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{mission.category_name}</span>
      )}

      {mission.arabic_text && (
        <p className="text-lg leading-relaxed text-center py-2" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-arabic, serif)' }}>
          {mission.arabic_text.length > 80 ? mission.arabic_text.slice(0, 80) + '...' : mission.arabic_text}
        </p>
      )}

      {mission.description && (
        <p className="text-xs line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{mission.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <span>{mission.points} {t('fasaaha.points')}</span>
          <span>{mission.attempt_count} {t('fasaaha.totalAttempts')}</span>
          {mission.avg_score > 0 && <span>{Math.round(mission.avg_score)}% {t('fasaaha.avgScore')}</span>}
        </div>
        <button onClick={() => onStart(mission.id)} className="btn-press text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">
          {t('fasaaha.startMission')}
        </button>
      </div>
    </div>
  );
}
