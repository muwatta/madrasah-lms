import { useEffect, useState } from 'react';
import { enrollmentAPI, userAPI, subjectAPI } from '../../api';
import type { Enrollment, User, Subject } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500',
  'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2);
}

export default function EnrollmentManagementPage() {
  const { t, language } = useLanguage();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [students, setStudents] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);

  const [studentFilter, setStudentFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ student: '', subject: '', ustaadh: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadEnrollments = () => {
    setLoading(true);
    enrollmentAPI.list({
      student: studentFilter || undefined,
      subject: subjectFilter || undefined,
      ustaadh: teacherFilter || undefined,
    })
      .then((res) => setEnrollments(res.data.results ?? res.data))
      .catch((err) => setError(err.response?.data?.detail || t('enrollmentManagement.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([
      userAPI.list({ role: 'student' }).then((r) => setStudents(r.data.results ?? r.data)),
      subjectAPI.list().then((r) => setSubjects(r.data.results ?? r.data)),
      userAPI.list({ role: 'ustaadh' }).then((r) => setTeachers(r.data.results ?? r.data)),
    ]).catch(() => {});
  }, []);

  useEffect(() => { loadEnrollments(); }, [studentFilter, subjectFilter, teacherFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSaving(true);
    try {
      await enrollmentAPI.create({
        student: Number(form.student),
        subject: Number(form.subject),
        ustaadh: form.ustaadh ? Number(form.ustaadh) : null,
      });
      setShowForm(false);
      loadEnrollments();
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const fields: Record<string, string> = {};
        for (const [key, val] of Object.entries(data)) {
          fields[key] = Array.isArray(val) ? val.join(', ') : String(val);
        }
        setFieldErrors(fields);
        const nonField = Object.keys(fields).filter(k => k === 'non_field_errors' || k === 'detail');
        if (nonField.length) {
          setFormError(fields[nonField[0]]);
        } else if (!Object.keys(fields).length) {
          setFormError(t('enrollmentManagement.createFailed'));
        }
      } else {
        setFormError(typeof data === 'string' ? data : t('enrollmentManagement.createFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  const grouped: Record<string, Enrollment[]> = {};
  const groupOrder: string[] = [];
  for (const e of enrollments) {
    if (!grouped[e.student_name]) {
      grouped[e.student_name] = [];
      groupOrder.push(e.student_name);
    }
    grouped[e.student_name].push(e);
  }
  const totalSubjects = subjects.length;
  const totalTeachers = teachers.length;

  const selectCls = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100';

  return (
    <div className="page-enter space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-emerald-500 p-6 text-white shadow-lg shadow-primary-500/20 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t('enrollmentManagement.title')}</h1>
            <p className="mt-1 text-sm text-primary-100">{t('guides.enrollmentManagement')}</p>
          </div>
          <button
            onClick={() => { setForm({ student: '', subject: '', ustaadh: '' }); setFormError(null); setFieldErrors({}); setShowForm(true); }}
            className="btn-press inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {t('enrollmentManagement.addEnrollment')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400">{language === 'ar' ? 'إجمالي التسجيلات' : 'Total Enrollments'}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{enrollments.length}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400">{language === 'ar' ? 'الطلاب' : 'Students'}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{groupOrder.length}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400">{language === 'ar' ? 'المواد' : 'Subjects'}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalSubjects}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400">{language === 'ar' ? 'المعلمين' : 'Teachers'}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalTeachers}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px] flex-1">
            <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('filters.filterByStudent')}</label>
            <select value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)} className={selectCls}>
              <option value="">{t('filters.allStudents')}</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div className="min-w-[160px] flex-1">
            <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('filters.filterBySubject')}</label>
            <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className={selectCls}>
              <option value="">{t('filters.allSubjects')}</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{language === 'ar' ? s.name_ar : s.name_en}</option>)}
            </select>
          </div>
          <div className="min-w-[160px] flex-1">
            <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('filters.filterByTeacher')}</label>
            <select value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)} className={selectCls}>
              <option value="">{t('filters.allTeachers')}</option>
              {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
            </select>
          </div>
          {(studentFilter || subjectFilter || teacherFilter) && (
            <button
              onClick={() => { setStudentFilter(''); setSubjectFilter(''); setTeacherFilter(''); }}
              className="btn-press inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              {language === 'ar' ? 'مسح' : 'Clear'}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="animate-slide-down rounded-xl border border-primary-100 bg-white p-6 shadow-md shadow-primary-500/5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
              <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{t('enrollmentManagement.createEnrollment')}</h2>
          </div>
          {formError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('fields.student')}</label>
              <select required value={form.student} onChange={(e) => { setForm({ ...form, student: e.target.value }); setFieldErrors(fe => { const n = { ...fe }; delete n.student; return n; }); }} className={`${selectCls} ${fieldErrors.student ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}>
                <option value="">{t('filters.chooseStudent')}</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
              {fieldErrors.student && <p className="mt-1 text-xs text-red-500">{fieldErrors.student}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('fields.subject')}</label>
              <select required value={form.subject} onChange={(e) => { setForm({ ...form, subject: e.target.value }); setFieldErrors(fe => { const n = { ...fe }; delete n.subject; return n; }); }} className={`${selectCls} ${fieldErrors.subject ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}>
                <option value="">{t('filters.chooseSubject')}</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{language === 'ar' ? s.name_ar : s.name_en}</option>)}
              </select>
              {fieldErrors.subject && <p className="mt-1 text-xs text-red-500">{fieldErrors.subject}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('fields.teacher')}</label>
              <select value={form.ustaadh} onChange={(e) => { setForm({ ...form, ustaadh: e.target.value }); setFieldErrors(fe => { const n = { ...fe }; delete n.ustaadh; return n; }); }} className={`${selectCls} ${fieldErrors.ustaadh ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}>
                <option value="">{t('enrollmentManagement.chooseOptionalTeacher')}</option>
                {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
              </select>
              {fieldErrors.ustaadh && <p className="mt-1 text-xs text-red-500">{fieldErrors.ustaadh}</p>}
            </div>
            <div className="flex items-end gap-3 sm:col-span-3">
              <button type="submit" disabled={saving} className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700 disabled:opacity-50">
                {saving ? (
                  <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('common.saving')}</>
                ) : (
                  <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{t('common.create')}</>
                )}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-press rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          {error}
        </div>
      ) : !groupOrder.length ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <p className="text-sm font-medium text-gray-900">{t('enrollmentManagement.noEnrollments')}</p>
          <p className="mt-1 text-xs text-gray-400">{language === 'ar' ? 'ابدأ بتسجيل الطلاب في المواد' : 'Start by enrolling students in subjects'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupOrder.map((studentName) => {
              const items = grouped[studentName];
              return (
                <div key={studentName} className="card-hover rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <div className={`flex items-center gap-3 px-5 py-4 ${getAvatarColor(studentName)} bg-opacity-10`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white ${getAvatarColor(studentName)}`}>
                      {getInitials(studentName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{studentName}</p>
                      <p className="text-xs text-gray-400">
                        {items.length} {language === 'ar' ? 'موارد مسجلة' : 'enrolled subjects'}
                      </p>
                    </div>
                  </div>
                  <ul className="divide-y divide-gray-50">
                    {items.map((e, idx) => (
                      <li key={e.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50/60">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-[10px] font-bold text-primary-600">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-700">{language === 'ar' ? e.subject_name : e.subject_name_en}</p>
                          <p className="truncate text-xs text-gray-400">{e.ustaadh_name || '—'}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                          {new Date(e.enrolled_at).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
