import logging
from decouple import config
from django.conf import settings

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        self.max_tokens = settings.OPENAI_MAX_TOKENS
        self.temperature = settings.OPENAI_TEMPERATURE
        self._client = None

    @property
    def client(self):
        if self._client is None and self.api_key:
            from openai import OpenAI
            self._client = OpenAI(api_key=self.api_key)
        return self._client

    def _template_fallback(self, prompt_type, **kwargs):
        from .views import TUTOR_RESPONSES, get_tutor_response
        if prompt_type == 'tutor':
            return get_tutor_response(kwargs.get('question', ''))
        if prompt_type == 'summary':
            return self._summary_fallback(**kwargs)
        if prompt_type == 'career':
            return self._career_fallback(**kwargs)
        return "AI service unavailable. Please configure OPENAI_API_KEY."

    def _summary_fallback(self, **kwargs):
        student_name = kwargs.get('student_name', 'Student')
        return (
            f"**Performance Summary for {student_name}**\n\n"
            "Detailed AI-powered analysis is available once OPENAI_API_KEY is configured.\n\n"
            "Currently showing template-based insights:\n"
            f"- Overall assessment based on available academic data\n"
            "- Monitor attendance patterns and quiz performance trends\n"
            "- Review subject-wise strengths and areas for improvement\n"
        )

    def _career_fallback(self, **kwargs):
        from .views import CAREER_PROFILES, get_profile_key
        student = kwargs.get('student')
        if student:
            profile_key = get_profile_key(student)
            profile = CAREER_PROFILES.get(profile_key, CAREER_PROFILES['default'])
            top = profile['recommendations'][:3]
            names = ', '.join(r['career'] for r in top)
            return f"Based on available data, suggested careers: {names}. Configure OPENAI_API_KEY for personalized AI recommendations."
        return "Career guidance available once OPENAI_API_KEY is configured."

    def tutor_response(self, question, subject_name=None, student_name=None):
        if not self.client:
            logger.info("[AI] No API key; using template fallback for tutor")
            return self._template_fallback('tutor', question=question)

        system_prompt = (
            "You are a knowledgeable Islamic school tutor. Answer the student's question "
            "in a clear, educational manner. Use examples where helpful. "
            f"{'The subject is ' + subject_name + '.' if subject_name else ''}"
            " Keep responses concise but thorough."
        )

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question},
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error("[AI] OpenAI error: %s", e)
            return self._template_fallback('tutor', question=question)

    def student_summary(self, student_name, academic_data, character_data=None):
        if not self.client:
            logger.info("[AI] No API key; using template fallback for summary")
            return self._template_fallback('summary', student_name=student_name)

        prompt_parts = [f"Generate a brief academic summary for {student_name}."]
        if academic_data:
            prompt_parts.append(f"Academic data: {academic_data}")
        if character_data:
            prompt_parts.append(f"Character evaluation: {character_data}")
        prompt_parts.append("Highlight strengths, areas for improvement, and recommendations.")

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an educational analyst providing student summaries."},
                    {"role": "user", "content": ' '.join(prompt_parts)},
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error("[AI] Summary error: %s", e)
            return self._template_fallback('summary', student_name=student_name)

    def career_recommendation(self, student, subject_scores=None):
        if not self.client:
            logger.info("[AI] No API key; using template fallback for career")
            return self._template_fallback('career', student=student)

        try:
            profile = (
                f"Student: {student.get_full_name()}\n"
                f"Subjects and scores: {subject_scores or 'Not available'}\n"
                "Provide personalized career recommendations based on their academic profile."
            )
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a career guidance counselor specializing in Islamic education paths."},
                    {"role": "user", "content": profile},
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error("[AI] Career error: %s", e)
            return self._template_fallback('career', student=student)
