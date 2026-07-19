import { useEffect, useState, useCallback } from 'react';
import { quizAPI, questionAPI, subjectAPI } from '../../api';
import type { Quiz, Subject, Topic, Question } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

type QuizForm = {
  title: string;
  description: string;
  subject: number | '';
  quiz_type: 'practice' | 'assignment' | 'test';
  time_limit_minutes: number | '';
  passing_score: number;
  question_ids: number[];
};

const emptyForm: QuizForm = {
  title: '',
  description: '',
  subject: '',
  quiz_type: 'practice',
  time_limit_minutes: '',
  passing_score: 50,
  question_ids: [],
};

export default function QuizManagementPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<QuizForm>(emptyForm);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionFilter, setQuestionFilter] = useState({ topic: '', type: '', difficulty: '', search: '' });
  const [saving, setSaving] = useState(false);

  const loadQuizzes = useCallback(() => {
    setLoading(true);
    quizAPI.list()
      .then((res) => setQuizzes(res.data))
      .catch(() => setError('Failed to load quizzes'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadQuizzes(); }, [loadQuizzes]);

  useEffect(() => {
    subjectAPI.list().then((res) => setSubjects(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.subject) {
      subjectAPI.getTopics(form.subject as number)
        .then((res) => setTopics(res.data))
        .catch(() => setTopics([]));
    } else {
      setTopics([]);
    }
  }, [form.subject]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (questionFilter.topic) params.topic = questionFilter.topic;
    if (questionFilter.type) params.type = questionFilter.type;
    if (questionFilter.difficulty) params.difficulty = questionFilter.difficulty;
    if (questionFilter.search) params.search = questionFilter.search;
    questionAPI.list(params)
      .then((res) => setQuestions(res.data))
      .catch(() => {});
  }, [questionFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (quiz: Quiz) => {
    setEditingId(quiz.id);
    setForm({
      title: quiz.title,
      description: quiz.description,
      subject: quiz.subject,
      quiz_type: quiz.quiz_type,
      time_limit_minutes: quiz.time_limit_minutes ?? '',
      passing_score: quiz.passing_score,
      question_ids: quiz.question_ids,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.subject) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        subject: form.subject as number,
        time_limit_minutes: form.time_limit_minutes === '' ? null : Number(form.time_limit_minutes),
      };
      if (editingId) {
        await quizAPI.update(editingId, payload);
      } else {
        await quizAPI.create(payload);
      }
      setShowForm(false);
      loadQuizzes();
    } catch {
      setError('Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (quiz: Quiz) => {
    try {
      await quizAPI.publish(quiz.id);
      loadQuizzes();
    } catch {
      setError('Failed to toggle publish');
    }
  };

  const deleteQuiz = async (id: number) => {
    if (!confirm('Delete this quiz?')) return;
    try {
      await quizAPI.delete(id);
      loadQuizzes();
    } catch {
      setError('Failed to delete quiz');
    }
  };

  const toggleQuestion = (id: number) => {
    setForm((prev) => ({
      ...prev,
      question_ids: prev.question_ids.includes(id)
        ? prev.question_ids.filter((q) => q !== id)
        : [...prev.question_ids, id],
    }));
  };

  if (loading && !showForm) return <LoadingSpinner size="lg" className="mt-20" />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quiz Management</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          + New Quiz
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {showForm && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {editingId ? 'Edit Quiz' : 'Create Quiz'}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value ? Number(e.target.value) : '' })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quiz Type</label>
              <select
                value={form.quiz_type}
                onChange={(e) => setForm({ ...form, quiz_type: e.target.value as QuizForm['quiz_type'] })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="practice">Practice</option>
                <option value="assignment">Assignment</option>
                <option value="test">Test</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Time Limit (minutes)</label>
              <input
                type="number"
                min={0}
                value={form.time_limit_minutes}
                onChange={(e) => setForm({ ...form, time_limit_minutes: e.target.value ? Number(e.target.value) : '' })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="No limit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Passing Score (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.passing_score}
                onChange={(e) => setForm({ ...form, passing_score: Number(e.target.value) })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Select Questions ({form.question_ids.length} selected)
            </h3>
            <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
              <input
                type="text"
                placeholder="Search questions..."
                value={questionFilter.search}
                onChange={(e) => setQuestionFilter({ ...questionFilter, search: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <select
                value={questionFilter.type}
                onChange={(e) => setQuestionFilter({ ...questionFilter, type: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">All types</option>
                <option value="mcq">MCQ</option>
                <option value="fill_blank">Fill Blank</option>
                <option value="short_answer">Short Answer</option>
                <option value="essay">Essay</option>
              </select>
              <select
                value={questionFilter.difficulty}
                onChange={(e) => setQuestionFilter({ ...questionFilter, difficulty: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">All difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <select
                value={questionFilter.topic}
                onChange={(e) => setQuestionFilter({ ...questionFilter, topic: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">All topics</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200">
              {questions.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">No questions found.</p>
              ) : (
                questions.map((q) => (
                  <label
                    key={q.id}
                    className={`flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-2 text-sm hover:bg-gray-50 ${
                      form.question_ids.includes(q.id) ? 'bg-primary-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.question_ids.includes(q.id)}
                      onChange={() => toggleQuestion(q.id)}
                      className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="min-w-0 flex-1 truncate">{q.question_text}</span>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {q.question_type}
                    </span>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {q.difficulty}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !form.title || !form.subject}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update Quiz' : 'Create Quiz'}
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

      {quizzes.length === 0 ? (
        <p className="text-center text-gray-500">No quizzes yet. Create your first quiz!</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Quiz</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Questions</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Attempts</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Avg Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{quiz.title}</div>
                    <div className="text-xs text-gray-500">{quiz.subject_name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm capitalize text-gray-700">{quiz.quiz_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{quiz.question_count}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{quiz.attempt_count}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{quiz.average_score.toFixed(1)}%</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => togglePublish(quiz)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        quiz.is_published
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {quiz.is_published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(quiz)}
                        className="text-sm text-primary-600 hover:text-primary-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteQuiz(quiz.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
