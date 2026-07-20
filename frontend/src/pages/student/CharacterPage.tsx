import { useState, useEffect } from 'react';
import { characterAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function StudentCharacterPage() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    characterAPI.evaluations.summary({}).then(r => setSummary(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Character Evaluation</h1>

      {summary ? (
        <div className="space-y-6">
          <div className="rounded-lg border p-4">
            <h2 className="mb-2 text-lg font-semibold">{summary.student_name}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Overall Average:</span>
                <span className="ml-2 font-semibold">{summary.overall_average ?? 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Evaluations:</span>
                <span className="ml-2 font-semibold">{summary.total_evaluations}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border">
            <div className="border-b bg-gray-50 px-4 py-3">
              <h3 className="font-medium">Traits Breakdown</h3>
            </div>
            <div className="divide-y">
              {summary.traits?.map((t: any) => (
                <div key={t.trait_id} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-36">
                    <p className="text-sm font-medium">{t.trait_name}</p>
                    <p className="text-xs text-gray-400">{t.category}</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-2.5 rounded-full bg-gray-200">
                      <div className="h-2.5 rounded-full bg-primary-500"
                        style={{ width: `${(t.average_score / 5) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{t.average_score}/5</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border p-8 text-center text-gray-500">
          No evaluations yet.
        </div>
      )}
    </div>
  );
}
