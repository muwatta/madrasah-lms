import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { useQuiz, useStartQuizAttempt, useQuizAttempt, useSaveAnswer, useFlagQuestion, useSubmitQuiz, useReportViolation } from '../../../hooks/useQuiz';
import type { QuizAttempt, QuizAnswerItem } from '../../../types';

export default function QuizTakePage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const numId = quizId ? Number(quizId) : null;
  const { data: quiz } = useQuiz(numId);
  const startAttempt = useStartQuizAttempt();
  const saveAnswer = useSaveAnswer();
  const flagQuestion = useFlagQuestion();
  const submitQuiz = useSubmitQuiz();
  const reportViolation = useReportViolation();

  const [attemptUuid, setAttemptUuid] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Record<number, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const violationCountRef = useRef(0);

  const { data: attempt } = useQuizAttempt(attemptUuid);

  // Start attempt
  const handleStart = () => {
    if (!numId) return;
    startAttempt.mutate(numId, {
      onSuccess: (res) => {
        const a: QuizAttempt = res.data;
        setAttemptUuid(a.uuid);
        const initAnswers: Record<number, string> = {};
        a.answers.forEach((ans: QuizAnswerItem) => { initAnswers[ans.question] = ans.selected_answer; });
        setLocalAnswers(initAnswers);
        setTimeLeft(quiz ? (quiz.time_limit_minutes + quiz.grace_period_minutes) * 60 : 1800);
      },
    });
  };

  // Timer
  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [attempt?.status]);

  // Auto-save
  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress' || !attemptUuid) return;
    autoSaveTimer.current = setInterval(() => {
      Object.entries(localAnswers).forEach(([qId, answer]) => {
        if (answer) {
          saveAnswer.mutate({ attemptUuid, questionId: Number(qId), selectedAnswer: answer });
        }
      });
    }, 10000);
    return () => { if (autoSaveTimer.current) clearInterval(autoSaveTimer.current); };
  }, [attempt?.status, attemptUuid, localAnswers]);

  // Anti-cheating: tab switch / window blur
  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress' || !attemptUuid) return;
    const handleVisibility = () => {
      if (document.hidden) {
        violationCountRef.current++;
        reportViolation.mutate({ attemptUuid, violationType: 'tab_switch', details: { count: violationCountRef.current } });
      }
    };
    const handleBlur = () => {
      violationCountRef.current++;
      reportViolation.mutate({ attemptUuid, violationType: 'window_blur', details: { count: violationCountRef.current } });
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [attempt?.status, attemptUuid]);

  // Anti-cheating: keyboard shortcuts
  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress' || !attemptUuid) return;
    const blocked = ['c', 'x', 'v', 'a', 'p', 's'];
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && blocked.includes(e.key.toLowerCase())) {
        e.preventDefault();
        reportViolation.mutate({ attemptUuid, violationType: 'keyboard_shortcut', details: { key: e.key } });
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [attempt?.status, attemptUuid]);

  // Anti-cheating: right click + text selection + copy/paste
  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress') return;
    const prevent = (e: Event) => e.preventDefault();
    const preventCopy = (e: ClipboardEvent) => { e.preventDefault(); reportViolation.mutate({ attemptUuid: attemptUuid!, violationType: 'copy_attempt' }); };
    const preventPaste = (e: ClipboardEvent) => { e.preventDefault(); reportViolation.mutate({ attemptUuid: attemptUuid!, violationType: 'paste_attempt' }); };
    document.addEventListener('contextmenu', prevent);
    document.addEventListener('copy', preventCopy);
    document.addEventListener('paste', preventPaste);
    document.addEventListener('selectstart', prevent);
    return () => {
      document.removeEventListener('contextmenu', prevent);
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('paste', preventPaste);
      document.removeEventListener('selectstart', prevent);
    };
  }, [attempt?.status, attemptUuid]);

  const handleAnswer = useCallback((questionId: number, answer: string) => {
    setLocalAnswers(prev => ({ ...prev, [questionId]: answer }));
    if (attemptUuid) {
      saveAnswer.mutate({ attemptUuid, questionId, selectedAnswer: answer });
    }
  }, [attemptUuid]);

  const handleFlag = useCallback((questionId: number) => {
    if (attemptUuid) flagQuestion.mutate({ attemptUuid, questionId });
  }, [attemptUuid]);

  const handleSubmit = () => {
    if (attemptUuid && !submitQuiz.isPending) {
      submitQuiz.mutate(attemptUuid, {
        onSuccess: () => navigate('/student/quiz/results'),
      });
    }
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Not started yet ──
  if (!attempt) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <button onClick={() => navigate('/student/quiz')} className="text-sm text-primary-600 hover:underline">{t('quiz.backToList') || 'Back to Quizzes'}</button>
        {quiz && (
          <div className="rounded-xl border p-6 space-y-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{quiz.title}</h1>
            {quiz.instructions && <p className="text-sm whitespace-pre-line" style={{ color: 'var(--color-text-muted)' }}>{quiz.instructions}</p>}
            <div className="grid grid-cols-2 gap-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <div>{t('quiz.timeLimit') || 'Time Limit'}: {quiz.time_limit_minutes}min</div>
              <div>{t('quiz.questions') || 'Questions'}: {quiz.question_count}</div>
              <div>{t('quiz.totalMarks') || 'Total Marks'}: {quiz.total_marks}</div>
              <div>{t('quiz.passingScore') || 'Passing Score'}: {quiz.passing_score}%</div>
              <div>{t('quiz.maxAttempts') || 'Max Attempts'}: {quiz.max_attempts}</div>
              {quiz.require_fullscreen && <div className="col-span-2 text-orange-500 font-medium">{t('quiz.requiresFullscreen') || 'Requires fullscreen mode'}</div>}
            </div>
            <button onClick={handleStart} disabled={startAttempt.isPending}
              className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
              {startAttempt.isPending ? t('quiz.starting') || 'Starting...' : t('quiz.startQuiz') || 'Start Quiz'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Results ──
  if (attempt.status !== 'in_progress') {
    const isReleased = attempt.status === 'released';
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('quiz.results') || 'Results'}</h1>
        <div className="rounded-xl border p-6 text-center space-y-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
          <p className="text-4xl font-bold" style={{ color: attempt.is_pass ? '#16a34a' : '#dc2626' }}>
            {attempt.percentage !== null ? `${attempt.percentage}%` : '—'}
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {attempt.score}/{attempt.total_marks} {t('quiz.marks') || 'marks'}
          </p>
          <p className={`text-sm font-medium ${attempt.is_pass ? 'text-green-600' : 'text-red-500'}`}>
            {attempt.is_pass ? (t('quiz.passed') || 'PASSED') : (t('quiz.failed') || 'FAILED')}
          </p>
          {!isReleased && <p className="text-xs text-orange-500">{t('quiz.pendingRelease') || 'Results pending teacher release'}</p>}
        </div>
        {isReleased && (
          <div className="space-y-3">
            {attempt.answers.map((ans: QuizAnswerItem) => (
              <div key={ans.id} className={`rounded-xl border p-4 ${ans.is_correct ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{ans.question_text}</p>
                <div className="mt-2 text-sm">
                  <p>Your answer: <span className={ans.is_correct ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>{ans.selected_answer || '—'}</span></p>
                  {!ans.is_correct && <p>Correct: <span className="text-green-600 font-medium">{ans.correct_answer}</span></p>}
                  {ans.explanation && <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>{ans.explanation}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => navigate('/student/quiz')} className="w-full py-3 rounded-xl border font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
          {t('quiz.backToList') || 'Back to Quizzes'}
        </button>
      </div>
    );
  }

  // ── Taking quiz ──
  const answers = attempt.answers || [];
  const current = answers[currentIndex];
  if (!current) return null;
  const answeredCount = answers.filter((a: QuizAnswerItem) => a.selected_answer).length;
  const flaggedCount = answers.filter((a: QuizAnswerItem) => a.is_flagged).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between rounded-xl border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold" style={{ color: timeLeft < 300 ? '#dc2626' : 'var(--color-text-primary)' }}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{answeredCount}/{answers.length}</span>
          {flaggedCount > 0 && <span className="text-xs text-orange-500">🚩 {flaggedCount}</span>}
        </div>
        <button onClick={() => setShowConfirm(true)} className="btn-press px-4 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold">
          {t('quiz.submit') || 'Submit'}
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex flex-wrap gap-1.5">
        {answers.map((a: QuizAnswerItem, i: number) => (
          <button key={a.id} onClick={() => setCurrentIndex(i)}
            className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
              i === currentIndex ? 'bg-primary-600 text-white' :
              a.selected_answer ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              a.is_flagged ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      <div className="rounded-xl border p-6 space-y-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="flex items-start justify-between">
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {t('quiz.question') || 'Question'} {currentIndex + 1} / {answers.length}
          </p>
          <button onClick={() => handleFlag(current.question)} className="text-lg">
            {current.is_flagged ? '🚩' : '⚑'}
          </button>
        </div>
        <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>{current.question_text}</p>

        {/* Options */}
        <div className="space-y-2">
          {current.question_type === 'true_false' ? (
            <>
              {[{ key: 'A', text: 'True' }, { key: 'B', text: 'False' }].map(opt => (
                <button key={opt.key} onClick={() => handleAnswer(current.question, opt.key)}
                  className={`w-full text-left p-3 rounded-lg border text-sm font-medium transition-colors ${
                    localAnswers[current.question] === opt.key
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                      : 'border-[var(--color-border)] hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`} style={{ color: localAnswers[current.question] === opt.key ? undefined : 'var(--color-text-secondary)' }}>
                  ({opt.key}) {opt.text}
                </button>
              ))}
            </>
          ) : (
            (current.options || []).map(opt => (
              <button key={opt.key} onClick={() => handleAnswer(current.question, opt.key)}
                className={`w-full text-left p-3 rounded-lg border text-sm font-medium transition-colors ${
                  localAnswers[current.question] === opt.key
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'border-[var(--color-border)] hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`} style={{ color: localAnswers[current.question] === opt.key ? undefined : 'var(--color-text-secondary)' }}>
                ({opt.key}) {opt.text}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        {quiz?.allow_back_navigation ? (
          <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}
            className="btn-press px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
            {t('quiz.previous') || 'Previous'}
          </button>
        ) : <div />}
        <button onClick={() => setCurrentIndex(Math.min(answers.length - 1, currentIndex + 1))} disabled={currentIndex === answers.length - 1}
          className="btn-press px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-40">
          {t('quiz.next') || 'Next'}
        </button>
      </div>

      {/* Submit confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="rounded-xl border p-6 max-w-sm w-full mx-4 space-y-4" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('quiz.confirmSubmit') || 'Submit Quiz?'}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {t('quiz.submitWarning') || `You have answered ${answeredCount} of ${answers.length} questions. This cannot be undone.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 rounded-lg border text-sm font-medium"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
                {t('quiz.cancel') || 'Cancel'}
              </button>
              <button onClick={handleSubmit} disabled={submitQuiz.isPending}
                className="flex-1 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-50">
                {submitQuiz.isPending ? '...' : t('quiz.confirmSubmit') || 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
