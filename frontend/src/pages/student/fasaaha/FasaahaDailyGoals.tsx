import { useLanguage } from '../../../context/LanguageContext';
import { useFasaahaDailyGoal, useFasaahaWeeklyGoals } from '../../../hooks/useFasaaha';
import { SkeletonCard } from '../../../components/Skeleton';

export default function FasaahaDailyGoals() {
  const { t } = useLanguage();
  const { data: today, isLoading: loadingToday } = useFasaahaDailyGoal();
  const { data: week = [], isLoading: loadingWeek } = useFasaahaWeeklyGoals();

  if (loadingToday || loadingWeek) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const missionPct = today ? Math.min(100, Math.round((today.missions_completed / Math.max(1, today.missions_target)) * 100)) : 0;
  const minutesPct = today ? Math.min(100, Math.round((today.minutes_practiced / Math.max(1, today.minutes_target)) * 100)) : 0;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('fasaaha.dailyGoals')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {t('fasaaha.dailyGoalsDesc')}
        </p>
      </div>

      {today && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--color-text-muted)' }}>
              {t('fasaaha.missionsToday')}
            </p>
            <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-muted)' }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all"
                style={{ width: `${missionPct}%`, background: missionPct >= 100 ? '#22c55e' : 'var(--color-primary)' }}
              />
            </div>
            <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {today.missions_completed} / {today.missions_target}
            </p>
          </div>

          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--color-text-muted)' }}>
              {t('fasaaha.minutesToday')}
            </p>
            <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-muted)' }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all"
                style={{ width: `${minutesPct}%`, background: minutesPct >= 100 ? '#22c55e' : '#f59e0b' }}
              />
            </div>
            <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {today.minutes_practiced} / {today.minutes_target} min
            </p>
          </div>
        </div>
      )}

      {today && (
        <div className="rounded-xl border p-5 text-center" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
          <p className="text-3xl font-bold" style={{ color: today.is_achieved ? '#22c55e' : 'var(--color-text-primary)' }}>
            {today.is_achieved ? '🎯' : '💪'} {today.points_earned} {t('fasaaha.points')}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {today.is_achieved ? t('fasaaha.goalAchieved') : t('fasaaha.keepGoing')}
          </p>
        </div>
      )}

      {week.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            {t('fasaaha.thisWeek')}
          </h2>
          <div className="grid grid-cols-7 gap-2">
            {week.map((goal, i) => {
              const d = new Date(goal.date);
              const dayName = dayNames[d.getDay()];
              return (
                <div
                  key={goal.id ?? i}
                  className="rounded-lg border p-2 text-center"
                  style={{
                    borderColor: goal.is_achieved ? '#22c55e' : 'var(--color-border)',
                    background: goal.is_achieved ? '#f0fdf4' : 'var(--color-bg-card)',
                  }}
                >
                  <p className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {dayName}
                  </p>
                  <p className="text-lg mt-0.5">{goal.is_achieved ? '✅' : goal.missions_completed > 0 ? '🟡' : '⬜'}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {goal.points_earned}p
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
