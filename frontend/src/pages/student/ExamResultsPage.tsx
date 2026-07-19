import { useState, useEffect } from 'react';
import { examAPI } from '../../api';
import type { ExamResult } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-emerald-600 text-lg">{t('student.loadingResults')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('student.examResults')}</h1>

      {results.length === 0 ? (
        <div className="text-center py-12 text-gray-500">{t('student.noExamResults')}</div>
      ) : (
        <div className="grid gap-4">
          {results.map((result) => (
            <div key={result.id} className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{result.exam_title}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('student.recordedOn')} {new Date(result.recorded_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">{result.score}</div>
                    <div className="text-xs text-gray-500">{t('fields.score')}</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      result.grade === 'A' || result.grade === 'B' ? 'text-green-600' :
                      result.grade === 'C' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>{result.grade}</div>
                    <div className="text-xs text-gray-500">{t('fields.grade')}</div>
                  </div>
                </div>
              </div>
              {result.remarks && (
                <p className="mt-3 text-sm text-gray-600 italic">{result.remarks}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
