import { useState, useEffect } from 'react';
import { interventionAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { Skeleton, SkeletonStatsGrid, SkeletonChart, SkeletonCard } from '../../components/Skeleton';

interface DailyAttempt {
  date: string;
  count: number;
}

interface TeacherStat {
  teacher_id: number;
  name: string;
  total_attempts: number;
  average_score: number;
  student_count: number;
}

interface SubjectTrend {
  subject_id: number;
  name_ar: string;
  name_en: string;
  average_score: number;
  attempt_count: number;
}

interface EngagementData {
  weekly_active_students: number;
  daily_attempts: DailyAttempt[];
  teacher_stats: TeacherStat[];
  subject_trends: SubjectTrend[];
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-500';
}

function getBarColor(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-400';
}

export default function AdminEngagementPage() {
  const { t, language } = useLanguage();
  const [data, setData] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    interventionAPI.engagement()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load engagement data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-8 w-64" />
      <SkeletonStatsGrid />
      <SkeletonChart />
      <SkeletonCard />
    </div>
  );
  if (error) return <div className="max-w-5xl mx-auto px-4 py-8"><div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-400">{error}</div></div>;
  if (!data) return null;

  const maxDaily = Math.max(...data.daily_attempts.map(d => d.count), 1);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-[var(--color-text-primary)]">{t('engagement.title')}</h1>

      <div className="rounded-xl border border-gray-100 dark:border-[var(--color-border-light)] bg-white dark:bg-[var(--color-bg-secondary)] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
            <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-[var(--color-text-muted)]">{t('engagement.weeklyActive')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-[var(--color-text-primary)]">{data.weekly_active_students}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 dark:border-[var(--color-border-light)] bg-white dark:bg-[var(--color-bg-secondary)] p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-[var(--color-text-secondary)]">{t('engagement.dailyAttempts')}</h2>
        <div className="flex items-end gap-2" style={{ height: 120 }}>
          {data.daily_attempts.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-gray-500 dark:text-[var(--color-text-muted)]">{d.count}</span>
              <div className={`w-full rounded-t-md transition-all ${d.count > 0 ? 'bg-primary-400' : 'bg-gray-100'}`}
                style={{ height: `${d.count > 0 ? (d.count / maxDaily) * 100 : 4}%` }} />
              <span className="text-[10px] text-gray-400 dark:text-[var(--color-text-muted)]">{d.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 dark:border-[var(--color-border-light)] bg-white dark:bg-[var(--color-bg-secondary)] p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-[var(--color-text-secondary)]">{t('engagement.teacherStats')}</h2>
        {data.teacher_stats.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-[var(--color-text-muted)]">{language === 'ar' ? 'لا يوجد معلمون بعد' : 'No teachers yet'}</p>
        ) : (
          <div className="space-y-3">
            {data.teacher_stats.sort((a, b) => b.average_score - a.average_score).map((t, i) => (
              <div key={t.teacher_id} className="flex items-center gap-4 rounded-lg border border-gray-50 dark:border-[var(--color-border-light)] bg-gray-50/50 dark:bg-[var(--color-bg-primary)] p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  #{i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-[var(--color-text-primary)]">{t.name}</p>
                  <p className="text-xs text-gray-400 dark:text-[var(--color-text-muted)]">{t.student_count} {language === 'ar' ? 'طالب' : 'students'} • {t.total_attempts} {language === 'ar' ? 'محاولة' : 'attempts'}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${getScoreColor(t.average_score)}`}>{t.average_score}%</p>
                  <div className="mt-1 h-1.5 w-20 rounded-full bg-gray-200">
                    <div className={`h-1.5 rounded-full ${getBarColor(t.average_score)}`} style={{ width: `${t.average_score}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-100 dark:border-[var(--color-border-light)] bg-white dark:bg-[var(--color-bg-secondary)] p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-[var(--color-text-secondary)]">{t('engagement.subjectTrends')}</h2>
        {data.subject_trends.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-[var(--color-text-muted)]">{language === 'ar' ? 'لا توجد مواد بعد' : 'No subjects yet'}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.subject_trends.map((s) => (
              <div key={s.subject_id} className="rounded-lg border border-gray-50 dark:border-[var(--color-border-light)] bg-gray-50/50 dark:bg-[var(--color-bg-primary)] p-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-[var(--color-text-primary)]">{language === 'ar' ? s.name_ar : s.name_en}</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-gray-200">
                    <div className={`h-2 rounded-full ${getBarColor(s.average_score)}`} style={{ width: `${s.average_score}%` }} />
                  </div>
                  <span className={`text-sm font-bold ${getScoreColor(s.average_score)}`}>{s.average_score}%</span>
                </div>
                <p className="mt-1 text-xs text-gray-400">{s.attempt_count} {language === 'ar' ? 'محاولة' : 'attempts'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
