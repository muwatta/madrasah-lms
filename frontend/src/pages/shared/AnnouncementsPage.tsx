import { useState, useEffect } from 'react';
import { announcementAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { SkeletonCard } from '../../components/Skeleton';

interface Announcement {
  id: number;
  title: string;
  title_ar: string;
  message: string;
  audience: 'all' | 'parents' | 'teachers' | 'students';
  is_pinned: boolean;
  created_by_name: string;
  created_at: string;
}

const audienceColors: Record<string, string> = {
  all: 'bg-blue-100 text-blue-700',
  parents: 'bg-purple-100 text-purple-700',
  teachers: 'bg-green-100 text-green-700',
  students: 'bg-amber-100 text-amber-700',
};

export default function AnnouncementsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'mudeer';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', title_ar: '', message: '', audience: 'all', is_pinned: false });
  const [submitting, setSubmitting] = useState(false);

  const loadAnnouncements = () => {
    setLoading(true);
    announcementAPI.list()
      .then((res) => setAnnouncements(res.data.results ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAnnouncements(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message) return;
    setSubmitting(true);
    try {
      await announcementAPI.create({
        title: form.title,
        title_ar: form.title_ar,
        message: form.message,
        audience: form.audience,
        is_pinned: form.is_pinned,
      });
      setShowForm(false);
      setForm({ title: '', title_ar: '', message: '', audience: 'all', is_pinned: false });
      loadAnnouncements();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await announcementAPI.delete(id);
      loadAnnouncements();
    } catch {
    }
  };

  const pinned = announcements.filter((a) => a.is_pinned);
  const unpinned = announcements.filter((a) => !a.is_pinned);
  const sorted = [...pinned, ...unpinned];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('announcements.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('announcements.subtitle')}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {t('announcements.create')}
          </button>
        )}
      </div>

      {showForm && (
        <div className="animate-slide-down rounded-xl border border-primary-100 dark:border-primary-800 bg-white dark:bg-gray-800 p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{t('announcements.newAnnouncement')}</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{t('announcements.titleLabel')}</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{t('announcements.titleLabelAr')}</label>
                <input type="text" dir="rtl" value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{t('announcements.message')}</label>
              <textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{t('announcements.audience')}</label>
                <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none">
                  <option value="all">{t('announcements.audienceAll')}</option>
                  <option value="parents">{t('announcements.audienceParents')}</option>
                  <option value="teachers">{t('announcements.audienceTeachers')}</option>
                  <option value="students">{t('announcements.audienceStudents')}</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                  <input type="checkbox" checked={form.is_pinned} onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  {t('announcements.pin')}
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting || !form.title || !form.message}
                className="btn-press rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                {submitting ? t('common.saving') : t('announcements.publish')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('announcements.empty')}</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{t('announcements.emptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((announcement, idx) => (
            <div key={announcement.id}
              className={`card-hover opacity-0 animate-slide-up rounded-xl border bg-white dark:bg-gray-800 p-5 shadow-sm transition-shadow hover:shadow-md ${announcement.is_pinned ? 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10' : 'border-gray-100 dark:border-gray-700'}`}
              style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {announcement.is_pinned && (
                      <svg className="h-4 w-4 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" /></svg>
                    )}
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{announcement.title}</h3>
                    {announcement.title_ar && (
                      <span className="text-sm text-gray-400 dark:text-gray-500" dir="rtl">{announcement.title_ar}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-gray-400 dark:text-gray-500">
                    <span>{announcement.created_by_name}</span>
                    <span>•</span>
                    <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${audienceColors[announcement.audience] || audienceColors.all}`}>
                      {t(`announcements.audience${announcement.audience.charAt(0).toUpperCase() + announcement.audience.slice(1)}`)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{announcement.message}</p>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(announcement.id)}
                    className="shrink-0 rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                    title={t('announcements.delete')}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
