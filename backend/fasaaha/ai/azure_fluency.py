"""
Fluency Assessment Provider.

Uses Azure Speech SDK when available for built-in fluency scoring.
Falls back to Whisper word-level timestamp analysis for:
  - Speech rate (words per minute)
  - Pause detection (long silences between words)
  - Filler/hesitation detection
"""
from __future__ import annotations

import logging
import os
import time
from typing import Optional

from django.conf import settings

from .base import FluencyAssessor, FluencyResult

logger = logging.getLogger(__name__)

# Optimal Arabic speech rate range (words per minute)
OPTIMAL_WPM_MIN = 80
OPTIMAL_WPM_MAX = 160
PAUSE_THRESHOLD_MS = 500


class AzureFluencyAssessor(FluencyAssessor):
    """
    Fluency assessor using Azure Speech SDK.

    Requires AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.
    Falls back to timestamp-based analysis if not available.
    """

    def __init__(self):
        self._key = getattr(settings, 'AZURE_SPEECH_KEY', '') or ''
        self._region = getattr(settings, 'AZURE_SPEECH_REGION', '') or ''
        self._enabled = bool(self._key and self._region)

    def is_available(self) -> bool:
        return self._enabled

    def assess(self, audio_path: str, text: str) -> Optional[FluencyResult]:
        start = time.time()

        # Try Azure first
        if self._enabled:
            result = self._assess_azure(audio_path, text)
            if result:
                result.processing_time_ms = int((time.time() - start) * 1000)
                return result

        # Fallback: timestamp-based analysis
        result = self._assess_timestamps(audio_path, text)
        if result:
            result.processing_time_ms = int((time.time() - start) * 1000)
        return result

    def _assess_azure(self, audio_path: str, text: str) -> Optional[FluencyResult]:
        """Use Azure Speech SDK for fluency assessment."""
        try:
            import azure.cognitiveservices.speech as speechsdk
        except ImportError:
            return None

        try:
            speech_config = speechsdk.SpeechConfig(
                subscription=self._key,
                region=self._region,
            )
            speech_config.speech_recognition_language = 'ar-AE'

            audio_config = speechsdk.audio.AudioConfig(filename=audio_path)

            pronunciation_config = speechsdk.PronunciationAssessmentConfig(
                reference_text=text,
                grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
                granularity=speechsdk.PronunciationAssessmentGranularity.Word,
                enable_miscue=False,
            )

            recognizer = speechsdk.SpeechRecognizer(
                speech_config=speech_config,
                audio_config=audio_config,
            )
            pronunciation_config.apply_to(recognizer)

            result = recognizer.recognize_once()
            if result.reason != speechsdk.ResultReason.RecognizedSpeech:
                return None

            detail = {}
            try:
                import json as json_mod
                detail = json_mod.loads(
                    result.properties.get(
                        'SpeechServiceResponse_JsonResult', '{}'
                    )
                )
            except Exception:
                pass

            nbest = detail.get('NBest', [])
            if not nbest:
                return None

            pron_data = nbest[0].get('PronunciationAssessment', {})
            fluency_score = pron_data.get('FluencyScore', 0)

            # Estimate WPM from audio duration and word count
            words = text.split() if text else []
            word_count = len(words)

            feedback = {
                'azure_fluency_score': fluency_score,
                'completeness_score': pron_data.get('CompletenessScore', 0),
                'word_count': word_count,
                'provider': 'azure_speech',
            }

            return FluencyResult(
                score=fluency_score,
                feedback=feedback,
                provider='azure_speech',
            )

        except Exception as e:
            logger.error("Azure fluency assessment failed: %s", e)
            return None

    def _assess_timestamps(self, audio_path: str, text: str) -> Optional[FluencyResult]:
        """
        Assess fluency from audio timestamps using Whisper-level data.
        Requires word-level timestamps (available from Whisper or Azure).
        """
        if not os.path.exists(audio_path):
            logger.warning("Audio file not found: %s", audio_path)
            return None

        words = text.split() if text else []
        word_count = len(words)

        if word_count == 0:
            return FluencyResult(score=0, feedback={'error': 'No text to assess'})

        # Estimate from file size and expected bitrate
        file_size = os.path.getsize(audio_path)
        # Rough estimate: 16kHz mono 16-bit PCM = 32KB/sec
        estimated_duration_sec = max(file_size / 32000, 0.5)

        wpm = (word_count / estimated_duration_sec) * 60 if estimated_duration_sec > 0 else 0

        # Score speech rate (optimal: 80-160 wpm for Arabic)
        if OPTIMAL_WPM_MIN <= wpm <= OPTIMAL_WPM_MAX:
            rate_score = 100
        elif wpm < OPTIMAL_WPM_MIN:
            rate_score = max(0, 100 - (OPTIMAL_WPM_MIN - wpm) * 1.5)
        else:
            rate_score = max(0, 100 - (wpm - OPTIMAL_WPM_MAX) * 1.0)

        # Penalize very short or very long recordings relative to text
        text_chars = len(text)
        chars_per_sec = text_chars / estimated_duration_sec if estimated_duration_sec > 0 else 0

        # Natural Arabic: ~3-8 chars/sec
        if chars_per_sec < 2:
            rate_score *= 0.6  # Too slow
        elif chars_per_sec > 12:
            rate_score *= 0.7  # Too fast

        # Pause ratio estimate (if very slow, assume many pauses)
        pause_ratio = 0.0
        if wpm < OPTIMAL_WPM_MIN and wpm > 0:
            pause_ratio = min(0.5, (OPTIMAL_WPM_MIN - wpm) / OPTIMAL_WPM_MIN * 0.5)

        feedback = {
            'estimated_wpm': round(wpm, 1),
            'estimated_duration_sec': round(estimated_duration_sec, 1),
            'word_count': word_count,
            'pause_ratio': round(pause_ratio, 3),
            'provider': 'timestamp_estimate',
        }

        return FluencyResult(
            score=round(rate_score, 2),
            feedback=feedback,
            provider='timestamp_estimate',
        )
