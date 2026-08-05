import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionBankAPI } from '../api';
import { fetchAllPages } from '../api/client';
import type { QuestionBank, QuizQuestion, GapAnalysis } from '../types';

export function useQuestionBanks(params?: Record<string, unknown>) {
  return useQuery<QuestionBank[]>({
    queryKey: ['question-banks', params],
    queryFn: () => fetchAllPages((p) => questionBankAPI.list(p), params),
  });
}

export function useQuestionBank(id: number | null) {
  return useQuery<QuestionBank>({
    queryKey: ['question-banks', 'detail', id],
    queryFn: async () => { const res = await questionBankAPI.get(id!); return res.data; },
    enabled: !!id,
  });
}

export function useQuestionBankQuestions(id: number | null) {
  return useQuery<QuizQuestion[]>({
    queryKey: ['question-banks', 'questions', id],
    queryFn: async () => { const res = await questionBankAPI.questions(id!); return res.data; },
    enabled: !!id,
  });
}

export function useGapAnalysis(bankId: number | null, attemptUuid: string | null) {
  return useQuery<GapAnalysis>({
    queryKey: ['question-banks', 'gap-analysis', bankId, attemptUuid],
    queryFn: async () => {
      const res = await questionBankAPI.gapAnalysis(bankId!, attemptUuid!);
      return res.data;
    },
    enabled: !!bankId && !!attemptUuid,
    retry: false,
  });
}

export function useUploadQuestionBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => questionBankAPI.create(formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['question-banks'] }),
  });
}

export function useDeleteQuestionBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => questionBankAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['question-banks'] }),
  });
}

export function useConvertQuestionBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => questionBankAPI.convert(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['question-banks'] });
      qc.invalidateQueries({ queryKey: ['quiz'] });
    },
  });
}
