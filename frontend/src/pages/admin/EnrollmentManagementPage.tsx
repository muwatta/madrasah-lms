import { useEffect, useState } from 'react';
import { enrollmentAPI, userAPI, subjectAPI } from '../../api';
import type { Enrollment, User, Subject } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

export default function EnrollmentManagementPage() {
  const { t } = useLanguage();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [students, setStudents] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);

  const [studentFilter, setStudentFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ student: '', subject: '', ustaadh: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadEnrollments = () => {
    setLoading(true);
    enrollmentAPI.list({
      student: studentFilter || undefined,
      subject: subjectFilter || undefined,
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

  useEffect(() => { loadEnrollments(); }, [studentFilter, subjectFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
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
      const msg = err.response?.data;
      setFormError(typeof msg === 'string' ? msg : Object.values(msg || {}).flat().join(', ') || t('enrollmentManagement.createFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('enrollmentManagement.title')}</h1>
        <button onClick={() => { setForm({ student: '', subject: '', ustaadh: '' }); setFormError(null); setShowForm(true); }} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          {t('enrollmentManagement.addEnrollment')}
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('filters.filterByStudent')}</label>
          <select value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
            <option value="">{t('filters.allStudents')}</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('filters.filterBySubject')}</label>
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
            <option value="">{t('filters.allSubjects')}</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
          </select>
        </div>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('enrollmentManagement.createEnrollment')}</h2>
          {formError && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.student')}</label>
              <select required value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                <option value="">{t('filters.chooseStudent')}</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.subject')}</label>
              <select required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                <option value="">{t('filters.chooseSubject')}</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.teacher')}</label>
              <select value={form.ustaadh} onChange={(e) => setForm({ ...form, ustaadh: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                <option value="">{t('enrollmentManagement.chooseOptionalTeacher')}</option>
                {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-3 flex gap-3">
              <button type="submit" disabled={saving} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {saving ? t('common.saving') : t('common.create')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center"><LoadingSpinner /></div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-end text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">{t('fields.student')}</th>
                <th className="px-4 py-3">{t('fields.subject')}</th>
                <th className="px-4 py-3">{t('fields.teacher')}</th>
                <th className="px-4 py-3">{t('teacher.enrollmentDate')}</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{e.student_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{e.subject_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{e.ustaadh_name || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">{new Date(e.enrolled_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {!enrollments.length && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">{t('enrollmentManagement.noEnrollments')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
