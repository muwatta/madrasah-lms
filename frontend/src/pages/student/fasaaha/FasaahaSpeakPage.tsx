import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { fasaahaAPI } from '../../../api';
import type { Mission, SpeakingAttempt } from '../../../types';
import AudioRecorder from '../../../components/fasaaha/AudioRecorder';
import ScoreDisplay from '../../../components/fasaaha/ScoreDisplay';

export default function FasaahaSpeakPage() {
  const { missionId } = useParams();
  const { t, language } = useLanguage();
  const [mission, setMission] = useState<Mission | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SpeakingAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (missionId && missionId !== '0') {
      fasaahaAPI.missions.get(Number(missionId)).then(res => setMission(res.data));
    }
  }, [missionId]);

  const handleSubmit = async () => {
    if (!recordingBlob || !mission) return;
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('mission', String(mission.id));
      fd.append('audio', recordingBlob, 'recording.webm');
      const res = await fasaahaAPI.attempts.submit(fd);
      setResult(res.data);
    } catch {
      setError(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!mission && missionId && missionId !== '0') return <div className="py-12 text-center" style={{ color: 'var(--color-text-muted)' }}>{t('common.loading')}</div>;

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

  const title = language === 'ar' ? mission.title : mission.title_en || mission.title;

  if (result) {
    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <div className="text-center py-4">
          <span className="text-3xl">🎉</span>
          <h2 className="text-xl font-bold mt-2" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.missionComplete')}</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>+{result.points_earned} {t('fasaaha.points')}</p>
        </div>
        <ScoreDisplay aiScore={result.ai_score} pronunciationScore={result.ai_pronunciation_score} grammarScore={result.ai_grammar_score} fluencyScore={result.ai_fluency_score} teacherScore={result.teacher_score} aiFeedback={result.ai_feedback} teacherFeedback={result.teacher_feedback} />
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
        <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>{title}</p>
        <p className="text-3xl leading-relaxed py-4" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-arabic, serif)' }}>
          {mission.arabic_text}
        </p>
        {mission.translation_text && (
          <div>
            <button onClick={() => setShowTranslation(!showTranslation)} className="text-xs text-primary-600 hover:underline">
              {showTranslation ? t('fasaaha.hideTranslation') : t('fasaaha.showTranslation')}
            </button>
            {showTranslation && <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>{mission.translation_text}</p>}
          </div>
        )}
      </div>

      <div className="rounded-xl border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
        <AudioRecorder onRecordingComplete={setRecordingBlob} disabled={submitting} maxDurationSeconds={mission.time_limit_seconds ?? 120} />
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {recordingBlob && !submitting && (
        <button onClick={handleSubmit} className="w-full btn-press py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors">
          {t('fasaaha.submitAttempt')}
        </button>
      )}

      {submitting && (
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
