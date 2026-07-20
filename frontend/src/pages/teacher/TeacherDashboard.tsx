import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardAPI } from '../../api';
import type { TeacherDashboard as TeacherDashboardType } from '../../types';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
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

  if (loading) return <LoadingSpinner size="lg" className="mt-20" />;
  if (error) return <div className="max-w-7xl mx-auto px-4 py-8"><div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">{error}</div></div>;
  if (!data) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">{t('teacher.dashboard')}</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t('teacher.totalStudents')}
          value={data.total_students}
          color="bg-primary-600"
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
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('teacher.subjectPerformance')}</h2>
          {data.subject_performance.length === 0 ? (
            <p className="text-sm text-gray-500">{t('teacher.noSubjectData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.subject_performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject_name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="average_score" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('teacher.recentActivity')}</h2>
          {data.recent_activity.length === 0 ? (
            <p className="text-sm text-gray-500">{t('teacher.noRecentActivity')}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.recent_activity.map((activity) => (
                <li key={activity.quiz_id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {activity.quiz_title}
                      </p>
                      <p className="text-xs text-gray-500">{activity.subject}</p>
                    </div>
                    <div className="text-start text-xs text-gray-500">
                      <span className="font-medium text-primary-700">{activity.attempt_count} {t('teacher.attempts')}</span>
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

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          to="/teacher/quizzes"
          className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {t('teacher.createQuiz')}
        </Link>
        <Link
          to="/teacher/students"
          className="inline-flex items-center rounded-lg border border-primary-600 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
        >
          {t('teacher.viewStudents')}
        </Link>
      </div>
    </div>
  );
}
