import React, { useEffect, useState, useMemo } from 'react';
import { lessonAPI, subjectAPI, schoolClassAPI } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatCard from '../../components/StatCard';
import { useLanguage } from '../../context/LanguageContext';

interface Homework {
  id: number;
  title: string;
  description: string;
  subject: number;
  subject_name: string;
  class_obj: number;
  class_name: string;
  due_date: string;
  total_marks: number;
  attachments: string[];
  submissions_count: number;
  status: 'active' | 'overdue' | 'closed';
  created_at: string;
}

interface Submission {
  id: number;
  student: number;
  student_name: string;
  submitted_at: string;
  file: string;
  answer_text: string;
  score: string | null;
  feedback: string;
  is_graded: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700 border border-green-200',
  overdue: 'bg-red-100 text-red-700 border border-red-200',
  closed: 'bg-gray-100 text-gray-700 border border-gray-200',
};

export default function HomeworkPage() {
  const { t, language } = useLanguage();

  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', description: '', subject: '', class_obj: '',
    due_date: '', total_marks: '100',
  });
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});

  // Submissions view
  const [viewingHomework, setViewingHomework] = useState<Homework | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Grade modal
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });
  const [gradeSaving, setGradeSaving] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      lessonAPI.homework.list(),
      subjectAPI.list(),
      schoolClassAPI.list(),
    ])
      .then(([hwRes, subRes, clsRes]) => {
        setHomeworks(hwRes.data.results ?? hwRes.data);
        setSubjects(subRes.data.results ?? subRes.data);
        setSchoolClasses(clsRes.data.results ?? clsRes.data);
      })
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load homework'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const filteredHomeworks = useMemo(() => {
    let result = homeworks;
    if (subjectFilter) result = result.filter((hw) => hw.subject === Number(subjectFilter));
    if (classFilter) result = result.filter((hw) => hw.class_obj === Number(classFilter));
    if (statusFilter) result = result.filter((hw) => hw.status === statusFilter);
    return result;
  }, [homeworks, subjectFilter, classFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredHomeworks.length / pageSize));
  const pagedHomeworks = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredHomeworks.slice(start, start + pageSize);
  }, [filteredHomeworks, page]);

  const stats = useMemo(() => {
    const total = homeworks.length;
    const active = homeworks.filter((hw) => hw.status === 'active').length;
    const overdue = homeworks.filter((hw) => hw.status === 'overdue').length;
    const totalSubs = homeworks.reduce((sum, hw) => sum + (hw.submissions_count || 0), 0);
    return { total, active, overdue, totalSubs };
  }, [homeworks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateFieldErrors({});
    setCreateSaving(true);
    try {
      const payload: any = {
        ...createForm,
        subject: Number(createForm.subject),
        class_obj: Number(createForm.class_obj),
        total_marks: Number(createForm.total_marks),
      };
      let data: any = payload;
      if (createFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => fd.append(k, String(v)));
        fd.append('file', createFile);
        data = fd;
      }
      await lessonAPI.homework.create(data);
      setShowCreateModal(false);
      setCreateFile(null);
      setCreateForm({ title: '', description: '', subject: '', class_obj: '', due_date: '', total_marks: '100' });
      showToast('success', 'Homework created');
      loadData();
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const fields: Record<string, string> = {};
        for (const [key, val] of Object.entries(data)) {
          fields[key] = Array.isArray(val) ? val.join(', ') : String(val);
        }
        setCreateFieldErrors(fields);
        const nonField = Object.keys(fields).filter(k => k === 'non_field_errors' || k === 'detail');
        if (nonField.length) setCreateError(fields[nonField[0]]);
        else if (!Object.keys(fields).length) setCreateError('Failed to create homework');
      } else {
        setCreateError(typeof data === 'string' ? data : 'Failed to create homework');
      }
    } finally {
      setCreateSaving(false);
    }
  };

  const handleViewSubmissions = async (hw: Homework) => {
    setViewingHomework(hw);
    setSubmissionsLoading(true);
    try {
      const res = await lessonAPI.homework.submissions(hw.id);
      setSubmissions(res.data.results ?? res.data);
    } catch {
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    setGradeSaving(true);
    try {
      await lessonAPI.homework.grade(gradingSubmission.id, {
        score: Number(gradeForm.score),
        feedback: gradeForm.feedback,
      });
      setShowGradeModal(false);
      setGradingSubmission(null);
      setGradeForm({ score: '', feedback: '' });
      showToast('success', 'Graded successfully');
      if (viewingHomework) handleViewSubmissions(viewingHomework);
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to grade');
    } finally {
      setGradeSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await lessonAPI.homework.delete(id);
      showToast('success', 'Homework deleted');
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to delete');
    }
  };

  const clearFilters = () => {
    setSubjectFilter('');
    setClassFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const selectCls = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100';
  const inputCls = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100';

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
      <div className="rounded-2xl bg-gradient-to-br from-amber-600 via-amber-500 to-orange-500 p-6 text-white shadow-lg shadow-amber-500/20 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t('homework.title') || (language === 'ar' ? 'الواجبات' : 'Homework Management')}</h1>
            <p className="mt-1 text-sm text-amber-100">{t('homework.subtitle') || (language === 'ar' ? 'إنشاء وتقييم الواجبات' : 'Create and grade homework assignments')}</p>
          </div>
          <button onClick={() => { setCreateForm({ title: '', description: '', subject: '', class_obj: '', due_date: '', total_marks: '100' }); setCreateFile(null); setCreateError(null); setCreateFieldErrors({}); setShowCreateModal(true); }}
            className="btn-press inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-amber-700 shadow-sm transition-colors hover:bg-amber-50">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {language === 'ar' ? 'واجب جديد' : 'New Homework'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title={language === 'ar' ? 'إجمالي' : 'Total'} value={stats.total} color="bg-amber-500" delay={0}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard title={language === 'ar' ? 'نشط' : 'Active'} value={stats.active} color="bg-green-500" delay={50}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard title={language === 'ar' ? 'متأخر' : 'Overdue'} value={stats.overdue} color="bg-red-500" delay={100}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard title={language === 'ar' ? 'التسليمات' : 'Submissions'} value={stats.totalSubs} color="bg-blue-500" delay={150}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-0 w-full sm:w-auto sm:min-w-[160px]">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'المادة' : 'Subject'}</label>
          <select value={subjectFilter} onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">{language === 'ar' ? 'جميع المواد' : 'All Subjects'}</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="w-full sm:w-auto sm:min-w-[160px]">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الفصل' : 'Class'}</label>
          <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">{language === 'ar' ? 'جميع الفصول' : 'All Classes'}</option>
            {schoolClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="w-full sm:w-auto sm:min-w-[140px]">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الحالة' : 'Status'}</label>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
            <option value="overdue">{language === 'ar' ? 'متأخر' : 'Overdue'}</option>
            <option value="closed">{language === 'ar' ? 'مغلق' : 'Closed'}</option>
          </select>
        </div>
        {(subjectFilter || classFilter || statusFilter) && (
          <button onClick={clearFilters}
            className="btn-press inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            {language === 'ar' ? 'مسح' : 'Clear'}
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-48 items-center justify-center"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          {error}
        </div>
      ) : filteredHomeworks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <p className="text-sm font-medium text-gray-900">{language === 'ar' ? 'لا توجد واجبات' : 'No homework assignments yet'}</p>
          <p className="mt-1 text-xs text-gray-400">{language === 'ar' ? 'ابدأ بإنشاء واجب' : 'Start by creating homework'}</p>
        </div>
      ) : (
        <div className="card-hover rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-end text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">{language === 'ar' ? 'العنوان' : 'Title'}</th>
                  <th className="px-4 py-3">{language === 'ar' ? 'المادة' : 'Subject'}</th>
                  <th className="px-4 py-3">{language === 'ar' ? 'الفصل' : 'Class'}</th>
                  <th className="px-4 py-3">{language === 'ar' ? 'تاريخ التسليم' : 'Due Date'}</th>
                  <th className="px-4 py-3">{language === 'ar' ? 'التسليمات' : 'Submissions'}</th>
                  <th className="px-4 py-3">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3 text-center">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagedHomeworks.map((hw) => (
                  <tr key={hw.id} className="transition-colors hover:bg-gray-50/60">
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="font-medium text-gray-900">{hw.title}</span>
                      {hw.total_marks && <p className="text-xs text-gray-400 mt-0.5">{hw.total_marks} {language === 'ar' ? 'درجة' : 'marks'}</p>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">{hw.subject_name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">{hw.class_name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500 text-xs">{new Date(hw.due_date).toLocaleDateString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-semibold text-blue-700">
                        {hw.submissions_count || 0}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[hw.status] || ''}`}>
                        {hw.status.charAt(0).toUpperCase() + hw.status.slice(1)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleViewSubmissions(hw)}
                          className="btn-press inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                          {language === 'ar' ? 'تسليمات' : 'Submissions'}
                        </button>
                        <button onClick={() => handleDelete(hw.id)}
                          className="btn-press inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3 p-4">
            {pagedHomeworks.map((hw) => (
              <div key={hw.id} className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{hw.title}</span>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[hw.status] || ''}`}>
                    {hw.status.charAt(0).toUpperCase() + hw.status.slice(1)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">{language === 'ar' ? 'المادة' : 'Subject'}</p>
                    <p className="font-medium text-gray-900">{hw.subject_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{language === 'ar' ? 'الفصل' : 'Class'}</p>
                    <p className="font-medium text-gray-900">{hw.class_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{language === 'ar' ? 'التسليمات' : 'Submissions'}</p>
                    <p className="font-medium text-gray-900">{hw.submissions_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{language === 'ar' ? 'تاريخ التسليم' : 'Due'}</p>
                    <p className="font-medium text-gray-900 text-xs">{new Date(hw.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-gray-50 pt-3">
                  <button onClick={() => handleViewSubmissions(hw)}
                    className="btn-press inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100">
                    {language === 'ar' ? 'تسليمات' : 'Submissions'}
                  </button>
                  <button onClick={() => handleDelete(hw.id)}
                    className="btn-press inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100">
                    {language === 'ar' ? 'حذف' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-500">{filteredHomeworks.length} {language === 'ar' ? 'إجمالي' : 'total'}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-press inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40">
                  <svg className={`h-3.5 w-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  {language === 'ar' ? 'السابق' : 'Prev'}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="inline-flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-xs text-gray-400">...</span>}
                      <button onClick={() => setPage(p)}
                        className={`btn-press inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${page === p ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                        {p}
                      </button>
                    </span>
                  ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="btn-press inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40">
                  {language === 'ar' ? 'التالي' : 'Next'}
                  <svg className={`h-3.5 w-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{language === 'ar' ? 'واجب جديد' : 'New Homework'}</h3>
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {createError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                {createError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'العنوان' : 'Title'}</label>
                <input required type="text" value={createForm.title} onChange={(e) => { setCreateForm({ ...createForm, title: e.target.value }); setCreateFieldErrors(fe => { const n = { ...fe }; delete n.title; return n; }); }}
                  className={`${inputCls} ${createFieldErrors.title ? 'border-red-300' : ''}`} />
                {createFieldErrors.title && <p className="mt-1 text-xs text-red-500">{createFieldErrors.title}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الوصف' : 'Description'}</label>
                <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} className={inputCls} rows={3} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'المادة' : 'Subject'}</label>
                  <select required value={createForm.subject} onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })} className={selectCls}>
                    <option value="">{language === 'ar' ? 'اختر مادة' : 'Select subject'}</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الفصل' : 'Class'}</label>
                  <select required value={createForm.class_obj} onChange={(e) => setCreateForm({ ...createForm, class_obj: e.target.value })} className={selectCls}>
                    <option value="">{language === 'ar' ? 'اختر فصل' : 'Select class'}</option>
                    {schoolClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'تاريخ التسليم' : 'Due Date'}</label>
                  <input required type="date" value={createForm.due_date} onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'إجمالي الدرجات' : 'Total Marks'}</label>
                  <input required type="number" min="1" value={createForm.total_marks} onChange={(e) => setCreateForm({ ...createForm, total_marks: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'ملف مرفق (اختياري)' : 'Attachment (optional)'}</label>
                <input type="file" onChange={(e) => setCreateFile(e.target.files?.[0] || null)} className={`${inputCls} file:me-2 file:rounded file:border-0 file:bg-primary-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-700 hover:file:bg-primary-100`} />
                {createFile && <p className="mt-1 text-xs text-gray-400">{createFile.name}</p>}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={createSaving} className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700 disabled:opacity-50">
                  {createSaving ? (
                    <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('common.creating')}</>
                  ) : (
                    <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{t('common.create')}</>
                  )}
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-press rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions View Modal */}
      {viewingHomework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { setViewingHomework(null); setSubmissions([]); }}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{viewingHomework.title} - {language === 'ar' ? 'التسليمات' : 'Submissions'}</h3>
              <button onClick={() => { setViewingHomework(null); setSubmissions([]); }} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mb-3 rounded-lg bg-gray-50 p-3 text-sm">
              <p className="text-gray-600">{language === 'ar' ? 'المادة' : 'Subject'}: <span className="font-medium text-gray-900">{viewingHomework.subject_name}</span></p>
              <p className="text-gray-600">{language === 'ar' ? 'الفصل' : 'Class'}: <span className="font-medium text-gray-900">{viewingHomework.class_name}</span></p>
              <p className="text-gray-600">{language === 'ar' ? 'تاريخ التسليم' : 'Due'}: <span className="font-medium text-gray-900">{new Date(viewingHomework.due_date).toLocaleDateString()}</span></p>
              <p className="text-gray-600">{language === 'ar' ? 'إجمالي الدرجات' : 'Total Marks'}: <span className="font-medium text-gray-900">{viewingHomework.total_marks}</span></p>
            </div>
            {submissionsLoading ? (
              <div className="flex h-32 items-center justify-center"><LoadingSpinner size="md" /></div>
            ) : submissions.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">{language === 'ar' ? 'لا توجد تسليمات بعد' : 'No submissions yet'}</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-end text-xs font-medium uppercase text-gray-500">
                    <th className="pb-2 ps-4">{language === 'ar' ? 'الطالب' : 'Student'}</th>
                    <th className="pb-2 ps-4">{language === 'ar' ? 'التاريخ' : 'Submitted'}</th>
                    <th className="pb-2 ps-4">{language === 'ar' ? 'ملف' : 'File'}</th>
                    <th className="pb-2 ps-4">{language === 'ar' ? 'الدرجة' : 'Score'}</th>
                    <th className="pb-2 ps-4 text-center">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="transition-colors hover:bg-gray-50/60">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{sub.student_name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500 text-xs">{new Date(sub.submitted_at).toLocaleString()}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {sub.file ? (
                          <a href={sub.file} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            {language === 'ar' ? 'عرض' : 'View'}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {sub.is_graded ? (
                          <span className="font-semibold text-green-600">{sub.score}/{viewingHomework.total_marks}</span>
                        ) : (
                          <span className="text-xs text-gray-400">{language === 'ar' ? 'لم يُقيَّم' : 'Not graded'}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setGradingSubmission(sub);
                              setGradeForm({ score: sub.score || '', feedback: sub.feedback || '' });
                              setShowGradeModal(true);
                            }}
                            className="btn-press inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            {sub.is_graded ? (language === 'ar' ? 'تعديل' : 'Edit') : (language === 'ar' ? 'تقييم' : 'Grade')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {showGradeModal && gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowGradeModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{language === 'ar' ? 'تقييم' : 'Grade'} - {gradingSubmission.student_name}</h3>
              <button onClick={() => setShowGradeModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {gradingSubmission.answer_text && (
              <div className="mb-4 rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'إجابة الطالب' : 'Student Answer'}</p>
                <p className="text-sm text-gray-700">{gradingSubmission.answer_text}</p>
              </div>
            )}
            {gradingSubmission.file && (
              <div className="mb-4 rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'الملف المرفق' : 'Attached File'}</p>
                <a href={gradingSubmission.file} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline">{language === 'ar' ? 'عرض الملف' : 'View File'}</a>
              </div>
            )}
            <form onSubmit={handleGrade} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الدرجة' : 'Score'} (/{viewingHomework?.total_marks})</label>
                <input required type="number" min="0" max={viewingHomework?.total_marks} value={gradeForm.score} onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'ملاحظات' : 'Feedback'}</label>
                <textarea value={gradeForm.feedback} onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })} className={inputCls} rows={4} placeholder={language === 'ar' ? 'أضف ملاحظات...' : 'Add feedback...'} />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={gradeSaving} className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700 disabled:opacity-50">
                  {gradeSaving ? (
                    <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('common.saving')}</>
                  ) : (
                    <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{language === 'ar' ? 'حفظ التقييم' : 'Save Grade'}</>
                  )}
                </button>
                <button type="button" onClick={() => setShowGradeModal(false)} className="btn-press rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
