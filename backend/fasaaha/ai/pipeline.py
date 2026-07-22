"""
Fasaaha AI Pipeline — orchestrates the full analysis of a speaking attempt.

Flow:
  1. Speech-to-Text (transcription)
  2. Pronunciation Scoring
  3. Grammar Analysis
  4. Fluency Assessment
  5. Composite Scoring

Each step is swappable via provider abstraction.
"""
from __future__ import annotations

import logging
import time
from typing import Optional

from .base import (
    SpeechToTextProvider,
    PronunciationScorer,
    GrammarAnalyzer,
    FluencyAssessor,
    CompositeScore,
)

logger = logging.getLogger(__name__)


class AIProcessingPipeline:
    """
    Orchestrates the full AI analysis pipeline for a speaking attempt.

    Pipeline flow:
      1. Speech-to-Text (Whisper)
      2. Pronunciation Scoring (Azure or fallback)
      3. Grammar Analysis (LLM)
      4. Fluency Assessment (Azure or timestamp estimate)
      5. Composite Scoring
    """

    DEFAULT_WEIGHTS = {
        'pronunciation': 0.35,
        'grammar': 0.25,
        'fluency': 0.20,
        'vocabulary': 0.20,
    }

    def __init__(
        self,
        stt_provider: Optional[SpeechToTextProvider] = None,
        pronunciation_provider: Optional[PronunciationScorer] = None,
        grammar_provider: Optional[GrammarAnalyzer] = None,
        fluency_provider: Optional[FluencyAssessor] = None,
        weights: Optional[dict] = None,
    ):
        self.stt = stt_provider
        self.pronunciation = pronunciation_provider
        self.grammar = grammar_provider
        self.fluency = fluency_provider
        self.weights = weights or self.DEFAULT_WEIGHTS

    @classmethod
    def build_default(cls) -> 'AIProcessingPipeline':
        """
        Build a pipeline with all available providers auto-detected.
        Providers with missing credentials are silently skipped.
        """
        from .whisper_stt import WhisperSTTProvider
        from .grammar_llm import LLMGrammarAnalyzer

        stt = WhisperSTTProvider()
        grammar = LLMGrammarAnalyzer()

        pronunciation = None
        fluency = None

        try:
            from .azure_pronunciation import AzurePronunciationScorer
            ap = AzurePronunciationScorer()
            if ap.is_available():
                pronunciation = ap
        except Exception:
            pass

        try:
            from .azure_fluency import AzureFluencyAssessor
            af = AzureFluencyAssessor()
            if af.is_available():
                fluency = af
        except Exception:
            pass

        return cls(
            stt_provider=stt,
            pronunciation_provider=pronunciation,
            grammar_provider=grammar,
            fluency_provider=fluency,
        )

    def run(
        self,
        audio_path: str,
        expected_text: str = '',
        language: str = 'ar',
    ) -> dict:
        """
        Run the full pipeline and return a dict suitable for storing in AIAnalysis.

        Returns dict with keys:
            transcribed_text, transcription_provider, transcription_confidence,
            transcription_raw, pronunciation_score, grammar_score, fluency_score,
            vocabulary_score, overall_score, pronunciation_feedback, grammar_feedback,
            fluency_feedback, word_scores, scoring_provider, processing_time_ms,
            raw_response
        """
        result = {
            'transcribed_text': '',
            'transcription_provider': '',
            'transcription_confidence': None,
            'transcription_raw': {},
            'pronunciation_score': None,
            'grammar_score': None,
            'fluency_score': None,
            'vocabulary_score': None,
            'overall_score': None,
            'pronunciation_feedback': {},
            'grammar_feedback': {},
            'fluency_feedback': {},
            'word_scores': [],
            'confidence_score': None,
            'topic_relevance_score': None,
            'fluency_words_per_minute': None,
            'fluency_pause_ratio': None,
            'scoring_provider': 'pipeline',
            'processing_time_ms': 0,
            'raw_response': {},
        }

        total_start = time.time()

        # ── Step 1: Transcription ──
        transcription = self._run_transcription(audio_path, language)
        if transcription:
            result['transcribed_text'] = transcription.text
            result['transcription_provider'] = transcription.provider
            result['transcription_confidence'] = transcription.confidence
            result['transcription_raw'] = transcription.raw_response

        transcribed_text = result['transcribed_text']
        if not transcribed_text:
            logger.warning("Pipeline: No transcription produced, aborting scoring")
            result['processing_time_ms'] = int((time.time() - total_start) * 1000)
            return result

        # ── Step 2: Pronunciation ──
        pron_result = self._run_pronunciation(audio_path, expected_text, transcribed_text)
        if pron_result:
            result['pronunciation_score'] = pron_result.score
            result['pronunciation_feedback'] = pron_result.feedback
            result['word_scores'] = pron_result.word_scores

        # ── Step 3: Grammar ──
        grammar_result = self._run_grammar(transcribed_text)
        if grammar_result:
            result['grammar_score'] = grammar_result.score
            result['grammar_feedback'] = grammar_result.feedback

        # ── Step 4: Fluency ──
        fluency_result = self._run_fluency(audio_path, transcribed_text)
        if fluency_result:
            result['fluency_score'] = fluency_result.score
            result['fluency_feedback'] = fluency_result.feedback
            # Extract extended fluency metrics
            fb = fluency_result.feedback
            if 'estimated_wpm' in fb:
                result['fluency_words_per_minute'] = int(fb['estimated_wpm'])
            if 'pause_ratio' in fb:
                result['fluency_pause_ratio'] = float(fb['pause_ratio'])

        # ── Step 5: Composite Score ──
        # Vocabulary score defaults to pronunciation score if not separately computed
        vocab_score = result['pronunciation_score']
        result['vocabulary_score'] = vocab_score

        composite = self._compute_composite(
            pronunciation=result['pronunciation_score'],
            grammar=result['grammar_score'],
            fluency=result['fluency_score'],
            vocabulary=vocab_score,
        )
        result['overall_score'] = composite.overall
        result['processing_time_ms'] = int((time.time() - total_start) * 1000)

        logger.info(
            "Pipeline complete: overall=%.1f, time=%dms",
            result['overall_score'] or 0,
            result['processing_time_ms'],
        )
        return result

    def _run_transcription(self, audio_path: str, language: str):
        if not self.stt:
            logger.info("No STT provider configured, skipping transcription")
            return None
        try:
            return self.stt.transcribe(audio_path, language=language)
        except Exception as e:
            logger.error("STT failed: %s", e)
            return None

    def _run_pronunciation(self, audio_path: str, expected_text: str, transcribed_text: str):
        if not self.pronunciation:
            logger.info("No pronunciation provider configured, skipping")
            return None
        try:
            return self.pronunciation.score(audio_path, expected_text, transcribed_text)
        except Exception as e:
            logger.error("Pronunciation scoring failed: %s", e)
            return None

    def _run_grammar(self, text: str):
        if not self.grammar:
            logger.info("No grammar provider configured, skipping")
            return None
        try:
            return self.grammar.analyze(text)
        except Exception as e:
            logger.error("Grammar analysis failed: %s", e)
            return None

    def _run_fluency(self, audio_path: str, text: str):
        if not self.fluency:
            logger.info("No fluency provider configured, skipping")
            return None
        try:
            return self.fluency.assess(audio_path, text)
        except Exception as e:
            logger.error("Fluency assessment failed: %s", e)
            return None

    def _compute_composite(
        self,
        pronunciation: Optional[float],
        grammar: Optional[float],
        fluency: Optional[float],
        vocabulary: Optional[float],
    ) -> CompositeScore:
        """Compute weighted composite score from individual scores."""
        scores = {
            'pronunciation': pronunciation or 0,
            'grammar': grammar or 0,
            'fluency': fluency or 0,
            'vocabulary': vocabulary or 0,
        }

        # Only include non-zero scores in weighted average
        total_weight = 0
        weighted_sum = 0
        for key, weight in self.weights.items():
            if scores[key] > 0:
                weighted_sum += scores[key] * weight
                total_weight += weight

        overall = weighted_sum / total_weight if total_weight > 0 else 0

        return CompositeScore(
            pronunciation=scores['pronunciation'],
            grammar=scores['grammar'],
            fluency=scores['fluency'],
            vocabulary=scores['vocabulary'],
            overall=round(overall, 2),
            weights=self.weights,
        )
