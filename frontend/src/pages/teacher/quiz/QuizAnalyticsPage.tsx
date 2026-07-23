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
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('quiz.analytics') || 'Quiz Analytics'}</h1>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('quiz.totalAttempts') || 'Total Attempts', value: stats?.total_attempts ?? 0, color: 'text-blue-600' },
          { label: t('quiz.averageScore') || 'Avg Score', value: `${(stats?.average_score ?? 0).toFixed(1)}%`, color: 'text-green-600' },
          { label: t('quiz.passRate') || 'Pass Rate', value: `${(stats?.pass_rate ?? 0).toFixed(1)}%`, color: 'text-purple-600' },
          { label: t('quiz.avgTimeSpent') || 'Avg Time', value: `${Math.round((stats?.average_time_spent ?? 0) / 60)}m`, color: 'text-orange-600' },
        ].map(card => (
          <div key={card.label} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Question analysis */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{t('quiz.questionAnalysis') || 'Question Analysis'}</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
          {qAnalysis.map((q: any, i: number) => (
            <div key={q.id || i} className="px-6 py-4 flex items-center gap-4">
              <span className="text-xs font-mono shrink-0" style={{ color: 'var(--color-text-muted)' }}>Q{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{q.question_text}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Correct: {q.correct_answer}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-lg font-bold ${q.correct_rate >= 70 ? 'text-green-600' : q.correct_rate >= 40 ? 'text-orange-500' : 'text-red-500'}`}>
                  {(q.correct_rate ?? 0).toFixed(0)}%
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{q.total_answers} answers</p>
              </div>
            </div>
          ))}
          {qAnalysis.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>{t('quiz.noDataYet') || 'No attempt data yet'}</p>
          )}
        </div>
      </div>
    </div>
  );
}
