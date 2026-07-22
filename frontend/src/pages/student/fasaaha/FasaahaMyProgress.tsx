import { useLanguage } from '../../../context/LanguageContext';
import { useFasaahaProgress, useFasaahaAttempts, useFasaahaStreak } from '../../../hooks/useFasaaha';
import { SkeletonStatsGrid } from '../../../components/Skeleton';

export default function FasaahaMyProgress() {
  const { t, language } = useLanguage();
  const { data: progress = [], isLoading: loadingProgress } = useFasaahaProgress();
  const { data: attemptsRaw = [], isLoading: loadingAttempts } = useFasaahaAttempts({ page_size: 10 });
  const { data: streakData = [] } = useFasaahaStreak();

  const loading = loadingProgress || loadingAttempts;
  const attempts = attemptsRaw.slice(0, 10);
  const streak = streakData[0] ?? null;

  if (loading) return <SkeletonStatsGrid />;

  const avgScore = attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + (a.final_score ?? a.ai_analysis?.overall_score ?? 0), 0) / attempts.length) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.progressTitle')}</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('fasaaha.totalAttempts'), value: attempts.length },
          { label: t('fasaaha.avgScore'), value: `${avgScore}%` },
          { label: t('fasaaha.currentStreak'), value: `${streak?.current_streak ?? 0} 🔥` },
          { label: t('fasaaha.longestStreak'), value: streak?.longest_streak ?? 0 },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {progress.length > 0 && (
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.levelsTitle')}</h2>
          <div className="space-y-3">
            {progress.map(p => {
              const pct = p.missions_attempted > 0 ? Math.round((p.missions_completed / p.missions_attempted) * 100) : 0;
              const completed = p.status === 'completed';
              return (
                <div key={p.id} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${completed ? 'bg-green-500 text-white' : 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'}`}>
                    {p.level_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{language === 'ar' ? p.level_name_ar : p.level_name} — {p.missions_completed}/{p.missions_attempted}</span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{p.average_score > 0 ? `${Math.round(p.average_score)}% avg` : ''}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border-light)' }}>
                      <div className={`h-full rounded-full ${completed ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  {completed && <span className="text-xs text-green-600 dark:text-green-400 shrink-0">{t('fasaaha.completed')}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {attempts.length > 0 && (
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.recentAttempts')}</h2>
          <div className="space-y-2">
            {attempts.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--color-border-light)' }}>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{a.mission_title}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-bold shrink-0 ${(a.final_score ?? 0) >= 70 ? 'text-green-600 dark:text-green-400' : 'text-orange-500'}`}>
                  {a.final_score ? `${Math.round(a.final_score)}%` : a.ai_analysis ? `${Math.round(a.ai_analysis.overall_score)}%` : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}