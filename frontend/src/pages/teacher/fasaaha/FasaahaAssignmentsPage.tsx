import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../../../context/LanguageContext';
import { enrollmentAPI } from '../../../api';
import {
  useFasaahaAssignments,
  useFasaahaCreateAssignment,
  useFasaahaDeleteAssignment,
  useFasaahaMissions,
} from '../../../hooks/useFasaaha';
import { SkeletonTable } from '../../../components/Skeleton';
import ConfirmModal from '../../../components/ConfirmModal';

export default function FasaahaAssignmentsPage() {
  const { t } = useLanguage();
  const { data: assignments = [], isLoading: loadingAssignments } = useFasaahaAssignments();
  const { data: missions = [] } = useFasaahaMissions();
  const createAssignment = useFasaahaCreateAssignment();
  const deleteAssignment = useFasaahaDeleteAssignment();

  const { data: classes = [] } = useQuery({
    queryKey: ['fasaaha', 'assignments', 'classes'],
    queryFn: async () => {
      const res = await enrollmentAPI.teacherClasses();
      return res.data;
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ['fasaaha', 'assignments', 'students'],
    queryFn: async () => {
      const res = await enrollmentAPI.teacherStudents();
      return res.data;
    },
  });

  const [targetType, setTargetType] = useState<'class' | 'student'>('class');
  const [mission, setMission] = useState(0);
  const [target, setTarget] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const targets = targetType === 'class' ? classes : students;

  const openCreate = () => {
    setMission(missions[0]?.id ?? 0);
    setTarget(targets[0]?.id ?? 0);
    setTargetType('class');
    setDueDate('');
    setIsRequired(false);
    setNotes('');
    setError('');
    setShowForm(true);
  };

  const switchTargetType = (type: 'class' | 'student') => {
    setTargetType(type);
    const list = type === 'class' ? classes : students;
    setTarget(list[0]?.id ?? 0);
  };

  const handleSubmit = async () => {
    if (!mission) {
      setError(t('fasaaha.selectMission'));
      return;
    }
    if (!target) {
      setError(t('fasaaha.selectTargetHint'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createAssignment.mutateAsync({
        mission,
        target_class: targetType === 'class' ? target : null,
        target_student: targetType === 'student' ? target : null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        is_required: isRequired,
        notes,
      });
      setShowForm(false);
    } catch {
      setError(t('common.loadError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteAssignment.mutateAsync(deleteId);
    setDeleteId(null);
  };

  if (loadingAssignments) return <SkeletonTable />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.assignments')}</h1>
        <button onClick={openCreate} disabled={missions.length === 0} className="btn-press px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-50">{t('fasaaha.createAssignment')}</button>
      </div>

      {showForm && (
        <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.missionAssigned')}</h3>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.selectMission')}</label>
            <select value={mission} onChange={e => setMission(Number(e.target.value))} className="rounded-lg border px-3 py-2 text-sm w-full" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: '#ffffff' }}>
              {missions.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>

          <div className="flex gap-2">
            <button onClick={() => switchTargetType('class')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${targetType === 'class' ? 'bg-primary-600 text-white' : 'border'}`} style={targetType === 'class' ? undefined : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>{t('fasaaha.assignToClass')}</button>
            <button onClick={() => switchTargetType('student')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${targetType === 'student' ? 'bg-primary-600 text-white' : 'border'}`} style={targetType === 'student' ? undefined : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>{t('fasaaha.assignToStudent')}</button>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.assignTo')}</label>
            <select value={target} onChange={e => setTarget(Number(e.target.value))} className="rounded-lg border px-3 py-2 text-sm w-full" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: '#ffffff' }}>
              {(targets as any[]).map((item: any) => (
                <option key={item.id} value={item.id}>{item.name_en || item.student_name || item.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.dueDate')}</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="rounded-lg border px-3 py-2 text-sm w-full" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: '#ffffff' }} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
                <input type="checkbox" checked={isRequired} onChange={e => setIsRequired(e.target.checked)} className="w-4 h-4" />
                {t('fasaaha.required')}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.description')}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="rounded-lg border px-3 py-2 text-sm w-full" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: '#ffffff' }} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3">
            <button onClick={handleSubmit} disabled={saving} className="btn-press px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-50">{saving ? '...' : t('fasaaha.save')}</button>
            <button onClick={() => setShowForm(false)} className="btn-press px-4 py-2 rounded-lg border text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>{t('fasaaha.cancel')}</button>
          </div>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        {assignments.length === 0 ? (
          <p className="p-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.noAssignments')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
              <tr>
                <th className="text-start px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.title')}</th>
                <th className="text-start px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.assignTo')}</th>
                <th className="text-start px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.dueDate')}</th>
                <th className="text-start px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.required')}</th>
                <th className="text-end px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id} className="border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>{a.mission_title}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                    {a.target_class_name ? `${a.target_class_name} (${t('fasaaha.assignedClass')})` : a.target_student_name ? `${a.target_student_name} (${t('fasaaha.assignedStudent')})` : '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{a.due_date ? new Date(a.due_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">{a.is_required && <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">{t('fasaaha.required')}</span>}</td>
                  <td className="px-4 py-3 text-end">
                    <button onClick={() => setDeleteId(a.id)} className="text-xs text-red-500 hover:underline">{t('fasaaha.unassignMission')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteId && <ConfirmModal title={t('fasaaha.confirmDelete')} message={t('fasaaha.confirmDelete')} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} variant="danger" />}
    </div>
  );
}
