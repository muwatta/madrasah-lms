import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Filter, Search, X } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import type { MissionCategory, MissionType, SpeakingLevel } from '../../../types';
import { MISSION_TYPE_LABELS } from '../../../types';
import type { MissionSort, MissionStatus } from './missionStatus';
import { MISSION_SORTS } from './missionStatus';

interface MissionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  levels: SpeakingLevel[];
  categories: MissionCategory[];
  selectedLevel: number | null;
  onLevelChange: (value: number | null) => void;
  selectedCategory: number | null;
  onCategoryChange: (value: number | null) => void;
  selectedType: MissionType | null;
  onTypeChange: (value: MissionType | null) => void;
  selectedStatus: MissionStatus | null;
  onStatusChange: (value: MissionStatus | null) => void;
  sort: MissionSort;
  onSortChange: (value: MissionSort) => void;
  statusCounts: Record<MissionStatus, number>;
  activeCount: number;
  onClear: () => void;
}

interface LabeledSelectProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function LabeledSelect({ label, value, onChange, options }: LabeledSelectProps) {
  const { language } = useLanguage();
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          className="w-full cursor-pointer appearance-none rounded-lg border bg-transparent px-3 py-2 pr-8 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-600"
          style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-current opacity-50 ltr:right-2 rtl:left-2" aria-hidden />
      </span>
    </label>
  );
}

export default function MissionFilters(props: MissionFiltersProps) {
  const { t, language } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    search,
    onSearchChange,
    levels,
    categories,
    selectedLevel,
    onLevelChange,
    selectedCategory,
    onCategoryChange,
    selectedType,
    onTypeChange,
    selectedStatus,
    onStatusChange,
    sort,
    onSortChange,
    statusCounts,
    activeCount,
    onClear,
  } = props;

  const typeOptions = Object.keys(MISSION_TYPE_LABELS) as MissionType[];

  const levelOptions = [
    { value: '', label: t('fasaaha.allMissions') },
    ...levels.map((lv) => ({
      value: String(lv.id),
      label: language === 'ar' ? lv.name_ar : lv.name,
    })),
  ];

  const categoryOptions = [
    { value: '', label: t('fasaaha.allCategories') },
    ...categories.map((c) => ({
      value: String(c.id),
      label: language === 'ar' ? c.name_ar : c.name,
    })),
  ];

  const typeSelectOptions = [
    { value: '', label: t('fasaaha.allMissions') },
    ...typeOptions.map((m) => ({ value: m, label: MISSION_TYPE_LABELS[m] })),
  ];

  const statusOptions = [
    { value: '', label: t('fasaaha.allMissions') },
    ...(['notStarted', 'inProgress', 'needsPractice', 'completed'] as MissionStatus[]).map((s) => ({
      value: s,
      label: `${t(`fasaaha.${s}`)} (${statusCounts[s] ?? 0})`,
    })),
  ];

  const sortOptions = MISSION_SORTS.map((s) => ({ value: s, label: t(`fasaaha.sort${s[0].toUpperCase()}${s.slice(1)}`) }));

  const filtersControls = (
    <>
      <LabeledSelect
        label={t('fasaaha.filterLevel')}
        value={selectedLevel === null ? '' : String(selectedLevel)}
        onChange={(v) => onLevelChange(v === '' ? null : Number(v))}
        options={levelOptions}
      />
      <LabeledSelect
        label={t('fasaaha.filterCategory')}
        value={selectedCategory === null ? '' : String(selectedCategory)}
        onChange={(v) => onCategoryChange(v === '' ? null : Number(v))}
        options={categoryOptions}
      />
      <LabeledSelect
        label={t('fasaaha.filterType')}
        value={selectedType === null ? '' : selectedType}
        onChange={(v) => onTypeChange(v === '' ? null : (v as MissionType))}
        options={typeSelectOptions}
      />
      <LabeledSelect
        label={t('fasaaha.filterStatus')}
        value={selectedStatus === null ? '' : selectedStatus}
        onChange={(v) => onStatusChange(v === '' ? null : (v as MissionStatus))}
        options={statusOptions}
      />
    </>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-56">
          <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-current opacity-50 ltr:left-3 rtl:right-3" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('fasaaha.searchMissions')}
            className="w-full rounded-xl border bg-transparent py-2.5 pl-9 pr-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-600 rtl:pl-3 rtl:pr-9"
            style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}
          />
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {filtersControls}
          <LabeledSelect label={t('fasaaha.sortBy')} value={sort} onChange={(v) => onSortChange(v as MissionSort)} options={sortOptions} />
        </div>

        <div className="md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold"
            style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}
          >
            <Filter className="h-4 w-4" aria-hidden />
            {t('fasaaha.filters')}
            {activeCount > 0 && (
              <span className="rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{activeCount}</span>
            )}
          </button>
        </div>

        {(activeCount > 0 || search) && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 transition-colors hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            {t('fasaaha.clearFilters')}
          </button>
        )}
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t('fasaaha.filters')}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t p-5 md:hidden"
              style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background: 'var(--color-border)' }} />
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {t('fasaaha.filters')}
                </h2>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" style={{ color: 'var(--color-text-primary)' }} aria-hidden />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {filtersControls}
                <LabeledSelect
                  label={t('fasaaha.sortBy')}
                  value={sort}
                  onChange={(v) => onSortChange(v as MissionSort)}
                  options={sortOptions}
                />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={onClear}
                  className="rounded-xl border px-4 py-2.5 text-xs font-semibold"
                  style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
                >
                  {t('fasaaha.clearFilters')}
                </button>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-bold text-white"
                >
                  {t('fasaaha.applyFilters')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
