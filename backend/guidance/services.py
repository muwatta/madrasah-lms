import logging
from datetime import date, timedelta
from django.conf import settings
from django.db.models import Avg, Count, Q

logger = logging.getLogger(__name__)


class StudentContextService:
    def __init__(self, student, madrasah):
        self.student = student
        self.madrasah = madrasah

    def get_age(self):
        if not self.student.date_of_birth:
            return None
        today = date.today()
        return today.year - self.student.date_of_birth.year - (
            (today.month, today.day) < (self.student.date_of_birth.month, self.student.date_of_birth.day)
        )

    def get_enrollments(self):
        from curriculum.models import Enrollment
        return Enrollment.objects.filter(
            student=self.student, madrasah=self.madrasah,
        ).select_related('subject', 'school_class')

    def get_quiz_performance(self):
        from assessments.models import QuizAttempt
        attempts = QuizAttempt.objects.filter(
            student=self.student, percentage__isnull=False,
        ).order_by('-submitted_at')[:20]
        if not attempts:
            return None
        avg = sum(a.percentage for a in attempts) / len(attempts)
        return {
            'average_score': round(float(avg), 1),
            'recent_scores': [float(a.percentage) for a in attempts[:5]],
            'total_attempts': len(attempts),
        }

    def get_attendance(self):
        from school_ops.models import Attendance
        ninety_days_ago = date.today() - timedelta(days=90)
        records = Attendance.objects.filter(
            student=self.student, madrasah=self.madrasah, date__gte=ninety_days_ago,
        )
        total = records.count()
        if total == 0:
            return None
        present = records.filter(status='present').count()
        late = records.filter(status='late').count()
        absent = records.filter(status='absent').count()
        return {
            'rate': round((present + late) / total * 100, 1),
            'present': present,
            'late': late,
            'absent': absent,
            'total': total,
        }

    def get_homework_completion(self):
        from lessons.models import Homework, HomeworkSubmission
        assigned = Homework.objects.filter(
            madrasah=self.madrasah, is_published=True,
            school_class__enrollments__student=self.student,
        ).distinct().count()
        if assigned == 0:
            return None
        submitted = HomeworkSubmission.objects.filter(
            student=self.student, madrasah=self.madrasah,
        ).count()
        return {
            'assigned': assigned,
            'submitted': submitted,
            'rate': round(submitted / assigned * 100, 1),
        }

    def get_at_risk_status(self):
        from analytics.models import AtRiskPrediction
        try:
            pred = AtRiskPrediction.objects.get(
                student=self.student, madrasah=self.madrasah, is_active=True,
            )
            return {
                'risk_level': pred.risk_level,
                'risk_score': float(pred.risk_score),
            }
        except AtRiskPrediction.DoesNotExist:
            return None

    def get_full_context(self):
        enrollments = self.get_enrollments()
        subjects_data = []
        for e in enrollments:
            subjects_data.append({
                'subject': e.subject.name_en,
                'class': e.school_class.name_en if e.school_class else None,
            })

        return {
            'name': self.student.get_full_name(),
            'age': self.get_age(),
            'subjects': subjects_data,
            'quiz_performance': self.get_quiz_performance(),
            'attendance': self.get_attendance(),
            'homework': self.get_homework_completion(),
            'at_risk': self.get_at_risk_status(),
        }


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
        context = kwargs.get('context', {})
        lines = [f"**Performance Summary for {student_name}**\n"]
        subjects = context.get('subjects', [])
        if subjects:
            lines.append(f"Enrolled in {', '.join(s['subject'] for s in subjects)}.")
        quiz = context.get('quiz_performance')
        if quiz:
            lines.append(f"Average quiz score: {quiz['average_score']}% over {quiz['total_attempts']} attempts.")
        att = context.get('attendance')
        if att:
            lines.append(f"Attendance rate: {att['rate']}%.")
        lines.append("\nDetailed AI analysis available once OPENAI_API_KEY is configured.")
        return '\n'.join(lines)

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

    def _build_tutor_system_prompt(self, subject_name=None, student_context=None):
        parts = [
            "You are a knowledgeable Islamic school tutor. Answer the student's question "
            "in a clear, educational manner. Use examples where helpful."
        ]
        if subject_name:
            parts.append(f"The subject is {subject_name}.")
        if student_context:
            ctx = student_context
            parts.append("Student context:")
            if ctx.get('age'):
                parts.append(f"- Age: {ctx['age']}")
            subjects = ctx.get('subjects', [])
            if subjects:
                names = ', '.join(s['subject'] for s in subjects)
                parts.append(f"- Enrolled subjects: {names}")
            quiz = ctx.get('quiz_performance')
            if quiz:
                parts.append(f"- Recent quiz average: {quiz['average_score']}%")
            att = ctx.get('attendance')
            if att:
                parts.append(f"- Attendance rate: {att['rate']}%")
        parts.append("Keep responses concise but thorough.")
        return '\n'.join(parts)

    def _search_relevant_topics(self, question):
        from curriculum.models import Topic
        words = set(w.lower() for w in question.split() if len(w) > 3)
        if not words:
            return []
        query = Q()
        for w in words:
            query |= Q(name__icontains=w) | Q(description__icontains=w)
        return list(Topic.objects.filter(query).select_related('subject').values(
            'name', 'description', 'subject__name_en',
        )[:5])

    def contextual_tutor_response(self, question, subject_name=None, student_context=None):
        if not self.client:
            logger.info("[AI] No API key; using template fallback for tutor")
            return self._template_fallback('tutor', question=question)

        system_prompt = self._build_tutor_system_prompt(subject_name, student_context)

        relevant_topics = self._search_relevant_topics(question)
        enriched_question = question
        if relevant_topics:
            topic_summary = '; '.join(
                f"{t['name']} ({t['subject__name_en']})" for t in relevant_topics
            )
            enriched_question += f"\n\nRelevant curriculum topics: {topic_summary}"

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": enriched_question},
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error("[AI] OpenAI error: %s", e)
            return self._template_fallback('tutor', question=question)

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

    def contextual_summary(self, student_context):
        ctx = student_context
        student_name = ctx.get('name', 'Student')

        if not self.client:
            return self._summary_fallback(student_name=student_name, context=ctx)

        prompt_parts = [f"Generate a comprehensive academic summary for {student_name}."]
        subjects = ctx.get('subjects', [])
        if subjects:
            names = ', '.join(s['subject'] for s in subjects)
            prompt_parts.append(f"Enrolled in: {names}.")
            class_names = [s['class'] for s in subjects if s.get('class')]
            if class_names:
                prompt_parts.append(f"Classes: {', '.join(set(class_names))}.")
        quiz = ctx.get('quiz_performance')
        if quiz:
            prompt_parts.append(f"Recent quiz average: {quiz['average_score']}%. Recent scores: {quiz['recent_scores']}.")
        att = ctx.get('attendance')
        if att:
            prompt_parts.append(f"Attendance over 90 days: {att['rate']}% (present={att['present']}, late={att['late']}, absent={att['absent']}).")
        hw = ctx.get('homework')
        if hw:
            prompt_parts.append(f"Homework: {hw['submitted']}/{hw['assigned']} submitted ({hw['rate']}%).")
        risk = ctx.get('at_risk')
        if risk:
            prompt_parts.append(f"At-risk status: {risk['risk_level']} (score: {risk['risk_score']}).")
        prompt_parts.append("Highlight strengths, areas for improvement, and actionable recommendations.")

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an educational analyst providing detailed student summaries."},
                    {"role": "user", "content": ' '.join(prompt_parts)},
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error("[AI] Summary error: %s", e)
            return self._summary_fallback(student_name=student_name, context=ctx)

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

    def contextual_career_recommendation(self, student_context):
        ctx = student_context
        student_name = ctx.get('name', 'Student')

        if not self.client:
            return self._template_fallback('career', student=self._mock_student(student_name))

        prompt_parts = [f"Provide personalized career recommendations for {student_name}."]
        subjects = ctx.get('subjects', [])
        if subjects:
            prompt_parts.append(f"Enrolled subjects: {', '.join(s['subject'] for s in subjects)}.")
        quiz = ctx.get('quiz_performance')
        if quiz:
            prompt_parts.append(f"Academic performance: average quiz score {quiz['average_score']}%.")
        prompt_parts.append("Suggest 3-5 careers with reasons, required skills, and recommended next steps.")

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a career guidance counselor specializing in Islamic education paths."},
                    {"role": "user", "content": ' '.join(prompt_parts)},
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error("[AI] Career error: %s", e)
            return self._template_fallback('career', student=self._mock_student(student_name))

    def _mock_student(self, name):
        class MockStudent:
            def get_full_name(self):
                return name
        return MockStudent()
