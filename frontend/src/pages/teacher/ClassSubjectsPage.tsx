import { useEffect, useMemo, useState } from 'react';
import { enrollmentAPI, classSubjectAPI, subjectAPI } from '../../api';
import type { Enrollment, Subject, ClassSubject } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { SkeletonCard } from '../../components/Skeleton';

const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500',
  'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2);
}

interface SimpleClass {
  id: number;
  name_ar: string;
  name_en: string;
  order: number;
}

export default function ClassTeacherClassSubjectsPage() {
  const { t, language } = useLanguage();

  const [myClasses, setMyClasses] = useState<SimpleClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [addSubjectId, setAddSubjectId] = useState<number | null>(null);
  const [busySubjectId, setBusySubjectId] = useState<number | null>(null);
  const [busyEnrollmentId, setBusyEnrollmentId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [enrollForm, setEnrollForm] = useState<{ student: string; subject: string }>({ student: '', subject: '' });
  const [savingEnrollment, setSavingEnrollment] = useState(false);

  const loadBase = () => {
    setLoading(true);
    Promise.all([
      enrollmentAPI.classTeacherClasses().then((r) => r.data),
      subjectAPI.list().then((r) => r.data.results ?? r.data),
      classSubjectAPI.list().then((r) => r.data.results ?? r.data),
    ])
      .then(([cls, subs, cs]) => {
        setMyClasses(cls);
        setSubjects(subs);
        setClassSubjects(cs);
        if (!selectedClassId && cls.length) setSelectedClassId(cls[0].id);
        setError(null);
      })
      .catch(() => setError(t('classSubjects.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBase(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    setEnrollments([]);
    enrollmentAPI.list({ school_class: selectedClassId })
      .then((r) => setEnrollments(r.data.results ?? r.data))
      .catch(() => setError(t('classSubjects.loadFailed')));
  }, [selectedClassId, t]);

  const attached = useMemo(
    () => classSubjects.filter((cs) => cs.school_class === selectedClassId),
    [classSubjects, selectedClassId],
  );
  const attachedIds = useMemo(() => new Set(attached.map((cs) => cs.subject)), [attached]);
  const availableSubjects = subjects.filter((s) => !attachedIds.has(s.id));

  useEffect(() => {
    if (selectedClassId) setAddSubjectId(availableSubjects[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, availableSubjects.length]);

  const students = useMemo(() => {
    const map = new Map<number, Enrollment[]>();
    for (const e of enrollments) {
      const list = map.get(e.student) ?? [];
      list.push(e);
      map.set(e.student, list);
    }
    return Array.from(map.entries());
  }, [enrollments]);

  const handleAddSubject = async () => {
    if (!selectedClassId || !addSubjectId) return;
    setBusySubjectId(-1);
    setMessage(null);
    setError(null);
    try {
      const res = await classSubjectAPI.create({ school_class: selectedClassId, subject: addSubjectId });
      setClassSubjects((prev) => [res.data, ...prev]);
      setMessage(t('classSubjects.saved'));
    } catch (err: any) {
      const detail = err.response?.data?.subject?.[0] ?? err.response?.data?.detail;
      setError(detail || t('classSubjects.loadFailed'));
    } finally {
      setBusySubjectId(null);
    }
  };

  const handleRemoveSubject = async (cs: ClassSubject) => {
    if (!window.confirm(t('classSubjects.confirmDropSubject'))) return;
    setBusySubjectId(cs.id);
    setMessage(null);
    setError(null);
    try {
      await classSubjectAPI.delete(cs.id);
      setClassSubjects((prev) => prev.filter((x) => x.id !== cs.id));
      setMessage(t('classSubjects.saved'));
      if (selectedClassId) {
        const r = await enrollmentAPI.list({ school_class: selectedClassId });
        setEnrollments(r.data.results ?? r.data);
      }
    } catch {
      setError(t('classSubjects.loadFailed'));
    } finally {
      setBusySubjectId(null);
    }
  };

  const handleRemoveEnrollment = async (e: Enrollment) => {
    if (!window.confirm(t('classSubjects.confirmDropEnrollment'))) return;
    setBusyEnrollmentId(e.id);
    setMessage(null);
    setError(null);
    try {
      await enrollmentAPI.delete(e.id);
      setEnrollments((prev) => prev.filter((x) => x.id !== e.id));
      setMessage(t('classSubjects.saved'));
    } catch {
      setError(t('classSubjects.loadFailed'));
    } finally {
      setBusyEnrollmentId(null);
    }
  };

  const handleAddEnrollment = async () => {
    if (!selectedClassId || !enrollForm.student || !enrollForm.subject) return;
    setSavingEnrollment(true);
    setMessage(null);
    setError(null);
    try {
      const res = await enrollmentAPI.create({
        student: Number(enrollForm.student),
        subject: Number(enrollForm.subject),
        school_class: selectedClassId,
        ustaadh: null,
      });
      setEnrollments((prev) => [res.data, ...prev]);
      setEnrollForm({ student: '', subject: '' });
      setMessage(t('classSubjects.saved'));
    } catch (err: any) {
      const data = err.response?.data;
      const detail = data?.subject?.[0] ?? data?.student?.[0] ?? data?.detail;
      setError(detail || t('classSubjects.loadFailed'));
    } finally {
      setSavingEnrollment(false);
    }
  };

  const studentOptions = students.map(([sid, list]) => ({ id: sid, name: list[0].student_name }));

  const selectCls = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100';

  if (loading) {
    return (
      <div className="page-enter space-y-6">
        <div className="h-32 rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-emerald-500" />
        <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  if (myClasses.length === 0) {
    return (
      <div className="page-enter space-y-6">
        <div className="rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-emerald-500 p-6 text-white shadow-lg shadow-primary-500/20 sm:p-8">
          <h1 className="text-2xl font-bold sm:text-3xl dark:text-[var(--color-text-primary)]">{t('classSubjects.title')}</h1>
          <p className="mt-1 text-sm text-primary-100 dark:text-primary-200">{t('guides.classSubjects')}</p>
        </div>
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-secondary)] py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{t('classSubjects.notClassTeacher')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-emerald-500 p-6 text-white shadow-lg shadow-primary-500/20 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl dark:text-[var(--color-text-primary)]">{t('classSubjects.title')}</h1>
            <p className="mt-1 text-sm text-primary-100 dark:text-primary-200">{t('classSubjects.teacherSubtitle')}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 dark:border-[var(--color-border-light)] bg-white dark:bg-[var(--color-bg-secondary)] p-4 shadow-sm">
        <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('classSubjects.chooseClass')}</label>
        <select
          value={selectedClassId ?? ''}
          onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : null)}
          className={`${selectCls} max-w-md`}
        >
          {myClasses.map((c) => (
            <option key={c.id} value={c.id}>{language === 'ar' ? c.name_ar : c.name_en}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          {error}
        </div>
      )}
      {message && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {message}
        </div>
      )}

      <div className="rounded-xl border border-gray-100 dark:border-[var(--color-border-light)] bg-white dark:bg-[var(--color-bg-secondary)] p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-[var(--color-text-primary)]">{t('classSubjects.attachedSubjects')}</h2>
        {attached.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-[var(--color-text-muted)]">{t('classSubjects.noSubjects')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {attached.map((cs) => (
              <span key={cs.id} className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-200">
                {language === 'ar' ? cs.subject_name : cs.subject_name_en}
                <button
                  onClick={() => handleRemoveSubject(cs)}
                  disabled={busySubjectId === cs.id}
                  className="rounded-full p-0.5 text-primary-400 transition-colors hover:bg-primary-100 hover:text-red-500 disabled:opacity-50"
                  title={t('classSubjects.removeSubject')}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <select
              value={addSubjectId ?? ''}
              onChange={(e) => setAddSubjectId(e.target.value ? Number(e.target.value) : null)}
              className={selectCls}
            >
              {availableSubjects.length === 0 && <option value="">{t('classSubjects.chooseSubject')}</option>}
              {availableSubjects.map((s) => <option key={s.id} value={s.id}>{language === 'ar' ? s.name_ar : s.name_en}</option>)}
            </select>
          </div>
          <button
            onClick={handleAddSubject}
            disabled={busySubjectId === -1 || !addSubjectId}
            className="btn-press inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {busySubjectId === -1 ? (
              <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('common.saving')}</>
            ) : (
              <>{t('classSubjects.addSubject')}</>
            )}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 dark:border-[var(--color-border-light)] bg-white dark:bg-[var(--color-bg-secondary)] p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-[var(--color-text-primary)]">{t('classSubjects.students')}</h2>

        <div className="mb-5 rounded-lg border border-gray-100 dark:border-[var(--color-border-light)] bg-gray-50/50 dark:bg-gray-800/30 p-4">
          <p className="mb-3 text-xs font-semibold text-gray-500 dark:text-[var(--color-text-muted)]">{t('classSubjects.addStudentEnrollment')}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('classSubjects.chooseStudent')}</label>
              <select
                value={enrollForm.student}
                onChange={(e) => setEnrollForm((f) => ({ ...f, student: e.target.value }))}
                className={selectCls}
              >
                <option value="">{t('classSubjects.chooseStudent')}</option>
                {studentOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">{t('classSubjects.chooseSubject')}</label>
              <select
                value={enrollForm.subject}
                onChange={(e) => setEnrollForm((f) => ({ ...f, subject: e.target.value }))}
                className={selectCls}
              >
                <option value="">{t('classSubjects.chooseSubject')}</option>
                {attached.map((cs) => <option key={cs.id} value={cs.subject}>{language === 'ar' ? cs.subject_name : cs.subject_name_en}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddEnrollment}
                disabled={savingEnrollment || !enrollForm.student || !enrollForm.subject}
                className="btn-press inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {savingEnrollment ? (
                  <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('common.saving')}</>
                ) : (
                  <>{t('classSubjects.enrollButton')}</>
                )}
              </button>
            </div>
          </div>
        </div>

        {students.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-[var(--color-text-muted)]">{t('classSubjects.noStudents')}</p>
        ) : (
          <div className="space-y-3">
            {students.map(([sid, list]) => {
              const name = list[0].student_name;
              return (
                <div key={sid} className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 dark:border-[var(--color-border-light)] bg-gray-50/50 dark:bg-gray-800/30 p-4">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${getAvatarColor(name)}`}>
                    {getInitials(name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-[var(--color-text-primary)]">{name}</p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {list.map((e) => (
                        <span key={e.id} className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-[var(--color-border-light)] px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-[var(--color-text-secondary)]">
                          {language === 'ar' ? e.subject_name : e.subject_name_en}
                          <button
                            onClick={() => handleRemoveEnrollment(e)}
                            disabled={busyEnrollmentId === e.id}
                            className="rounded-full p-0.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                            title={t('classSubjects.removeEnrollment')}
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
