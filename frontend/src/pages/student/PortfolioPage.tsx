import { useEffect, useState } from 'react';
import { analyticsAPI } from '../../api';
import { unwrapPaginated } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import LoadingSpinner from '../../components/LoadingSpinner';

interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  item_type: string;
  url: string;
  file_url?: string;
  date: string;
  created_at: string;
}

const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  project: { bg: 'bg-blue-100', text: 'text-blue-700' },
  certificate: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  award: { bg: 'bg-amber-100', text: 'text-amber-700' },
  achievement: { bg: 'bg-purple-100', text: 'text-purple-700' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

const TYPE_ICONS: Record<string, string> = {
  project: 'M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776',
  certificate: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342',
  award: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.015 6.015 0 01-3.77 1.493m-3.77-1.493a6.015 6.015 0 00-2.48-5.228',
  achievement: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
  other: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PortfolioPage() {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', item_type: 'project', url: '', date: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmitting] = useState(false);

  const loadItems = () => {
    setLoading(true);
    analyticsAPI.portfolio.list()
      .then((res) => setItems(unwrapPaginated(res.data)))
      .catch(() => setError(t('common.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadItems(); }, [t]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      await analyticsAPI.portfolio.create(form);
      setShowModal(false);
      setForm({ title: '', description: '', item_type: 'project', url: '', date: new Date().toISOString().split('T')[0] });
      loadItems();
    } catch {
      setError(t('common.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await analyticsAPI.portfolio.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError(t('common.deleteFailed'));
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{language === 'ar' ? 'المحفظة الرقمية' : 'Digital Portfolio'}</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {language === 'ar' ? 'إضافة عنصر' : 'Add Item'}
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">{language === 'ar' ? 'عرض إنجازاتك ومشاريعك' : 'Showcase your projects and achievements'}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError('')} className="me-2 underline">{t('common.close')}</button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <svg className="h-8 w-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" /></svg>
          </div>
          <p className="text-sm font-medium text-gray-900">{language === 'ar' ? 'محفظتك فارغة' : 'Your portfolio is empty'}</p>
          <p className="mt-1 text-xs text-gray-400">{language === 'ar' ? 'ابدأ بإضافة مشاريعك وإنجازاتك' : 'Start by adding your projects and achievements'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, idx) => {
            const style = TYPE_STYLES[item.item_type] || TYPE_STYLES.other;
            return (
              <div
                key={item.id}
                className="card-hover opacity-0 animate-slide-up rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {item.file_url && (
                  <div className="aspect-video overflow-hidden rounded-t-xl bg-gray-100">
                    <img src={item.file_url} alt={item.title} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}>
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={TYPE_ICONS[item.item_type] || TYPE_ICONS.other} />
                        </svg>
                        {item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title={t('common.delete')}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  <h3 className="mb-1 text-base font-bold text-gray-900">{item.title}</h3>
                  {item.description && (
                    <p className="mb-3 text-sm text-gray-600 line-clamp-3">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{item.date ? formatDate(item.date) : formatDate(item.created_at)}</span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                      >
                        {language === 'ar' ? 'رابط' : 'Link'}
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-900">{language === 'ar' ? 'إضافة عنصر جديد' : 'Add New Item'}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">{language === 'ar' ? 'النوع' : 'Type'}</label>
                <select value={form.item_type} onChange={(e) => setForm({ ...form, item_type: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none">
                  <option value="project">{language === 'ar' ? 'مشروع' : 'Project'}</option>
                  <option value="certificate">{language === 'ar' ? 'شهادة' : 'Certificate'}</option>
                  <option value="award">{language === 'ar' ? 'جائزة' : 'Award'}</option>
                  <option value="achievement">{language === 'ar' ? 'إنجاز' : 'Achievement'}</option>
                  <option value="other">{language === 'ar' ? 'آخر' : 'Other'}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">{language === 'ar' ? 'العنوان' : 'Title'}</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none"
                  required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الوصف' : 'Description'}</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">{language === 'ar' ? 'التاريخ' : 'Date'}</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الرابط' : 'URL'}</label>
                  <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting || !form.title.trim()}
                  className="btn-press rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                  {submitting ? t('common.saving') : t('common.save')}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
