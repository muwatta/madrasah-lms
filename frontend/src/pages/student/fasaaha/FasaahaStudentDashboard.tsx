import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { useFasaahaDashboard, useFasaahaProgress } from '../../../hooks/useFasaaha';
import { SkeletonStatsGrid } from '../../../components/Skeleton';

export default function FasaahaStudentDashboard() {
  const { t, language } = useLanguage();
  const { data, isLoading: loading, error } = useFasaahaDashboard();
  const { data: progress = [] } = useFasaahaProgress();

  if (loading) return <SkeletonStatsGrid />;
  if (error) return <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">{t('common.loadError')}</div>;
  if (!data) return null;

  const stats = [
    { label: t('fasaaha.currentLevel'), value: data.current_level ? (language === 'ar' ? data.current_level.name_ar : data.current_level.name) : '-', color: 'bg-primary-500' },
    { label: t('fasaaha.totalPoints'), value: data.total_points, color: 'bg-amber-500' },
    { label: t('fasaaha.completedMissions'), value: data.completed_missions, color: 'bg-green-500' },
    { label: t('fasaaha.currentStreak'), value: `${data.current_streak} 🔥`, color: 'bg-orange-500' },
    { label: t('fasaaha.longestStreak'), value: data.longest_streak, color: 'bg-red-500' },
    { label: t('fasaaha.badges'), value: data.badge_count, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.dashboardTitle')}</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border p-4 card-hover" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
            <div className={`w-2 h-2 rounded-full ${s.color} mb-2`} />
            <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/student/fasaaha/speak/0', label: t('fasaaha.speak'), icon: '🎙️' },
          { to: '/student/fasaaha/missions', label: t('fasaaha.viewMissions'), icon: '📋' },
          { to: '/student/fasaaha/progress', label: t('fasaaha.myProgress'), icon: '📈' },
          { to: '/student/fasaaha/badges', label: t('fasaaha.myBadgesLink'), icon: '🏅' },
        ].map(a => (
          <Link key={a.to} to={a.to} className="rounded-xl border p-4 text-center card-hover btn-press" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
            <span className="text-2xl block mb-1">{a.icon}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{a.label}</span>
          </Link>
        ))}
      </div>

      {progress.length > 0 && (
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.levelsTitle')}</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {progress.map(p => {
              const pct = p.missions_attempted > 0 ? Math.round((p.missions_completed / p.missions_attempted) * 100) : 0;
              const completed = p.status === 'completed';
              return (
                <div key={p.id} className={`shrink-0 w-36 rounded-xl border p-3 text-center ${completed ? 'border-green-400' : ''}`}
                  style={{ borderColor: completed ? undefined : 'var(--color-border-light)' }}>
                  <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold ${completed ? 'bg-green-500 text-white' : 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'}`}>
                    {p.level_number}
                  </div>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{language === 'ar' ? p.level_name_ar : p.level_name}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>{p.missions_completed}/{p.missions_attempted}</p>
                  <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: 'var(--color-border-light)' }}>
                    <div className={`h-full rounded-full ${completed ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}