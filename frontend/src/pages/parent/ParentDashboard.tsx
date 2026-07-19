import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardAPI } from '../../api';
import type { ParentDashboard as ParentDashboardType } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ParentDashboard() {
  const [data, setData] = useState<ParentDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardAPI.parent()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>;
  if (!data?.children?.length) return <div className="text-center text-gray-500 py-12">No children linked to your account.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Children</h1>
      {data.children.map((child) => (
        <div key={child.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{child.name}</h2>
              <p className="text-sm text-gray-500">{child.email}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Overall Average</p>
              <p className="text-2xl font-bold text-primary-600">
                {child.overall_average != null ? `${child.overall_average.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Subjects</h3>
            <div className="flex flex-wrap gap-2">
              {child.subjects.map((subject) => (
                <span key={subject} className="inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                  {subject}
                </span>
              ))}
            </div>
          </div>

          {child.recent_attempts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Quiz Attempts</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-500">
                      <th className="pb-2 pr-4">Quiz</th>
                      <th className="pb-2 pr-4">Score</th>
                      <th className="pb-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {child.recent_attempts.map((attempt, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 pr-4 text-gray-900">{attempt.quiz_title}</td>
                        <td className="py-2 pr-4">
                          <span className={`font-medium ${attempt.percentage != null && attempt.percentage >= 70 ? 'text-green-600' : attempt.percentage != null && attempt.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {attempt.percentage != null ? `${attempt.percentage.toFixed(1)}%` : 'Pending'}
                          </span>
                        </td>
                        <td className="py-2 text-gray-500">
                          {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : 'In progress'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {child.exam_results.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Exam Results</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-500">
                      <th className="pb-2 pr-4">Exam</th>
                      <th className="pb-2 pr-4">Score</th>
                      <th className="pb-2 pr-4">Grade</th>
                      <th className="pb-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {child.exam_results.map((result, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 pr-4 text-gray-900">{result.exam_title}</td>
                        <td className="py-2 pr-4 font-medium text-gray-900">{result.score}</td>
                        <td className="py-2 pr-4">
                          <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${
                            result.grade === 'A' ? 'bg-green-100 text-green-700' :
                            result.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                            result.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>{result.grade}</span>
                        </td>
                        <td className="py-2 text-gray-500">{new Date(result.exam_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {child.recent_attempts.length > 1 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Performance Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={child.recent_attempts
                  .filter((a) => a.percentage != null)
                  .map((a) => ({ name: a.quiz_title.length > 15 ? a.quiz_title.slice(0, 15) + '…' : a.quiz_title, score: a.percentage }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
