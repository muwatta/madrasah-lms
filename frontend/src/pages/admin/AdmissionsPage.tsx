import React, { useEffect, useState, useMemo } from 'react';
import { admissionsAPI, schoolClassAPI } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatCard from '../../components/StatCard';
import { useLanguage } from '../../context/LanguageContext';

interface Application {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  previous_school: string;
  class_applied: number;
  class_applied_name: string;
  status: 'pending' | 'reviewed' | 'interviewed' | 'accepted' | 'rejected' | 'enrolled';
  rejection_reason: string;
  interview_date: string;
  entrance_score: string;
  documents: Document[];
  notes: string;
  created_at: string;
}

interface Document {
  id: number;
  name: string;
  file: string;
  uploaded_at: string;
}

const STATUS_OPTIONS = ['pending', 'reviewed', 'interviewed', 'accepted', 'rejected', 'enrolled'];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-700 border border-blue-200',
  reviewed: 'bg-amber-100 text-amber-700 border border-amber-200',
  interviewed: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  accepted: 'bg-green-100 text-green-700 border border-green-200',
  rejected: 'bg-red-100 text-red-700 border border-red-200',
  enrolled: 'bg-purple-100 text-purple-700 border border-purple-200',
};

export default function AdmissionsPage() {
  const { t, language } = useLanguage();

  const [applications, setApplications] = useState<Application[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    date_of_birth: '', gender: 'male', address: '', previous_school: '',
    class_applied: '', notes: '',
  });
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectAppId, setRejectAppId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSaving, setRejectSaving] = useState(false);

  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      admissionsAPI.list(),
      schoolClassAPI.list(),
    ])
      .then(([appRes, clsRes]) => {
        setApplications(appRes.data.results ?? appRes.data);
        setSchoolClasses(clsRes.data.results ?? clsRes.data);
      })
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load applications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const filteredApps = useMemo(() => {
    let result = applications;
    if (statusFilter) result = result.filter((a) => a.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) =>
        `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [applications, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredApps.length / pageSize));
  const pagedApps = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredApps.slice(start, start + pageSize);
  }, [filteredApps, page]);

  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((a) => a.status === 'pending').length;
    const accepted = applications.filter((a) => a.status === 'accepted').length;
    const enrolled = applications.filter((a) => a.status === 'enrolled').length;
    return { total, pending, accepted, enrolled };
  }, [applications]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateFieldErrors({});
    setCreateSaving(true);
    try {
      await admissionsAPI.create({
        ...createForm,
        class_applied: Number(createForm.class_applied),
      });
      setShowCreateModal(false);
      setCreateForm({ first_name: '', last_name: '', email: '', phone: '', date_of_birth: '', gender: 'male', address: '', previous_school: '', class_applied: '', notes: '' });
      showToast('success', 'Application created');
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
        else if (!Object.keys(fields).length) setCreateError('Failed to create application');
      } else {
        setCreateError(typeof data === 'string' ? data : 'Failed to create application');
      }
    } finally {
      setCreateSaving(false);
    }
  };

  const handleAccept = async (id: number) => {
    setActionLoading(id);
    try {
      await admissionsAPI.accept(id);
      showToast('success', 'Application accepted');
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to accept');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectAppId) return;
    setRejectSaving(true);
    try {
      await admissionsAPI.reject(rejectAppId, { reason: rejectReason });
      setShowRejectModal(false);
      setRejectAppId(null);
      setRejectReason('');
      showToast('success', 'Application rejected');
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to reject');
    } finally {
      setRejectSaving(false);
    }
  };

  const handleEnroll = async (id: number) => {
    setActionLoading(id);
    try {
      await admissionsAPI.enroll(id);
      showToast('success', 'Student enrolled');
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to enroll');
    } finally {
      setActionLoading(null);
    }
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
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-500 p-6 text-white shadow-lg shadow-indigo-500/20 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t('admissions.title') || (language === 'ar' ? 'القبول والتسجيل' : 'Admissions')}</h1>
            <p className="mt-1 text-sm text-indigo-100">{t('admissions.subtitle') || (language === 'ar' ? 'إدارة طلبات القبول' : 'Manage admission applications')}</p>
          </div>
          <button
            onClick={() => {
              setCreateForm({ first_name: '', last_name: '', email: '', phone: '', date_of_birth: '', gender: 'male', address: '', previous_school: '', class_applied: '', notes: '' });
              setCreateError(null);
              setCreateFieldErrors({});
              setShowCreateModal(true);
            }}
            className="btn-press inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {language === 'ar' ? 'طلب جديد' : 'New Application'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title={language === 'ar' ? 'إجمالي' : 'Total'} value={stats.total} color="bg-blue-500" delay={0}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard title={language === 'ar' ? 'قيد المراجعة' : 'Pending'} value={stats.pending} color="bg-amber-500" delay={50}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard title={language === 'ar' ? 'مقبول' : 'Accepted'} value={stats.accepted} color="bg-green-500" delay={100}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard title={language === 'ar' ? 'مسجل' : 'Enrolled'} value={stats.enrolled} color="bg-purple-500" delay={150}
          icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-0 w-full sm:w-auto sm:min-w-[180px]">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'بحث' : 'Search'}</label>
          <div className="relative">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder={language === 'ar' ? 'ابحث بالاسم...' : 'Search by name...'}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 ps-9 pe-3 text-sm text-gray-700 transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>
        <div className="w-full sm:w-auto sm:min-w-[160px]">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الحالة' : 'Status'}</label>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        {(statusFilter || searchQuery) && (
          <button
            onClick={() => { setStatusFilter(''); setSearchQuery(''); setPage(1); }}
            className="btn-press inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            {language === 'ar' ? 'مسح' : 'Clear'}
          </button>
        )}
      </div>

      {/* Main content */}
      {loading ? (
        <div className="flex h-48 items-center justify-center"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          {error}
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <p className="text-sm font-medium text-gray-900">{language === 'ar' ? 'لا توجد طلبات' : 'No applications found'}</p>
        </div>
      ) : (
        <div className="card-hover rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-end text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">{language === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th className="px-4 py-3">{language === 'ar' ? 'البريد' : 'Email'}</th>
                  <th className="px-4 py-3">{language === 'ar' ? 'الفصل' : 'Class'}</th>
                  <th className="px-4 py-3">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="px-4 py-3 text-center">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagedApps.map((app) => (
                  <React.Fragment key={app.id}>
                    <tr className="transition-colors hover:bg-gray-50/60 cursor-pointer" onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="font-medium text-gray-900">{app.first_name} {app.last_name}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">{app.email}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">{app.class_applied_name}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[app.status] || ''}`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500 text-xs">{new Date(app.created_at).toLocaleDateString()}</td>
                      <td className="whitespace-nowrap px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {app.status === 'pending' && (
                            <>
                              <button onClick={() => handleAccept(app.id)} disabled={actionLoading === app.id}
                                className="btn-press inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-2 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50">
                                {language === 'ar' ? 'قبول' : 'Accept'}
                              </button>
                              <button onClick={() => { setRejectAppId(app.id); setRejectReason(''); setShowRejectModal(true); }}
                                className="btn-press inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100">
                                {language === 'ar' ? 'رفض' : 'Reject'}
                              </button>
                            </>
                          )}
                          {app.status === 'accepted' && (
                            <button onClick={() => handleEnroll(app.id)} disabled={actionLoading === app.id}
                              className="btn-press inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-2 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-50">
                              {language === 'ar' ? 'تسجيل' : 'Enroll'}
                            </button>
                          )}
                          {app.status === 'pending' && (
                            <button onClick={() => handleAccept(app.id)} disabled={actionLoading === app.id}
                              className="btn-press inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50">
                              {language === 'ar' ? 'مراجعة' : 'Review'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === app.id && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 bg-gray-50/60">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-400">{language === 'ar' ? 'الهاتف' : 'Phone'}</p>
                              <p className="font-medium text-gray-900">{app.phone || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">{language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}</p>
                              <p className="font-medium text-gray-900">{app.date_of_birth ? new Date(app.date_of_birth).toLocaleDateString() : '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">{language === 'ar' ? 'الجنس' : 'Gender'}</p>
                              <p className="font-medium text-gray-900 capitalize">{app.gender || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">{language === 'ar' ? 'العنوان' : 'Address'}</p>
                              <p className="font-medium text-gray-900">{app.address || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">{language === 'ar' ? 'المدرسة السابقة' : 'Previous School'}</p>
                              <p className="font-medium text-gray-900">{app.previous_school || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">{language === 'ar' ? 'نتيجة الامتحان' : 'Entrance Score'}</p>
                              <p className="font-medium text-gray-900">{app.entrance_score || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">{language === 'ar' ? 'موعد المقابلة' : 'Interview Date'}</p>
                              <p className="font-medium text-gray-900">{app.interview_date ? new Date(app.interview_date).toLocaleDateString() : '-'}</p>
                            </div>
                            {app.documents && app.documents.length > 0 && (
                              <div className="sm:col-span-2 lg:col-span-3">
                                <p className="text-xs text-gray-400 mb-1">{language === 'ar' ? 'المستندات' : 'Documents'}</p>
                                <div className="flex flex-wrap gap-2">
                                  {app.documents.map((doc) => (
                                    <span key={doc.id} className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-700">
                                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                      {doc.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {app.rejection_reason && (
                              <div className="sm:col-span-2 lg:col-span-3">
                                <p className="text-xs text-red-400">{language === 'ar' ? 'سبب الرفض' : 'Rejection Reason'}</p>
                                <p className="text-sm text-red-600">{app.rejection_reason}</p>
                              </div>
                            )}
                            {app.notes && (
                              <div className="sm:col-span-2 lg:col-span-3">
                                <p className="text-xs text-gray-400">{language === 'ar' ? 'ملاحظات' : 'Notes'}</p>
                                <p className="text-sm text-gray-700">{app.notes}</p>
                              </div>
                            )}
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
            {pagedApps.map((app) => (
              <div key={app.id} className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{app.first_name} {app.last_name}</span>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[app.status] || ''}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">{language === 'ar' ? 'البريد' : 'Email'}</p>
                    <p className="font-medium text-gray-900 text-xs truncate">{app.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{language === 'ar' ? 'الفصل' : 'Class'}</p>
                    <p className="font-medium text-gray-900 text-xs">{app.class_applied_name}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-gray-50 pt-3">
                  {app.status === 'pending' && (
                    <>
                      <button onClick={() => handleAccept(app.id)} disabled={actionLoading === app.id}
                        className="btn-press inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50">
                        {language === 'ar' ? 'قبول' : 'Accept'}
                      </button>
                      <button onClick={() => { setRejectAppId(app.id); setRejectReason(''); setShowRejectModal(true); }}
                        className="btn-press inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100">
                        {language === 'ar' ? 'رفض' : 'Reject'}
                      </button>
                    </>
                  )}
                  {app.status === 'accepted' && (
                    <button onClick={() => handleEnroll(app.id)} disabled={actionLoading === app.id}
                      className="btn-press inline-flex items-center gap-1 rounded-lg bg-purple-50 px-3 py-2 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-50">
                      {language === 'ar' ? 'تسجيل' : 'Enroll'}
                    </button>
                  )}
                  <button onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                    className="btn-press inline-flex items-center gap-1 rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100">
                    {expandedId === app.id ? (language === 'ar' ? 'إخفاء' : 'Hide') : (language === 'ar' ? 'عرض' : 'Details')}
                  </button>
                </div>
                {expandedId === app.id && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-gray-50 pt-3">
                    <div><p className="text-gray-400">{language === 'ar' ? 'الهاتف' : 'Phone'}</p><p className="text-gray-900">{app.phone || '-'}</p></div>
                    <div><p className="text-gray-400">{language === 'ar' ? 'الجنس' : 'Gender'}</p><p className="text-gray-900 capitalize">{app.gender || '-'}</p></div>
                    <div><p className="text-gray-400">{language === 'ar' ? 'المدرسة السابقة' : 'Previous School'}</p><p className="text-gray-900">{app.previous_school || '-'}</p></div>
                    <div><p className="text-gray-400">{language === 'ar' ? 'نتيجة الامتحان' : 'Score'}</p><p className="text-gray-900">{app.entrance_score || '-'}</p></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-500">{filteredApps.length} {language === 'ar' ? 'إجمالي' : 'total'}</p>
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
              <h3 className="text-lg font-semibold text-gray-900">{language === 'ar' ? 'طلب قبول جديد' : 'New Application'}</h3>
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
            <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الاسم الأول' : 'First Name'}</label>
                <input required type="text" value={createForm.first_name} onChange={(e) => { setCreateForm({ ...createForm, first_name: e.target.value }); setCreateFieldErrors(fe => { const n = { ...fe }; delete n.first_name; return n; }); }}
                  className={`${inputCls} ${createFieldErrors.first_name ? 'border-red-300' : ''}`} />
                {createFieldErrors.first_name && <p className="mt-1 text-xs text-red-500">{createFieldErrors.first_name}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'اسم العائلة' : 'Last Name'}</label>
                <input required type="text" value={createForm.last_name} onChange={(e) => { setCreateForm({ ...createForm, last_name: e.target.value }); setCreateFieldErrors(fe => { const n = { ...fe }; delete n.last_name; return n; }); }}
                  className={`${inputCls} ${createFieldErrors.last_name ? 'border-red-300' : ''}`} />
                {createFieldErrors.last_name && <p className="mt-1 text-xs text-red-500">{createFieldErrors.last_name}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                <input required type="email" value={createForm.email} onChange={(e) => { setCreateForm({ ...createForm, email: e.target.value }); setCreateFieldErrors(fe => { const n = { ...fe }; delete n.email; return n; }); }}
                  className={`${inputCls} ${createFieldErrors.email ? 'border-red-300' : ''}`} />
                {createFieldErrors.email && <p className="mt-1 text-xs text-red-500">{createFieldErrors.email}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الهاتف' : 'Phone'}</label>
                <input type="text" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}</label>
                <input type="date" value={createForm.date_of_birth} onChange={(e) => setCreateForm({ ...createForm, date_of_birth: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الجنس' : 'Gender'}</label>
                <select value={createForm.gender} onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })} className={selectCls}>
                  <option value="male">{language === 'ar' ? 'ذكر' : 'Male'}</option>
                  <option value="female">{language === 'ar' ? 'أنثى' : 'Female'}</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الفصل المطلوب' : 'Class Applied'}</label>
                <select required value={createForm.class_applied} onChange={(e) => setCreateForm({ ...createForm, class_applied: e.target.value })} className={selectCls}>
                  <option value="">{language === 'ar' ? 'اختر فصل' : 'Select class'}</option>
                  {schoolClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'المدرسة السابقة' : 'Previous School'}</label>
                <input type="text" value={createForm.previous_school} onChange={(e) => setCreateForm({ ...createForm, previous_school: e.target.value })} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'العنوان' : 'Address'}</label>
                <input type="text" value={createForm.address} onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'ملاحظات' : 'Notes'}</label>
                <textarea value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} className={inputCls} rows={3} />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2 pt-2">
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

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowRejectModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{language === 'ar' ? 'رفض الطلب' : 'Reject Application'}</h3>
              <button onClick={() => setShowRejectModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'سبب الرفض' : 'Rejection Reason'}</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className={inputCls} rows={4} placeholder={language === 'ar' ? 'أدخل سبب الرفض...' : 'Enter reason for rejection...'} />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleReject} disabled={rejectSaving} className="btn-press inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50">
                {rejectSaving ? (
                  <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('common.saving')}</>
                ) : (language === 'ar' ? 'رفض' : 'Reject')}
              </button>
              <button type="button" onClick={() => setShowRejectModal(false)} className="btn-press rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">{t('common.cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
