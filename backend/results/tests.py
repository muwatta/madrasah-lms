from decimal import Decimal

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from users.models import Madrasah, StudentParent
from curriculum.models import Subject, SchoolClass, Enrollment
from academic.models import Session, Term
from .models import (
    GradeScale, GradeScaleBand, AssessmentBlueprint, BlueprintComponent,
    Assessment, AssessmentScore, SubjectResult, TermResult, AnnualResult,
    StudentRank, ResultPublication, ResultApproval, ResultAuditLog,
)
from .services import (
    AuditService, ScoringService, RankingService,
    ApprovalService, TermAggregationService,
)

User = get_user_model()


class BaseResultsTestCase(TestCase):
    """Shared fixtures for all results tests."""

    def setUp(self):
        self.madrasah = Madrasah.objects.create(name='Test Madrasah')

        self.teacher = User.objects.create_user(
            email='teacher@test.com', password='pass123',
            first_name='Ali', last_name='Teacher',
            role='ustaadh', madrasah=self.madrasah,
        )
        self.mudeer = User.objects.create_user(
            email='mudeer@test.com', password='pass123',
            first_name='Mudeer', last_name='Admin',
            role='mudeer', madrasah=self.madrasah,
        )
        self.student1 = User.objects.create_user(
            email='s1@test.com', password='pass123',
            first_name='Ahmed', last_name='Student',
            role='student', madrasah=self.madrasah,
        )
        self.student2 = User.objects.create_user(
            email='s2@test.com', password='pass123',
            first_name='Bilal', last_name='Student',
            role='student', madrasah=self.madrasah,
        )
        self.student3 = User.objects.create_user(
            email='s3@test.com', password='pass123',
            first_name='Yusuf', last_name='Student',
            role='student', madrasah=self.madrasah,
        )
        self.parent = User.objects.create_user(
            email='parent@test.com', password='pass123',
            first_name='Father', last_name='OfStudent',
            role='parent', madrasah=self.madrasah,
        )
        StudentParent.objects.create(
            student=self.student1, parent=self.parent, relationship='father',
        )

        self.subject = Subject.objects.create(
            madrasah=self.madrasah, name_ar='Al-Quran', name_en='Quran',
            code='QUR101',
        )
        self.subject2 = Subject.objects.create(
            madrasah=self.madrasah, name_ar='Al-Hadith', name_en='Hadith',
            code='HAD101',
        )

        self.school_class = SchoolClass.objects.create(
            madrasah=self.madrasah, name_ar='الفصل الأول',
            name_en='Class 1A', order=1,
        )

        for student in [self.student1, self.student2, self.student3]:
            Enrollment.objects.create(
                madrasah=self.madrasah, student=student,
                subject=self.subject, school_class=self.school_class,
                ustaadh=self.teacher,
            )
            Enrollment.objects.create(
                madrasah=self.madrasah, student=student,
                subject=self.subject2, school_class=self.school_class,
                ustaadh=self.teacher,
            )

        self.session = Session.objects.create(
            madrasah=self.madrasah, name='2025-2026',
            start_date='2025-09-01', end_date='2026-06-30',
            is_current=True,
        )
        self.term = Term.objects.create(
            madrasah=self.madrasah, session=self.session,
            name='Term 1', term_number=1,
            start_date='2025-09-01', end_date='2025-12-31',
            is_current=True,
        )

        self.grade_scale = GradeScale.objects.create(
            madrasah=self.madrasah, name='Standard', is_default=True,
        )
        GradeScaleBand.objects.bulk_create([
            GradeScaleBand(grade_scale=self.grade_scale, grade='A',
                           min_score=Decimal('70.00'), max_score=Decimal('100.00'),
                           gpa_points=Decimal('4.0'), remark='Excellent'),
            GradeScaleBand(grade_scale=self.grade_scale, grade='B',
                           min_score=Decimal('60.00'), max_score=Decimal('69.99'),
                           gpa_points=Decimal('3.0'), remark='Very Good'),
            GradeScaleBand(grade_scale=self.grade_scale, grade='C',
                           min_score=Decimal('50.00'), max_score=Decimal('59.99'),
                           gpa_points=Decimal('2.0'), remark='Good'),
            GradeScaleBand(grade_scale=self.grade_scale, grade='D',
                           min_score=Decimal('40.00'), max_score=Decimal('49.99'),
                           gpa_points=Decimal('1.0'), remark='Pass'),
            GradeScaleBand(grade_scale=self.grade_scale, grade='F',
                           min_score=Decimal('0.00'), max_score=Decimal('39.99'),
                           gpa_points=Decimal('0.0'), remark='Fail'),
        ])

        self.blueprint = AssessmentBlueprint.objects.create(
            madrasah=self.madrasah, school_class=self.school_class,
            name='Standard Blueprint', created_by=self.teacher,
        )
        self.bp_quiz = BlueprintComponent.objects.create(
            blueprint=self.blueprint, name='Quiz', component_type='test',
            weight=Decimal('20.00'), max_score=Decimal('20.00'), order=1,
        )
        self.bp_midterm = BlueprintComponent.objects.create(
            blueprint=self.blueprint, name='Midterm', component_type='midterm',
            weight=Decimal('30.00'), max_score=Decimal('50.00'), order=2,
        )
        self.bp_exam = BlueprintComponent.objects.create(
            blueprint=self.blueprint, name='Final Exam', component_type='exam',
            weight=Decimal('50.00'), max_score=Decimal('100.00'), order=3,
        )

        self.quiz_asmt = Assessment.objects.create(
            madrasah=self.madrasah, subject=self.subject, term=self.term,
            school_class=self.school_class, blueprint_component=self.bp_quiz,
            component_type='test', name='Quiz 1', max_score=Decimal('20.00'),
            weight=Decimal('20.00'), order=1, created_by=self.teacher,
        )
        self.midterm_asmt = Assessment.objects.create(
            madrasah=self.madrasah, subject=self.subject, term=self.term,
            school_class=self.school_class, blueprint_component=self.bp_midterm,
            component_type='midterm', name='Midterm', max_score=Decimal('50.00'),
            weight=Decimal('30.00'), order=2, created_by=self.teacher,
        )
        self.exam_asmt = Assessment.objects.create(
            madrasah=self.madrasah, subject=self.subject, term=self.term,
            school_class=self.school_class, blueprint_component=self.bp_exam,
            component_type='exam', name='Final Exam', max_score=Decimal('100.00'),
            weight=Decimal('50.00'), order=3, created_by=self.teacher,
        )


# ──────────────────────────────────────────────────────────────────
#  1. GradeScale Tests
# ──────────────────────────────────────────────────────────────────


class GradeScaleTests(BaseResultsTestCase):

    def test_create_grade_scale(self):
        self.assertEqual(self.grade_scale.name, 'Standard')
        self.assertTrue(self.grade_scale.is_default)
        self.assertEqual(self.grade_scale.madrasah, self.madrasah)

    def test_bands_created(self):
        self.assertEqual(self.grade_scale.bands.count(), 5)

    def test_default_is_unique_per_madrasah(self):
        gs2 = GradeScale.objects.create(
            madrasah=self.madrasah, name='Honours', is_default=True,
        )
        self.grade_scale.refresh_from_db()
        self.assertFalse(self.grade_scale.is_default)
        self.assertTrue(gs2.is_default)

    def test_get_grade_a(self):
        grade, remark = self.grade_scale.get_grade(85.0, max_score=100.0)
        self.assertEqual(grade, 'A')
        self.assertEqual(remark, 'Excellent')

    def test_get_grade_b(self):
        grade, remark = self.grade_scale.get_grade(65.0, max_score=100.0)
        self.assertEqual(grade, 'B')

    def test_get_grade_f(self):
        grade, remark = self.grade_scale.get_grade(20.0, max_score=100.0)
        self.assertEqual(grade, 'F')

    def test_get_grade_out_of_different_max(self):
        grade, remark = self.grade_scale.get_grade(15.0, max_score=20.0)
        self.assertEqual(grade, 'B')

    def test_get_gpa_points(self):
        gpa = self.grade_scale.get_gpa_points(80.0, max_score=100.0)
        self.assertEqual(gpa, 4.0)

    def test_get_gpa_points_f(self):
        gpa = self.grade_scale.get_gpa_points(10.0, max_score=100.0)
        self.assertEqual(gpa, 0.0)

    def test_band_min_max_validation(self):
        band = GradeScaleBand(
            grade_scale=self.grade_scale, grade='X',
            min_score=Decimal('80.00'), max_score=Decimal('50.00'),
            gpa_points=Decimal('3.0'),
        )
        with self.assertRaises(Exception):
            band.clean()


# ──────────────────────────────────────────────────────────────────
#  2. Scoring Tests
# ──────────────────────────────────────────────────────────────────


class ScoringTests(BaseResultsTestCase):

    def test_bulk_save_scores(self):
        scores_data = [
            {'student_id': self.student1.pk, 'score': Decimal('18')},
            {'student_id': self.student2.pk, 'score': Decimal('15')},
        ]
        result = ScoringService.bulk_save_scores(
            self.quiz_asmt, scores_data, self.teacher,
        )
        self.assertEqual(len(result), 2)
        self.assertTrue(
            AssessmentScore.objects.filter(
                assessment=self.quiz_asmt, student=self.student1,
            ).exists()
        )

    def test_bulk_save_scores_validates_max(self):
        scores_data = [
            {'student_id': self.student1.pk, 'score': Decimal('25')},
        ]
        with self.assertRaises(ValueError) as ctx:
            ScoringService.bulk_save_scores(
                self.quiz_asmt, scores_data, self.teacher,
            )
        self.assertIn('exceeds max_score', str(ctx.exception))

    def test_bulk_save_scores_validates_negative(self):
        scores_data = [
            {'student_id': self.student1.pk, 'score': Decimal('-5')},
        ]
        with self.assertRaises(ValueError) as ctx:
            ScoringService.bulk_save_scores(
                self.quiz_asmt, scores_data, self.teacher,
            )
        self.assertIn('cannot be negative', str(ctx.exception))

    def test_bulk_save_scores_requires_student_id(self):
        scores_data = [{'score': Decimal('10')}]
        with self.assertRaises(ValueError) as ctx:
            ScoringService.bulk_save_scores(
                self.quiz_asmt, scores_data, self.teacher,
            )
        self.assertIn('student_id', str(ctx.exception))

    def test_bulk_save_empty_list(self):
        result = ScoringService.bulk_save_scores(
            self.quiz_asmt, [], self.teacher,
        )
        self.assertEqual(result, [])

    def test_bulk_save_updates_existing_score(self):
        scores_data = [
            {'student_id': self.student1.pk, 'score': Decimal('15')},
        ]
        ScoringService.bulk_save_scores(self.quiz_asmt, scores_data, self.teacher)
        scores_data[0]['score'] = Decimal('19')
        result = ScoringService.bulk_save_scores(
            self.quiz_asmt, scores_data, self.teacher,
        )
        self.assertEqual(result[0].score, Decimal('19'))

    def test_recalculate_subject_result(self):
        AssessmentScore.objects.create(
            assessment=self.quiz_asmt, student=self.student1,
            score=Decimal('18'), entered_by=self.teacher,
        )
        AssessmentScore.objects.create(
            assessment=self.midterm_asmt, student=self.student1,
            score=Decimal('40'), entered_by=self.teacher,
        )
        AssessmentScore.objects.create(
            assessment=self.exam_asmt, student=self.student1,
            score=Decimal('80'), entered_by=self.teacher,
        )
        sr = ScoringService.recalculate_subject_result(
            student=self.student1, subject=self.subject,
            term=self.term, school_class=self.school_class,
            actor=self.teacher,
        )
        expected = (Decimal('18') / Decimal('20')) * Decimal('20') + \
                   (Decimal('40') / Decimal('50')) * Decimal('30') + \
                   (Decimal('80') / Decimal('100')) * Decimal('50')
        expected = expected.quantize(Decimal('0.01'))
        self.assertEqual(sr.total_score, expected)
        self.assertEqual(sr.grade, 'A')

    def test_recalculate_creates_subject_result(self):
        self.assertFalse(
            SubjectResult.objects.filter(
                student=self.student1, subject=self.subject, term=self.term,
            ).exists()
        )
        ScoringService.recalculate_subject_result(
            student=self.student1, subject=self.subject,
            term=self.term, school_class=self.school_class,
        )
        self.assertTrue(
            SubjectResult.objects.filter(
                student=self.student1, subject=self.subject, term=self.term,
            ).exists()
        )

    def test_recalculate_generates_audit_log(self):
        AssessmentScore.objects.create(
            assessment=self.quiz_asmt, student=self.student1,
            score=Decimal('10'), entered_by=self.teacher,
        )
        ScoringService.recalculate_subject_result(
            student=self.student1, subject=self.subject,
            term=self.term, school_class=self.school_class,
            actor=self.teacher,
        )
        self.assertTrue(
            ResultAuditLog.objects.filter(
                model_name='subjectresult', action='recalculate',
            ).exists()
        )


# ──────────────────────────────────────────────────────────────────
#  3. Approval Workflow Tests
# ──────────────────────────────────────────────────────────────────


class ApprovalWorkflowTests(BaseResultsTestCase):

    def setUp(self):
        super().setUp()
        self.subject_result = SubjectResult.objects.create(
            student=self.student1, subject=self.subject,
            term=self.term, school_class=self.school_class,
            total_score=Decimal('75.00'), grade='A', gpa_points=Decimal('4.0'),
            status='draft',
        )

    def test_valid_transition_draft_to_submitted(self):
        approval = ApprovalService.transition_status(
            self.subject_result, 'submitted', self.teacher,
        )
        self.assertEqual(approval.previous_status, 'draft')
        self.assertEqual(approval.new_status, 'submitted')
        self.subject_result.refresh_from_db()
        self.assertEqual(self.subject_result.status, 'submitted')

    def test_valid_transition_submitted_to_approved(self):
        self.subject_result.status = 'submitted'
        self.subject_result.save()
        approval = ApprovalService.transition_status(
            self.subject_result, 'approved', self.mudeer,
        )
        self.assertEqual(approval.previous_status, 'submitted')
        self.assertEqual(approval.new_status, 'approved')

    def test_valid_transition_approved_to_published(self):
        self.subject_result.status = 'approved'
        self.subject_result.save()
        ApprovalService.transition_status(
            self.subject_result, 'published', self.mudeer,
        )
        self.subject_result.refresh_from_db()
        self.assertEqual(self.subject_result.status, 'published')
        self.assertIsNotNone(self.subject_result.published_at)

    def test_invalid_transition_draft_to_approved(self):
        with self.assertRaises(ValueError) as ctx:
            ApprovalService.transition_status(
                self.subject_result, 'approved', self.mudeer,
            )
        self.assertIn('Cannot transition', str(ctx.exception))

    def test_invalid_transition_published_to_submitted(self):
        self.subject_result.status = 'published'
        self.subject_result.save()
        with self.assertRaises(ValueError):
            ApprovalService.transition_status(
                self.subject_result, 'submitted', self.mudeer,
            )

    def test_transition_creates_approval_record(self):
        ApprovalService.transition_status(
            self.subject_result, 'submitted', self.teacher,
            comment='Ready for review',
        )
        approval = ResultApproval.objects.latest('created_at')
        self.assertEqual(approval.actor, self.teacher)
        self.assertEqual(approval.comment, 'Ready for review')
        self.assertEqual(approval.action, 'submit')

    def test_transition_creates_audit_log(self):
        ApprovalService.transition_status(
            self.subject_result, 'submitted', self.teacher,
        )
        self.assertTrue(
            ResultAuditLog.objects.filter(
                model_name='subjectresult',
                action='transition_submitted',
            ).exists()
        )

    def test_submitted_sets_submitted_by(self):
        ApprovalService.transition_status(
            self.subject_result, 'submitted', self.teacher,
        )
        self.subject_result.refresh_from_db()
        self.assertEqual(self.subject_result.submitted_by, self.teacher)
        self.assertIsNotNone(self.subject_result.submitted_at)

    def test_reject_from_submitted(self):
        self.subject_result.status = 'submitted'
        self.subject_result.save()
        ApprovalService.transition_status(
            self.subject_result, 'rejected', self.mudeer,
            comment='Scores need correction',
        )
        self.subject_result.refresh_from_db()
        self.assertEqual(self.subject_result.status, 'rejected')

    def test_reopen_rejected_to_submitted(self):
        self.subject_result.status = 'rejected'
        self.subject_result.save()
        ApprovalService.transition_status(
            self.subject_result, 'submitted', self.teacher,
            comment='Corrected and resubmitted',
        )
        self.subject_result.refresh_from_db()
        self.assertEqual(self.subject_result.status, 'submitted')


# ──────────────────────────────────────────────────────────────────
#  4. Ranking Tests
# ──────────────────────────────────────────────────────────────────


class RankingTests(BaseResultsTestCase):

    def setUp(self):
        super().setUp()
        self.sr1 = SubjectResult.objects.create(
            student=self.student1, subject=self.subject,
            term=self.term, school_class=self.school_class,
            total_score=Decimal('90.00'), grade='A', gpa_points=Decimal('4.0'),
            status='published',
        )
        self.sr2 = SubjectResult.objects.create(
            student=self.student2, subject=self.subject,
            term=self.term, school_class=self.school_class,
            total_score=Decimal('75.00'), grade='A', gpa_points=Decimal('4.0'),
            status='published',
        )
        self.sr3 = SubjectResult.objects.create(
            student=self.student3, subject=self.subject,
            term=self.term, school_class=self.school_class,
            total_score=Decimal('75.00'), grade='A', gpa_points=Decimal('4.0'),
            status='published',
        )

    def test_subject_ranks(self):
        count = RankingService.calculate_subject_ranks(
            self.term, self.school_class, subject=self.subject,
        )
        self.assertEqual(count, 3)
        rank1 = StudentRank.objects.get(
            student=self.student1, subject=self.subject, rank_type='subject',
        )
        self.assertEqual(rank1.rank, 1)

    def test_tied_scores_same_rank(self):
        RankingService.calculate_subject_ranks(
            self.term, self.school_class, subject=self.subject,
        )
        rank2 = StudentRank.objects.get(
            student=self.student2, subject=self.subject, rank_type='subject',
        )
        rank3 = StudentRank.objects.get(
            student=self.student3, subject=self.subject, rank_type='subject',
        )
        self.assertEqual(rank2.rank, 2)
        self.assertEqual(rank3.rank, 2)
        self.assertIn(self.student2.pk, rank2.tied_with)
        self.assertIn(self.student3.pk, rank3.tied_with)

    def test_rank_total_students(self):
        RankingService.calculate_subject_ranks(
            self.term, self.school_class, subject=self.subject,
        )
        rank1 = StudentRank.objects.get(
            student=self.student1, subject=self.subject, rank_type='subject',
        )
        self.assertEqual(rank1.total_students, 3)

    def test_class_ranks(self):
        TermResult.objects.create(
            student=self.student1, term=self.term,
            school_class=self.school_class, average_score=Decimal('85.00'),
        )
        TermResult.objects.create(
            student=self.student2, term=self.term,
            school_class=self.school_class, average_score=Decimal('70.00'),
        )
        TermResult.objects.create(
            student=self.student3, term=self.term,
            school_class=self.school_class, average_score=Decimal('60.00'),
        )
        count = RankingService.calculate_class_ranks(self.term, self.school_class)
        self.assertEqual(count, 3)
        rank = StudentRank.objects.get(
            student=self.student1, rank_type='class',
        )
        self.assertEqual(rank.rank, 1)

    def test_ordinal_suffix(self):
        self.assertEqual(RankingService._ordinal_suffix(1), '1st')
        self.assertEqual(RankingService._ordinal_suffix(2), '2nd')
        self.assertEqual(RankingService._ordinal_suffix(3), '3rd')
        self.assertEqual(RankingService._ordinal_suffix(4), '4th')
        self.assertEqual(RankingService._ordinal_suffix(11), '11th')
        self.assertEqual(RankingService._ordinal_suffix(12), '12th')
        self.assertEqual(RankingService._ordinal_suffix(21), '21st')
        self.assertEqual(RankingService._ordinal_suffix(23), '23rd')


# ──────────────────────────────────────────────────────────────────
#  5. Term Aggregation Tests
# ──────────────────────────────────────────────────────────────────


class TermAggregationTests(BaseResultsTestCase):

    def setUp(self):
        super().setUp()
        SubjectResult.objects.create(
            student=self.student1, subject=self.subject,
            term=self.term, school_class=self.school_class,
            total_score=Decimal('80.00'), grade='A', gpa_points=Decimal('4.0'),
            status='published',
        )
        SubjectResult.objects.create(
            student=self.student1, subject=self.subject2,
            term=self.term, school_class=self.school_class,
            total_score=Decimal('60.00'), grade='B', gpa_points=Decimal('3.0'),
            status='published',
        )

    def test_average_calculation(self):
        tr = TermAggregationService.aggregate_term(
            self.student1, self.term, self.school_class,
        )
        self.assertEqual(tr.average_score, Decimal('70.00'))

    def test_gpa_calculation(self):
        tr = TermAggregationService.aggregate_term(
            self.student1, self.term, self.school_class,
        )
        self.assertEqual(tr.gpa, Decimal('3.50'))

    def test_grade_from_average(self):
        tr = TermAggregationService.aggregate_term(
            self.student1, self.term, self.school_class,
        )
        self.assertEqual(tr.grade, 'B')

    def test_subjects_passed_and_failed(self):
        tr = TermAggregationService.aggregate_term(
            self.student1, self.term, self.school_class,
        )
        self.assertEqual(tr.total_subjects, 2)
        self.assertEqual(tr.subjects_passed, 2)
        self.assertEqual(tr.subjects_failed, 0)

    def test_with_one_failing_subject(self):
        SubjectResult.objects.create(
            student=self.student2, subject=self.subject,
            term=self.term, school_class=self.school_class,
            total_score=Decimal('80.00'), grade='A', gpa_points=Decimal('4.0'),
            status='published',
        )
        SubjectResult.objects.create(
            student=self.student2, subject=self.subject2,
            term=self.term, school_class=self.school_class,
            total_score=Decimal('30.00'), grade='F', gpa_points=Decimal('0.0'),
            status='draft',
        )
        tr = TermAggregationService.aggregate_term(
            self.student2, self.term, self.school_class,
        )
        self.assertEqual(tr.subjects_passed, 1)
        self.assertEqual(tr.subjects_failed, 1)

    def test_pass_rate_property(self):
        tr = TermResult.objects.create(
            student=self.student1, term=self.term,
            school_class=self.school_class,
            total_subjects=4, subjects_passed=3, subjects_failed=1,
        )
        self.assertAlmostEqual(tr.pass_rate, 75.0)

    def test_aggregate_all_terms(self):
        count = TermAggregationService.aggregate_all_terms(
            term_id=self.term.pk,
            school_class_id=self.school_class.pk,
        )
        self.assertEqual(count, 1)
        self.assertTrue(TermResult.objects.filter(student=self.student1).exists())

    def test_aggregate_creates_term_result_with_status(self):
        tr = TermAggregationService.aggregate_term(
            self.student1, self.term, self.school_class,
        )
        self.assertEqual(tr.status, 'published')

    def test_aggregate_updates_existing(self):
        TermAggregationService.aggregate_term(
            self.student1, self.term, self.school_class,
        )
        tr = TermAggregationService.aggregate_term(
            self.student1, self.term, self.school_class,
        )
        self.assertEqual(TermResult.objects.filter(
            student=self.student1, term=self.term,
        ).count(), 1)
        self.assertEqual(tr.average_score, Decimal('70.00'))


# ──────────────────────────────────────────────────────────────────
#  6. Permission Tests
# ──────────────────────────────────────────────────────────────────


class PermissionTests(BaseResultsTestCase):

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.subject_result = SubjectResult.objects.create(
            student=self.student1, subject=self.subject,
            term=self.term, school_class=self.school_class,
            total_score=Decimal('80.00'), grade='A', gpa_points=Decimal('4.0'),
            status='published',
        )

    def test_student_can_only_see_own_results(self):
        self.client.force_authenticate(user=self.student1)
        response = self.client.get('/api/results/subject-results/')
        self.assertEqual(response.status_code, 200)
        for item in response.data['results']:
            self.assertEqual(item['student'], self.student1.pk)

    def test_student_cannot_see_other_results(self):
        SubjectResult.objects.create(
            student=self.student2, subject=self.subject,
            term=self.term, school_class=self.school_class,
            total_score=Decimal('70.00'), grade='B', gpa_points=Decimal('3.0'),
            status='published',
        )
        self.client.force_authenticate(user=self.student1)
        response = self.client.get('/api/results/subject-results/')
        self.assertEqual(response.status_code, 200)
        student_ids = [item['student'] for item in response.data['results']]
        self.assertNotIn(self.student2.pk, student_ids)

    def test_parent_can_see_linked_child_results(self):
        self.client.force_authenticate(user=self.parent)
        response = self.client.get('/api/results/subject-results/')
        self.assertEqual(response.status_code, 200)
        student_ids = [item['student'] for item in response.data['results']]
        self.assertIn(self.student1.pk, student_ids)

    def test_parent_cannot_see_unlinked_child(self):
        self.client.force_authenticate(user=self.parent)
        response = self.client.get('/api/results/subject-results/')
        student_ids = [item['student'] for item in response.data['results']]
        self.assertNotIn(self.student2.pk, student_ids)

    def test_student_only_sees_published_results(self):
        SubjectResult.objects.create(
            student=self.student1, subject=self.subject2,
            term=self.term, school_class=self.school_class,
            total_score=Decimal('60.00'), grade='B', gpa_points=Decimal('3.0'),
            status='draft',
        )
        self.client.force_authenticate(user=self.student1)
        response = self.client.get('/api/results/subject-results/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)

    def test_unauthenticated_cannot_access(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/results/subject-results/')
        self.assertEqual(response.status_code, 401)

    def test_student_cannot_approve_results(self):
        self.client.force_authenticate(user=self.student1)
        response = self.client.post(
            f'/api/results/subject-results/{self.subject_result.pk}/approve/',
        )
        self.assertIn(response.status_code, [403, 405])

    def test_teacher_can_enter_scores(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(
            f'/api/results/scores/',
            {'assessment': self.quiz_asmt.pk, 'student': self.student1.pk,
             'score': '15'},
            format='json',
        )
        self.assertIn(response.status_code, [200, 201])
