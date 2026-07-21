from __future__ import annotations

from decimal import Decimal
from typing import Any

from rest_framework import serializers

from academic.models import Session, Term
from curriculum.models import SchoolClass, Subject
from users.models import User

from .models import (
    AnnualResult,
    Assessment,
    AssessmentBlueprint,
    AssessmentScore,
    BlueprintComponent,
    COMPONENT_TYPES,
    GradeScale,
    GradeScaleBand,
    ReportCard,
    ResultApproval,
    ResultAuditLog,
    ResultComponent,
    ResultPublication,
    StudentRank,
    StudentResult,
    SubjectResult,
    TermResult,
    Exam,
    ExamResult,
    ResultTemplate,
    ResultTemplateItem,
)


# ──────────────────────────────────────────────────────
#  Legacy / Exam serializers (kept for existing views)
# ──────────────────────────────────────────────────────


class ExamSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)
    subject_name = serializers.CharField(source="subject.name_ar", read_only=True)
    result_count = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = [
            "id", "madrasah", "subject", "subject_name", "created_by", "created_by_name",
            "title", "exam_date", "description", "total_marks", "result_count", "created_at",
        ]
        read_only_fields = ["madrasah", "created_by"]

    def get_result_count(self, obj: Exam) -> int:
        return obj.results.count()


class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    exam_title = serializers.CharField(source="exam.title", read_only=True)

    class Meta:
        model = ExamResult
        fields = [
            "id", "exam", "exam_title", "student", "student_name",
            "score", "grade", "remarks", "recorded_at",
        ]
        read_only_fields = ["exam", "student"]


class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = [
            "id", "session", "name", "term_number",
            "start_date", "end_date", "hijri_start", "hijri_end", "is_current",
        ]


class SessionSerializer(serializers.ModelSerializer):
    terms = TermSerializer(many=True, read_only=True)

    class Meta:
        model = Session
        fields = ["id", "madrasah", "name", "hijri_year", "start_date", "end_date", "is_current", "terms"]


class ResultTemplateItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResultTemplateItem
        fields = ["id", "template", "component_type", "name", "weight", "order"]


class ResultTemplateSerializer(serializers.ModelSerializer):
    items = ResultTemplateItemSerializer(many=True, read_only=True)
    school_class_name = serializers.CharField(source="school_class.name_en", read_only=True)

    class Meta:
        model = ResultTemplate
        fields = ["id", "madrasah", "school_class", "school_class_name", "name", "items", "created_by", "created_at", "updated_at"]
        read_only_fields = ["madrasah", "created_by"]


class ResultComponentSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name_ar", read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True)
    class_name = serializers.CharField(source="school_class.name_en", read_only=True)
    score_count = serializers.SerializerMethodField()

    class Meta:
        model = ResultComponent
        fields = [
            "id", "madrasah", "subject", "subject_name", "term", "term_name",
            "school_class", "class_name", "template_item", "component_type", "name",
            "max_score", "weight", "score_count", "created_by", "created_at", "updated_at",
        ]
        read_only_fields = ["madrasah", "created_by"]

    def get_score_count(self, obj: ResultComponent) -> int:
        return obj.scores.count()


class StudentResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    component_name = serializers.CharField(source="component.name", read_only=True)

    class Meta:
        model = StudentResult
        fields = [
            "id", "component", "component_name", "student", "student_name",
            "score", "remarks", "entered_by", "created_at", "updated_at",
        ]
        read_only_fields = ["entered_by"]


class BulkScoreInputSerializer(serializers.Serializer):
    """Legacy bulk score input — kept for existing views."""
    scores = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField()),
    )

    def validate_scores(self, value: list[dict[str, str]]) -> list[dict[str, str]]:
        for item in value:
            if "student" not in item or "score" not in item:
                raise serializers.ValidationError("Each entry must have 'student' and 'score'")
        return value


class LegacyTermResultSerializer(serializers.ModelSerializer):
    """Legacy term-result serializer (old model shape with SubjectResult fields)."""
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    subject_name = serializers.CharField(source="subject.name_ar", read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True)
    term_number = serializers.IntegerField(source="term.term_number", read_only=True)
    components = serializers.SerializerMethodField()

    class Meta:
        model = TermResult
        fields = [
            "id", "student", "student_name", "subject", "subject_name",
            "term", "term_name", "term_number", "total_score", "grade", "status",
            "components", "published_by", "published_at", "created_at", "updated_at",
        ]
        read_only_fields = ["total_score", "grade", "published_by", "published_at"]

    def get_components(self, obj: TermResult) -> list[dict[str, Any]]:
        scores = StudentResult.objects.filter(
            component__subject=obj.subject,
            component__term=obj.term,
            student=obj.student,
        ).select_related("component")
        return [
            {
                "id": s.id,
                "component_id": s.component_id,
                "component_name": s.component.name,
                "component_type": s.component.component_type,
                "score": str(s.score),
                "max_score": str(s.component.max_score),
                "weight": str(s.component.weight),
                "remarks": s.remarks,
            }
            for s in scores
        ]


# ──────────────────────────────────────────────────────
#  New Results Module Serializers
# ──────────────────────────────────────────────────────


# ── 1. Grade Scale ────────────────────────────────────


class GradeScaleBandSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeScaleBand
        fields = [
            "id", "grade_scale", "min_score", "max_score",
            "grade", "gpa_points", "remark",
        ]
        read_only_fields = ["grade_scale"]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        min_score = data.get("min_score", getattr(self.instance, "min_score", None))
        max_score = data.get("max_score", getattr(self.instance, "max_score", None))
        if min_score is not None and max_score is not None and min_score > max_score:
            raise serializers.ValidationError({"min_score": "min_score must be <= max_score"})
        return data


class GradeScaleSerializer(serializers.ModelSerializer):
    bands = GradeScaleBandSerializer(many=True, read_only=True)
    madrasah_name = serializers.CharField(source="madrasah.name", read_only=True)
    band_count = serializers.SerializerMethodField()

    class Meta:
        model = GradeScale
        fields = [
            "id", "madrasah", "madrasah_name", "name", "is_default",
            "bands", "band_count", "created_at",
        ]
        read_only_fields = ["madrasah"]

    def get_band_count(self, obj: GradeScale) -> int:
        return obj.bands.count()

    def create(self, validated_data: dict[str, Any]) -> GradeScale:
        bands_data = self.initial_data.get("bands", [])
        grade_scale = GradeScale.objects.create(**validated_data)
        for band_data in bands_data:
            band_data.pop("id", None)
            band_data["grade_scale"] = grade_scale.pk
            band_serializer = GradeScaleBandSerializer(data=band_data)
            band_serializer.is_valid(raise_exception=True)
            band_serializer.save()
        return grade_scale

    def update(self, instance: GradeScale, validated_data: dict[str, Any]) -> GradeScale:
        bands_data = self.initial_data.get("bands", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if bands_data is not None:
            existing_ids = {b.id for b in instance.bands.all()}
            submitted_ids = set()
            for band_data in bands_data:
                band_id = band_data.get("id")
                if band_id and band_id in existing_ids:
                    submitted_ids.add(band_id)
                    band_instance = instance.bands.get(pk=band_id)
                    band_serializer = GradeScaleBandSerializer(band_instance, data=band_data, partial=True)
                    band_serializer.is_valid(raise_exception=True)
                    band_serializer.save()
                else:
                    band_data.pop("id", None)
                    band_data["grade_scale"] = instance.pk
                    band_serializer = GradeScaleBandSerializer(data=band_data)
                    band_serializer.is_valid(raise_exception=True)
                    band_serializer.save()
                    submitted_ids.add(band_serializer.instance.pk)
            # Remove bands not in the submitted set
            instance.bands.exclude(pk__in=submitted_ids).delete()

        return instance


# ── 2. Assessment Blueprint ────────────────────────────


class BlueprintComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlueprintComponent
        fields = [
            "id", "blueprint", "name", "component_type",
            "weight", "max_score", "order",
        ]
        read_only_fields = ["blueprint"]

    def validate_weight(self, value: Decimal) -> Decimal:
        if value <= 0:
            raise serializers.ValidationError("Weight must be greater than 0")
        return value


class AssessmentBlueprintSerializer(serializers.ModelSerializer):
    components = BlueprintComponentSerializer(many=True, read_only=True)
    school_class_name = serializers.CharField(source="school_class.name_en", read_only=True)
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)
    total_weight = serializers.SerializerMethodField()
    component_count = serializers.SerializerMethodField()

    class Meta:
        model = AssessmentBlueprint
        fields = [
            "id", "madrasah", "school_class", "school_class_name", "name", "description",
            "is_active", "components", "total_weight", "component_count",
            "created_by", "created_by_name", "created_at", "updated_at",
        ]
        read_only_fields = ["madrasah", "created_by"]

    def get_total_weight(self, obj: AssessmentBlueprint) -> float:
        return obj.total_weight

    def get_component_count(self, obj: AssessmentBlueprint) -> int:
        return obj.components.count()

    def create(self, validated_data: dict[str, Any]) -> AssessmentBlueprint:
        components_data = self.initial_data.get("components", [])
        blueprint = AssessmentBlueprint.objects.create(**validated_data)
        for comp_data in components_data:
            comp_data.pop("id", None)
            comp_data["blueprint"] = blueprint.pk
            comp_serializer = BlueprintComponentSerializer(data=comp_data)
            comp_serializer.is_valid(raise_exception=True)
            comp_serializer.save()
        blueprint.refresh_from_db()
        try:
            blueprint.validate_weights()
        except Exception as exc:
            blueprint.delete()
            raise serializers.ValidationError({"components": str(exc)})
        return blueprint

    def update(self, instance: AssessmentBlueprint, validated_data: dict[str, Any]) -> AssessmentBlueprint:
        components_data = self.initial_data.get("components", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if components_data is not None:
            existing_ids = {c.id for c in instance.components.all()}
            submitted_ids: set[int] = set()
            for comp_data in components_data:
                comp_id = comp_data.get("id")
                if comp_id and comp_id in existing_ids:
                    submitted_ids.add(comp_id)
                    comp_instance = instance.components.get(pk=comp_id)
                    comp_serializer = BlueprintComponentSerializer(comp_instance, data=comp_data, partial=True)
                    comp_serializer.is_valid(raise_exception=True)
                    comp_serializer.save()
                else:
                    comp_data.pop("id", None)
                    comp_data["blueprint"] = instance.pk
                    comp_serializer = BlueprintComponentSerializer(data=comp_data)
                    comp_serializer.is_valid(raise_exception=True)
                    comp_serializer.save()
                    submitted_ids.add(comp_serializer.instance.pk)
            instance.components.exclude(pk__in=submitted_ids).delete()

        instance.refresh_from_db()
        instance.validate_weights()
        return instance


# ── 3. Assessment ──────────────────────────────────────


class AssessmentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    subject_name = serializers.CharField(source="subject.name_ar", read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True)
    school_class_name = serializers.CharField(source="school_class.name_en", read_only=True)
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)
    score_count = serializers.SerializerMethodField()

    class Meta:
        model = Assessment
        fields = [
            "id", "madrasah", "subject", "subject_name", "term", "term_name",
            "school_class", "school_class_name", "component_type", "name",
            "max_score", "weight", "order", "score_count",
            "created_by", "created_by_name", "created_at", "updated_at",
        ]
        read_only_fields = ["madrasah", "created_by"]

    def get_score_count(self, obj: Assessment) -> int:
        return obj.scores.count()


class AssessmentDetailSerializer(serializers.ModelSerializer):
    """Full detail with blueprint component reference."""
    subject_name = serializers.CharField(source="subject.name_ar", read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True)
    school_class_name = serializers.CharField(source="school_class.name_en", read_only=True)
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)
    blueprint_component_name = serializers.CharField(source="blueprint_component.name", read_only=True)
    scores = serializers.SerializerMethodField()

    class Meta:
        model = Assessment
        fields = [
            "id", "madrasah", "subject", "subject_name", "term", "term_name",
            "school_class", "school_class_name", "blueprint_component",
            "blueprint_component_name", "component_type", "name",
            "max_score", "weight", "order", "scores",
            "created_by", "created_by_name", "created_at", "updated_at",
        ]
        read_only_fields = ["madrasah", "created_by"]

    def get_scores(self, obj: Assessment) -> list[dict[str, Any]]:
        scores = obj.scores.select_related("student").all()
        return [
            {
                "id": s.id,
                "student": s.student_id,
                "student_name": s.student.get_full_name(),
                "score": str(s.score),
                "remarks": s.remarks,
            }
            for s in scores
        ]


# Alias so `AssessmentSerializer` works for both list and detail
# depending on context; views can pick the right one.
AssessmentSerializer = AssessmentListSerializer


# ── 4. Assessment Score ────────────────────────────────


class AssessmentScoreSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    assessment_name = serializers.CharField(source="assessment.name", read_only=True)
    assessment_max_score = serializers.DecimalField(
        source="assessment.max_score", max_digits=5, decimal_places=2, read_only=True,
    )
    entered_by_name = serializers.CharField(source="entered_by.get_full_name", read_only=True)

    class Meta:
        model = AssessmentScore
        fields = [
            "id", "assessment", "assessment_name", "assessment_max_score",
            "student", "student_name", "score", "remarks",
            "entered_by", "entered_by_name", "created_at", "updated_at",
        ]
        read_only_fields = ["entered_by"]

    def validate_score(self, value: Decimal) -> Decimal:
        assessment = None
        if self.instance:
            assessment = self.instance.assessment
        elif "assessment" in self.initial_data:
            assessment_id = self.initial_data["assessment"]
            try:
                assessment = Assessment.objects.get(pk=assessment_id)
            except Assessment.DoesNotExist:
                pass
        if assessment and value > assessment.max_score:
            raise serializers.ValidationError(
                f"Score {value} exceeds max score {assessment.max_score} for this assessment"
            )
        return value


# ── 5. Subject Result ──────────────────────────────────


class SubjectResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    subject_name = serializers.CharField(source="subject.name_ar", read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True)
    school_class_name = serializers.CharField(source="school_class.name_en", read_only=True)
    submitted_by_name = serializers.CharField(source="submitted_by.get_full_name", read_only=True)
    component_scores = serializers.SerializerMethodField()
    weighted_score = serializers.SerializerMethodField()

    class Meta:
        model = SubjectResult
        fields = [
            "id", "student", "student_name", "subject", "subject_name",
            "term", "term_name", "school_class", "school_class_name",
            "total_score", "grade", "grade_remark", "gpa_points",
            "teacher_comment", "status", "component_scores", "weighted_score",
            "submitted_by", "submitted_by_name", "submitted_at",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "total_score", "grade", "grade_remark", "gpa_points",
            "submitted_by", "submitted_at",
        ]

    def get_component_scores(self, obj: Any) -> list[dict[str, Any]]:
        scores = AssessmentScore.objects.filter(
            assessment__subject=obj.subject,
            assessment__term=obj.term,
            student=obj.student,
        ).select_related("assessment")
        return [
            {
                "id": s.id,
                "assessment_id": s.assessment_id,
                "assessment_name": s.assessment.name,
                "component_type": s.assessment.component_type,
                "score": str(s.score),
                "max_score": str(s.assessment.max_score),
                "weight": str(s.assessment.weight),
                "remarks": s.remarks,
            }
            for s in scores
        ]

    def get_weighted_score(self, obj: Any) -> str:
        """Weighted contribution of this component score."""
        return str(obj.total_score)


class SubjectResultDetailSerializer(SubjectResultSerializer):
    """Detail view with assessment breakdown."""
    assessment_breakdown = serializers.SerializerMethodField()

    class Meta(SubjectResultSerializer.Meta):
        fields = SubjectResultSerializer.Meta.fields + ['assessment_breakdown']

    def get_assessment_breakdown(self, obj):
        scores = AssessmentScore.objects.filter(
            assessment__subject=obj.subject,
            assessment__term=obj.term,
            student=obj.student,
        ).select_related('assessment')
        return [
            {
                'assessment_name': s.assessment.name,
                'component_type': s.assessment.component_type,
                'score': str(s.score),
                'max_score': str(s.assessment.max_score),
                'weight': str(s.assessment.weight),
            }
            for s in scores
        ]


class BulkScoreUploadSerializer(serializers.Serializer):
    """Bulk upload scores."""
    scores = serializers.ListField(
        child=serializers.DictField(),
    )

    def validate_scores(self, value):
        if not value:
            raise serializers.ValidationError("Scores list cannot be empty.")
        return value


# ── 6. Term Result (new aggregated) ────────────────────


class TermResultSerializer(serializers.ModelSerializer):
    """New aggregated term result per student."""
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True)
    term_number = serializers.IntegerField(source="term.term_number", read_only=True)
    session_name = serializers.CharField(source="term.session.name", read_only=True)
    school_class_name = serializers.CharField(source="school_class.name_en", read_only=True)
    pass_rate = serializers.SerializerMethodField()
    position_display = serializers.SerializerMethodField()

    class Meta:
        model = TermResult
        fields = [
            "id", "student", "student_name", "term", "term_name", "term_number",
            "session_name", "school_class", "school_class_name",
            "average_score", "gpa", "grade", "grade_remark",
            "position", "rank_position", "position_display", "class_size",
            "total_subjects", "subjects_passed", "subjects_failed", "pass_rate",
            "teacher_comment", "principal_comment",
            "status", "published_at", "created_at", "updated_at",
        ]
        read_only_fields = [
            "average_score", "gpa", "grade", "grade_remark",
            "position", "rank_position", "class_size",
            "total_subjects", "subjects_passed", "subjects_failed",
            "published_at",
        ]

    def get_pass_rate(self, obj: TermResult) -> float:
        return obj.pass_rate

    def get_position_display(self, obj: TermResult) -> str:
        return obj.rank_position or (f"#{obj.position}" if obj.position else "")


# ── 7. Annual Result ───────────────────────────────────


class AnnualResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    session_name = serializers.CharField(source="session.name", read_only=True)
    school_class_name = serializers.CharField(source="school_class.name_en", read_only=True)
    pass_rate = serializers.SerializerMethodField()

    class Meta:
        model = AnnualResult
        fields = [
            "id", "student", "student_name", "session", "session_name",
            "school_class", "school_class_name",
            "annual_average", "annual_gpa", "grade", "grade_remark",
            "position", "class_size",
            "total_subjects", "subjects_passed", "subjects_failed", "pass_rate",
            "promoted", "status", "published_at",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "annual_average", "annual_gpa", "grade", "grade_remark",
            "position", "class_size",
            "total_subjects", "subjects_passed", "subjects_failed",
            "published_at",
        ]

    def get_pass_rate(self, obj: AnnualResult) -> float:
        return (obj.subjects_passed / obj.total_subjects * 100) if obj.total_subjects else 0.0


# ── 8. Student Rank ────────────────────────────────────


class StudentRankSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    subject_name = serializers.CharField(source="subject.name_ar", read_only=True)
    school_class_name = serializers.CharField(source="school_class.name_en", read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True)
    percentile = serializers.SerializerMethodField()

    class Meta:
        model = StudentRank
        fields = [
            "id", "student", "student_name", "term", "term_name",
            "subject", "subject_name", "school_class", "school_class_name",
            "rank_type", "rank", "total_students", "tied_with",
            "score", "percentile", "created_at",
        ]
        read_only_fields = ["rank", "total_students", "tied_with", "score"]

    def get_percentile(self, obj: StudentRank) -> float:
        if obj.total_students == 0:
            return 0.0
        return round((1 - obj.rank / obj.total_students) * 100, 1)


# ── 9. Result Approval ────────────────────────────────


class ResultApprovalSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.get_full_name", read_only=True)
    student_name = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()

    class Meta:
        model = ResultApproval
        fields = [
            "id", "subject_result", "student_name", "subject_name",
            "actor", "actor_name", "action", "comment",
            "previous_status", "new_status", "created_at",
        ]
        read_only_fields = ["actor", "previous_status", "new_status", "created_at"]

    def get_student_name(self, obj: ResultApproval) -> str:
        return obj.subject_result.student.get_full_name()

    def get_subject_name(self, obj: ResultApproval) -> str:
        return obj.subject_result.subject.name_ar


# ── 10. Result Publication ─────────────────────────────


class ResultPublicationSerializer(serializers.ModelSerializer):
    published_by_name = serializers.CharField(source="published_by.get_full_name", read_only=True)
    school_class_name = serializers.CharField(source="school_class.name_en", read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True)
    session_name = serializers.CharField(source="session.name", read_only=True)

    class Meta:
        model = ResultPublication
        fields = [
            "id", "session", "session_name", "term", "term_name",
            "school_class", "school_class_name",
            "published_by", "published_by_name", "published_at",
            "status", "notes",
        ]
        read_only_fields = ["published_by", "published_at"]


# ── 11. Report Card ────────────────────────────────────


class ReportCardSubjectResultSerializer(serializers.Serializer):
    """Nested subject result inside a report card."""
    subject_name = serializers.CharField()
    subject_code = serializers.CharField(allow_blank=True)
    total_score = serializers.DecimalField(max_digits=6, decimal_places=2)
    grade = serializers.CharField()
    grade_remark = serializers.CharField(allow_blank=True)
    gpa_points = serializers.DecimalField(max_digits=3, decimal_places=1)
    teacher_comment = serializers.CharField(allow_blank=True)
    component_scores = serializers.ListField(child=serializers.DictField())


class ReportCardSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True)
    session_name = serializers.CharField(source="session.name", read_only=True)
    school_class_name = serializers.CharField(source="school_class.name_en", read_only=True)
    generated_by_name = serializers.CharField(source="generated_by.get_full_name", read_only=True)
    attendance_rate = serializers.SerializerMethodField()
    subject_results = serializers.SerializerMethodField()
    term_result_summary = serializers.SerializerMethodField()

    class Meta:
        model = ReportCard
        fields = [
            "id", "uuid", "student", "student_name",
            "term", "term_name", "session", "session_name",
            "school_class", "school_class_name",
            "term_result", "term_result_summary",
            "generated_by", "generated_by_name", "generated_at",
            "pdf_file", "qr_code",
            "teacher_comment", "principal_comment",
            "attendance_total_days", "attendance_present",
            "attendance_absent", "attendance_late", "attendance_excused",
            "attendance_rate",
            "subject_results",
        ]
        read_only_fields = ["uuid", "generated_by", "generated_at"]

    def get_attendance_rate(self, obj: ReportCard) -> float:
        return obj.attendance_rate

    def get_subject_results(self, obj: ReportCard) -> list[dict[str, Any]]:
        subject_results = SubjectResult.objects.filter(
            student=obj.student, term=obj.term,
        ).select_related("subject")
        results = []
        for sr in subject_results:
            scores = AssessmentScore.objects.filter(
                assessment__subject=sr.subject,
                assessment__term=sr.term,
                student=obj.student,
            ).select_related("assessment")
            component_scores = [
                {
                    "assessment_name": s.assessment.name,
                    "component_type": s.assessment.component_type,
                    "score": str(s.score),
                    "max_score": str(s.assessment.max_score),
                    "weight": str(s.assessment.weight),
                }
                for s in scores
            ]
            results.append({
                "subject_name": sr.subject.name_ar,
                "subject_code": sr.subject.code,
                "total_score": str(sr.total_score),
                "grade": sr.grade,
                "grade_remark": sr.grade_remark,
                "gpa_points": str(sr.gpa_points),
                "teacher_comment": sr.teacher_comment,
                "component_scores": component_scores,
            })
        return results

    def get_term_result_summary(self, obj: ReportCard) -> dict[str, Any] | None:
        tr = obj.term_result
        return {
            "average_score": str(tr.average_score),
            "gpa": str(tr.gpa),
            "grade": tr.grade,
            "grade_remark": tr.grade_remark,
            "position": tr.position,
            "rank_position": tr.rank_position,
            "total_subjects": tr.total_subjects,
            "subjects_passed": tr.subjects_passed,
            "subjects_failed": tr.subjects_failed,
            "pass_rate": tr.pass_rate,
        }


# ── 12. Result Audit Log ──────────────────────────────


class ResultAuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.get_full_name", read_only=True)

    class Meta:
        model = ResultAuditLog
        fields = [
            "id", "actor", "actor_name", "action", "model_name", "object_id",
            "previous_data", "new_data", "reason", "ip_address", "created_at",
        ]
        read_only_fields = [
            "id", "actor", "action", "model_name", "object_id",
            "previous_data", "new_data", "ip_address", "created_at",
        ]


# ── 13. Enhanced Bulk Score Input ──────────────────────


class BulkAssessmentScoreInputItem(serializers.Serializer):
    """Single item inside a bulk score submission."""
    student = serializers.IntegerField()
    score = serializers.DecimalField(max_digits=7, decimal_places=2)
    remarks = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_score(self, value: Decimal) -> Decimal:
        if value < 0:
            raise serializers.ValidationError("Score cannot be negative")
        return value


class BulkAssessmentScoreInputSerializer(serializers.Serializer):
    """Bulk score input for a specific assessment."""
    assessment = serializers.IntegerField()
    scores = BulkAssessmentScoreInputItem(many=True)

    def validate_assessment(self, value: int) -> int:
        if not Assessment.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Assessment not found")
        return value

    def validate_scores(self, value: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not value:
            raise serializers.ValidationError("At least one score entry is required")
        student_ids = [item["student"] for item in value]
        if len(student_ids) != len(set(student_ids)):
            raise serializers.ValidationError("Duplicate student IDs in the score list")
        return value

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        assessment = Assessment.objects.get(pk=data["assessment"])
        for item in data["scores"]:
            if item["score"] > assessment.max_score:
                raise serializers.ValidationError(
                    {"scores": f"Score {item['score']} for student {item['student']} "
                               f"exceeds max score {assessment.max_score}"}
                )
        return data


# ── 14. Subject Results Bulk ───────────────────────────


class SubjectResultBulkItemSerializer(serializers.Serializer):
    """Single subject-result item for bulk status changes."""
    subject_result = serializers.IntegerField()
    teacher_comment = serializers.CharField(required=False, allow_blank=True)

    def validate_subject_result(self, value: int) -> int:
        if not SubjectResult.objects.filter(pk=value).exists():
            raise serializers.ValidationError("SubjectResult not found")
        return value


class SubjectResultsBulkSerializer(serializers.Serializer):
    """Bulk operations on multiple SubjectResults."""
    subject_results = SubjectResultBulkItemSerializer(many=True)
    action = serializers.ChoiceField(
        choices=["approve", "reject", "publish", "submit", "lock"],
    )
    comment = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_subject_results(self, value: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not value:
            raise serializers.ValidationError("At least one subject result is required")
        return value


# ── 15. Analytics ──────────────────────────────────────


class AnalyticsOverviewSerializer(serializers.Serializer):
    """Overview analytics for a term."""
    term_id = serializers.IntegerField()
    term_name = serializers.CharField()
    total_students = serializers.IntegerField()
    total_subjects = serializers.IntegerField()
    total_assessments = serializers.IntegerField()
    average_score = serializers.DecimalField(max_digits=6, decimal_places=2)
    pass_rate = serializers.FloatField()
    subject_averages = serializers.ListField(child=serializers.DictField())
    grade_distribution = serializers.DictField()


class AnalyticsSubjectSerializer(serializers.Serializer):
    """Per-subject analytics breakdown."""
    subject_id = serializers.IntegerField()
    subject_name = serializers.CharField()
    total_students = serializers.IntegerField()
    average_score = serializers.DecimalField(max_digits=6, decimal_places=2)
    highest_score = serializers.DecimalField(max_digits=6, decimal_places=2)
    lowest_score = serializers.DecimalField(max_digits=6, decimal_places=2)
    pass_count = serializers.IntegerField()
    fail_count = serializers.IntegerField()
    grade_distribution = serializers.DictField()
    component_averages = serializers.ListField(child=serializers.DictField())


class AnalyticsClassSerializer(serializers.Serializer):
    """Per-class analytics breakdown."""
    class_id = serializers.IntegerField()
    class_name = serializers.CharField()
    total_students = serializers.IntegerField()
    average_score = serializers.DecimalField(max_digits=6, decimal_places=2)
    pass_rate = serializers.FloatField()
    subject_averages = serializers.ListField(child=serializers.DictField())
    top_students = serializers.ListField(child=serializers.DictField())
    grade_distribution = serializers.DictField()


# ── 16. Workflow Transition ────────────────────────────


class WorkflowTransitionSerializer(serializers.Serializer):
    """Validate and execute a workflow status transition."""
    action = serializers.ChoiceField(
        choices=["submit", "approve", "reject", "publish", "reopen", "lock"],
    )
    comment = serializers.CharField(required=False, allow_blank=True, default="")
    target_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of SubjectResult or TermResult PKs to transition.",
    )

    def validate_target_ids(self, value: list[int]) -> list[int]:
        if not value:
            raise serializers.ValidationError("At least one target ID is required")
        return value

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        action = data["action"]
        target_ids = data["target_ids"]

        # Validate that targets exist and are in a valid state for the action
        valid_transitions: dict[str, list[str]] = {
            "submit": ["draft", "rejected"],
            "approve": ["submitted", "under_review"],
            "reject": ["submitted", "under_review"],
            "publish": ["approved"],
            "reopen": ["published", "rejected"],
            "lock": ["published"],
        }
        allowed_from = valid_transitions.get(action, [])

        # Try SubjectResult first, then TermResult
        sr_qs = SubjectResult.objects.filter(pk__in=target_ids)
        tr_qs = TermResult.objects.filter(pk__in=target_ids)

        invalid_sr = sr_qs.exclude(status__in=allowed_from).values_list("pk", flat=True)
        invalid_tr = tr_qs.exclude(status__in=allowed_from).values_list("pk", flat=True)
        invalid_ids = list(invalid_sr) + list(invalid_tr)

        if invalid_ids:
            raise serializers.ValidationError(
                {"target_ids": f"IDs {invalid_ids} are not in a valid state for '{action}' action"}
            )

        data["subject_results"] = list(sr_qs)
        data["term_results"] = list(tr_qs)
        return data
