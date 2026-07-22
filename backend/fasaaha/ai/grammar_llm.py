"""
LLM-based Grammar Analyzer provider.

Uses OpenAI/compatible APIs for Arabic grammar analysis.
"""
from __future__ import annotations

import json
import logging
import time
from typing import Optional

from django.conf import settings

from .base import GrammarAnalyzer, GrammarResult

logger = logging.getLogger(__name__)

GRAMMAR_SYSTEM_PROMPT = """\
You are an expert Arabic language grammar analyzer. Analyze the following Arabic text for \
grammatical correctness. Respond with valid JSON only — no markdown, no commentary.

Return a JSON object:
{
  "score": 85.0,
  "feedback": {
    "errors": [
      {"type": "grammar", "description": "Description of error", "suggestion": "How to fix it"}
    ],
    "strengths": ["Correct sentence structure", "Proper verb conjugation"],
    "suggestions": ["Consider using definite article"]
  }
}

Score the grammar on a scale of 0-100. Be constructive and educational.
"""  # noqa: E501


class LLMGrammarAnalyzer(GrammarAnalyzer):
    """OpenAI/LLM-based grammar analysis provider."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, 'OPENAI_API_KEY', '')
        self.model = getattr(settings, 'OPENAI_MODEL', 'gpt-4o-mini')
        self.max_tokens = getattr(settings, 'OPENAI_MAX_TOKENS', 1024)
        self.temperature = getattr(settings, 'OPENAI_TEMPERATURE', 0.3)
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

    def analyze(self, text: str, context: dict = None) -> GrammarResult:
        if not self.client:
            logger.warning("GrammarAnalyzer: No API key configured")
            return GrammarResult(score=0, provider='llm', raw_response={'error': 'API key not configured'})

        start = time.time()

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": GRAMMAR_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Analyze the grammar of this Arabic text:\n\n{text}"},
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
            )

            content = response.choices[0].message.content.strip()
            if content.startswith('```'):
                content = content.split('\n', 1)[1].rsplit('```', 1)[0].strip()

            data = json.loads(content)
            elapsed_ms = int((time.time() - start) * 1000)

            return GrammarResult(
                score=float(data.get('score', 0)),
                feedback=data.get('feedback', {}),
                provider='llm',
                raw_response=data,
                processing_time_ms=elapsed_ms,
            )

        except json.JSONDecodeError:
            logger.warning("GrammarAnalyzer: AI response was not valid JSON")
            return GrammarResult(score=0, provider='llm', raw_response={'error': 'Invalid JSON'})
        except Exception as e:
            logger.error("GrammarAnalyzer failed: %s", e)
            return GrammarResult(score=0, provider='llm', raw_response={'error': str(e)})
