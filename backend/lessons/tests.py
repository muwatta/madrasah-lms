import json
from datetime import timedelta, date
from decimal import Decimal

from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.utils.timezone import now

from rest_framework.test import APIClient

from users.models import Madrasah
from curriculum.models import Subject, SchoolClass, Enrollment
from academic.models import Term, Session
from .models import (
    SchemeOfWork, SchemeWeek, LessonPlan, LessonResource,
    LessonDelivery, LessonReflection, LessonAuditLog,
    Homework, HomeworkSubmission, LessonAnalyticsSnapshot,
)
from .services import (
    SchemeOfWorkService, LessonPlanService, HomeworkService,
    AnalyticsService, AuditService,
)
from .selectors import (
    get_lesson_plans, get_pending_approvals,
    get_teacher_subjects, get_teacher_classes,
)
from .permissions import (
    CanManageLessonPlans, CanApproveLessonPlans, CanManageHomework,
    CanGradeHomework, CanSubmitHomework, CanManageSchemes,
)

User = get_user_model()


class BaseLessonTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.factory = RequestFactory()

        self.madrasah = Madrasah.objects.create(name='Test Madrasah')
        self.session = Session.objects.create(
            name='2025-2026', madrasah=self.madrasah,
            start_date=date(2025, 9, 1), end_date=date(2026, 7, 31))
        self.term = Term.objects.create(
            name='Term 1', term_number=1, madrasah=self.madrasah,
            session=self.session,
            start_date=date(2025, 9, 1), end_date=date(2025, 12, 31))

        self.mudeer = User.objects.create_user(
            email='mudeer@test.com', password='pass123',
            first_name='Mudeer', last_name='User',
            role='mudeer', madrasah=self.madrasah)
        self.ustaadh = User.objects.create_user(
            email='ustaadh@test.com', password='pass123',
            first_name='Ustaadh', last_name='User',
            role='ustaadh', madrasah=self.madrasah)
        self.student = User.objects.create_user(
            email='student@test.com', password='pass123',
            first_name='Student', last_name='User',
            role='student', madrasah=self.madrasah)

        self.subject = Subject.objects.create(
            name_ar='القرآن الكريم', name_en='Quran', madrasah=self.madrasah)
        self.school_class = SchoolClass.objects.create(
            name_ar='الصف الأول', name_en='Grade 1',
            madrasah=self.madrasah, order=1)

        self.enrollment = Enrollment.objects.create(
            ustaadh=self.ustaadh, student=self.student,
            subject=self.subject, school_class=self.school_class,
            madrasah=self.madrasah,
        )

        self.scheme = SchemeOfWork.objects.create(
            madrasah=self.madrasah, teacher=self.ustaadh,
            term=self.term, subject=self.subject,
            school_class=self.school_class,
            title='Quran Memorisation – Term 1',
        )

        self.lesson = LessonPlan.objects.create(
            madrasah=self.madrasah, teacher=self.ustaadh,
            subject=self.subject, school_class=self.school_class,
            title='First Juz Review',
            lesson_date=now().date() + timedelta(days=1),
            duration_minutes=45,
            learning_objectives=['Read surah al-fatiha', 'Memorise first 5 ayat'],
            teaching_methods=['recitation', 'group_work'],
        )

        self.homework = Homework.objects.create(
            madrasah=self.madrasah, teacher=self.ustaadh,
            subject=self.subject, school_class=self.school_class,
            title='Read Surah Al-Baqarah',
            description='Read first 20 ayat',
            due_date=now() + timedelta(days=7),
            is_published=True,
        )


class SchemeOfWorkServiceTest(BaseLessonTestCase):
    def test_create_scheme(self):
        # Delete setUp scheme to test creation from scratch
        self.scheme.delete()
        scheme = SchemeOfWorkService.create_scheme(
            madrasah=self.madrasah, teacher=self.ustaadh,
            term=self.term, subject=self.subject,
            school_class=self.school_class,
            title='Tajweed – Term 1',
        )
        self.assertEqual(scheme.title, 'Tajweed – Term 1')
        self.assertEqual(scheme.teacher, self.ustaadh)

    def test_create_duplicate_scheme_raises(self):
        # setUp already creates one scheme — trying same combo should raise
        with self.assertRaises(ValueError):
            SchemeOfWorkService.create_scheme(
                madrasah=self.madrasah, teacher=self.ustaadh,
                term=self.term, subject=self.subject,
                school_class=self.school_class,
                title='Duplicate',
            )

    def test_add_week(self):
        week = SchemeOfWorkService.add_week(
            scheme=self.scheme, week_number=1, topic='Al-Fatiha')
        self.assertEqual(week.week_number, 1)
        self.assertEqual(week.topic, 'Al-Fatiha')

    def test_add_duplicate_week_raises(self):
        SchemeOfWorkService.add_week(
            scheme=self.scheme, week_number=1, topic='Al-Fatiha')
        with self.assertRaises(ValueError):
            SchemeOfWorkService.add_week(
                scheme=self.scheme, week_number=1, topic='Duplicate')

    def test_update_week_status(self):
        week = SchemeWeek.objects.create(
            scheme=self.scheme, week_number=1, topic='Test')
        updated = SchemeOfWorkService.update_week_status(
            week=week, status='in_progress')
        self.assertEqual(updated.status, 'in_progress')

    def test_update_week_invalid_status_raises(self):
        week = SchemeWeek.objects.create(
            scheme=self.scheme, week_number=1, topic='Test')
        with self.assertRaises(ValueError):
            SchemeOfWorkService.update_week_status(week=week, status='invalid')


class LessonPlanServiceTest(BaseLessonTestCase):
    def test_create_plan(self):
        plan = LessonPlanService.create_plan(
            madrasah=self.madrasah, teacher=self.ustaadh,
            subject=self.subject, school_class=self.school_class,
            title='New Lesson', lesson_date=now().date(),
        )
        self.assertEqual(plan.status, 'draft')
        self.assertFalse(plan.ai_generated)

    def test_update_plan(self):
        plan = LessonPlanService.update_plan(
            plan=self.lesson, actor=self.ustaadh,
            title='Updated Lesson Title')
        self.assertEqual(plan.title, 'Updated Lesson Title')

    def test_transition_draft_to_submitted(self):
        plan = LessonPlanService.transition_status(
            plan=self.lesson, target_status='submitted',
            actor=self.ustaadh)
        self.assertEqual(plan.status, 'submitted')
        self.assertIsNotNone(plan.submitted_at)

    def test_transition_invalid_raises(self):
        with self.assertRaises(ValueError):
            LessonPlanService.transition_status(
                plan=self.lesson, target_status='completed',
                actor=self.ustaadh)

    def test_transition_to_approved(self):
        self.lesson.status = 'submitted'
        self.lesson.save()
        plan = LessonPlanService.transition_status(
            plan=self.lesson, target_status='approved',
            actor=self.mudeer, reason='Looks good')
        self.assertEqual(plan.status, 'approved')
        self.assertEqual(plan.approved_by, self.mudeer)
        self.assertEqual(plan.approval_notes, 'Looks good')

    def test_add_resource(self):
        resource = LessonPlanService.add_resource(
            lesson=self.lesson, resource_type='pdf',
            title='Textbook Pages', url='https://example.com')
        self.assertEqual(resource.lesson, self.lesson)
        self.assertEqual(resource.resource_type, 'pdf')

    def test_record_delivery(self):
        delivery = LessonPlanService.record_delivery(
            lesson=self.lesson, delivered_by=self.ustaadh,
            delivery_date=now().date(),
            delivery_status='completed',
            students_present=25, students_absent=5, total_students=30)
        self.assertEqual(delivery.students_present, 25)
        self.assertEqual(delivery.lesson, self.lesson)

    def test_add_reflection(self):
        reflection = LessonPlanService.add_reflection(
            lesson=self.lesson, teacher=self.ustaadh,
            what_went_well='Students were engaged',
            self_rating=4)
        self.assertEqual(reflection.self_rating, 4)
        self.assertEqual(reflection.lesson, self.lesson)


class HomeworkServiceTest(BaseLessonTestCase):
    def test_create_homework(self):
        hw = HomeworkService.create_homework(
            madrasah=self.madrasah, teacher=self.ustaadh,
            subject=self.subject, school_class=self.school_class,
            title='New HW', description='Do this',
            due_date=now() + timedelta(days=3))
        self.assertEqual(hw.title, 'New HW')
        self.assertFalse(hw.is_published)

    def test_submit_homework(self):
        sub = HomeworkService.submit_homework(
            homework=self.homework, student=self.student,
            madrasah=self.madrasah, content='My answers')
        self.assertEqual(sub.content, 'My answers')
        self.assertEqual(sub.student, self.student)

    def test_grade_submission(self):
        sub = HomeworkService.submit_homework(
            homework=self.homework, student=self.student,
            madrasah=self.madrasah, content='My answers')
        graded = HomeworkService.grade_submission(
            submission=sub, score=85, feedback='Good work',
            graded_by=self.ustaadh)
        self.assertEqual(graded.score, 85)
        self.assertEqual(graded.status, 'graded')
        self.assertEqual(graded.graded_by, self.ustaadh)


class AuditServiceTest(BaseLessonTestCase):
    def test_log_creates_entry(self):
        AuditService.log(
            actor=self.ustaadh, action='created',
            model_name='lessonplan', object_id=self.lesson.pk)
        self.assertEqual(LessonAuditLog.objects.count(), 1)

    def test_log_invalid_action_raises(self):
        with self.assertRaises(ValueError):
            AuditService.log(
                actor=self.ustaadh, action='invalid',
                model_name='lessonplan', object_id=self.lesson.pk)


class SelectorTest(BaseLessonTestCase):
    def test_get_lesson_plans(self):
        plans = get_lesson_plans(madrasah=self.madrasah)
        self.assertEqual(plans.count(), 1)

    def test_get_lesson_plans_ustaadh_sees_own(self):
        plans = get_lesson_plans(madrasah=self.madrasah, teacher=self.ustaadh)
        self.assertEqual(plans.count(), 1)

    def test_get_pending_approvals(self):
        self.lesson.status = 'submitted'
        self.lesson.save()
        pending = get_pending_approvals(madrasah=self.madrasah)
        self.assertEqual(pending.count(), 1)

    def test_get_teacher_subjects(self):
        subjects = get_teacher_subjects(teacher=self.ustaadh)
        self.assertTrue(subjects.exists())

    def test_get_teacher_classes(self):
        classes = get_teacher_classes(teacher=self.ustaadh)
        self.assertTrue(classes.exists())


class PermissionTest(BaseLessonTestCase):
    def test_can_manage_lesson_plans_ustaadh(self):
        perm = CanManageLessonPlans()
        request = self.factory.get('/')
        request.user = self.ustaadh
        self.assertTrue(perm.has_permission(request, None))

    def test_can_manage_lesson_plans_mudeer(self):
        perm = CanManageLessonPlans()
        request = self.factory.get('/')
        request.user = self.mudeer
        self.assertTrue(perm.has_permission(request, None))

    def test_can_manage_lesson_plans_student_forbidden(self):
        perm = CanManageLessonPlans()
        request = self.factory.get('/')
        request.user = self.student
        self.assertFalse(perm.has_permission(request, None))

    def test_can_approve_mudeer(self):
        perm = CanApproveLessonPlans()
        request = self.factory.get('/')
        request.user = self.mudeer
        self.assertTrue(perm.has_permission(request, None))

    def test_can_approve_ustaadh_forbidden(self):
        perm = CanApproveLessonPlans()
        request = self.factory.get('/')
        request.user = self.ustaadh
        self.assertFalse(perm.has_permission(request, None))

    def test_can_manage_homework_student_read(self):
        perm = CanManageHomework()
        request = self.factory.get('/')
        request.user = self.student
        self.assertTrue(perm.has_permission(request, None))

    def test_can_submit_homework_student(self):
        perm = CanSubmitHomework()
        request = self.factory.get('/')
        request.user = self.student
        self.assertTrue(perm.has_permission(request, None))

    def test_can_submit_homework_ustaadh_forbidden(self):
        perm = CanSubmitHomework()
        request = self.factory.get('/')
        request.user = self.ustaadh
        self.assertFalse(perm.has_permission(request, None))


class HomeworkModelTest(BaseLessonTestCase):
    def test_str(self):
        self.assertEqual(str(self.homework), 'Read Surah Al-Baqarah')

    def test_is_published(self):
        self.assertTrue(self.homework.is_published)


class LessonPlanModelTest(BaseLessonTestCase):
    def test_str(self):
        self.assertIn('First Juz Review', str(self.lesson))

    def test_is_editable(self):
        self.assertTrue(self.lesson.is_editable)
        self.lesson.status = 'approved'
        self.lesson.save()
        self.assertFalse(self.lesson.is_editable)

    def test_is_published(self):
        self.lesson.status = 'approved'
        self.lesson.save()
        self.assertTrue(self.lesson.is_published)


class HomeworkSubmissionModelTest(BaseLessonTestCase):
    def test_str(self):
        sub = HomeworkSubmission.objects.create(
            homework=self.homework, student=self.student,
            madrasah=self.madrasah, content='Answers')
        self.assertIn('Student', str(sub))


class LessonPlanAPITest(BaseLessonTestCase):
    def test_list_plans(self):
        self.client.force_authenticate(user=self.ustaadh)
        resp = self.client.get('/api/v1/lessons/lesson-plans/')
        self.assertEqual(resp.status_code, 200)

    def test_create_plan(self):
        self.client.force_authenticate(user=self.ustaadh)
        data = {
            'subject': self.subject.pk,
            'school_class': self.school_class.pk,
            'title': 'API Created Lesson',
            'lesson_date': str((now() + timedelta(days=2)).date()),
            'duration_minutes': 30,
            'learning_objectives': ['Objective 1'],
        }
        resp = self.client.post('/api/v1/lessons/lesson-plans/', data, format='json')
        self.assertEqual(resp.status_code, 201)

    def test_submit_plan(self):
        self.client.force_authenticate(user=self.ustaadh)
        resp = self.client.post(f'/api/v1/lessons/lesson-plans/{self.lesson.pk}/submit/')
        self.assertEqual(resp.status_code, 200)

    def test_approve_plan(self):
        self.lesson.status = 'submitted'
        self.lesson.save()
        self.client.force_authenticate(user=self.mudeer)
        resp = self.client.patch(
            f'/api/v1/lessons/lesson-plans/{self.lesson.pk}/approve/',
            {'status': 'approved', 'notes': 'Great'},
            format='json')
        self.assertEqual(resp.status_code, 200)


class HomeworkAPITest(BaseLessonTestCase):
    def test_list_homework(self):
        self.client.force_authenticate(user=self.ustaadh)
        resp = self.client.get('/api/v1/lessons/homework/')
        self.assertEqual(resp.status_code, 200)

    def test_create_homework(self):
        self.client.force_authenticate(user=self.ustaadh)
        data = {
            'subject': self.subject.pk,
            'school_class': self.school_class.pk,
            'title': 'New HW',
            'description': 'Do this',
            'due_date': (now() + timedelta(days=5)).isoformat(),
            'is_published': True,
        }
        resp = self.client.post('/api/v1/lessons/homework/', data, format='json')
        self.assertEqual(resp.status_code, 201)

    def test_submit_homework_student(self):
        self.client.force_authenticate(user=self.student)
        data = {'content': 'My submission'}
        resp = self.client.post(
            f'/api/v1/lessons/homework/{self.homework.pk}/submissions/',
            data, format='json')
        self.assertEqual(resp.status_code, 201)

    def test_pending_grading(self):
        HomeworkSubmission.objects.create(
            homework=self.homework, student=self.student,
            madrasah=self.madrasah, content='Answers')
        self.client.force_authenticate(user=self.ustaadh)
        resp = self.client.get('/api/v1/lessons/homework/submissions/pending/')
        self.assertEqual(resp.status_code, 200)


class AnalyticsTest(BaseLessonTestCase):
    def test_compute_analytics(self):
        snapshot = AnalyticsService.compute_analytics(
            teacher=self.ustaadh, subject=self.subject,
            school_class=self.school_class, term=self.term)
        self.assertIsNotNone(snapshot)
        self.assertEqual(snapshot.total_planned, 1)

    def test_idempotent(self):
        AnalyticsService.compute_analytics(
            teacher=self.ustaadh, subject=self.subject,
            school_class=self.school_class, term=self.term)
        count_before = LessonAnalyticsSnapshot.objects.count()
        AnalyticsService.compute_analytics(
            teacher=self.ustaadh, subject=self.subject,
            school_class=self.school_class, term=self.term)
        count_after = LessonAnalyticsSnapshot.objects.count()
        self.assertEqual(count_before, count_after)
