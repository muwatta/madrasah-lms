import { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardAPI } from '../../api';
import type { ParentDashboard as ParentDashboardType } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
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

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (error) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 flex items-center gap-3">
        <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        {error}
      </div>
    </div>
  );
  if (!data?.children?.length) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('parentDashboard.title')}</h1>
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-gray-500">{t('parentDashboard.noChildren')}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('parentDashboard.title')}</h1>
      <p className="text-sm text-gray-500 mb-6">{t('guides.parentDashboard')}</p>

      {/* Summary stats */}
      {summaryStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card-hover bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center opacity-0 animate-slide-up" style={{ animationDelay: '0ms' }}>
            <div className="text-2xl font-bold text-gray-900">{summaryStats.totalChildren}</div>
            <div className="text-xs text-gray-500 mt-1">{t('parentDashboard.totalChildren')}</div>
          </div>
          <div className="card-hover bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center opacity-0 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="text-2xl font-bold text-emerald-600">{summaryStats.totalQuizzes}</div>
            <div className="text-xs text-gray-500 mt-1">{t('parentDashboard.totalQuizzes')}</div>
          </div>
          <div className="card-hover bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="text-2xl font-bold text-blue-600">{summaryStats.totalExams}</div>
            <div className="text-xs text-gray-500 mt-1">{t('student.examResults')}</div>
          </div>
          <div className="card-hover bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center opacity-0 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="text-2xl font-bold text-purple-600">
              {summaryStats.overallAvg != null ? `${summaryStats.overallAvg.toFixed(1)}%` : '-'}
            </div>
            <div className="text-xs text-gray-500 mt-1">{t('parentDashboard.overallAverage')}</div>
          </div>
        </div>
      )}

      {/* Children */}
      {data.children.map((child, childIdx) => (
        <div key={child.id} className="card-hover rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5 opacity-0 animate-slide-up" style={{ animationDelay: `${200 + childIdx * 80}ms` }}>
          {/* Child header */}
          <div className="flex items-center gap-4">
            <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(child.name)}`}>
              {getInitials(child.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">{child.name}</h2>
              <p className="text-sm text-gray-500 truncate">{child.email}</p>
            </div>
            <div className="text-start shrink-0">
              <p className="text-xs text-gray-500">{t('parentDashboard.overallAverage')}</p>
              <p className="text-2xl font-bold text-emerald-600">
                {child.overall_average != null ? `${child.overall_average.toFixed(1)}%` : '-'}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="text-lg font-bold text-gray-900">{child.subjects.length}</div>
              <div className="text-xs text-gray-500">{t('parentDashboard.subjects')}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="text-lg font-bold text-gray-900">{child.recent_attempts.length}</div>
              <div className="text-xs text-gray-500">{t('parentDashboard.quizzesTaken')}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="text-lg font-bold text-gray-900">{child.exam_results.length}</div>
              <div className="text-xs text-gray-500">{t('parentDashboard.examsTaken')}</div>
            </div>
          </div>

          {/* Subjects */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('parentDashboard.subjects')}</h3>
            <div className="flex flex-wrap gap-2">
              {child.subjects.map((subject) => (
                <span key={subject} className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">
                  {subject}
                </span>
              ))}
            </div>
          </div>

          {/* Recent quiz attempts */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('parentDashboard.recentQuizAttempts')}</h3>
            {child.recent_attempts.length === 0 ? (
              <p className="text-sm text-gray-400 py-3">{t('parentDashboard.noRecentAttempts')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-end text-xs font-medium uppercase text-gray-500">
                      <th className="pb-2 ps-4">{t('fields.name')}</th>
                      <th className="pb-2 ps-4">{t('fields.score')}</th>
                      <th className="pb-2">{t('fields.date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {child.recent_attempts.map((attempt, i) => {
                      const pct = attempt.percentage ?? 0;
                      return (
                        <tr key={i} className="border-b border-gray-50 last:border-0">
                          <td className="py-2.5 ps-4 text-gray-900 font-medium">{attempt.quiz_title}</td>
                          <td className="py-2.5 ps-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className={`font-medium text-xs ${pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                {attempt.percentage != null ? `${pct.toFixed(0)}%` : t('enrollmentStatus.pending')}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 text-gray-500 text-xs">
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
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('student.examResults')}</h3>
            {child.exam_results.length === 0 ? (
              <p className="text-sm text-gray-400 py-3">{t('parentDashboard.noExamResults')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-end text-xs font-medium uppercase text-gray-500">
                      <th className="pb-2 ps-4">{t('teacher.exam')}</th>
                      <th className="pb-2 ps-4">{t('fields.score')}</th>
                      <th className="pb-2 ps-4">{t('fields.grade')}</th>
                      <th className="pb-2">{t('fields.date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {child.exam_results.map((result, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="py-2.5 ps-4 text-gray-900 font-medium">{result.exam_title}</td>
                        <td className="py-2.5 ps-4 font-medium text-gray-900">{result.score}</td>
                        <td className="py-2.5 ps-4">
                          <span className={`inline-block rounded-lg px-2.5 py-0.5 text-xs font-bold ${
                            result.grade === 'A' ? 'bg-green-100 text-green-700' :
                            result.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                            result.grade === 'C' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>{result.grade}</span>
                        </td>
                        <td className="py-2.5 text-gray-500 text-xs">{new Date(result.exam_date).toLocaleDateString()}</td>
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
              <h3 className="text-sm font-medium text-gray-500 mb-2">{t('parentDashboard.performanceTrend')}</h3>
              <div className="rounded-lg border border-gray-100 p-4">
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
    </div>
  );
}
