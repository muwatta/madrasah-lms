from django.core.management.base import BaseCommand
from users.models import User, Madrasah, StudentParent
from curriculum.models import Subject, Topic, Enrollment, SchoolClass
from assessments.models import Question, Quiz
from results.models import Exam, ExamResult


CLASSES = [
    ('الصف الأول الابتدائي', 'Primary 1', 1),
    ('الصف الثاني الابتدائي', 'Primary 2', 2),
    ('الصف الثالث الابتدائي', 'Primary 3', 3),
    ('الصف الرابع الابتدائي', 'Primary 4', 4),
    ('الصف الخامس الابتدائي', 'Primary 5', 5),
    ('الصف السادس الابتدائي', 'Primary 6', 6),
    ('الصف الأول الإعدادي', 'Junior Secondary 1', 7),
    ('الصف الثاني الإعدادي', 'Junior Secondary 2', 8),
    ('الصف الثالث الإعدادي', 'Junior Secondary 3', 9),
    ('الصف الأول الثانوي', 'Senior Secondary 1', 10),
    ('الصف الثاني الثانوي', 'Senior Secondary 2', 11),
    ('الصف الثالث الثانوي', 'Senior Secondary 3', 12),
]

SUBJECTS = [
    ('القرآن الكريم', 'Holy Quran', 'QUR', 'Quran memorization and recitation'),
    ('التفسير', 'Tafsir', 'TSR', 'Quranic exegesis and interpretation'),
    ('التجويد', 'Tajweed', 'TJD', 'Rules of Quran recitation'),
    ('الحديث', 'Hadith', 'HDH', 'Prophetic traditions and narrations'),
    ('العقيدة', 'Aqeedah', 'AQD', 'Islamic creed and belief'),
    ('الفقه', 'Fiqh', 'FIQ', 'Islamic jurisprudence'),
    ('أصول الفقه', 'Usul Fiqh', 'UFQ', 'Principles of Islamic jurisprudence'),
    ('السيرة النبوية', 'Seerah', 'SIR', 'Prophetic biography'),
    ('التوحيد', 'Tawheed', 'TWD', 'Oneness of Allah'),
    ('الأخلاق الإسلامية', 'Islamic Ethics', 'IEC', 'Islamic moral conduct'),
    ('اللغة العربية', 'Arabic Language', 'ARB', 'Arabic language studies'),
    ('النحو', 'Arabic Grammar', 'NGH', 'Arabic syntax and grammar'),
    ('الصرف', 'Morphology', 'SRF', 'Arabic word morphology'),
    ('البلاغة', 'Rhetoric', 'BLG', 'Arabic rhetoric and eloquence'),
    ('الأدب العربي', 'Arabic Literature', 'ADB', 'Arabic literary works'),
    ('الإملاء', 'Dictation', 'IML', 'Arabic spelling and dictation'),
    ('الإنشاء', 'Composition', 'INS', 'Arabic writing composition'),
    ('الخط العربي', 'Calligraphy', 'KHT', 'Arabic calligraphy'),
    ('المطالعة', 'Reading', 'MTL', 'Arabic reading comprehension'),
    ('اللغة الإنجليزية', 'English Language', 'ENG', 'English language studies'),
    ('الرياضيات', 'Mathematics', 'MTH', 'Mathematics'),
    ('العلوم', 'Basic Science', 'SCI', 'Basic science'),
    ('الفيزياء', 'Physics', 'PHY', 'Physics'),
    ('الكيمياء', 'Chemistry', 'CHM', 'Chemistry'),
    ('الأحياء', 'Biology', 'BIO', 'Biology'),
    ('الدراسات الاجتماعية', 'Social Studies', 'SST', 'Social studies'),
    ('التاريخ', 'History', 'HIS', 'History'),
    ('الجغرافيا', 'Geography', 'GEO', 'Geography'),
    ('ال التربية الوطنية', 'Civic Education', 'CIV', 'Civic education'),
    ('الحاسوب', 'Computer Studies', 'CMP', 'Computer studies'),
    ('التربية البدنية', 'Physical Education', 'PED', 'Physical education'),
]

TOPICS = {
    'القرآن الكريم': ['سورة الفاتحة', 'سورة البقرة (الجزء الأول)', 'سورة يس', 'سورة الرحمن', 'سورة الكهف'],
    'التجويد': ['أحكام النون الساكنة', 'المخارج الحروف', 'الواجبات', 'السنن'],
    'الفقه': ['الوضوء', 'الصلاة', 'الزكاة', 'الصوم', 'الحج'],
    'اللغة العربية': ['الحروف الهجائية', 'القواعد الأساسية', 'المصطلحات الشائعة'],
    'العقيدة': ['التوحيد', 'النبوة', 'اليوم الآخر'],
    'التفسير': ['تفسير الفاتحة', 'تفسير آيات مختارة', 'أسباب النزول'],
    'السيرة النبوية': ['المولد النبوي', 'الهجرة', 'غزوات الرسول'],
    'الرياضيات': ['العمليات الحسابية', 'الكسور', 'النسبة المئوية'],
    'العلوم': ['المخلوقات الحية', 'ال weather', 'الجسم الإنساني'],
    'اللغة الإنجليزية': ['基础英语', 'Grammar Basics', 'Common Phrases'],
}


class Command(BaseCommand):
    help = 'Seed database with demo data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # Create madrasah
        madrasah, _ = Madrasah.objects.get_or_create(
            name='Demo Madrasah',
            defaults={'city': 'Lagos', 'email': 'demo@madrasah.com', 'address': '123 Islam Lane, Lagos'}
        )

        # Create classes
        classes = []
        for name_ar, name_en, order in CLASSES:
            school_class, _ = SchoolClass.objects.get_or_create(
                madrasah=madrasah,
                name_ar=name_ar,
                defaults={'name_en': name_en, 'order': order}
            )
            classes.append(school_class)

        # Create admin
        admin, _ = User.objects.get_or_create(
            email='admin@madrasah.com',
            defaults={
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'mudeer',
                'madrasah': madrasah,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin.set_password('admin123')
        admin.save()

        # Create teacher
        teacher, _ = User.objects.get_or_create(
            email='teacher@madrasah.com',
            defaults={
                'first_name': 'Ustaadh',
                'last_name': 'Ahmed',
                'role': 'ustaadh',
                'madrasah': madrasah,
            }
        )
        teacher.set_password('teacher123')
        teacher.save()

        # Create students
        students = []
        for i, (fname, lname) in enumerate([
            ('عبدالله', 'ابراهيم'), ('فاطمة', 'علي'), ('عمر', 'حسن'),
            ('عائشة', 'محمد'), ('يوسف', 'بلو'),
        ], 1):
            student, _ = User.objects.get_or_create(
                email=f'student{i}@madrasah.com',
                defaults={
                    'first_name': fname,
                    'last_name': lname,
                    'role': 'student',
                    'madrasah': madrasah,
                }
            )
            student.set_password('student123')
            student.save()
            students.append(student)

        # Create parent
        parent, _ = User.objects.get_or_create(
            email='parent@madrasah.com',
            defaults={
                'first_name': 'ابراهيم',
                'last_name': 'أولاديبو',
                'role': 'parent',
                'madrasah': madrasah,
            }
        )
        parent.set_password('parent123')
        parent.save()

        # Link parent to first student
        StudentParent.objects.get_or_create(
            student=students[0],
            parent=parent,
            defaults={'relationship': 'father'}
        )

        # Create board member
        board, _ = User.objects.get_or_create(
            email='board@madrasah.com',
            defaults={
                'first_name': 'الشيخ',
                'last_name': 'عبدالله',
                'role': 'idaarah',
                'madrasah': madrasah,
            }
        )
        board.set_password('board123')
        board.save()

        # Create subjects
        subjects = []
        for name_ar, name_en, code, desc in SUBJECTS:
            subj, _ = Subject.objects.get_or_create(
                madrasah=madrasah,
                name_ar=name_ar,
                defaults={'name_en': name_en, 'code': code, 'description': desc}
            )
            subjects.append(subj)

        # Create topics
        topics_map = {}
        for subj in subjects:
            topics_map[subj.name_ar] = []
            for tname in TOPICS.get(subj.name_ar, []):
                topic, _ = Topic.objects.get_or_create(
                    subject=subj,
                    name=tname,
                )
                topics_map[subj.name_ar].append(topic)

        # Enroll first 5 subjects for all students
        for student in students:
            for subj in subjects[:5]:
                Enrollment.objects.get_or_create(
                    madrasah=madrasah,
                    student=student,
                    subject=subj,
                    defaults={
                        'ustaadh': teacher,
                        'school_class': classes[0],
                    }
                )

        # Create questions for the first subject's topics
        q_list = []
        first_subj = subjects[0]
        for topic in topics_map.get(first_subj.name_ar, [])[:2]:
            for q_data in [
                {
                    'question_text': 'ما هي أول سورة في القرآن الكريم؟',
                    'question_type': 'mcq',
                    'options': ['الفاتحة', 'البقرة', 'آل عمران', 'النساء'],
                    'correct_answer': 'الفاتحة',
                    'explanation': 'سورة الفاتحة هي أول سورة في القرآن الكريم',
                    'difficulty': 'easy',
                },
                {
                    'question_text': 'كم عدد سور القرآن الكريم؟',
                    'question_type': 'fill_blank',
                    'correct_answer': '114',
                    'explanation': 'يحتوي القرآن الكريم على 114 سورة',
                    'difficulty': 'medium',
                },
                {
                    'question_text': 'ما معنى التوحيد؟',
                    'question_type': 'short_answer',
                    'correct_answer': 'التوحيد هو الإيمان بوحدانية الله',
                    'explanation': 'التوحيد هو المفهوم المركزي في الإسلام',
                    'difficulty': 'medium',
                },
            ]:
                q, _ = Question.objects.get_or_create(
                    madrasah=madrasah,
                    topic=topic,
                    created_by=teacher,
                    question_text=q_data['question_text'],
                    defaults=q_data
                )
                q_list.append(q)

        # Create quizzes
        if q_list:
            quiz1, _ = Quiz.objects.get_or_create(
                madrasah=madrasah,
                subject=first_subj,
                created_by=teacher,
                title='اختبار أساسيات القرآن',
                defaults={
                    'description': 'اختبار في أساسيات القرآن الكريم',
                    'question_ids': [q.id for q in q_list[:3]],
                    'quiz_type': 'practice',
                    'time_limit_minutes': 15,
                    'passing_score': 60,
                    'is_published': True,
                }
            )

            if len(q_list) > 3:
                quiz2, _ = Quiz.objects.get_or_create(
                    madrasah=madrasah,
                    subject=subjects[2],
                    created_by=teacher,
                    title='اختبار أحكام التجويد',
                    defaults={
                        'description': 'اختبار في قواعد التجويد',
                        'question_ids': [q.id for q in q_list[3:6]] if len(q_list) > 5 else [],
                        'quiz_type': 'test',
                        'time_limit_minutes': 20,
                        'passing_score': 70,
                        'is_published': True,
                    }
                )

            # Create an exam
            from datetime import date
            exam, _ = Exam.objects.get_or_create(
                madrasah=madrasah,
                subject=first_subj,
                created_by=teacher,
                title='اختبار منتصف الفصل - القرآن',
                defaults={
                    'exam_date': date(2026, 8, 15),
                    'description': 'اختبار منتصف الفصل في مادة القرآن الكريم',
                    'total_marks': 100,
                }
            )

            # Record some exam results
            for i, student in enumerate(students[:3]):
                score = [85, 72, 91][i]
                grade = ExamResult.calculate_grade(score)
                ExamResult.objects.get_or_create(
                    exam=exam,
                    student=student,
                    defaults={'score': score, 'grade': grade, 'remarks': 'أداء جيد'}
                )

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
        self.stdout.write(f'  Madrasah: {madrasah.name}')
        self.stdout.write(f'  Admin: admin@madrasah.com / admin123')
        self.stdout.write(f'  Teacher: teacher@madrasah.com / teacher123')
        self.stdout.write(f'  Students: student1-5@madrasah.com / student123')
        self.stdout.write(f'  Parent: parent@madrasah.com / parent123')
        self.stdout.write(f'  Board: board@madrasah.com / board123')
