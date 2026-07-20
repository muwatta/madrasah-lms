import { useEffect, useState } from 'react';
import { analyticsAPI } from '../../api';
import { unwrapPaginated } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import LoadingSpinner from '../../components/LoadingSpinner';

interface TeacherWorkload {
  teacher: number;
  teacher_name: string;
  lesson_plans_count: number;
  homework_count: number;
  ungraded_submissions_count: number;
  upcoming_lessons: number;
}

function getWorkloadLevel(w: TeacherWorkload): 'low' | 'medium' | 'overloaded' {
  const total = w.lesson_plans_count + w.homework_count + w.ungraded_submissions_count + w.upcoming_lessons;
  if (total >= 15) return 'overloaded';
  if (total >= 8) return 'medium';
  return 'low';
}

const LEVEL_STYLES: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-500' },
  overloaded: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', bar: 'bg-red-500' },
};

export default function TeacherWorkloadPage() {
  const { t, language } = useLanguage();
  const [teachers, setTeachers] = useState<TeacherWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'workload'>('workload');

  useEffect(() => {
    analyticsAPI.teacherWorkload.all()
      .then((res) => setTeachers(unwrapPaginated(res.data)))
      .catch(() => setError(t('common.loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  const sorted = [...teachers].sort((a, b) => {
    if (sortBy === 'name') return a.teacher_name.localeCompare(b.teacher_name);
    const aTotal = a.lesson_plans_count + a.homework_count + a.ungraded_submissions_count + a.upcoming_lessons;
    const bTotal = b.lesson_plans_count + b.homework_count + b.ungraded_submissions_count + b.upcoming_lessons;
    return bTotal - aTotal;
  });

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{language === 'ar' ? 'عبء عمل المعلمين' : 'Teacher Workload'}</h1>
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'workload')}
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none">
          <option value="workload">{language === 'ar' ? 'ترتيب حسب العبء' : 'Sort by Workload'}</option>
          <option value="name">{language === 'ar' ? 'ترتيب حسب الاسم' : 'Sort by Name'}</option>
        </select>
      </div>
      <p className="text-sm text-gray-500 mb-6">{language === 'ar' ? 'عرض ومراقبة عبء عمل جميع المعلمين' : 'View and monitor all teachers\' workload'}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError('')} className="me-2 underline">{t('common.close')}</button>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
          </div>
          <p className="text-sm font-medium text-gray-900">{language === 'ar' ? 'لا يوجد معلمين' : 'No teachers found'}</p>
          <p className="mt-1 text-xs text-gray-400">{language === 'ar' ? 'سيظهر عبء العمل هنا بعد إضافة المعلمين' : 'Workload will appear here after teachers are added'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((tw, idx) => {
            const level = getWorkloadLevel(tw);
            const style = LEVEL_STYLES[level];
            const total = tw.lesson_plans_count + tw.homework_count + tw.ungraded_submissions_count + tw.upcoming_lessons;
            const maxLoad = 20;
            const pct = Math.min((total / maxLoad) * 100, 100);

            return (
              <div
                key={tw.teacher}
                className={`card-hover opacity-0 animate-slide-up rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${style.border}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                        {tw.teacher_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{tw.teacher_name}</h3>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.bg} ${style.text}`}>
                          {level === 'low' ? (language === 'ar' ? 'منخفض' : 'Low') : level === 'medium' ? (language === 'ar' ? 'متوسط' : 'Medium') : (language === 'ar' ? 'محمل' : 'Overloaded')}
                        </span>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{total}</span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{language === 'ar' ? 'عبء العمل' : 'Workload'}</span>
                      <span>{total}/{maxLoad}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className={`h-full rounded-full transition-all ${style.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 p-3 text-center">
                      <p className="text-xs text-gray-400">{language === 'ar' ? 'خطط الدروس' : 'Lesson Plans'}</p>
                      <p className="mt-0.5 text-lg font-bold text-gray-900">{tw.lesson_plans_count}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 text-center">
                      <p className="text-xs text-gray-400">{language === 'ar' ? 'الواجبات' : 'Homework'}</p>
                      <p className="mt-0.5 text-lg font-bold text-gray-900">{tw.homework_count}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 text-center">
                      <p className="text-xs text-gray-400">{language === 'ar' ? 'تقييمات معلقة' : 'Ungraded'}</p>
                      <p className="mt-0.5 text-lg font-bold text-gray-900">{tw.ungraded_submissions_count}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 text-center">
                      <p className="text-xs text-gray-400">{language === 'ar' ? 'دروس قادمة' : 'Upcoming'}</p>
                      <p className="mt-0.5 text-lg font-bold text-gray-900">{tw.upcoming_lessons}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
