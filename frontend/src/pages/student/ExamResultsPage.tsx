import { useState, useEffect, useMemo } from 'react';
import { examAPI } from '../../api';
import type { ExamResult } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ExamResultsPage() {
  const { t } = useLanguage();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await examAPI.myResults();
        setResults(res.data.results || res.data || []);
      } catch (err: any) {
        setError(err.response?.data?.detail || t('student.loadExamResultsFailed'));
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const stats = useMemo(() => {
    if (results.length === 0) return null;
    const scores = results.map((r) => r.score);
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const grades = results.map((r) => r.grade);
    const gradeCounts: Record<string, number> = {};
    grades.forEach((g) => { gradeCounts[g] = (gradeCounts[g] || 0) + 1; });
    const gradeA = gradeCounts['A'] || 0;
    const gradeB = gradeCounts['B'] || 0;
    const passCount = gradeA + gradeB + (gradeCounts['C'] || 0);
    return {
      total: results.length,
      average: Math.round(avg * 10) / 10,
      passRate: Math.round((passCount / results.length) * 100),
      gradeCounts,
    };
  }, [results]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('student.examResults')}</h1>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 mb-4">{error}</div>
      )}

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500 mt-1">{t('student.totalExams')}</div>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.average}</div>
            <div className="text-xs text-gray-500 mt-1">{t('student.averageGrade')}</div>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.passRate}%</div>
            <div className="text-xs text-gray-500 mt-1">{t('student.passRate')}</div>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-2 text-center">{t('student.gradeDistribution')}</div>
            <div className="flex items-center justify-center gap-1.5">
              {['A', 'B', 'C', 'D', 'F'].map((g) => {
                const count = stats.gradeCounts[g] || 0;
                if (count === 0) return null;
                return (
                  <div key={g} className="text-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      g === 'A' ? 'bg-green-100 text-green-700' :
                      g === 'B' ? 'bg-blue-100 text-blue-700' :
                      g === 'C' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {g}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {results.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500">{t('student.noExamResults')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {results.map((result) => {
            const gradeColor =
              result.grade === 'A' ? 'border-green-300 bg-green-50/50' :
              result.grade === 'B' ? 'border-blue-300 bg-blue-50/50' :
              result.grade === 'C' ? 'border-amber-300 bg-amber-50/50' :
              'border-red-300 bg-red-50/50';
            const gradeTextColor =
              result.grade === 'A' ? 'text-green-600' :
              result.grade === 'B' ? 'text-blue-600' :
              result.grade === 'C' ? 'text-amber-600' :
              'text-red-600';
            const passed = result.grade !== 'D' && result.grade !== 'F';

            return (
              <div key={result.id} className={`bg-white rounded-xl shadow border ${gradeColor} p-6`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-800">{result.exam_title}</h2>
                      {passed && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          {t('enrollmentStatus.passed')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('student.recordedOn')} {new Date(result.recorded_at).toLocaleDateString()}
                    </p>
                    {result.remarks && (
                      <p className="mt-2 text-sm text-gray-600 italic">{result.remarks}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">{result.score}</div>
                      <div className="text-xs text-gray-500">{t('fields.score')}</div>
                    </div>
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold ${gradeTextColor} bg-gray-50`}>
                      {result.grade}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
