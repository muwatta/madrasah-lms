import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { useQuizResults } from '../../../hooks/useQuiz';
import { SkeletonCard } from '../../../components/Skeleton';
import type { QuizAttempt } from '../../../types';

export default function QuizResultsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: results = [], isLoading } = useQuizResults();

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('quiz.myResults') || 'My Results'}</h1>

      {results.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">{t('quiz.noResults') || 'No quiz results yet'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((r: QuizAttempt) => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                r.is_pass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}>
                {r.percentage !== null ? `${r.percentage}%` : '—'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{r.quiz_title}</p>
                <p className="text-xs text-gray-500">
                  {r.score}/{r.total_marks} marks • Attempt #{r.attempt_number}
                  {r.submitted_at && ` • ${new Date(r.submitted_at).toLocaleDateString()}`}
                </p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                r.status === 'released' ? (r.is_pass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600') :
                r.status === 'graded' ? 'bg-yellow-100 text-yellow-700' :
                r.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
