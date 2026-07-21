import React, { useEffect, useState, useMemo } from 'react';
import { lessonAPI, subjectAPI, schoolClassAPI } from '../../api';
import { SkeletonStatsGrid, SkeletonTable } from '../../components/Skeleton';
import StatCard from '../../components/StatCard';
import { useLanguage } from '../../context/LanguageContext';

interface LessonPlan {
  id: number;
  title: string;
  subject: number;
  subject_name: string;
  class_obj: number;
  class_name: string;
  date: string;
  start_time: string;
  end_time: string;
  objectives: string;
  resources: string;
  homework: string;
  notes: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 border border-gray-200',
  submitted: 'bg-blue-100 text-blue-700 border border-blue-200',
  approved: 'bg-green-100 text-green-700 border border-green-200',
  rejected: 'bg-red-100 text-red-700 border border-red-200',
};

const STATUS_OPTIONS = ['draft', 'submitted', 'approved', 'rejected'];

export default function LessonPlannerPage() {
  const { t, language } = useLanguage();

  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Create/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<LessonPlan | null>(null);
  const [form, setForm] = useState({
    title: '', subject: '', class_obj: '', date: '',
    start_time: '', end_time: '', objectives: '', resources: '', homework: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      lessonAPI.lessonPlans.list(),
      subjectAPI.list(),
      schoolClassAPI.list(),
    ])
      .then(([lpRes, subRes, clsRes]) => {
        setLessonPlans(lpRes.data.results ?? lpRes.data);
        setSubjects(subRes.data.results ?? subRes.data);
        setSchoolClasses(clsRes.data.results ?? clsRes.data);
      })
      .catch((err) => setError(err.response?.data?.detail || t('lessons.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const filteredPlans = useMemo(() => {
    let result = lessonPlans;
    if (subjectFilter) result = result.filter((lp) => lp.subject === Number(subjectFilter));
    if (statusFilter) result = result.filter((lp) => lp.status === statusFilter);
    if (dateFrom) result = result.filter((lp) => lp.date >= dateFrom);
    if (dateTo) result = result.filter((lp) => lp.date <= dateTo);
    return result;
  }, [lessonPlans, subjectFilter, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / pageSize));
  const pagedPlans = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPlans.slice(start, start + pageSize);
  }, [filteredPlans, page]);

  const stats = useMemo(() => {
    const total = lessonPlans.length;
    const drafts = lessonPlans.filter((lp) => lp.status === 'draft').length;
    const submitted = lessonPlans.filter((lp) => lp.status === 'submitted').length;
    const approved = lessonPlans.filter((lp) => lp.status === 'approved').length;
    return { total, drafts, submitted, approved };
  }, [lessonPlans]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSaving(true);
    try {
      const payload = {
        ...form,
        subject: Number(form.subject),
        class_obj: Number(form.class_obj),
      };
      if (editItem) {
        await lessonAPI.lessonPlans.update(editItem.id, payload);
      } else {
        await lessonAPI.lessonPlans.create(payload);
      }
      setShowModal(false);
      setEditItem(null);
      resetForm();
      showToast('success', editItem ? t('lessons.updated') : t('lessons.created'));
      loadData();
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const fields: Record<string, string> = {};
        for (const [key, val] of Object.entries(data)) {
          fields[key] = Array.isArray(val) ? val.join(', ') : String(val);
        }
        setFieldErrors(fields);
        const nonField = Object.keys(fields).filter(k => k === 'non_field_errors' || k === 'detail');
        if (nonField.length) setFormError(fields[nonField[0]]);
        else if (!Object.keys(fields).length) setFormError(t('common.saveFailed'));
      } else {
        setFormError(typeof data === 'string' ? data : t('common.saveFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async (id: number) => {
    try {
      await lessonAPI.lessonPlans.update(id, { status: 'submitted' });
      showToast('success', t('lessons.submitted'));
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || t('lessons.submitFailed'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await lessonAPI.lessonPlans.delete(id);
      showToast('success', t('lessons.deleted'));
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || t('common.deleteFailed'));
    }
  };

  const resetForm = () => {
    setForm({ title: '', subject: '', class_obj: '', date: '', start_time: '', end_time: '', objectives: '', resources: '', homework: '', notes: '' });
  };

  const openCreate = () => {
    setEditItem(null);
    resetForm();
    setFormError(null);
    setFieldErrors({});
    setShowModal(true);
  };

  const openEdit = (lp: LessonPlan) => {
    setEditItem(lp);
    setForm({
      title: lp.title, subject: String(lp.subject), class_obj: String(lp.class_obj),
      date: lp.date, start_time: lp.start_time || '', end_time: lp.end_time || '',
      objectives: lp.objectives || '', resources: lp.resources || '',
      homework: lp.homework || '', notes: lp.notes || '',
    });
    setFormError(null);
    setFieldErrors({});
    setShowModal(true);
  };

  const clearFilters = () => {
    setSubjectFilter('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const selectCls = 'w-full rounded-lg border border-[var(--color-border)] dark:border-gray-600 bg-[var(--color-bg-secondary)] dark:bg-gray-700 px-3 py-2.5 text-sm text-[var(--color-text-secondary)] dark:text-gray-300 transition-colors focus:border-primary-400 focus:bg-[var(--color-bg-primary)] dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-100';
  const inputCls = 'w-full rounded-lg border border-[var(--color-border)] dark:border-gray-600 bg-[var(--color-bg-secondary)] dark:bg-gray-700 px-3 py-2.5 text-sm text-[var(--color-text-secondary)] dark:text-gray-300 transition-colors focus:border-primary-400 focus:bg-[var(--color-bg-primary)] dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-100';

  return (
    <div className="page-enter space-y-6">
      {toast && (
        <div className={`fixed top-4 end-4 z-50 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium shadow-lg animate-slide-down ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-6 text-white shadow-lg shadow-emerald-500/20 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t('lessons.title')}</h1>
            <p className="mt-1 text-sm text-emerald-100">{t('lessons.subtitle')}</p>
          </div>
          <button onClick={openCreate}
            className="btn-press inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {t('lessons.newPlan')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title={t('lessons.total')} value={stats.total} color="bg-emerald-500" delay={0}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
        />
        <StatCard title={t('lessons.status.draft')} value={stats.drafts} color="bg-gray-500" delay={50}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
        />
        <StatCard title={t('lessons.status.submitted')} value={stats.submitted} color="bg-blue-500" delay={100}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard title={t('lessons.status.approved')} value={stats.approved} color="bg-green-500" delay={150}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-0 w-full sm:w-auto sm:min-w-[160px]">
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400">{t('fields.subject')}</label>
          <select value={subjectFilter} onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">{t('filters.allSubjects')}</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="w-full sm:w-auto sm:min-w-[140px]">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('fields.status')}</label>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">{t('lessons.allStatuses')}</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{t('lessons.status.' + s)}</option>)}
          </select>
        </div>
        <div className="w-full sm:w-auto sm:min-w-[140px]">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('lessons.fromDate')}</label>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className={inputCls} />
        </div>
        <div className="w-full sm:w-auto sm:min-w-[140px]">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('lessons.toDate')}</label>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className={inputCls} />
        </div>
        {(subjectFilter || statusFilter || dateFrom || dateTo) && (
          <button onClick={clearFilters}
            className="btn-press inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            {t('common.clearFilter')}
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-6">
          <SkeletonStatsGrid />
          <SkeletonTable rows={8} />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400">
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          {error}
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bg-secondary)] dark:bg-gray-700">
            <svg className="h-8 w-8 text-[var(--color-text-muted)] dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <p className="text-sm font-medium text-[var(--color-text-primary)] dark:text-gray-100">{t('lessons.noPlans')}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)] dark:text-gray-400">{t('lessons.startCreating')}</p>
        </div>
      ) : (
        <div className="card-hover rounded-xl border border-[var(--color-border-light)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 shadow-sm overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-light)] dark:border-gray-700 bg-[var(--color-bg-secondary)] dark:bg-gray-700/50 text-end text-xs font-medium uppercase text-[var(--color-text-muted)] dark:text-gray-400">
                  <th className="px-4 py-3">{t('fields.title')}</th>
                  <th className="px-4 py-3">{t('fields.subject')}</th>
                  <th className="px-4 py-3">{t('lessons.class')}</th>
                  <th className="px-4 py-3">{t('fields.date')}</th>
                  <th className="px-4 py-3">{t('fields.status')}</th>
                  <th className="px-4 py-3 text-center">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-light)] dark:divide-gray-700/50">
                {pagedPlans.map((lp) => (
                  <React.Fragment key={lp.id}>
                    <tr className="transition-colors hover:bg-[var(--color-bg-secondary)] dark:hover:bg-gray-700/30 cursor-pointer" onClick={() => setExpandedId(expandedId === lp.id ? null : lp.id)}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-[var(--color-text-primary)] dark:text-gray-100">{lp.title}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-muted)] dark:text-gray-400">{lp.subject_name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-muted)] dark:text-gray-400">{lp.class_name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-muted)] dark:text-gray-400 text-xs">{new Date(lp.date).toLocaleDateString()}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[lp.status] || ''}`}>
                          {t('lessons.status.' + lp.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openEdit(lp)}
                            className="btn-press inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            {t('common.edit')}
                          </button>
                          {lp.status === 'draft' && (
                            <button onClick={() => handleSubmitForApproval(lp.id)}
                              className="btn-press inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100">
                              {t('lessons.submitForApproval')}
                            </button>
                          )}
                          <button onClick={() => handleDelete(lp.id)}
                            className="btn-press inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === lp.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-5 bg-[var(--color-bg-secondary)] dark:bg-gray-700/30">
                          <div className="space-y-3 text-sm">
                            {lp.objectives && (
                              <div>
                                <p className="text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400 mb-1">{t('lessons.objectives')}</p>
                                <p className="text-[var(--color-text-secondary)] dark:text-gray-300 whitespace-pre-wrap">{lp.objectives}</p>
                              </div>
                            )}
                            {lp.resources && (
                              <div>
                                <p className="text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400 mb-1">{t('lessons.resources')}</p>
                                <p className="text-[var(--color-text-secondary)] dark:text-gray-300 whitespace-pre-wrap">{lp.resources}</p>
                              </div>
                            )}
                            {lp.homework && (
                              <div>
                                <p className="text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400 mb-1">{t('lessons.homework')}</p>
                                <p className="text-[var(--color-text-secondary)] dark:text-gray-300 whitespace-pre-wrap">{lp.homework}</p>
                              </div>
                            )}
                            {lp.notes && (
                              <div>
                                <p className="text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400 mb-1">{t('lessons.notes')}</p>
                                <p className="text-[var(--color-text-secondary)] dark:text-gray-300 whitespace-pre-wrap">{lp.notes}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] dark:text-gray-400">
                              {lp.start_time && <span>{t('lessons.from')}: {lp.start_time}</span>}
                              {lp.end_time && <span>{t('lessons.to')}: {lp.end_time}</span>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3 p-4">
            {pagedPlans.map((lp) => (
              <div key={lp.id} className="rounded-lg border border-[var(--color-border-light)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[var(--color-text-primary)] dark:text-gray-100 text-sm">{lp.title}</span>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[lp.status] || ''}`}>
                    {t('lessons.status.' + lp.status)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] dark:text-gray-400">{t('fields.subject')}</p>
                    <p className="font-medium text-[var(--color-text-primary)] dark:text-gray-100">{lp.subject_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] dark:text-gray-400">{t('lessons.class')}</p>
                    <p className="font-medium text-[var(--color-text-primary)] dark:text-gray-100">{lp.class_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] dark:text-gray-400">{t('fields.date')}</p>
                    <p className="font-medium text-[var(--color-text-primary)] dark:text-gray-100">{new Date(lp.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-[var(--color-border-light)] dark:border-gray-700/50 pt-3">
                  <button onClick={() => openEdit(lp)}
                    className="btn-press inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100">
                    {t('common.edit')}
                  </button>
                  {lp.status === 'draft' && (
                    <button onClick={() => handleSubmitForApproval(lp.id)}
                      className="btn-press inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100">
                      {t('lessons.submitForApproval')}
                    </button>
                  )}
                  <button onClick={() => setExpandedId(expandedId === lp.id ? null : lp.id)}
                    className="btn-press inline-flex items-center gap-1 rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100">
                    {expandedId === lp.id ? t('common.hide') : t('common.details')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[var(--color-border-light)] dark:border-gray-700/50 px-4 py-3">
              <p className="text-xs text-[var(--color-text-muted)] dark:text-gray-400">{filteredPlans.length} {t('lessons.total')}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-press inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] dark:text-gray-300 transition-colors hover:bg-[var(--color-bg-secondary)] dark:hover:bg-gray-700 disabled:opacity-40">
                  <svg className={`h-3.5 w-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  {t('common.previous')}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="inline-flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-xs text-[var(--color-text-muted)] dark:text-gray-400">...</span>}
                      <button onClick={() => setPage(p)}
                        className={`btn-press inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${page === p ? 'bg-primary-600 text-white shadow-sm' : 'text-[var(--color-text-secondary)] dark:text-gray-300 hover:bg-[var(--color-bg-secondary)] dark:hover:bg-gray-700'}`}>
                        {p}
                      </button>
                    </span>
                  ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="btn-press inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] dark:text-gray-300 transition-colors hover:bg-[var(--color-bg-secondary)] dark:hover:bg-gray-700 disabled:opacity-40">
                  {t('common.next')}
                  <svg className={`h-3.5 w-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-[var(--color-bg-primary)] dark:bg-gray-800 p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] dark:text-gray-100">{editItem ? t('lessons.editPlan') : t('lessons.newPlan')}</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-[var(--color-text-muted)] dark:text-gray-400 hover:bg-[var(--color-bg-secondary)] dark:hover:bg-gray-700 hover:text-[var(--color-text-secondary)] dark:hover:text-gray-300">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                {formError}
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400">{t('fields.title')}</label>
                <input required type="text" value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value }); setFieldErrors(fe => { const n = { ...fe }; delete n.title; return n; }); }}
                  className={`${inputCls} ${fieldErrors.title ? 'border-red-300 dark:border-red-700' : ''}`} placeholder={t('lessons.titlePlaceholder')} />
                {fieldErrors.title && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.title}</p>}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400">{t('fields.subject')}</label>
                  <select required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={selectCls}>
                    <option value="">{t('filters.chooseSubject')}</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400">{t('lessons.class')}</label>
                  <select required value={form.class_obj} onChange={(e) => setForm({ ...form, class_obj: e.target.value })} className={selectCls}>
                    <option value="">{t('filters.chooseClass')}</option>
                    {schoolClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400">{t('fields.date')}</label>
                  <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400">{t('lessons.startTime')}</label>
                  <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400">{t('lessons.endTime')}</label>
                  <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400">{t('lessons.objectives')}</label>
                <textarea value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} className={inputCls} rows={3}
                  placeholder={t('lessons.objectivesPlaceholder')} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400">{t('lessons.resources')}</label>
                <textarea value={form.resources} onChange={(e) => setForm({ ...form, resources: e.target.value })} className={inputCls} rows={2}
                  placeholder={t('lessons.resourcesPlaceholder')} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400">{t('lessons.homework')}</label>
                <textarea value={form.homework} onChange={(e) => setForm({ ...form, homework: e.target.value })} className={inputCls} rows={2}
                  placeholder={t('lessons.homeworkPlaceholder')} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400">{t('lessons.notes')}</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} rows={2} />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700 disabled:opacity-50">
                  {saving ? (
                    <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('common.saving')}</>
                  ) : (
                    <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{t('common.save')}</>
                  )}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-press rounded-lg border border-[var(--color-border)] dark:border-gray-600 bg-[var(--color-bg-secondary)] dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] dark:text-gray-300 transition-colors hover:bg-[var(--color-border)] dark:hover:bg-gray-600">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
