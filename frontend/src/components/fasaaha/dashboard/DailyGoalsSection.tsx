import { Clock, Mic, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { useFasaahaDailyGoal, useFasaahaWeeklyGoals } from '../../../hooks/useFasaaha';

const DAY_KEYS = ['daySun', 'dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat'];

export default function DailyGoalsSection() {
  const { t } = useLanguage();
  const { data: today, isLoading: loadingToday } = useFasaahaDailyGoal();
  const { data: week = [], isLoading: loadingWeek } = useFasaahaWeeklyGoals();

  if (loadingToday || loadingWeek) {
    return (
      <div className="space-y-3 rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
        {[0, 1].map((i) => (
          <div key={i} className="h-8 animate-pulse rounded-lg" style={{ background: 'var(--color-bg-muted)' }} />
        ))}
      </div>
    );
  }

  const missionPct = today ? Math.min(100, Math.round((today.missions_completed / Math.max(1, today.missions_target)) * 100)) : 0;
  const minutesPct = today ? Math.min(100, Math.round((today.minutes_practiced / Math.max(1, today.minutes_target)) * 100)) : 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border p-5 card-hover" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('fasaaha.dailyGoals')}
        </h3>
        {today?.is_achieved && (
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {t('fasaaha.goalAchieved')}
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" aria-hidden />
              {t('fasaaha.missionsToday')}
            </span>
            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {today ? `${today.missions_completed}/${today.missions_target}` : '0/0'}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--color-bg-muted)' }}>
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-500"
              style={{ width: `${missionPct}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {t('fasaaha.minutesToday')}
            </span>
            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {today ? `${today.minutes_practiced}/${today.minutes_target}` : '0/0'}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--color-bg-muted)' }}>
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${minutesPct}%` }}
            />
          </div>
        </div>
      </div>

      {week.length > 0 && (
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {week.map((goal, i) => {
            const d = new Date(goal.date);
            return (
              <div
                key={goal.id ?? i}
                title={goal.is_achieved ? t('fasaaha.goalAchieved') : `${goal.missions_completed}/${goal.missions_target} ${t('fasaaha.missionsToday')}`}
                className="flex flex-col items-center gap-1 rounded-lg border py-2"
                style={{
                  borderColor: goal.is_achieved ? '#22c55e' : 'var(--color-border-light)',
                  background: goal.is_achieved ? 'rgba(34,197,94,0.08)' : 'var(--color-bg-primary)',
                }}
              >
                <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {t(`fasaaha.${DAY_KEYS[d.getDay()]}`)}
                </span>
                <span className="text-sm leading-none" aria-hidden>
                  {goal.is_achieved ? '✅' : goal.missions_completed > 0 ? '🟡' : '⬜'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 border-t pt-4" style={{ borderColor: 'var(--color-border-light)' }}>
        <p className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
          {today ? `${today.points_earned} ${t('fasaaha.points')}` : `0 ${t('fasaaha.points')}`}
        </p>
        <Link
          to="/student/fasaaha/speak/0"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <Mic className="h-3.5 w-3.5" aria-hidden />
          {t('fasaaha.practiceNow')}
        </Link>
      </div>
    </div>
  );
}
