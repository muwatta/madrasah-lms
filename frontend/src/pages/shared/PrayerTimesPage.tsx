import { useEffect, useState } from 'react';
import { quranAPI } from '../../api';
import { unwrapPaginated } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Skeleton, SkeletonCard, SkeletonTable } from '../../components/Skeleton';

interface PrayerTime {
  id: number;
  date: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
const PRAYER_LABELS: Record<string, { en: string; ar: string }> = {
  fajr: { en: 'Fajr', ar: 'الفجر' },
  sunrise: { en: 'Sunrise', ar: 'الشروق' },
  dhuhr: { en: 'Dhuhr', ar: 'الظهر' },
  asr: { en: 'Asr', ar: 'العصر' },
  maghrib: { en: 'Maghrib', ar: 'المغرب' },
  isha: { en: 'Isha', ar: 'العشاء' },
};
const PRAYER_COLORS: Record<string, string> = {
  fajr: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400',
  sunrise: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
  dhuhr: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400',
  asr: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400',
  maghrib: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400',
  isha: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400',
};
const PRAYER_ICONS: Record<string, string> = {
  fajr: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
  sunrise: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
  dhuhr: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
  asr: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
  maghrib: 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z',
  isha: 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function toInputDate(d: Date) {
  return d.toISOString().split('T')[0];
}

export default function PrayerTimesPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'mudeer';

  const [today, setToday] = useState<PrayerTime | null>(null);
  const [yesterday, setYesterday] = useState<PrayerTime | null>(null);
  const [monthData, setMonthData] = useState<PrayerTime[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(toInputDate(new Date()));
  const [form, setForm] = useState<Record<string, string>>({ fajr: '', sunrise: '', dhuhr: '', asr: '', maghrib: '', isha: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    const todayStr = toInputDate(new Date());
    const yesterdayStr = toInputDate(new Date(Date.now() - 86400000));

    Promise.all([
      quranAPI.prayerTimes.today().catch(() => ({ data: null as PrayerTime | null })),
      quranAPI.prayerTimes.list({ date: todayStr }).catch(() => ({ data: [] as any })),
      quranAPI.prayerTimes.list({ date: yesterdayStr }).catch(() => ({ data: [] as any })),
    ])
      .then(([todayRes, todayListRes, yesterdayListRes]) => {
        const today = todayRes as unknown as { data: PrayerTime | null };
        const todayList = todayListRes as unknown as { data: any };
        const yesterdayList = yesterdayListRes as unknown as { data: any };
        if (today.data) {
          setToday(today.data);
        } else {
          const list = unwrapPaginated(todayList.data);
          if (list.length > 0) setToday(list[0] as PrayerTime);
        }
        const yList = unwrapPaginated(yesterdayList.data);
        if (yList.length > 0) setYesterday(yList[0] as PrayerTime);
      })
      .catch(() => setError(t('common.loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    quranAPI.prayerTimes.list({ year, month })
      .then((res) => setMonthData(unwrapPaginated(res.data)))
      .catch(() => {});
  }, [currentDate]);

  const navigateMonth = (dir: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + dir);
      return next;
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await quranAPI.prayerTimes.create({ date: formDate, ...form });
      setShowForm(false);
      setForm({ fajr: '', sunrise: '', dhuhr: '', asr: '', maghrib: '', isha: '' });
      const todayStr = toInputDate(new Date());
      if (formDate === todayStr) {
        const res = await quranAPI.prayerTimes.today().catch(() => quranAPI.prayerTimes.list({ date: todayStr }));
        const data = (res as any).data;
        setToday(data.results ? data.results[0] : data);
      }
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const monthRes = await quranAPI.prayerTimes.list({ year, month });
      setMonthData(unwrapPaginated(monthRes.data));
    } catch {
      setError(t('common.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{language === 'ar' ? 'مواقيت الصلاة' : 'Prayer Times'}</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{language === 'ar' ? 'عرض مواقيت الصلاة اليومية' : 'View daily prayer times'}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
          <button onClick={() => setError('')} className="me-2 underline">{t('common.close')}</button>
        </div>
      )}

      {isAdmin && (
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {language === 'ar' ? 'إضافة مواقيت' : 'Add Prayer Times'}
          </button>
        </div>
      )}

      {showForm && (
        <div className="animate-slide-down mb-6 rounded-xl border border-primary-100 dark:border-primary-800 bg-white dark:bg-gray-800 p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{language === 'ar' ? 'مواقيت جديدة' : 'New Prayer Times'}</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{language === 'ar' ? 'التاريخ' : 'Date'}</label>
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none sm:max-w-xs" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {PRAYER_KEYS.map((key) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{PRAYER_LABELS[key][language === 'ar' ? 'ar' : 'en']}</label>
                  <input type="time" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none" />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="btn-press rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                {submitting ? t('common.saving') : t('common.save')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 px-6 py-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{language === 'ar' ? 'مواقيت اليوم' : "Today's Prayer Times"}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">{today ? formatDate(today.date) : '-'}</p>
          </div>
          {today ? (
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
              {PRAYER_KEYS.map((key) => (
                <div key={key} className={`rounded-lg border p-3 text-center ${PRAYER_COLORS[key]}`}>
                  <svg className="mx-auto mb-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={PRAYER_ICONS[key]} />
                  </svg>
                  <p className="text-xs font-medium">{PRAYER_LABELS[key][language === 'ar' ? 'ar' : 'en']}</p>
                  <p className="mt-1 text-lg font-bold">{(today as any)[key]}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-6 text-sm text-gray-500 dark:text-gray-400 text-center">{language === 'ar' ? 'لا توجد مواقيت لهذا اليوم' : 'No prayer times available for today'}</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 px-6 py-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{language === 'ar' ? 'مواقيت أمس' : "Yesterday's Prayer Times"}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">{yesterday ? formatDate(yesterday.date) : '-'}</p>
          </div>
          {yesterday ? (
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
              {PRAYER_KEYS.map((key) => (
                <div key={key} className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-3 text-center">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{PRAYER_LABELS[key][language === 'ar' ? 'ar' : 'en']}</p>
                  <p className="mt-1 text-lg font-bold text-gray-700 dark:text-gray-300">{(yesterday as any)[key]}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-6 text-sm text-gray-500 dark:text-gray-400 text-center">{language === 'ar' ? 'لا توجد مواقيت لأمس' : 'No prayer times available for yesterday'}</p>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 px-6 py-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{language === 'ar' ? 'العرض الشهري' : 'Monthly View'}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => navigateMonth(-1)} className="rounded-lg border border-gray-200 dark:border-gray-600 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="min-w-[140px] text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
              {currentDate.toLocaleString(language === 'ar' ? 'ar' : 'en', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => navigateMonth(1)} className="rounded-lg border border-gray-200 dark:border-gray-600 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        {monthData.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 dark:text-gray-400 text-center">{language === 'ar' ? 'لا توجد مواقيت لهذا الشهر' : 'No prayer times for this month'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                  {PRAYER_KEYS.map((key) => (
                    <th key={key} className="px-4 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {PRAYER_LABELS[key][language === 'ar' ? 'ar' : 'en']}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {monthData.map((pt) => {
                  const isToday = pt.date === toInputDate(new Date());
                  return (
                    <tr key={pt.id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-700/50 ${isToday ? 'bg-primary-50/50 dark:bg-primary-900/20' : ''}`}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {new Date(pt.date).toLocaleDateString(language === 'ar' ? 'ar' : 'en', { weekday: 'short', day: 'numeric' })}
                        {isToday && <span className="ms-2 inline-block rounded-full bg-primary-100 dark:bg-primary-900/30 px-2 py-0.5 text-[10px] font-semibold text-primary-700 dark:text-primary-400">{language === 'ar' ? 'اليوم' : 'Today'}</span>}
                      </td>
                      {PRAYER_KEYS.map((key) => (
                        <td key={key} className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{(pt as any)[key]}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
