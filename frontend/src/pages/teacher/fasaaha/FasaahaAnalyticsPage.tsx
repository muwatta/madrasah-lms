import { useEffect, useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { fasaahaAPI } from '../../../api';
import { SkeletonStatsGrid } from '../../../components/Skeleton';

export default function FasaahaAnalyticsPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<'class' | 'student'>('class');
  const [classData, setClassData] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fasaahaAPI.analytics.class().then(res => setClassData(res.data)).finally(() => setLoading(false));
  }, []);

  const loadStudent = () => {
    if (!studentId) return;
    setLoading(true);
    fasaahaAPI.analytics.student(Number(studentId)).then(res => setStudentData(res.data)).finally(() => setLoading(false));
  };

  if (loading && !classData) return <SkeletonStatsGrid />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.analyticsTitle')}</h1>

      <div className="flex gap-2">
        <button onClick={() => setTab('class')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'class' ? 'bg-primary-600 text-white' : 'border'}`} style={tab === 'class' ? undefined : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>{t('fasaaha.classAnalytics')}</button>
        <button onClick={() => setTab('student')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'student' ? 'bg-primary-600 text-white' : 'border'}`} style={tab === 'student' ? undefined : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>{t('fasaaha.studentAnalytics')}</button>
      </div>

      {tab === 'class' && classData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: t('fasaaha.averageScore'), value: `${Math.round(classData.average_score ?? 0)}%` },
              { label: t('fasaaha.totalStudents'), value: classData.total_students ?? 0 },
              { label: t('fasaaha.completedMissions'), value: classData.total_attempts ?? 0 },
            ].map(s => (
              <div key={s.label} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {classData.score_distribution && (
            <div className="rounded-xl border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>{t('fasaaha.scoreDistribution')}</h3>
              <div className="flex items-end gap-2 h-32">
                {Object.entries(classData.score_distribution).map(([range, count]: [string, any]) => {
                  const vals = Object.values(classData.score_distribution as Record<string, number>) as number[];
                  const max = Math.max(...vals, 1);
                  return (
                    <div key={range} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>{count}</span>
                      <div className="w-full bg-primary-500 rounded-t" style={{ height: `${(count / max) * 100}%` }} />
                      <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{range}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'student' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input type="number" placeholder={t('fasaaha.selectStudent')} value={studentId} onChange={e => setStudentId(e.target.value)} className="rounded-lg border px-3 py-2 text-sm w-48" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: '#ffffff' }} />
            <button onClick={loadStudent} disabled={!studentId} className="btn-press px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-50">{t('fasaaha.studentDetails')}</button>
          </div>

          {studentData && (
            <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}>
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{studentData.total_attempts ?? 0}</p><p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.totalAttempts')}</p></div>
                <div><p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{Math.round(studentData.average_score ?? 0)}%</p><p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.averageScore')}</p></div>
                <div><p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{studentData.best_score ?? 0}%</p><p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('fasaaha.bestScore')}</p></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
