import { useLanguage } from '../../context/LanguageContext';

interface WordScore {
  word: string;
  score: number;
  phonemes?: Array<{ phoneme: string; score: number }>;
  issues?: Array<{ type: string; severity: string; suggestion: string }>;
}

interface ScoreDisplayProps {
  aiScore: number | null;
  pronunciationScore: number | null;
  grammarScore: number | null;
  fluencyScore: number | null;
  teacherScore: number | null;
  teacherFeedback?: string | null;
  aiFeedback?: string | null;
  wordScores?: WordScore[];
  transcribedText?: string | null;
  confidenceScore?: number | null;
  fluencyWPM?: number | null;
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

function getWordBgColor(score: number) {
  if (score >= 90) return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300';
  if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300';
  if (score >= 50) return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300';
  return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300';
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

function PronunciationHeatmap({ wordScores }: { wordScores: WordScore[] }) {
  if (!wordScores || wordScores.length === 0) return null;

  return (
    <div className="border-t pt-4 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        Word-Level Pronunciation
      </p>
      <div className="flex flex-wrap gap-1.5 leading-relaxed" dir="rtl">
        {wordScores.map((ws, i) => (
          <span
            key={i}
            className={`inline-block px-2 py-0.5 rounded text-sm font-medium cursor-default transition-transform hover:scale-105 ${getWordBgColor(ws.score)}`}
            title={`${ws.word}: ${ws.score}%${ws.issues?.length ? ` (${ws.issues[0].suggestion})` : ''}`}
            style={{ fontFamily: 'var(--font-arabic, serif)' }}
          >
            {ws.word}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-200" /> 90+</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-200" /> 70-89</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-orange-200" /> 50-69</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-200" /> &lt;50</span>
      </div>
    </div>
  );
}

export default function ScoreDisplay({
  aiScore, pronunciationScore, grammarScore, fluencyScore,
  teacherScore, teacherFeedback, aiFeedback,
  wordScores, transcribedText, confidenceScore, fluencyWPM,
}: ScoreDisplayProps) {
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

      {transcribedText && (
        <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>Transcription: </span>
          <span style={{ fontFamily: 'var(--font-arabic, serif)' }}>{transcribedText}</span>
        </div>
      )}

      <div className="space-y-3">
        {pronunciationScore !== null && pronunciationScore !== undefined && <ScoreBar label={t('fasaaha.pronunciation')} score={Math.round(pronunciationScore)} />}
        {grammarScore !== null && grammarScore !== undefined && <ScoreBar label={t('fasaaha.grammar')} score={Math.round(grammarScore)} />}
        {fluencyScore !== null && fluencyScore !== undefined && <ScoreBar label={t('fasaaha.fluency')} score={Math.round(fluencyScore)} />}
      </div>

      {(confidenceScore !== null && confidenceScore !== undefined) && (fluencyWPM !== null && fluencyWPM !== undefined) && (
        <div className="grid grid-cols-2 gap-3">
          {confidenceScore !== null && confidenceScore !== undefined && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Confidence</p>
              <p className={`text-lg font-bold ${getScoreTextColor(confidenceScore)}`}>{Math.round(confidenceScore)}%</p>
            </div>
          )}
          {fluencyWPM !== null && fluencyWPM !== undefined && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Speech Rate</p>
              <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{fluencyWPM} <span className="text-xs font-normal">wpm</span></p>
            </div>
          )}
        </div>
      )}

      {wordScores && wordScores.length > 0 && <PronunciationHeatmap wordScores={wordScores} />}

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
