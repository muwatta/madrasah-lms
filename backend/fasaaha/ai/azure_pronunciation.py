"""
Azure Speech Services — Pronunciation Assessment Provider.

Uses Azure Cognitive Services Speech SDK for word-level and phoneme-level
pronunciation scoring. Falls back gracefully if no Azure key is configured.
"""
from __future__ import annotations

import logging
import os
import time
from typing import Optional

from django.conf import settings

from .base import PronunciationScorer, PronunciationResult

logger = logging.getLogger(__name__)


class AzurePronunciationScorer(PronunciationScorer):
    """
    Azure Speech SDK pronunciation assessment.

    Requires AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in Django settings.
    If not configured, returns None (graceful degradation).
    """

    def __init__(self):
        self._key = getattr(settings, 'AZURE_SPEECH_KEY', '') or ''
        self._region = getattr(settings, 'AZURE_SPEECH_REGION', '') or ''
        self._enabled = bool(self._key and self._region)

        if not self._enabled:
            logger.info(
                "Azure Pronunciation Scorer: not configured "
                "(set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION)"
            )

    def is_available(self) -> bool:
        return self._enabled

    def score(
        self,
        audio_path: str,
        expected_text: str,
        transcribed_text: str,
    ) -> Optional[PronunciationResult]:
        if not self._enabled:
            return None

        start = time.time()

        try:
            import azure.cognitiveservices.speech as speechsdk
        except ImportError:
            logger.error("azure-cognitiveservices-speech not installed")
            return None

        try:
            result = self._assess_pronunciation(
                speechsdk, audio_path, expected_text
            )
            elapsed_ms = int((time.time() - start) * 1000)
            result.processing_time_ms = elapsed_ms
            result.provider = 'azure_speech'
            return result

        except Exception as e:
            logger.error("Azure pronunciation assessment failed: %s", e)
            return None

    def _assess_pronunciation(
        self,
        speechsdk,
        audio_path: str,
        reference_text: str,
    ) -> PronunciationResult:
        """Run Azure pronunciation assessment on an audio file."""
        speech_config = speechsdk.SpeechConfig(
            subscription=self._key,
            region=self._region,
        )
        speech_config.speech_recognition_language = 'ar-AE'

        audio_config = speechsdk.audio.AudioConfig(filename=audio_path)

        pronunciation_config = speechsdk.PronunciationAssessmentConfig(
            reference_text=reference_text,
            grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
            granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
            enable_miscue=True,
        )

        recognizer = speechsdk.SpeechRecognizer(
            speech_config=speech_config,
            audio_config=audio_config,
        )
        pronunciation_config.apply_to(recognizer)

        result = recognizer.recognize_once()

        if result.reason != speechsdk.ResultReason.RecognizedSpeech:
            logger.warning(
                "Azure STT did not recognize speech: reason=%s", result.reason
            )
            return PronunciationResult(
                score=0,
                word_scores=[],
                feedback={'error': 'Speech not recognized'},
                raw_response={'reason': str(result.reason)},
            )

        assessment = result.properties.get(
            speechsdk.PropertyId.SpeechServiceResponse_PrimaryResult, ''
        )

        # Azure returns pronunciation assessment in NBest[0].PronunciationAssessment
        raw = {
            'text': result.text,
            'json': assessment,
        }

        # Parse the detailed JSON from Azure
        return self._parse_azure_result(result, reference_text, raw)

    def _parse_azure_result(
        self,
        result,
        reference_text: str,
        raw: dict,
    ) -> PronunciationResult:
        """Parse Azure pronunciation assessment JSON into PronunciationResult."""
        try:
            import json as json_mod
            detail = json_mod.loads(
                result.properties.get(
                    'SpeechServiceResponse_JsonResult', '{}'
                )
            )
        except (json_mod.JSONDecodeError, TypeError):
            detail = {}

        nbest = detail.get('NBest', [])
        if not nbest:
            return PronunciationResult(
                score=0,
                word_scores=[],
                feedback={'error': 'No pronunciation data'},
                raw_response=raw,
            )

        pron_data = nbest[0].get('PronunciationAssessment', {})
        overall_score = pron_data.get('PronunciationScore', 0)

        # Word-level scores
        words = nbest[0].get('Words', [])
        word_scores = []
        strengths = []
        improvements = []

        for w in words:
            w_pron = w.get('PronunciationAssessment', {})
            w_score = w_pron.get('AccuracyScore', 0)
            w_error = w_pron.get('ErrorType', 'None')

            entry = {
                'word': w.get('Word', ''),
                'score': w_score,
                'phonemes': [],
                'issues': [],
            }

            if w_score >= 80:
                strengths.append(w.get('Word', ''))
            elif w_score < 60:
                improvements.append({
                    'word': w.get('Word', ''),
                    'score': w_score,
                    'error_type': w_error,
                })

            if w_error and w_error != 'None':
                entry['issues'].append({
                    'type': w_error,
                    'severity': 'high' if w_score < 50 else 'medium',
                    'suggestion': f'Practice pronunciation of "{w.get("Word", "")}"',
                })

            # Phoneme-level
            for p in w.get('Phonemes', []):
                p_pron = p.get('PronunciationAssessment', {})
                entry['phonemes'].append({
                    'phoneme': p.get('Phoneme', ''),
                    'score': p_pron.get('AccuracyScore', 0),
                })

            word_scores.append(entry)

        # Compute fluency and completeness from Azure data
        fluency_score = pron_data.get('FluencyScore', 0)
        completeness = pron_data.get('CompletenessScore', 0)

        feedback = {
            'strengths': strengths,
            'improvements': improvements,
            'fluency_score': fluency_score,
            'completeness_score': completeness,
            'detail': pron_data,
        }

        return PronunciationResult(
            score=overall_score,
            word_scores=word_scores,
            feedback=feedback,
            raw_response=raw,
        )
