import { useEffect, useState } from 'react';
import { academicAPI, lessonAPI } from '../../api';

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

interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  subject_name?: string;
}

interface HomeworkItem {
  id: number;
  title: string;
  description: string;
  due_date: string;
  subject_name: string;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAYS_AR = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

const EVENT_COLORS: Record<string, string> = {
  holiday: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  exam: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  event: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  deadline: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  homework: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  other: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
};

export default function CalendarPage() {
  const { language } = useLanguage();
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timetable' | 'events'>('timetable');

  useEffect(() => {
    Promise.all([
      academicAPI.studentTimetable(),
      academicAPI.studentCalendarEvents(),
      lessonAPI.homework.list({ published: true }),
    ])
      .then(([ttRes, calRes]) => {
        setSlots(ttRes.data);
        const calData = calRes.data;
        setEvents(calData.events || []);
        setHomework(calData.homework || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allEvents: CalendarEvent[] = [
    ...events,
    ...homework.map((h) => ({
      id: h.id,
      title: h.title,
      description: h.description,
      event_type: 'homework' as const,
      start_date: h.due_date,
      end_date: h.due_date,
      subject_name: h.subject_name,
    })),
  ];

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
          <div className="h-8 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="mb-6 h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-6 flex gap-2">
          <div className="h-10 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-10 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
        <SkeletonTable rows={7} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] dark:text-gray-100">{language === 'ar' ? 'جدولي' : 'My Schedule'}</h1>
      </div>
      <p className="mb-6 text-sm text-[var(--color-text-muted)] dark:text-gray-400">{language === 'ar' ? 'الجدول الدراسي والأحداث' : 'Class timetable and upcoming events'}</p>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab('timetable')}
          className={`btn-press rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'timetable' ? 'bg-primary-600 text-white shadow-sm' : 'bg-[var(--color-bg-secondary)] dark:bg-gray-700 text-[var(--color-text-secondary)] dark:text-gray-300 hover:bg-[var(--color-border)] dark:hover:bg-gray-600'}`}
        >
          {language === 'ar' ? 'الجدول' : 'Timetable'}
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`btn-press rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'events' ? 'bg-primary-600 text-white shadow-sm' : 'bg-[var(--color-bg-secondary)] dark:bg-gray-700 text-[var(--color-text-secondary)] dark:text-gray-300 hover:bg-[var(--color-border)] dark:hover:bg-gray-600'}`}
        >
          {language === 'ar' ? 'الأحداث' : 'Events'}
        </button>
      </div>

      {activeTab === 'timetable' && (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-light)] dark:border-gray-700 bg-[var(--color-bg-secondary)] dark:bg-gray-700/50">
                <th className="sticky end-0 bg-[var(--color-bg-secondary)] dark:bg-gray-700/50 px-3 py-3 text-end text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400 w-20">
                  {language === 'ar' ? 'اليوم' : 'Day'}
                </th>
                {Array.from({ length: 9 }, (_, i) => (
                  <th key={i} className="px-3 py-3 text-center text-xs font-medium text-[var(--color-text-muted)] dark:text-gray-400 min-w-[100px]">
                    {8 + i}:00
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-light)] dark:divide-gray-700/50">
              {groupedSlots.map((daySlots, dayIdx) => (
                <tr key={dayIdx} className="hover:bg-[var(--color-bg-secondary)] dark:hover:bg-gray-700/30">
                  <td className="sticky end-0 bg-[var(--color-bg-primary)] dark:bg-gray-800 px-3 py-3 text-xs font-semibold text-[var(--color-text-secondary)] dark:text-gray-300 whitespace-nowrap">
                    {language === 'ar' ? DAYS_AR[dayIdx] : DAYS[dayIdx]}
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
                          <div className="rounded-lg bg-[var(--color-bg-primary)] dark:bg-gray-800 px-2 py-1.5 shadow-sm border border-primary-100 dark:border-primary-800">
                            <p className="text-xs font-semibold text-primary-700 dark:text-primary-400 truncate">{slot.subject_name}</p>
                            {slot.teacher_name && (
                              <p className="text-[10px] text-[var(--color-text-muted)] dark:text-gray-400 truncate">{slot.teacher_name}</p>
                            )}
                            {slot.room && (
                              <p className="text-[10px] text-[var(--color-text-muted)] dark:text-gray-400">{slot.room}</p>
                            )}
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

      {activeTab === 'events' && (
        <div className="space-y-3">
          {allEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 py-16 text-center">
              <p className="text-sm font-medium text-[var(--color-text-primary)] dark:text-gray-100">{language === 'ar' ? 'لا توجد أحداث' : 'No upcoming events'}</p>
            </div>
          ) : (
            allEvents.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
              .map((ev) => (
                <div key={`${ev.event_type}-${ev.id}`} className="card-hover rounded-xl border border-[var(--color-border-light)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-4 shadow-sm hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center min-w-[50px]">
                      <span className="text-lg font-bold text-[var(--color-text-primary)] dark:text-gray-100">{new Date(ev.start_date).getDate()}</span>
                      <span className="text-xs text-[var(--color-text-muted)] dark:text-gray-400">{new Date(ev.start_date).toLocaleDateString(undefined, { month: 'short' })}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] dark:text-gray-100">{ev.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${EVENT_COLORS[ev.event_type] || EVENT_COLORS.other}`}>
                          {ev.event_type === 'homework' ? (language === 'ar' ? 'واجب' : 'Homework') :
                           ev.event_type === 'exam' ? (language === 'ar' ? 'امتحان' : 'Exam') :
                           ev.event_type === 'holiday' ? (language === 'ar' ? 'عطلة' : 'Holiday') :
                           ev.event_type === 'deadline' ? (language === 'ar' ? 'موعد نهائي' : 'Deadline') :
                           ev.event_type === 'event' ? (language === 'ar' ? 'حدث' : 'Event') : ev.event_type}
                        </span>
                      </div>
                      {ev.subject_name && (
                        <p className="text-xs text-[var(--color-text-muted)] dark:text-gray-400 mt-0.5">{ev.subject_name}</p>
                      )}
                      {ev.description && (
                        <p className="text-xs text-[var(--color-text-secondary)] dark:text-gray-300 mt-1 line-clamp-2">{ev.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}
