import re
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CareerRecommendation, AITutorSession
from .serializers import CareerRecommendationSerializer, AITutorSessionSerializer
from users.models import User


CAREER_PROFILES = {
    'science': {
        'recommendations': [
            {
                'career': 'Software Engineer',
                'description': 'Design, develop, and maintain software applications and systems. Work with cutting-edge technologies to solve complex problems.',
                'required_skills': ['Programming', 'Problem Solving', 'Mathematics', 'Logical Thinking'],
                'avg_salary': '$80,000 - $130,000',
                'growth_outlook': 'Very High - 22% growth projected',
            },
            {
                'career': 'Civil Engineer',
                'description': 'Plan, design, and oversee construction of infrastructure projects like bridges, roads, and buildings.',
                'required_skills': ['Mathematics', 'Physics', 'Project Management', 'Design'],
                'avg_salary': '$70,000 - $120,000',
                'growth_outlook': 'High - 8% growth projected',
            },
            {
                'career': 'Medical Doctor',
                'description': 'Diagnose and treat illnesses, prescribe medications, and advise patients on health improvement.',
                'required_skills': ['Biology', 'Chemistry', 'Empathy', 'Critical Thinking'],
                'avg_salary': '$100,000 - $200,000',
                'growth_outlook': 'High - 3% growth projected',
            },
            {
                'career': 'Data Scientist',
                'description': 'Analyze and interpret complex data to help organizations make informed decisions using statistical methods.',
                'required_skills': ['Statistics', 'Programming', 'Mathematics', 'Analytical Thinking'],
                'avg_salary': '$90,000 - $150,000',
                'growth_outlook': 'Very High - 36% growth projected',
            },
        ],
        'universities': [
            {'name': 'University of Lagos', 'location': 'Lagos, Nigeria', 'website': 'https://www.unilag.edu.ng'},
            {'name': 'Ahmadu Bello University', 'location': 'Zaria, Nigeria', 'website': 'https://www.abu.edu.ng'},
            {'name': 'King Fahd University', 'location': 'Dhahran, Saudi Arabia', 'website': 'https://www.kfupm.edu.sa'},
        ],
        'courses': [
            {'name': 'Introduction to Computer Science', 'provider': 'edX / MIT', 'duration': '12 weeks'},
            {'name': 'Engineering Fundamentals', 'provider': 'Coursera / Stanford', 'duration': '8 weeks'},
            {'name': 'Data Science Professional Certificate', 'provider': 'Coursera / IBM', 'duration': '10 weeks'},
        ],
    },
    'languages': {
        'recommendations': [
            {
                'career': 'Teacher / Educator',
                'description': 'Inspire and educate the next generation. Plan lessons, assess student progress, and create engaging learning experiences.',
                'required_skills': ['Communication', 'Patience', 'Creativity', 'Subject Knowledge'],
                'avg_salary': '$40,000 - $70,000',
                'growth_outlook': 'Stable - 5% growth projected',
            },
            {
                'career': 'Translator / Interpreter',
                'description': 'Facilitate communication between speakers of different languages in various settings including business, legal, and medical.',
                'required_skills': ['Bilingual Fluency', 'Cultural Awareness', 'Attention to Detail'],
                'avg_salary': '$50,000 - $80,000',
                'growth_outlook': 'Moderate - 6% growth projected',
            },
            {
                'career': 'Journalist / Content Writer',
                'description': 'Research, write, and report news and stories for various media platforms including print, digital, and broadcast.',
                'required_skills': ['Writing', 'Research', 'Storytelling', 'Critical Thinking'],
                'avg_salary': '$35,000 - $65,000',
                'growth_outlook': 'Moderate - 4% growth projected',
            },
            {
                'career': 'Public Relations Specialist',
                'description': 'Manage organizational communication and public image through strategic messaging and media relations.',
                'required_skills': ['Communication', 'Writing', 'Media Relations', 'Strategy'],
                'avg_salary': '$45,000 - $75,000',
                'growth_outlook': 'Moderate - 7% growth projected',
            },
        ],
        'universities': [
            {'name': 'University of Ibadan', 'location': 'Ibadan, Nigeria', 'website': 'https://www.ui.edu.ng'},
            {'name': 'King Saud University', 'location': 'Riyadh, Saudi Arabia', 'website': 'https://www.ksu.edu.sa'},
            {'name': 'Al-Azhar University', 'location': 'Cairo, Egypt', 'website': 'https://www.azhar.edu.eg'},
        ],
        'courses': [
            {'name': 'Creative Writing Specialization', 'provider': 'Coursera / Wesleyan', 'duration': '6 weeks'},
            {'name': 'Arabic-English Translation', 'provider': 'edX / Qatar University', 'duration': '10 weeks'},
            {'name': 'Digital Journalism', 'provider': 'Coursera / Michigan', 'duration': '8 weeks'},
        ],
    },
    'islamic': {
        'recommendations': [
            {
                'career': 'Imam / Islamic Scholar',
                'description': 'Lead community prayers, deliver sermons, and provide spiritual guidance rooted in Islamic knowledge.',
                'required_skills': ['Quran Recitation', 'Islamic Jurisprudence', 'Public Speaking', 'Community Leadership'],
                'avg_salary': '$30,000 - $60,000',
                'growth_outlook': 'Stable - Community demand',
            },
            {
                'career': 'Quran Teacher',
                'description': 'Teach Quran recitation, memorization, and Tajweed rules to students of all ages.',
                'required_skills': ['Tajweed', 'Quran Memorization', 'Teaching', 'Patience'],
                'avg_salary': '$25,000 - $50,000',
                'growth_outlook': 'High - Growing demand globally',
            },
            {
                'career': 'Islamic Education Consultant',
                'description': 'Develop curricula and advise institutions on Islamic education best practices and pedagogy.',
                'required_skills': ['Curriculum Design', 'Islamic Studies', 'Education', 'Advisory Skills'],
                'avg_salary': '$45,000 - $80,000',
                'growth_outlook': 'Moderate - Institutional growth',
            },
            {
                'career': 'Daawah Coordinator',
                'description': 'Organize and lead outreach programs, community events, and interfaith dialogue initiatives.',
                'required_skills': ['Communication', 'Event Management', 'Islamic Knowledge', 'Leadership'],
                'avg_salary': '$30,000 - $55,000',
                'growth_outlook': 'Moderate - Community expansion',
            },
        ],
        'universities': [
            {'name': 'Islamic University of Madinah', 'location': 'Madinah, Saudi Arabia', 'website': 'https://www.iu.edu.sa'},
            {'name': 'University of Ilorin', 'location': 'Ilorin, Nigeria', 'website': 'https://www.ui.edu.ng'},
            {'name': 'Al-Azhar University', 'location': 'Cairo, Egypt', 'website': 'https://www.azhar.edu.eg'},
        ],
        'courses': [
            {'name': 'Advanced Tajweed and Quran Recitation', 'provider': 'Al-Azhar Online', 'duration': '16 weeks'},
            {'name': 'Islamic Jurisprudence Fundamentals', 'provider': 'Madinah University Online', 'duration': '12 weeks'},
            {'name': 'Islamic Education Methods', 'provider': 'Coursera', 'duration': '8 weeks'},
        ],
    },
    'default': {
        'recommendations': [
            {
                'career': 'Business Analyst',
                'description': 'Analyze business processes and recommend improvements using data-driven insights and technology solutions.',
                'required_skills': ['Analysis', 'Communication', 'Problem Solving', 'IT Skills'],
                'avg_salary': '$60,000 - $100,000',
                'growth_outlook': 'High - 14% growth projected',
            },
            {
                'career': 'Project Manager',
                'description': 'Plan, execute, and close projects while managing teams, budgets, and stakeholder expectations.',
                'required_skills': ['Leadership', 'Organization', 'Communication', 'Risk Management'],
                'avg_salary': '$65,000 - $110,000',
                'growth_outlook': 'High - 7% growth projected',
            },
            {
                'career': 'IT Support Specialist',
                'description': 'Provide technical support, troubleshoot issues, and maintain computer systems for organizations.',
                'required_skills': ['Technical Skills', 'Problem Solving', 'Customer Service', 'Networking'],
                'avg_salary': '$40,000 - $70,000',
                'growth_outlook': 'Moderate - 6% growth projected',
            },
            {
                'career': 'Entrepreneur',
                'description': 'Start and grow your own business, developing innovative products or services to meet market needs.',
                'required_skills': ['Leadership', 'Creativity', 'Financial Literacy', 'Marketing'],
                'avg_salary': 'Variable - Highly dependent on success',
                'growth_outlook': 'Unlimited - Self-determined',
            },
        ],
        'universities': [
            {'name': 'University of Lagos', 'location': 'Lagos, Nigeria', 'website': 'https://www.unilag.edu.ng'},
            {'name': 'American University of Cairo', 'location': 'Cairo, Egypt', 'website': 'https://wwwaucept.edu'},
            {'name': 'International Islamic University', 'location': 'Kuala Lumpur, Malaysia', 'website': 'https://www.iium.edu.my'},
        ],
        'courses': [
            {'name': 'Business Foundations', 'provider': 'Coursera / Wharton', 'duration': '8 weeks'},
            {'name': 'Google IT Support Professional', 'provider': 'Coursera / Google', 'duration': '6 months'},
            {'name': 'Entrepreneurship Specialization', 'provider': 'Coursera / Wharton', 'duration': '10 weeks'},
        ],
    },
}


def get_profile_key(student):
    return 'default'


TUTOR_RESPONSES = {
    'explain': {
        'template': "Great question! Let me explain this concept clearly.\n\n**Explanation:**\n{question_subject} is a fundamental concept that involves understanding the core principles and their practical applications. In Islamic education, this topic is important because it helps build a strong foundation for further learning.\n\nThe key points to remember are:\n1. Start with the basic definitions and terminology\n2. Understand the underlying principles and logic\n3. Practice applying the concept to real scenarios\n4. Review and reinforce through repetition\n\nTake your time to absorb each part before moving to the next.",
        'example': "**Example:**\nConsider a simple scenario where you apply this concept in daily life. For instance, when studying Quran, breaking down verses word by word helps deepen understanding and retention.",
        'tip': "**Practice Tip:**\nTry teaching this concept to someone else. If you can explain it clearly, you truly understand it. Write down 3 key takeaways from your study session.",
    },
    'what_is': {
        'template': "Let me help you understand this topic!\n\n**What is this about?**\n{question_subject} refers to an important area of knowledge that combines theory with practical application. It has deep roots in both Islamic scholarship and modern academic study.\n\n**Key aspects:**\n- It provides a framework for understanding the world around us\n- It connects to multiple other subjects and disciplines\n- It is used in both everyday life and specialized fields\n- Mastery of this topic opens doors to advanced studies",
        'example': "**Practical Illustration:**\nThink of this like the foundation of a building - everything else is built upon it. Just as a strong foundation makes a building stable, understanding this concept makes learning advanced topics much easier.",
        'tip': "**Study Tip:**\nCreate a mind map connecting this topic to other subjects you study. Visual connections help cement understanding in your memory.",
    },
    'how_to': {
        'template': "Here's a step-by-step approach to tackle this!\n\n**Steps to follow:**\n1. **Understand the basics** - Make sure you have the foundational knowledge\n2. **Break it down** - Divide the problem into smaller, manageable parts\n3. **Practice regularly** - Consistency is key to mastery\n4. **Seek help when stuck** - Don't hesitate to ask your Ustaadh or peers\n5. **Review and reflect** - Regular revision helps long-term retention\n\nRemember, the Prophet Muhammad (peace be upon him) said: 'Seek knowledge from the cradle to the grave.' Every step forward is progress!",
        'example': "**Example approach:**\nStart with the simplest version of the problem. Once you master that, gradually increase complexity. This is how skills are built - layer by layer.",
        'tip': "**Pro Tip:**\nSet aside a specific time each day for study. Even 20 minutes of focused daily practice is more effective than occasional long sessions.",
    },
    'why': {
        'template': "Excellent question! Understanding the 'why' is crucial for deep learning.\n\n**Why this matters:**\n{question_subject} is important because it connects to our broader understanding of knowledge and the world. In Islam, seeking knowledge is considered a form of worship (ibadah).\n\n**Reasons this is significant:**\n- It helps develop critical thinking skills\n- It connects theoretical knowledge with practical application\n- It builds a foundation for advanced learning\n- It is relevant to both personal development and community benefit\n- Understanding 'why' makes 'what' and 'how' much easier to grasp",
        'example': "**Illustration:**\nConsider how understanding why the sky is blue leads to deeper knowledge of physics, chemistry, and even the beauty of Allah's creation. The 'why' opens doors to wonder and deeper understanding.",
        'tip': "**Reflection Tip:**\nBefore studying, ask yourself 'why am I learning this?' Connecting your studies to personal goals and purpose makes learning more meaningful and memorable.",
    },
    'default': {
        'template': "That's a thoughtful question! Let me help you explore this topic.\n\n**My Response:**\nThis is an area worth exploring in depth. Based on your question, here are the key aspects to consider:\n\n1. **Foundation** - Ensure you understand the basic concepts first\n2. **Context** - Consider how this relates to what you've already learned\n3. **Application** - Think about how this knowledge can be applied\n4. **Connection** - Link this to other subjects and real-world scenarios\n\nIn Islamic tradition, the pursuit of knowledge is highly valued. The Prophet (peace be upon him) said: 'Whoever follows a path in pursuit of knowledge, Allah will make easy for him a path to Paradise.' (Sahih Muslim)",
        'example': "**Example:**\nTake a specific aspect of your question and analyze it step by step. Write down what you know, what you don't know, and what you need to find out. This structured approach helps organize your thoughts.",
        'tip': "**Learning Tip:**\nKeep a study journal. After each study session, write down what you learned, what confused you, and what you want to explore further. This builds metacognitive skills that accelerate learning.",
    },
}


def get_tutor_response(question):
    q_lower = question.lower()
    profile_key = 'default'
    if any(w in q_lower for w in ['explain', 'describe', 'tell me about']):
        profile_key = 'explain'
    elif any(w in q_lower for w in ['what is', 'what are', 'define', 'definition']):
        profile_key = 'what_is'
    elif any(w in q_lower for w in ['how to', 'how do', 'how can', 'steps', 'method']):
        profile_key = 'how_to'
    elif any(w in q_lower for w in ['why', 'reason', 'purpose', 'cause']):
        profile_key = 'why'

    profile = TUTOR_RESPONSES[profile_key]
    question_words = [w for w in q_lower.split() if w not in ('what', 'is', 'are', 'how', 'to', 'do', 'can', 'why', 'the', 'a', 'an', 'explain', 'tell', 'me', 'about', 'define')]
    subject = ' '.join(question_words[:5]) if question_words else 'this topic'

    explanation = profile['template'].format(question_subject=subject)
    example = profile['example']
    tip = profile['tip']
    full_response = f"{explanation}\n\n{example}\n\n{tip}"
    return full_response


class CareerGuidanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        student_id = request.data.get('student_id')
        if not student_id:
            return Response({'error': 'student_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = User.objects.get(id=student_id, madrasah=request.user.madrasah)
        except User.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

        profile_key = get_profile_key(student)
        profile = CAREER_PROFILES[profile_key]

        CareerRecommendation.objects.filter(
            student=student, is_current=True,
        ).update(is_current=False)

        recommendation = CareerRecommendation.objects.create(
            madrasah=request.user.madrasah,
            student=student,
            recommendations=profile['recommendations'],
            recommended_universities=profile['universities'],
            recommended_courses=profile['courses'],
        )

        return Response(
            CareerRecommendationSerializer(recommendation).data,
            status=status.HTTP_201_CREATED,
        )


class AITutorSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        question = request.data.get('question', '').strip()
        subject_id = request.data.get('subject_id')

        if not question:
            return Response({'error': 'question is required'}, status=status.HTTP_400_BAD_REQUEST)

        subject = None
        if subject_id:
            from curriculum.models import Subject
            try:
                subject = Subject.objects.get(id=subject_id, madrasah=request.user.madrasah)
            except Subject.DoesNotExist:
                pass

        response_text = get_tutor_response(question)

        session = AITutorSession.objects.create(
            madrasah=request.user.madrasah,
            student=request.user,
            subject=subject,
            question=question,
            response=response_text,
        )

        return Response(
            AITutorSessionSerializer(session).data,
            status=status.HTTP_201_CREATED,
        )


class CareerRecommendationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = CareerRecommendation.objects.filter(madrasah=user.madrasah).select_related('student')

        if user.role == 'student':
            qs = qs.filter(student=user)

        student_id = request.query_params.get('student')
        if student_id:
            qs = qs.filter(student_id=student_id)

        serializer = CareerRecommendationSerializer(qs, many=True)
        return Response(serializer.data)


class AITutorSessionListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = AITutorSession.objects.filter(madrasah=user.madrasah).select_related('student', 'subject')

        if user.role == 'student':
            qs = qs.filter(student=user)

        serializer = AITutorSessionSerializer(qs, many=True)
        return Response(serializer.data)
