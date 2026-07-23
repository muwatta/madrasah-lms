import { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useFasaahaLeaderboard } from '../../../hooks/useFasaaha';
import { SkeletonCard } from '../../../components/Skeleton';

const PERIODS = ['weekly', 'monthly', 'all_time'] as const;

const RANK_STYLES: Record<number, { bg: string; text: string }> = {
  1: { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', text: '#fff' },
  2: { bg: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)', text: '#fff' },
  3: { bg: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)', text: '#fff' },
};

export default function FasaahaLeaderboard() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<string>('weekly');
  const { data: entries = [], isLoading } = useFasaahaLeaderboard(period);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('fasaaha.leaderboard')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {t('fasaaha.leaderboardDesc')}
        </p>
      </div>

      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p
                ? 'bg-primary-600 text-white'
                : 'border hover:bg-gray-50'
            }`}
            style={
              period !== p
                ? { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }
                : undefined
            }
          >
            {t(`fasaaha.period_${p}`)}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.noLeaderboardData')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const rankStyle = RANK_STYLES[entry.rank];
            return (
              <div
                key={entry.id}
                className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:shadow-sm"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shrink-0"
                  style={
                    rankStyle
                      ? { background: rankStyle.bg, color: rankStyle.text }
                      : { background: 'var(--color-bg-muted)', color: 'var(--color-text-muted)' }
                  }
                >
                  {entry.rank}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {entry.student_name}
                  </p>
                  <div className="flex gap-3 mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <span>{entry.missions_completed} {t('fasaaha.missionsDone')}</span>
                    <span>{Math.round(entry.average_score)}% {t('fasaaha.avgScore')}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                    {entry.points}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.points')}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
