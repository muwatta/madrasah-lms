import { useEffect, useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { fasaahaAPI } from '../../../api';
import type { StudentLevelProgress, SpeakingAttempt, StudentStreak } from '../../../types';
import { unwrapPaginated } from '../../../api/client';
import { SkeletonStatsGrid } from '../../../components/Skeleton';

export default function FasaahaMyProgress() {
  const { t, language } = useLanguage();
  const [progress, setProgress] = useState<StudentLevelProgress[]>([]);
  const [attempts, setAttempts] = useState<SpeakingAttempt[]>([]);
  const [streak, setStreak] = useState<StudentStreak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fasaahaAPI.progress.list(), fasaahaAPI.attempts.list(), fasaahaAPI.streaks.get()])
      .then(([p, a, s]) => {
        setProgress(unwrapPaginated(p.data));
        setAttempts(unwrapPaginated(a.data).slice(0, 10));
        const streaks = unwrapPaginated(s.data);
        if (streaks.length > 0) setStreak(streaks[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonStatsGrid />;

  const totalAttempts = attempts.length;
  const avgScore = attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + (a.final_score ?? a.ai_score ?? 0), 0) / attempts.length) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.progressTitle')}</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('fasaaha.totalAttempts'), value: totalAttempts },
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
              const pct = p.total_missions_available > 0 ? Math.round((p.missions_completed / p.total_missions_available) * 100) : 0;
              return (
                <div key={p.id} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${p.is_completed ? 'bg-green-500 text-white' : 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'}`}>
                    {p.level_name}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{p.missions_completed}/{p.total_missions_available} {t('fasaaha.missionsDone')}</span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{p.average_score > 0 ? `${Math.round(p.average_score)}% avg` : ''}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border-light)' }}>
                      <div className={`h-full rounded-full ${p.is_completed ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  {p.is_completed && <span className="text-xs text-green-600 dark:text-green-400 shrink-0">{t('fasaaha.completed')}</span>}
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
                <span className={`text-sm font-bold shrink-0 ${(a.final_score ?? a.ai_score ?? 0) >= 70 ? 'text-green-600 dark:text-green-400' : 'text-orange-500'}`}>
                  {a.final_score ?? a.ai_score ?? '-'}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
