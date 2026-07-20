import { useState } from 'react';
import { authAPI } from '../../api';

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirm) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword(oldPassword, newPassword);
      setSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.old_password?.[0] || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Change Password</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Update your account password.</p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm text-emerald-700 dark:text-emerald-400">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm dark:shadow-gray-900/50">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
          <input type="password" required value={oldPassword} onChange={e => setOldPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            placeholder="••••••••" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
          <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            placeholder="••••••••" minLength={8} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
          <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            placeholder="••••••••" minLength={8} />
        </div>
        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition">
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
