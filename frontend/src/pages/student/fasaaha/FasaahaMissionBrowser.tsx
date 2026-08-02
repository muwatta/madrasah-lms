import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { fasaahaAPI } from '../../../api';
import {
  useFasaahaLevels,
  useFasaahaCategories,
  useFasaahaDashboard,
} from '../../../hooks/useFasaaha';
import type { Mission, MissionType, SpeakingAttempt } from '../../../types';
import { MISSION_TYPE_LABELS } from '../../../types';
import MissionsHero from '../../../components/fasaaha/missions/MissionsHero';
import RecommendedMission from '../../../components/fasaaha/missions/RecommendedMission';
import MissionLevelNavigation from '../../../components/fasaaha/missions/MissionLevelNavigation';
import MissionFilters from '../../../components/fasaaha/missions/MissionFilters';
import MissionGrid from '../../../components/fasaaha/missions/MissionGrid';
import DailySpeakingChallenge from '../../../components/fasaaha/missions/DailySpeakingChallenge';
import {
  computeMissionProgress,
  groupAttemptsByMission,
  missionRoute,
  type MissionProgressInfo,
  type MissionSort,
  type MissionStatus,
} from '../../../components/fasaaha/missions/missionStatus';

const EMPTY_MISSIONS: Mission[] = [];

async function fetchAllPages<T>(fetcher: (params: Record<string, string | number>) => Promise<{ data: unknown }>): Promise<T[]> {  const all: T[] = [];
  let page = 1;
  for (;;) {
    const res = await fetcher({ page });
    const data = res.data as { results?: T[]; next?: string | null } | T[];
    const batch = Array.isArray(data) ? data : (data.results ?? []);
    all.push(...batch);
    if (Array.isArray(data) || !data.next) break;
    page += 1;
  }
  return all;
}

function matchesSearch(mission: Mission, q: string): boolean {
  const haystack = [
    mission.title,
    mission.title_ar,
    mission.prompt_ar,
    mission.prompt_translation,
    mission.prompt_transliteration,
    mission.category_name,
    mission.level_name,
    MISSION_TYPE_LABELS[(mission.mission_type as MissionType) ?? 'pronunciation'],
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

function pickRecommended(
  missions: Mission[],
  progressMap: Map<number, MissionProgressInfo>,
  currentLevelId: number | null,
  hasProgress: boolean,
): Mission | null {
  if (missions.length === 0) return null;

  const ordered = [...missions].sort(
    (a, b) => a.level_number - b.level_number || a.sort_order - b.sort_order || a.id - b.id,
  );

  const statusOf = (m: Mission) => progressMap.get(m.id)?.status ?? 'notStarted';
  const inCurrent = (m: Mission) => currentLevelId === null || m.level === currentLevelId;

  if (hasProgress) {
    const inProgressItem = ordered.find((m) => inCurrent(m) && (statusOf(m) === 'needsPractice' || statusOf(m) === 'inProgress'));
    if (inProgressItem) return inProgressItem;
    const freshCurrent = ordered.find((m) => inCurrent(m) && statusOf(m) === 'notStarted');
    if (freshCurrent) return freshCurrent;
    const anyWork = ordered.find((m) => statusOf(m) === 'needsPractice' || statusOf(m) === 'inProgress');
    if (anyWork) return anyWork;
    const anyFresh = ordered.find((m) => statusOf(m) === 'notStarted');
    if (anyFresh) return anyFresh;
    return ordered[0];
  }

  const first = ordered.find((m) => statusOf(m) === 'notStarted');
  return first ?? ordered[0];
}

function sortMissions(
  missions: Mission[],
  sort: MissionSort,
  progressMap: Map<number, MissionProgressInfo>,
): Mission[] {
  const list = [...missions];
  switch (sort) {
    case 'easiest':
      return list.sort((a, b) => a.difficulty - b.difficulty || a.level_number - b.level_number);
    case 'hardest':
      return list.sort((a, b) => b.difficulty - a.difficulty || b.level_number - a.level_number);
    case 'shortest':
      return list.sort((a, b) => (a.max_time_seconds ?? 0) - (b.max_time_seconds ?? 0));
    case 'recent': {
      return list.sort((a, b) => {
        const ta = progressMap.get(a.id)?.lastAttemptedAt ?? '';
        const tb = progressMap.get(b.id)?.lastAttemptedAt ?? '';
        return tb.localeCompare(ta);
      });
    }
    case 'recommended':
    default:
      return list.sort((a, b) => a.level_number - b.level_number || a.sort_order - b.sort_order || a.id - b.id);
  }
}
export default function FasaahaMissionBrowser() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<MissionType | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<MissionStatus | null>(null);
  const [sort, setSort] = useState<MissionSort>('recommended');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const { data: levels = [] } = useFasaahaLevels();
  const { data: categories = [] } = useFasaahaCategories();
  const dashboardQuery = useFasaahaDashboard();

  const allMissionsQuery = useQuery<Mission[]>({
    queryKey: ['fasaaha', 'missions', 'all'],
    queryFn: () => fetchAllPages<Mission>((params) => fasaahaAPI.missions.list(params)),
    staleTime: 5 * 60 * 1000,
  });

  const allAttemptsQuery = useQuery<SpeakingAttempt[]>({
    queryKey: ['fasaaha', 'attempts', 'all'],
    queryFn: () => fetchAllPages<SpeakingAttempt>((params) => fasaahaAPI.attempts.list(params)),
    staleTime: 60 * 1000,
  });

  const allMissions = allMissionsQuery.data ?? EMPTY_MISSIONS;

  const progressByMission = useMemo(() => {
    const grouped = groupAttemptsByMission(allAttemptsQuery.data ?? []);
    const map = new Map<number, MissionProgressInfo>();
    for (const mission of allMissions) {
      map.set(mission.id, computeMissionProgress(grouped.get(mission.id) ?? []));
    }
    return map;
  }, [allAttemptsQuery.data, allMissions]);

  const statusCounts = useMemo(() => {
    const counts: Record<MissionStatus, number> = { notStarted: 0, inProgress: 0, needsPractice: 0, completed: 0 };
    for (const info of progressByMission.values()) {
      counts[info.status] += 1;
    }
    return counts;
  }, [progressByMission]);

  const totalAttempts = dashboardQuery.data?.total_attempts ?? 0;
  const completedCount = dashboardQuery.data?.completed_missions ?? statusCounts.completed;
  const hasProgress = totalAttempts > 0;

  const recommended = useMemo(
    () => pickRecommended(allMissions, progressByMission, dashboardQuery.data?.current_level?.id ?? null, hasProgress),
    [allMissions, progressByMission, dashboardQuery.data?.current_level?.id, hasProgress],
  );

  const filteredMissions = useMemo(() => {
    let list = allMissions;
    if (selectedLevel !== null) list = list.filter((m) => m.level === selectedLevel);
    if (selectedCategory !== null) list = list.filter((m) => m.category === selectedCategory);
    if (selectedType !== null) list = list.filter((m) => m.mission_type === selectedType);
    if (selectedStatus !== null) list = list.filter((m) => progressByMission.get(m.id)?.status === selectedStatus);
    if (debouncedSearch) list = list.filter((m) => matchesSearch(m, debouncedSearch));
    return sortMissions(list, sort, progressByMission);
  }, [allMissions, selectedLevel, selectedCategory, selectedType, selectedStatus, debouncedSearch, sort, progressByMission]);

  const activeFilterCount = [selectedLevel, selectedCategory, selectedType, selectedStatus].filter((v) => v !== null).length;

  const handleClearFilters = () => {
    setSelectedLevel(null);
    setSelectedCategory(null);
    setSelectedType(null);
    setSelectedStatus(null);
    setSearch('');
  };

  const handleStartMission = (missionId: number) => {
    const mission = allMissions.find((m) => m.id === missionId);
    if (!mission) return;
    navigate(missionRoute(mission));
  };

  const completedByLevel = useMemo(() => {
    const map = new Map<number, number>();
    for (const [id, info] of progressByMission) {
      if (info.status === 'completed') {
        const mission = allMissions.find((m) => m.id === id);
        if (mission) map.set(mission.level, (map.get(mission.level) ?? 0) + 1);
      }
    }
    return map;
  }, [progressByMission, allMissions]);

  const totalByLevel = useMemo(() => {
    const map = new Map<number, number>();
    for (const mission of allMissions) {
      map.set(mission.level, (map.get(mission.level) ?? 0) + 1);
    }
    return map;
  }, [allMissions]);

  const recommendedTitle =
    recommended && (language === 'ar' ? recommended.title_ar || recommended.title : recommended.title);

  return (
    <div className="space-y-8">
      <MissionsHero
        completed={completedCount}
        total={allMissions.length}
        hasProgress={hasProgress}
        recommendedMissionId={recommended?.id ?? null}
        recommendedTitle={recommendedTitle ?? null}
        onStartRecommended={handleStartMission}
      />

      {recommended && !allMissionsQuery.isLoading && (
        <RecommendedMission
          mission={recommended}
          progress={progressByMission.get(recommended.id) ?? fallbackProgress}
          onStart={handleStartMission}
        />
      )}

      <DailySpeakingChallenge onStart={() => recommended && handleStartMission(recommended.id)} disabled={!recommended} />

      <MissionLevelNavigation
        levels={levels}
        activeLevelId={selectedLevel}
        onSelect={setSelectedLevel}
        completedByLevel={completedByLevel}
        totalByLevel={totalByLevel}
      />

      <MissionFilters
        search={search}
        onSearchChange={setSearch}
        levels={levels}
        categories={categories}
        selectedLevel={selectedLevel}
        onLevelChange={setSelectedLevel}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        sort={sort}
        onSortChange={setSort}
        statusCounts={statusCounts}
        activeCount={activeFilterCount}
        onClear={handleClearFilters}
      />

      <section aria-label={t('fasaaha.missionsTitle')}>
        <MissionGrid
          missions={filteredMissions}
          progressByMission={progressByMission}
          onStart={handleStartMission}
          isLoading={allMissionsQuery.isLoading}
          isError={allMissionsQuery.isError}
          hasActiveFilters={activeFilterCount > 0 || debouncedSearch.length > 0}
          hasAnyProgress={hasProgress}
          onClearFilters={handleClearFilters}
          visibleCount={filteredMissions.length}
        />
      </section>
    </div>
  );
}

const fallbackProgress: MissionProgressInfo = {
  status: 'notStarted',
  bestScore: null,
  attemptsCount: 0,
  lastAttemptedAt: null,
  isHighScore: false,
};
