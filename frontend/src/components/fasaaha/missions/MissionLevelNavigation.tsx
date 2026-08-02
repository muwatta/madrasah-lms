import { Layers } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import type { SpeakingLevel } from '../../../types';

interface MissionLevelNavigationProps {
  levels: SpeakingLevel[];
  activeLevelId: number | null;
  onSelect: (levelId: number | null) => void;
  completedByLevel?: Map<number, number>;
  totalByLevel?: Map<number, number>;
}

export default function MissionLevelNavigation({
  levels,
  activeLevelId,
  onSelect,
  completedByLevel,
  totalByLevel,
}: MissionLevelNavigationProps) {
  const { t, language } = useLanguage();

  const renderPill = (label: string, levelId: number | null, countLabel?: string) => {
    const active = activeLevelId === levelId;
    return (
      <button
        key={levelId ?? 'all'}
        onClick={() => onSelect(levelId)}
        aria-pressed={active}
        className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${
          active
            ? 'border-primary-600 bg-primary-600 text-white shadow-md shadow-primary-600/20'
            : 'border-transparent hover:border-primary-300'
        }`}
        style={
          active
            ? undefined
            : { background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }
        }
      >
        {levelId === null && <Layers className="h-3.5 w-3.5" aria-hidden />}
        {label}
        {countLabel && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              active ? 'bg-white/25 text-white' : 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
            }`}
          >
            {countLabel}
          </span>
        )}
      </button>
    );
  };

  return (
    <nav aria-label={t('fasaaha.learningLevel')} className="-mx-1 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
      <div className="flex items-center gap-2">
        {renderPill(t('fasaaha.allMissions'), null)}
        {levels.map((lv) => {
          const completed = completedByLevel?.get(lv.id) ?? 0;
          const total = totalByLevel?.get(lv.id) ?? lv.total_missions;
          const label = language === 'ar' ? lv.name_ar : lv.name;
          const countLabel = total > 0 ? `${completed}/${total}` : undefined;
          return renderPill(label, lv.id, countLabel);
        })}
      </div>
    </nav>
  );
}
