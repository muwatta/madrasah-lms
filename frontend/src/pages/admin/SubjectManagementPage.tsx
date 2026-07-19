import { useEffect, useState } from 'react';
import { subjectAPI } from '../../api';
import type { Subject, Topic } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

export default function SubjectManagementPage() {
  const { t } = useLanguage();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name_ar: '', name_en: '', code: '', description: '' });
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
      .catch((err) => setError(err.response?.data?.detail || t('subjectManagement.deleteFailed')))
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
      alert(Object.values(err.response?.data || {}).flat().join(', ') || t('userManagement.operationFailed'));
    } finally {
      setSubjectSaving(false);
    }
  };

  const openEditSubject = (subject: Subject) => {
    setSubjectForm({ name_ar: subject.name_ar, name_en: subject.name_en, code: subject.code, description: subject.description });
    setEditingSubjectId(subject.id);
    setShowSubjectForm(true);
  };

  const handleDeleteSubject = async (id: number) => {
    if (!confirm(t('subjectManagement.deleteSubjectConfirm'))) return;
    try {
      await subjectAPI.delete(id);
      loadSubjects();
    } catch {
      alert(t('subjectManagement.deleteFailed'));
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
        alert(t('subjectManagement.topicsLoadFailed'));
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
      alert(Object.values(err.response?.data || {}).flat().join(', ') || t('subjectManagement.topicCreateFailed'));
    } finally {
      setTopicSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('subjectManagement.title')}</h1>
        <button onClick={() => { setSubjectForm({ name_ar: '', name_en: '', code: '', description: '' }); setEditingSubjectId(null); setShowSubjectForm(true); }} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          {t('subjectManagement.addSubject')}
        </button>
      </div>

      {showSubjectForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{editingSubjectId ? t('common.edit') + ' ' + t('fields.subject') : t('common.create') + ' ' + t('fields.subject')}</h2>
          <form onSubmit={handleSubjectSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.nameAr')}</label>
              <input required value={subjectForm.name_ar} onChange={(e) => setSubjectForm({ ...subjectForm, name_ar: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.nameEn')}</label>
              <input required value={subjectForm.name_en} onChange={(e) => setSubjectForm({ ...subjectForm, name_en: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.code')}</label>
              <input value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.description')}</label>
              <textarea value={subjectForm.description} onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div className="sm:col-span-2 flex items-end gap-3">
              <button type="submit" disabled={subjectSaving} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {subjectSaving ? t('common.saving') : editingSubjectId ? t('common.update') : t('common.create')}
              </button>
              <button type="button" onClick={() => setShowSubjectForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {showTopicForm && topicSubjectId && (
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-6">
          <h3 className="mb-3 text-md font-semibold text-gray-900">{t('subjectManagement.addTopic')} - {subjects.find((s) => s.id === topicSubjectId)?.name_ar}</h3>
          <form onSubmit={handleTopicSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.name')}</label>
              <input required value={topicForm.name} onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.description')}</label>
              <input value={topicForm.description} onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.surahNumber')}</label>
              <input type="number" value={topicForm.surah_number} onChange={(e) => setTopicForm({ ...topicForm, surah_number: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div className="sm:col-span-3 flex gap-3">
              <button type="submit" disabled={topicSaving} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {topicSaving ? t('common.saving') : t('subjectManagement.addTopic')}
              </button>
              <button type="button" onClick={() => setShowTopicForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
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
                    <h3 className="font-medium text-gray-900">{subject.name_ar}</h3>
                    <p className="text-sm text-gray-500">{subject.name_en} &middot; {subject.topic_count ?? 0} {t('subjectManagement.topicsCount')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditSubject(subject)} className="text-sm font-medium text-primary-600 hover:underline">{t('common.edit')}</button>
                  <button onClick={() => openCreateTopic(subject.id)} className="text-sm font-medium text-blue-600 hover:underline">{t('subjectManagement.newTopic')}</button>
                  <button onClick={() => handleDeleteSubject(subject.id)} className="text-sm font-medium text-red-600 hover:underline">{t('common.delete')}</button>
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
                          {topic.surah_number && <span className="text-xs text-gray-500">{t('subjectManagement.surah')} {topic.surah_number}</span>}
                          {topic.description && <span className="text-xs text-gray-400 mr-auto">{topic.description}</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-4 text-center text-sm text-gray-500">{t('subjectManagement.noTopics')}</p>
                  )}
                </div>
              )}
            </div>
          ))}
          {!subjects.length && <p className="py-8 text-center text-gray-500">{t('subjectManagement.noSubjects')}</p>}
        </div>
      )}
    </div>
  );
}
