import { useState, useEffect } from 'react';
import { whatsappAPI, userAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { SkeletonTable } from '../../components/Skeleton';

interface Template {
  id: number; name: string; message_type: string;
  body_ar: string; body_en: string; variables: string[]; is_active: boolean;
}
interface Recipient {
  id: number; parent_name: string; phone_number: string;
  is_opted_in: boolean; language: string;
}
interface Message {
  id: number; recipient_name: string; message_type: string;
  body: string; status: string; created_at: string;
}

export default function WhatsAppPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<'templates'|'recipients'|'messages'|'send'>('templates');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', message_type: 'general', body_ar: '', body_en: '', variables: '' });
  const [sendForm, setSendForm] = useState({ parent_id: 0, message_type: 'general', body: '', phone_number: '', language: 'ar' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
    userAPI.list({ role: 'parent' }).then(r => setParents(r.data.results ?? r.data)).catch(() => {});
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'templates') {
        const r = await whatsappAPI.templates.list(); setTemplates(r.data.results ?? r.data);
      } else if (tab === 'recipients') {
        const r = await whatsappAPI.recipients.list(); setRecipients(r.data.results ?? r.data);
      } else if (tab === 'messages') {
        const r = await whatsappAPI.messages.list(); setMessages(r.data.results ?? r.data);
      }
    } catch {}
    setLoading(false);
  };

  const handleCreateTemplate = async () => {
    try {
      await whatsappAPI.templates.create({
        ...form, variables: form.variables.split(',').map(v => v.trim()).filter(Boolean),
      });
      setShowForm(false); setForm({ name: '', message_type: 'general', body_ar: '', body_en: '', variables: '' });
      loadData();
    } catch {}
  };

  const handleDeleteTemplate = async (id: number) => {
    if (confirm(t('common.confirm'))) {
      await whatsappAPI.templates.delete(id); loadData();
    }
  };

  const handleSend = async () => {
    if (!sendForm.parent_id || !sendForm.body) return;
    setSending(true);
    try {
      await whatsappAPI.send(sendForm);
      setSendForm({ parent_id: 0, message_type: 'general', body: '', phone_number: '', language: 'ar' });
    } catch {}
    setSending(false);
  };

  const TABS = [
    { key: 'templates', label: 'Templates' },
    { key: 'recipients', label: 'Recipients' },
    { key: 'messages', label: 'Messages' },
    { key: 'send', label: 'Send Message' },
  ] as const;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold dark:text-[var(--color-text-primary)]">WhatsApp</h1>
      <div className="mb-4 flex gap-2 border-b">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>{t.label}</button>
        ))}
      </div>

      {tab === 'templates' && (
        <div>
          <button onClick={() => setShowForm(!showForm)}
            className="mb-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            {showForm ? 'Cancel' : 'New Template'}
          </button>
          {showForm && (
            <div className="mb-6 rounded-lg border p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input placeholder="Name" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                  className="input-field dark:bg-[var(--color-bg-primary)] dark:text-[var(--color-text-primary)] dark:border-[var(--color-border)]" />
                <select value={form.message_type} onChange={e => setForm(p => ({...p, message_type: e.target.value}))}
                  className="input-field dark:bg-[var(--color-bg-primary)] dark:text-[var(--color-text-primary)] dark:border-[var(--color-border)]">
                  {['result','attendance','fee_reminder','announcement','homework','general'].map(mt => (
                    <option key={mt} value={mt}>{mt}</option>
                  ))}
                </select>
                <textarea placeholder="Body (Arabic)" value={form.body_ar} onChange={e => setForm(p => ({...p, body_ar: e.target.value}))}
                  className="input-field col-span-2 dark:bg-[var(--color-bg-primary)] dark:text-[var(--color-text-primary)] dark:border-[var(--color-border)]" rows={3} />
                <textarea placeholder="Body (English)" value={form.body_en} onChange={e => setForm(p => ({...p, body_en: e.target.value}))}
                  className="input-field col-span-2 dark:bg-[var(--color-bg-primary)] dark:text-[var(--color-text-primary)] dark:border-[var(--color-border)]" rows={3} />
                <input placeholder="Variables (comma-separated)" value={form.variables}
                  onChange={e => setForm(p => ({...p, variables: e.target.value}))} className="input-field col-span-2 dark:bg-[var(--color-bg-primary)] dark:text-[var(--color-text-primary)] dark:border-[var(--color-border)]" />
              </div>
              <button onClick={handleCreateTemplate} className="mt-3 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white">Save</button>
            </div>
          )}
          {loading ? <SkeletonTable rows={5} /> : (
            <div className="overflow-x-auto rounded-lg border dark:border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>
                  <th className="px-4 py-3 text-start font-medium">Name</th>
                  <th className="px-4 py-3 text-start font-medium">Type</th>
                  <th className="px-4 py-3 text-start font-medium">Active</th>
                  <th className="px-4 py-3 text-start font-medium">Actions</th>
                </tr></thead>
                <tbody>
                  {templates.map(tmpl => (
                    <tr key={tmpl.id} className="border-t dark:border-[var(--color-border)]">
                      <td className="px-4 py-3">{tmpl.name}</td>
                      <td className="px-4 py-3">{tmpl.message_type}</td>
                      <td className="px-4 py-3">{tmpl.is_active ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteTemplate(tmpl.id)} className="text-red-600 hover:text-red-800">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'recipients' && (
        loading ? <SkeletonTable rows={5} /> : (
          <div className="overflow-x-auto rounded-lg border dark:border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-3 text-start font-medium">Parent</th>
                <th className="px-4 py-3 text-start font-medium">Phone</th>
                <th className="px-4 py-3 text-start font-medium">Opted In</th>
                <th className="px-4 py-3 text-start font-medium">Language</th>
              </tr></thead>
              <tbody>
                {recipients.map(r => (
                  <tr key={r.id} className="border-t dark:border-[var(--color-border)]">
                    <td className="px-4 py-3">{r.parent_name}</td>
                    <td className="px-4 py-3">{r.phone_number}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${r.is_opted_in ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {r.is_opted_in ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{r.language}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'messages' && (
        loading ? <SkeletonTable rows={5} /> : (
          <div className="overflow-x-auto rounded-lg border dark:border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-3 text-start font-medium">Recipient</th>
                <th className="px-4 py-3 text-start font-medium">Type</th>
                <th className="px-4 py-3 text-start font-medium">Status</th>
                <th className="px-4 py-3 text-start font-medium">Body</th>
                <th className="px-4 py-3 text-start font-medium">Sent At</th>
              </tr></thead>
              <tbody>
                {messages.map(m => (
                  <tr key={m.id} className="border-t dark:border-[var(--color-border)]">
                    <td className="px-4 py-3">{m.recipient_name}</td>
                    <td className="px-4 py-3">{m.message_type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        m.status === 'sent' ? 'bg-green-100 text-green-700' :
                        m.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{m.status}</span>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3">{m.body}</td>
                    <td className="px-4 py-3">{m.created_at ? new Date(m.created_at).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'send' && (
        <div className="max-w-lg rounded-lg border dark:border-[var(--color-border)] p-6">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium dark:text-[var(--color-text-secondary)]">Parent</label>
            <select value={sendForm.parent_id} onChange={e => setSendForm(p => ({...p, parent_id: Number(e.target.value)}))}
              className="input-field dark:bg-[var(--color-bg-primary)] dark:text-[var(--color-text-primary)] dark:border-[var(--color-border)]">
              <option value={0}>Select parent...</option>
              {parents.map(p => (
                <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium dark:text-[var(--color-text-secondary)]">Type</label>
            <select value={sendForm.message_type} onChange={e => setSendForm(p => ({...p, message_type: e.target.value}))}
              className="input-field dark:bg-[var(--color-bg-primary)] dark:text-[var(--color-text-primary)] dark:border-[var(--color-border)]">
              {['general','result','attendance','fee_reminder','announcement','homework'].map(mt => (
                <option key={mt} value={mt}>{mt}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium dark:text-[var(--color-text-secondary)]">Message</label>
            <textarea value={sendForm.body} onChange={e => setSendForm(p => ({...p, body: e.target.value}))}
              className="input-field dark:bg-[var(--color-bg-primary)] dark:text-[var(--color-text-primary)] dark:border-[var(--color-border)]" rows={4} placeholder="Type your message here..." />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium dark:text-[var(--color-text-secondary)]">Phone Number</label>
            <input value={sendForm.phone_number} onChange={e => setSendForm(p => ({...p, phone_number: e.target.value}))}
              className="input-field dark:bg-[var(--color-bg-primary)] dark:text-[var(--color-text-primary)] dark:border-[var(--color-border)]" placeholder="+1234567890" />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium dark:text-[var(--color-text-secondary)]">Language</label>
            <select value={sendForm.language} onChange={e => setSendForm(p => ({...p, language: e.target.value}))}
              className="input-field dark:bg-[var(--color-bg-primary)] dark:text-[var(--color-text-primary)] dark:border-[var(--color-border)]">
              <option value="ar">Arabic</option>
              <option value="en">English</option>
            </select>
          </div>
          <button onClick={handleSend} disabled={sending || !sendForm.parent_id || !sendForm.body}
            className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      )}
    </div>
  );
}
