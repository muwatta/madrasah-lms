import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quizAPI } from '../api';
import type { Quiz, QuizQuestion, QuizAttempt } from '../types';

// ── Questions ──────────────────────────────────────────────────────────────

export function useQuizQuestions(params?: Record<string, unknown>) {
  return useQuery<QuizQuestion[]>({
    queryKey: ['quiz', 'questions', params],
    queryFn: async () => {
      const res = await quizAPI.questions.list(params);
      return res.data.results ?? res.data;
    },
  });
}

export function useQuizQuestion(id: number | null) {
  return useQuery<QuizQuestion>({
    queryKey: ['quiz', 'question', id],
    queryFn: async () => { const res = await quizAPI.questions.get(id!); return res.data; },
    enabled: !!id,
  });
}

// ── Quizzes ────────────────────────────────────────────────────────────────

export function useQuizzes(params?: Record<string, unknown>) {
  return useQuery<Quiz[]>({
    queryKey: ['quiz', 'list', params],
    queryFn: async () => {
      const res = await quizAPI.quizzes.list(params);
      return res.data.results ?? res.data;
    },
  });
}

export function useQuiz(id: number | null) {
  return useQuery<Quiz>({
    queryKey: ['quiz', 'detail', id],
    queryFn: async () => { const res = await quizAPI.quizzes.get(id!); return res.data; },
    enabled: !!id,
  });
}

export function useQuizStats(id: number | null) {
  return useQuery<{ total_attempts: number; average_score: number; highest_score: number; lowest_score: number; pass_rate: number }>({
    queryKey: ['quiz', 'stats', id],
    queryFn: async () => { const res = await quizAPI.quizzes.stats(id!); return res.data; },
    enabled: !!id,
  });
}

export function useQuizAnalysis(id: number | null) {
  return useQuery<Array<{ question_id: number; question_text: string; total_answers: number; correct_count: number; correct_pct: number }>>({
    queryKey: ['quiz', 'analysis', id],
    queryFn: async () => { const res = await quizAPI.quizzes.analysis(id!); return res.data; },
    enabled: !!id,
  });
}

export function useQuizOverview() {
  return useQuery({
    queryKey: ['quiz', 'overview'],
    queryFn: async () => { const res = await quizAPI.overview(); return res.data; },
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function useCreateQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => quizAPI.quizzes.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz'] }),
  });
}

export function useUpdateQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => quizAPI.quizzes.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz'] }),
  });
}

export function usePublishQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => quizAPI.quizzes.publish(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz'] }),
  });
}

export function useArchiveQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => quizAPI.quizzes.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz'] }),
  });
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => quizAPI.questions.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz', 'questions'] }),
  });
}

export function useDuplicateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => quizAPI.questions.duplicate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz', 'questions'] }),
  });
}

export function useAddQuizQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ quizId, questionId }: { quizId: number; questionId: number }) =>
      quizAPI.quizzes.addQuestion(quizId, questionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz'] }),
  });
}

export function useRemoveQuizQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ quizId, questionId }: { quizId: number; questionId: number }) =>
      quizAPI.quizzes.removeQuestion(quizId, questionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz'] }),
  });
}

// ── Attempts ───────────────────────────────────────────────────────────────

export function useStartQuizAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quizId: number) => quizAPI.attempts.start(quizId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz'] }),
  });
}

export function useQuizAttempt(attemptUuid: string | null) {
  return useQuery<QuizAttempt>({
    queryKey: ['quiz', 'attempt', attemptUuid],
    queryFn: async () => { const res = await quizAPI.attempts.get(attemptUuid!); return res.data; },
    enabled: !!attemptUuid,
    refetchInterval: false,
  });
}

export function useSaveAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ attemptUuid, questionId, selectedAnswer }: { attemptUuid: string; questionId: number; selectedAnswer: string }) =>
      quizAPI.attempts.saveAnswer(attemptUuid, { question_id: questionId, selected_answer: selectedAnswer }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['quiz', 'attempt', variables.attemptUuid] });
    },
  });
}

export function useFlagQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ attemptUuid, questionId }: { attemptUuid: string; questionId: number }) =>
      quizAPI.attempts.flag(attemptUuid, questionId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['quiz', 'attempt', variables.attemptUuid] });
    },
  });
}

export function useSubmitQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attemptUuid: string) => quizAPI.attempts.submit(attemptUuid),
    onSuccess: (_data, attemptUuid) => {
      qc.invalidateQueries({ queryKey: ['quiz', 'attempt', attemptUuid] });
      qc.invalidateQueries({ queryKey: ['quiz'] });
    },
  });
}

export function useReportViolation() {
  return useMutation({
    mutationFn: ({ attemptUuid, violationType, details }: { attemptUuid: string; violationType: string; details?: Record<string, unknown> }) =>
      quizAPI.attempts.reportViolation(attemptUuid, { violation_type: violationType, details }),
  });
}

// ── Prefixed re-exports ────────────────────────────────────────────────────

export { useQuizQuestions as useQuizQQuestions };
export { useQuizzes as useQuizQuizzes };
export { useQuiz as useQuizDetail };
