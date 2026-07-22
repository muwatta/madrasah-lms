import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { fasaahaAPI } from '../../../api';
import type { FasaahaTeacherDashboard as DashType, SpeakingAttempt } from '../../../types';
import { SkeletonStatsGrid } from '../../../components/Skeleton';

export default function FasaahaTeacherDashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState<DashType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fasaahaAPI.dashboards.teacher()
      .then(res => setData(res.data))
      .catch(() => setError(t('common.loadError')))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) return <SkeletonStatsGrid />;
  if (error) return <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</div>;
  if (!data) return null;

  const stats = [
    { label: t('fasaaha.missionsManage'), value: Array.isArray(data.classes_taught) ? data.classes_taught[0] ?? 0 : 0, color: 'bg-blue-500' },
    { label: t('fasaaha.totalStudents'), value: data.total_students, color: 'bg-green-500' },
    { label: t('fasaaha.pendingReviews'), value: data.pending_reviews_count, color: 'bg-orange-500' },
    { label: t('fasaaha.totalAttempts'), value: data.total_attempts, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.teacherDashboard')}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border p-4 card-hover" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
            <div className={`w-2 h-2 rounded-full ${s.color} mb-2`} />
            <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Link to="/teacher/fasaaha/missions" className="btn-press px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium">{t('fasaaha.manageMissions')}</Link>
        <Link to="/teacher/fasaaha/review" className="btn-press px-4 py-2 rounded-lg border text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>{t('fasaaha.reviews')} ({data.pending_reviews_count})</Link>
        <Link to="/teacher/fasaaha/analytics" className="btn-press px-4 py-2 rounded-lg border text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>{t('fasaaha.analyticsTitle')}</Link>
      </div>

      {data.pending_reviews.length > 0 && (
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.pendingReviews')}</h2>
          <div className="space-y-2">
            {data.pending_reviews.map((a: SpeakingAttempt) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--color-border-light)' }}>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{a.student_name} — {a.mission_title}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
                <Link to={`/teacher/fasaaha/review?attempt=${a.id}`} className="text-xs font-semibold text-primary-600 hover:underline shrink-0">{t('fasaaha.reviewAttempt')}</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
