from django.core.management.base import BaseCommand
from users.models import User, Madrasah, StudentParent
from curriculum.models import Subject, Topic, Enrollment, SchoolClass, ClassSubject
from assessments.models import Question, Quiz
from results.models import Exam, ExamResult
from decimal import Decimal
from school_ops.models import FeeStructure, Fee, FeePayment, Attendance, Announcement


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
    'العلوم': ['المخلوقات الحية', 'الطقس', 'الجسم الإنساني'],
    'اللغة الإنجليزية': ['الإنجليزية الأساسية', 'Grammar Basics', 'Common Phrases'],
}

# Subject assignments by school level (Arabic names matching SUBJECTS list)
# Primary (1-6): core Islamic + basic academic
# JSS (1-3):     Islamic + language arts + sciences
# SSS (1-3):     Islamic + advanced sciences + arts
PRIMARY_SUBJECTS = [
    'القرآن الكريم', 'التجويد', 'التفسير', 'الحديث', 'العقيدة',
    'الفقه', 'السيرة النبوية', 'الأخلاق الإسلامية',
    'اللغة العربية', 'الإملاء', 'الإنشاء', 'الخط العربي', 'المطالعة',
    'اللغة الإنجليزية', 'الرياضيات', 'العلوم',
    'ال التربية الوطنية', 'التربية البدنية',
]
JSS_SUBJECTS = [
    'القرآن الكريم', 'التجويد', 'التفسير', 'الحديث', 'العقيدة',
    'الفقه', 'أصول الفقه', 'السيرة النبوية', 'الأخلاق الإسلامية',
    'اللغة العربية', 'النحو', 'الأدب العربي', 'الإملاء', 'الإنشاء',
    'اللغة الإنجليزية', 'الرياضيات', 'العلوم',
    'الدراسات الاجتماعية', 'التاريخ', 'الجغرافيا',
    'التربية الوطنية', 'الحاسوب', 'التربية البدنية',
]
SSS_SUBJECTS = [
    'القرآن الكريم', 'التفسير', 'الحديث', 'العقيدة',
    'الفقه', 'أصول الفقه', 'السيرة النبوية',
    'اللغة العربية', 'النحو', 'الصرف', 'البلاغة', 'الأدب العربي',
    'اللغة الإنجليزية', 'الرياضيات',
    'الفيزياء', 'الكيمياء', 'الأحياء',
    'الدراسات الاجتماعية', 'التاريخ', 'الجغرافيا',
    'التربية الوطنية', 'الحاسوب', 'التربية البدنية',
]


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

        # Create teachers 
        teachers_data = [
            ('teacher@madrasah.com', 'أحمد', 'محمد', 'Quran & Tajweed teacher'),
            ('teacher2@madrasah.com', 'يوسف', 'صالح', 'Tafsir & Hadith teacher'),
            ('teacher3@madrasah.com', 'خالد', 'عمر', 'Aqeedah & Fiqh teacher'),
        ]
        teachers = []
        for email, fname, lname, _ in teachers_data:
            t, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': fname,
                    'last_name': lname,
                    'role': 'ustaadh',
                    'madrasah': madrasah,
                }
            )
            t.set_password('teacher123')
            t.save()
            teachers.append(t)

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

        # Create ClassSubject records linking subjects to classes by level
        subjects_by_name = {s.name_ar: s for s in subjects}
        level_subjects = {
            1: PRIMARY_SUBJECTS, 2: PRIMARY_SUBJECTS, 3: PRIMARY_SUBJECTS,
            4: PRIMARY_SUBJECTS, 5: PRIMARY_SUBJECTS, 6: PRIMARY_SUBJECTS,
            7: JSS_SUBJECTS, 8: JSS_SUBJECTS, 9: JSS_SUBJECTS,
            10: SSS_SUBJECTS, 11: SSS_SUBJECTS, 12: SSS_SUBJECTS,
        }
        cs_count = 0
        for school_class in classes:
            for subj_name in level_subjects.get(school_class.order, PRIMARY_SUBJECTS):
                subj = subjects_by_name.get(subj_name)
                if subj:
                    _, created = ClassSubject.objects.get_or_create(
                        madrasah=madrasah,
                        school_class=school_class,
                        subject=subj,
                    )
                    if created:
                        cs_count += 1

        # Enroll first 5 subjects for all students with different teachers per subject
        teacher_assignments = [teachers[0], teachers[1], teachers[0], teachers[1], teachers[2]]
        for student in students:
            for i, subj in enumerate(subjects[:5]):
                Enrollment.objects.get_or_create(
                    madrasah=madrasah,
                    student=student,
                    subject=subj,
                    defaults={
                        'ustaadh': teacher_assignments[i],
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
                    created_by=teachers[0],
                    question_text=q_data['question_text'],
                    defaults=q_data
                )
                q_list.append(q)

        # Create quizzes
        if q_list:
            quiz1, _ = Quiz.objects.get_or_create(
                madrasah=madrasah,
                subject=first_subj,
                created_by=teachers[0],
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
                    created_by=teachers[0],
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
                created_by=teachers[0],
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
                grade = 'A' if score >= 80 else 'B' if score >= 70 else 'C' if score >= 60 else 'D'
                ExamResult.objects.get_or_create(
                    exam=exam,
                    student=student,
                    defaults={'score': score, 'grade': grade, 'remarks': 'أداء جيد'}
                )

        # --- School Ops seed data ---
        import random
        from datetime import date, timedelta

        # Fee Structures
        fee_structures = []
        for fs_name, fs_name_ar, fs_amount, fs_desc in [
            ('Tuition Fees', 'رسوم الدراسة', 500, 'Annual tuition fee'),
            ('Books & Materials', 'الكتب والمواد', 150, 'Textbooks and learning materials'),
            ('Activities', 'الأنشطة', 200, ' extracurricular activities fee'),
        ]:
            fs, _ = FeeStructure.objects.get_or_create(
                madrasah=madrasah,
                name=fs_name,
                defaults={'name_ar': fs_name_ar, 'amount': fs_amount, 'description': fs_desc}
            )
            fee_structures.append(fs)

        # Fees per student
        today = date.today()
        fee_statuses = ['paid', 'paid', 'overdue', 'pending', 'partial']
        for i, student in enumerate(students):
            due = today + timedelta(days=random.randint(-10, 30))
            status = fee_statuses[i % len(fee_statuses)]
            amount_paid = Decimal('500') if status == 'paid' else Decimal('250') if status == 'partial' else Decimal('0')
            fee, _ = Fee.objects.get_or_create(
                madrasah=madrasah,
                student=student,
                fee_structure=fee_structures[0],
                defaults={
                    'amount': Decimal('500'),
                    'amount_paid': amount_paid,
                    'due_date': due,
                    'description': 'Tuition fee for current term',
                    'status': status,
                }
            )

        # Fee Payments (on the first paid fee)
        first_fee = Fee.objects.filter(madrasah=madrasah, status='paid').first()
        if first_fee:
            FeePayment.objects.get_or_create(
                fee=first_fee,
                amount_paid=Decimal('500'),
                defaults={'payment_method': 'cash', 'recorded_by': admin}
            )
            FeePayment.objects.get_or_create(
                fee=first_fee,
                amount_paid=Decimal('250'),
                defaults={'payment_method': 'mobile_money', 'recorded_by': admin}
            )

        # Attendance (5 days per student over past week)
        statuses = ['present', 'present', 'present', 'absent', 'late']
        for student in students:
            for days_ago in range(7, 0, -1):
                att_date = today - timedelta(days=days_ago)
                # skip weekends (Fri=4, Sat=5)
                if att_date.weekday() in (4, 5):
                    continue
                att_status = random.choice(statuses)
                Attendance.objects.get_or_create(
                    madrasah=madrasah,
                    student=student,
                    date=att_date,
                    defaults={'status': att_status, 'marked_by': teachers[0]}
                )

        # Announcements
        Announcement.objects.get_or_create(
            madrasah=madrasah,
            title='New Academic Year Begins',
            defaults={
                'title_ar': 'بداية العام الدراسي الجديد',
                'message': 'Welcome back! The new academic year starts on September 1st. Please ensure all fees are paid.',
                'audience': 'all',
                'is_pinned': True,
                'created_by': admin,
            }
        )
        Announcement.objects.get_or_create(
            madrasah=madrasah,
            title='Parent-Teacher Meeting',
            defaults={
                'title_ar': 'اجتماع أولياء الأمور والمعلمين',
                'message': 'A parent-teacher meeting is scheduled for next Friday. All parents are expected to attend.',
                'audience': 'parents',
                'is_pinned': False,
                'created_by': admin,
            }
        )
        Announcement.objects.get_or_create(
            madrasah=madrasah,
            title='Staff Training Workshop',
            defaults={
                'title_ar': 'ورشة عمل للموظفين',
                'message': 'Mandatory training workshop on new curriculum guidelines this Saturday at 10 AM.',
                'audience': 'teachers',
                'is_pinned': False,
                'created_by': admin,
            }
        )

        # --- Fasaaha (Arabic speaking practice) seed data ---
        from fasaaha.models import SpeakingLevel, MissionCategory, Mission as FasaahaMission

        levels = {}
        for number, name, name_ar, desc, vocab, diff in [
            (1, 'Greetings & Basics', 'التحيات والأساسيات', 'Introduce yourself, greet others, and use everyday basics.', 50, 1),
            (2, 'Everyday Conversations', 'المحادثات اليومية', 'Handle daily situations: school, food, shopping, routines.', 100, 2),
            (3, 'Confident Speaking', 'التحدث بثقة', 'Speak at length about topics, tell stories, and role-play.', 150, 3),
        ]:
            level, _ = SpeakingLevel.objects.get_or_create(
                madrasah=madrasah,
                number=number,
                defaults={
                    'name': name,
                    'name_ar': name_ar,
                    'description': desc,
                    'target_vocabulary_count': vocab,
                    'difficulty': diff,
                    'sort_order': number,
                },
            )
            levels[number] = level

        categories = {}
        for name, name_ar, icon in [
            ('Greetings', 'التحيات', '👋'),
            ('Self-Introduction', 'التعريف بالنفس', '🙋'),
            ('Family', 'العائلة', '👨‍👩‍👧‍👦'),
            ('School', 'المدرسة', '🏫'),
            ('Food & Dining', 'الطعام', '🍽️'),
            ('Daily Life', 'الحياة اليومية', '☀️'),
        ]:
            cat, _ = MissionCategory.objects.get_or_create(
                madrasah=madrasah,
                name=name,
                defaults={'name_ar': name_ar, 'icon': icon},
            )
            categories[name] = cat

        # (level_number, category, title, title_ar, prompt_ar, transliteration, translation,
        #  expected_phrases, hints, difficulty, mission_type, max_time_seconds)
        mission_data = [
            (1, 'Greetings', 'Morning Greetings', 'تحيات الصباح',
             'صباح الخير! كيف حالك اليوم؟',
             'Sabah al-khair! Kayfa haluka al-yawm?',
             'Good morning! How are you today?',
             ['صباح الخير', 'كيف حالك', 'أنا بخير', 'الحمد لله', 'شكراً'],
             ['Start with صباح الخير', 'Answer with أنا بخير', 'Add الحمد لله'], 1, 'repeat_after_me', 45),
            (1, 'Greetings', 'Saying Goodbye', 'الوداع',
             'مع السلامة، أراك غداً إن شاء الله!',
             'Ma\'a as-salamah, araka ghadan in sha Allah!',
             'Goodbye, see you tomorrow God willing!',
             ['مع السلامة', 'إلى اللقاء', 'أراك غداً', 'تصبح على خير'],
             ['Say مع السلامة when leaving', 'Add أراك غداً for tomorrow'], 1, 'pronunciation', 45),
            (1, 'Self-Introduction', 'Introduce Yourself', 'التعريف بالنفس',
             'اسمي عبد الله، وأنا طالب في الصف الأول. أنا من نيجيريا.',
             'Ismi Abdullah, wa ana talib fi as-saff al-awwal. Ana min Nijiria.',
             'My name is Abdullah, and I am a student in primary one. I am from Nigeria.',
             ['اسمي', 'أنا طالب', 'أنا من', 'عمري', 'أنا سعيد'],
             ['Say your name with اسمي', 'Add your role أنا طالب', 'Mention your country أنا من'], 1, 'pronunciation', 60),
            (1, 'Family', 'My Family', 'عائلتي',
             'عندي أب وأم وأخ. أخي اسمه عمر.',
             '\'Indi ab wa umm wa akh. Akhi ismuhu Umar.',
             'I have a father, a mother, and a brother. My brother\'s name is Umar.',
             ['عندي أب', 'عندي أم', 'عندي أخ', 'اسمه', 'هي أمي'],
             ['Start with عندي', 'Introduce each member', 'Use اسمه for names'], 1, 'pronunciation', 60),
            (1, 'School', 'My School', 'مدرستي',
             'أدرس في المدرسة. المعلم لطيف. أحب القراءة.',
             'Adrusu fi al-madrasah. Al-mu\'allim latif. Uhibbu al-qira\'ah.',
             'I study at school. The teacher is kind. I love reading.',
             ['أدرس في', 'المدرسة', 'المعلم', 'أحب', 'القراءة'],
             ['Say أدرس في المدرسة', 'Describe the teacher', 'Say what you love with أحب'], 1, 'pronunciation', 60),

            (2, 'School', 'A Day at School', 'يوم في المدرسة',
             'كل يوم أذهب إلى المدرسة مبكراً. أدرس القرآن واللغة العربية. بعد الدرس ألعب مع أصدقائي.',
             'Kulla yawm adhhab ila al-madrasah mubakkiran. Adrusu al-Quran wa al-lughah al-\'arabiyyah. Ba\'da ad-dars al\'ab ma\'a asdiqa\'i.',
             'Every day I go to school early. I study Quran and Arabic. After class I play with my friends.',
             ['أذهب إلى المدرسة', 'مبكراً', 'أدرس', 'بعد الدرس', 'ألعب مع أصدقائي'],
             ['Start with كُل يوم أذهب', 'Mention what you study', 'End with what you do after class'], 2, 'free_speaking', 90),
            (2, 'Food & Dining', 'Ordering Food', 'طلب الطعام',
             'أريد أن أطلب الطعام. عندكم حساء العدس؟ أريد خبزاً وماء من فضلك.',
             'Uridu an atluba at-ta\'am. \'Indakum hasa\' al-\'adas? Uridu khubzan wa ma\'an min fadlik.',
             'I want to order food. Do you have lentil soup? I would like bread and water please.',
             ['أريد أن أطلب', 'عندكم', 'من فضلك', 'خبز', 'ماء'],
             ['Ask politely with من فضلك', 'Use عندكم to ask if available', 'Request items with أريد'], 2, 'role_play', 90),
            (2, 'Daily Life', 'My Daily Routine', 'روتيني اليومي',
             'أستيقظ في الساعة السادسة صباحاً. أصلي الفجر ثم أتناول الفطور. بعدها أذهب إلى المدرسة.',
             'Astayqiz fi as-sa\'ah as-sadisah sabahan. Usalli al-fajr thumma atanawal al-futur. Ba\'daha adhhab ila al-madrasah.',
             'I wake up at six in the morning. I pray Fajr, then eat breakfast. After that I go to school.',
             ['أستيقظ في الساعة', 'صباحاً', 'أصلي الفجر', 'أتناول الفطور', 'أذهب إلى المدرسة'],
             ['Give the time you wake up', 'Mention prayer أولاً', 'Use بعدها to sequence'], 2, 'storytelling', 90),
            (2, 'Daily Life', 'Shopping Trip', 'رحلة التسوق',
             'أذهب إلى السوق مع أمي. نشتري التفاح واللبن. السوق مزدحم اليوم.',
             'Adhhab ila as-suq ma\'a ummi. Nashtari at-tuffah wa al-laban. As-suq muzdahim al-yawm.',
             'I go to the market with my mother. We buy apples and milk. The market is crowded today.',
             ['أذهب إلى السوق', 'نشتري', 'التفاح', 'اللبن', 'مزدحم'],
             ['Start with أذهب إلى السوق', 'Use نشتري for what you buy', 'Describe the market'], 2, 'conversation', 90),
            (2, 'Family', 'Talking About My Family', 'الحديث عن عائلتي',
             'عندي عائلة كبيرة. أبي طبيب وأمي معلمة. أختي الكبرى تدرس في الجامعة.',
             '\'Indi \'a\'ilah kabirah. Abi tabib wa ummi mu\'allimah. Ukhti al-kubra tadrusu fi al-jami\'ah.',
             'I have a big family. My father is a doctor and my mother is a teacher. My older sister studies at university.',
             ['عائلة كبيرة', 'أبي طبيب', 'أمي معلمة', 'أختي', 'الجامعة'],
             ['Say عندي عائلة كبيرة', 'Give each member\'s job', 'Add a detail about one member'], 2, 'free_speaking', 90),

            (3, 'Daily Life', 'Describe Your Day', 'صف يومك',
             'صف يومك كاملاً من الاستيقاظ حتى النوم. تكلّم عن دروسك وطعامك وأصدقائك.',
             'Sif yawmaka kamilan min al-istiqadh hatta an-nawm. Takallam \'an durusika wa ta\'amika wa asdiqa\'ika.',
             'Describe your full day from waking until sleep. Talk about your lessons, food, and friends.',
             ['من الاستيقاظ حتى النوم', 'درسي المفضل', 'مع أصدقائي', 'بعد المدرسة', 'قبل النوم'],
             ['Tell the time order', 'Include one lesson detail', 'Mention food and friends'], 3, 'storytelling', 120),
            (3, 'Food & Dining', 'Restaurant Conversation', 'محادثة في المطعم',
             'أهلاً، أريد طاولة لشخصين. ماذا تنصحون من أكلات اليوم؟ أريد طبق السمك بالخضار.',
             'Ahlan, uridu tawilatan lishakhsayn. Matha tansuhun min akalat al-yawm? Uridu tabaq as-samak bil-khudar.',
             'Hello, I want a table for two. What do you recommend from today\'s dishes? I would like the fish and vegetables plate.',
             ['طاولة لشخصين', 'ماذا تنصحون', 'طبق', 'السمك', 'الحساب من فضلك'],
             ['Greet and ask for a table', 'Ask for a recommendation', 'Order a dish and ask for the bill'], 3, 'conversation', 120),
            (3, 'School', 'My Favorite Subject', 'مادتي المفضلة',
             'مادتي المفضلة هي اللغة العربية لأنها لغة القرآن. أتعلم فيها النحو والقراءة. أريد أن أصبح معلماً للغة العربية.',
             'Maddati al-mufaddalah hiya al-lughah al-\'arabiyyah li\'annaha lughat al-Quran. Ata\'allamu fiha an-nahw wa al-qira\'ah. Uridu an usbiha mu\'alliman lil-lughah al-\'arabiyyah.',
             'My favorite subject is Arabic because it is the language of the Quran. In it I learn grammar and reading. I want to become an Arabic teacher.',
             ['مادتي المفضلة', 'لغة القرآن', 'النحو', 'أريد أن أصبح', 'لأنها'],
             ['Say the subject first', 'Give a reason with لأنها', 'State your future goal'], 3, 'free_speaking', 120),
            (3, 'Daily Life', 'Role Play: Visiting a Friend', 'زيارة صديق',
             'أنت تزور صديقك في بيته. سلّم عليه واسأله عن أسرته وأخبره عن مدرستك. اشكره قبل أن تغادر.',
             'Anta tazuru sadiqaka fi baytihi. Sallim \'alayhi wa as\'alhu \'an usratihi wa akhbirhu \'an madrasatika. Ushkurhu qabla an tughadir.',
             'You are visiting your friend at his home. Greet him, ask about his family, tell him about your school, and thank him before leaving.',
             ['السلام عليكم', 'كيف أسرتك', 'مدرستي جميلة', 'أهلاً بك', 'شكراً لك'],
             ['Open with السلام عليكم', 'Ask كيف أسرتك', 'Describe your school', 'Close with شكراً لك'], 3, 'role_play', 120),
        ]

        fasaaha_count = 0
        for number, cat_name, title, title_ar, prompt_ar, translit, translation, phrases, hints, diff, mtype, max_time in mission_data:
            mission, created = FasaahaMission.objects.get_or_create(
                madrasah=madrasah,
                title=title,
                defaults={
                    'level': levels[number],
                    'category': categories.get(cat_name),
                    'title_ar': title_ar,
                    'prompt_ar': prompt_ar,
                    'prompt_transliteration': translit,
                    'prompt_translation': translation,
                    'expected_phrases': phrases,
                    'hints': hints,
                    'difficulty': diff,
                    'mission_type': mtype,
                    'max_time_seconds': max_time,
                    'is_active': True,
                    'created_by': admin,
                },
            )
            if created:
                fasaaha_count += 1

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
        self.stdout.write(f'  Madrasah: {madrasah.name}')
        self.stdout.write(f'  Admin: admin@madrasah.com / admin123')
        self.stdout.write(f'  Teachers: teacher@madrasah.com, teacher2@madrasah.com, teacher3@madrasah.com / teacher123')
        self.stdout.write(f'  Students: student1@madrasah.com / student123')
        self.stdout.write(f'  Parent: parent@madrasah.com / parent123')
        self.stdout.write(f'  Board: board@madrasah.com / board123')
