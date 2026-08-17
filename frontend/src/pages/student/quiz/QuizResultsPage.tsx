import { useState } from 'react';
import { PartyPopper } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useQuizResults } from '../../../hooks/useQuiz';
import { useGapAnalysis } from '../../../hooks/useQuestionBanks';
import { SkeletonCard } from '../../../components/Skeleton';
import type { QuizAttempt } from '../../../types';

function GapAnalysisCard({ bankId, attemptUuid }: { bankId: number; attemptUuid: string }) {
  const { t } = useLanguage();
  const { data, isLoading, error } = useGapAnalysis(bankId, attemptUuid);

  if (isLoading) {
    return (
      <div className="mt-3 rounded-xl border border-primary-200 bg-primary-50 dark:bg-primary-900/10 p-4">
        <p className="text-sm font-medium text-primary-700 dark:text-primary-400">{t('questionBanks.gapLoading')}</p>
        <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-primary-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        {t('questionBanks.gapLoading')}…
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/10 p-4">
      <p className="text-sm font-semibold text-primary-700 dark:text-primary-400">
        {t('questionBanks.gapAnalysisTitle')}
      </p>
      {data && data.wrong_count > 0 && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('questionBanks.gapIntro')}</p>
      )}
      <div className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-800 dark:text-gray-200">
        {data?.analysis}
      </div>
      {data?.wrong_count === 0 && (
        <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><PartyPopper className="w-6 h-6 text-yellow-500" /></p>
      )}
    </div>
  );
}

export default function QuizResultsPage() {
  const { t } = useLanguage();
  const { data: results = [], isLoading } = useQuizResults();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (uuid: string) => setExpanded((prev) => ({ ...prev, [uuid]: !prev[uuid] }));

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
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-4">
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
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    r.status === 'released' ? (r.is_pass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600') :
                    r.status === 'graded' ? 'bg-yellow-100 text-yellow-700' :
                    r.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {r.status}
                  </span>
                  {r.source_bank && r.status === 'released' && (
                    <button
                      onClick={() => toggle(r.uuid)}
                      className="text-xs font-medium text-primary-600 hover:underline"
                    >
                      {expanded[r.uuid] ? t('common.collapse') : t('questionBanks.gapAnalysisTitle')}
                    </button>
                  )}
                </div>
              </div>
              {r.source_bank && expanded[r.uuid] && (
                <GapAnalysisCard bankId={r.source_bank} attemptUuid={r.uuid} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
