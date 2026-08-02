from rest_framework.permissions import IsAuthenticated, BasePermission, SAFE_METHODS

from curriculum.models import SchoolClass


def is_admin(user):
    return user.is_authenticated and user.role in ('mudeer', 'idaarah')


def is_class_teacher(user, school_class):
    """True if the user is an admin or the class teacher of `school_class`."""
    if is_admin(user):
        return True
    if not user.is_authenticated or user.role != 'ustaadh':
        return False
    if school_class is None:
        return False
    return school_class.class_teacher_id == user.id


def is_any_class_teacher(user):
    """True if the user is an admin or a class teacher for at least one class."""
    if is_admin(user):
        return True
    if not user.is_authenticated or user.role != 'ustaadh':
        return False
    return SchoolClass.objects.filter(madrasah=user.madrasah, class_teacher=user).exists()


class IsApprovedMember(BasePermission):
    """Allow any authenticated user whose role has been assigned by an admin.

    Guests (self-registered, pending approval) are denied.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role != 'guest'
        )


class IsMudeer(BasePermission):
    """Allow only mudeer (principal) and idaarah (admin) roles."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('mudeer', 'idaarah')


class IsStaff(BasePermission):
    """Allow mudeer (principal), ustaadh (teacher), and idaarah (admin) roles."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('mudeer', 'ustaadh', 'idaarah')


class IsMudeerOrReadOnly(IsAuthenticated):
    """Allow any authenticated user to read, but only mudeer/idaarah to write."""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user.role in ('mudeer', 'idaarah')


class IsAdminOrTeacher(BasePermission):
    """Allow mudeer, idaarah, or ustaadh roles."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('mudeer', 'idaarah', 'ustaadh')


class IsStudent(BasePermission):
    """Allow only student role."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'student'


class IsParent(BasePermission):
    """Allow only parent role."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'parent'


class CanManageClassSubjects(BasePermission):
    """Allow admins and class teachers to manage the subjects attached to a class.

    All staff may read class subjects, but only admins and the class teacher of
    the target class may create or delete them.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if is_admin(user):
            return True
        if user.role != 'ustaadh':
            return False
        if request.method in SAFE_METHODS:
            return True
        return is_any_class_teacher(user)

    def has_object_permission(self, request, view, obj):
        school_class = getattr(obj, 'school_class', None)
        if school_class is None:
            school_class = obj
        return is_class_teacher(request.user, school_class)


class CanManageEnrollments(BasePermission):
    """Allow admins and class teachers to create/delete enrollments.

    All staff (mudeer, idaarah, ustaadh) may read enrollments (e.g. for result
    entry), but only admins and the class teacher of the enrollment's class
    may create or delete them.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if is_admin(user):
            return True
        if user.role != 'ustaadh':
            return False
        if request.method in SAFE_METHODS:
            return True
        return is_any_class_teacher(user)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if is_admin(user):
            return True
        if user.role != 'ustaadh':
            return False
        if request.method in SAFE_METHODS:
            return (
                (obj.school_class is not None and obj.school_class.class_teacher_id == user.id)
                or obj.ustaadh_id == user.id
            )
        return obj.school_class is not None and obj.school_class.class_teacher_id == user.id
