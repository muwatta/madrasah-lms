import { useEffect, useState } from 'react';
import { userAPI } from '../../api';
import type { User } from '../../types';
import ConfirmModal from '../../components/ConfirmModal';
import { useLanguage } from '../../context/LanguageContext';
import BulkUserImport from './BulkUserImport';
import { SkeletonTable } from '../../components/Skeleton';

interface UserFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  madrasah: string;
}

export default function UserManagementPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserFormData>({ email: '', password: '', first_name: '', last_name: '', role: 'student', madrasah: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const ROLES: { value: string; label: string }[] = [
    { value: '', label: t('filters.allRoles') },
    { value: 'student', label: t('roles.student') },
    { value: 'ustaadh', label: t('roles.ustaadh') },
    { value: 'parent', label: t('roles.parent') },
    { value: 'mudeer', label: t('roles.mudeer') },
    { value: 'idaarah', label: t('roles.idaarah') },
  ];

  const loadUsers = () => {
    setLoading(true);
    userAPI.list({ role: roleFilter || undefined, search: search || undefined })
      .then((res) => setUsers(res.data.results ?? res.data))
      .catch((err) => setError(err.response?.data?.detail || t('userManagement.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, [roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const openCreate = () => { setForm({ email: '', password: '', first_name: '', last_name: '', role: 'student', madrasah: '' }); setEditingId(null); setFormError(null); setShowForm(true); };

  const openEdit = (user: User) => {
    setForm({
      email: user.email,
      password: '',
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      madrasah: String(user.madrasah),
    });
    setEditingId(user.id);
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      if (editingId) {
        const payload: Record<string, unknown> = { ...form };
        if (!payload.password) delete payload.password;
        payload.madrasah = Number(payload.madrasah);
        await userAPI.update(editingId, payload);
      } else {
        await userAPI.create({ ...form, password_confirm: form.password, madrasah: Number(form.madrasah) });
      }
      setShowForm(false);
      loadUsers();
    } catch (err: any) {
      const msg = err.response?.data;
      setFormError(typeof msg === 'string' ? msg : Object.values(msg || {}).flat().join(', ') || t('userManagement.operationFailed'));
    } finally {
      setSaving(false);
    }
  };

  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<number | null>(null);

  const handleDeactivate = async () => {
    if (confirmDeactivateId === null) return;
    setDeactivateError(null);
    try {
      await userAPI.update(confirmDeactivateId, { is_active: false });
      setConfirmDeactivateId(null);
      loadUsers();
    } catch {
      setDeactivateError(t('userManagement.deactivateFailed'));
    }
  };

  const roleBadge = (role: string) => {
    const labels: Record<string, string> = {
      student: t('roles.student'),
      ustaadh: t('roles.ustaadh'),
      parent: t('roles.parent'),
      mudeer: t('roles.mudeer'),
      idaarah: t('roles.idaarah'),
    };
    const colors: Record<string, string> = {
      student: 'bg-blue-100 text-blue-700',
      ustaadh: 'bg-purple-100 text-purple-700',
      parent: 'bg-amber-100 text-amber-700',
      mudeer: 'bg-teal-100 text-teal-700',
      idaarah: 'bg-red-100 text-red-700',
    };
    return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-700'}`}>{labels[role] || role}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[var(--color-text-primary)]">{t('userManagement.title')}</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowBulkImport(!showBulkImport)} className="rounded-lg border border-primary-200 dark:border-primary-800 bg-white dark:bg-[var(--color-bg-primary)] px-4 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/30">
            {t('bulkImport.title')}
          </button>
          <button onClick={openCreate} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            {t('userManagement.addUser')}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-[var(--color-text-muted)] mb-6">{t('guides.userManagement')}</p>

      {showBulkImport && (
        <div className="mb-6">
          <BulkUserImport onComplete={() => { loadUsers(); setShowBulkImport(false); }} />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('filters.filterByRole')}</label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-lg border border-gray-300 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-gray-900 dark:text-[var(--color-text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('filters.searchPlaceholder')} className="rounded-lg border border-gray-300 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-gray-900 dark:text-[var(--color-text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
          <button type="submit" className="rounded-lg border border-gray-300 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-primary)] px-3 py-2 text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)] hover:bg-gray-50 dark:hover:bg-gray-700/30">{t('common.search')}</button>
        </form>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-secondary)] p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-[var(--color-text-primary)]">{editingId ? t('userManagement.editUser') : t('userManagement.createUser')}</h2>
          {formError && <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">{formError}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.firstName')}</label>
              <input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-gray-900 dark:text-[var(--color-text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.lastName')}</label>
              <input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-gray-900 dark:text-[var(--color-text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.email')}</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-gray-900 dark:text-[var(--color-text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.password')} {editingId && <span className="text-gray-400 dark:text-[var(--color-text-muted)]">{t('userManagement.passHint')}</span>}</label>
              <input type="password" required={!editingId} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-gray-900 dark:text-[var(--color-text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.role')}</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-gray-900 dark:text-[var(--color-text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                {ROLES.filter((r) => r.value).map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">{t('fields.schoolId')}</label>
              <input required type="number" value={form.madrasah} onChange={(e) => setForm({ ...form, madrasah: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-gray-900 dark:text-[var(--color-text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {saving ? t('common.saving') : editingId ? t('common.update') : t('common.create')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 dark:border-[var(--color-border)] px-4 py-2 text-sm font-medium text-gray-700 dark:text-[var(--color-text-secondary)] hover:bg-gray-50 dark:hover:bg-gray-700/30">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {deactivateError && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-400">
          {deactivateError}
          <button onClick={() => setDeactivateError(null)} className="me-2 underline">{t('common.dismiss')}</button>
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
              <tr className="border-b border-gray-200 dark:border-[var(--color-border)] bg-gray-50 dark:bg-[var(--color-bg-primary)] text-end text-xs font-medium uppercase text-gray-500 dark:text-[var(--color-text-muted)]">
                <th className="px-4 py-3">{t('fields.name')}</th>
                <th className="px-4 py-3">{t('fields.email')}</th>
                <th className="px-4 py-3">{t('fields.role')}</th>
                <th className="px-4 py-3">{t('fields.school')}</th>
                <th className="px-4 py-3">{t('fields.status')}</th>
                <th className="px-4 py-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 dark:border-[var(--color-border-light)] hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{user.full_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-[var(--color-text-secondary)]">{user.email}</td>
                  <td className="px-4 py-3">{roleBadge(user.role)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-[var(--color-text-secondary)]">{user.madrasah_name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.is_active ? t('fields.active') : t('fields.inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(user)} className="text-primary-600 hover:underline text-sm font-medium">{t('common.edit')}</button>
                      {user.is_active && (
                        <button onClick={() => setConfirmDeactivateId(user.id)} className="text-red-600 hover:underline text-sm font-medium">{t('userManagement.deactivate')}</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-[var(--color-text-muted)]">{t('userManagement.noUsers')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {confirmDeactivateId !== null && (
        <ConfirmModal
          title={t('userManagement.deactivate')}
          message={t('userManagement.deactivateConfirm')}
          onConfirm={handleDeactivate}
          onCancel={() => setConfirmDeactivateId(null)}
          variant="danger"
        />
      )}
    </div>
  );
}
