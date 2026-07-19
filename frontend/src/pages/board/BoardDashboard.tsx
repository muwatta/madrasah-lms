import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardAPI } from '../../api';
import type { BoardDashboard as BoardDashboardType } from '../../types';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function BoardDashboard() {
  const [data, setData] = useState<BoardDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardAPI.board()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>;
  if (!data) return null;

  const perfColor = data.average_performance >= 70 ? 'text-green-600' : data.average_performance >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Board Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" value={data.total_students} icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>} />
        <StatCard title="Total Teachers" value={data.total_teachers} color="bg-purple-600" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>} />
        <StatCard title="Total Subjects" value={data.total_subjects} color="bg-teal-600" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>} />
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Avg Performance</p>
          <p className={`mt-1 text-2xl font-bold ${perfColor}`}>{data.average_performance.toFixed(1)}%</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${Math.min(data.average_performance, 100)}%` }} />
          </div>
        </div>
      </div>

      {data.teacher_effectiveness.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Teacher Effectiveness Ranking</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">Teacher</th>
                  <th className="pb-3 pr-4">Quizzes Created</th>
                  <th className="pb-3 pr-4">Avg Student Score</th>
                  <th className="pb-3">Total Attempts</th>
                </tr>
              </thead>
              <tbody>
                {[...data.teacher_effectiveness]
                  .sort((a, b) => b.average_student_score - a.average_student_score)
                  .map((t, i) => {
                    const rankColor = i === 0 ? 'bg-green-100 text-green-700' : i === 1 ? 'bg-blue-100 text-blue-700' : i === 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600';
                    const scoreColor = t.average_student_score >= 70 ? 'text-green-600' : t.average_student_score >= 50 ? 'text-yellow-600' : 'text-red-600';
                    return (
                      <tr key={t.teacher_id} className="border-b border-gray-50">
                        <td className="py-3 pr-4">
                          <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${rankColor}`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-medium text-gray-900">{t.name}</td>
                        <td className="py-3 pr-4 text-gray-600">{t.quiz_count}</td>
                        <td className={`py-3 pr-4 font-semibold ${scoreColor}`}>{t.average_student_score.toFixed(1)}%</td>
                        <td className="py-3 text-gray-600">{t.total_attempts}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.top_subjects.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Top Subjects</h2>
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
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Performance by Teacher</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.teacher_effectiveness.map((t) => ({ name: t.name.length > 12 ? t.name.slice(0, 12) + '…' : t.name, score: t.average_student_score }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
              <Bar dataKey="score" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
