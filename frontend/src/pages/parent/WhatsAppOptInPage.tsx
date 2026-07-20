import { useState, useEffect } from 'react';
import { whatsappAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function WhatsAppOptInPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recipient, setRecipient] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [prefLang, setPrefLang] = useState('ar');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    whatsappAPI.recipients.list().then(r => {
      const list = r.data.results ?? r.data;
      if (list.length > 0) {
        const r = list[0];
        setRecipient(r);
        setPhoneNumber(r.phone_number);
        setPrefLang(r.language);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleOptIn = async () => {
    if (!phoneNumber.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await whatsappAPI.recipients.optIn({
        parent_id: user!.id,
        phone_number: phoneNumber.trim(),
        language: prefLang,
      });
      setRecipient(res.data);
      setMessage({ type: 'success', text: 'Successfully opted in! You will now receive notifications via WhatsApp.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to opt in. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleOptOut = async () => {
    if (!recipient) return;
    setSaving(true);
    setMessage(null);
    try {
      await whatsappAPI.recipients.optOut(recipient.id);
      setRecipient({ ...recipient, is_opted_in: false });
      setMessage({ type: 'success', text: 'Opted out successfully.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to opt out.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="mt-20" />;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">WhatsApp Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            Receive attendance alerts, fee reminders, and exam results via WhatsApp.
          </p>
        </div>

        {message && (
          <div className={`mb-4 rounded-lg p-3 text-sm ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {recipient?.is_opted_in ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-emerald-50 p-4 text-center">
              <p className="text-sm font-medium text-emerald-800">You are opted in</p>
              <p className="mt-1 text-xs text-emerald-600">{recipient.phone_number} ({recipient.language === 'ar' ? 'Arabic' : 'English'})</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Update preferences</h3>
              <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                placeholder="+234XXXXXXXXXX" className="input-field" />
              <select value={prefLang} onChange={e => setPrefLang(e.target.value)} className="input-field">
                <option value="ar">Arabic</option>
                <option value="en">English</option>
              </select>
              <button onClick={handleOptIn} disabled={saving}
                className="w-full rounded-lg bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Update'}
              </button>
            </div>

            <div className="border-t pt-4">
              <button onClick={handleOptOut} disabled={saving}
                className="w-full rounded-lg border border-red-300 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                Opt Out of WhatsApp Notifications
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Enter your WhatsApp number to get started:</p>
            <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
              placeholder="+234XXXXXXXXXX" className="input-field"
              inputMode="tel" />
            <select value={prefLang} onChange={e => setPrefLang(e.target.value)} className="input-field">
              <option value="ar">Arabic</option>
              <option value="en">English</option>
            </select>
            <button onClick={handleOptIn} disabled={saving || !phoneNumber.trim()}
              className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {saving ? 'Subscribing...' : 'Subscribe to WhatsApp Notifications'}
            </button>
          </div>
        )}

        <div className="mt-6 space-y-2 text-xs text-gray-400">
          <p>You can opt out at any time. Message and data rates may apply.</p>
          <p>Your number will only be used for school-related notifications.</p>
        </div>
      </div>
    </div>
  );
}
