import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { guidanceAPI, subjectAPI } from '../../api';

interface Attachment {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  file: string;
}

interface TutorSession {
  id: number;
  question: string;
  response: string;
  subject_name: string | null;
  subject: number | null;
  session_id: string;
  created_at: string;
  attachments: Attachment[];
}

interface Subject {
  id: number;
  name_en: string;
  name_ar: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
];

export default function AITutorPage() {
  const [input, setInput] = useState('');
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'ar' | 'en'>('ar');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const speak = (id: number, text: string) => {
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/<[^>]*>/g, ''));
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingId(id);
  };

  const toggleListening = async () => {
    if (listening) {
      mediaRecorderRef.current?.stop();
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Microphone access denied. Allow microphone permissions and try again.');
      return;
    }

    audioChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      if (blob.size < 100) return;

      setListening(false);
      setSending(true);
      const fd = new FormData();
      fd.append('audio', blob, 'recording.webm');
      try {
        const res = await guidanceAPI.tutor.transcribe(fd);
        setInput((prev) => prev + (prev ? ' ' : '') + res.data.text);
      } catch {
        setError('Transcription failed. Try again.');
      } finally {
        setSending(false);
      }
    };

    mediaRecorder.start();
    setListening(true);
  };

  const clearChat = async () => {
    try {
      await guidanceAPI.tutor.clearHistory();
    } catch {}
    setSessions([]);
    setSessionId(null);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [histRes, subRes] = await Promise.all([
          guidanceAPI.tutor.history(),
          subjectAPI.list(),
        ]);
        const data: TutorSession[] = histRes.data.results ?? histRes.data;
        setSessions(data);
        if (data.length > 0) setSessionId(data[0].session_id);
        setSubjects(subRes.data.results ?? subRes.data);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, sending]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid: File[] = [];
    for (const f of selected) {
      if (f.size > MAX_FILE_SIZE) {
        setError(`"${f.name}" exceeds 5MB limit`);
        continue;
      }
      if (!ALLOWED_TYPES.includes(f.type) && !f.name.match(/\.(jpeg|jpg|png|pdf|doc|docx|xls|xlsx|txt|csv)$/i)) {
        setError(`"${f.name}" has an unsupported file type`);
        continue;
      }
      valid.push(f);
    }
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
    if (e.target) e.target.value = '';
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const hasArabic = (text: string) => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼';
    if (type.includes('pdf')) return '📄';
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('xls')) return '📊';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('text') || type.includes('csv')) return '📃';
    return '📎';
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setError('');

    const payload: { question: string; subject_id?: number; session_id?: string; files?: File[] } = { question: text };
    if (subjectId) payload.subject_id = subjectId;
    if (sessionId) payload.session_id = sessionId;
    if (files.length > 0) payload.files = files;

    try {
      const res = await guidanceAPI.tutor.ask(payload);
      const session: TutorSession = res.data;
      if (!sessionId) setSessionId(session.session_id);
      setSessions((prev) => [session, ...prev]);
      setInput('');
      setFiles([]);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to get response');
    } finally {
      setSending(false);
      setEditIndex(null);
      setEditText('');
      inputRef.current?.focus();
    }
  };

  const handleEditSend = async (index: number) => {
    const text = editText.trim();
    if (!text || sending || editIndex === null) return;

    setSending(true);
    setError('');

    const session = sessions[index];
    const originalSessions = sessions.slice();

    setSessions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], question: text };
      return next.slice(0, index + 1);
    });

    const payload: { question: string; subject_id?: number; session_id?: string; files?: File[] } = {
      question: text,
    };
    if (subjectId) payload.subject_id = subjectId;
    if (session.session_id) payload.session_id = session.session_id;

    try {
      const res = await guidanceAPI.tutor.ask(payload);
      const newSession: TutorSession = res.data;
      setSessions((prev) => {
        const next = [...prev];
        const idx = next.findIndex((s) => s.id === session.id);
        if (idx !== -1) {
          next[idx] = { ...newSession, question: text };
          return next.slice(0, idx + 1);
        }
        return next;
      });
    } catch (err: any) {
      setSessions(originalSessions);
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to get response');
    } finally {
      setSending(false);
      setEditIndex(null);
      setEditText('');
      inputRef.current?.focus();
    }
  };

  const startEdit = (index: number) => {
    setEditIndex(index);
    setEditText(sessions[index].question);
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.setSelectionRange(editInputRef.current.value.length, editInputRef.current.value.length);
    }, 50);
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setEditText('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleEditSend(index);
    }
    if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-8 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700 mb-2" />
        <div className="h-4 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-700 mb-8" />
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-20 w-full rounded-lg bg-gray-100 dark:bg-gray-700/50" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="py-4 shrink-0 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] dark:text-gray-100">AI Tutor</h1>
          <p className="text-sm text-[var(--color-text-muted)] dark:text-gray-400 mt-0.5">
            Ask questions, upload files (images, docs, PDFs), and get AI-powered explanations
          </p>
        </div>
        {sessions.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--color-border)] dark:border-gray-600 text-xs text-[var(--color-text-muted)] dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-400 transition-colors shrink-0 mt-1"
            title="Clear all messages"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Clear
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 min-h-0 rounded-xl border border-[var(--color-border)] dark:border-gray-700 bg-[var(--color-bg-primary)] dark:bg-gray-800 shadow-sm flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg mb-4">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] dark:text-gray-100 mb-1">
                Start a conversation
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] dark:text-gray-400 max-w-sm">
                Ask any question to get started. You can also upload files (PDF, images, docs) and the AI will help you with them.
              </p>
            </div>
          ) : (
            [...sessions].reverse().map((session, idx) => {
              const realIdx = sessions.length - 1 - idx;
              const isEditing = editIndex === realIdx;
              return (
              <div key={session.id} className="rounded-xl border border-[var(--color-border-light)] dark:border-gray-700/50 overflow-hidden">
                {/* Question */}
                <div className="bg-[var(--color-bg-secondary)] dark:bg-gray-700/30 px-4 py-3 border-b border-[var(--color-border-light)] dark:border-gray-700/50">
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mt-0.5">
                      <svg className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap group">
                        <span className="text-xs font-semibold text-[var(--color-text-primary)] dark:text-gray-100">You</span>
                        <span className="text-[10px] text-[var(--color-text-muted)] dark:text-gray-500">{formatTime(session.created_at)}</span>
                        {session.subject_name && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            {session.subject_name}
                          </span>
                        )}
                        <button
                          onClick={() => startEdit(realIdx)}
                          className="ml-auto text-[var(--color-text-muted)] dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit message"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                      </div>
                      {isEditing ? (
                        <div className="mt-2">
                          <textarea
                            ref={editInputRef}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(e, realIdx)}
                            dir={hasArabic(editText) ? 'rtl' : 'ltr'}
                            className="w-full rounded-lg border border-[var(--color-border)] dark:border-gray-600 bg-[var(--color-bg-primary)] dark:bg-gray-800 px-3 py-2 text-sm text-[var(--color-text-primary)] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent resize-none font-semibold"
                            rows={3}
                            disabled={sending}
                          />
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => handleEditSend(realIdx)}
                              disabled={!editText.trim() || sending}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 disabled:opacity-40 transition-colors"
                            >
                              {sending ? (
                                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                              )}
                              Save & Resend
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] dark:border-gray-600 text-xs text-[var(--color-text-muted)] dark:text-gray-400 hover:text-[var(--color-text-primary)] dark:hover:text-gray-100 transition-colors"
                            >
                              Cancel
                            </button>
                            <span className="text-[10px] text-[var(--color-text-muted)] dark:text-gray-500 ml-auto">Ctrl+Enter to send</span>
                          </div>
                        </div>
                      ) : (
                        <p dir={hasArabic(session.question) ? 'rtl' : 'ltr'} className="text-sm font-semibold text-[var(--color-text-primary)] dark:text-gray-100 mt-1 leading-relaxed">{session.question}</p>
                      )}
                      {session.attachments && session.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {session.attachments.map((att) => (
                            att.file_type.startsWith('image/') ? (
                              <a key={att.id} href={att.file} target="_blank" rel="noopener noreferrer" className="block">
                                <img src={att.file} alt={att.filename} className="max-h-48 rounded-lg border border-[var(--color-border-light)] dark:border-gray-700 hover:opacity-90 transition-opacity" />
                              </a>
                            ) : (
                              <span key={att.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-xs text-[var(--color-text-muted)] dark:text-gray-400">
                                {getFileIcon(att.file_type)} {att.filename}
                                <span className="text-[10px] opacity-60">({formatSize(att.file_size)})</span>
                              </span>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Response */}
                <div className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mt-0.5">
                      <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">AI Tutor</span>
                        <button
                          onClick={() => speak(session.id, session.response)}
                          className="text-[var(--color-text-muted)] dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          title={speakingId === session.id ? 'Stop' : 'Read aloud'}
                        >
                          {speakingId === session.id ? (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563h-.874A.562.562 0 019 14.437V9.563zM12 9.563C12 9.252 12.252 9 12.563 9h.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563h-.874A.562.562 0 0112 14.437V9.563z" />
                            </svg>
                          ) : (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <div dir={hasArabic(session.response) ? 'rtl' : 'ltr'} className="prose prose-sm dark:prose-invert max-w-none mt-1 text-[var(--color-text-primary)] dark:text-gray-100 leading-relaxed font-medium [&_strong]:text-[var(--color-text-primary)] [&_strong]:dark:text-gray-100 [&_strong]:font-bold [&_h3]:text-[var(--color-text-primary)] [&_h3]:dark:text-gray-100 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_ul]:list-disc [&_ul]:pr-5 [&_ol]:list-decimal [&_ol]:pr-5 [&_li]:mb-0.5 [&_code]:bg-gray-200/70 [&_code]:dark:bg-gray-600 [&_code]:px-1.5 [&_py]:0.5 [&_code]:rounded [&_code]:text-sm [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_a]:text-emerald-600 [&_a]:dark:text-emerald-400 [&_a]:font-semibold">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{session.response}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
            })
          )}

          <div ref={messagesEndRef} />
          {/* Sending indicator — always at the bottom */}
          {sending && (
            <div className="rounded-xl border border-[var(--color-border-light)] dark:border-gray-700/50 overflow-hidden opacity-80">
              <div className="bg-[var(--color-bg-secondary)] dark:bg-gray-700/30 px-4 py-3 border-b border-[var(--color-border-light)] dark:border-gray-700/50">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <svg className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <p className="text-sm text-[var(--color-text-primary)] dark:text-gray-100">{input}</p>
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div className="flex gap-1 py-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500/60 animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-emerald-500/60 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-emerald-500/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error bar */}
        {error && (
          <div className="mx-4 mb-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div className="flex-1">{error}</div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 border-t border-[var(--color-border-light)] dark:border-gray-700 px-4 py-3">
          {/* File chips */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {files.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400">
                  {getFileIcon(f.type)} {f.name}
                  <span className="opacity-60">({formatSize(f.size)})</span>
                  <button onClick={() => removeFile(i)} className="ml-0.5 text-emerald-500 hover:text-emerald-700">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-end gap-2">
            <select
              value={subjectId || ''}
              onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : undefined)}
              className="rounded-xl border border-[var(--color-border)] dark:border-gray-600 bg-[var(--color-bg-secondary)] dark:bg-gray-700 px-3 py-2.5 text-sm text-[var(--color-text-secondary)] dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent shrink-0"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name_en}</option>
              ))}
            </select>

            {/* File upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              className="flex items-center justify-center rounded-xl border border-[var(--color-border)] dark:border-gray-600 bg-[var(--color-bg-secondary)] dark:bg-gray-700 p-2.5 text-[var(--color-text-muted)] dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-400 transition-colors disabled:opacity-40 shrink-0"
              title="Attach files (max 5MB)"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Voice input button */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={toggleListening}
                disabled={sending}
                className={`flex items-center justify-center rounded-xl border p-2.5 transition-colors ${
                  listening
                    ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 animate-pulse'
                    : 'border-[var(--color-border)] dark:border-gray-600 bg-[var(--color-bg-secondary)] dark:bg-gray-700 text-[var(--color-text-muted)] dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-400'
                } disabled:opacity-40`}
                title={listening ? `Recording... tap to stop` : `Voice input (${voiceLang === 'ar' ? 'العربية' : 'English'})`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setVoiceLang((v) => (v === 'ar' ? 'en' : 'ar'))}
                className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-[var(--color-border)] dark:border-gray-600 bg-[var(--color-bg-primary)] dark:bg-gray-800 text-[9px] font-bold text-[var(--color-text-muted)] dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                title={voiceLang === 'ar' ? 'Switch to English' : 'Switch to Arabic'}
              >
                {voiceLang === 'ar' ? 'EN' : 'ع'}
              </button>
            </div>

            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                dir={hasArabic(input) ? 'rtl' : 'ltr'}
                placeholder="Ask a question... (Enter to send)"
                className="w-full rounded-xl border border-[var(--color-border)] dark:border-gray-600 bg-[var(--color-bg-secondary)] dark:bg-gray-700 px-4 py-2.5 pr-12 text-sm font-semibold text-[var(--color-text-primary)] dark:text-gray-100 placeholder-[var(--color-text-muted)] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent"
                disabled={sending}
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="flex items-center justify-center rounded-xl bg-emerald-500 p-2.5 text-white transition-colors hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {sending ? (
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
