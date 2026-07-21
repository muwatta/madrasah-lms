import { useEffect, useState } from 'react';
import { academicAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { SkeletonTable } from '../../components/Skeleton';

interface TimetableSlot {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: number;
  subject_name: string;
  teacher: number | null;
  teacher_name: string | null;
  room: string;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function TimetablePage() {
  const { t } = useLanguage();
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    academicAPI.teacherTimetable()
      .then((res) => setSlots(res.data))
      .catch(() => setError(t('timetable.loadFailed')))
      .finally(() => setLoading(false));
  }, []);

  const groupedSlots: TimetableSlot[][] = Array.from({ length: 7 }, () => []);
  slots.forEach((s) => {
    if (s.day_of_week >= 0 && s.day_of_week < 7) {
      groupedSlots[s.day_of_week].push(s);
    }
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-2">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="mb-6 h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <SkeletonTable rows={7} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] dark:text-gray-100">{t('nav.timetable')}</h1>
      </div>
      <p className="mb-6 text-sm text-[var(--color-text-muted)] dark:text-gray-400">{t('timetable.subtitle')}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      {slots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 py-16 text-center">
          <p className="text-sm font-medium text-[var(--color-text-primary)] dark:text-gray-100">{t('calendar.noClasses')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-light)] dark:border-gray-700 bg-[var(--color-bg-secondary)] dark:bg-gray-700/50">
                <th className="sticky end-0 bg-[var(--color-bg-secondary)] dark:bg-gray-700/50 px-4 py-3 text-end text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400 w-24">
                  {t('timetable.day')}
                </th>
                {Array.from({ length: 9 }, (_, i) => (
                  <th key={i} className="px-3 py-3 text-center text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400 min-w-[110px]">
                    {8 + i}:00
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-light)] dark:divide-gray-700/50">
              {groupedSlots.map((daySlots, dayIdx) => (
                <tr key={dayIdx} className="hover:bg-[var(--color-bg-secondary)] dark:hover:bg-gray-700/30">
                  <td className="sticky end-0 bg-[var(--color-bg-primary)] dark:bg-gray-800 px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] dark:text-gray-300 whitespace-nowrap">
                    {t('timetable.' + DAYS[dayIdx])}
                  </td>
                  {Array.from({ length: 9 }, (_, periodIdx) => {
                    const hour = 8 + periodIdx;
                    const slot = daySlots.find((s) => {
                      const startH = parseInt(s.start_time.split(':')[0], 10);
                      return startH === hour;
                    });
                    return (
                      <td key={periodIdx} className={`px-3 py-2 text-center border-s border-[var(--color-border-light)] dark:border-gray-700/50 ${slot ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
                        {slot && (
                          <div className="rounded-lg bg-[var(--color-bg-primary)] dark:bg-gray-800 px-2.5 py-2 shadow-sm border border-primary-100 dark:border-primary-800">
                            <p className="text-xs font-semibold text-primary-700 dark:text-primary-400">{slot.subject_name}</p>
                            <p className="text-[10px] text-[var(--color-text-muted)] dark:text-gray-400">{slot.start_time} - {slot.end_time}</p>
                            {slot.room && <p className="text-[10px] text-[var(--color-text-muted)] dark:text-gray-400">{slot.room}</p>}
                          </div>
                        )}
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
  );
}
