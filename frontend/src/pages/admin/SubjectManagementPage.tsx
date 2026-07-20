import { useEffect, useState } from 'react';
import { subjectAPI } from '../../api';
import type { Subject, Topic } from '../../types';
import ConfirmModal from '../../components/ConfirmModal';
import { useLanguage } from '../../context/LanguageContext';
import { Skeleton, SkeletonCard } from '../../components/Skeleton';

export default function SubjectManagementPage() {
  const { t } = useLanguage();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name_ar: '', name_en: '', code: '', description: '' });
  const [subjectSaving, setSubjectSaving] = useState(false);
  const [subjectError, setSubjectError] = useState<string | null>(null);

  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);
  const [topics, setTopics] = useState<Record<number, Topic[]>>({});
  const [topicsLoading, setTopicsLoading] = useState<number | null>(null);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  const [showTopicForm, setShowTopicForm] = useState(false);
  const [topicSubjectId, setTopicSubjectId] = useState<number | null>(null);
  const [topicForm, setTopicForm] = useState({ name: '', description: '', surah_number: '' });
  const [topicSaving, setTopicSaving] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);

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
    setSubjectError(null);
    try {
      if (editingSubjectId) {
        await subjectAPI.update(editingSubjectId, subjectForm);
      } else {
        await subjectAPI.create(subjectForm);
      }
      setShowSubjectForm(false);
      loadSubjects();
    } catch (err: any) {
      setSubjectError(Object.values(err.response?.data || {}).flat().join(', ') || t('userManagement.operationFailed'));
    } finally {
      setSubjectSaving(false);
    }
  };

  const openEditSubject = (subject: Subject) => {
    setSubjectForm({ name_ar: subject.name_ar, name_en: subject.name_en, code: subject.code, description: subject.description });
    setEditingSubjectId(subject.id);
    setShowSubjectForm(true);
  };

  const [confirmDeleteSubjectId, setConfirmDeleteSubjectId] = useState<number | null>(null);

  const handleDeleteSubject = async () => {
    if (confirmDeleteSubjectId === null) return;
    try {
      await subjectAPI.delete(confirmDeleteSubjectId);
      setConfirmDeleteSubjectId(null);
      loadSubjects();
    } catch {
      setError(t('subjectManagement.deleteFailed'));
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
      setTopicsError(null);
      try {
        const res = await subjectAPI.getTopics(subjectId);
        setTopics((prev) => ({ ...prev, [subjectId]: res.data.results ?? res.data }));
      } catch {
        setTopicsError(t('subjectManagement.topicsLoadFailed'));
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
    setTopicError(null);
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
      setTopicError(Object.values(err.response?.data || {}).flat().join(', ') || t('subjectManagement.topicCreateFailed'));
    } finally {
      setTopicSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[var(--color-text-primary)]">{t('subjectManagement.title')}</h1>
        <button onClick={() => { setSubjectForm({ name_ar: '', name_en: '', code: '', description: '' }); setEditingSubjectId(null); setShowSubjectForm(true); }} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          {t('subjectManagement.addSubject')}
        </button>
      </div>
      <p className="text-sm text-gray-500 dark:text-[var(--color-text-muted)] mb-6">{t('guides.subjectManagement')}</p>

      {showSubjectForm && (
        <div className="rounded-lg border border-gray-200 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-secondary)] p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-[var(--color-text-primary)]">{editingSubjectId ? t('common.edit') + ' ' + t('fields.subject') : t('common.create') + ' ' + t('fields.subject')}</h2>
          {subjectError && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
              {subjectError}
              <button onClick={() => setSubjectError(null)} className="me-2 underline">{t('common.dismiss')}</button>
            </div>
          )}
          <form onSubmit={handleSubjectSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.nameAr')}</label>
              <input required value={subjectForm.name_ar} onChange={(e) => setSubjectForm({ ...subjectForm, name_ar: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-gray-900 dark:text-[var(--color-text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.nameEn')}</label>
              <input required value={subjectForm.name_en} onChange={(e) => setSubjectForm({ ...subjectForm, name_en: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-gray-900 dark:text-[var(--color-text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.code')}</label>
              <input value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-gray-900 dark:text-[var(--color-text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.description')}</label>
              <textarea value={subjectForm.description} onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-300 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-gray-900 dark:text-[var(--color-text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div className="sm:col-span-2 flex items-end gap-3">
              <button type="submit" disabled={subjectSaving} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {subjectSaving ? t('common.saving') : editingSubjectId ? t('common.update') : t('common.create')}
              </button>
              <button type="button" onClick={() => setShowSubjectForm(false)} className="rounded-lg border border-gray-300 dark:border-[var(--color-border)] px-4 py-2 text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)] hover:bg-gray-50 dark:hover:bg-gray-700/30">{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {showTopicForm && topicSubjectId && (
        <div className="rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-6">
          <h3 className="mb-3 text-md font-semibold text-gray-900 dark:text-[var(--color-text-primary)]">{t('subjectManagement.addTopic')} - {subjects.find((s) => s.id === topicSubjectId)?.name_ar}</h3>
          {topicError && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
              {topicError}
              <button onClick={() => setTopicError(null)} className="me-2 underline">{t('common.dismiss')}</button>
            </div>
          )}
          <form onSubmit={handleTopicSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.name')}</label>
              <input required value={topicForm.name} onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-gray-900 dark:text-[var(--color-text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.description')}</label>
              <input value={topicForm.description} onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-gray-900 dark:text-[var(--color-text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.surahNumber')}</label>
              <input type="number" value={topicForm.surah_number} onChange={(e) => setTopicForm({ ...topicForm, surah_number: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-gray-900 dark:text-[var(--color-text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div className="sm:col-span-3 flex gap-3">
              <button type="submit" disabled={topicSaving} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {topicSaving ? t('common.saving') : t('subjectManagement.addTopic')}
              </button>
              <button type="button" onClick={() => setShowTopicForm(false)} className="rounded-lg border border-gray-300 dark:border-[var(--color-border)] px-4 py-2 text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)] hover:bg-gray-50 dark:hover:bg-gray-700/30">{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      ) : (
        <div className="space-y-3">
          {subjects.map((subject) => (
            <div key={subject.id} className="rounded-lg border border-gray-200 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-secondary)] shadow-sm">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleTopics(subject.id)} className="text-gray-400 dark:text-[var(--color-text-muted)] hover:text-gray-600 dark:hover:text-gray-300">
                    <svg className={`h-5 w-5 transition-transform ${expandedSubject === subject.id ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{subject.name_ar}</h3>
                    <p className="text-sm text-gray-500 dark:text-[var(--color-text-muted)]">{subject.name_en} &middot; {subject.topic_count ?? 0} {t('subjectManagement.topicsCount')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditSubject(subject)} className="text-sm font-medium text-primary-600 hover:underline">{t('common.edit')}</button>
                  <button onClick={() => openCreateTopic(subject.id)} className="text-sm font-medium text-blue-600 hover:underline">{t('subjectManagement.newTopic')}</button>
                  <button onClick={() => setConfirmDeleteSubjectId(subject.id)} className="text-sm font-medium text-red-600 hover:underline">{t('common.delete')}</button>
                </div>
              </div>
              {expandedSubject === subject.id && (
                <div className="border-t border-gray-100 dark:border-[var(--color-border-light)] px-6 py-4">
                  {topicsLoading === subject.id ? (
                    <div className="space-y-2 py-4"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
                  ) : topicsError ? (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{topicsError}</div>
                  ) : topics[subject.id]?.length ? (
                    <ul className="space-y-2">
                      {topics[subject.id].map((topic) => (
                        <li key={topic.id} className="flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-[var(--color-bg-primary)] px-4 py-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{topic.name}</span>
                          {topic.surah_number && <span className="text-xs text-gray-500 dark:text-[var(--color-text-muted)]">{t('subjectManagement.surah')} {topic.surah_number}</span>}
                          {topic.description && <span className="text-xs text-gray-400 dark:text-[var(--color-text-muted)] me-auto">{topic.description}</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-4 text-center text-sm text-gray-500 dark:text-[var(--color-text-muted)]">{t('subjectManagement.noTopics')}</p>
                  )}
                </div>
              )}
            </div>
          ))}
          {!subjects.length && <p className="py-8 text-center text-gray-500 dark:text-[var(--color-text-muted)]">{t('subjectManagement.noSubjects')}</p>}
        </div>
      )}
      {confirmDeleteSubjectId !== null && (
        <ConfirmModal
          title={t('common.delete')}
          message={t('subjectManagement.deleteSubjectConfirm')}
          onConfirm={handleDeleteSubject}
          onCancel={() => setConfirmDeleteSubjectId(null)}
          variant="danger"
        />
      )}
    </div>
  );
}
