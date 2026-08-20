import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle, ArrowRight, CheckCircle2, Loader2, Mic, Sparkles, Target, Wand2,
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useFasaahaAttemptResult } from '../../../hooks/useFasaaha';
import type { Mission, SpeakingAttempt } from '../../../types';
import ScoreDisplay from '../ScoreDisplay';
import { PASS_THRESHOLD } from './missionStatus';

interface MissionResultViewProps {
  attemptId: number;
  initialAttempt?: SpeakingAttempt;
  mission?: Mission | null;
  hasNext?: boolean;
  onRetry: () => void;
  onNextMission: () => void;
}

const ANALYSIS_STEPS = ['fasaaha.transcribing', 'fasaaha.scoring', 'fasaaha.generatingFeedback'];

function listOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  if (typeof value === 'string' && value.trim()) return [value];
  return [];
}

function FieldList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
        {title}
      </p>
      <ul className="mt-1.5 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary-500" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnalyzingPanel() {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();

  return (
    <div className="rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full bg-primary-500/20"
          animate={reducedMotion ? undefined : { scale: [1, 1.25, 1], opacity: [0.6, 0.1, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--color-bg-secondary)' }}>
          <Mic className="h-6 w-6 text-primary-600" aria-hidden />
        </div>
      </div>

      <p className="mt-5 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {t('fasaaha.analyzingSpeech')}
      </p>

      <div className="mx-auto mt-5 max-w-xs space-y-2 text-left" dir="ltr">
        {ANALYSIS_STEPS.map((step, i) => (
          <motion.div
            key={step}
            className="flex items-center gap-2 text-xs"
            style={{ color: 'var(--color-text-muted)' }}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.7 }}
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-600" aria-hidden />
            <span className="text-xs font-medium">{t(step)}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FailedPanel({ onRetry }: { onRetry: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-2xl border border-orange-200 p-8 text-center dark:border-orange-800/50" style={{ background: 'var(--color-bg-card)' }}>
      <AlertTriangle className="mx-auto h-10 w-10 text-orange-500" aria-hidden />
      <h2 className="mt-3 text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {t('fasaaha.analysisUnavailable')}
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {t('fasaaha.analysisUnavailableDesc')}
      </p>
      <button
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
      >
        {t('fasaaha.tryAgain')}
      </button>
    </div>
  );
}

export default function MissionResultView({
  attemptId,
  initialAttempt,
  mission,
  hasNext,
  onRetry,
  onNextMission,
}: MissionResultViewProps) {
  const { t, language } = useLanguage();
  const { data: attempt, isLoading, timedOut } = useFasaahaAttemptResult(attemptId, initialAttempt);

  if (isLoading && !attempt) {
    return <AnalyzingPanel />;
  }

  if (!attempt) return null;

  const isProcessing = attempt.status === 'processing' || attempt.status === 'pending';

  if (isProcessing && !timedOut) {
    return <AnalyzingPanel />;
  }

  if (isProcessing && timedOut) {
    return <FailedPanel onRetry={onRetry} />;
  }

  if (attempt.status === 'failed') {
    return <FailedPanel onRetry={onRetry} />;
  }

  const analysis = attempt.ai_analysis;
  const overall = analysis?.overall_score ?? attempt.final_score ?? null;
  const passed = overall !== null && overall >= PASS_THRESHOLD;

  const pron = (analysis?.pronunciation_feedback ?? {}) as Record<string, unknown>;
  const gram = (analysis?.grammar_feedback ?? {}) as Record<string, unknown>;
  const flu = (analysis?.fluency_feedback ?? {}) as Record<string, unknown>;

  const pronStrengths = listOf(pron.strengths);
  const pronImprovements = listOf(pron.improvements);
  const gramErrors = listOf(gram.errors);
  const gramSuggestions = listOf(gram.suggestions);
  const gramStrengths = listOf(gram.strengths);
  const fluNaturalness = listOf(flu.naturalness);
  const fluSpeed = listOf(flu.speed);
  const fluPauses = listOf(flu.pause_analysis);

  const hasStructuredCorrections =
    pronStrengths.length + pronImprovements.length + gramErrors.length +
    gramSuggestions.length + gramStrengths.length + fluNaturalness.length +
    fluSpeed.length + fluPauses.length > 0;

  const title = language === 'ar' ? mission?.title_ar || mission?.title : mission?.title;

  return (
    <div className="space-y-6">
      <div
        className={`flex items-center gap-3 rounded-2xl border p-4 ${
          passed ? 'border-green-200 dark:border-green-800/50' : 'border-orange-200 dark:border-orange-800/50'
        }`}
        style={{ background: passed ? 'var(--color-bg-success, rgba(16,185,129,0.08))' : 'rgba(249,115,22,0.08)' }}
      >
        {passed ? (
          <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600 dark:text-green-400" aria-hidden />
        ) : (
          <Target className="h-6 w-6 shrink-0 text-orange-500" aria-hidden />
        )}
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {passed ? t('fasaaha.missionComplete') : t('fasaaha.almostThere')}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {passed ? t('fasaaha.passedHint') : t('fasaaha.belowPassing')}
          </p>
        </div>
      </div>

      {title && (
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            {mission?.mission_type ?? ''}
          </p>
          <h2 className="mt-1 text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
        </div>
      )}

      <ScoreDisplay
        aiScore={analysis?.overall_score ?? null}
        pronunciationScore={analysis?.pronunciation_score ?? null}
        grammarScore={analysis?.grammar_score ?? null}
        fluencyScore={analysis?.fluency_score ?? null}
        teacherScore={attempt.teacher_review?.overall_score ?? null}
        teacherFeedback={attempt.teacher_review?.feedback ?? null}
        wordScores={analysis?.word_scores}
        transcribedText={analysis?.transcribed_text}
        confidenceScore={analysis?.confidence_score ?? null}
        fluencyWPM={analysis?.fluency_words_per_minute ?? null}
      />

      {hasStructuredCorrections && (
        <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
          <p className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
            <Wand2 className="h-4 w-4 text-primary-600" aria-hidden />
            {t('fasaaha.aiCorrections')}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 rounded-xl p-3" style={{ background: 'var(--color-bg-secondary)' }}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-green-600 dark:text-green-400">{t('fasaaha.pronunciation')}</p>
              <FieldList title={t('fasaaha.strengths')} items={pronStrengths} />
              <FieldList title={t('fasaaha.improvements')} items={pronImprovements} />
            </div>
            <div className="space-y-3 rounded-xl p-3" style={{ background: 'var(--color-bg-secondary)' }}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">{t('fasaaha.grammar')}</p>
              <FieldList title={t('fasaaha.errors')} items={gramErrors} />
              <FieldList title={t('fasaaha.suggestions')} items={gramSuggestions} />
              <FieldList title={t('fasaaha.strengths')} items={gramStrengths} />
            </div>
            <div className="space-y-3 rounded-xl p-3 sm:col-span-2" style={{ background: 'var(--color-bg-secondary)' }}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-purple-600 dark:text-purple-400">{t('fasaaha.fluency')}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <FieldList title={t('fasaaha.naturalness')} items={fluNaturalness} />
                <FieldList title={t('fasaaha.speechRate')} items={fluSpeed} />
                <FieldList title={t('fasaaha.pauseAnalysis')} items={fluPauses} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          {passed ? t('fasaaha.practiceAgain') : t('fasaaha.tryAgain')}
        </button>
        {hasNext && (
          <button
            onClick={onNextMission}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            {t('fasaaha.nextMission')}
            <ArrowRight className={`h-4 w-4 ${language === 'ar' ? 'rotate-180' : ''}`} aria-hidden />
          </button>
        )}
        <button
          onClick={onNextMission}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--color-primary)' }}
        >
          {t('fasaaha.viewMissions')}
        </button>
      </div>
    </div>
  );
}
