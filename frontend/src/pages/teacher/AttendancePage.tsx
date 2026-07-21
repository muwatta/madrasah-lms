import { useEffect, useState, useCallback } from 'react';
import { attendanceAPI, enrollmentAPI, userAPI } from '../../api';
import { unwrapPaginated } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Skeleton, SkeletonTable } from '../../components/Skeleton';

type Status = 'present' | 'absent' | 'late' | 'excused';

interface Student {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  subject: number;
  subject_name: string;
}

interface AttendanceRecord {
  id: number;
  student: number;
  student_name: string;
  date: string;
  status: Status;
}

const STATUS_OPTIONS: { value: Status; color: string; activeColor: string; labelKey: string }[] = [
  { value: 'present', color: 'border-emerald-300 text-emerald-700', activeColor: 'bg-emerald-500 text-white border-emerald-500', labelKey: 'attendance.present' },
  { value: 'absent', color: 'border-red-300 text-red-700', activeColor: 'bg-red-500 text-white border-red-500', labelKey: 'attendance.absent' },
  { value: 'late', color: 'border-amber-300 text-amber-700', activeColor: 'bg-amber-500 text-white border-amber-500', labelKey: 'attendance.late' },
  { value: 'excused', color: 'border-blue-300 text-blue-700', activeColor: 'bg-blue-500 text-white border-blue-500', labelKey: 'attendance.excused' },
];

function getToday() {
  return new Date().toISOString().split('T')[0];
}

export default function AttendancePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isTeacher = user?.role === 'ustaadh';
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(getToday());
  const [marks, setMarks] = useState<Record<number, Status>>({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);

  const loadStudents = useCallback(() => {
    setLoading(true);
    const promise = isTeacher
      ? enrollmentAPI.teacherStudents()
      : userAPI.list({ role: 'student' });

    promise
      .then((res) => {
        const raw = unwrapPaginated<any>(res.data);
        const list = (isTeacher ? raw : raw.map((u: any) => ({
              id: u.id,
              student_id: u.id,
              student_name: u.full_name,
              student_email: u.email || '',
              subject: 0,
              subject_name: '',
            }))).map((s: any) => ({
              id: s.id ?? s.student,
              student_id: s.student_id ?? s.student,
              student_name: s.student_name,
              student_email: s.student_email,
              subject: s.subject ?? 0,
              subject_name: s.subject_name ?? '',
            }));
        setStudents(list);
        const initial: Record<number, Status> = {};
        list.forEach((s: Student) => { initial[s.student_id] = 'present'; });
        setMarks(initial);
      })
      .catch(() => setError(t('attendance.loadStudentsFailed')))
      .finally(() => setLoading(false));
  }, [t, isTeacher]);

  const loadExistingAttendance = useCallback(() => {
    attendanceAPI.list({ date })
      .then((res) => {
        const records = unwrapPaginated<AttendanceRecord>(res.data);
        setExistingRecords(records);
        if (records.length > 0) {
          setMarks((prev) => {
            const updated = { ...prev };
            records.forEach((r) => { updated[r.student] = r.status; });
            return updated;
          });
        }
      })
      .catch(() => {});
  }, [date]);

  useEffect(() => { loadStudents(); }, [loadStudents]);
  useEffect(() => { loadExistingAttendance(); }, [loadExistingAttendance]);

  const setStudentStatus = (studentId: number, status: Status) => {
    setMarks((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    const allPresent: Record<number, Status> = {};
    students.forEach((s) => { allPresent[s.student_id] = 'present'; });
    setMarks(allPresent);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const records = students.map((s) => ({
        student: s.student_id,
        status: marks[s.student_id] || 'present',
      }));
      await attendanceAPI.bulk({ date, records });
      setSuccessMsg(existingRecords.length > 0 ? t('attendance.updatedSuccess') : t('attendance.submittedSuccess'));
      loadExistingAttendance();
    } catch {
      setError(t('attendance.submitFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-80 mb-6" />
        <div className="mb-6 flex gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-44" />
        </div>
        <SkeletonTable rows={6} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] dark:text-gray-100">{t('attendance.markAttendance')}</h1>
      </div>
      <p className="text-sm text-[var(--color-text-muted)] dark:text-gray-400 mb-6">{t('guides.attendance')}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
          <button onClick={() => setError(null)} className="me-2 underline">{t('common.dismiss')}</button>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="me-2 underline">{t('common.dismiss')}</button>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[var(--color-text-secondary)] dark:text-gray-300">{t('attendance.date')}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] dark:border-gray-600 bg-[var(--color-bg-primary)] dark:bg-gray-800 px-3 py-2 text-sm text-[var(--color-text-primary)] dark:text-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={markAllPresent}
          className="btn-press inline-flex items-center gap-2 rounded-lg border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
        >
          {t('attendance.markAllPresent')}
        </button>
      </div>

      {students.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-8 text-center text-[var(--color-text-muted)] dark:text-gray-400 shadow-sm">
          {t('attendance.noStudents')}
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 shadow-sm overflow-hidden">
          <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] border-b border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-secondary)] dark:bg-gray-700/50 px-6 py-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] dark:text-gray-400">
            <span>{t('attendance.student')}</span>
            {STATUS_OPTIONS.map((opt) => (
              <span key={opt.value} className="text-center w-24">{t(opt.labelKey)}</span>
            ))}
          </div>

          {students.map((student, idx) => (
            <div
              key={student.student_id ?? student.id}
              className="opacity-0 animate-slide-up flex flex-col gap-3 border-b border-[var(--color-border-light)] dark:border-gray-700/50 px-6 py-4 sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-center sm:gap-0 last:border-b-0 hover:bg-[var(--color-bg-secondary)] dark:hover:bg-gray-700/30"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--color-text-primary)] dark:text-gray-100">{student.student_name}</p>
                <p className="truncate text-xs text-[var(--color-text-muted)] dark:text-gray-400">{student.student_email}</p>
              </div>
              {STATUS_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex justify-center">
                  <button
                    onClick={() => setStudentStatus(student.student_id, opt.value)}
                    className={`btn-press w-24 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      marks[student.student_id] === opt.value ? opt.activeColor : opt.color + ' bg-[var(--color-bg-primary)] dark:bg-gray-800 hover:bg-[var(--color-bg-secondary)] dark:hover:bg-gray-700'
                    }`}
                  >
                    {t(opt.labelKey)}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {students.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-press rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? t('common.saving') : existingRecords.length > 0 ? t('attendance.updateAttendance') : t('attendance.submitAttendance')}
          </button>
        </div>
      )}
    </div>
  );
}
