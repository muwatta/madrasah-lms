import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../../api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const uidb64 = searchParams.get('uidb64') || '';
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!uidb64 || !token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }
    authAPI.verifyEmailConfirm(uidb64, token)
      .then(() => {
        setStatus('success');
        setMessage('Email verified successfully!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed');
      });
  }, [uidb64, token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-emerald-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-xl dark:shadow-gray-900/50">
          <div className="mb-6 text-center">
            <div className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full ${
              status === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30' : status === 'error' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              {status === 'loading' && (
                <svg className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {status === 'success' && (
                <svg className="h-8 w-8 text-emerald-700 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {status === 'error' && (
                <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Email Verification</h1>
          </div>

          <div className={`rounded-lg border p-4 text-center text-sm ${
            status === 'success' ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
            status === 'error' ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
            'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}>
            {status === 'loading' ? 'Verifying your email...' : message}
          </div>

          {status !== 'loading' && (
            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              <Link to="/login" className="font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">Back to Login</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
