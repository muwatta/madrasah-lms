import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI, attemptAPI, questionAPI } from '../../api';
import type { Question, Quiz, GradingResult } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Answers {
  [questionId: string]: string;
}

export default function QuizTakePage() {
  const { t } = useLanguage();
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GradingResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const setAnswer = useCallback((questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [String(questionId)]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    setShowConfirmModal(false);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const res = await attemptAPI.submit(attemptId, answers);
      setResult(res.data.grading);
    } catch (err: any) {
      setError(err.response?.data?.detail || t('quizTake.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, submitting, answers]);

  useEffect(() => {
    const init = async () => {
      try {
        const quizRes = await quizAPI.get(Number(quizId));
        const q = quizRes.data;
        setQuiz(q);

        const qRes = await questionAPI.list({ ids: q.question_ids?.join(',') });
        const fetchedQuestions = qRes.data.results || qRes.data || [];
        setQuestions(fetchedQuestions);

        const attemptRes = await attemptAPI.start(Number(quizId));
        setAttemptId(attemptRes.data.id);

        if (q.time_limit_minutes) {
          setTimeLeft(q.time_limit_minutes * 60);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || t('quizTake.startFailed'));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [quizId]);

  useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : prev));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, result, handleSubmit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>
      </div>
    );
  }

  if (result) {
    const passed = result.percentage >= (quiz?.passing_score || 50);
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className={`rounded-2xl p-8 text-center mb-8 ${passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h2 className="text-3xl font-bold mb-2">{passed ? t('quizTake.wellDone') : t('quizTake.tryAgain')}</h2>
          <p className="text-5xl font-bold my-4">{result.percentage}%</p>
          <p className="text-lg">{result.score}/{result.total} {t('quizTake.correct')}</p>
          <p className={`mt-2 font-medium ${passed ? 'text-green-700' : 'text-red-700'}`}>
            {passed ? t('quizTake.youPassed') : t('quizTake.youDidNotPass')}
          </p>
        </div>

        <h3 className="text-xl font-semibold mb-4">{t('quizTake.reviewAnswers')}</h3>
        {questions.map((q, i) => {
          const r = result.results[String(q.id)];
          if (!r) return null;
          return (
            <div key={q.id} className={`rounded-xl p-5 mb-4 border ${r.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-3">
                <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${r.is_correct ? 'bg-green-500' : 'bg-red-500'}`}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 mb-2">{q.question_text}</p>
                  <p className="text-sm text-gray-600">{t('quizTake.yourAnswer')} <span className="font-medium">{r.user_answer || t('quizTake.empty')}</span></p>
                  {!r.is_correct && (
                    <p className="text-sm text-gray-600">{t('quizTake.correctAnswer')} <span className="font-medium text-green-700">{r.correct_answer}</span></p>
                  )}
                  {q.explanation && (
                    <p className="text-sm text-gray-500 mt-2 italic">{q.explanation}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={() => navigate('/student/quizzes')}
          className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition"
        >
          {t('quizTake.returnToQuizzes')}
        </button>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const question = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const isLastQuestion = currentIndex === questions.length - 1;
  const isTimeLow = timeLeft !== null && timeLeft <= 30;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Confirm Submit Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">{t('quizTake.confirmSubmit')}</h2>
            <p className="text-gray-600">{t('quizTake.confirmSubmitDesc')}</p>
            {unansweredCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-700 text-sm font-medium">
                <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {t('quizTake.unansweredWarning')} ({unansweredCount} {t('quizTake.unanswered')})
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold transition"
              >
                {submitting ? t('common.submitting') : t('quizTake.submitQuiz')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timer warning banner */}
      {isTimeLow && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-medium animate-pulse">
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('quizTake.timeWarning')} {t('quizTake.autoSubmit')} {formatTime(timeLeft!)}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">{quiz?.title}</h1>
        {timeLeft !== null && (
          <div className={`px-4 py-2 rounded-lg font-mono text-lg font-bold transition-colors ${
            timeLeft <= 30 ? 'bg-red-100 text-red-700 animate-pulse' :
            timeLeft <= 60 ? 'bg-amber-100 text-amber-700' :
            'bg-emerald-100 text-emerald-700'
          }`}>
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
        <span>{t('quizTake.questionCounter')} {currentIndex + 1} {t('quizTake.of')} {questions.length}</span>
        <span className={unansweredCount > 0 ? 'text-amber-600 font-medium' : ''}>
          {answeredCount}/{questions.length} {t('quizTake.answered')}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>{question.difficulty === 'easy' ? t('difficulty.easy') : question.difficulty === 'medium' ? t('difficulty.medium') : t('difficulty.hard')}</span>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
            {question.question_type === 'mcq' ? t('questionTypes.mcq') : question.question_type === 'fill_blank' ? t('questionTypes.fillBlank') : question.question_type === 'short_answer' ? t('questionTypes.shortAnswer') : t('questionTypes.essay')}
          </span>
          {answers[String(question.id)] && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
              ✓
            </span>
          )}
        </div>

        <p className="text-lg font-medium text-gray-800 mb-6">{question.question_text}</p>

        {question.question_type === 'mcq' && question.options && (
          <div className="space-y-3">
            {question.options.map((opt, i) => (
              <label
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  answers[String(question.id)] === opt
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  value={opt}
                  checked={answers[String(question.id)] === opt}
                  onChange={() => setAnswer(question.id, opt)}
                  className="w-4 h-4 text-emerald-600"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}

        {question.question_type === 'fill_blank' && (
          <input
            type="text"
            value={answers[String(question.id)] || ''}
            onChange={(e) => setAnswer(question.id, e.target.value)}
            placeholder={t('quizTake.typeAnswer')}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
          />
        )}

        {question.question_type === 'short_answer' && (
          <textarea
            value={answers[String(question.id)] || ''}
            onChange={(e) => setAnswer(question.id, e.target.value)}
            placeholder={t('quizTake.typeAnswer')}
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-y"
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {t('common.previous')}
        </button>

        {isLastQuestion ? (
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold transition"
          >
            {submitting ? t('common.submitting') : t('quizTake.submitQuiz')}
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition"
          >
            {t('common.next')}
          </button>
        )}
      </div>
    </div>
  );
}
