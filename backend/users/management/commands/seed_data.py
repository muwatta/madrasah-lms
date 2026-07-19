from django.core.management.base import BaseCommand
from users.models import User, Madrasah, StudentParent
from curriculum.models import Subject, Topic, Enrollment
from assessments.models import Question, Quiz
from results.models import Exam, ExamResult


class Command(BaseCommand):
    help = 'Seed database with demo data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # Create madrasah
        madrasah, _ = Madrasah.objects.get_or_create(
            name='Demo Madrasah',
            defaults={'city': 'Lagos', 'email': 'demo@madrasah.com', 'address': '123 Islam Lane, Lagos'}
        )

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
            ('Abdullah', 'Ibrahim'), ('Fatima', 'Ali'), ('Omar', 'Hassan'),
            ('Aisha', 'Mohammed'), ('Yusuf', 'Bello'),
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
                'first_name': 'Ibrahim',
                'last_name': 'Oladipupo',
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
                'first_name': 'Sheikh',
                'last_name': 'Abdullah',
                'role': 'idaarah',
                'madrasah': madrasah,
            }
        )
        board.set_password('board123')
        board.save()

        # Create subjects
        subjects = []
        for name, desc, level in [
            ('Quran', 'Quran memorization and recitation', 'beginner'),
            ('Tajweed', 'Rules of Quran recitation', 'intermediate'),
            ('Fiqh', 'Islamic jurisprudence', 'intermediate'),
            ('Arabic', 'Arabic language studies', 'beginner'),
            ('Aqidah', 'Islamic creed and belief', 'beginner'),
        ]:
            subj, _ = Subject.objects.get_or_create(
                madrasah=madrasah,
                name=name,
                defaults={'description': desc, 'level': level}
            )
            subjects.append(subj)

        # Create topics
        topics_data = {
            'Quran': ['Surah Al-Fatiha', 'Surah Al-Baqarah (Part 1)', 'Surah Ya-Seen'],
            'Tajweed': ['Noon Sakinah Rules', 'Makhaarij', 'Waajibaat'],
            'Fiqh': ['Wudu', 'Salah', 'Zakat'],
            'Arabic': ['Alphabet', 'Basic Grammar', 'Common Phrases'],
            'Aqidah': ['Tawheed', 'Prophethood', 'Day of Judgment'],
        }
        topics = {}
        for subj in subjects:
            topics[subj.name] = []
            for tname in topics_data.get(subj.name, []):
                topic, _ = Topic.objects.get_or_create(
                    subject=subj,
                    name=tname,
                )
                topics[subj.name].append(topic)

        # Enroll students in subjects
        for student in students:
            for subj in subjects:
                Enrollment.objects.get_or_create(
                    madrasah=madrasah,
                    student=student,
                    subject=subj,
                    defaults={'ustaadh': teacher}
                )

        # Create questions
        q_list = []
        for subj in subjects[:2]:
            for topic in topics[subj.name][:2]:
                for q_data in [
                    {
                        'question_text': 'What is the first Surah in the Quran?',
                        'question_type': 'mcq',
                        'options': ['Al-Fatiha', 'Al-Baqarah', 'Al-Imran', 'An-Nisa'],
                        'correct_answer': 'Al-Fatiha',
                        'explanation': 'Surah Al-Fatiha is the opening chapter of the Quran.',
                        'difficulty': 'easy',
                    },
                    {
                        'question_text': 'How many Surahs are in the Quran?',
                        'question_type': 'fill_blank',
                        'correct_answer': '114',
                        'explanation': 'The Quran contains 114 Surahs.',
                        'difficulty': 'medium',
                    },
                    {
                        'question_text': 'What does Tawheed mean?',
                        'question_type': 'short_answer',
                        'correct_answer': 'Monotheism belief in the oneness of Allah',
                        'explanation': 'Tawheed is the central concept of Islam - the oneness of God.',
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
                subject=subjects[0],
                created_by=teacher,
                title='Quran Basics Quiz',
                defaults={
                    'description': 'Test your knowledge of Quran basics',
                    'question_ids': [q.id for q in q_list[:3]],
                    'quiz_type': 'practice',
                    'time_limit_minutes': 15,
                    'passing_score': 60,
                    'is_published': True,
                }
            )

            quiz2, _ = Quiz.objects.get_or_create(
                madrasah=madrasah,
                subject=subjects[1],
                created_by=teacher,
                title='Tajweed Rules Quiz',
                defaults={
                    'description': 'Test your understanding of Tajweed rules',
                    'question_ids': [q.id for q in q_list[3:6]],
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
                subject=subjects[0],
                created_by=teacher,
                title='Quran Mid-Term Exam',
                defaults={
                    'exam_date': date(2026, 8, 15),
                    'description': 'Mid-term examination for Quran class',
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
                    defaults={'score': score, 'grade': grade, 'remarks': 'Good performance'}
                )

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
        self.stdout.write(f'  Madrasah: {madrasah.name}')
        self.stdout.write(f'  Admin: admin@madrasah.com / admin123')
        self.stdout.write(f'  Teacher: teacher@madrasah.com / teacher123')
        self.stdout.write(f'  Students: student1-5@madrasah.com / student123')
        self.stdout.write(f'  Parent: parent@madrasah.com / parent123')
        self.stdout.write(f'  Board: board@madrasah.com / board123')
