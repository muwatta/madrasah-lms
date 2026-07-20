import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../api';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
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
      <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
      <p className="mb-6 text-sm text-gray-500">Update your account password.</p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Current Password</label>
          <input type="password" required value={oldPassword} onChange={e => setOldPassword(e.target.value)}
            className="input-field w-full" placeholder="••••••••" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">New Password</label>
          <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
            className="input-field w-full" placeholder="••••••••" minLength={8} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Confirm New Password</label>
          <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
            className="input-field w-full" placeholder="••••••••" minLength={8} />
        </div>
        <button type="submit" disabled={loading}
          className="btn-press w-full rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white hover:bg-primary-700 disabled:opacity-50">
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
