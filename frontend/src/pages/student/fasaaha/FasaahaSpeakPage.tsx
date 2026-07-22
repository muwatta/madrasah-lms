import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { useFasaahaMission, useFasaahaSubmitAttempt } from '../../../hooks/useFasaaha';
import AudioRecorder from '../../../components/fasaaha/AudioRecorder';
import ScoreDisplay from '../../../components/fasaaha/ScoreDisplay';

export default function FasaahaSpeakPage() {
  const { missionId } = useParams();
  const { t } = useLanguage();
  const numericId = missionId && missionId !== '0' ? Number(missionId) : null;
  const { data: mission, isLoading: loadingMission } = useFasaahaMission(numericId);
  const submitAttempt = useFasaahaSubmitAttempt();

  const [showTranslation, setShowTranslation] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = () => {
    if (!recordingBlob || !mission) return;
    const fd = new FormData();
    fd.append('mission', String(mission.id));
    fd.append('audio', recordingBlob, 'recording.webm');
    submitAttempt.mutate(fd, {
      onSuccess: (res) => setResult(res.data),
    });
  };

  if (loadingMission) return <div className="py-12 text-center" style={{ color: 'var(--color-text-muted)' }}>{t('common.loading')}</div>;

  if (!mission) {
    return (
      <div className="space-y-6">
        <Link to="/student/fasaaha/missions" className="text-sm text-primary-600 hover:underline">{t('fasaaha.backToMissions')}</Link>
        <div className="text-center py-12">
          <p style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.selectLevelTab')}</p>
          <Link to="/student/fasaaha/missions" className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">{t('fasaaha.viewMissions')}</Link>
        </div>
      </div>
    );
  }

  if (result) {
    const analysis = result.ai_analysis;
    const review = result.teacher_review;
    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <div className="text-center py-4">
          <span className="text-3xl">🎉</span>
          <h2 className="text-xl font-bold mt-2" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.missionComplete')}</h2>
        </div>
        <ScoreDisplay
          aiScore={analysis?.overall_score ?? null}
          pronunciationScore={analysis?.pronunciation_score ?? null}
          grammarScore={analysis?.grammar_score ?? null}
          fluencyScore={analysis?.fluency_score ?? null}
          teacherScore={review?.overall_score ?? null}
          aiFeedback={analysis?.pronunciation_feedback ? `${analysis.pronunciation_feedback} ${analysis.grammar_feedback} ${analysis.fluency_feedback}` : null}
          teacherFeedback={review?.feedback ?? null}
          wordScores={analysis?.word_scores}
          transcribedText={analysis?.transcribed_text}
          confidenceScore={analysis?.confidence_score}
          fluencyWPM={analysis?.fluency_words_per_minute}
        />
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setResult(null); setRecordingBlob(null); }} className="btn-press px-4 py-2 rounded-lg border text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>{t('fasaaha.tryAgain')}</button>
          <Link to="/student/fasaaha/missions" className="btn-press px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium">{t('fasaaha.viewMissions')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <Link to="/student/fasaaha/missions" className="text-sm text-primary-600 hover:underline">{t('fasaaha.backToMissions')}</Link>

      <div className="text-center rounded-xl border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
        <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>{mission.title}</p>
        <p className="text-3xl leading-relaxed py-4" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-arabic, serif)' }}>
          {mission.prompt_ar}
        </p>
        {mission.prompt_translation && (
          <div>
            <button onClick={() => setShowTranslation(!showTranslation)} className="text-xs text-primary-600 hover:underline">
              {showTranslation ? t('fasaaha.hideTranslation') : t('fasaaha.showTranslation')}
            </button>
            {showTranslation && <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>{mission.prompt_translation}</p>}
          </div>
        )}
      </div>

      <div className="rounded-xl border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
        <AudioRecorder onRecordingComplete={setRecordingBlob} disabled={submitAttempt.isPending} maxDurationSeconds={mission.max_time_seconds ?? 120} />
      </div>

      {submitAttempt.isError && <p className="text-sm text-red-500 text-center">{t('common.error')}</p>}

      {recordingBlob && !submitAttempt.isPending && (
        <button onClick={handleSubmit} className="w-full btn-press py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors">
          {t('fasaaha.submitAttempt')}
        </button>
      )}

      {submitAttempt.isPending && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            {t('fasaaha.processing')}
          </div>
        </div>
      )}
    </div>
  );
}