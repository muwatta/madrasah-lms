"""
Whisper-based Speech-to-Text provider.

Uses OpenAI Whisper API for transcription.
Falls back to templates if API key is not configured.
"""
from __future__ import annotations

import logging
import time
from typing import Optional

from django.conf import settings

from .base import SpeechToTextProvider, TranscriptionResult

logger = logging.getLogger(__name__)


class WhisperSTTProvider(SpeechToTextProvider):
    """OpenAI Whisper-based speech-to-text provider."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, 'OPENAI_API_KEY', '')
        self._client = None

    @property
    def client(self):
        if self._client is None and self.api_key:
            from openai import OpenAI
            kwargs = {'api_key': self.api_key}
            base_url = getattr(settings, 'OPENAI_BASE_URL', '')
            if base_url:
                kwargs['base_url'] = base_url
            self._client = OpenAI(**kwargs)
        return self._client

    def transcribe(self, audio_path: str, language: str = 'ar') -> TranscriptionResult:
        if not self.client:
            logger.warning("Whisper: No API key configured")
            return TranscriptionResult(
                text='',
                provider='whisper',
                raw_response={'error': 'API key not configured'},
            )

        start = time.time()

        try:
            with open(audio_path, 'rb') as audio_file:
                response = self.client.audio.transcriptions.create(
                    model='whisper-1',
                    file=audio_file,
                    language=language,
                    response_format='verbose_json',
                )

            elapsed_ms = int((time.time() - start) * 1000)

            return TranscriptionResult(
                text=response.text or '',
                confidence=getattr(response, 'confidence', None),
                language=language,
                provider='whisper',
                raw_response={
                    'text': response.text,
                    'language': getattr(response, 'language', language),
                    'duration': getattr(response, 'duration', None),
                },
                processing_time_ms=elapsed_ms,
            )

        except Exception as e:
            logger.error("Whisper transcription failed: %s", e)
            return TranscriptionResult(
                text='',
                provider='whisper',
                raw_response={'error': str(e)},
                processing_time_ms=int((time.time() - start) * 1000),
            )
