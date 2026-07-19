import { useEffect, useState } from 'react';
import api from '../../api/client';
import { userAPI } from '../../api';
import { unwrapPaginated } from '../../api/client';
import type { User } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

interface StudentParentLink {
  id: number;
  student: number;
  student_email: string;
  student_name: string;
  parent: number;
  parent_email: string;
  parent_name: string;
  relationship: 'father' | 'mother' | 'guardian';
}

export default function ParentStudentPage() {
  const { t } = useLanguage();
  const [links, setLinks] = useState<StudentParentLink[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [parents, setParents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ student: '', parent: '', relationship: 'father' as string });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/auth/student-parents/').then((r) => setLinks(unwrapPaginated<StudentParentLink>(r.data))),
      userAPI.list({ role: 'student' }).then((r) => setStudents(unwrapPaginated<User>(r.data))),
      userAPI.list({ role: 'parent' }).then((r) => setParents(unwrapPaginated<User>(r.data))),
    ])
      .catch((err) => setError(err.response?.data?.detail || t('parentStudent.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      await api.post('/auth/student-parents/', {
        student: Number(form.student),
        parent: Number(form.parent),
        relationship: form.relationship,
      });
      setShowForm(false);
      setForm({ student: '', parent: '', relationship: 'father' });
      loadData();
    } catch (err: any) {
      const msg = err.response?.data;
      setFormError(typeof msg === 'string' ? msg : Object.values(msg || {}).flat().join(', ') || t('parentStudent.createFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('parentStudent.removeConfirm'))) return;
    try {
      await api.delete(`/auth/student-parents/${id}/`);
      loadData();
    } catch {
      alert(t('parentStudent.deleteFailed'));
    }
  };

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('parentStudent.title')}</h1>
        <button
          onClick={() => { setForm({ student: '', parent: '', relationship: 'father' }); setFormError(null); setShowForm(true); }}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {t('parentStudent.addLink')}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('parentStudent.linkParentToStudent')}</h2>
          {formError && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</div>}
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.student')}</label>
              <select required value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} className={inputClass}>
                <option value="">{t('parentStudent.selectStudent')}</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('parentStudent.relationship')}</label>
              <select required value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })} className={inputClass}>
                <option value="">{t('parentStudent.selectParent')}</option>
                {parents.map((p) => <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('parentStudent.relationship')}</label>
              <select value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className={inputClass}>
                <option value="father">{t('relationship.father')}</option>
                <option value="mother">{t('relationship.mother')}</option>
                <option value="guardian">{t('relationship.guardian')}</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex gap-3">
              <button type="submit" disabled={saving} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {saving ? t('common.saving') : t('parentStudent.createLink')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                {t('common.cancel')}
              </button>
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
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">{t('fields.student')}</th>
                <th className="px-4 py-3">{t('parentStudent.selectParent')}</th>
                <th className="px-4 py-3">{t('parentStudent.relationship')}</th>
                <th className="px-4 py-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{link.student_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{link.parent_name}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{link.relationship === 'father' ? t('relationship.father') : link.relationship === 'mother' ? t('relationship.mother') : t('relationship.guardian')}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="text-sm font-medium text-red-600 hover:underline"
                    >
                      {t('parentStudent.remove')}
                    </button>
                  </td>
                </tr>
              ))}
              {!links.length && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">{t('parentStudent.noLinks')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
