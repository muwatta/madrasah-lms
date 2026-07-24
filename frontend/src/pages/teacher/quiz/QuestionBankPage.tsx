import { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useQuestions, useCreateQuestion, useUpdateQuestion, useDeleteQuestion } from '../../../hooks/useQuiz';
import { SkeletonCard } from '../../../components/Skeleton';
import type { Question } from '../../../types';

interface QForm {
  text: string; question_type: 'mcq' | 'true_false';
  options: string[]; correct_answer: string; explanation: string;
  subject: number | ''; difficulty: number; marks: number; tags: string[];
  is_ai_generated: boolean;
}

const defaultForm: QForm = {
  text: '', question_type: 'mcq', options: ['A', 'B', 'C', 'D'],
  correct_answer: 'A', explanation: '', subject: '', difficulty: 2, marks: 1, tags: [], is_ai_generated: false,
};

export default function QuestionBankPage() {
  const { t } = useLanguage();
  const { data: questions = [], isLoading } = useQuestions();
  const createQ = useCreateQuestion();
  const updateQ = useUpdateQuestion();
  const deleteQ = useDeleteQuestion();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<QForm>(defaultForm);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const filtered = questions.filter((q: Question) => {
    if (filter && !q.text.toLowerCase().includes(filter.toLowerCase())) return false;
    if (typeFilter && q.question_type !== typeFilter) return false;
    return true;
  });

  const openEdit = (q: Question) => {
    setForm({
      text: q.text, question_type: q.question_type,
      options: q.options?.map((o: any) => o.text) || ['A', 'B', 'C', 'D'],
      correct_answer: q.correct_answer, explanation: q.explanation || '',
      subject: q.subject || '', difficulty: q.difficulty, marks: q.marks, tags: q.tags || [],
      is_ai_generated: q.is_ai_generated,
    });
    setEditId(q.id);
    setShowForm(true);
  };

  const handleSave = () => {
    const payload = {
      text: form.text, question_type: form.question_type,
      options: form.options.map((opt, i) => ({ key: String.fromCharCode(65 + i), text: opt })),
      correct_answer: form.correct_answer, explanation: form.explanation,
      subject: form.subject ? Number(form.subject) : undefined,
      difficulty: form.difficulty, marks: form.marks, tags: form.tags,
      is_ai_generated: form.is_ai_generated,
    };
    if (editId) {
      updateQ.mutate({ id: editId, ...payload }, { onSuccess: () => { setShowForm(false); setEditId(null); setForm(defaultForm); } });
    } else {
      createQ.mutate(payload, { onSuccess: () => { setShowForm(false); setForm(defaultForm); } });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('quiz.questionBank') || 'Question Bank'}</h1>
        <button onClick={() => { setForm(defaultForm); setEditId(null); setShowForm(true); }}
          className="btn-press px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium">
          {t('quiz.addQuestion') || '+ Add Question'}
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder={t('quiz.search') || 'Search...'}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm" />
        {['', 'mcq', 'true_false'].map(type => (
          <button key={type} onClick={() => setTypeFilter(type)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === type ? 'bg-primary-600 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            {type || 'All'}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="rounded-xl border border-primary-200 bg-primary-50 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">{editId ? t('quiz.editQuestion') || 'Edit Question' : t('quiz.newQuestion') || 'New Question'}</h3>
          <textarea value={form.text} onChange={e => setForm({ ...form, text: e.target.value })}
            placeholder={t('quiz.questionText') || 'Question text...'} rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm" />
          <div className="flex gap-3">
            <select value={form.question_type} onChange={e => setForm({ ...form, question_type: e.target.value as any })}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm">
              <option value="mcq">MCQ</option>
              <option value="true_false">True/False</option>
            </select>
            <input type="number" value={form.marks} onChange={e => setForm({ ...form, marks: Number(e.target.value) })}
              className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm" placeholder="Marks" />
            <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: Number(e.target.value) })}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm">
              {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>{d} - {['', 'Easy', 'Medium', 'Hard', 'Expert', 'Master'][d]}</option>)}
            </select>
          </div>
          {form.question_type === 'mcq' && (
            <div className="grid grid-cols-2 gap-2">
              {form.options.map((opt, i) => (
                <input key={i} value={opt} onChange={e => { const opts = [...form.options]; opts[i] = e.target.value; setForm({ ...form, options: opts }); }}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm" />
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <select value={form.correct_answer} onChange={e => setForm({ ...form, correct_answer: e.target.value })}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm">
              {form.options.map((_, i) => <option key={i} value={String.fromCharCode(65 + i)}>{String.fromCharCode(65 + i)}</option>)}
            </select>
            <input value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })}
              placeholder={t('quiz.explanation') || 'Explanation'} className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={!form.text.trim() || createQ.isPending || updateQ.isPending}
              className="btn-press px-4 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium disabled:opacity-50">
              {editId ? t('quiz.save') || 'Save' : t('quiz.add') || 'Add'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(defaultForm); }}
              className="px-4 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs hover:bg-gray-50 transition-colors">{t('quiz.cancel') || 'Cancel'}</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((q: Question) => (
            <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-4 flex items-start gap-4">
              <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                q.question_type === 'mcq' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}>{q.question_type}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{q.text}</p>
                <p className="text-xs mt-1 text-gray-500">
                  Correct: {q.correct_answer} • {q.marks} mark{q.marks !== 1 ? 's' : ''} • Difficulty {q.difficulty}
                  {q.is_ai_generated && <span className="ml-2 text-purple-500">🤖 AI</span>}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(q)} className="text-xs text-primary-600 hover:underline">{t('quiz.edit') || 'Edit'}</button>
                <button onClick={() => deleteQ.mutate(q.id)} className="text-xs text-red-500 hover:underline">{t('quiz.delete') || 'Delete'}</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-gray-500 text-center py-8">{t('quiz.noQuestions') || 'No questions found'}</p>}
        </div>
      )}
    </div>
  );
}
