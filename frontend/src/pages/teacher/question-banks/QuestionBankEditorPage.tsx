import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { quizzesAPI } from '../../../api';
import { useQuestionBank, useQuestionBankQuestions, useConvertQuestionBank } from '../../../hooks/useQuestionBanks';
import type { QuizQuestion } from '../../../types';
import { SkeletonTable } from '../../../components/Skeleton';

const inputCls =
  'mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

const typeOptions: Array<{ value: QuizQuestion['question_type']; key: string }> = [
  { value: 'mcq', key: 'questionBanks.mcq' },
  { value: 'true_false', key: 'questionBanks.true_false' },
  { value: 'short_answer', key: 'questionBanks.short_answer' },
];

export default function QuestionBankEditorPage() {
  const { id } = useParams<{ id: string }>();
  const bankId = id ? Number(id) : null;
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { data: bank } = useQuestionBank(bankId);
  const { data: questions, isLoading } = useQuestionBankQuestions(bankId);
  const convert = useConvertQuestionBank();

  const [items, setItems] = useState<QuizQuestion[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmConvert, setConfirmConvert] = useState(false);

  useEffect(() => {
    if (questions) setItems(questions);
  }, [questions]);

  const missingAnswers = items.filter((q) => !q.correct_answer?.trim()).length;

  const updateQuestion = (qid: number, patch: Partial<QuizQuestion>) => {
    setItems((prev) => prev.map((q) => (q.id === qid ? { ...q, ...patch } : q)));
  };

  const saveQuestion = async (q: QuizQuestion) => {
    setSavingId(q.id);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        subject: q.subject,
        question_text: q.question_text,
        question_type: q.question_type,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
      };
      if (q.question_type === 'mcq') {
        payload.options = (q.options ?? []).filter((o) => o && o.text?.trim()).map((o) => ({ key: o.key, text: o.text }));
      }
      await quizzesAPI.questions.update(q.id, payload);
      setSuccess(t('questionBanks.saved'));
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? t('questionBanks.uploadError'));
    } finally {
      setSavingId(null);
    }
  };

  const toggleOptionCorrect = (q: QuizQuestion, idx: number) => {
    const label = String.fromCharCode(65 + idx);
    updateQuestion(q.id, {
      correct_answer: q.correct_answer === label ? '' : label,
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate('/teacher/question-banks')}
        className="mb-4 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
      >
        &larr; {t('questionBanks.backToList')}
      </button>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {bank ? bank.subject_name : t('questionBanks.editTitle')}
        </h1>
        <div className="flex items-center gap-3">
          {missingAnswers > 0 && (
            <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
              {missingAnswers} {t('questionBanks.missingAnswers')}
            </span>
          )}
          {bank?.converted_quiz ? (
            <button
              onClick={() => navigate(`/teacher/quizzes/${bank.converted_quiz}/analytics`)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              {t('questionBanks.converted')}
            </button>
          ) : (
            <button
              onClick={() => setConfirmConvert(true)}
              disabled={missingAnswers > 0}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {t('questionBanks.convert')}
            </button>
          )}
        </div>
      </div>
      {bank && (
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {bank.school_class_name} · {bank.session_name} · {bank.term_name}
        </p>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ms-2 underline">{t('common.dismiss')}</button>
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          {success}
          <button onClick={() => setSuccess(null)} className="ms-2 underline">{t('common.dismiss')}</button>
        </div>
      )}

      {isLoading ? (
        <SkeletonTable rows={5} />
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-12 text-center text-gray-500 dark:text-gray-400">
          {t('questionBank.noQuestionsYet')}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((q, index) => (
            <div key={q.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40 text-sm font-semibold text-primary-700 dark:text-primary-400">
                    {index + 1}
                  </span>
                  <select
                    value={q.question_type}
                    onChange={(e) => updateQuestion(q.id, { question_type: e.target.value as QuizQuestion['question_type'], correct_answer: '' })}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-xs text-gray-700 dark:text-gray-200"
                  >
                    {typeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{t(opt.key)}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => saveQuestion(q)}
                  disabled={savingId === q.id}
                  className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {savingId === q.id ? '...' : t('questionBanks.saveQuestion')}
                </button>
              </div>

              <textarea
                value={q.question_text}
                onChange={(e) => updateQuestion(q.id, { question_text: e.target.value })}
                rows={2}
                className={inputCls}
              />

              {q.question_type === 'mcq' && (
                <div className="mt-3 space-y-2">
                  {(q.options ?? []).map((opt, oi) => {
                    const label = String.fromCharCode(65 + oi);
                    const isCorrect = q.correct_answer === label;
                    return (
                      <div key={oi} className="flex items-center gap-2">
                        <button
                          onClick={() => toggleOptionCorrect(q, oi)}
                          title={t('questionBanks.correctAnswer')}
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-gray-300 dark:border-gray-600 text-gray-400 hover:border-primary-500'
                          }`}
                        >
                          {isCorrect ? '✓' : label}
                        </button>
                        <input
                          value={opt.text ?? ''}
                          onChange={(e) => {
                            const opts = [...(q.options ?? [])];
                            opts[oi] = { ...opts[oi], key: label, text: e.target.value };
                            updateQuestion(q.id, { options: opts });
                          }}
                          className="mt-0 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {q.question_type === 'true_false' && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">{t('questionBanks.correctAnswer')}</label>
                  <select
                    value={q.correct_answer}
                    onChange={(e) => updateQuestion(q.id, { correct_answer: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">{t('questionBanks.correctAnswer')}</option>
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                </div>
              )}

              {q.question_type === 'short_answer' && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">{t('questionBanks.correctAnswer')}</label>
                  <input
                    value={q.correct_answer}
                    onChange={(e) => updateQuestion(q.id, { correct_answer: e.target.value })}
                    placeholder={t('questionBanks.correctAnswer')}
                    className={inputCls}
                  />
                </div>
              )}

              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">{t('questionBanks.explanation')}</label>
                <textarea
                  value={q.explanation ?? ''}
                  onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })}
                  rows={1}
                  className={inputCls}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('questionBanks.convert')}</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('questionBanks.sizeNote')}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmConvert(false)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={async () => {
                  if (!bank) return;
                  setConfirmConvert(false);
                  try {
                    const res = await convert.mutateAsync(bank.id);
                    const quizId = (res as any)?.data?.id;
                    navigate(quizId ? `/teacher/quizzes/${quizId}/analytics` : '/teacher/question-banks');
                  } catch (e: any) {
                    setError(e?.response?.data?.error ?? t('questionBanks.convertError'));
                  }
                }}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                {t('questionBanks.convert')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
