import { useState, useEffect, useRef } from 'react';
import { guidanceAPI, subjectAPI } from '../../api';
import { SkeletonCard } from '../../components/Skeleton';

interface TutorSession {
  id: number;
  question: string;
  response: string;
  subject_name: string | null;
  created_at: string;
}

interface Subject {
  id: number;
  name_en: string;
  name_ar: string;
}

export default function AITutorPage() {
  const [question, setQuestion] = useState('');
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [histRes, subRes] = await Promise.all([
          guidanceAPI.tutor.history(),
          subjectAPI.list(),
        ]);
        setSessions(histRes.data.results ?? histRes.data);
        setSubjects(subRes.data.results ?? subRes.data);
      } catch {
      } finally {
        setLoadingHistory(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || sending) return;

    setSending(true);
    setError('');
    try {
      const data: { question: string; subject_id?: number } = { question: question.trim() };
      if (subjectId) data.subject_id = subjectId;
      const res = await guidanceAPI.tutor.ask(data);
      setSessions((prev) => [res.data, ...prev]);
      setQuestion('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to get response');
    } finally {
      setSending(false);
    }
  };

  if (loadingHistory) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700 mb-2" />
          <div className="h-4 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <SkeletonCard />
        <div className="space-y-4 mt-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] dark:text-gray-100">AI Tutor</h1>
        <p className="text-[var(--color-text-muted)] dark:text-gray-400 mt-1">Ask questions and get explanations to deepen your understanding</p>
      </div>

      <div className="bg-[var(--color-bg-primary)] dark:bg-gray-800 rounded-xl shadow-sm border border-[var(--color-border)] dark:border-gray-700 overflow-hidden mb-8">
        <div className="p-4 border-b border-[var(--color-border-light)] dark:border-gray-700">
          <form onSubmit={handleSend} className="flex gap-3">
            <select
              value={subjectId || ''}
              onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : undefined)}
              className="rounded-lg border border-[var(--color-border)] dark:border-gray-600 bg-[var(--color-bg-secondary)] dark:bg-gray-700 px-3 py-2 text-sm text-[var(--color-text-secondary)] dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name_en}</option>
              ))}
            </select>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question... e.g., 'Explain photosynthesis' or 'How to solve quadratic equations'"
              className="flex-1 rounded-lg border border-[var(--color-border)] dark:border-gray-600 bg-[var(--color-bg-secondary)] dark:bg-gray-700 px-4 py-2 text-sm text-[var(--color-text-primary)] dark:text-gray-100 placeholder-[var(--color-text-muted)] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!question.trim() || sending}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {sending ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
              Ask
            </button>
          </form>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">{error}</div>
        )}

        <div className="max-h-[600px] overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] dark:text-gray-100 mb-2">Ask Your First Question</h3>
              <p className="text-[var(--color-text-muted)] dark:text-gray-400 text-sm max-w-md mx-auto">
                Type a question above to get started. The AI tutor can help with explanations, definitions,
                step-by-step guides, and more.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border-light)] dark:divide-gray-700/50">
              {sessions.map((session) => (
                <div key={session.id} className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mt-0.5">
                      <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] dark:text-gray-100">{session.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {session.subject_name && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            {session.subject_name}
                          </span>
                        )}
                        <span className="text-xs text-[var(--color-text-muted)] dark:text-gray-400">
                          {new Date(session.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-11">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mt-0.5">
                        <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                      <div className="flex-1 bg-[var(--color-bg-secondary)] dark:bg-gray-700/50 rounded-lg p-4">
                        <div className="text-sm text-[var(--color-text-secondary)] dark:text-gray-300 whitespace-pre-line leading-relaxed">
                          {session.response}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
