import { useEffect, useState, useCallback } from 'react';
import { quizAPI, questionAPI, subjectAPI } from '../../api';
import { unwrapPaginated } from '../../api/client';
import type { Quiz, Subject, Topic, Question } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

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
  const { t } = useLanguage();
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
      .then((res) => setQuizzes(unwrapPaginated(res.data)))
      .catch(() => setError(t('quizManagement.loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => { loadQuizzes(); }, [loadQuizzes]);

  useEffect(() => {
    subjectAPI.list().then((res) => setSubjects(unwrapPaginated(res.data))).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.subject) {
      subjectAPI.getTopics(form.subject as number)
        .then((res) => setTopics(unwrapPaginated(res.data)))
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
      .then((res) => setQuestions(unwrapPaginated(res.data)))
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
      setError(t('quizManagement.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (quiz: Quiz) => {
    try {
      await quizAPI.publish(quiz.id);
      loadQuizzes();
    } catch {
      setError(t('quizManagement.publishFailed'));
    }
  };

  const deleteQuiz = async (id: number) => {
    if (!confirm(t('quizManagement.deleteConfirm'))) return;
    try {
      await quizAPI.delete(id);
      loadQuizzes();
    } catch {
      setError(t('quizManagement.deleteFailed'));
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
        <h1 className="text-2xl font-bold text-gray-900">{t('quizManagement.title')}</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {'+ ' + t('quizManagement.newQuiz')}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="me-2 underline">{t('common.dismiss')}</button>
        </div>
      )}

      {showForm && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {editingId ? t('quizManagement.editQuiz') : t('quizManagement.createQuiz')}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('fields.title')}</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('fields.subject')}</label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value ? Number(e.target.value) : '' })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">{t('filters.chooseSubject')}</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name_ar}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">{t('fields.description')}</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('fields.quizType')}</label>
              <select
                value={form.quiz_type}
                onChange={(e) => setForm({ ...form, quiz_type: e.target.value as QuizForm['quiz_type'] })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="practice">{t('quizTypes.practice')}</option>
                <option value="assignment">{t('quizTypes.assignment')}</option>
                <option value="test">{t('quizTypes.test')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('fields.timeLimit')}</label>
              <input
                type="number"
                min={0}
                value={form.time_limit_minutes}
                onChange={(e) => setForm({ ...form, time_limit_minutes: e.target.value ? Number(e.target.value) : '' })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder={t('quizManagement.noTimeLimit')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('fields.passingScore')}</label>
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
              {t('quizManagement.selectQuestions')} ({form.question_ids.length} {t('quizManagement.selected')})
            </h3>
            <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
              <input
                type="text"
                placeholder={t('filters.searchQuestions')}
                value={questionFilter.search}
                onChange={(e) => setQuestionFilter({ ...questionFilter, search: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <select
                value={questionFilter.type}
                onChange={(e) => setQuestionFilter({ ...questionFilter, type: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">{t('filters.allTypes')}</option>
                <option value="mcq">{t('questionTypes.mcq')}</option>
                <option value="fill_blank">{t('questionTypes.fillBlank')}</option>
                <option value="short_answer">{t('questionTypes.shortAnswer')}</option>
                <option value="essay">{t('questionTypes.essay')}</option>
              </select>
              <select
                value={questionFilter.difficulty}
                onChange={(e) => setQuestionFilter({ ...questionFilter, difficulty: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">{t('filters.allLevels')}</option>
                <option value="easy">{t('difficulty.easy')}</option>
                <option value="medium">{t('difficulty.medium')}</option>
                <option value="hard">{t('difficulty.hard')}</option>
              </select>
              <select
                value={questionFilter.topic}
                onChange={(e) => setQuestionFilter({ ...questionFilter, topic: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">{t('filters.allTopics')}</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                ))}
              </select>
            </div>
            <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200">
              {questions.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">{t('questionBank.noQuestions')}</p>
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
              {saving ? t('common.saving') : editingId ? t('quizManagement.updateQuiz') : t('quizManagement.createQuiz')}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {quizzes.length === 0 ? (
        <p className="text-center text-gray-500">{t('quizManagement.noQuizzes')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t('quizManagement.quiz')}</th>
                <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t('quizManagement.type')}</th>
                <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t('quizManagement.questions')}</th>
                <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t('quizManagement.attempts')}</th>
                <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t('quizManagement.averageScore')}</th>
                <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t('fields.status')}</th>
                <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{quiz.title}</div>
                    <div className="text-xs text-gray-500">{quiz.subject_name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {quiz.quiz_type === 'practice' ? t('quizTypes.practice') : quiz.quiz_type === 'assignment' ? t('quizTypes.assignment') : t('quizTypes.test')}
                  </td>
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
                      {quiz.is_published ? t('fields.published') : t('fields.draft')}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-start">
                    <div className="flex justify-start gap-2">
                      <button
                        onClick={() => openEdit(quiz)}
                        className="text-sm text-primary-600 hover:text-primary-800"
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        onClick={() => deleteQuiz(quiz.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        {t('common.delete')}
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
