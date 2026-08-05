import { useEffect, useMemo, useState } from 'react';
import { schoolClassAPI, classSubjectAPI, subjectAPI, userAPI } from '../../api';
import { fetchAllPages } from '../../api/client';
import type { SchoolClass, Subject, User, ClassSubject } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { SkeletonCard } from '../../components/Skeleton';

export default function ClassSubjectsPage() {
  const { t, language } = useLanguage();

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [teacherSelect, setTeacherSelect] = useState<number | null>(null);
  const [addSubjectId, setAddSubjectId] = useState<number | null>(null);
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [savingSubject, setSavingSubject] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchAllPages((p) => schoolClassAPI.list(p)),
      fetchAllPages((p) => subjectAPI.list(p)),
      fetchAllPages((p) => userAPI.list({ role: 'ustaadh', ...p })),
      fetchAllPages((p) => classSubjectAPI.list(p)),
    ])
      .then(([cls, subs, staff, cs]) => {
        setClasses(cls);
        setSubjects(subs);
        setTeachers(staff);
        setClassSubjects(cs);
        if (!selectedClassId && cls.length) setSelectedClassId(cls[0].id);
        setError(null);
      })
      .catch(() => setError(t('classSubjects.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const selectedClass = classes.find((c) => c.id === selectedClassId) || null;
  const attached = useMemo(
    () => classSubjects.filter((cs) => cs.school_class === selectedClassId),
    [classSubjects, selectedClassId],
  );
  const attachedIds = useMemo(() => new Set(attached.map((cs) => cs.subject)), [attached]);
  const availableSubjects = subjects.filter((s) => !attachedIds.has(s.id));

  useEffect(() => {
    if (selectedClass) setTeacherSelect(selectedClass.class_teacher);
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClassId) setAddSubjectId(availableSubjects[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, availableSubjects.length]);

  const handleSaveTeacher = async () => {
    if (!selectedClass) return;
    setSavingTeacher(true);
    setMessage(null);
    setError(null);
    try {
      await schoolClassAPI.update(selectedClass.id, { class_teacher: teacherSelect });
      setClasses(await fetchAllPages((p) => schoolClassAPI.list(p)));
      setMessage(t('classSubjects.teacherSaved'));
    } catch {
      setError(t('classSubjects.loadFailed'));
    } finally {
      setSavingTeacher(false);
    }
  };

  const handleAddSubject = async () => {
    if (!selectedClass || !addSubjectId) return;
    setSavingSubject(true);
    setMessage(null);
    setError(null);
    try {
      const res = await classSubjectAPI.create({ school_class: selectedClass.id, subject: addSubjectId });
      setClassSubjects((prev) => [res.data, ...prev]);
      setMessage(t('classSubjects.saved'));
    } catch (err: any) {
      const detail = err.response?.data?.subject?.[0] ?? err.response?.data?.detail;
      setError(detail || t('classSubjects.loadFailed'));
    } finally {
      setSavingSubject(false);
    }
  };

  const handleRemoveSubject = async (cs: ClassSubject) => {
    if (!window.confirm(t('classSubjects.confirmDropSubject'))) return;
    setRemovingId(cs.id);
    setMessage(null);
    setError(null);
    try {
      await classSubjectAPI.delete(cs.id);
      setClassSubjects((prev) => prev.filter((x) => x.id !== cs.id));
      setMessage(t('classSubjects.saved'));
    } catch {
      setError(t('classSubjects.loadFailed'));
    } finally {
      setRemovingId(null);
    }
  };

  const selectCls = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100';

  if (loading) {
    return (
      <div className="page-enter space-y-6">
        <div className="h-32 rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-emerald-500" />
        <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-emerald-500 p-6 text-white shadow-lg shadow-primary-500/20 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl dark:text-[var(--color-text-primary)]">{t('classSubjects.title')}</h1>
            <p className="mt-1 text-sm text-primary-100 dark:text-primary-200">{t('guides.classSubjects')}</p>
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
          {classes.map((c) => (
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

      {!selectedClass ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-secondary)] py-16 text-center">
          <p className="text-sm font-medium text-gray-400 dark:text-[var(--color-text-muted)]">{t('classSubjects.noClasses')}</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-100 dark:border-[var(--color-border-light)] bg-white dark:bg-[var(--color-bg-secondary)] p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-[var(--color-text-primary)]">{t('classSubjects.classTeacher')}</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <select
                  value={teacherSelect ?? ''}
                  onChange={(e) => setTeacherSelect(e.target.value ? Number(e.target.value) : null)}
                  className={selectCls}
                >
                  <option value="">{t('classSubjects.noTeacherAssigned')}</option>
                  {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
                </select>
              </div>
              <button
                onClick={handleSaveTeacher}
                disabled={savingTeacher}
                className="btn-press inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {savingTeacher ? (
                  <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('common.saving')}</>
                ) : (
                  <>{t('classSubjects.saveTeacher')}</>
                )}
              </button>
            </div>
            {selectedClass.class_teacher_name && (
              <p className="mt-3 text-xs text-gray-400 dark:text-[var(--color-text-muted)]">
                {t('classSubjects.classTeacher')}: {selectedClass.class_teacher_name}
              </p>
            )}
          </div>

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
                      disabled={removingId === cs.id}
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
                disabled={savingSubject || !addSubjectId}
                className="btn-press inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {savingSubject ? (
                  <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('common.saving')}</>
                ) : (
                  <>{t('classSubjects.addSubject')}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
