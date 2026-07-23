import { useLanguage } from '../../context/LanguageContext';
import { useFasaahaDailyGoal } from '../../hooks/useFasaaha';

export default function DailyGoalsWidget() {
  const { t } = useLanguage();
  const { data: goal } = useFasaahaDailyGoal();

  if (!goal) return null;

  const missionPct = Math.min(100, Math.round((goal.missions_completed / Math.max(1, goal.missions_target)) * 100));
  const minutesPct = Math.min(100, Math.round((goal.minutes_practiced / Math.max(1, goal.minutes_target)) * 100));

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {t('fasaaha.dailyGoals')}
        </h3>
        {goal.is_achieved && <span className="text-xs font-medium text-green-600">{t('fasaaha.goalAchieved')}</span>}
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
            <span>{t('fasaaha.missionsToday')}</span>
            <span>{goal.missions_completed}/{goal.missions_target}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-muted)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${missionPct}%`, background: missionPct >= 100 ? '#22c55e' : 'var(--color-primary)' }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
            <span>{t('fasaaha.minutesToday')}</span>
            <span>{goal.minutes_practiced}/{goal.minutes_target} min</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-muted)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${minutesPct}%`, background: minutesPct >= 100 ? '#22c55e' : '#f59e0b' }}
            />
          </div>
        </div>
      </div>

      <p className="text-xs mt-3 font-medium" style={{ color: 'var(--color-primary)' }}>
        {goal.points_earned} {t('fasaaha.points')}
      </p>
    </div>
  );
}
