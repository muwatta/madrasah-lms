import { useEffect, useState } from 'react';
import { academicAPI } from '../../api';
import { unwrapPaginated } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { SkeletonCard } from '../../components/Skeleton';

interface Timetable {
  id: number;
  name: string;
  school_class_name: string;
  term_name: string;
  is_active: boolean;
}

interface TimetableSlot {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject_name: string;
  teacher_name: string;
  room: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_AR = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
const HOURS = Array.from({ length: 10 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

export default function AdminTimetablePage() {
  const { language } = useLanguage();
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selected, setSelected] = useState<Timetable | null>(null);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    academicAPI.timetables.list()
      .then((res) => setTimetables(unwrapPaginated(res.data)))
      .catch(() => setError('Failed to load timetables'))
      .finally(() => setLoading(false));
  }, []);

  const loadSlots = async (tt: Timetable) => {
    setSelected(tt);
    setSlotsLoading(true);
    setConflicts([]);
    try {
      const res = await academicAPI.timetables.slots(tt.id);
      setSlots(unwrapPaginated(res.data));
    } catch {
      setError('Failed to load timetable slots');
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selected) return;
    setGenerating(true);
    try {
      await academicAPI.timetables.generate(selected.id);
      await loadSlots(selected);
    } catch {
      setError(language === 'ar' ? 'فشل التوليد' : 'Failed to generate slots');
    } finally {
      setGenerating(false);
    }
  };

  const handleDetectConflicts = async () => {
    if (!selected) return;
    try {
      const res = await academicAPI.timetables.detectConflicts(selected.id);
      setConflicts(res.data.conflicts || []);
    } catch {
      setError(language === 'ar' ? 'فشل الكشف عن التعارضات' : 'Failed to detect conflicts');
    }
  };

  const handleDelete = async (tt: Timetable) => {
    if (!(language === 'ar' ? confirm('حذف هذا الجدول؟') : confirm('Delete this timetable?'))) return;
    try {
      await academicAPI.timetables.delete(tt.id);
      setTimetables((prev) => prev.filter((t) => t.id !== tt.id));
      if (selected?.id === tt.id) setSelected(null);
    } catch {
      setError(language === 'ar' ? 'فشل الحذف' : 'Failed to delete');
    }
  };

  const getSlotAt = (day: number, hour: string) =>
    slots.find((s) => {
      const slotDay = s.day_of_week;
      const slotHour = s.start_time.substring(0, 2);
      return slotDay === day && slotHour === hour.replace(':00', '');
    });

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {language === 'ar' ? 'إدارة الجداول' : 'Timetable Management'}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {language === 'ar' ? 'إنشاء وإدارة جداول الحصص' : 'Create and manage class timetables'}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <div className="border-b border-gray-100 dark:border-gray-700 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {language === 'ar' ? 'الجداول' : 'Timetables'}
              </h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
              {timetables.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? 'لا توجد جداول' : 'No timetables'}
                </p>
              ) : (
                timetables.map((tt) => (
                  <button
                    key={tt.id}
                    onClick={() => loadSlots(tt)}
                    className={`w-full px-4 py-3 text-left transition-colors ${
                      selected?.id === tt.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-primary-600'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{tt.school_class_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{tt.term_name}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        tt.is_active
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {tt.is_active ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 px-4 py-3">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">{selected.name}</h2>
                <div className="flex items-center gap-2">
                  <button onClick={handleDetectConflicts} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {language === 'ar' ? 'كشف التعارضات' : 'Conflicts'}
                  </button>
                  <button onClick={handleGenerate} disabled={generating} className="btn-press inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50">
                    {generating ? (language === 'ar' ? 'جارٍ...' : 'Generating...') : (language === 'ar' ? 'توليد تلقائي' : 'Auto-generate')}
                  </button>
                  <button onClick={() => handleDelete(selected)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 dark:border-red-600 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                    {language === 'ar' ? 'حذف' : 'Delete'}
                  </button>
                </div>
              </div>

              {conflicts.length > 0 && (
                <div className="mx-4 mt-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    {language === 'ar' ? `${conflicts.length} تعارضات` : `${conflicts.length} conflict(s)`}
                  </p>
                  {conflicts.map((c: any, i: number) => (
                    <p key={i} className="text-xs text-amber-700 dark:text-amber-400 mt-1">{c.message || JSON.stringify(c)}</p>
                  ))}
                </div>
              )}

              {slotsLoading ? (
                <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}
                </div>
              ) : slots.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? 'لا توجد حصص. استخدم التوليد التلقائي.' : 'No slots. Use auto-generate.'}
                </div>
              ) : (
                <div className="overflow-x-auto p-4">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="w-20 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-750 px-2 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400"></th>
                        {(language === 'ar' ? DAYS_AR : DAYS).map((d, i) => (
                          <th key={i} className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-750 px-2 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                            {d}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {HOURS.map((hour) => (
                        <tr key={hour}>
                          <td className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-750 px-2 py-2 text-center text-xs font-mono text-gray-500 dark:text-gray-400">
                            {hour}
                          </td>
                          {DAYS.map((_, dayIdx) => {
                            const slot = getSlotAt(dayIdx, hour);
                            return (
                              <td key={dayIdx} className="border border-gray-200 dark:border-gray-600 px-2 py-1.5 text-center">
                                {slot ? (
                                  <div className="rounded bg-primary-50 dark:bg-primary-900/30 p-1">
                                    <p className="text-xs font-medium text-primary-700 dark:text-primary-400 leading-tight">{slot.subject_name}</p>
                                    {slot.teacher_name && <p className="text-[10px] text-primary-500 dark:text-primary-300 leading-tight">{slot.teacher_name}</p>}
                                    {slot.room && <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{slot.room}</p>}
                                  </div>
                                ) : null}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-24 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                {language === 'ar' ? 'اختر جدولاً من القائمة' : 'Select a timetable from the list'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
