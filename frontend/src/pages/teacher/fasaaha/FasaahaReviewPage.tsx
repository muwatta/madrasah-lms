import { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useFasaahaPendingReviews, useFasaahaSubmitReview } from '../../../hooks/useFasaaha';
import ScoreDisplay from '../../../components/fasaaha/ScoreDisplay';

export default function FasaahaReviewPage() {
  const { t } = useLanguage();
  const { data: pending = [], isLoading: loading } = useFasaahaPendingReviews();
  const submitReview = useFasaahaSubmitReview();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [score, setScore] = useState(75);
  const [feedback, setFeedback] = useState('');
  const [reviewed, setReviewed] = useState(0);

  const selected = pending.find(a => a.id === selectedId) ?? pending[0] ?? null;

  useEffect(() => {
    if (pending.length > 0 && !selectedId) setSelectedId(pending[0].id);
  }, [pending, selectedId]);

  const handleSubmit = async () => {
    if (!selected) return;
    submitReview.mutate({ attempt: selected.id, overall_score: score, feedback }, {
      onSuccess: () => {
        setReviewed(prev => prev + 1);
        setScore(75);
        setFeedback('');
        const remaining = pending.filter(p => p.id !== selected.id);
        setSelectedId(remaining[0]?.id ?? null);
      },
    });
  };

  if (loading) return <div className="py-12 text-center" style={{ color: 'var(--color-text-muted)' }}>{t('common.loading')}</div>;

  if (pending.length === 0 && !selected) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl block mb-3">✅</span>
        <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.noPendingReviews')}</p>
        {reviewed > 0 && <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{reviewed} {t('fasaaha.reviews')}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.reviews')}</h1>
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{pending.length} {t('fasaaha.pendingReviews')}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {pending.map(a => (
            <button key={a.id} onClick={() => { setSelectedId(a.id); setScore(75); setFeedback(''); }} className={`w-full text-start rounded-xl border p-3 transition-all ${selected?.id === a.id ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800' : ''}`}
              style={{ borderColor: selected?.id === a.id ? undefined : 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{a.student_name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{a.mission_title}</p>
            </button>
          ))}
        </div>

        {selected && (
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{selected.student_name} — {selected.mission_title}</p>
              {selected.audio_url && <audio src={selected.audio_url} controls className="w-full mt-3" />}
            </div>

            <ScoreDisplay
              aiScore={selected.ai_analysis?.overall_score ?? null}
              pronunciationScore={selected.ai_analysis?.pronunciation_score ?? null}
              grammarScore={selected.ai_analysis?.grammar_score ?? null}
              fluencyScore={selected.ai_analysis?.fluency_score ?? null}
              teacherScore={selected.teacher_review?.overall_score ?? null}
              aiFeedback={selected.ai_analysis?.pronunciation_feedback ? `${selected.ai_analysis.pronunciation_feedback} ${selected.ai_analysis.grammar_feedback} ${selected.ai_analysis.fluency_feedback}` : null}
              teacherFeedback={selected.teacher_review?.feedback ?? null}
              wordScores={selected.ai_analysis?.word_scores as any}
              transcribedText={selected.ai_analysis?.transcribed_text}
              confidenceScore={selected.ai_analysis?.confidence_score}
              fluencyWPM={selected.ai_analysis?.fluency_words_per_minute}
            />

            <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.teacherFeedback')}</h3>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.score')}</label>
                <input type="number" min={0} max={100} value={score} onChange={e => setScore(Number(e.target.value))} className="w-24 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: '#ffffff' }} />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.feedback')}</label>
                <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: '#ffffff' }} />
              </div>
              <button onClick={handleSubmit} disabled={submitReview.isPending} className="btn-press px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-50">
                {submitReview.isPending ? '...' : t('fasaaha.submitReview')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}