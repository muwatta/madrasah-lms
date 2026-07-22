import { useEffect, useState } from 'react';
import { enrollmentAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { Skeleton, SkeletonCard } from '../../components/Skeleton';

interface Subject {
  id: number;
  name_ar: string;
  name_en: string;
}

interface Teacher {
  id: number;
  name: string;
}

interface MyEnrollment {
  id: number;
  subject: number;
  subject_name: string;
  subject_name_en: string;
  ustaadh: number | null;
  ustaadh_name: string | null;
  school_class_name: string | null;
  enrolled_at: string;
}

export default function ChooseSubjectsPage() {
  const { t, language } = useLanguage();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<MyEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subjRes, enrollRes] = await Promise.all([
        enrollmentAPI.availableSubjects(),
        enrollmentAPI.myEnrollments(),
      ]);
      setSubjects(subjRes.data);
      const enrollData = enrollRes.data;
      setMyEnrollments(Array.isArray(enrollData) ? enrollData : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubjectClick = async (subjectId: number) => {
    setSelectedSubject(subjectId);
    setSelectedTeacher(null);
    setTeachers([]);
    setError(null);
    try {
      const res = await enrollmentAPI.subjectTeachers(subjectId);
      setTeachers(res.data);
    } catch {
      setTeachers([]);
    }
  };

  const handleEnroll = async () => {
    if (!selectedSubject) return;
    setEnrolling(true);
    setError(null);
    setSuccess(null);
    try {
      await enrollmentAPI.selfEnroll({
        subject: selectedSubject,
        ustaadh: selectedTeacher || undefined,
      });
      setSuccess(language === 'ar' ? 'تم التسجيل بنجاح' : 'Enrolled successfully');
      setSelectedSubject(null);
      setSelectedTeacher(null);
      setTeachers([]);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setEnrolling(false);
    }
  };

  const enrolledIds = new Set(myEnrollments.map((e) => e.subject));

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-80 mb-6" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-emerald-500 p-6 text-white shadow-lg shadow-primary-500/20 sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl dark:text-[var(--color-text-primary)]">
          {language === 'ar' ? 'اختر موادك' : 'Choose Your Subjects'}
        </h1>
        <p className="mt-1 text-sm text-primary-100 dark:text-primary-200">
          {language === 'ar' ? 'اختر المواد التي تريد دراستها' : 'Select the subjects you want to study'}
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          {error}
        </div>
      )}

      {myEnrollments.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[var(--color-border-light)] dark:bg-[var(--color-bg-secondary)]">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-[var(--color-text-primary)]">
            {language === 'ar' ? 'موادك المسجلة' : 'Your Enrolled Subjects'}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myEnrollments.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-xs font-bold text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-[var(--color-text-primary)]">
                    {language === 'ar' ? e.subject_name : e.subject_name_en}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {e.ustaadh_name || '—'}{e.school_class_name ? ` · ${e.school_class_name}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[var(--color-border-light)] dark:bg-[var(--color-bg-secondary)]">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-[var(--color-text-primary)]">
          {language === 'ar' ? 'المواد المتاحة' : 'Available Subjects'}
        </h2>
        {subjects.length === 0 ? (
          <p className="text-sm text-gray-400">{language === 'ar' ? 'لا توجد مواد متاحة' : 'No subjects available'}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => {
              const isEnrolled = enrolledIds.has(s.id);
              const isSelected = selectedSubject === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => !isEnrolled && handleSubjectClick(s.id)}
                  disabled={isEnrolled}
                  className={`card-hover flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                    isEnrolled
                      ? 'border-emerald-200 bg-emerald-50 opacity-60 cursor-default'
                      : isSelected
                        ? 'border-primary-300 bg-primary-50 ring-2 ring-primary-200'
                        : 'border-gray-100 bg-white hover:border-primary-200 hover:shadow-md dark:border-[var(--color-border-light)] dark:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${
                    isEnrolled ? 'bg-emerald-500' : isSelected ? 'bg-primary-500' : 'bg-gray-400'
                  }`}>
                    {isEnrolled ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      (language === 'ar' ? s.name_ar : s.name_en).charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-[var(--color-text-primary)]">
                      {language === 'ar' ? s.name_ar : s.name_en}
                    </p>
                    <p className="text-xs text-gray-400">
                      {isEnrolled
                        ? (language === 'ar' ? 'مسجل' : 'Enrolled')
                        : (language === 'ar' ? 'اضغط للاختيار' : 'Click to select')}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedSubject && !enrolledIds.has(selectedSubject) && (
        <div className="animate-slide-down rounded-xl border border-primary-100 bg-white p-5 shadow-md shadow-primary-500/5 dark:border-[var(--color-border-light)] dark:bg-[var(--color-bg-secondary)]">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-[var(--color-text-primary)]">
            {language === 'ar' ? 'اختر المعلم (اختياري)' : 'Choose Teacher (optional)'}
          </h3>
          {teachers.length === 0 ? (
            <p className="text-sm text-gray-400 mb-3">{language === 'ar' ? 'لا يوجد معلمون معينون لهذه المادة' : 'No teachers assigned to this subject yet'}</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 mb-4">
              {teachers.map((te) => (
                <button
                  key={te.id}
                  onClick={() => setSelectedTeacher(selectedTeacher === te.id ? null : te.id)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                    selectedTeacher === te.id
                      ? 'border-primary-300 bg-primary-50 ring-2 ring-primary-200'
                      : 'border-gray-200 bg-white hover:border-primary-200'
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                    selectedTeacher === te.id ? 'bg-primary-500' : 'bg-gray-400'
                  }`}>
                    {te.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{te.name}</span>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {enrolling ? (
              <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{language === 'ar' ? 'جاري التسجيل...' : 'Enrolling...'}</>
            ) : (
              <>{language === 'ar' ? 'سجّل الآن' : 'Enroll Now'}</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
