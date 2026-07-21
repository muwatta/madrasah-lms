from rest_framework.permissions import BasePermission

from curriculum.models import Enrollment
from users.models import StudentParent


def _role(user):
    return getattr(user, "role", None)


# ──────────────────────────────────────────────────────
#  Role checks
# ──────────────────────────────────────────────────────


class IsTeacher(BasePermission):
    """Allow only ustaadh role."""

    message = "Only ustaadh (teachers) may perform this action."

    def has_permission(self, request, view):
        return _role(request.user) == "ustaadh"

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsAcademicOfficer(BasePermission):
    """Allow ustaadh and mudeer roles."""

    message = "Only ustaadh or mudeer may perform this action."

    def has_permission(self, request, view):
        return _role(request.user) in ("ustaadh", "mudeer")

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsMudeer(BasePermission):
    """Allow only mudeer role."""

    message = "Only mudeer (administrator) may perform this action."

    def has_permission(self, request, view):
        return _role(request.user) == "mudeer"

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsStudent(BasePermission):
    """Allow only student role."""

    message = "Only students may perform this action."

    def has_permission(self, request, view):
        return _role(request.user) == "student"

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsParent(BasePermission):
    """Allow only parent role."""

    message = "Only parents may perform this action."

    def has_permission(self, request, view):
        return _role(request.user) == "parent"

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


# ──────────────────────────────────────────────────────
#  Functional permission checks
# ──────────────────────────────────────────────────────


def _is_assigned_teacher(user, subject_id=None, school_class_id=None):
    """Return True if *user* (ustaadh) has an Enrollment where they are the
    assigned teacher for the given subject and/or school_class."""
    qs = Enrollment.objects.filter(ustaadh=user, madrasah=user.madrasah)
    if subject_id is not None:
        qs = qs.filter(subject_id=subject_id)
    if school_class_id is not None:
        qs = qs.filter(school_class_id=school_class_id)
    return qs.exists()


def _parent_of_student(user, student):
    """Return True if *user* (parent) is linked to *student* via StudentParent."""
    return StudentParent.objects.filter(
        parent=user, student=student, student__madrasah=user.madrasah
    ).exists()


def _extract_subject_and_class(obj):
    """Pull subject_id / school_class_id from a result-like object."""
    subject_id = getattr(obj, "subject_id", None)
    school_class_id = getattr(obj, "school_class_id", None)
    return subject_id, school_class_id


# ──────────────────────────────────────────────────────
#  Composite permission classes
# ──────────────────────────────────────────────────────


class CanEnterScores(BasePermission):
    """Teacher can enter scores only for subjects/classes they are assigned to.

    Must check Enrollment.ustaadh for the teacher.
    """

    message = "You are not assigned to teach this subject/class."

    def has_permission(self, request, view):
        return _role(request.user) == "ustaadh"

    def has_object_permission(self, request, view, obj):
        user = request.user
        if _role(user) != "ustaadh":
            return False

        # obj is expected to be an AssessmentScore or similar object
        # that has an assessment FK → subject + school_class
        assessment = getattr(obj, "assessment", None)
        if assessment is None:
            # obj might be an Assessment itself
            subject_id = getattr(obj, "subject_id", None)
            school_class_id = getattr(obj, "school_class_id", None)
        else:
            subject_id = getattr(assessment, "subject_id", None)
            school_class_id = getattr(assessment, "school_class_id", None)

        return _is_assigned_teacher(user, subject_id, school_class_id)


class CanApproveResults(BasePermission):
    """Academic officer (ustaadh or mudeer) can approve."""

    message = "Only ustaadh or mudeer may approve results."

    def has_permission(self, request, view):
        return _role(request.user) in ("ustaadh", "mudeer")

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = _role(user)
        if role == "mudeer":
            return True
        if role != "ustaadh":
            return False

        subject_id, school_class_id = _extract_subject_and_class(obj)
        return _is_assigned_teacher(user, subject_id, school_class_id)


class CanPublishResults(BasePermission):
    """Only mudeer can publish."""

    message = "Only mudeer may publish results."

    def has_permission(self, request, view):
        return _role(request.user) == "mudeer"

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class CanViewStudentResult(BasePermission):
    """Student can view own results. Parent can view child's results.
    Teachers can view results for their assigned subjects/classes.
    Mudeer can view all."""

    message = "You do not have permission to view this result."

    def has_permission(self, request, view):
        return _role(request.user) in ("student", "parent", "ustaadh", "mudeer", "idaarah")

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = _role(user)

        if role == "mudeer":
            return True

        if role == "idaarah":
            return True

        student_id = getattr(obj, "student_id", None)

        if role == "student":
            return student_id == user.id

        if role == "parent":
            if student_id is None:
                return False
            return StudentParent.objects.filter(
                parent=user, student_id=student_id
            ).exists()

        if role == "ustaadh":
            subject_id, school_class_id = _extract_subject_and_class(obj)
            return _is_assigned_teacher(user, subject_id, school_class_id)

        return False


class CanManageGradeScale(BasePermission):
    """Only mudeer can manage grade scales."""

    message = "Only mudeer may manage grade scales."

    def has_permission(self, request, view):
        return _role(request.user) == "mudeer"

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class CanManageBlueprints(BasePermission):
    """Only mudeer/idaarah can manage assessment blueprints."""

    message = "Only mudeer or idaarah may manage assessment blueprints."

    def has_permission(self, request, view):
        return _role(request.user) in ("mudeer", "idaarah")

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class CanGenerateReportCard(BasePermission):
    """Mudeer or academic officer can generate report cards."""

    message = "Only mudeer or ustaadh may generate report cards."

    def has_permission(self, request, view):
        return _role(request.user) in ("mudeer", "ustaadh")

    def has_object_permission(self, request, view, obj):
        user = request.user
        if _role(user) == "mudeer":
            return True
        # ustaadh — check if they teach in this class
        school_class_id = getattr(obj, "school_class_id", None)
        return _is_assigned_teacher(user, school_class_id=school_class_id)
