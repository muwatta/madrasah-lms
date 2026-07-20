import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { attemptAPI } from '../../api';
import type { QuizAttempt } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function QuizResultsPage() {
  const { t } = useLanguage();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const res = await attemptAPI.myAttempts();
        setAttempts(res.data.results || res.data || []);
      } catch (err: any) {
        setError(err.response?.data?.detail || t('student.loadAttemptsFailed'));
      } finally {
        setLoading(false);
      }
    };
    fetchAttempts();
  }, []);

  const stats = useMemo(() => {
    const graded = attempts.filter((a) => a.score !== null);
    if (graded.length === 0) return null;
    const scores = graded.map((a) => a.percentage || 0);
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const best = Math.max(...scores);
    const passCount = graded.filter((a) => (a.percentage || 0) >= 50).length;
    return {
      total: attempts.length,
      passRate: Math.round((passCount / graded.length) * 100),
      average: Math.round(avg),
      best: Math.round(best),
    };
  }, [attempts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">{t('student.quizResults')}</h1>
      <p className="text-sm text-gray-500 mb-6">{t('guides.quizResults')}</p>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 mb-4">{error}</div>
      )}

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500 mt-1">{t('student.totalAttempts')}</div>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.average}%</div>
            <div className="text-xs text-gray-500 mt-1">{t('student.averageScore')}</div>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.best}%</div>
            <div className="text-xs text-gray-500 mt-1">{t('student.bestScore')}</div>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.passRate}%</div>
            <div className="text-xs text-gray-500 mt-1">{t('student.passRate')}</div>
          </div>
        </div>
      )}

      {attempts.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-3">{t('student.noAttemptsYet')}</p>
          <Link to="/student/quizzes" className="inline-block px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition">
            {t('student.takeAQuiz')}
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-end py-3 px-4 font-medium text-gray-600">{t('student.quiz')}</th>
                <th className="text-end py-3 px-4 font-medium text-gray-600">{t('fields.score')}</th>
                <th className="text-end py-3 px-4 font-medium text-gray-600">{t('fields.percentage')}</th>
                <th className="text-end py-3 px-4 font-medium text-gray-600">{t('fields.attempt')}</th>
                <th className="text-end py-3 px-4 font-medium text-gray-600">{t('fields.status')}</th>
                <th className="text-end py-3 px-4 font-medium text-gray-600">{t('fields.date')}</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => {
                const hasResult = attempt.score !== null;
                const pct = attempt.percentage || 0;
                return (
                  <tr key={attempt.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-800">{attempt.quiz_title}</td>
                    <td className="py-3 px-4">
                      {hasResult ? (
                        <span className="font-semibold text-gray-900">{attempt.score}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {hasResult ? (
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">{pct}%</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500">#{attempt.attempt_number}</td>
                    <td className="py-3 px-4">
                      {hasResult ? (
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          pct >= 70
                            ? 'bg-green-100 text-green-800'
                            : pct >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {pct >= 50 ? t('enrollmentStatus.passed') : t('enrollmentStatus.failed')}
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          {t('enrollmentStatus.inProgress')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
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
