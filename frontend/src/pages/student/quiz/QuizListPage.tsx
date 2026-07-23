import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { useQuizzes } from '../../../hooks/useQuiz';
import { SkeletonCard } from '../../../components/Skeleton';
import type { Quiz } from '../../../types';

const diffLabels: Record<number, string> = { 1: 'Easy', 2: 'Medium', 3: 'Hard', 4: 'Expert', 5: 'Master' };
const diffColors: Record<number, string> = {
  1: 'bg-green-100 text-green-700', 2: 'bg-blue-100 text-blue-700',
  3: 'bg-orange-100 text-orange-700', 4: 'bg-red-100 text-red-700', 5: 'bg-purple-100 text-purple-700',
};

function QuizCard({ quiz }: { quiz: Quiz }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const now = new Date();
  const isOpen = quiz.is_available_now;
  const availFrom = quiz.available_from ? new Date(quiz.available_from) : null;
  const availUntil = quiz.available_until ? new Date(quiz.available_until) : null;
  const startsSoon = availFrom && availFrom > now;
  const ended = availUntil && availUntil < now;

  return (
    <div className="rounded-xl border p-5 flex flex-col gap-3 card-hover" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{quiz.title}</h3>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${diffColors[quiz.difficulty] ?? diffColors[2]}`}>
          {(t(`quiz.${diffLabels[quiz.difficulty] ?? 'Medium'}`) || (diffLabels[quiz.difficulty] ?? 'Medium'))}
        </span>
      </div>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{quiz.subject_name} - {quiz.school_class_name}</p>
      {quiz.description && <p className="text-xs line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{quiz.description}</p>}
      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span>{quiz.question_count} {t('quiz.questions') || 'Q'}</span>
        <span>{quiz.time_limit_minutes}min</span>
        <span>{quiz.total_marks} marks</span>
        <span>{quiz.passing_score}% pass</span>
      </div>
      <div className="flex items-center justify-between mt-auto pt-2 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {quiz.max_attempts} {t('quiz.attempts') || 'attempts'}
        </span>
        {isOpen ? (
          <button onClick={() => navigate(`/student/quiz/take/${quiz.id}`)}
            className="btn-press text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">
            {t('quiz.start') || 'Start'}
          </button>
        ) : startsSoon ? (
          <span className="text-xs text-orange-500 font-medium">{t('quiz.startsSoon') || 'Starts soon'}</span>
        ) : ended ? (
          <span className="text-xs text-gray-400 font-medium">{t('quiz.ended') || 'Ended'}</span>
        ) : (
          <span className="text-xs text-gray-400 font-medium">{t('quiz.unavailable') || 'Unavailable'}</span>
        )}
      </div>
    </div>
  );
}

export default function QuizListPage() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'available' | 'completed'>('all');
  const { data: quizzes = [], isLoading } = useQuizzes();

  if (isLoading) return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  const filtered = quizzes.filter((q: Quiz) => {
    if (filter === 'available') return q.is_available_now;
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('quiz.title') || 'Quizzes'}</h1>
      <div className="flex gap-2">
        {(['all', 'available'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'border'}`}
            style={filter === f ? undefined : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
            {t(`quiz.${f}`) || f}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>{t('quiz.noQuizzes') || 'No quizzes available'}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((q: Quiz) => <QuizCard key={q.id} quiz={q} />)}
        </div>
      )}
    </div>
  );
}
