import { useEffect, useState } from 'react';
import api from '../../api/client';
import { userAPI } from '../../api';
import { unwrapPaginated } from '../../api/client';
import type { User } from '../../types';
import ConfirmModal from '../../components/ConfirmModal';
import { useLanguage } from '../../context/LanguageContext';
import { SkeletonTable } from '../../components/Skeleton';

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

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmDeleteLinkId, setConfirmDeleteLinkId] = useState<number | null>(null);

  const handleDelete = async () => {
    if (confirmDeleteLinkId === null) return;
    setDeleteError(null);
    try {
      await api.delete(`/auth/student-parents/${confirmDeleteLinkId}/`);
      setConfirmDeleteLinkId(null);
      loadData();
    } catch {
      setDeleteError(t('parentStudent.deleteFailed'));
    }
  };

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[var(--color-text-primary)]">{t('parentStudent.title')}</h1>
        <button
          onClick={() => { setForm({ student: '', parent: '', relationship: 'father' }); setFormError(null); setShowForm(true); }}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {t('parentStudent.addLink')}
        </button>
      </div>
      <p className="text-sm text-gray-500 dark:text-[var(--color-text-muted)] mb-6">{t('guides.parentStudent')}</p>

      {showForm && (
        <div className="rounded-lg border border-gray-200 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-secondary)] p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-[var(--color-text-primary)]">{t('parentStudent.linkParentToStudent')}</h2>
          {formError && <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">{formError}</div>}
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.student')}</label>
              <select required value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} className={inputClass}>
                <option value="">{t('parentStudent.selectStudent')}</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('parentStudent.selectParent')}</label>
              <select required value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })} className={inputClass}>
                <option value="">{t('parentStudent.selectParent')}</option>
                {parents.map((p) => <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('parentStudent.relationship')}</label>
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
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 dark:border-[var(--color-border)] px-4 py-2 text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)] hover:bg-gray-50 dark:hover:bg-gray-700/30">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteError && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-400">
          {deleteError}
          <button onClick={() => setDeleteError(null)} className="me-2 underline">{t('common.dismiss')}</button>
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={5} />
      ) : error ? (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-400">{error}</div>
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-secondary)] shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[var(--color-border)] bg-gray-50 dark:bg-[var(--color-bg-primary)] text-start text-xs font-medium uppercase text-gray-500 dark:text-[var(--color-text-muted)]">
                <th className="px-4 py-3">{t('fields.student')}</th>
                <th className="px-4 py-3">{t('parentStudent.selectParent')}</th>
                <th className="px-4 py-3">{t('parentStudent.relationship')}</th>
                <th className="px-4 py-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id} className="border-b border-gray-50 dark:border-[var(--color-border-light)] hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{link.student_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-[var(--color-text-secondary)]">{link.parent_name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-[var(--color-text-secondary)] capitalize">{link.relationship === 'father' ? t('relationship.father') : link.relationship === 'mother' ? t('relationship.mother') : t('relationship.guardian')}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setConfirmDeleteLinkId(link.id)}
                      className="text-sm font-medium text-red-600 hover:underline"
                    >
                      {t('parentStudent.remove')}
                    </button>
                  </td>
                </tr>
              ))}
              {!links.length && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-[var(--color-text-muted)]">{t('parentStudent.noLinks')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {confirmDeleteLinkId !== null && (
        <ConfirmModal
          title={t('parentStudent.remove')}
          message={t('parentStudent.removeConfirm')}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDeleteLinkId(null)}
          variant="danger"
        />
      )}
    </div>
  );
}
