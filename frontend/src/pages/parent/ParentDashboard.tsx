import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardAPI } from '../../api';
import type { ParentDashboard as ParentDashboardType } from '../../types';
import { SkeletonStatsGrid, SkeletonCard, SkeletonTable, SkeletonChart } from '../../components/Skeleton';
import { useLanguage } from '../../context/LanguageContext';

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function ParentDashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState<ParentDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardAPI.parent()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || t('parentDashboard.loadFailed')))
      .finally(() => setLoading(false));
  }, []);

  const summaryStats = useMemo(() => {
    if (!data?.children?.length) return null;
    const totalChildren = data.children.length;
    const totalQuizzes = data.children.reduce((sum, c) => sum + c.total_quizzes, 0);
    const totalExams = data.children.reduce((sum, c) => sum + c.exam_results.length, 0);
    const averages = data.children.filter((c) => c.overall_average != null).map((c) => c.overall_average!);
    const overallAvg = averages.length > 0 ? averages.reduce((s, a) => s + a, 0) / averages.length : null;
    return { totalChildren, totalQuizzes, totalExams, overallAvg };
  }, [data]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <SkeletonStatsGrid />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
        <SkeletonTable rows={3} />
        <SkeletonChart />
      </div>
    );
  }
  if (error) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-400 flex items-center gap-3">
        <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        {error}
      </div>
    </div>
  );
  if (!data?.children?.length) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{t('parentDashboard.title')}</h1>
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
          <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400">{t('parentDashboard.noChildren')}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{t('parentDashboard.title')}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('guides.parentDashboard')}</p>

      {/* Summary stats */}
      {summaryStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card-hover bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center opacity-0 animate-slide-up" style={{ animationDelay: '0ms' }}>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summaryStats.totalChildren}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('parentDashboard.totalChildren')}</div>
          </div>
          <div className="card-hover bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center opacity-0 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summaryStats.totalQuizzes}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('parentDashboard.totalQuizzes')}</div>
          </div>
          <div className="card-hover bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summaryStats.totalExams}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('student.examResults')}</div>
          </div>
          <div className="card-hover bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center opacity-0 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {summaryStats.overallAvg != null ? `${summaryStats.overallAvg.toFixed(1)}%` : '-'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('parentDashboard.overallAverage')}</div>
          </div>
        </div>
      )}

      {/* Attendance & Fee Summary */}
      {data.attendance_summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Attendance Summary */}
          <div className="card-hover bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 opacity-0 animate-slide-up" style={{ animationDelay: '180ms' }}>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('parentDashboard.attendanceSummary')}</h3>
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-3xl font-bold ${
                data.attendance_summary.overall_rate >= 80 ? 'text-green-600 dark:text-green-400' :
                data.attendance_summary.overall_rate >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {data.attendance_summary.overall_rate}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('parentDashboard.overallRate')}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-3">
              <div
                className={`h-1.5 rounded-full ${
                  data.attendance_summary.overall_rate >= 80 ? 'bg-green-500' :
                  data.attendance_summary.overall_rate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(data.attendance_summary.overall_rate, 100)}%` }}
              />
            </div>
            <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span>{t('parentDashboard.present')}: <strong>{data.attendance_summary.present}</strong></span>
              <span>{t('parentDashboard.absent')}: <strong>{data.attendance_summary.absent}</strong></span>
              <span>{t('attendance.totalDays')}: <strong>{data.attendance_summary.total_days}</strong></span>
            </div>
          </div>

          {/* Fee Summary */}
          <div className="card-hover bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 opacity-0 animate-slide-up" style={{ animationDelay: '220ms' }}>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('parentDashboard.feeSummary')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('parentDashboard.totalDue')}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{data.fee_summary.total_due.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('parentDashboard.totalPaid')}</span>
                <span className="font-medium text-green-600 dark:text-green-400">{data.fee_summary.total_paid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('parentDashboard.outstanding')}</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">{data.fee_summary.outstanding.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('parentDashboard.overdueCount')}</span>
                <span className={`font-medium ${data.fee_summary.overdue_count > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                  {data.fee_summary.overdue_count}
                </span>
              </div>
            </div>
            <Link to="/parent/fees" className="btn-press mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
              {t('parentDashboard.viewFees')}
            </Link>
          </div>
        </div>
      )}

      {/* Children */}
      {data.children.map((child, childIdx) => (
        <div key={child.id} className="card-hover rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm space-y-5 opacity-0 animate-slide-up" style={{ animationDelay: `${200 + childIdx * 80}ms` }}>
          {/* Child header */}
          <div className="flex items-center gap-4">
            <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(child.name)}`}>
              {getInitials(child.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{child.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{child.email}</p>
            </div>
            <div className="text-start shrink-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('parentDashboard.overallAverage')}</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {child.overall_average != null ? `${child.overall_average.toFixed(1)}%` : '-'}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3 text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{child.subjects.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('parentDashboard.subjects')}</div>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3 text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{child.recent_attempts.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('parentDashboard.quizzesTaken')}</div>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3 text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{child.exam_results.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('parentDashboard.examsTaken')}</div>
            </div>
          </div>

          {/* Subjects */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('parentDashboard.subjects')}</h3>
            <div className="flex flex-wrap gap-2">
              {child.subjects.map((subject) => (
                <span key={subject} className="inline-block rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                  {subject}
                </span>
              ))}
            </div>
          </div>

          {/* Recent quiz attempts */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('parentDashboard.recentQuizAttempts')}</h3>
            {child.recent_attempts.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-3">{t('parentDashboard.noRecentAttempts')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 text-end text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      <th className="pb-2 ps-4">{t('fields.name')}</th>
                      <th className="pb-2 ps-4">{t('fields.score')}</th>
                      <th className="pb-2">{t('fields.date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {child.recent_attempts.map((attempt, i) => {
                      const pct = attempt.percentage ?? 0;
                      return (
                        <tr key={i} className="border-b border-gray-50 dark:border-gray-700 last:border-0">
                          <td className="py-2.5 ps-4 text-gray-900 dark:text-gray-100 font-medium">{attempt.quiz_title}</td>
                          <td className="py-2.5 ps-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className={`font-medium text-xs ${pct >= 70 ? 'text-green-600 dark:text-green-400' : pct >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                {attempt.percentage != null ? `${pct.toFixed(0)}%` : t('enrollmentStatus.pending')}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 text-gray-500 dark:text-gray-400 text-xs">
                            {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : t('enrollmentStatus.inProgress')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Exam results */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('student.examResults')}</h3>
            {child.exam_results.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-3">{t('parentDashboard.noExamResults')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 text-end text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      <th className="pb-2 ps-4">{t('teacher.exam')}</th>
                      <th className="pb-2 ps-4">{t('fields.score')}</th>
                      <th className="pb-2 ps-4">{t('fields.grade')}</th>
                      <th className="pb-2">{t('fields.date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {child.exam_results.map((result, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-700 last:border-0">
                        <td className="py-2.5 ps-4 text-gray-900 dark:text-gray-100 font-medium">{result.exam_title}</td>
                        <td className="py-2.5 ps-4 font-medium text-gray-900 dark:text-gray-100">{result.score}</td>
                        <td className="py-2.5 ps-4">
                          <span className={`inline-block rounded-lg px-2.5 py-0.5 text-xs font-bold ${
                            result.grade === 'A' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            result.grade === 'B' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                            result.grade === 'C' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>{result.grade}</span>
                        </td>
                        <td className="py-2.5 text-gray-500 dark:text-gray-400 text-xs">{new Date(result.exam_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Performance trend */}
          {child.recent_attempts.length > 1 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('parentDashboard.performanceTrend')}</h3>
              <div className="rounded-lg border border-gray-100 dark:border-gray-700 p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={child.recent_attempts
                    .filter((a) => a.percentage != null)
                    .map((a) => ({ name: a.quiz_title.length > 15 ? a.quiz_title.slice(0, 15) + '…' : a.quiz_title, score: a.percentage }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Quick Links */}
      <div className="card-hover rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: '400ms' }}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('quickLinks')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/parent/fees" className="btn-press flex items-center gap-3 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/30 p-4 font-medium text-primary-700 dark:text-primary-400 transition-all hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:shadow-sm">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t('parentDashboard.feeStatus')}
          </Link>
          <Link to="/parent/attendance" className="btn-press flex items-center gap-3 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/30 p-4 font-medium text-primary-700 dark:text-primary-400 transition-all hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:shadow-sm">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
            {t('nav.attendance')}
          </Link>
          <Link to="/parent/announcements" className="btn-press flex items-center gap-3 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/30 p-4 font-medium text-primary-700 dark:text-primary-400 transition-all hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:shadow-sm">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.5.5 0 01-.702-.422 7.746 7.746 0 01-.123-2.936m0 0a60.426 60.426 0 00-2.09.09m2.09-.09c1.03-.085 2.072-.13 3.124-.13m0 0c2.79 0 5.128.725 6.248 1.976.285.322.502.68.637 1.066.298.855-1.023 1.427-1.712.803-1.34-1.214-3.438-1.845-5.173-1.845m0 0v-2.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t('nav.announcements')}
          </Link>
        </div>
      </div>
    </div>
  );
}
