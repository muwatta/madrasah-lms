import { useEffect, useState, useMemo } from 'react';
import { academicAPI, schoolClassAPI } from '../../api';
import StatCard from '../../components/StatCard';
import ConfirmModal from '../../components/ConfirmModal';
import { useLanguage } from '../../context/LanguageContext';
import { Skeleton, SkeletonTable, SkeletonStatsGrid } from '../../components/Skeleton';

interface Session {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface Term {
  id: number;
  name: string;
  session: number;
  session_name: string;
  term_number: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface CalendarEvent {
  id: number;
  title: string;
  event_type: string;
  start_date: string;
  end_date: string;
  description: string;
}

interface ClassArm {
  id: number;
  name: string;
  school_class: number;
  school_class_name: string;
}

interface Timetable {
  id: number;
  name: string;
  class_arm: number;
  class_arm_name: string;
  term: number;
  term_name: string;
  created_at: string;
}

interface TimetableSlot {
  id: number;
  timetable: number;
  day: string;
  period: number;
  subject: number;
  subject_name: string;
  teacher: number;
  teacher_name: string;
  room: string;
}

type Tab = 'sessions' | 'terms' | 'calendar' | 'classArms' | 'timetables';

const TABS: { key: Tab; label: string }[] = [
  { key: 'sessions', label: 'Sessions' },
  { key: 'terms', label: 'Terms' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'classArms', label: 'Class Arms' },
  { key: 'timetables', label: 'Timetables' },
];

const EVENT_TYPES = ['holiday', 'exam', 'event', 'meeting', 'other'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AcademicPage() {
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<Tab>('sessions');

  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [classArms, setClassArms] = useState<ClassArm[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<any[]>([]);
  const [, setSubjects] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Session form
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({ name: '', start_date: '', end_date: '' });
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [sessionSaving, setSessionSaving] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Term form
  const [showTermModal, setShowTermModal] = useState(false);
  const [termForm, setTermForm] = useState({ name: '', session: '', term_number: '1', start_date: '', end_date: '' });
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [termSaving, setTermSaving] = useState(false);
  const [termError, setTermError] = useState<string | null>(null);
  const [termSessionFilter, setTermSessionFilter] = useState('');

  // Calendar form
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarForm, setCalendarForm] = useState({ title: '', event_type: 'event', start_date: '', end_date: '', description: '' });
  const [calendarSaving, setCalendarSaving] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  // Class Arm form
  const [showClassArmModal, setShowClassArmModal] = useState(false);
  const [classArmForm, setClassArmForm] = useState({ name: '', school_class: '' });
  const [classArmSaving, setClassArmSaving] = useState(false);
  const [classArmError, setClassArmError] = useState<string | null>(null);

  // Timetable
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [timetableForm, setTimetableForm] = useState({ name: '', class_arm: '', term: '' });
  const [timetableSaving, setTimetableSaving] = useState(false);
  const [timetableError, setTimetableError] = useState<string | null>(null);
  const [viewingTimetable, setViewingTimetable] = useState<Timetable | null>(null);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: number } | null>(null);
  const [, setDeleting] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      academicAPI.sessions.list(),
      academicAPI.terms.list(),
      academicAPI.calendarEvents.list(),
      academicAPI.classArms.list(),
      academicAPI.timetables.list(),
      schoolClassAPI.list(),
    ])
      .then(([sRes, tRes, cRes, caRes, ttRes, scRes]) => {
        setSessions(sRes.data.results ?? sRes.data);
        setTerms(tRes.data.results ?? tRes.data);
        setCalendarEvents(cRes.data.results ?? cRes.data);
        setClassArms(caRes.data.results ?? caRes.data);
        setTimetables(ttRes.data.results ?? ttRes.data);
        setSchoolClasses(scRes.data.results ?? scRes.data);
      })
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load academic data'))
      .finally(() => setLoading(false));
  };

  const loadSubjects = () => {
    import('../../api').then(({ subjectAPI }) => {
      subjectAPI.list().then((res) => setSubjects(res.data.results ?? res.data)).catch(() => {});
    });
  };

  useEffect(() => {
    loadData();
    loadSubjects();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- Session handlers ---
  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSessionError(null);
    setSessionSaving(true);
    try {
      const payload = { ...sessionForm };
      if (editingSession) {
        await academicAPI.sessions.update(editingSession.id, payload);
      } else {
        await academicAPI.sessions.create(payload);
      }
      setShowSessionModal(false);
      setEditingSession(null);
      setSessionForm({ name: '', start_date: '', end_date: '' });
      showToast('success', editingSession ? 'Session updated' : 'Session created');
      loadData();
    } catch (err: any) {
      setSessionError(err.response?.data?.detail || err.response?.data?.name?.[0] || 'Failed to save session');
    } finally {
      setSessionSaving(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await academicAPI.sessions.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      showToast('success', 'Session deleted');
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // --- Term handlers ---
  const handleSaveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    setTermError(null);
    setTermSaving(true);
    try {
      const payload = { ...termForm, session: Number(termForm.session), term_number: Number(termForm.term_number) };
      if (editingTerm) {
        await academicAPI.terms.update(editingTerm.id, payload);
      } else {
        await academicAPI.terms.create(payload);
      }
      setShowTermModal(false);
      setEditingTerm(null);
      setTermForm({ name: '', session: '', term_number: '1', start_date: '', end_date: '' });
      showToast('success', editingTerm ? 'Term updated' : 'Term created');
      loadData();
    } catch (err: any) {
      setTermError(err.response?.data?.detail || 'Failed to save term');
    } finally {
      setTermSaving(false);
    }
  };

  const handleDeleteTerm = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await academicAPI.terms.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      showToast('success', 'Term deleted');
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // --- Calendar handlers ---
  const handleSaveCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalendarError(null);
    setCalendarSaving(true);
    try {
      await academicAPI.calendarEvents.create(calendarForm);
      setShowCalendarModal(false);
      setCalendarForm({ title: '', event_type: 'event', start_date: '', end_date: '', description: '' });
      showToast('success', 'Event created');
      loadData();
    } catch (err: any) {
      setCalendarError(err.response?.data?.detail || 'Failed to save event');
    } finally {
      setCalendarSaving(false);
    }
  };

  const handleDeleteCalendarEvent = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await academicAPI.calendarEvents.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      showToast('success', 'Event deleted');
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // --- Class Arm handlers ---
  const handleSaveClassArm = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassArmError(null);
    setClassArmSaving(true);
    try {
      await academicAPI.classArms.create({ ...classArmForm, school_class: Number(classArmForm.school_class) });
      setShowClassArmModal(false);
      setClassArmForm({ name: '', school_class: '' });
      showToast('success', 'Class arm created');
      loadData();
    } catch (err: any) {
      setClassArmError(err.response?.data?.detail || 'Failed to save class arm');
    } finally {
      setClassArmSaving(false);
    }
  };

  // --- Timetable handlers ---
  const handleSaveTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    setTimetableError(null);
    setTimetableSaving(true);
    try {
      await academicAPI.timetables.create({
        ...timetableForm,
        class_arm: Number(timetableForm.class_arm),
        term: Number(timetableForm.term),
      });
      setShowTimetableModal(false);
      setTimetableForm({ name: '', class_arm: '', term: '' });
      showToast('success', 'Timetable created');
      loadData();
    } catch (err: any) {
      setTimetableError(err.response?.data?.detail || 'Failed to save timetable');
    } finally {
      setTimetableSaving(false);
    }
  };

  const handleViewTimetable = async (tt: Timetable) => {
    setViewingTimetable(tt);
    setSlotsLoading(true);
    try {
      const res = await academicAPI.timetables.slots(tt.id);
      setTimetableSlots(res.data.results ?? res.data);
    } catch {
      setTimetableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleGenerateTimetable = async (tt: Timetable) => {
    setGenerating(true);
    try {
      await academicAPI.timetables.generate(tt.id);
      showToast('success', 'Timetable generated');
      handleViewTimetable(tt);
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to generate timetable');
    } finally {
      setGenerating(false);
    }
  };

  const filteredTerms = useMemo(() => {
    if (!termSessionFilter) return terms;
    return terms.filter((t) => t.session === Number(termSessionFilter));
  }, [terms, termSessionFilter]);

  const timetableGrid = useMemo(() => {
    const grid: Record<string, Record<number, TimetableSlot>> = {};
    DAYS.forEach((d) => { grid[d] = {}; });
    timetableSlots.forEach((slot) => {
      if (grid[slot.day]) {
        grid[slot.day][slot.period] = slot;
      }
    });
    return grid;
  }, [timetableSlots]);

  const periods = useMemo(() => {
    const p = new Set(timetableSlots.map((s) => s.period));
    return Array.from(p).sort((a, b) => a - b);
  }, [timetableSlots]);

  const selectCls = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100';
  const inputCls = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100';

  const tabContent = (cls: string) => `rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium transition-colors ${cls}`;

  return (
    <div className="page-enter space-y-6">
      {toast && (
        <div className={`fixed top-4 end-4 z-50 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium shadow-lg animate-slide-down ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          )}
          {toast.message}
        </div>
      )}

      <div className="rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-emerald-500 p-6 text-white shadow-lg shadow-primary-500/20 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl dark:text-[var(--color-text-primary)]">{t('academic.title') || (language === 'ar' ? 'الإدارة الأكاديمية' : 'Academic Management')}</h1>
            <p className="mt-1 text-sm text-primary-100">{t('academic.subtitle') || (language === 'ar' ? 'إدارة الفصول والterms والجداول الزمنية' : 'Manage sessions, terms, and timetables')}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={tabContent(
              activeTab === tab.key
                ? 'border-primary-300 bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-6"><SkeletonStatsGrid /><SkeletonTable rows={5} /></div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400">
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          {error}
        </div>
      ) : (
        <>
          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
                  <StatCard title={t('academic.totalSessions') || 'Sessions'} value={sessions.length} color="bg-blue-500" delay={0}
                    icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  />
                  <StatCard title={t('academic.currentSession') || 'Current'} value={sessions.find(s => s.is_current)?.name || '-'} color="bg-green-500" delay={50}
                    icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  />
                  <StatCard title={t('academic.totalTerms') || 'Terms'} value={terms.length} color="bg-amber-500" delay={100}
                    icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                  />
                </div>
                <button
                  onClick={() => { setEditingSession(null); setSessionForm({ name: '', start_date: '', end_date: '' }); setSessionError(null); setShowSessionModal(true); }}
                  className="btn-press inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  {language === 'ar' ? 'إضافة فصل' : 'Add Session'}
                </button>
              </div>

              {sessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-secondary)] py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{language === 'ar' ? 'لا توجد فصول دراسية' : 'No sessions yet'}</p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-[var(--color-text-muted)]">{language === 'ar' ? 'ابدأ بإنشاء فصل دراسي' : 'Start by creating a session'}</p>
                </div>
              ) : (
                <div className="card-hover rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-[var(--color-border)] bg-gray-50/80 dark:bg-[var(--color-bg-primary)] text-end text-xs font-medium uppercase text-gray-500 dark:text-[var(--color-text-muted)]">
                        <th className="px-4 py-3">{language === 'ar' ? 'الاسم' : 'Name'}</th>
                        <th className="px-4 py-3">{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</th>
                        <th className="px-4 py-3">{language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</th>
                        <th className="px-4 py-3">{language === 'ar' ? 'الحالية' : 'Current'}</th>
                        <th className="px-4 py-3 text-center">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-[var(--color-border-light)]">
                      {sessions.map((s) => (
                        <tr key={s.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-700/30">
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{s.name}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-[var(--color-text-muted)] text-xs">{new Date(s.start_date).toLocaleDateString()}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-[var(--color-text-muted)] text-xs">{new Date(s.end_date).toLocaleDateString()}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {s.is_current ? (
                              <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 border border-green-200">{language === 'ar' ? 'نعم' : 'Yes'}</span>
                            ) : (
                              <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500 border border-gray-200">{language === 'ar' ? 'لا' : 'No'}</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => { setEditingSession(s); setSessionForm({ name: s.name, start_date: s.start_date, end_date: s.end_date }); setSessionError(null); setShowSessionModal(true); }}
                                className="btn-press inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                {language === 'ar' ? 'تعديل' : 'Edit'}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'session', id: s.id })}
                                className="btn-press inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Terms Tab */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-0 w-full sm:w-auto sm:min-w-[180px]">
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'تصفية حسب الفصل' : 'Filter by Session'}</label>
                  <select value={termSessionFilter} onChange={(e) => setTermSessionFilter(e.target.value)} className={selectCls}>
                    <option value="">{language === 'ar' ? 'جميع الفصول' : 'All Sessions'}</option>
                    {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => { setEditingTerm(null); setTermForm({ name: '', session: sessions.find(s => s.is_current)?.id?.toString() || '', term_number: '1', start_date: '', end_date: '' }); setTermError(null); setShowTermModal(true); }}
                  className="btn-press inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  {language === 'ar' ? 'إضافة term' : 'Add Term'}
                </button>
              </div>

              {filteredTerms.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-secondary)] py-16 text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{language === 'ar' ? 'لا توجد terms' : 'No terms found'}</p>
                </div>
              ) : (
                <div className="card-hover rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-[var(--color-border)] bg-gray-50/80 dark:bg-[var(--color-bg-primary)] text-end text-xs font-medium uppercase text-gray-500 dark:text-[var(--color-text-muted)]">
                        <th className="px-4 py-3">{language === 'ar' ? 'الاسم' : 'Name'}</th>
                        <th className="px-4 py-3">{language === 'ar' ? 'الفصل' : 'Session'}</th>
                        <th className="px-4 py-3">{language === 'ar' ? 'رقم term' : 'Term #'}</th>
                        <th className="px-4 py-3">{language === 'ar' ? 'تاريخ البدء' : 'Start'}</th>
                        <th className="px-4 py-3">{language === 'ar' ? 'تاريخ الانتهاء' : 'End'}</th>
                        <th className="px-4 py-3">{language === 'ar' ? 'الحالية' : 'Current'}</th>
                        <th className="px-4 py-3 text-center">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-[var(--color-border-light)]">
                      {filteredTerms.map((term) => (
                        <tr key={term.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-700/30">
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{term.name}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-[var(--color-text-muted)]">{term.session_name}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-[var(--color-text-muted)]">{term.term_number}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-[var(--color-text-muted)] text-xs">{new Date(term.start_date).toLocaleDateString()}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-[var(--color-text-muted)] text-xs">{new Date(term.end_date).toLocaleDateString()}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {term.is_current ? (
                              <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 border border-green-200">{language === 'ar' ? 'نعم' : 'Yes'}</span>
                            ) : (
                              <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500 border border-gray-200">{language === 'ar' ? 'لا' : 'No'}</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => { setEditingTerm(term); setTermForm({ name: term.name, session: String(term.session), term_number: String(term.term_number), start_date: term.start_date, end_date: term.end_date }); setTermError(null); setShowTermModal(true); }}
                                className="btn-press inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                {language === 'ar' ? 'تعديل' : 'Edit'}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'term', id: term.id })}
                                className="btn-press inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-[var(--color-text-muted)]">{calendarEvents.length} {language === 'ar' ? 'أحداث' : 'events'}</p>
                <button
                  onClick={() => { setCalendarForm({ title: '', event_type: 'event', start_date: '', end_date: '', description: '' }); setCalendarError(null); setShowCalendarModal(true); }}
                  className="btn-press inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  {language === 'ar' ? 'إضافة حدث' : 'Add Event'}
                </button>
              </div>

              {calendarEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-secondary)] py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{language === 'ar' ? 'لا توجد أحداث' : 'No events yet'}</p>
                </div>
              ) : (
                <div className="card-hover rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-[var(--color-border)] bg-gray-50/80 dark:bg-[var(--color-bg-primary)] text-end text-xs font-medium uppercase text-gray-500 dark:text-[var(--color-text-muted)]">
                        <th className="px-4 py-3">{language === 'ar' ? 'العنوان' : 'Title'}</th>
                        <th className="px-4 py-3">{language === 'ar' ? 'النوع' : 'Type'}</th>
                        <th className="px-4 py-3">{language === 'ar' ? 'من' : 'From'}</th>
                        <th className="px-4 py-3">{language === 'ar' ? 'إلى' : 'To'}</th>
                        <th className="px-4 py-3 text-center">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-[var(--color-border-light)]">
                      {calendarEvents.map((ev) => (
                        <tr key={ev.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-700/30">
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{ev.title}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200 capitalize">{ev.event_type}</span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-[var(--color-text-muted)] text-xs">{new Date(ev.start_date).toLocaleDateString()}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-[var(--color-text-muted)] text-xs">{new Date(ev.end_date).toLocaleDateString()}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => setDeleteConfirm({ type: 'calendar', id: ev.id })}
                                className="btn-press inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Class Arms Tab */}
          {activeTab === 'classArms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-[var(--color-text-muted)]">{classArms.length} {language === 'ar' ? 'فروع' : 'arms'}</p>
                <button
                  onClick={() => { setClassArmForm({ name: '', school_class: '' }); setClassArmError(null); setShowClassArmModal(true); }}
                  className="btn-press inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  {language === 'ar' ? 'إضافة فرع' : 'Add Class Arm'}
                </button>
              </div>

              {classArms.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-secondary)] py-16 text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{language === 'ar' ? 'لا توجد فروع' : 'No class arms yet'}</p>
                </div>
              ) : (
                <div className="card-hover rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-[var(--color-border)] bg-gray-50/80 dark:bg-[var(--color-bg-primary)] text-end text-xs font-medium uppercase text-gray-500 dark:text-[var(--color-text-muted)]">
                        <th className="px-4 py-3">{language === 'ar' ? 'الاسم' : 'Name'}</th>
                        <th className="px-4 py-3">{language === 'ar' ? 'الفصل' : 'School Class'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-[var(--color-border-light)]">
                      {classArms.map((ca) => (
                        <tr key={ca.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-700/30">
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{ca.name}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-[var(--color-text-muted)]">{ca.school_class_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Timetables Tab */}
          {activeTab === 'timetables' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-[var(--color-text-muted)]">{timetables.length} {language === 'ar' ? 'جداول' : 'timetables'}</p>
                <button
                  onClick={() => { setTimetableForm({ name: '', class_arm: '', term: '' }); setTimetableError(null); setShowTimetableModal(true); }}
                  className="btn-press inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  {language === 'ar' ? 'إضافة جدول' : 'Add Timetable'}
                </button>
              </div>

              {timetables.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-[var(--color-border)] bg-white dark:bg-[var(--color-bg-secondary)] py-16 text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{language === 'ar' ? 'لا توجد جداول زمنية' : 'No timetables yet'}</p>
                </div>
              ) : (
                <div className="card-hover rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-[var(--color-border)] bg-gray-50/80 dark:bg-[var(--color-bg-primary)] text-end text-xs font-medium uppercase text-gray-500 dark:text-[var(--color-text-muted)]">
                        <th className="px-4 py-3">{language === 'ar' ? 'الاسم' : 'Name'}</th>
                        <th className="px-4 py-3">{language === 'ar' ? 'الفصل' : 'Class Arm'}</th>
                        <th className="px-4 py-3">{language === 'ar' ? 'Term' : 'Term'}</th>
                        <th className="px-4 py-3 text-center">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-[var(--color-border-light)]">
                      {timetables.map((tt) => (
                        <tr key={tt.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-700/30">
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-[var(--color-text-primary)]">{tt.name}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-[var(--color-text-muted)]">{tt.class_arm_name}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-[var(--color-text-muted)]">{tt.term_name}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleViewTimetable(tt)}
                                className="btn-press inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                {language === 'ar' ? 'عرض' : 'View'}
                              </button>
                              <button
                                onClick={() => handleGenerateTimetable(tt)}
                                disabled={generating}
                                className="btn-press inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-2 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                {language === 'ar' ? 'توليد' : 'Generate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Timetable Grid View */}
              {viewingTimetable && (
                <div className="card-hover rounded-xl border border-gray-100 bg-white p-5 shadow-sm opacity-0 animate-slide-up">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{viewingTimetable.name} - {language === 'ar' ? 'الجدول الزمني' : 'Timetable Grid'}</h3>
                    <button onClick={() => setViewingTimetable(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  {slotsLoading ? (
                    <SkeletonTable rows={4} />
                  ) : timetableSlots.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 dark:text-[var(--color-text-muted)] py-8">{language === 'ar' ? 'لا توجد حصص. اضغط "توليد" لإنشاء الجدول.' : 'No slots. Click "Generate" to create the timetable.'}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border border-gray-200">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-[var(--color-bg-primary)]">
                            <th className="border border-gray-200 dark:border-[var(--color-border)] px-3 py-2 text-xs font-medium text-gray-500 dark:text-[var(--color-text-muted)]">{language === 'ar' ? 'اليوم' : 'Day'}</th>
                            {periods.map((p) => (
                              <th key={p} className="border border-gray-200 dark:border-[var(--color-border)] px-3 py-2 text-xs font-medium text-gray-500 dark:text-[var(--color-text-muted)]">{language === 'ar' ? `الحصة ${p}` : `Period ${p}`}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {DAYS.filter(d => Object.keys(timetableGrid[d] || {}).length > 0 || timetableSlots.some(s => s.day === d)).map((day) => (
                            <tr key={day}>
                              <td className="border border-gray-200 dark:border-[var(--color-border)] px-3 py-2 font-medium text-gray-700 dark:text-[var(--color-text-secondary)] bg-gray-50 dark:bg-[var(--color-bg-primary)] text-xs">{day}</td>
                              {periods.map((p) => {
                                const slot = timetableGrid[day]?.[p];
                                return (
                                  <td key={p} className="border border-gray-200 dark:border-[var(--color-border)] px-3 py-2 text-center">
                                    {slot ? (
                                      <div>
                                        <p className="font-medium text-gray-900 dark:text-[var(--color-text-primary)] text-xs">{slot.subject_name}</p>
                                        <p className="text-[11px] text-gray-500 dark:text-[var(--color-text-muted)]">{slot.teacher_name}</p>
                                        {slot.room && <p className="text-[11px] text-gray-400 dark:text-[var(--color-text-muted)]">{slot.room}</p>}
                                      </div>
                                    ) : (
                                      <span className="text-gray-300 dark:text-[var(--color-text-muted)]">-</span>
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
              )}
            </div>
          )}
        </>
      )}

      {/* Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowSessionModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[var(--color-bg-secondary)] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{editingSession ? (language === 'ar' ? 'تعديل الفصل' : 'Edit Session') : (language === 'ar' ? 'إضافة فصل' : 'Add Session')}</h3>
              <button onClick={() => setShowSessionModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {sessionError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                {sessionError}
              </div>
            )}
            <form onSubmit={handleSaveSession} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الاسم' : 'Name'}</label>
                <input required type="text" value={sessionForm.name} onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })} className={inputCls} placeholder="2024-2025" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</label>
                <input required type="date" value={sessionForm.start_date} onChange={(e) => setSessionForm({ ...sessionForm, start_date: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</label>
                <input required type="date" value={sessionForm.end_date} onChange={(e) => setSessionForm({ ...sessionForm, end_date: e.target.value })} className={inputCls} />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={sessionSaving} className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700 disabled:opacity-50">
                  {sessionSaving ? (
                    <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('common.saving')}</>
                  ) : (
                    <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{t('common.save')}</>
                  )}
                </button>
                <button type="button" onClick={() => setShowSessionModal(false)} className="btn-press rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Term Modal */}
      {showTermModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowTermModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[var(--color-bg-secondary)] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{editingTerm ? (language === 'ar' ? 'تعديل term' : 'Edit Term') : (language === 'ar' ? 'إضافة term' : 'Add Term')}</h3>
              <button onClick={() => setShowTermModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {termError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">{termError}</div>
            )}
            <form onSubmit={handleSaveTerm} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الاسم' : 'Name'}</label>
                <input required type="text" value={termForm.name} onChange={(e) => setTermForm({ ...termForm, name: e.target.value })} className={inputCls} placeholder="Term 1" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الفصل' : 'Session'}</label>
                <select required value={termForm.session} onChange={(e) => setTermForm({ ...termForm, session: e.target.value })} className={selectCls}>
                  <option value="">{language === 'ar' ? 'اختر فصل' : 'Select session'}</option>
                  {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'رقم term' : 'Term Number'}</label>
                <select value={termForm.term_number} onChange={(e) => setTermForm({ ...termForm, term_number: e.target.value })} className={selectCls}>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</label>
                <input required type="date" value={termForm.start_date} onChange={(e) => setTermForm({ ...termForm, start_date: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</label>
                <input required type="date" value={termForm.end_date} onChange={(e) => setTermForm({ ...termForm, end_date: e.target.value })} className={inputCls} />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={termSaving} className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700 disabled:opacity-50">
                  {termSaving ? (
                    <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('common.saving')}</>
                  ) : (
                    <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{t('common.save')}</>
                  )}
                </button>
                <button type="button" onClick={() => setShowTermModal(false)} className="btn-press rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar Event Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowCalendarModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[var(--color-bg-secondary)] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{language === 'ar' ? 'إضافة حدث' : 'Add Event'}</h3>
              <button onClick={() => setShowCalendarModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {calendarError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">{calendarError}</div>
            )}
            <form onSubmit={handleSaveCalendarEvent} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'العنوان' : 'Title'}</label>
                <input required type="text" value={calendarForm.title} onChange={(e) => setCalendarForm({ ...calendarForm, title: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'النوع' : 'Type'}</label>
                <select value={calendarForm.event_type} onChange={(e) => setCalendarForm({ ...calendarForm, event_type: e.target.value })} className={selectCls}>
                  {EVENT_TYPES.map((et) => <option key={et} value={et} className="capitalize">{et.charAt(0).toUpperCase() + et.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'من' : 'Start Date'}</label>
                <input required type="date" value={calendarForm.start_date} onChange={(e) => setCalendarForm({ ...calendarForm, start_date: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'إلى' : 'End Date'}</label>
                <input required type="date" value={calendarForm.end_date} onChange={(e) => setCalendarForm({ ...calendarForm, end_date: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الوصف' : 'Description'}</label>
                <textarea value={calendarForm.description} onChange={(e) => setCalendarForm({ ...calendarForm, description: e.target.value })} className={inputCls} rows={3} />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={calendarSaving} className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700 disabled:opacity-50">
                  {calendarSaving ? (
                    <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('common.creating')}</>
                  ) : (
                    <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{t('common.create')}</>
                  )}
                </button>
                <button type="button" onClick={() => setShowCalendarModal(false)} className="btn-press rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Arm Modal */}
      {showClassArmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowClassArmModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[var(--color-bg-secondary)] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{language === 'ar' ? 'إضافة فرع' : 'Add Class Arm'}</h3>
              <button onClick={() => setShowClassArmModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {classArmError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">{classArmError}</div>
            )}
            <form onSubmit={handleSaveClassArm} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الفصل الدراسي' : 'School Class'}</label>
                <select required value={classArmForm.school_class} onChange={(e) => setClassArmForm({ ...classArmForm, school_class: e.target.value })} className={selectCls}>
                  <option value="">{language === 'ar' ? 'اختر فصل' : 'Select class'}</option>
                  {schoolClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'اسم الفرع' : 'Arm Name'}</label>
                <input required type="text" value={classArmForm.name} onChange={(e) => setClassArmForm({ ...classArmForm, name: e.target.value })} className={inputCls} placeholder="A" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={classArmSaving} className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700 disabled:opacity-50">
                  {classArmSaving ? (
                    <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('common.creating')}</>
                  ) : (
                    <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{t('common.create')}</>
                  )}
                </button>
                <button type="button" onClick={() => setShowClassArmModal(false)} className="btn-press rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timetable Modal */}
      {showTimetableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowTimetableModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[var(--color-bg-secondary)] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{language === 'ar' ? 'إضافة جدول' : 'Add Timetable'}</h3>
              <button onClick={() => setShowTimetableModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {timetableError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">{timetableError}</div>
            )}
            <form onSubmit={handleSaveTimetable} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الاسم' : 'Name'}</label>
                <input required type="text" value={timetableForm.name} onChange={(e) => setTimetableForm({ ...timetableForm, name: e.target.value })} className={inputCls} placeholder="Class 7 Timetable" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'الفرع' : 'Class Arm'}</label>
                <select required value={timetableForm.class_arm} onChange={(e) => setTimetableForm({ ...timetableForm, class_arm: e.target.value })} className={selectCls}>
                  <option value="">{language === 'ar' ? 'اختر فرع' : 'Select arm'}</option>
                  {classArms.map((ca) => <option key={ca.id} value={ca.id}>{ca.school_class_name} - {ca.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">{language === 'ar' ? 'Term' : 'Term'}</label>
                <select required value={timetableForm.term} onChange={(e) => setTimetableForm({ ...timetableForm, term: e.target.value })} className={selectCls}>
                  <option value="">{language === 'ar' ? 'اختر term' : 'Select term'}</option>
                  {terms.map((tt) => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={timetableSaving} className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-700 disabled:opacity-50">
                  {timetableSaving ? (
                    <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{t('common.creating')}</>
                  ) : (
                    <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{t('common.create')}</>
                  )}
                </button>
                <button type="button" onClick={() => setShowTimetableModal(false)} className="btn-press rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <ConfirmModal
          title={language === 'ar' ? 'حذف' : 'Delete'}
          message={language === 'ar' ? 'هل أنت متأكد من الحذف؟ لا يمكن التراجع.' : 'Are you sure you want to delete? This cannot be undone.'}
          onConfirm={() => {
            if (deleteConfirm.type === 'session') handleDeleteSession();
            else if (deleteConfirm.type === 'term') handleDeleteTerm();
            else if (deleteConfirm.type === 'calendar') handleDeleteCalendarEvent();
          }}
          onCancel={() => setDeleteConfirm(null)}
          variant="danger"
        />
      )}
    </div>
  );
}
