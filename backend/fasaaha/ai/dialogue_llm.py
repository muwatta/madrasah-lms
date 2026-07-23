"""
LLM-based Dialogue Generator for Fasaaha conversation practice.

Generates contextual Arabic dialogue responses and evaluates student turns.
"""
from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass, field
from typing import Optional

from django.conf import settings

logger = logging.getLogger(__name__)

DIALOGUE_SYSTEM_PROMPT = """\
You are "Fasaaha" — a friendly, encouraging Arabic speaking tutor for Islamic school students. \
You speak primarily in Arabic with English translations. Your personality is warm, patient, and \
educational. You help students practice conversational Arabic.

RULES:
1. Always respond in Arabic (Modern Standard Arabic).
2. Keep responses short (1-3 sentences) — this is a speaking exercise.
3. Include the English translation after each Arabic response on a new line prefixed with "[EN]".
4. Include a transliteration in Latin script prefixed with "[TR]".
5. Gently correct the student's mistakes when you notice them.
6. Use age-appropriate, simple vocabulary matching the student's level.
7. Be encouraging — praise correct usage.
8. After the student's turn, also return a brief evaluation.

TOPIC CONTEXT: {topic}
STUDENT LEVEL: {level}
CONVERSATION HISTORY:
{history}

Respond with valid JSON only — no markdown, no commentary.
"""

RESPONSE_FORMAT = """{
  "text_ar": "Arabic response",
  "text_en": "English translation",
  "transliteration": "Latin script transliteration",
  "correction": "Correction of student's last message if any, else empty string",
  "suggestion": "A suggested phrase for the student to practice next, else empty string",
  "context_tags": ["greeting", "question", "encouragement"]
}"""


@dataclass
class DialogueResponse:
    text_ar: str
    text_en: str
    transliteration: str
    correction: str
    suggestion: str
    context_tags: list = field(default_factory=list)
    processing_time_ms: int = 0
    raw_response: dict = field(default_factory=dict)


@dataclass
class TurnEvaluation:
    pronunciation_score: float
    fluency_score: float
    vocabulary_score: float
    turn_score: float
    feedback: str


class DialogueLLMProvider:
    """Generates AI dialogue responses for conversation practice."""

    def __init__(self):
        self.api_key = getattr(settings, 'OPENAI_API_KEY', '')
        self.model = getattr(settings, 'OPENAI_MODEL', 'llama-3.3-70b-versatile')
        self.max_tokens = getattr(settings, 'OPENAI_MAX_TOKENS', 512)
        self.temperature = getattr(settings, 'OPENAI_TEMPERATURE', 0.7)
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

    def generate_ai_turn(
        self,
        topic: str = 'free',
        level: int = 1,
        history: list[dict] | None = None,
        greeting: bool = False,
    ) -> DialogueResponse:
        """Generate the AI's next turn in a conversation."""
        if not self.client:
            return self._fallback_greeting() if greeting else self._fallback_response()

        history_text = self._format_history(history or [])

        if greeting:
            prompt = (
                f"Greet the student warmly in Arabic to start a {topic} conversation. "
                "Keep it simple and inviting. Ask them how they are."
            )
        else:
            prompt = "Continue the conversation naturally based on what the student just said."

        system = DIALOGUE_SYSTEM_PROMPT.format(
            topic=topic, level=level, history=history_text,
        )

        start = time.time()
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
            )

            content = response.choices[0].message.content.strip()
            if content.startswith('```'):
                content = content.split('\n', 1)[1].rsplit('```', 1)[0].strip()

            data = json.loads(content)
            elapsed_ms = int((time.time() - start) * 1000)

            return DialogueResponse(
                text_ar=data.get('text_ar', ''),
                text_en=data.get('text_en', ''),
                transliteration=data.get('transliteration', ''),
                correction=data.get('correction', ''),
                suggestion=data.get('suggestion', ''),
                context_tags=data.get('context_tags', []),
                processing_time_ms=elapsed_ms,
                raw_response=data,
            )

        except (json.JSONDecodeError, Exception) as e:
            logger.error("DialogueLLM failed: %s", e)
            return self._fallback_response()

    def evaluate_student_turn(
        self,
        student_text: str,
        expected_phrases: list[str] | None = None,
        history: list[dict] | None = None,
    ) -> TurnEvaluation:
        """Evaluate a student's turn for pronunciation, fluency, vocabulary."""
        if not self.client:
            return TurnEvaluation(
                pronunciation_score=70, fluency_score=70,
                vocabulary_score=70, turn_score=70,
                feedback='AI evaluation unavailable',
            )

        system = (
            "You are an Arabic language evaluator. Evaluate the student's Arabic speaking turn. "
            "Respond with valid JSON only.\n\n"
            + RESPONSE_FORMAT.replace('text_ar', 'pronunciation_score')
            .replace('"Arabic response"', '0.0')
            + "\n\nReturn:\n"
            '{"pronunciation_score": 80.0, "fluency_score": 75.0, "vocabulary_score": 85.0, '
            '"turn_score": 80.0, "feedback": "Constructive feedback in English"}'
        )

        user_msg = f"Student said: {student_text}"
        if expected_phrases:
            user_msg += f"\nExpected phrases: {', '.join(expected_phrases)}"

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_msg},
                ],
                max_tokens=256,
                temperature=0.3,
            )

            content = response.choices[0].message.content.strip()
            if content.startswith('```'):
                content = content.split('\n', 1)[1].rsplit('```', 1)[0].strip()

            data = json.loads(content)
            return TurnEvaluation(
                pronunciation_score=float(data.get('pronunciation_score', 70)),
                fluency_score=float(data.get('fluency_score', 70)),
                vocabulary_score=float(data.get('vocabulary_score', 70)),
                turn_score=float(data.get('turn_score', 70)),
                feedback=data.get('feedback', ''),
            )

        except Exception as e:
            logger.error("Turn evaluation failed: %s", e)
            return TurnEvaluation(
                pronunciation_score=70, fluency_score=70,
                vocabulary_score=70, turn_score=70,
                feedback=f'Evaluation failed: {e}',
            )

    def _format_history(self, history: list[dict]) -> str:
        lines = []
        for turn in history[-10:]:
            role = turn.get('role', 'unknown')
            text = turn.get('text_ar', '')
            lines.append(f"{'AI' if role == 'ai' else 'Student'}: {text}")
        return '\n'.join(lines) if lines else '(Start of conversation)'

    def _fallback_greeting(self) -> DialogueResponse:
        return DialogueResponse(
            text_ar='السلام عليكم! أهلاً وسهلاً بك. كيف حالك اليوم؟',
            text_en='Peace be upon you! Welcome. How are you today?',
            transliteration='Assalamu alaikum! Ahlan wa sahlan bik. Kayf haluk al-yawm?',
            correction='', suggestion='أنا بخير، الحمد لله',
            context_tags=['greeting'],
        )

    def _fallback_response(self) -> DialogueResponse:
        return DialogueResponse(
            text_ar='ممتاز! أكمل، أحب أن أسمعك تتحدث العربية.',
            text_en="Excellent! Continue, I love hearing you speak Arabic.",
            transliteration='Mumtaz! Akmal, uhibb an asmaka tatahadath al-arabiyya.',
            correction='', suggestion='',
            context_tags=['encouragement'],
        )
