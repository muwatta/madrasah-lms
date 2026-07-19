import { useEffect, useState } from 'react';
import { userAPI } from '../../api';
import type { User } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

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

  const handleDeactivate = async (id: number) => {
    if (!confirm(t('userManagement.deactivateConfirm'))) return;
    setDeactivateError(null);
    try {
      await userAPI.update(id, { is_active: false });
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('userManagement.title')}</h1>
        <button onClick={openCreate} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          {t('userManagement.addUser')}
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('filters.filterByRole')}</label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('filters.searchPlaceholder')} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
          <button type="submit" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">{t('common.search')}</button>
        </form>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{editingId ? t('userManagement.editUser') : t('userManagement.createUser')}</h2>
          {formError && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.firstName')}</label>
              <input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.lastName')}</label>
              <input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.email')}</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.password')} {editingId && <span className="text-gray-400">{t('userManagement.passHint')}</span>}</label>
              <input type="password" required={!editingId} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.role')}</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                {ROLES.filter((r) => r.value).map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.schoolId')}</label>
              <input required type="number" value={form.madrasah} onChange={(e) => setForm({ ...form, madrasah: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {saving ? t('common.saving') : editingId ? t('common.update') : t('common.create')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {deactivateError && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {deactivateError}
          <button onClick={() => setDeactivateError(null)} className="me-2 underline">{t('common.dismiss')}</button>
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
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{user.full_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">{roleBadge(user.role)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{user.madrasah_name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.is_active ? t('fields.active') : t('fields.inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(user)} className="text-primary-600 hover:underline text-sm font-medium">{t('common.edit')}</button>
                      {user.is_active && (
                        <button onClick={() => handleDeactivate(user.id)} className="text-red-600 hover:underline text-sm font-medium">{t('userManagement.deactivate')}</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">{t('userManagement.noUsers')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
