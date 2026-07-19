import { useEffect, useState, useCallback } from 'react';
import { questionAPI, subjectAPI } from '../../api';
import { unwrapPaginated } from '../../api/client';
import type { Question, Subject, Topic } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

type QuestionForm = {
  topic: number | '';
  question_text: string;
  question_type: 'mcq' | 'fill_blank' | 'short_answer' | 'essay';
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

const emptyForm: QuestionForm = {
  topic: '',
  question_text: '',
  question_type: 'mcq',
  options: ['', '', '', ''],
  correct_answer: '',
  explanation: '',
  difficulty: 'medium',
};

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<QuestionForm>(emptyForm);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [filters, setFilters] = useState({ topic: '', type: '', difficulty: '', search: '' });
  const [saving, setSaving] = useState(false);

  const loadQuestions = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filters.topic) params.topic = filters.topic;
    if (filters.type) params.type = filters.type;
    if (filters.difficulty) params.difficulty = filters.difficulty;
    if (filters.search) params.search = filters.search;
    questionAPI.list(params)
      .then((res) => setQuestions(unwrapPaginated(res.data)))
      .catch(() => setError('Failed to load questions'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  useEffect(() => {
    subjectAPI.list().then((res) => setSubjects(unwrapPaginated(res.data))).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      subjectAPI.getTopics(selectedSubject as number)
        .then((res) => setTopics(unwrapPaginated(res.data)))
        .catch(() => setTopics([]));
    } else {
      setTopics([]);
    }
  }, [selectedSubject]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (q: Question) => {
    setEditingId(q.id);
    setForm({
      topic: q.topic,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options ?? ['', '', '', ''],
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.question_text || !form.topic) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        topic: form.topic as number,
        options: form.question_type === 'mcq' ? form.options.filter((o) => o.trim()) : null,
      };
      if (editingId) {
        await questionAPI.update(editingId, payload);
      } else {
        await questionAPI.create(payload);
      }
      setShowForm(false);
      loadQuestions();
    } catch {
      setError('Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = async (id: number) => {
    if (!confirm('Delete this question?')) return;
    try {
      await questionAPI.delete(id);
      loadQuestions();
    } catch {
      setError('Failed to delete question');
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm({ ...form, options: newOptions });
  };

  const addOption = () => setForm({ ...form, options: [...form.options, ''] });
  const removeOption = (index: number) => setForm({ ...form, options: form.options.filter((_, i) => i !== index) });

  const typeLabel = (t: string) => {
    const map: Record<string, string> = { mcq: 'MCQ', fill_blank: 'Fill Blank', short_answer: 'Short Answer', essay: 'Essay' };
    return map[t] ?? t;
  };

  const difficultyColor = (d: string) => {
    const map: Record<string, string> = { easy: 'bg-green-100 text-green-800', medium: 'bg-yellow-100 text-yellow-800', hard: 'bg-red-100 text-red-800' };
    return map[d] ?? 'bg-gray-100 text-gray-800';
  };

  if (loading && !showForm) return <LoadingSpinner size="lg" className="mt-20" />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          + New Question
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-5">
        <input
          type="text"
          placeholder="Search questions..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <select
          value={selectedSubject}
          onChange={(e) => {
            const val = e.target.value ? Number(e.target.value) : '';
            setSelectedSubject(val);
            setFilters({ ...filters, topic: '' });
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={filters.topic}
          onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">All types</option>
          <option value="mcq">MCQ</option>
          <option value="fill_blank">Fill Blank</option>
          <option value="short_answer">Short Answer</option>
          <option value="essay">Essay</option>
        </select>
        <select
          value={filters.difficulty}
          onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {showForm && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {editingId ? 'Edit Question' : 'Create Question'}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : '';
                  setSelectedSubject(val);
                  setForm({ ...form, topic: '' });
                }}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Topic</label>
              <select
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value ? Number(e.target.value) : '' })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Select topic</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Question Type</label>
              <select
                value={form.question_type}
                onChange={(e) => setForm({ ...form, question_type: e.target.value as QuestionForm['question_type'] })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="mcq">Multiple Choice</option>
                <option value="fill_blank">Fill in the Blank</option>
                <option value="short_answer">Short Answer</option>
                <option value="essay">Essay</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as QuestionForm['difficulty'] })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Question Text</label>
              <textarea
                rows={3}
                value={form.question_text}
                onChange={(e) => setForm({ ...form, question_text: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {form.question_type === 'mcq' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Options</label>
              <div className="mt-1 space-y-2">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    {form.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  + Add Option
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {form.question_type === 'mcq' ? 'Correct Answer (select from options)' : 'Correct Answer'}
              </label>
              {form.question_type === 'mcq' ? (
                <select
                  value={form.correct_answer}
                  onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Select correct answer</option>
                  {form.options.filter((o) => o.trim()).map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.correct_answer}
                  onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Explanation</label>
              <input
                type="text"
                value={form.explanation}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !form.question_text || !form.topic}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update Question' : 'Create Question'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {questions.length === 0 ? (
        <p className="text-center text-gray-500">No questions found.</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{q.question_text}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {typeLabel(q.question_type)}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColor(q.difficulty)}`}>
                      {q.difficulty}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      {q.topic_name}
                    </span>
                  </div>
                  {q.question_type === 'mcq' && q.options && (
                    <ul className="mt-2 list-inside list-disc text-xs text-gray-600">
                      {q.options.map((opt, i) => (
                        <li key={i} className={opt === q.correct_answer ? 'font-semibold text-primary-700' : ''}>
                          {opt} {opt === q.correct_answer && '(correct)'}
                        </li>
                      ))}
                    </ul>
                  )}
                  {q.question_type !== 'mcq' && q.correct_answer && (
                    <p className="mt-1 text-xs text-gray-500">
                      Answer: <span className="font-medium text-primary-700">{q.correct_answer}</span>
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => openEdit(q)}
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
