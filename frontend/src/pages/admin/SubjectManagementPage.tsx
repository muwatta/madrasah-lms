import { useEffect, useState } from 'react';
import { subjectAPI } from '../../api';
import type { Subject, Topic } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function SubjectManagementPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: '', description: '', level: 'beginner' as Subject['level'] });
  const [subjectSaving, setSubjectSaving] = useState(false);

  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);
  const [topics, setTopics] = useState<Record<number, Topic[]>>({});
  const [topicsLoading, setTopicsLoading] = useState<number | null>(null);

  const [showTopicForm, setShowTopicForm] = useState(false);
  const [topicSubjectId, setTopicSubjectId] = useState<number | null>(null);
  const [topicForm, setTopicForm] = useState({ name: '', description: '', surah_number: '' });
  const [topicSaving, setTopicSaving] = useState(false);

  const loadSubjects = () => {
    setLoading(true);
    subjectAPI.list()
      .then((res) => setSubjects(res.data.results ?? res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load subjects'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSubjects(); }, []);

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubjectSaving(true);
    try {
      if (editingSubjectId) {
        await subjectAPI.update(editingSubjectId, subjectForm);
      } else {
        await subjectAPI.create(subjectForm);
      }
      setShowSubjectForm(false);
      loadSubjects();
    } catch (err: any) {
      alert(Object.values(err.response?.data || {}).flat().join(', ') || 'Operation failed');
    } finally {
      setSubjectSaving(false);
    }
  };

  const openEditSubject = (subject: Subject) => {
    setSubjectForm({ name: subject.name, description: subject.description, level: subject.level });
    setEditingSubjectId(subject.id);
    setShowSubjectForm(true);
  };

  const handleDeleteSubject = async (id: number) => {
    if (!confirm('Delete this subject and all its topics?')) return;
    try {
      await subjectAPI.delete(id);
      loadSubjects();
    } catch {
      alert('Failed to delete subject');
    }
  };

  const toggleTopics = async (subjectId: number) => {
    if (expandedSubject === subjectId) {
      setExpandedSubject(null);
      return;
    }
    setExpandedSubject(subjectId);
    if (!topics[subjectId]) {
      setTopicsLoading(subjectId);
      try {
        const res = await subjectAPI.getTopics(subjectId);
        setTopics((prev) => ({ ...prev, [subjectId]: res.data.results ?? res.data }));
      } catch {
        alert('Failed to load topics');
      } finally {
        setTopicsLoading(null);
      }
    }
  };

  const openCreateTopic = (subjectId: number) => {
    setTopicSubjectId(subjectId);
    setTopicForm({ name: '', description: '', surah_number: '' });
    setShowTopicForm(true);
  };

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicSubjectId) return;
    setTopicSaving(true);
    try {
      const payload = {
        ...topicForm,
        surah_number: topicForm.surah_number ? Number(topicForm.surah_number) : null,
      };
      await subjectAPI.createTopic(topicSubjectId, payload);
      setShowTopicForm(false);
      const res = await subjectAPI.getTopics(topicSubjectId);
      setTopics((prev) => ({ ...prev, [topicSubjectId]: res.data.results ?? res.data }));
      loadSubjects();
    } catch (err: any) {
      alert(Object.values(err.response?.data || {}).flat().join(', ') || 'Failed to create topic');
    } finally {
      setTopicSaving(false);
    }
  };

  const levelBadge = (level: string) => {
    const colors: Record<string, string> = { beginner: 'bg-green-100 text-green-700', intermediate: 'bg-yellow-100 text-yellow-700', advanced: 'bg-red-100 text-red-700' };
    return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[level] || ''}`}>{level}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Subject Management</h1>
        <button onClick={() => { setSubjectForm({ name: '', description: '', level: 'beginner' }); setEditingSubjectId(null); setShowSubjectForm(true); }} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          Add Subject
        </button>
      </div>

      {showSubjectForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{editingSubjectId ? 'Edit Subject' : 'Create Subject'}</h2>
          <form onSubmit={handleSubjectSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input required value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea value={subjectForm.description} onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Level</label>
              <select value={subjectForm.level} onChange={(e) => setSubjectForm({ ...subjectForm, level: e.target.value as Subject['level'] })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="flex items-end gap-3">
              <button type="submit" disabled={subjectSaving} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {subjectSaving ? 'Saving...' : editingSubjectId ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowSubjectForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showTopicForm && topicSubjectId && (
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-6">
          <h3 className="mb-3 text-md font-semibold text-gray-900">Add Topic to {subjects.find((s) => s.id === topicSubjectId)?.name}</h3>
          <form onSubmit={handleTopicSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input required value={topicForm.name} onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <input value={topicForm.description} onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Surah Number</label>
              <input type="number" value={topicForm.surah_number} onChange={(e) => setTopicForm({ ...topicForm, surah_number: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div className="sm:col-span-3 flex gap-3">
              <button type="submit" disabled={topicSaving} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {topicSaving ? 'Saving...' : 'Add Topic'}
              </button>
              <button type="button" onClick={() => setShowTopicForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center"><LoadingSpinner /></div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      ) : (
        <div className="space-y-3">
          {subjects.map((subject) => (
            <div key={subject.id} className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleTopics(subject.id)} className="text-gray-400 hover:text-gray-600">
                    <svg className={`h-5 w-5 transition-transform ${expandedSubject === subject.id ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                  <div>
                    <h3 className="font-medium text-gray-900">{subject.name}</h3>
                    <p className="text-sm text-gray-500">{subject.topic_count ?? 0} topics</p>
                  </div>
                  {levelBadge(subject.level)}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditSubject(subject)} className="text-sm font-medium text-primary-600 hover:underline">Edit</button>
                  <button onClick={() => openCreateTopic(subject.id)} className="text-sm font-medium text-blue-600 hover:underline">+ Topic</button>
                  <button onClick={() => handleDeleteSubject(subject.id)} className="text-sm font-medium text-red-600 hover:underline">Delete</button>
                </div>
              </div>
              {expandedSubject === subject.id && (
                <div className="border-t border-gray-100 px-6 py-4">
                  {topicsLoading === subject.id ? (
                    <div className="flex justify-center py-4"><LoadingSpinner size="sm" /></div>
                  ) : topics[subject.id]?.length ? (
                    <ul className="space-y-2">
                      {topics[subject.id].map((topic) => (
                        <li key={topic.id} className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-2">
                          <span className="text-sm font-medium text-gray-900">{topic.name}</span>
                          {topic.surah_number && <span className="text-xs text-gray-500">Surah {topic.surah_number}</span>}
                          {topic.description && <span className="text-xs text-gray-400 ml-auto">{topic.description}</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-4 text-center text-sm text-gray-500">No topics yet. Click "+ Topic" to add one.</p>
                  )}
                </div>
              )}
            </div>
          ))}
          {!subjects.length && <p className="py-8 text-center text-gray-500">No subjects found.</p>}
        </div>
      )}
    </div>
  );
}
