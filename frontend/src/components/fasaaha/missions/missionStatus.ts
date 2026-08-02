import type { Mission, SpeakingAttempt } from '../../../types';

export const PASS_THRESHOLD = 70;

export type MissionStatus = 'notStarted' | 'inProgress' | 'needsPractice' | 'completed';

export type MissionSort = 'recommended' | 'easiest' | 'hardest' | 'shortest' | 'recent';

export const MISSION_SORTS: MissionSort[] = ['recommended', 'easiest', 'hardest', 'shortest', 'recent'];

export interface MissionProgressInfo {
  status: MissionStatus;
  bestScore: number | null;
  attemptsCount: number;
  lastAttemptedAt: string | null;
  isHighScore: boolean;
}

export function scoreOfAttempt(attempt: SpeakingAttempt): number | null {
  const score = attempt.final_score ?? attempt.ai_analysis?.overall_score ?? null;
  if (score === null || score <= 0) return null;
  return Number(score);
}

export function isReadingMission(mission: Mission): boolean {
  return mission.mission_type === 'reading';
}

export function missionRoute(mission: Mission): string {
  const id = String(mission.id);
  return isReadingMission(mission)
    ? `/student/fasaaha/read/${id}`
    : `/student/fasaaha/speak/${id}`;
}

/**
 * Derive a mission's relationship to the current student from real attempt data.
 */
export function computeMissionProgress(
  attempts: SpeakingAttempt[],
): MissionProgressInfo {
  const attemptsCount = attempts.length;
  const scores = attempts.map(scoreOfAttempt).filter((s): s is number => s !== null);
  const bestScore = scores.length ? Math.max(...scores) : null;
  const hasEvaluated = attempts.some((a) => a.status === 'completed' || a.status === 'reviewed');

  let status: MissionStatus = 'notStarted';
  if (attemptsCount === 0) {
    status = 'notStarted';
  } else if (bestScore !== null && bestScore >= PASS_THRESHOLD) {
    status = 'completed';
  } else if (hasEvaluated) {
    status = 'needsPractice';
  } else {
    status = 'inProgress';
  }

  return {
    status,
    bestScore,
    attemptsCount,
    lastAttemptedAt: attemptsCount ? attempts[0].created_at : null,
    isHighScore: bestScore !== null && bestScore >= 90,
  };
}

/**
 * Group a flat list of attempts by mission id. Attempts list is ordered
 * newest-first by the API, so the first entry per mission is the latest.
 */
export function groupAttemptsByMission(
  attempts: SpeakingAttempt[],
): Map<number, SpeakingAttempt[]> {
  const map = new Map<number, SpeakingAttempt[]>();
  for (const a of attempts) {
    const list = map.get(a.mission);
    if (list) list.push(a);
    else map.set(a.mission, [a]);
  }
  return map;
}
