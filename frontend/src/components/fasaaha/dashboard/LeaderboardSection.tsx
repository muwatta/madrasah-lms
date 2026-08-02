import { Medal, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { useFasaahaLeaderboard } from '../../../hooks/useFasaaha';

const RANK_STYLES: Record<number, string> = {
  1: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  2: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
  3: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
};

export default function LeaderboardSection() {
  const { t } = useLanguage();
  const { data: entries = [], isLoading } = useFasaahaLeaderboard('weekly');

  const top = entries.slice(0, 5);

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            <Trophy className="h-5 w-5 text-amber-500" aria-hidden />
            {t('fasaaha.leaderboard')}
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {t('fasaaha.leaderboardDesc')} · {t('fasaaha.period_weekly')}
          </p>
        </div>
        <Link to="/student/fasaaha/leaderboard" className="shrink-0 text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400">
          {t('fasaaha.viewFullLeaderboard')}
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-muted)' }} />
          ))}
        </div>
      ) : top.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-6 text-center" style={{ borderColor: 'var(--color-border)' }}>
          <Medal className="h-8 w-8 text-primary-400" aria-hidden />
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t('fasaaha.competitionEmpty')}
          </p>
          <Link to="/student/fasaaha/missions" className="mt-1 text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400">
            {t('fasaaha.heroBrowseMissions')}
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {top.map((entry) => {
            const rankStyle = RANK_STYLES[entry.rank];
            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:shadow-sm"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={
                    rankStyle
                      ? { background: rankStyle, color: '#fff' }
                      : { background: 'var(--color-bg-muted)', color: 'var(--color-text-muted)' }
                  }
                >
                  {entry.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {entry.student_name}
                  </p>
                  <div className="flex gap-3 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    <span>{entry.missions_completed} {t('fasaaha.missionsDone')}</span>
                    {entry.current_streak > 0 && <span>🔥 {entry.current_streak}d</span>}
                  </div>
                </div>
                <p className="shrink-0 text-base font-bold" style={{ color: 'var(--color-primary)' }}>
                  {entry.points}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
