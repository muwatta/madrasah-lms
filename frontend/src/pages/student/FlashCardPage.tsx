import { useState, useEffect } from 'react';
import { learningAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

interface FlashCardDeck {
  id: number;
  title: string;
  description: string;
  is_shared: boolean;
  created_by_name: string;
  card_count: number;
  created_at: string;
}

interface FlashCard {
  id: number;
  deck: number;
  front: string;
  back: string;
  hint: string;
  difficulty: string;
  order: number;
  review_count: number;
  next_review: string | null;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
};

export default function FlashCardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [decks, setDecks] = useState<FlashCardDeck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<FlashCardDeck | null>(null);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [dueCards, setDueCards] = useState<FlashCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDeck, setEditingDeck] = useState<FlashCardDeck | null>(null);
  const [deckForm, setDeckForm] = useState({ title: '', description: '', subject: '' });
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardForm, setCardForm] = useState({ front: '', back: '', hint: '', difficulty: 'medium' });

  const [studyMode, setStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyCards, setStudyCards] = useState<FlashCard[]>([]);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const res = await learningAPI.decks.list();
      setDecks(res.data.results ?? res.data);
    } catch {
      setError('Failed to load decks');
    } finally {
      setLoading(false);
    }
  };

  const fetchCards = async (deckId: number) => {
    try {
      setCardsLoading(true);
      const [cardsRes, dueRes] = await Promise.all([
        learningAPI.decks.cards(deckId),
        learningAPI.decks.dueCards(deckId),
      ]);
      setCards(cardsRes.data.results ?? cardsRes.data);
      setDueCards(dueRes.data.results ?? dueRes.data);
    } catch {
      setError('Failed to load cards');
    } finally {
      setCardsLoading(false);
    }
  };

  const handleSelectDeck = async (deck: FlashCardDeck) => {
    setSelectedDeck(deck);
    await fetchCards(deck.id);
  };

  const handleSaveDeck = async () => {
    try {
      const payload: any = {
        title: deckForm.title,
        description: deckForm.description,
      };
      if (deckForm.subject) payload.subject = Number(deckForm.subject);

      if (editingDeck) {
        const res = await learningAPI.decks.update(editingDeck.id, payload);
        setDecks(prev => prev.map(d => (d.id === res.data.id ? res.data : d)));
      } else {
        const res = await learningAPI.decks.create(payload);
        setDecks(prev => [res.data, ...prev]);
      }
      setShowForm(false);
      setEditingDeck(null);
      setDeckForm({ title: '', description: '', subject: '' });
    } catch {
      setError('Failed to save deck');
    }
  };

  const handleDeleteDeck = async (id: number) => {
    if (!confirm(t('learning.deleteDeckConfirm'))) return;
    try {
      await learningAPI.decks.delete(id);
      setDecks(prev => prev.filter(d => d.id !== id));
      if (selectedDeck?.id === id) {
        setSelectedDeck(null);
        setCards([]);
        setDueCards([]);
      }
    } catch {
      setError('Failed to delete deck');
    }
  };

  const handleAddCard = async () => {
    if (!selectedDeck) return;
    try {
      const res = await learningAPI.decks.addCard(selectedDeck.id, {
        ...cardForm,
        order: cards.length,
      });
      setCards(prev => [...prev, res.data]);
      setCardForm({ front: '', back: '', hint: '', difficulty: 'medium' });
      setShowCardForm(false);
    } catch {
      setError('Failed to add card');
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!selectedDeck) return;
    try {
      await learningAPI.decks.deleteCard(selectedDeck.id, cardId);
      setCards(prev => prev.filter(c => c.id !== cardId));
    } catch {
      setError('Failed to delete card');
    }
  };

  const startStudy = () => {
    const toStudy = dueCards.length > 0 ? dueCards : cards;
    if (toStudy.length === 0) return;
    setStudyCards(toStudy);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setReviewedCount(0);
    setStudyMode(true);
  };

  const handleReview = async (quality: number) => {
    if (!selectedDeck || !studyCards[currentCardIndex]) return;
    try {
      await learningAPI.decks.reviewCard(
        selectedDeck.id,
        studyCards[currentCardIndex].id,
        { quality }
      );
      setReviewedCount(prev => prev + 1);
      if (currentCardIndex < studyCards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        setStudyMode(false);
        fetchCards(selectedDeck.id);
      }
    } catch {
      setError('Failed to record review');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (studyMode && studyCards.length > 0) {
    const card = studyCards[currentCardIndex];
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStudyMode(false)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ← {t('learning.exitStudy')}
          </button>
          <span className="text-sm text-gray-500">
            {currentCardIndex + 1} / {studyCards.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-primary-500 transition-all"
              style={{ width: `${((currentCardIndex + 1) / studyCards.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">
            {reviewedCount} {t('learning.reviewed')}
          </span>
        </div>

        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="relative cursor-pointer rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md min-h-[240px] flex flex-col items-center justify-center"
        >
          <p className="mb-2 text-xs font-medium text-gray-400 uppercase">
            {isFlipped ? t('learning.answer') : t('learning.question')}
          </p>
          <p className="text-center text-lg text-gray-900 whitespace-pre-wrap">
            {isFlipped ? card.back : card.front}
          </p>
          {isFlipped && card.hint && (
            <p className="mt-4 text-sm text-gray-500 italic">{card.hint}</p>
          )}
          <span className={`absolute top-3 right-3 rounded-full px-2 py-0.5 text-[10px] font-medium ${DIFFICULTY_COLORS[card.difficulty] || ''}`}>
            {card.difficulty}
          </span>
          {!isFlipped && (
            <p className="mt-4 text-xs text-gray-400">{t('learning.clickToReveal')}</p>
          )}
        </div>

        {isFlipped && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { q: 0, label: t('learning.again'), color: 'bg-red-500 hover:bg-red-600' },
              { q: 2, label: t('learning.hard'), color: 'bg-amber-500 hover:bg-amber-600' },
              { q: 4, label: t('learning.good'), color: 'bg-blue-500 hover:bg-blue-600' },
              { q: 5, label: t('learning.easy'), color: 'bg-emerald-500 hover:bg-emerald-600' },
            ].map(({ q, label, color }) => (
              <button
                key={q}
                onClick={() => handleReview(q)}
                className={`rounded-lg px-3 py-3 text-sm font-medium text-white transition-colors ${color}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (selectedDeck) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedDeck(null); setCards([]); setDueCards([]); }}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ← {t('common.previous')}
          </button>
          <h1 className="text-xl font-bold text-gray-900">{selectedDeck.title}</h1>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{cards.length}</p>
            <p className="text-xs text-gray-500">{t('learning.totalCards')}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-amber-600">{dueCards.length}</p>
            <p className="text-xs text-gray-500">{t('learning.dueForReview')}</p>
          </div>
          <div className="flex items-center">
            <button
              onClick={startStudy}
              disabled={cards.length === 0}
              className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {dueCards.length > 0
                ? `${t('learning.studyNow')} (${dueCards.length})`
                : t('learning.reviewAll')}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">{t('learning.cards')}</p>
          <button
            onClick={() => setShowCardForm(!showCardForm)}
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 transition-colors"
          >
            + {t('learning.addCard')}
          </button>
        </div>

        {showCardForm && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('learning.front')}</label>
              <textarea
                value={cardForm.front}
                onChange={e => setCardForm({ ...cardForm, front: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                rows={2}
                placeholder={t('learning.frontPlaceholder')}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('learning.back')}</label>
              <textarea
                value={cardForm.back}
                onChange={e => setCardForm({ ...cardForm, back: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                rows={2}
                placeholder={t('learning.backPlaceholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('learning.hint')}</label>
                <input
                  value={cardForm.hint}
                  onChange={e => setCardForm({ ...cardForm, hint: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder={t('learning.hintPlaceholder')}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('fields.difficulty')}</label>
                <select
                  value={cardForm.difficulty}
                  onChange={e => setCardForm({ ...cardForm, difficulty: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="easy">{t('difficulty.easy')}</option>
                  <option value="medium">{t('difficulty.medium')}</option>
                  <option value="hard">{t('difficulty.hard')}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddCard}
                disabled={!cardForm.front || !cardForm.back}
                className="rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {t('common.save')}
              </button>
              <button
                onClick={() => setShowCardForm(false)}
                className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}

        {cardsLoading ? (
          <LoadingSpinner size="md" />
        ) : cards.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-500">{t('learning.noCards')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cards.map(card => (
              <div
                key={card.id}
                className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${DIFFICULTY_COLORS[card.difficulty] || ''}`}>
                  {card.difficulty}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{card.front}</p>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-1">{card.back}</p>
                </div>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="shrink-0 rounded p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('learning.flashcards')}</h1>
          <p className="text-sm text-gray-500">{t('learning.flashcardsSubtitle')}</p>
        </div>
        {(user?.role === 'ustaadh' || user?.role === 'mudeer') && (
          <button
            onClick={() => {
              setShowForm(true);
              setEditingDeck(null);
              setDeckForm({ title: '', description: '', subject: '' });
            }}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            + {t('learning.createDeck')}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">
            {editingDeck ? t('learning.editDeck') : t('learning.createDeck')}
          </h3>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">{t('fields.title')}</label>
            <input
              value={deckForm.title}
              onChange={e => setDeckForm({ ...deckForm, title: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">{t('fields.description')}</label>
            <textarea
              value={deckForm.description}
              onChange={e => setDeckForm({ ...deckForm, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveDeck}
              disabled={!deckForm.title}
              className="rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {editingDeck ? t('common.update') : t('common.create')}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingDeck(null); }}
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {decks.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">{t('learning.noDecks')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map(deck => (
            <div
              key={deck.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <button
                  onClick={() => handleSelectDeck(deck)}
                  className="text-left flex-1"
                >
                  <p className="text-sm font-semibold text-gray-900">{deck.title}</p>
                  {deck.description && (
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">{deck.description}</p>
                  )}
                </button>
                {(user?.role === 'ustaadh' || user?.role === 'mudeer') && (
                  <button
                    onClick={() => handleDeleteDeck(deck.id)}
                    className="shrink-0 rounded p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {deck.card_count} {t('learning.cards')}
                </span>
                {deck.is_shared && (
                  <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-600">
                    {t('learning.shared')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
