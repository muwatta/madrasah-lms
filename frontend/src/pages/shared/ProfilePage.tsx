import { useState } from 'react';
import { authAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const ROLE_KEYS: Record<string, string> = {
  guest: 'roles.guest',
  student: 'roles.student',
  ustaadh: 'roles.ustaadh',
  parent: 'roles.parent',
  mudeer: 'roles.mudeer',
  idaarah: 'roles.idaarah',
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.date_of_birth ?? '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await authAPI.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        date_of_birth: dateOfBirth || null,
      });
      await refreshUser();
      setSuccess(t('common.profileUpdated'));
    } catch (err: any) {
      const data = err.response?.data;
      setError(data?.error || data?.phone?.[0] || data?.date_of_birth?.[0] || t('common.profileUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500';

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('common.editProfile')}</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{t('common.accountDetails')}</p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm text-emerald-700 dark:text-emerald-400">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm dark:shadow-gray-900/50">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.firstName')}</label>
            <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.lastName')}</label>
            <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.phone')}</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} placeholder="+966..." />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.dateOfBirth')}</label>
            <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="grid gap-5 rounded-lg bg-gray-50 dark:bg-gray-900/40 p-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.email')}</label>
            <p className="text-sm text-gray-900 dark:text-gray-100">{user?.email}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.role')}</label>
            <p className="text-sm text-gray-900 dark:text-gray-100">{user ? t(ROLE_KEYS[user.role] ?? 'roles.guest') : ''}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.madrasah')}</label>
            <p className="text-sm text-gray-900 dark:text-gray-100">{user?.madrasah_name}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.memberSince')}</label>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : ''}
            </p>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition">
          {loading ? t('common.saving') : t('common.save')}
        </button>
      </form>
    </div>
  );
}
