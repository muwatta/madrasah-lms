import { useLanguage } from '../../context/LanguageContext';

interface ScoreDisplayProps {
  aiScore: number | null;
  pronunciationScore: number | null;
  grammarScore: number | null;
  fluencyScore: number | null;
  teacherScore: number | null;
  teacherFeedback?: string | null;
  aiFeedback?: string | null;
}

function getScoreColor(score: number) {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

function getScoreTextColor(score: number) {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 40) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        <span className={`font-semibold ${getScoreTextColor(score)}`}>{score}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border-light)' }}>
        <div className={`h-full rounded-full transition-all duration-700 ${getScoreColor(score)}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
    </div>
  );
}

export default function ScoreDisplay({ aiScore, pronunciationScore, grammarScore, fluencyScore, teacherScore, teacherFeedback, aiFeedback }: ScoreDisplayProps) {
  const { t } = useLanguage();
  const overall = aiScore ?? teacherScore ?? 0;

  return (
    <div className="rounded-xl border p-6 space-y-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-16 h-16 rounded-full" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          <span className={`text-2xl font-bold ${getScoreTextColor(overall)}`}>{overall > 0 ? Math.round(overall) : '-'}</span>
        </div>
        <div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.overall')}</p>
          <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.score')}</p>
        </div>
      </div>

      <div className="space-y-3">
        {pronunciationScore !== null && pronunciationScore !== undefined && <ScoreBar label={t('fasaaha.pronunciation')} score={Math.round(pronunciationScore)} />}
        {grammarScore !== null && grammarScore !== undefined && <ScoreBar label={t('fasaaha.grammar')} score={Math.round(grammarScore)} />}
        {fluencyScore !== null && fluencyScore !== undefined && <ScoreBar label={t('fasaaha.fluency')} score={Math.round(fluencyScore)} />}
      </div>

      {teacherScore !== null && teacherScore !== undefined && (
        <div className="border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.teacherFeedback')} — {Math.round(teacherScore)}%</p>
          </div>
          {teacherFeedback && (
            <p className="text-sm p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>{teacherFeedback}</p>
          )}
        </div>
      )}

      {aiFeedback && (
        <div className="border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.aiFeedback')}</p>
          <p className="text-sm p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>{aiFeedback}</p>
        </div>
      )}
    </div>
  );
}
