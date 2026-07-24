import { useParams } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { useQuizStats, useQuestionAnalysis } from '../../../hooks/useQuiz';
import { SkeletonCard } from '../../../components/Skeleton';

export default function QuizAnalyticsPage() {
  const { quizId } = useParams();
  const numId = quizId ? Number(quizId) : null;
  const { t } = useLanguage();
  const { data: stats, isLoading: statsLoading } = useQuizStats(numId);
  const { data: qAnalysis = [], isLoading: qLoading } = useQuestionAnalysis(numId);

  if (statsLoading || qLoading) return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('quiz.analytics') || 'Quiz Analytics'}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('quiz.totalAttempts') || 'Total Attempts', value: stats?.total_attempts ?? 0, color: 'text-blue-600' },
          { label: t('quiz.averageScore') || 'Avg Score', value: `${(stats?.average_score ?? 0).toFixed(1)}%`, color: 'text-green-600' },
          { label: t('quiz.passRate') || 'Pass Rate', value: `${(stats?.pass_rate ?? 0).toFixed(1)}%`, color: 'text-purple-600' },
          { label: t('quiz.avgTimeSpent') || 'Avg Time', value: `${Math.round((stats?.average_time_spent ?? 0) / 60)}m`, color: 'text-orange-600' },
        ].map(card => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-sm text-gray-900">{t('quiz.questionAnalysis') || 'Question Analysis'}</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {qAnalysis.map((q: any, i: number) => (
            <div key={q.id || i} className="px-6 py-4 flex items-center gap-4">
              <span className="text-xs font-mono shrink-0 text-gray-500">Q{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{q.question_text}</p>
                <p className="text-xs text-gray-500">Correct: {q.correct_answer}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-lg font-bold ${q.correct_rate >= 70 ? 'text-green-600' : q.correct_rate >= 40 ? 'text-orange-500' : 'text-red-500'}`}>
                  {(q.correct_rate ?? 0).toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500">{q.total_answers} answers</p>
              </div>
            </div>
          ))}
          {qAnalysis.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">{t('quiz.noDataYet') || 'No attempt data yet'}</p>
          )}
        </div>
      </div>
    </div>
  );
}
