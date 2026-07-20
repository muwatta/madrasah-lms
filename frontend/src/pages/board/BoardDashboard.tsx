import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardAPI } from '../../api';
import type { BoardDashboard as BoardDashboardType } from '../../types';
import StatCard from '../../components/StatCard';
import { SkeletonStatsGrid, SkeletonTable, SkeletonChart } from '../../components/Skeleton';
import { useLanguage } from '../../context/LanguageContext';

export default function BoardDashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState<BoardDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardAPI.board()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || t('boardDashboard.loadFailed')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <SkeletonStatsGrid />
        <SkeletonTable rows={4} />
        <SkeletonChart />
        <SkeletonChart />
      </div>
    );
  }
  if (error) return <div className="max-w-7xl mx-auto px-4 py-8"><div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-400 flex items-center gap-3"><svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>{error}</div></div>;
  if (!data) return null;

  const perfColor = data.average_performance >= 70 ? 'text-green-600 dark:text-green-400' : data.average_performance >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="space-y-6">
      <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{t('boardDashboard.title')}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('guides.boardDashboard')}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('adminDashboard.totalStudents')} value={data.total_students} delay={0} icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>} />
        <StatCard title={t('boardDashboard.totalTeachers')} value={data.total_teachers} color="bg-purple-600" delay={60} icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>} />
        <StatCard title={t('adminDashboard.totalSubjects')} value={data.total_subjects} color="bg-teal-600" delay={120} icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>} />
        <div className="card-hover rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: '180ms' }}>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('adminDashboard.avgPerformance')}</p>
          <p className={`mt-1 text-2xl font-bold ${perfColor}`}>{data.average_performance.toFixed(1)}%</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${Math.min(data.average_performance, 100)}%` }} />
          </div>
        </div>
      </div>

      {data.teacher_effectiveness.length > 0 && (
        <div className="card-hover rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: '240ms' }}>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{t('boardDashboard.effectivenessRanking')}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-end text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  <th className="pb-3 pl-4">#</th>
                  <th className="pb-3 pl-4">{t('fields.teacher')}</th>
                  <th className="pb-3 pl-4">{t('boardDashboard.quizzesCreated')}</th>
                  <th className="pb-3 pl-4">{t('boardDashboard.avgStudentScore')}</th>
                  <th className="pb-3">{t('teacher.totalAttempts')}</th>
                </tr>
              </thead>
              <tbody>
                {[...data.teacher_effectiveness]
                  .sort((a, b) => b.average_student_score - a.average_student_score)
                  .map((item, i) => {
                    const rankColor = i === 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : i === 1 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : i === 2 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
                    const scoreColor = item.average_student_score >= 70 ? 'text-green-600 dark:text-green-400' : item.average_student_score >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
                    return (
                      <tr key={item.teacher_id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="py-3 pl-4">
                          <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${rankColor}`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-3 pl-4 font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                        <td className="py-3 pl-4 text-gray-600 dark:text-gray-400">{item.quiz_count}</td>
                        <td className={`py-3 pl-4 font-semibold ${scoreColor}`}>{item.average_student_score.toFixed(1)}%</td>
                        <td className="py-3 text-gray-600 dark:text-gray-400">{item.total_attempts}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.top_subjects.length > 0 && (
        <div className="card-hover rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{t('boardDashboard.topSubjects')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.top_subjects}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
              <Bar dataKey="avg_score" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.teacher_effectiveness.length > 0 && (
        <div className="card-hover rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: '360ms' }}>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{t('boardDashboard.performanceByTeacher')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.teacher_effectiveness.map((item) => ({ name: item.name.length > 12 ? item.name.slice(0, 12) + '…' : item.name, score: item.average_student_score }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
              <Bar dataKey="score" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card-hover rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: '420ms' }}>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{t('quickLinks')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link to="/board/finance" className="btn-press flex items-center gap-2 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/30 p-4 text-center font-medium text-primary-700 dark:text-primary-400 transition-all hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:shadow-sm">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t('nav.finance')}
          </Link>
          <Link to="/board/attendance" className="btn-press flex items-center gap-2 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/30 p-4 text-center font-medium text-primary-700 dark:text-primary-400 transition-all hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:shadow-sm">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
            {t('nav.attendance')}
          </Link>
          <Link to="/board/announcements" className="btn-press flex items-center gap-2 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/30 p-4 text-center font-medium text-primary-700 dark:text-primary-400 transition-all hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:shadow-sm">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.5.5 0 01-.702-.422 7.746 7.746 0 01-.123-2.936m0 0a60.426 60.426 0 00-2.09.09m2.09-.09c1.03-.085 2.072-.13 3.124-.13m0 0c2.79 0 5.128.725 6.248 1.976.285.322.502.68.637 1.066.298.855-1.023 1.427-1.712.803-1.34-1.214-3.438-1.845-5.173-1.845m0 0v-2.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t('nav.announcements')}
          </Link>
          <Link to="/board/reports" className="btn-press flex items-center gap-2 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/30 p-4 text-center font-medium text-primary-700 dark:text-primary-400 transition-all hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:shadow-sm">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            {t('nav.reports')}
          </Link>
          <Link to="/board/engagement" className="btn-press flex items-center gap-2 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/30 p-4 text-center font-medium text-primary-700 dark:text-primary-400 transition-all hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:shadow-sm">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
            {t('nav.engagement')}
          </Link>
        </div>
      </div>
    </div>
  );
}
