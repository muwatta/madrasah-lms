import { useState, useEffect } from 'react';
import { learningAPI, subjectAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { SkeletonCard } from '../../components/Skeleton';
import type { Subject } from '../../types';

interface LearningPathItem {
  id: number;
  title: string;
  item_type: string;
  content: string;
  order: number;
  is_completed: boolean;
  completed_at: string | null;
  score: number | null;
}

interface LearningPath {
  id: number;
  student: number;
  student_name: string;
  subject: number;
  subject_name: string;
  title: string;
  current_level: number;
  total_levels: number;
  progress_percent: number;
  is_active: boolean;
  items: LearningPathItem[];
  total_items: number;
  completed_items: number;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  lesson: '📖',
  quiz: '📝',
  practice: '✏️',
  video: '🎬',
  reading: '📚',
  project: '🎯',
};

export default function LearningPathPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pathsRes, subjectsRes] = await Promise.all([
        learningAPI.paths.list(),
        subjectAPI.list(),
      ]);
      setPaths(pathsRes.data.results ?? pathsRes.data);
      setSubjects(subjectsRes.data.results ?? subjectsRes.data);
    } catch {
      setError('Failed to load learning paths');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedSubject || !user) return;
    try {
      setGenerating(true);
      const res = await learningAPI.paths.generate({
        student: user.id,
        subject: selectedSubject,
      });
      setPaths(prev => {
        const exists = prev.find(p => p.id === res.data.id);
        if (exists) return prev;
        return [res.data, ...prev];
      });
      setSelectedPath(res.data);
      setSelectedSubject(null);
    } catch {
      setError('Failed to generate learning path');
    } finally {
      setGenerating(false);
    }
  };

  const handleCompleteItem = async (itemId: number) => {
    if (!selectedPath) return;
    try {
      const res = await learningAPI.paths.completeItem(selectedPath.id, itemId);
      setSelectedPath(res.data);
      setPaths(prev => prev.map(p => (p.id === res.data.id ? res.data : p)));
    } catch {
      setError('Failed to mark item as complete');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700 mb-2" />
            <div className="h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (selectedPath) {
    const completedCount = selectedPath.items.filter(i => i.is_completed).length;
    const totalCount = selectedPath.items.length;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedPath(null)}
            className="rounded-lg border border-[var(--color-border)] dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] dark:text-gray-300 hover:bg-[var(--color-bg-secondary)] dark:hover:bg-gray-700 transition-colors"
          >
            ← {t('common.previous')}
          </button>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] dark:text-gray-100">{selectedPath.title}</h1>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-muted)] dark:text-gray-400">{selectedPath.subject_name}</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)] dark:text-gray-100">{selectedPath.student_name}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{progressPct}%</p>
              <p className="text-xs text-[var(--color-text-muted)] dark:text-gray-400">
                {completedCount} / {totalCount} {t('learning.itemsCompleted')}
              </p>
            </div>
          </div>
          <div className="h-3 w-full rounded-full bg-[var(--color-bg-secondary)] dark:bg-gray-700">
            <div
              className="h-3 rounded-full bg-primary-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {selectedPath.items.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                item.is_completed
                  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 hover:shadow-sm'
              }`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                item.is_completed ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-[var(--color-bg-secondary)] dark:bg-gray-700 text-[var(--color-text-secondary)] dark:text-gray-300'
              }`}>
                {item.is_completed ? '✓' : idx + 1}
              </span>
              <span className="text-xl">{TYPE_ICONS[item.item_type] || '📋'}</span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${item.is_completed ? 'text-emerald-700 dark:text-emerald-400' : 'text-[var(--color-text-primary)] dark:text-gray-100'}`}>
                  {item.title}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] dark:text-gray-400 capitalize">{item.item_type}</p>
              </div>
              {!item.is_completed && (
                <button
                  onClick={() => handleCompleteItem(item.id)}
                  className="shrink-0 rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-700 transition-colors"
                >
                  {t('learning.markComplete')}
                </button>
              )}
              {item.is_completed && (
                <span className="shrink-0 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {t('learning.done')}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] dark:text-gray-100">{t('learning.title')}</h1>
          <p className="text-sm text-[var(--color-text-muted)] dark:text-gray-400">{t('learning.subtitle')}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {paths.length === 0 && (
        <div className="rounded-xl border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-8 text-center">
          <p className="mb-4 text-[var(--color-text-muted)] dark:text-gray-400">{t('learning.noPaths')}</p>
          <div className="mx-auto flex max-w-sm items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)] dark:text-gray-300">
                {t('fields.subject')}
              </label>
              <select
                value={selectedSubject ?? ''}
                onChange={e => setSelectedSubject(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--color-border)] dark:border-gray-600 bg-[var(--color-bg-secondary)] dark:bg-gray-700 px-3 py-2 text-sm text-[var(--color-text-primary)] dark:text-gray-100"
              >
                <option value="">{t('filters.chooseSubject')}</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name_ar}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!selectedSubject || generating}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {generating ? t('common.creating') : t('learning.generatePath')}
            </button>
          </div>
        </div>
      )}

      {paths.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paths.map(path => {
              const pct = path.total_items > 0
                ? Math.round((path.completed_items / path.total_items) * 100)
                : 0;
              return (
                <button
                  key={path.id}
                  onClick={() => setSelectedPath(path)}
                  className="rounded-xl border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-5 text-left shadow-sm hover:shadow-md transition-all"
                >
                  <p className="text-xs text-[var(--color-text-muted)] dark:text-gray-400">{path.subject_name}</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)] dark:text-gray-100">{path.title}</p>
                  <div className="mt-3 h-2 w-full rounded-full bg-[var(--color-bg-secondary)] dark:bg-gray-700">
                    <div
                      className="h-2 rounded-full bg-primary-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[var(--color-text-muted)] dark:text-gray-400">
                    {path.completed_items}/{path.total_items} {t('learning.items')} · {pct}%
                  </p>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 p-6 shadow-sm">
            <p className="mb-3 text-sm font-medium text-[var(--color-text-secondary)] dark:text-gray-300">{t('learning.addNewPath')}</p>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)] dark:text-gray-300">
                  {t('fields.subject')}
                </label>
                <select
                  value={selectedSubject ?? ''}
                  onChange={e => setSelectedSubject(Number(e.target.value))}
                  className="w-full rounded-lg border border-[var(--color-border)] dark:border-gray-600 bg-[var(--color-bg-secondary)] dark:bg-gray-700 px-3 py-2 text-sm text-[var(--color-text-primary)] dark:text-gray-100"
                >
                  <option value="">{t('filters.chooseSubject')}</option>
                  {subjects
                    .filter(s => !paths.some(p => p.subject === s.id))
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name_ar}
                      </option>
                    ))}
                </select>
              </div>
              <button
                onClick={handleGenerate}
                disabled={!selectedSubject || generating}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {generating ? t('common.creating') : t('learning.generatePath')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
