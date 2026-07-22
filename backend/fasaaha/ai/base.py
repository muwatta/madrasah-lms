"""
Fasaaha AI Provider Abstraction Layer.

Provides swappable interfaces for:
- Speech-to-Text (STT)
- Pronunciation Scoring
- Grammar Analysis
- Fluency Assessment
- Composite Scoring

Providers can be swapped without changing business logic.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class TranscriptionResult:
    """Result from a Speech-to-Text provider."""
    text: str
    confidence: Optional[float] = None
    language: str = 'ar'
    provider: str = ''
    raw_response: dict = field(default_factory=dict)
    processing_time_ms: Optional[int] = None


@dataclass
class PronunciationResult:
    """Result from a pronunciation scoring provider."""
    score: float  # 0-100
    word_scores: list = field(default_factory=list)  # [{word, score, issues}]
    feedback: dict = field(default_factory=dict)  # {strengths, improvements}
    provider: str = ''
    raw_response: dict = field(default_factory=dict)
    processing_time_ms: Optional[int] = None


@dataclass
class GrammarResult:
    """Result from a grammar analysis provider."""
    score: float  # 0-100
    feedback: dict = field(default_factory=dict)  # {errors, suggestions, strengths}
    provider: str = ''
    raw_response: dict = field(default_factory=dict)
    processing_time_ms: Optional[int] = None


@dataclass
class FluencyResult:
    """Result from a fluency assessment provider."""
    score: float  # 0-100
    feedback: dict = field(default_factory=dict)  # {pause_analysis, speed, naturalness}
    provider: str = ''
    raw_response: dict = field(default_factory=dict)
    processing_time_ms: Optional[int] = None


@dataclass
class CompositeScore:
    """Final weighted composite score."""
    pronunciation: float
    grammar: float
    fluency: float
    vocabulary: float
    overall: float
    weights: dict = field(default_factory=lambda: {
        'pronunciation': 0.35,
        'grammar': 0.25,
        'fluency': 0.20,
        'vocabulary': 0.20,
    })


# ──────────────────────────────────────────────────────
#  Abstract Provider Interfaces
# ──────────────────────────────────────────────────────


class SpeechToTextProvider(ABC):
    """Abstract interface for Speech-to-Text providers."""

    @abstractmethod
    def transcribe(self, audio_path: str, language: str = 'ar') -> TranscriptionResult:
        """Transcribe audio file to text."""
        ...


class PronunciationScorer(ABC):
    """Abstract interface for pronunciation scoring providers."""

    @abstractmethod
    def score(
        self,
        audio_path: str,
        expected_text: str,
        transcribed_text: str,
    ) -> PronunciationResult:
        """Score pronunciation accuracy."""
        ...


class GrammarAnalyzer(ABC):
    """Abstract interface for grammar analysis providers."""

    @abstractmethod
    def analyze(self, text: str, context: dict = None) -> GrammarResult:
        """Analyze grammar correctness of Arabic text."""
        ...


class FluencyAssessor(ABC):
    """Abstract interface for fluency assessment providers."""

    @abstractmethod
    def assess(self, audio_path: str, text: str) -> FluencyResult:
        """Assess speech fluency from audio and transcription."""
        ...
