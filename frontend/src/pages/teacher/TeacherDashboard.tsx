import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardAPI } from '../../api';
import type { TeacherDashboard as TeacherDashboardType } from '../../types';
import StatCard from '../../components/StatCard';
import { SkeletonStatsGrid, SkeletonChart, SkeletonCard } from '../../components/Skeleton';
import { useLanguage } from '../../context/LanguageContext';

export default function TeacherDashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState<TeacherDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardAPI.teacher()
      .then((res) => setData(res.data))
      .catch(() => setError(t('teacher.loadDashboardFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-4 w-64 mt-2 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
        <SkeletonStatsGrid />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <SkeletonChart />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) return <div className="max-w-7xl mx-auto px-4 py-8"><div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-400">{error}</div></div>;
  if (!data) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{t('teacher.dashboard')}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{t('guides.teacherDashboard')}</p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t('teacher.totalStudents')}
          value={data.total_students}
          color="bg-primary-600"
          delay={0}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          title={t('teacher.totalQuizzes')}
          value={data.total_quizzes}
          color="bg-primary-700"
          delay={60}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          title={t('teacher.totalAttempts')}
          value={data.total_attempts}
          color="bg-primary-800"
          delay={120}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="card-hover rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: '180ms' }}>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{t('teacher.subjectPerformance')}</h2>
          {data.subject_performance.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('teacher.noSubjectData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.subject_performance}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="subject_name" tick={{ fontSize: 12 }} stroke="var(--color-text-muted)" />
                <YAxis domain={[0, 100]} stroke="var(--color-text-muted)" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
                <Bar dataKey="average_score" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card-hover rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: '240ms' }}>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{t('teacher.recentActivity')}</h2>
          {data.recent_activity.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('teacher.noRecentActivity')}</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.recent_activity.map((activity) => (
                <li key={activity.quiz_id} className="py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors px-2 -mx-2">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {activity.quiz_title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.subject}</p>
                    </div>
                    <div className="text-start text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-primary-700 dark:text-primary-400">{activity.attempt_count} {t('teacher.attempts')}</span>
                      <br />
                      {t('teacher.average')} {activity.average_score.toFixed(1)}%
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4 opacity-0 animate-slide-up" style={{ animationDelay: '300ms' }}>
        <Link
          to="/teacher/quizzes"
          className="btn-press inline-flex items-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 hover:shadow transition-all"
        >
          {t('teacher.createQuiz')}
        </Link>
        <Link
          to="/teacher/students"
          className="btn-press inline-flex items-center rounded-xl border border-primary-600 px-5 py-2.5 text-sm font-medium text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
        >
          {t('teacher.viewStudents')}
        </Link>
      </div>

      <div className="mt-8 opacity-0 animate-slide-up" style={{ animationDelay: '360ms' }}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('quickActions')}</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/teacher/attendance"
            className="btn-press inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 hover:shadow transition-all"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
            {t('teacher.markAttendance')}
          </Link>
          <Link
            to="/teacher/announcements"
            className="btn-press inline-flex items-center gap-2 rounded-xl border border-primary-600 px-5 py-2.5 text-sm font-medium text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.5.5 0 01-.702-.422 7.746 7.746 0 01-.123-2.936m0 0a60.426 60.426 0 00-2.09.09m2.09-.09c1.03-.085 2.072-.13 3.124-.13m0 0c2.79 0 5.128.725 6.248 1.976.285.322.502.68.637 1.066.298.855-1.023 1.427-1.712.803-1.34-1.214-3.438-1.845-5.173-1.845m0 0v-2.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t('nav.announcements')}
          </Link>
        </div>
      </div>
    </div>
  );
}
