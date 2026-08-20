import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Mail, Send, KeyRound, Building2, CalendarDays } from 'lucide-react';
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

const ROLE_COLORS: Record<string, string> = {
  guest: 'bg-amber-500',
  student: 'bg-emerald-500',
  ustaadh: 'bg-blue-500',
  parent: 'bg-purple-500',
  mudeer: 'bg-amber-500',
  idaarah: 'bg-rose-500',
};

const ROLE_PREFIX: Record<string, string> = {
  guest: '/guest',
  student: '/student',
  ustaadh: '/teacher',
  parent: '/parent',
  mudeer: '/admin',
  idaarah: '/board',
};

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function ProfilePage() {
  const { user, refreshUser, migrateSessionEmail } = useAuth();
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [gender, setGender] = useState<string>(user?.gender ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.date_of_birth ?? '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const oldEmail = user?.email;
      await authAPI.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        gender,
        address: address.trim(),
        date_of_birth: dateOfBirth || null,
        email: email.trim().toLowerCase(),
      });
      if (oldEmail && email.trim().toLowerCase() !== oldEmail) {
        migrateSessionEmail(oldEmail, email.trim().toLowerCase());
      }
      await refreshUser();
      setSuccess(t('common.profileUpdated'));
    } catch (err: any) {
      const data = err.response?.data;
      setError(data?.error || data?.email?.[0] || data?.phone?.[0] || data?.date_of_birth?.[0] || t('common.profileUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setVerifying(true);
    setError('');
    setSuccess('');
    try {
      await authAPI.requestVerifyEmail(email.trim().toLowerCase());
      setSuccess(t('common.verificationSent'));
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.profileUpdateFailed'));
    } finally {
      setVerifying(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500';
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300';

  if (!user) return null;

  const isVerified = user.email_verified;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('common.editProfile')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('common.accountDetails')}</p>
        </div>
        <Link
          to={`${ROLE_PREFIX[user.role] ?? ''}/change-password`}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <KeyRound className="h-4 w-4" />
          {t('common.changePassword')}
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm text-emerald-700 dark:text-emerald-400">{success}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="h-fit rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm dark:shadow-gray-900/50">
          <div className="flex flex-col items-center text-center">
            <span className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white ${ROLE_COLORS[user.role] ?? 'bg-gray-400'}`}>
              {initialsOf(user.full_name || user.email)}
            </span>
            <h2 className="mt-3 text-lg font-semibold text-gray-900 dark:text-gray-100">{user.full_name}</h2>
            <span className="mt-1 inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {t(ROLE_KEYS[user.role] ?? 'roles.guest')}
            </span>
          </div>

          <div className="mt-6 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-5 text-sm">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('common.email')}</p>
                <p className="truncate text-gray-900 dark:text-gray-100" dir="ltr">{user.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('common.madrasah')}</p>
                <p className="truncate text-gray-900 dark:text-gray-100">{user.madrasah_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('common.memberSince')}</p>
                <p className="text-gray-900 dark:text-gray-100">
                  {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : ''}
                </p>
              </div>
            </div>
          </div>

          <div className={`mt-5 flex items-start gap-2 rounded-lg border p-3 text-sm ${isVerified ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
            {isVerified ? <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />}
            <div>
              <p className="font-medium">{isVerified ? t('common.emailVerified') : t('common.emailNotVerified')}</p>
              {!isVerified && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={verifying}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2 disabled:opacity-50"
                >
                  <Send className="h-3 w-3" />
                  {verifying ? t('common.saving') : t('common.resendVerification')}
                </button>
              )}
            </div>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm dark:shadow-gray-900/50">
            <h3 className="mb-4 border-b border-gray-100 dark:border-gray-700 pb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('common.personalInformation')}
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t('common.firstName')}</label>
                <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('common.lastName')}</label>
                <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('common.gender')}</label>
                <select value={gender} onChange={e => setGender(e.target.value)} className={inputClass}>
                  <option value="">—</option>
                  <option value="male">{t('common.genderMale')}</option>
                  <option value="female">{t('common.genderFemale')}</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('common.dateOfBirth')}</label>
                <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('common.phone')}</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} placeholder="+966..." />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>{t('common.address')}</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} className={inputClass} />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm dark:shadow-gray-900/50">
            <h3 className="mb-4 border-b border-gray-100 dark:border-gray-700 pb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('common.accountInformation')}
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>{t('common.email')}</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} dir="ltr" />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('common.emailChangeNote')}</p>
              </div>
            </div>
          </section>

          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition sm:w-auto sm:px-8">
            {loading ? t('common.saving') : t('common.save')}
          </button>
        </form>
      </div>
    </div>
  );
}
