import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import {
  useFasaahaStartDialogue,
  useFasaahaDialogueTurn,
  useFasaahaCompleteDialogue,
} from '../../../hooks/useFasaaha';
import LoadingSpinner from '../../../components/LoadingSpinner';

interface Message {
  id: string;
  role: 'student' | 'ai';
  text: string;
  translation?: string;
  score?: number;
  feedback?: string;
}

export default function FasaahaConversation() {
  const { t } = useLanguage();
  const [topic, setTopic] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const startDialogue = useFasaahaStartDialogue();
  const submitTurn = useFasaahaDialogueTurn();
  const completeDialogue = useFasaahaCompleteDialogue();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleStart = async () => {
    if (!topic.trim()) return;
    try {
      const res = await startDialogue.mutateAsync({ topic: topic.trim() });
      const data = res.data;
      setSessionId(data.uuid);
      const aiTurns = (data.turns ?? []).filter(
        (turn: { role: string }) => turn.role === 'ai',
      );
      if (aiTurns.length > 0) {
        setMessages([
          {
            id: `init-${Date.now()}`,
            role: 'ai',
            text: aiTurns[0].text_ar,
            translation: aiTurns[0].text_en,
          },
        ]);
      }
    } catch {
      // silently fail
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId || submitTurn.isPending) return;
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'student',
      text: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await submitTurn.mutateAsync({
        uuid: sessionId,
        text_ar: userMsg.text,
      });
      const { student_turn, ai_turn } = res.data;
      setMessages((prev) => {
          const updated = prev.map((m) =>
            m.id === userMsg.id
              ? { ...m, score: student_turn.turn_score, feedback: student_turn.correction }
              : m,
        );
        return [
          ...updated,
          {
            id: `ai-${Date.now()}`,
            role: 'ai' as const,
            text: ai_turn.text_ar,
            translation: ai_turn.text_en,
          },
        ];
      });
    } catch {
      // silently fail
    } finally {
      setIsTyping(false);
    }
  };

  const handleComplete = async () => {
    if (!sessionId) return;
    await completeDialogue.mutateAsync(sessionId);
  };

  if (!sessionId) {
    return (
      <div className="max-w-lg mx-auto space-y-6 py-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {t('fasaaha.conversation')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t('fasaaha.conversationDesc')}
          </p>
        </div>

        <div className="rounded-xl border p-6 space-y-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
          <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {t('fasaaha.chooseTopic')}
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder={t('fasaaha.topicPlaceholder')}
            className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
          />
          <button
            onClick={handleStart}
            disabled={!topic.trim() || startDialogue.isPending}
            className="w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {startDialogue.isPending ? t('fasaaha.processing') : t('fasaaha.startConversation')}
          </button>
        </div>

        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
            {t('fasaaha.suggestedTopics')}
          </p>
          <div className="flex flex-wrap gap-2">
            {['introducing myself', 'at the market', 'asking for directions', 'family members', 'daily routine'].map((s) => (
              <button
                key={s}
                onClick={() => setTopic(s)}
                className="rounded-full border px-3 py-1 text-xs hover:bg-primary-50 transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {t('fasaaha.conversation')}
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{topic}</p>
        </div>
        <button
          onClick={handleComplete}
          disabled={completeDialogue.isPending}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-red-50 hover:border-red-300 transition-colors"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          {t('fasaaha.endConversation')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'student'
                  ? 'bg-primary-600 text-white rounded-br-md'
                  : 'border rounded-bl-md'
              }`}
              style={
                msg.role === 'ai'
                  ? { borderColor: 'var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }
                  : undefined
              }
            >
              <p className="leading-relaxed">{msg.text}</p>
              {msg.translation && (
                <p className="mt-1 text-xs opacity-70 italic">{msg.translation}</p>
              )}
              {msg.score !== undefined && msg.score !== null && (
                <div className="mt-2 flex items-center gap-2 text-xs opacity-80">
                  <span>{Math.round(msg.score)}%</span>
                  {msg.feedback && <span>— {msg.feedback}</span>}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md border px-4 py-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
              <LoadingSpinner size="sm" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('fasaaha.typeInArabic')}
            className="flex-1 rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
            dir="rtl"
            disabled={submitTurn.isPending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || submitTurn.isPending}
            className="rounded-lg bg-primary-600 px-5 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {t('fasaaha.send')}
          </button>
        </div>
      </div>
    </div>
  );
}
