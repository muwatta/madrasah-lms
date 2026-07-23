import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { useQuiz, useQuestions, useCreateQuiz, useUpdateQuiz, useCreateQuestion, useAttachQuestion, useDetachQuestion, useUpdateQuizQuestion, usePublishQuiz } from '../../../hooks/useQuiz';
import type { Question, QuizQuestion } from '../../../types';

interface QuizFormData {
  title: string;
  description: string;
  instructions: string;
  subject: number | '';
  school_class: number | '';
  time_limit_minutes: number;
  grace_period_minutes: number;
  passing_score: number;
  total_marks: number;
  shuffle_questions: boolean;
  show_results_immediately: boolean;
  show_correct_answers: boolean;
  allow_back_navigation: boolean;
  require_fullscreen: boolean;
  difficulty: number;
  max_attempts: number;
  grading_mode: 'auto_immediate' | 'auto_release_later' | 'manual';
  max_violations: number;
  auto_submit_on_violations: boolean;
}

const defaultForm: QuizFormData = {
  title: '', description: '', instructions: '', subject: '', school_class: '',
  time_limit_minutes: 30, grace_period_minutes: 5, passing_score: 50, total_marks: 100,
  shuffle_questions: true, show_results_immediately: false, show_correct_answers: false,
  allow_back_navigation: true, require_fullscreen: false, difficulty: 2,
  max_attempts: 1, grading_mode: 'auto_immediate', max_violations: 5, auto_submit_on_violations: true,
};

export default function QuizBuilderPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const numId = quizId ? Number(quizId) : null;
  const { data: existingQuiz } = useQuiz(numId);
  const { data: existingQuestions = [] } = useQuestions();
  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz();
  const createQuestion = useCreateQuestion();
  const attachQuestion = useAttachQuestion();
  const detachQuestion = useDetachQuestion();
  const publishQuiz = usePublishQuiz();

  const [form, setForm] = useState<QuizFormData>(defaultForm);
  const [step, setStep] = useState<'info' | 'questions' | 'settings'>('info');
  const [newQuestions, setNewQuestions] = useState<Array<{ text: string; type: 'mcq' | 'true_false'; options: string[]; correct: string; explanation: string; marks: number }>>([]);
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const [newQ, setNewQ] = useState({ text: '', type: 'mcq' as 'mcq' | 'true_false', options: ['A', 'B', 'C', 'D'], correct: 'A', explanation: '', marks: 1 });
  const [filterQ, setFilterQ] = useState('');
  const [savedQuizId, setSavedQuizId] = useState<number | null>(numId);

  // Pre-fill form if editing
  useState(() => {
    if (existingQuiz) {
      setForm({
        title: existingQuiz.title, description: existingQuiz.description || '',
        instructions: existingQuiz.instructions || '', subject: existingQuiz.subject,
        school_class: existingQuiz.school_class, time_limit_minutes: existingQuiz.time_limit_minutes,
        grace_period_minutes: existingQuiz.grace_period_minutes, passing_score: existingQuiz.passing_score,
        total_marks: existingQuiz.total_marks, shuffle_questions: existingQuiz.shuffle_questions,
        show_results_immediately: existingQuiz.show_results_immediately,
        show_correct_answers: existingQuiz.show_correct_answers,
        allow_back_navigation: existingQuiz.allow_back_navigation,
        require_fullscreen: existingQuiz.require_fullscreen, difficulty: existingQuiz.difficulty,
        max_attempts: existingQuiz.max_attempts, grading_mode: existingQuiz.grading_mode,
        max_violations: existingQuiz.max_violations,
        auto_submit_on_violations: existingQuiz.auto_submit_on_violations,
      });
    }
  });

  const handleSaveQuiz = () => {
    const payload = { ...form, subject: Number(form.subject), school_class: Number(form.school_class) };
    if (numId) {
      updateQuiz.mutate({ id: numId, ...payload }, { onSuccess: () => setStep('questions') });
    } else {
      createQuiz.mutate(payload, {
        onSuccess: (res: any) => { setSavedQuizId(res.data.id); setStep('questions'); },
      });
    }
  };

  const handleAddQuestion = () => {
    if (!newQ.text.trim()) return;
    setNewQuestions(prev => [...prev, { ...newQ }]);
    setNewQ({ text: '', type: 'mcq', options: ['A', 'B', 'C', 'D'], correct: 'A', explanation: '', marks: 1 });
    setShowNewQuestion(false);
  };

  const handleAttachFromBank = (qId: number) => {
    if (!savedQuizId) return;
    attachQuestion.mutate({ quizId: savedQuizId, questionId: qId });
  };

  const handleDetach = (quizQuestionId: number) => {
    if (!savedQuizId) return;
    detachQuestion.mutate({ quizId: savedQuizId, questionId: quizQuestionId });
  };

  const handleSaveAllQuestions = async () => {
    if (!savedQuizId) return;
    for (const q of newQuestions) {
      const qRes = await createQuestion.mutateAsync({
        text: q.text, question_type: q.type,
        options: q.options.map((opt, i) => ({ key: String.fromCharCode(65 + i), text: opt })),
        correct_answer: q.correct, explanation: q.explanation, marks: q.marks,
      });
      await attachQuestion.mutateAsync({ quizId: savedQuizId, questionId: qRes.data.id });
    }
    setNewQuestions([]);
    setStep('settings');
  };

  const filteredBank = existingQuestions.filter((q: Question) =>
    q.text.toLowerCase().includes(filterQ.toLowerCase())
  );

  const existingQuizQuestions: QuizQuestion[] = (existingQuiz as any)?.questions || [];
  const allQuestions = [...existingQuizQuestions, ...newQuestions.map((q, i) => ({
    id: -i - 1, question_text: q.text, question_type: q.type,
    options: q.options.map((opt, j) => ({ key: String.fromCharCode(65 + j), text: opt })),
    correct_answer: q.correct, explanation: q.explanation, marks: q.marks, order: i,
  }))];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate('/teacher/quiz')} className="text-sm text-primary-600 hover:underline">{t('quiz.backToManage') || '← Back to Manage'}</button>
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {numId ? t('quiz.editQuiz') || 'Edit Quiz' : t('quiz.createQuiz') || 'Create Quiz'}
      </h1>

      {/* Step tabs */}
      <div className="flex gap-2">
        {(['info', 'questions', 'settings'] as const).map(s => (
          <button key={s} onClick={() => setStep(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${step === s ? 'bg-primary-600 text-white' : 'border'}`}
            style={step === s ? undefined : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
            {t(`quiz.step${s.charAt(0).toUpperCase() + s.slice(1)}`) || s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Step: Info */}
      {step === 'info' && (
        <div className="rounded-xl border p-6 space-y-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t('quiz.title') || 'Title'} *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t('quiz.description') || 'Description'}</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" rows={2} style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t('quiz.instructions') || 'Instructions'}</label>
              <textarea value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" rows={2} style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t('quiz.subject') || 'Subject'} *</label>
              <select value={form.subject} onChange={e => setForm({ ...form, subject: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                <option value="">Select</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t('quiz.class') || 'Class'} *</label>
              <select value={form.school_class} onChange={e => setForm({ ...form, school_class: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                <option value="">Select</option>
              </select>
            </div>
          </div>
          <button onClick={handleSaveQuiz} disabled={!form.title || createQuiz.isPending || updateQuiz.isPending}
            className="btn-press px-6 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-50">
            {t('quiz.nextStep') || 'Next: Add Questions →'}
          </button>
        </div>
      )}

      {/* Step: Questions */}
      {step === 'questions' && (
        <div className="space-y-4">
          <div className="rounded-xl border p-6 space-y-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('quiz.questionBank') || 'Question Bank'}</h2>
            <input value={filterQ} onChange={e => setFilterQ(e.target.value)} placeholder={t('quiz.searchQuestions') || 'Search questions...'}
              className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }} />
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredBank.map((q: Question) => (
                <div key={q.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--color-border-light)' }}>
                  <div className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{q.text}</div>
                  <button onClick={() => handleAttachFromBank(q.id)} className="text-xs text-primary-600 hover:underline shrink-0 ml-2">+ Add</button>
                </div>
              ))}
              {filteredBank.length === 0 && <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>{t('quiz.noQuestionsInBank') || 'No questions in bank'}</p>}
            </div>
          </div>

          <div className="rounded-xl border p-6 space-y-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('quiz.currentQuestions') || 'Current Questions'} ({allQuestions.length})</h2>
              <button onClick={() => setShowNewQuestion(true)} className="text-xs text-primary-600 hover:underline">{t('quiz.addNew') || '+ Add New'}</button>
            </div>
            {showNewQuestion && (
              <div className="p-4 rounded-lg border space-y-3" style={{ borderColor: 'var(--color-primary-200)', backgroundColor: 'var(--color-primary-50)' }}>
                <textarea value={newQ.text} onChange={e => setNewQ({ ...newQ, text: e.target.value })}
                  placeholder={t('quiz.questionText') || 'Question text...'} rows={2}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
                <div className="flex gap-3">
                  <select value={newQ.type} onChange={e => setNewQ({ ...newQ, type: e.target.value as any })}
                    className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                    <option value="mcq">MCQ</option>
                    <option value="true_false">True/False</option>
                  </select>
                  <input type="number" value={newQ.marks} onChange={e => setNewQ({ ...newQ, marks: Number(e.target.value) })}
                    className="w-20 px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
                </div>
                {newQ.type === 'mcq' && (
                  <div className="grid grid-cols-2 gap-2">
                    {newQ.options.map((opt, i) => (
                      <input key={i} value={opt} onChange={e => { const opts = [...newQ.options]; opts[i] = e.target.value; setNewQ({ ...newQ, options: opts }); }}
                        className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  <select value={newQ.correct} onChange={e => setNewQ({ ...newQ, correct: e.target.value })}
                    className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                    {newQ.options.map((_, i) => <option key={i} value={String.fromCharCode(65 + i)}>{String.fromCharCode(65 + i)}</option>)}
                  </select>
                  <input value={newQ.explanation} onChange={e => setNewQ({ ...newQ, explanation: e.target.value })}
                    placeholder={t('quiz.explanation') || 'Explanation (optional)'} className="flex-1 px-3 py-1.5 rounded-lg border text-sm"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddQuestion} className="btn-press px-4 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium">{t('quiz.add') || 'Add'}</button>
                  <button onClick={() => setShowNewQuestion(false)} className="px-4 py-1.5 rounded-lg border text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>{t('quiz.cancel') || 'Cancel'}</button>
                </div>
              </div>
            )}
            {allQuestions.map((q: any) => (
              <div key={q.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--color-border-light)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{q.question_text || q.text}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{q.question_type} • {q.marks} mark{q.marks !== 1 ? 's' : ''}</p>
                </div>
                {q.id < 0 ? (
                  <button onClick={() => setNewQuestions(prev => prev.filter((_, idx) => idx !== Math.abs(q.id) - 1))}
                    className="text-xs text-red-500 hover:underline shrink-0 ml-2">Remove</button>
                ) : (
                  <button onClick={() => handleDetach(q.id)} className="text-xs text-red-500 hover:underline shrink-0 ml-2">Remove</button>
                )}
              </div>
            ))}
            {allQuestions.length === 0 && <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>{t('quiz.noQuestionsYet') || 'No questions yet'}</p>}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep('info')} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>{t('quiz.back') || '← Back'}</button>
            <button onClick={() => { handleSaveAllQuestions(); }} disabled={allQuestions.length === 0 || createQuestion.isPending}
              className="btn-press px-6 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-50">
              {t('quiz.nextStep') || 'Next: Settings →'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Settings */}
      {step === 'settings' && (
        <div className="rounded-xl border p-6 space-y-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('quiz.quizSettings') || 'Quiz Settings'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t('quiz.timeLimit') || 'Time Limit (min)'}</label>
              <input type="number" value={form.time_limit_minutes} onChange={e => setForm({ ...form, time_limit_minutes: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t('quiz.gracePeriod') || 'Grace Period (min)'}</label>
              <input type="number" value={form.grace_period_minutes} onChange={e => setForm({ ...form, grace_period_minutes: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t('quiz.passingScore') || 'Passing Score (%)'}</label>
              <input type="number" value={form.passing_score} onChange={e => setForm({ ...form, passing_score: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t('quiz.totalMarks') || 'Total Marks'}</label>
              <input type="number" value={form.total_marks} onChange={e => setForm({ ...form, total_marks: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t('quiz.difficulty') || 'Difficulty'}</label>
              <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>{d} - {['', 'Easy', 'Medium', 'Hard', 'Expert', 'Master'][d]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t('quiz.maxAttempts') || 'Max Attempts'}</label>
              <input type="number" value={form.max_attempts} onChange={e => setForm({ ...form, max_attempts: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t('quiz.gradingMode') || 'Grading Mode'}</label>
              <select value={form.grading_mode} onChange={e => setForm({ ...form, grading_mode: e.target.value as any })}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                <option value="auto_immediate">Auto (Immediate)</option>
                <option value="auto_release_later">Auto (Release Later)</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t('quiz.maxViolations') || 'Max Violations'}</label>
              <input type="number" value={form.max_violations} onChange={e => setForm({ ...form, max_violations: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {([ 'shuffle_questions', 'show_results_immediately', 'show_correct_answers', 'allow_back_navigation', 'require_fullscreen', 'auto_submit_on_violations'] as const).map(key => (
              <label key={key} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <input type="checkbox" checked={form[key] as boolean} onChange={e => setForm({ ...form, [key]: e.target.checked })} className="rounded" />
                {t(`quiz.${key}`) || key.replace(/_/g, ' ')}
              </label>
            ))}
          </div>
          <div className="flex justify-between pt-4">
            <button onClick={() => setStep('questions')} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>{t('quiz.back') || '← Back'}</button>
            <div className="flex gap-2">
              {savedQuizId && (
                <button onClick={() => publishQuiz.mutate(savedQuizId, { onSuccess: () => navigate('/teacher/quiz') })}
                  className="btn-press px-6 py-2 rounded-lg bg-green-600 text-white text-sm font-medium">
                  {t('quiz.publish') || 'Publish Quiz'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
