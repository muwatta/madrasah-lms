import { useState, useEffect } from 'react';
import { characterAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { SkeletonCard } from '../../components/Skeleton';

export default function StudentCharacterPage() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    characterAPI.evaluations.summary({}).then(r => setSummary(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-[var(--color-text-primary)] dark:text-gray-100">Character Evaluation</h1>

      {summary ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-4">
            <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)] dark:text-gray-100">{summary.student_name}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--color-text-muted)] dark:text-gray-400">Overall Average:</span>
                <span className="ml-2 font-semibold text-[var(--color-text-primary)] dark:text-gray-100">{summary.overall_average ?? 'N/A'}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)] dark:text-gray-400">Total Evaluations:</span>
                <span className="ml-2 font-semibold text-[var(--color-text-primary)] dark:text-gray-100">{summary.total_evaluations}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] dark:border-gray-700">
            <div className="border-b border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-secondary)] dark:bg-gray-700/50 px-4 py-3">
              <h3 className="font-medium text-[var(--color-text-primary)] dark:text-gray-100">Traits Breakdown</h3>
            </div>
            <div className="divide-y divide-[var(--color-border-light)] dark:divide-gray-700/50">
              {summary.traits?.map((t: any) => (
                <div key={t.trait_id} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-36">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] dark:text-gray-100">{t.trait_name}</p>
                    <p className="text-xs text-[var(--color-text-muted)] dark:text-gray-400">{t.category}</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-2.5 rounded-full bg-[var(--color-bg-secondary)] dark:bg-gray-700">
                      <div className="h-2.5 rounded-full bg-primary-500"
                        style={{ width: `${(t.average_score / 5) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)] dark:text-gray-100">{t.average_score}/5</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--color-border)] dark:border-gray-700 p-8 text-center text-[var(--color-text-muted)] dark:text-gray-400">
          No evaluations yet.
        </div>
      )}
    </div>
  );
}
