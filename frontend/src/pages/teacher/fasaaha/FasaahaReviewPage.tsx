import { useEffect, useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { fasaahaAPI } from '../../../api';
import type { SpeakingAttempt } from '../../../types';
import ScoreDisplay from '../../../components/fasaaha/ScoreDisplay';
import { unwrapPaginated } from '../../../api/client';

export default function FasaahaReviewPage() {
  const { t } = useLanguage();
  const [pending, setPending] = useState<SpeakingAttempt[]>([]);
  const [selected, setSelected] = useState<SpeakingAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(75);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    fasaahaAPI.reviews.pending().then(res => {
      const items = unwrapPaginated(res.data);
      setPending(items);
      if (items.length > 0) setSelected(items[0]);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await fasaahaAPI.reviews.create({ attempt: selected.id, score, feedback });
      const remaining = pending.filter(p => p.id !== selected.id);
      setPending(remaining);
      setReviewed(prev => prev + 1);
      setSelected(remaining[0] ?? null);
      setScore(75);
      setFeedback('');
    } finally { setSubmitting(false); }
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
            <button key={a.id} onClick={() => setSelected(a)} className={`w-full text-start rounded-xl border p-3 transition-all ${selected?.id === a.id ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800' : ''}`}
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

            <ScoreDisplay aiScore={selected.ai_score} pronunciationScore={selected.ai_pronunciation_score} grammarScore={selected.ai_grammar_score} fluencyScore={selected.ai_fluency_score} teacherScore={selected.teacher_score} aiFeedback={selected.ai_feedback} />

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
              <button onClick={handleSubmit} disabled={submitting} className="btn-press px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-50">
                {submitting ? '...' : t('fasaaha.submitReview')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
