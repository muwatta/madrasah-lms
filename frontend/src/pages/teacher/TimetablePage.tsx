import { useEffect, useState } from 'react';
import { academicAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import LoadingSpinner from '../../components/LoadingSpinner';

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
const DAYS_AR = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

export default function TimetablePage() {
  const { language } = useLanguage();
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    academicAPI.teacherTimetable()
      .then((res) => setSlots(res.data))
      .catch(() => setError('Failed to load timetable'))
      .finally(() => setLoading(false));
  }, []);

  const groupedSlots: TimetableSlot[][] = Array.from({ length: 7 }, () => []);
  slots.forEach((s) => {
    if (s.day_of_week >= 0 && s.day_of_week < 7) {
      groupedSlots[s.day_of_week].push(s);
    }
  });

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">{language === 'ar' ? 'جدول الحصص' : 'My Timetable'}</h1>
      </div>
      <p className="mb-6 text-sm text-gray-500">{language === 'ar' ? 'جدول الحصص الدراسية' : 'Your weekly class schedule'}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {slots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm font-medium text-gray-900">{language === 'ar' ? 'لا توجد حصص مجدولة' : 'No classes scheduled'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="sticky end-0 bg-gray-50/80 px-4 py-3 text-end text-xs font-medium text-gray-500 w-24">
                  {language === 'ar' ? 'اليوم' : 'Day'}
                </th>
                {Array.from({ length: 9 }, (_, i) => (
                  <th key={i} className="px-3 py-3 text-center text-xs font-medium text-gray-500 min-w-[110px]">
                    {8 + i}:00
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {groupedSlots.map((daySlots, dayIdx) => (
                <tr key={dayIdx} className="hover:bg-gray-50/60">
                  <td className="sticky end-0 bg-white px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">
                    {language === 'ar' ? DAYS_AR[dayIdx] : DAYS[dayIdx]}
                  </td>
                  {Array.from({ length: 9 }, (_, periodIdx) => {
                    const hour = 8 + periodIdx;
                    const slot = daySlots.find((s) => {
                      const startH = parseInt(s.start_time.split(':')[0], 10);
                      return startH === hour;
                    });
                    return (
                      <td key={periodIdx} className={`px-3 py-2 text-center border-s border-gray-50 ${slot ? 'bg-primary-50/50' : ''}`}>
                        {slot && (
                          <div className="rounded-lg bg-white px-2.5 py-2 shadow-sm border border-primary-100">
                            <p className="text-xs font-semibold text-primary-700">{slot.subject_name}</p>
                            <p className="text-[10px] text-gray-400">{slot.start_time} - {slot.end_time}</p>
                            {slot.room && <p className="text-[10px] text-gray-400">{slot.room}</p>}
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
