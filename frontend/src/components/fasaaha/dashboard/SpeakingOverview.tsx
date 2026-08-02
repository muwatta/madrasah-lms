import type { LucideIcon } from 'lucide-react';
import { Award, CalendarRange, Flame, Target, Trophy } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import type { FasaahaStudentDashboard, StudentLevelProgress } from '../../../types';

interface SpeakingOverviewProps {
  dashboard: FasaahaStudentDashboard;
  progress: StudentLevelProgress[];
}

const ACCENTS: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
};

function LevelRing({ pct, levelNumber }: { pct: number; levelNumber: number | null }) {
  const size = 64;
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border-light)" strokeWidth={6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-lg font-bold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {levelNumber ?? '–'}
      </span>
    </div>
  );
}

export default function SpeakingOverview({ dashboard, progress }: SpeakingOverviewProps) {
  const { t, language } = useLanguage();

  const currentLevel = dashboard.current_level;
  const levelRecord = progress.find((p) => p.level_number === currentLevel?.number);
  const levelPct = levelRecord
    ? Math.min(100, Math.round((levelRecord.missions_completed / Math.max(1, levelRecord.missions_attempted)) * 100))
    : 0;
  const levelName = language === 'ar' ? currentLevel?.name_ar : currentLevel?.name;

  const stats: Array<{ icon: LucideIcon; label: string; value: number; accent: string; zeroHint: string | null }> = [
    {
      icon: Trophy,
      label: t('fasaaha.totalPoints'),
      value: dashboard.total_points,
      accent: 'amber',
      zeroHint: dashboard.total_points === 0 ? t('fasaaha.zeroPoints') : null,
    },
    {
      icon: Target,
      label: t('fasaaha.completedMissions'),
      value: dashboard.completed_missions,
      accent: 'green',
      zeroHint: dashboard.completed_missions === 0 ? t('fasaaha.zeroMissions') : null,
    },
    {
      icon: Flame,
      label: t('fasaaha.currentStreak'),
      value: dashboard.current_streak,
      accent: 'orange',
      zeroHint: dashboard.current_streak === 0 ? t('fasaaha.zeroStreak') : null,
    },
    {
      icon: CalendarRange,
      label: t('fasaaha.longestStreak'),
      value: dashboard.longest_streak,
      accent: 'purple',
      zeroHint: dashboard.longest_streak === 0 ? t('fasaaha.zeroStreak') : null,
    },
    {
      icon: Award,
      label: t('fasaaha.badges'),
      value: dashboard.badge_count,
      accent: 'pink',
      zeroHint: dashboard.badge_count === 0 ? t('fasaaha.zeroBadges') : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div
        className="flex flex-col gap-4 rounded-2xl border p-5 card-hover sm:flex-row sm:items-center"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}
      >
        <LevelRing pct={levelPct} levelNumber={currentLevel?.number ?? null} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {t('fasaaha.levelProgress')}
            </p>
            {currentLevel && (
              <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-[11px] font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                {levelName || `${t('fasaaha.level')} ${currentLevel.number}`}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {currentLevel
              ? levelRecord
                ? `${levelRecord.missions_completed}/${levelRecord.missions_attempted} ${t('fasaaha.missionsDone')}`
                : `${t('fasaaha.level')} ${currentLevel.number}`
              : t('fasaaha.zeroLevel')}
          </p>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--color-bg-muted)' }}>
            <div
              className="h-full rounded-full bg-primary-500 transition-all"
              style={{ width: `${Math.max(levelPct, 3)}%` }}
            />
          </div>
        </div>
        <p className="shrink-0 text-right text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
          {levelPct}%
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex flex-col gap-2 rounded-2xl border p-4 card-hover"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}
            >
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${ACCENTS[s.accent]}`}>
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-2xl font-bold leading-none" style={{ color: 'var(--color-text-primary)' }}>
                  {s.value}
                </p>
                <p className="mt-1 truncate text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {s.label}
                </p>
              </div>
              {s.zeroHint && (
                <p className="text-[11px] leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                  {s.zeroHint}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
