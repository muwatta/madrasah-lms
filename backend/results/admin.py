from django.contrib import admin

from .models import (
    GradeScale,
    GradeScaleBand,
    AssessmentBlueprint,
    BlueprintComponent,
    Assessment,
    AssessmentScore,
    SubjectResult,
    TermResult,
    AnnualResult,
    StudentRank,
    ResultPublication,
    ResultApproval,
    ReportCard,
    ResultAuditLog,
)


# ── Grade Scale ───────────────────────────────────────────────────


class GradeScaleBandInline(admin.TabularInline):
    model = GradeScaleBand
    extra = 1
    ordering = ['-min_score']


@admin.register(GradeScale)
class GradeScaleAdmin(admin.ModelAdmin):
    list_display = ['name', 'madrasah', 'is_default', 'band_count', 'created_at']
    list_filter = ['is_default', 'madrasah']
    search_fields = ['name']
    inlines = [GradeScaleBandInline]

    def band_count(self, obj):
        return obj.bands.count()
    band_count.short_description = 'Bands'


@admin.register(GradeScaleBand)
class GradeScaleBandAdmin(admin.ModelAdmin):
    list_display = ['grade_scale', 'grade', 'min_score', 'max_score', 'gpa_points', 'remark']
    list_filter = ['grade_scale']
    search_fields = ['grade', 'remark']


# ── Assessment Blueprint ──────────────────────────────────────────


class BlueprintComponentInline(admin.TabularInline):
    model = BlueprintComponent
    extra = 1
    ordering = ['order']


@admin.register(AssessmentBlueprint)
class AssessmentBlueprintAdmin(admin.ModelAdmin):
    list_display = ['name', 'school_class', 'madrasah', 'is_active',
                    'total_weight_display', 'component_count', 'created_by', 'created_at']
    list_filter = ['is_active', 'madrasah', 'school_class']
    search_fields = ['name', 'description']
    raw_id_fields = ['school_class', 'created_by']
    inlines = [BlueprintComponentInline]

    def total_weight_display(self, obj):
        return f'{obj.total_weight:.1f}%'
    total_weight_display.short_description = 'Total Weight'

    def component_count(self, obj):
        return obj.components.count()
    component_count.short_description = 'Components'


@admin.register(BlueprintComponent)
class BlueprintComponentAdmin(admin.ModelAdmin):
    list_display = ['name', 'blueprint', 'component_type', 'weight', 'max_score', 'order']
    list_filter = ['component_type', 'blueprint']
    search_fields = ['name']


# ── Assessment ────────────────────────────────────────────────────


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'subject', 'term', 'school_class', 'component_type',
                    'max_score', 'weight', 'score_count', 'created_by', 'created_at']
    list_filter = ['component_type', 'madrasah', 'term', 'subject']
    search_fields = ['name']
    raw_id_fields = ['subject', 'term', 'school_class', 'blueprint_component', 'created_by']

    def score_count(self, obj):
        return obj.scores.count()
    score_count.short_description = 'Scores'


@admin.register(AssessmentScore)
class AssessmentScoreAdmin(admin.ModelAdmin):
    list_display = ['student', 'assessment', 'score', 'entered_by', 'created_at']
    list_filter = ['assessment__component_type', 'assessment__term']
    search_fields = ['student__first_name', 'student__last_name']
    raw_id_fields = ['assessment', 'student', 'entered_by']


# ── Subject Result ────────────────────────────────────────────────


@admin.register(SubjectResult)
class SubjectResultAdmin(admin.ModelAdmin):
    list_display = ['student', 'subject', 'term', 'school_class', 'total_score',
                    'grade', 'gpa_points', 'status', 'submitted_by', 'created_at']
    list_filter = ['status', 'term', 'subject', 'school_class']
    search_fields = ['student__first_name', 'student__last_name']
    raw_id_fields = ['student', 'subject', 'term', 'school_class', 'submitted_by']


# ── Term Result ───────────────────────────────────────────────────


@admin.register(TermResult)
class TermResultAdmin(admin.ModelAdmin):
    list_display = ['student', 'term', 'school_class', 'average_score', 'gpa',
                    'grade', 'position', 'rank_position', 'total_subjects',
                    'subjects_passed', 'subjects_failed', 'status']
    list_filter = ['status', 'term', 'school_class']
    search_fields = ['student__first_name', 'student__last_name']
    raw_id_fields = ['student', 'term', 'school_class']


# ── Annual Result ─────────────────────────────────────────────────


@admin.register(AnnualResult)
class AnnualResultAdmin(admin.ModelAdmin):
    list_display = ['student', 'session', 'school_class', 'annual_average',
                    'annual_gpa', 'grade', 'position', 'promoted', 'status']
    list_filter = ['status', 'session', 'school_class', 'promoted']
    search_fields = ['student__first_name', 'student__last_name']
    raw_id_fields = ['student', 'session', 'school_class']


# ── Student Rank ──────────────────────────────────────────────────


@admin.register(StudentRank)
class StudentRankAdmin(admin.ModelAdmin):
    list_display = ['student', 'term', 'subject', 'school_class', 'rank_type',
                    'rank', 'total_students', 'score']
    list_filter = ['rank_type', 'term', 'school_class']
    search_fields = ['student__first_name', 'student__last_name']
    raw_id_fields = ['student', 'term', 'subject', 'school_class']


# ── Result Publication ────────────────────────────────────────────


@admin.register(ResultPublication)
class ResultPublicationAdmin(admin.ModelAdmin):
    list_display = ['school_class', 'term', 'session', 'status',
                    'published_by', 'published_at']
    list_filter = ['status', 'term', 'school_class']
    raw_id_fields = ['session', 'term', 'school_class', 'published_by']


# ── Result Approval ───────────────────────────────────────────────


@admin.register(ResultApproval)
class ResultApprovalAdmin(admin.ModelAdmin):
    list_display = ['subject_result', 'actor', 'action', 'previous_status',
                    'new_status', 'comment', 'created_at']
    list_filter = ['action', 'new_status']
    search_fields = ['comment']
    raw_id_fields = ['subject_result', 'actor']


# ── Report Card ───────────────────────────────────────────────────


@admin.register(ReportCard)
class ReportCardAdmin(admin.ModelAdmin):
    list_display = ['student', 'term', 'session', 'school_class',
                    'generated_by', 'generated_at', 'attendance_rate_display']
    list_filter = ['term', 'school_class']
    search_fields = ['student__first_name', 'student__last_name']
    raw_id_fields = ['student', 'term', 'session', 'school_class',
                     'term_result', 'generated_by']
    readonly_fields = ['uuid', 'attendance_rate_display']

    def attendance_rate_display(self, obj):
        return f'{obj.attendance_rate:.1f}%'
    attendance_rate_display.short_description = 'Attendance %'


# ── Audit Log ─────────────────────────────────────────────────────


@admin.register(ResultAuditLog)
class ResultAuditLogAdmin(admin.ModelAdmin):
    list_display = ['actor', 'action', 'model_name', 'object_id',
                    'ip_address', 'created_at']
    list_filter = ['model_name', 'action']
    search_fields = ['actor__first_name', 'actor__last_name', 'reason']
    raw_id_fields = ['actor']
    readonly_fields = ['id', 'actor', 'action', 'model_name', 'object_id',
                       'previous_data', 'new_data', 'reason', 'ip_address',
                       'created_at']
