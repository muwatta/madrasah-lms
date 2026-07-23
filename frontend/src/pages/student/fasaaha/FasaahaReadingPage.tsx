import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { useFasaahaMission, useFasaahaSubmitAttempt } from '../../../hooks/useFasaaha';
import ScoreDisplay from '../../../components/fasaaha/ScoreDisplay';

export default function FasaahaReadingPage() {
  const { missionId } = useParams();
  const { t } = useLanguage();
  const numericId = missionId && missionId !== '0' ? Number(missionId) : null;
  const { data: mission, isLoading: loadingMission } = useFasaahaMission(numericId);
  const submitAttempt = useFasaahaSubmitAttempt();

  const [showTranslation, setShowTranslation] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimestampRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [clearTimer, recordedUrl]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const maxSeconds = mission?.max_time_seconds ?? 180;
  const progressPercent = Math.min((elapsedSeconds / maxSeconds) * 100, 100);

  const getBarColor = () => {
    if (progressPercent > 90) return 'bg-red-500';
    if (progressPercent > 70) return 'bg-orange-400';
    return 'bg-green-500';
  };

  const startRecording = async () => {
    setRecordedBlob(null);
    if (recordedUrl) { URL.revokeObjectURL(recordedUrl); setRecordedUrl(null); }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        clearTimer();
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setElapsedSeconds(0);
      startTimestampRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= maxSeconds) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch {
      // microphone access denied
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    clearTimer();
    setIsRecording(false);
  };

  const handleSubmit = () => {
    if (!recordedBlob || !mission) return;
    const fd = new FormData();
    fd.append('mission', String(mission.id));
    fd.append('audio', recordedBlob, 'reading.webm');
    fd.append('time_spent_seconds', String(elapsedSeconds));
    submitAttempt.mutate(fd, {
      onSuccess: (res) => setResult(res.data),
    });
  };

  if (loadingMission) {
    return <div className="py-12 text-center" style={{ color: 'var(--color-text-muted)' }}>{t('common.loading')}</div>;
  }

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
    const timeSpent = result.time_spent_seconds;
    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <div className="text-center py-4">
          <span className="text-3xl">{'\u{1F4D6}'}</span>
          <h2 className="text-xl font-bold mt-2" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.readingComplete')}</h2>
        </div>

        {timeSpent && (
          <div className="rounded-xl border p-4 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.timeSpent')}</p>
            <p className="text-2xl font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>{formatTime(timeSpent)}</p>
          </div>
        )}

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
          <button onClick={() => { setResult(null); setRecordedBlob(null); setElapsedSeconds(0); }} className="btn-press px-4 py-2 rounded-lg border text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>{t('fasaaha.tryAgain')}</button>
          <Link to="/student/fasaaha/missions" className="btn-press px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium">{t('fasaaha.viewMissions')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <Link to="/student/fasaaha/missions" className="text-sm text-primary-600 hover:underline">{t('fasaaha.backToMissions')}</Link>

      {/* Mission title */}
      <div className="text-center">
        <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{mission.title}</p>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{mission.title_ar}</h2>
      </div>

      {/* Reading text */}
      <div className="rounded-xl border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
        <p
          className="text-2xl leading-loose text-center whitespace-pre-line"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-arabic, serif)', lineHeight: '2.2' }}
          dir="rtl"
        >
          {mission.prompt_ar}
        </p>

        {/* Toggle aids */}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className="text-xs px-3 py-1.5 rounded-full border transition-colors"
            style={{
              borderColor: showTranslation ? 'var(--color-primary)' : 'var(--color-border)',
              color: showTranslation ? 'var(--color-primary)' : 'var(--color-text-muted)',
              backgroundColor: showTranslation ? 'var(--color-primary-bg)' : 'transparent',
            }}
          >
            {showTranslation ? t('fasaaha.hideTranslation') : t('fasaaha.showTranslation')}
          </button>
          <button
            onClick={() => setShowTransliteration(!showTransliteration)}
            className="text-xs px-3 py-1.5 rounded-full border transition-colors"
            style={{
              borderColor: showTransliteration ? 'var(--color-primary)' : 'var(--color-border)',
              color: showTransliteration ? 'var(--color-primary)' : 'var(--color-text-muted)',
              backgroundColor: showTransliteration ? 'var(--color-primary-bg)' : 'transparent',
            }}
          >
            {showTransliteration ? t('fasaaha.hideTransliteration') : t('fasaaha.showTransliteration')}
          </button>
        </div>

        {showTranslation && mission.prompt_translation && (
          <p className="mt-3 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>{mission.prompt_translation}</p>
        )}
        {showTransliteration && mission.prompt_transliteration && (
          <p className="mt-3 text-sm text-center italic" style={{ color: 'var(--color-text-muted)' }}>{mission.prompt_transliteration}</p>
        )}
      </div>

      {/* Recording section */}
      <div className="rounded-xl border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          {/* Timer */}
          <span className="font-mono text-3xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {formatTime(elapsedSeconds)}
          </span>

          {/* Progress bar */}
          <div className="w-full max-w-xs h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border-light)' }}>
            <div className={`h-full rounded-full transition-all duration-1000 ${getBarColor()}`} style={{ width: `${progressPercent}%` }} />
          </div>

          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t('fasaaha.maxTime')}: {formatTime(maxSeconds)}
          </p>

          {/* Record / Stop button */}
          {!recordedBlob && (
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={submitAttempt.isPending}
              className="relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
            >
              {isRecording ? (
                <span className="flex items-center justify-center">
                  <span className="absolute inline-flex w-20 h-20 rounded-full bg-red-400 opacity-30 animate-ping" />
                  <span className="w-6 h-6 rounded-sm bg-red-500" />
                </span>
              ) : (
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              )}
            </button>
          )}

          {/* Recording instructions */}
          {!recordedBlob && !isRecording && (
            <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
              {t('fasaaha.readingInstructions')}
            </p>
          )}
          {isRecording && (
            <p className="text-xs text-center font-medium text-green-600 animate-pulse">
              {t('fasaaha.readingNow')}
            </p>
          )}

          {/* Playback + actions after recording */}
          {recordedBlob && recordedUrl && (
            <div className="flex flex-col items-center gap-3 w-full max-w-xs">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.recordingPreview')}</p>
              <audio ref={audioRef} src={recordedUrl} controls className="w-full" />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setRecordedBlob(null); if (recordedUrl) { URL.revokeObjectURL(recordedUrl); setRecordedUrl(null); } setElapsedSeconds(0); }}
                  className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: 'transparent' }}
                >
                  {t('fasaaha.reRecord')}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitAttempt.isPending}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submitAttempt.isPending ? t('fasaaha.processing') : t('fasaaha.submitAttempt')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {submitAttempt.isError && <p className="text-sm text-red-500 text-center">{t('common.error')}</p>}
    </div>
  );
}
