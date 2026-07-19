import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { attemptAPI } from '../../api';
import type { QuizAttempt } from '../../types';

export default function QuizResultsPage() {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const res = await attemptAPI.myAttempts();
        setAttempts(res.data.results || res.data || []);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load attempts');
      } finally {
        setLoading(false);
      }
    };
    fetchAttempts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-emerald-600 text-lg">Loading results...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quiz Results</h1>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 mb-4">{error}</div>
      )}

      {attempts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No quiz attempts yet.</p>
          <Link to="/student/quizzes" className="mt-2 inline-block text-emerald-600 hover:text-emerald-700 font-medium">
            Take a quiz
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Quiz</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Score</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Percentage</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Attempt</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => {
                const hasResult = attempt.score !== null;
                return (
                  <tr key={attempt.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{attempt.quiz_title}</td>
                    <td className="py-3 px-4">{hasResult ? attempt.score : '-'}</td>
                    <td className="py-3 px-4">
                      {hasResult ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${(attempt.percentage || 0) >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(attempt.percentage || 0, 100)}%` }}
                            />
                          </div>
                          <span>{attempt.percentage}%</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-500">#{attempt.attempt_number}</td>
                    <td className="py-3 px-4">
                      {hasResult ? (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          (attempt.percentage || 0) >= 50
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {(attempt.percentage || 0) >= 50 ? 'Pass' : 'Fail'}
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          In Progress
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {attempt.submitted_at
                        ? new Date(attempt.submitted_at).toLocaleDateString()
                        : new Date(attempt.started_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
