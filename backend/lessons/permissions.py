from __future__ import annotations

from rest_framework.permissions import BasePermission

from curriculum.models import Enrollment


def _role(user):
    return getattr(user, 'role', None) or getattr(user, 'user_type', None)


def _is_assigned_ustaadh(user, subject_id=None, school_class_id=None):
    if _role(user) != 'ustaadh':
        return False
    qs = Enrollment.objects.filter(
        ustaadh=user, madrasah=user.madrasah, is_active=True)
    if subject_id:
        qs = qs.filter(subject_id=subject_id)
    if school_class_id:
        qs = qs.filter(school_class_id=school_class_id)
    return qs.exists()


def _is_mudeer_or_idaarah(user):
    return _role(user) in ('mudeer', 'idaarah')


# ──────────────────────────────────────────────────────
#  Simple role permissions
# ──────────────────────────────────────────────────────


class IsUstaadh(BasePermission):
    def has_permission(self, request, view):
        return _role(request.user) == 'ustaadh'


class IsMudeer(BasePermission):
    def has_permission(self, request, view):
        return _role(request.user) == 'mudeer'


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return _role(request.user) == 'student'


# ──────────────────────────────────────────────────────
#  Composite / functional permissions
# ──────────────────────────────────────────────────────


class CanManageLessonPlans(BasePermission):
    """Ustaadh: own plans only. Mudeer/idaarah: all plans."""
    def has_permission(self, request, view):
        role = _role(request.user)
        return role in ('ustaadh', 'mudeer', 'idaarah')

    def has_object_permission(self, request, view, obj):
        role = _role(request.user)
        if role in ('mudeer', 'idaarah'):
            return True
        return obj.teacher == request.user and obj.madrasah == request.user.madrasah


class CanApproveLessonPlans(BasePermission):
    """Mudeer and idaarah can approve."""
    def has_permission(self, request, view):
        return _role(request.user) in ('mudeer', 'idaarah')

    def has_object_permission(self, request, view, obj):
        return obj.madrasah == request.user.madrasah


class CanDeliverLessons(BasePermission):
    """Ustaadh assigned to the subject+class."""
    def has_permission(self, request, view):
        return _role(request.user) == 'ustaadh'

    def has_object_permission(self, request, view, obj):
        lesson = getattr(obj, 'lesson', obj)
        return _is_assigned_ustaadh(
            request.user,
            subject_id=lesson.subject_id,
            school_class_id=lesson.school_class_id,
        )


class CanManageHomework(BasePermission):
    """Ustaadh: own homework. Mudeer/idaarah: all. Student: read."""
    def has_permission(self, request, view):
        return _role(request.user) in ('ustaadh', 'mudeer', 'idaarah', 'student')

    def has_object_permission(self, request, view, obj):
        role = _role(request.user)
        if role in ('mudeer', 'idaarah'):
            return True
        if role == 'student':
            return request.method in ('GET', 'HEAD', 'OPTIONS')
        return obj.teacher == request.user and obj.madrasah == request.user.madrasah


class CanGradeHomework(BasePermission):
    """Ustaadh (assigned) or mudeer/idaarah."""
    def has_permission(self, request, view):
        return _role(request.user) in ('ustaadh', 'mudeer', 'idaarah')

    def has_object_permission(self, request, view, obj):
        role = _role(request.user)
        if role in ('mudeer', 'idaarah'):
            return True
        sub = getattr(obj, 'homework', obj)
        return _is_assigned_ustaadh(
            request.user,
            subject_id=sub.subject_id,
            school_class_id=sub.school_class_id,
        )


class CanSubmitHomework(BasePermission):
    """Student can submit homework."""
    def has_permission(self, request, view):
        return _role(request.user) == 'student'


class CanManageSchemes(BasePermission):
    """Mudeer/idaarah: all. Ustaadh: own schemes."""
    def has_permission(self, request, view):
        return _role(request.user) in ('ustaadh', 'mudeer', 'idaarah')

    def has_object_permission(self, request, view, obj):
        role = _role(request.user)
        if role in ('mudeer', 'idaarah'):
            return True
        return obj.teacher == request.user and obj.madrasah == request.user.madrasah


class CanViewLessonPlans(BasePermission):
    """Students/parents see published. Teachers see own. Mudeer/idaarah see all."""
    def has_permission(self, request, view):
        return _role(request.user) in ('ustaadh', 'mudeer', 'idaarah', 'student', 'parent')

    def has_object_permission(self, request, view, obj):
        role = _role(request.user)
        if role in ('mudeer', 'idaarah'):
            return True
        if role == 'ustaadh':
            return obj.teacher == request.user
        # Students and parents only see published
        return obj.is_published
