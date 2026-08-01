import { useState } from 'react';
import { Mail, RefreshCw, LogOut, Hourglass } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { authAPI } from '../../api';

export default function GuestPendingPage() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resendVerification = async () => {
    if (!user) return;
    setSending(true);
    setError(null);
    setMessage(null);
    try {
      await authAPI.requestVerifyEmail(user.email);
      setMessage(t('auth.guestVerifySent'));
    } catch (err: any) {
      setError(err.response?.data?.error || t('auth.registrationFailed'));
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-emerald-100 dark:border-gray-700 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
            <Hourglass className="w-8 h-8 text-amber-700 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('auth.guestPendingTitle')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">{t('auth.guestPendingSubtitle')}</p>

          <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4 text-start">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">{t('fields.email')}:</span> {user?.email}
            </p>
            <div className="mt-2 flex items-center gap-2">
              {user?.email_verified ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                    <Mail className="w-3.5 h-3.5" /> {t('auth.guestVerified')}
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <Mail className="w-3.5 h-3.5" /> {t('auth.guestNotVerified')}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t('auth.guestVerifyHint')}</span>
                </>
              )}
            </div>
          </div>

          {message && (
            <div className="mt-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-400">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            {!user?.email_verified && (
              <button
                onClick={resendVerification}
                disabled={sending}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-white transition"
              >
                <RefreshCw className="w-4 h-4" />
                {sending ? t('auth.signingIn') : t('auth.guestResendVerify')}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <LogOut className="w-4 h-4" />
              {t('auth.guestLogout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
