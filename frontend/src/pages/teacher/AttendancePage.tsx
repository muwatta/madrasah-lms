import { useEffect, useState, useCallback, useMemo } from 'react';
import { attendanceAPI, enrollmentAPI, userAPI } from '../../api';
import { fetchAllPages } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useExport } from '../../hooks/useExport';
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
  const { exporting, exportData } = useExport();
  const isTeacher = user?.role === 'ustaadh';
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(getToday());
  const [marks, setMarks] = useState<Record<number, Status>>({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');

  const buildDefaultMarks = useCallback((studentList: Student[]) => {
    const defaults: Record<number, Status> = {};
    studentList.forEach((s) => { defaults[s.student_id] = 'present'; });
    return defaults;
  }, []);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await fetchAllPages<any>(
        isTeacher ? (p) => enrollmentAPI.teacherStudents(p) : (p) => userAPI.list({ role: 'student', ...p })
      );
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
      setMarks(buildDefaultMarks(list));
    } catch {
      setError(t('attendance.loadStudentsFailed'));
    } finally {
      setLoading(false);
    }
  }, [t, isTeacher, buildDefaultMarks]);

  const loadExistingAttendance = useCallback(() => {
    fetchAllPages<AttendanceRecord>((p) => attendanceAPI.list({ date, ...p }))
      .then((records) => {
        setExistingRecords(records);
        setMarks((prev) => {
          const next = { ...buildDefaultMarks(students) };
          Object.entries(prev).forEach(([studentId, status]) => {
            if (Number(studentId) >= 0) next[Number(studentId)] = status;
          });
          records.forEach((r) => { next[r.student] = r.status; });
          return next;
        });
      })
      .catch(() => {});
  }, [date, students, buildDefaultMarks]);

  useEffect(() => { loadStudents(); }, [loadStudents]);
  useEffect(() => { loadExistingAttendance(); }, [loadExistingAttendance]);

  const setStudentStatus = (studentId: number, status: Status) => {
    setMarks((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    setMarks(buildDefaultMarks(students));
  };

  const markAllAbsent = () => {
    const allAbsent: Record<number, Status> = {};
    students.forEach((s) => { allAbsent[s.student_id] = 'absent'; });
    setMarks(allAbsent);
  };

  const clearSelections = () => {
    setMarks(buildDefaultMarks(students));
  };

  const summary = useMemo(() => {
    const counts: Record<Status, number> = { present: 0, absent: 0, late: 0, excused: 0 };
    students.forEach((student) => {
      const status = marks[student.student_id] ?? 'present';
      counts[status] += 1;
    });
    return {
      present: counts.present,
      absent: counts.absent,
      late: counts.late,
      excused: counts.excused,
      pending: students.length - Object.keys(marks).filter((id) => students.some((s) => s.student_id === Number(id))).length,
    };
  }, [students, marks]);

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch = !term || [student.student_name, student.student_email, student.subject_name].some((value) => value?.toLowerCase().includes(term));
      const matchesStatus = statusFilter === 'all' || (marks[student.student_id] ?? 'present') === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, students, marks]);

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

      <div className="mb-6 rounded-xl border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)] dark:text-gray-400">{t('attendance.overview')}</h2>
          <span className="rounded-full bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 text-xs font-medium text-primary-700 dark:text-primary-300">
            {filteredStudents.length} / {students.length} {t('attendance.students')}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { key: 'present', label: t('attendance.present'), value: summary.present, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
            { key: 'absent', label: t('attendance.absent'), value: summary.absent, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
            { key: 'late', label: t('attendance.late'), value: summary.late, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
            { key: 'excused', label: t('attendance.excused'), value: summary.excused, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
            { key: 'pending', label: t('attendance.pending'), value: Math.max(students.length - summary.present - summary.absent - summary.late - summary.excused, 0), color: 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200' },
          ].map((item) => (
            <div key={item.key} className={`rounded-lg border border-transparent p-3 ${item.color}`}>
              <p className="text-xs font-medium uppercase tracking-wider opacity-80">{item.label}</p>
              <p className="mt-2 text-2xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-[var(--color-text-secondary)] dark:text-gray-300">{t('attendance.date')}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-[var(--color-border)] dark:border-gray-600 bg-[var(--color-bg-primary)] dark:bg-gray-800 px-3 py-2 text-sm text-[var(--color-text-primary)] dark:text-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={markAllPresent} className="btn-press inline-flex items-center gap-2 rounded-lg border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50">
              {t('attendance.markAllPresent')}
            </button>
            <button onClick={markAllAbsent} className="btn-press inline-flex items-center gap-2 rounded-lg border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50">
              {t('attendance.markAllAbsent')}
            </button>
            <button onClick={clearSelections} className="btn-press inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              {t('attendance.reset')}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)] dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.1-5.4A7.5 7.5 0 113 11.25a7.5 7.5 0 0114.75 0z" /></svg>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('attendance.searchStudents')}
              className="w-full rounded-lg border border-[var(--color-border)] dark:border-gray-600 bg-[var(--color-bg-primary)] dark:bg-gray-800 py-2.5 pl-9 pr-3 text-sm text-[var(--color-text-primary)] dark:text-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)] dark:text-gray-300">{t('attendance.filter')}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | Status)}
              className="rounded-lg border border-[var(--color-border)] dark:border-gray-600 bg-[var(--color-bg-primary)] dark:bg-gray-800 px-3 py-2 text-sm text-[var(--color-text-primary)] dark:text-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">{t('attendance.allStatuses')}</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-[var(--color-text-muted)] dark:text-gray-400">
          {t('attendance.recordsReady')}
        </div>
        <button
          onClick={() => exportData(() => attendanceAPI.export({ date }), `attendance_${date}.csv`)}
          disabled={exporting}
          className="btn-press inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          {t('common.exportCsv')}
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

          {filteredStudents.map((student, idx) => (
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

      {filteredStudents.length === 0 && students.length > 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-6 text-center text-sm text-[var(--color-text-muted)] dark:text-gray-400">
          {t('attendance.noResults')}
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
