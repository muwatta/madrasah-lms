import { useLanguage } from '../../context/LanguageContext';
import type { SpeakingLevel, StudentLevelProgress } from '../../types';

interface LevelProgressProps {
  currentLevel: SpeakingLevel | null;
  levels: SpeakingLevel[];
  progress: StudentLevelProgress[];
}

export default function LevelProgress({ currentLevel, levels, progress }: LevelProgressProps) {
  const { language } = useLanguage();
  const sorted = [...levels].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {sorted.map((level) => {
        const prog = progress.find(p => p.level === level.id);
        const completed = prog?.status === 'completed';
        const current = currentLevel?.id === level.id;
        const pct = prog && prog.missions_attempted > 0 ? Math.round((prog.missions_completed / Math.max(prog.missions_attempted, 1)) * 100) : 0;

        return (
          <div key={level.id} className={`shrink-0 w-36 rounded-xl border p-3 text-center transition-all ${current ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800' : completed ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700'}`}
            style={{ backgroundColor: current ? 'var(--color-bg-primary)' : undefined }}>
            <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold ${completed ? 'bg-green-500 text-white' : current ? 'bg-primary-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
              {level.number}
            </div>
            <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{language === 'ar' ? level.name_ar : level.name}</p>
            {prog && (
              <div className="mt-2">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border-light)' }}>
                  <div className={`h-full rounded-full ${completed ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>{prog.missions_completed}/{prog.missions_attempted}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
