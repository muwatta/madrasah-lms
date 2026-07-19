import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { quizAPI, attemptAPI } from '../../api';
import type { Quiz, QuizAttempt } from '../../types';

export default function StudentDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizzesRes, attemptsRes] = await Promise.all([
          quizAPI.list(),
          attemptAPI.myAttempts(),
        ]);
        setQuizzes(quizzesRes.data.results || quizzesRes.data || []);
        setAttempts(attemptsRes.data.results || attemptsRes.data || []);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-emerald-600 text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>
      </div>
    );
  }

  const totalQuizzes = quizzes.length;
  const completedAttempts = attempts.filter((a) => a.score !== null);
  const averageScore =
    completedAttempts.length > 0
      ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length)
      : 0;

  const chartData = completedAttempts.length > 0
    ? completedAttempts.slice(0, 8).map((a) => ({
        name: a.quiz_title.length > 15 ? a.quiz_title.slice(0, 15) + '...' : a.quiz_title,
        score: a.percentage || 0,
      }))
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6 border border-emerald-100">
          <div className="text-sm text-gray-500">Available Quizzes</div>
          <div className="text-3xl font-bold text-emerald-600 mt-1">{totalQuizzes}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-emerald-100">
          <div className="text-sm text-gray-500">Quizzes Completed</div>
          <div className="text-3xl font-bold text-emerald-600 mt-1">{completedAttempts.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-emerald-100">
          <div className="text-sm text-gray-500">Average Score</div>
          <div className="text-3xl font-bold text-emerald-600 mt-1">{averageScore}%</div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 border border-emerald-100 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6 border border-emerald-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Attempts</h2>
          <Link to="/student/quizzes" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            Browse Quizzes
          </Link>
        </div>
        {completedAttempts.length === 0 ? (
          <p className="text-gray-500">No attempts yet. Start a quiz to see your results here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Quiz</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Score</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {completedAttempts.slice(0, 5).map((attempt) => (
                  <tr key={attempt.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-2">{attempt.quiz_title}</td>
                    <td className="py-3 px-2 font-medium">{attempt.percentage !== null ? `${attempt.percentage}%` : '-'}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        (attempt.percentage || 0) >= 50
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {(attempt.percentage || 0) >= 50 ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-500">
                      {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
