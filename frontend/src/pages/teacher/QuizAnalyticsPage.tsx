import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { quizAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { Skeleton, SkeletonCard, SkeletonTable } from '../../components/Skeleton';

interface QuestionAnalytic {
  question_id: number;
  question_text: string;
  question_type: string;
  difficulty: string;
  accuracy: number;
  correct_count: number;
  total_answered: number;
  top_wrong_answers: { answer: string; count: number }[];
}

interface QuizAnalyticsData {
  quiz: { id: number; title: string; passing_score: number };
  total_attempts: number;
  average_score: number;
  pass_rate: number;
  question_analytics: QuestionAnalytic[];
  score_distribution: { range: string; count: number }[];
  difficulty_breakdown: Record<string, { total: number; avg_accuracy: number }>;
}

function getAccuracyColor(pct: number) {
  if (pct >= 70) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
  if (pct >= 50) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
  return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
}

function getBarColor(pct: number) {
  if (pct >= 70) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-red-400';
}

function getDifficultyBadge(d: string) {
  if (d === 'easy') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
  if (d === 'hard') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
  return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
}

export default function QuizAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [data, setData] = useState<QuizAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    quizAPI.analytics(Number(id))
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || t('quizAnalytics.loadFailed')))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-8 w-64 mb-1" />
        <Skeleton className="h-4 w-48 mb-6" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
        <SkeletonTable rows={4} />
      </div>
    );
  }
  if (error) return <div className="max-w-5xl mx-auto px-4 py-8"><div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-400">{error}</div></div>;
  if (!data) return null;

  const maxDistCount = Math.max(...data.score_distribution.map(d => d.count), 1);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/teacher/quizzes" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 mb-1 inline-block">
            {t('quizAnalytics.backToQuizzes')}
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] dark:text-gray-100">{data.quiz.title}</h1>
          <p className="text-sm text-[var(--color-text-muted)] dark:text-gray-400">{t('quizAnalytics.title')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--color-border-light)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-4 shadow-sm">
          <p className="text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400">{t('quizAnalytics.totalAttempts')}</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)] dark:text-gray-100">{data.total_attempts}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border-light)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-4 shadow-sm">
          <p className="text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400">{t('quizAnalytics.averageScore')}</p>
          <p className={`mt-1 text-2xl font-bold ${getAccuracyColor(data.average_score).split(' ')[0]}`}>{data.average_score}%</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border-light)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-4 shadow-sm">
          <p className="text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400">{t('quizAnalytics.passRate')}</p>
          <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{data.pass_rate}%</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border-light)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-4 shadow-sm">
          <p className="text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400">{t('fields.passingScore')}</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)] dark:text-gray-100">{data.quiz.passing_score}%</p>
        </div>
      </div>

      {data.score_distribution.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border-light)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-secondary)] dark:text-gray-300">{t('quizAnalytics.scoreDistribution')}</h2>
          <div className="flex items-end gap-1.5" style={{ height: 120 }}>
            {data.score_distribution.map((d) => (
              <div key={d.range} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-[var(--color-text-muted)] dark:text-gray-400">{d.count}</span>
                <div
                  className={`w-full rounded-t-md transition-all ${d.count > 0 ? 'bg-primary-400' : 'bg-[var(--color-bg-secondary)] dark:bg-gray-700'}`}
                  style={{ height: `${d.count > 0 ? (d.count / maxDistCount) * 100 : 4}%` }}
                />
                <span className="text-[9px] text-[var(--color-text-muted)] dark:text-gray-400">{d.range}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(data.difficulty_breakdown).length > 0 && (
        <div className="rounded-xl border border-[var(--color-border-light)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-secondary)] dark:text-gray-300">{t('quizAnalytics.difficultyBreakdown')}</h2>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(data.difficulty_breakdown).map(([diff, info]) => (
              <div key={diff} className="text-center">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getDifficultyBadge(diff)}`}>
                  {t('difficulty.' + diff)}
                </span>
                <p className="mt-2 text-lg font-bold text-[var(--color-text-primary)] dark:text-gray-100">{info.total}</p>
                <p className="text-xs text-[var(--color-text-muted)] dark:text-gray-400">{t('student.questions')}</p>
                <div className="mt-2 h-2 w-full rounded-full bg-[var(--color-bg-secondary)] dark:bg-gray-700">
                  <div className={`h-2 rounded-full ${getBarColor(info.avg_accuracy)}`} style={{ width: `${info.avg_accuracy}%` }} />
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-muted)] dark:text-gray-400">{info.avg_accuracy}% {t('quizAnalytics.avgAccuracy')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.question_analytics.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border-light)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-secondary)] dark:text-gray-300">{t('quizAnalytics.questionPerformance')}</h2>
          <div className="space-y-3">
            {data.question_analytics.map((q, i) => (
              <div key={q.question_id} className="rounded-lg border border-[var(--color-border-light)] dark:border-gray-700/50 bg-[var(--color-bg-secondary)] dark:bg-gray-700/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[var(--color-text-muted)] dark:text-gray-400">Q{i + 1}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getDifficultyBadge(q.difficulty)}`}>{t('difficulty.' + q.difficulty)}</span>
                      <span className="rounded-full bg-[var(--color-bg-primary)] dark:bg-gray-700 px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-secondary)] dark:text-gray-300">{t('questionTypes.' + q.question_type)}</span>
                    </div>
                    <p className="text-sm text-[var(--color-text-primary)] dark:text-gray-100">{q.question_text}</p>
                  </div>
                  <div className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold ${getAccuracyColor(q.accuracy)}`}>
                    {q.accuracy}%
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 rounded-full bg-[var(--color-bg-primary)] dark:bg-gray-700">
                    <div className={`h-1.5 rounded-full ${getBarColor(q.accuracy)}`} style={{ width: `${q.accuracy}%` }} />
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)] dark:text-gray-400">{q.correct_count}/{q.total_answered} {t('quizTake.correct')}</span>
                </div>
                {q.top_wrong_answers.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] font-medium text-[var(--color-text-muted)] dark:text-gray-400 mb-1">{t('quizAnalytics.commonWrongAnswers')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {q.top_wrong_answers.map((wa, wi) => (
                        <span key={wi} className="rounded bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-[10px] text-red-600 dark:text-red-400">
                          "{wa.answer}" ({wa.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.total_attempts === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bg-secondary)] dark:bg-gray-700">
            <svg className="h-8 w-8 text-[var(--color-text-muted)] dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <p className="text-sm font-medium text-[var(--color-text-primary)] dark:text-gray-100">{t('quizAnalytics.noData')}</p>
        </div>
      )}
    </div>
  );
}
