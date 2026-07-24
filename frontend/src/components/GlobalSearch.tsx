import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI, type SearchResult } from '../api';
import { useLanguage } from '../context/LanguageContext';

const MODEL_ICONS: Record<string, string> = {
  user: '👤',
  subject: '📚',
  school_class: '🏫',
  announcement: '📢',
  quiz: '📝',
  question: '❓',
  homework: '✏️',
  lesson_plan: '📋',
  scheme: '🗺️',
  fee_structure: '💰',
  topic: '📖',
};

const MODEL_LABELS: Record<string, { ar: string; en: string }> = {
  user: { ar: 'مستخدم', en: 'User' },
  subject: { ar: 'مادة', en: 'Subject' },
  school_class: { ar: 'فصل', en: 'Class' },
  announcement: { ar: 'إعلان', en: 'Announcement' },
  quiz: { ar: 'اختبار', en: 'Quiz' },
  question: { ar: 'سؤال', en: 'Question' },
  homework: { ar: 'واجب', en: 'Homework' },
  lesson_plan: { ar: 'خطة درس', en: 'Lesson Plan' },
  scheme: { ar: 'مخطط', en: 'Scheme' },
  fee_structure: { ar: 'رسوم', en: 'Fee Structure' },
  topic: { ar: 'موضوع', en: 'Topic' },
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: Props) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      searchAPI.search(query)
        .then(res => {
          setResults(res.data);
          setSelectedIndex(0);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback((item: SearchResult) => {
    onClose();
    navigate(item.url);
  }, [navigate, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[selectedIndex] as HTMLElement;
    if (item) item.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-xl rounded-2xl border shadow-2xl animate-scale-in overflow-hidden"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b px-4" style={{ borderColor: 'var(--color-border)' }}>
          <svg className="h-5 w-5 shrink-0" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('common.searchPlaceholder')}
            className="h-14 flex-1 bg-transparent text-base outline-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
          {loading && (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
          )}
          <kbd className="hidden rounded-md border px-2 py-0.5 text-xs font-medium sm:inline-block" style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto">
          {query.length >= 2 && !loading && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('common.searchNoResults')}</p>
            </div>
          )}

          {results.map((item, i) => (
            <button
              key={`${item.model}-${item.id}`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                i === selectedIndex ? 'bg-primary-50 dark:bg-primary-900/20' : ''
              }`}
            >
              <span className="mt-0.5 text-lg leading-none">{MODEL_ICONS[item.model] ?? '📄'}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {item.title}
                  </p>
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-gray-100 dark:bg-gray-700" style={{ color: 'var(--color-text-muted)' }}>
                    {MODEL_LABELS[item.model]?.[language] ?? item.model}
                  </span>
                </div>
                {item.subtitle && (
                  <p className="truncate text-xs" style={{ color: 'var(--color-text-muted)' }}>{item.subtitle}</p>
                )}
                {item.preview && (
                  <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--color-text-muted)' }}>{item.preview}</p>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-2" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
          <span className="text-xs">↑↓ Navigate · ↵ Open</span>
          {results.length > 0 && (
            <span className="text-xs">{results.length} result{results.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </div>
  );
}
