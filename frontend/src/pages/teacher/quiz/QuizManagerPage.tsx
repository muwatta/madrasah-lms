import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { useQuizzes, usePublishQuiz, useArchiveQuiz } from '../../../hooks/useQuiz';
import { SkeletonCard } from '../../../components/Skeleton';
import type { Quiz } from '../../../types';

export default function QuizManagerPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: quizzes = [], isLoading } = useQuizzes();
  const publishQuiz = usePublishQuiz();
  const archiveQuiz = useArchiveQuiz();
  const [statusFilter, setStatusFilter] = useState<string>('');

  if (isLoading) return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  const filtered = statusFilter ? quizzes.filter((q: Quiz) => q.status === statusFilter) : quizzes;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('quiz.manageQuizzes') || 'Manage Quizzes'}</h1>
        <button onClick={() => navigate('/teacher/quiz/builder')}
          className="btn-press px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium">
          {t('quiz.createQuiz') || '+ Create Quiz'}
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'draft', 'published', 'archived'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            {s || t('quiz.all') || 'All'}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-start font-medium text-gray-700">{t('quiz.title') || 'Title'}</th>
            <th className="px-4 py-3 text-start font-medium text-gray-700">{t('quiz.subject') || 'Subject'}</th>
            <th className="px-4 py-3 text-start font-medium text-gray-700">{t('quiz.class') || 'Class'}</th>
            <th className="px-4 py-3 text-start font-medium text-gray-700">{t('quiz.questions') || 'Questions'}</th>
            <th className="px-4 py-3 text-start font-medium text-gray-700">{t('quiz.status') || 'Status'}</th>
            <th className="px-4 py-3 text-start font-medium text-gray-700">{t('quiz.actions') || 'Actions'}</th>
          </tr></thead>
          <tbody>
            {filtered.map((q: Quiz) => (
              <tr key={q.id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">{q.title}</td>
                <td className="px-4 py-3 text-gray-500">{q.subject_name}</td>
                <td className="px-4 py-3 text-gray-500">{q.school_class_name}</td>
                <td className="px-4 py-3 text-gray-700">{q.question_count}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    q.status === 'published' ? 'bg-green-100 text-green-700' :
                    q.status === 'archived' ? 'bg-gray-100 text-gray-500' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{q.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/teacher/quiz/builder/${q.id}`)} className="text-xs text-primary-600 hover:underline">Edit</button>
                    {q.status === 'draft' && (
                      <button onClick={() => publishQuiz.mutate(q.id)} className="text-xs text-green-600 hover:underline">Publish</button>
                    )}
                    {q.status === 'published' && (
                      <button onClick={() => archiveQuiz.mutate(q.id)} className="text-xs text-orange-500 hover:underline">Archive</button>
                    )}
                    <button onClick={() => navigate(`/teacher/quiz/analytics/${q.id}`)} className="text-xs text-purple-600 hover:underline">Stats</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
