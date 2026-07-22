import { useState, useRef, useCallback, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  disabled?: boolean;
  maxDurationSeconds?: number;
}

export default function AudioRecorder({
  onRecordingComplete,
  disabled = false,
  maxDurationSeconds = 120,
}: AudioRecorderProps) {
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const progressPercent = Math.min(
    (elapsedSeconds / maxDurationSeconds) * 100,
    100
  );

  const getBarColor = () => {
    if (progressPercent > 90) return "bg-red-500";
    if (progressPercent > 70) return "bg-orange-400";
    return "bg-green-500";
  };

  const startRecording = useCallback(async () => {
    setError(null);
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        clearTimer();
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setElapsedSeconds(0);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= maxDurationSeconds) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch {
      setError(t("microphone_access_denied"));
    }
  }, [maxDurationSeconds, clearTimer, t, recordedUrl]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    clearTimer();
    setIsRecording(false);
  }, [isRecording, clearTimer]);

  const handleUseRecording = () => {
    if (recordedBlob) {
      onRecordingComplete(recordedBlob);
    }
  };

  const handleRerecord = () => {
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    setElapsedSeconds(0);
  };

  const recordButtonDisabled = disabled || !!recordedBlob;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {/* Timer */}
      {!recordedBlob && (
        <span
          className="font-mono text-2xl font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {formatTime(elapsedSeconds)}
        </span>
      )}

      {/* Progress bar */}
      {!recordedBlob && (
        <div
          className="w-full max-w-xs h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--color-border-light)" }}
        >
          <div
            className={`h-full rounded-full transition-all duration-1000 ${getBarColor()}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Record / Stop button */}
      {!recordedBlob && (
        <button
          type="button"
          disabled={recordButtonDisabled}
          onClick={isRecording ? stopRecording : startRecording}
          className="relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: isRecording
              ? "var(--color-bg-secondary)"
              : "var(--color-bg-secondary)",
            color: "var(--color-text-primary)",
          }}
          aria-label={isRecording ? t("stop_recording") : t("start_recording")}
        >
          {isRecording ? (
            <span className="flex items-center justify-center">
              <span className="absolute inline-flex w-20 h-20 rounded-full bg-red-400 opacity-30 animate-ping" />
              <span className="w-6 h-6 rounded-sm bg-red-500" />
            </span>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          )}
        </button>
      )}

      {/* Playback preview */}
      {recordedBlob && recordedUrl && (
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          <p
            className="text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            {t("recording_preview")}
          </p>
          <audio ref={audioRef} src={recordedUrl} controls className="w-full" />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleRerecord}
              className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
                backgroundColor: "transparent",
              }}
            >
              {t("re_record")}
            </button>
            <button
              type="button"
              onClick={handleUseRecording}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              {t("use_this_recording")}
            </button>
          </div>
        </div>
      )}

      <p
        className="text-xs"
        style={{ color: "var(--color-text-muted)" }}
      >
        {t("max_duration")}: {formatTime(maxDurationSeconds)}
      </p>
    </div>
  );
}
