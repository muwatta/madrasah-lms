import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fasaahaAPI } from '../api';
import { unwrapPaginated } from '../api/client';
import type {
  SpeakingLevel,
  MissionCategory,
  Mission,
  SpeakingAttempt,
  StudentLevelProgress,
  StudentStreak,
  Badge,
  StudentBadge,
  FasaahaStudentDashboard,
  FasaahaTeacherDashboard,
  DialogueSession,
  DialogueTurn,
  DialogueEvaluation,
  DailyGoal,
  LeaderboardEntry,
  ScoreTrend,
} from '../types';

// ── Levels ────────────────────────────────────────────────────────────────

export function useLevels() {
  return useQuery<SpeakingLevel[]>({
    queryKey: ['fasaaha', 'levels'],
    queryFn: async () => {
      const res = await fasaahaAPI.levels.list();
      return unwrapPaginated<SpeakingLevel>(res.data);
    },
  });
}

// ── Categories ────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery<MissionCategory[]>({
    queryKey: ['fasaaha', 'categories'],
    queryFn: async () => {
      const res = await fasaahaAPI.categories.list();
      return unwrapPaginated<MissionCategory>(res.data);
    },
  });
}

// ── Missions ──────────────────────────────────────────────────────────────

export function useMissions(params?: {
  level?: number;
  category?: number;
  difficulty?: number;
  mission_type?: string;
}) {
  return useQuery<Mission[]>({
    queryKey: ['fasaaha', 'missions', params],
    queryFn: async () => {
      const res = await fasaahaAPI.missions.list(params);
      return unwrapPaginated<Mission>(res.data);
    },
  });
}

export function useMission(id: number | null) {
  return useQuery<Mission>({
    queryKey: ['fasaaha', 'mission', id],
    queryFn: async () => {
      const res = await fasaahaAPI.missions.get(id!);
      return res.data;
    },
    enabled: id !== null && id > 0,
  });
}

export function useMissionsForLevel(levelId: number | null) {
  return useQuery<Mission[]>({
    queryKey: ['fasaaha', 'missions', 'level', levelId],
    queryFn: async () => {
      const res = await fasaahaAPI.missions.forLevel(levelId!);
      return unwrapPaginated<Mission>(res.data);
    },
    enabled: levelId !== null && levelId > 0,
  });
}

// ── Attempts ──────────────────────────────────────────────────────────────

export function useAttempts(params?: { page_size?: number; mission?: number; status?: string }) {
  return useQuery<SpeakingAttempt[]>({
    queryKey: ['fasaaha', 'attempts', params],
    queryFn: async () => {
      const res = await fasaahaAPI.attempts.list(params);
      return unwrapPaginated<SpeakingAttempt>(res.data);
    },
  });
}

export function useSubmitAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => fasaahaAPI.attempts.submit(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fasaaha', 'attempts'] });
      qc.invalidateQueries({ queryKey: ['fasaaha', 'dashboard'] });
      qc.invalidateQueries({ queryKey: ['fasaaha', 'progress'] });
      qc.invalidateQueries({ queryKey: ['fasaaha', 'streak'] });
    },
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────

export function useStudentDashboard() {
  return useQuery<FasaahaStudentDashboard>({
    queryKey: ['fasaaha', 'dashboard', 'student'],
    queryFn: async () => {
      const res = await fasaahaAPI.dashboards.student();
      return res.data;
    },
  });
}

export function useTeacherDashboard() {
  return useQuery<FasaahaTeacherDashboard>({
    queryKey: ['fasaaha', 'dashboard', 'teacher'],
    queryFn: async () => {
      const res = await fasaahaAPI.dashboards.teacher();
      return res.data;
    },
  });
}

// ── Progress ──────────────────────────────────────────────────────────────

export function useProgress() {
  return useQuery<StudentLevelProgress[]>({
    queryKey: ['fasaaha', 'progress'],
    queryFn: async () => {
      const res = await fasaahaAPI.progress.list();
      return unwrapPaginated<StudentLevelProgress>(res.data);
    },
  });
}

// ── Streak ────────────────────────────────────────────────────────────────

export function useStreak() {
  return useQuery<StudentStreak[]>({
    queryKey: ['fasaaha', 'streak'],
    queryFn: async () => {
      try {
        const res = await fasaahaAPI.streaks.get();
        return unwrapPaginated<StudentStreak>(res.data);
      } catch {
        return [];
      }
    },
  });
}

// ── Reviews ───────────────────────────────────────────────────────────────

export function usePendingReviews() {
  return useQuery<SpeakingAttempt[]>({
    queryKey: ['fasaaha', 'reviews', 'pending'],
    queryFn: async () => {
      const res = await fasaahaAPI.reviews.pending();
      return unwrapPaginated<SpeakingAttempt>(res.data);
    },
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { attempt: number; overall_score: number; feedback: string }) =>
      fasaahaAPI.reviews.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fasaaha', 'reviews', 'pending'] });
    },
  });
}

// ── Badges ────────────────────────────────────────────────────────────────

export function useAllBadges() {
  return useQuery<Badge[]>({
    queryKey: ['fasaaha', 'badges'],
    queryFn: async () => {
      const res = await fasaahaAPI.badges.list();
      return unwrapPaginated<Badge>(res.data);
    },
  });
}

export function useMyBadges() {
  return useQuery<StudentBadge[]>({
    queryKey: ['fasaaha', 'badges', 'my'],
    queryFn: async () => {
      const res = await fasaahaAPI.badges.myBadges();
      return unwrapPaginated<StudentBadge>(res.data);
    },
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────

export function useClassAnalytics(schoolClassId: number | null) {
  return useQuery({
    queryKey: ['fasaaha', 'analytics', 'class', schoolClassId],
    queryFn: async () => {
      const res = await fasaahaAPI.analytics.class({ school_class: schoolClassId! });
      return res.data;
    },
    enabled: schoolClassId !== null && schoolClassId > 0,
  });
}

export function useStudentAnalytics(studentId: number | null) {
  return useQuery({
    queryKey: ['fasaaha', 'analytics', 'student', studentId],
    queryFn: async () => {
      const res = await fasaahaAPI.analytics.student(studentId!);
      return res.data;
    },
    enabled: studentId !== null && studentId > 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  Phase 3: Dialogue
// ═══════════════════════════════════════════════════════════════════════════

export function useDialogueSessions() {
  return useQuery<DialogueSession[]>({
    queryKey: ['fasaaha', 'dialogues'],
    queryFn: async () => {
      const res = await fasaahaAPI.dialogue.list();
      return unwrapPaginated<DialogueSession>(res.data);
    },
  });
}

export function useDialogueSession(uuid: string | null) {
  return useQuery<DialogueSession & { turns: DialogueTurn[] }>({
    queryKey: ['fasaaha', 'dialogue', uuid],
    queryFn: async () => {
      const res = await fasaahaAPI.dialogue.get(uuid!);
      return res.data;
    },
    enabled: !!uuid,
  });
}

export function useStartDialogue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { topic: string; level_number?: number; mission?: number }) =>
      fasaahaAPI.dialogue.start(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fasaaha', 'dialogues'] });
    },
  });
}

export function useDialogueTurn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, text_ar }: { uuid: string; text_ar: string }) =>
      fasaahaAPI.dialogue.turn(uuid, { text_ar }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['fasaaha', 'dialogue', variables.uuid] });
    },
  });
}

export function useCompleteDialogue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => fasaahaAPI.dialogue.complete(uuid),
    onSuccess: (_data, uuid) => {
      qc.invalidateQueries({ queryKey: ['fasaaha', 'dialogue', uuid] });
      qc.invalidateQueries({ queryKey: ['fasaaha', 'dialogues'] });
      qc.invalidateQueries({ queryKey: ['fasaaha', 'dashboard', 'student'] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  Phase 3: Daily Goals
// ═══════════════════════════════════════════════════════════════════════════

export function useDailyGoal() {
  return useQuery<DailyGoal>({
    queryKey: ['fasaaha', 'goals', 'today'],
    queryFn: async () => {
      const res = await fasaahaAPI.goals.today();
      return res.data;
    },
  });
}

export function useWeeklyGoals() {
  return useQuery<DailyGoal[]>({
    queryKey: ['fasaaha', 'goals', 'weekly'],
    queryFn: async () => {
      const res = await fasaahaAPI.goals.weekly();
      return unwrapPaginated<DailyGoal>(res.data);
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  Phase 3: Leaderboard
// ═══════════════════════════════════════════════════════════════════════════

export function useLeaderboard(period: string = 'weekly') {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['fasaaha', 'leaderboard', period],
    queryFn: async () => {
      const res = await fasaahaAPI.leaderboard.get({ period });
      return unwrapPaginated<LeaderboardEntry>(res.data);
    },
  });
}

export function useRefreshLeaderboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (period?: string) => fasaahaAPI.leaderboard.refresh({ period }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fasaaha', 'leaderboard'] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  Phase 3: Score Trends
// ═══════════════════════════════════════════════════════════════════════════

export function useScoreTrends(studentId?: number, days: number = 30) {
  return useQuery<ScoreTrend[]>({
    queryKey: ['fasaaha', 'trends', studentId, days],
    queryFn: async () => {
      const res = await fasaahaAPI.trends.get(studentId, { days });
      return res.data;
    },
  });
}

// ── Prefixed re-exports (for useFasaaha.ts convention) ────────────────────

export { useLevels as useFasaahaLevels };
export { useCategories as useFasaahaCategories };
export { useMissions as useFasaahaMissions };
export { useMission as useFasaahaMission };
export { useMissionsForLevel as useFasaahaMissionsForLevel };
export { useAttempts as useFasaahaAttempts };
export { useSubmitAttempt as useFasaahaSubmitAttempt };
export { useStudentDashboard as useFasaahaDashboard };
export { useTeacherDashboard as useFasaahaTeacherDashboard };
export { useProgress as useFasaahaProgress };
export { useStreak as useFasaahaStreak };
export { usePendingReviews as useFasaahaPendingReviews };
export { useSubmitReview as useFasaahaSubmitReview };
export { useAllBadges as useFasaahaAllBadges };
export { useMyBadges as useFasaahaMyBadges };
export { useClassAnalytics as useFasaahaClassAnalytics };
export { useStudentAnalytics as useFasaahaStudentAnalytics };
export { useDialogueSessions as useFasaahaDialogueSessions };
export { useDialogueSession as useFasaahaDialogueSession };
export { useStartDialogue as useFasaahaStartDialogue };
export { useDialogueTurn as useFasaahaDialogueTurn };
export { useCompleteDialogue as useFasaahaCompleteDialogue };
export { useDailyGoal as useFasaahaDailyGoal };
export { useWeeklyGoals as useFasaahaWeeklyGoals };
export { useLeaderboard as useFasaahaLeaderboard };
export { useRefreshLeaderboard as useFasaahaRefreshLeaderboard };
export { useScoreTrends as useFasaahaScoreTrends };
