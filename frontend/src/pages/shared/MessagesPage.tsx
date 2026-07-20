import { useState, useEffect } from 'react';
import { messageAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { SkeletonCard, SkeletonTable } from '../../components/Skeleton';

interface Message {
  id: number;
  sender: number;
  sender_name: string;
  recipient: number;
  recipient_name: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface Recipient {
  id: number;
  name: string;
  email: string;
}

export default function MessagesPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState<'inbox' | 'sent'>('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [form, setForm] = useState({ recipient: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadMessages = () => {
    setLoading(true);
    messageAPI.list({ folder })
      .then((res) => setMessages(res.data.results ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadUnread = () => {
    messageAPI.unreadCount()
      .then((res) => setUnreadCount(res.data.unread_count))
      .catch(() => {});
  };

  const loadRecipients = () => {
    const api = user?.role === 'ustaadh' ? messageAPI.teacherParents : messageAPI.parentStudents;
    api()
      .then((res) => setRecipients(res.data))
      .catch(() => {});
  };

  useEffect(() => { loadMessages(); loadUnread(); }, [folder]);
  useEffect(() => { loadRecipients(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipient || !form.subject || !form.body) return;
    setSending(true);
    try {
      await messageAPI.create({
        recipient: Number(form.recipient),
        subject: form.subject,
        body: form.body,
      });
      setShowCompose(false);
      setForm({ recipient: '', subject: '', body: '' });
      loadMessages();
      loadUnread();
    } catch {
    } finally {
      setSending(false);
    }
  };

  const openMessage = (msg: Message) => {
    setSelectedMsg(msg);
    if (!msg.is_read && msg.recipient === user?.id) {
      messageAPI.get(msg.id).then(() => loadUnread());
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('messages.title')}</h1>
          {unreadCount > 0 && <p className="text-sm text-primary-600 dark:text-primary-400">{unreadCount} {t('messages.unread')}</p>}
        </div>
        <button
          onClick={() => { setShowCompose(true); setSelectedMsg(null); loadRecipients(); }}
          className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {t('messages.compose')}
        </button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => { setFolder('inbox'); setSelectedMsg(null); }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${folder === 'inbox' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
          {t('messages.inbox')}
        </button>
        <button onClick={() => { setFolder('sent'); setSelectedMsg(null); }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${folder === 'sent' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
          {t('messages.sent')}
        </button>
      </div>

      {showCompose && (
        <div className="animate-slide-down rounded-xl border border-primary-100 dark:border-primary-800 bg-white dark:bg-gray-800 p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{t('messages.compose')}</h2>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{t('messages.to')}</label>
              <select value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none">
                <option value="">{t('messages.chooseRecipient')}</option>
                {recipients.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.email})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{t('messages.subject')}</label>
              <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{t('messages.message')}</label>
              <textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={sending || !form.recipient || !form.subject || !form.body}
                className="btn-press rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                {sending ? t('common.saving') : t('messages.send')}
              </button>
              <button type="button" onClick={() => setShowCompose(false)} className="rounded-lg border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedMsg && (
        <div className="animate-slide-down rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedMsg.subject}</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {folder === 'inbox' ? `${t('messages.from')}: ${selectedMsg.sender_name}` : `${t('messages.to')}: ${selectedMsg.recipient_name}`}
                {' • '}
                {new Date(selectedMsg.created_at).toLocaleString()}
              </p>
            </div>
            <button onClick={() => setSelectedMsg(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedMsg.body}</p>
          {folder === 'inbox' && (
            <button onClick={() => {
              setShowCompose(true);
              setForm({ recipient: String(selectedMsg.sender), subject: `Re: ${selectedMsg.subject}`, body: '' });
              setSelectedMsg(null);
            }} className="mt-4 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300">
              {t('messages.reply')}
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('messages.noMessages')}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-50 dark:divide-gray-700">
            {messages.map((msg) => (
              <li key={msg.id} onClick={() => openMessage(msg)}
                className={`flex cursor-pointer items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-700/50 ${!msg.is_read && msg.recipient === user?.id ? 'bg-primary-50/30 dark:bg-primary-900/20' : ''}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 text-xs font-bold text-primary-700 dark:text-primary-400">
                  {(folder === 'inbox' ? msg.sender_name : msg.recipient_name).charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`truncate text-sm ${!msg.is_read && msg.recipient === user?.id ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                      {folder === 'inbox' ? msg.sender_name : msg.recipient_name}
                    </p>
                    {!msg.is_read && msg.recipient === user?.id && (
                      <span className="h-2 w-2 rounded-full bg-primary-500" />
                    )}
                  </div>
                  <p className="truncate text-xs text-gray-400 dark:text-gray-500">{msg.subject}</p>
                </div>
                <span className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500">
                  {new Date(msg.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
