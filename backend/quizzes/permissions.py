from rest_framework.permissions import BasePermission


def _role(user):
    return getattr(user, 'role', None)


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return _role(request.user) == 'student'


class IsUstaadh(BasePermission):
    def has_permission(self, request, view):
        return _role(request.user) == 'ustaadh'


class IsMudeer(BasePermission):
    def has_permission(self, request, view):
        return _role(request.user) in ('mudeer', 'idaarah')


class IsAdminOrTeacher(BasePermission):
    def has_permission(self, request, view):
        return _role(request.user) in ('mudeer', 'idaarah', 'ustaadh')


class CanManageQuizzes(BasePermission):
    def has_permission(self, request, view):
        return _role(request.user) in ('mudeer', 'idaarah', 'ustaadh')

    def has_object_permission(self, request, view, obj):
        role = _role(request.user)
        if role in ('mudeer', 'idaarah'):
            return obj.madrasah == request.user.madrasah
        return obj.created_by == request.user and obj.madrasah == request.user.madrasah


class CanViewQuiz(BasePermission):
    def has_permission(self, request, view):
        return _role(request.user) in ('mudeer', 'idaarah', 'ustaadh', 'student')

    def has_object_permission(self, request, view, obj):
        role = _role(request.user)
        if role in ('mudeer', 'idaarah'):
            return obj.madrasah == request.user.madrasah
        if role == 'ustaadh':
            return obj.created_by == request.user and obj.madrasah == request.user.madrasah
        return obj.is_published and obj.madrasah == request.user.madrasah


class CanTakeQuiz(BasePermission):
    def has_permission(self, request, view):
        return _role(request.user) == 'student'


class CanManageQuestions(BasePermission):
    def has_permission(self, request, view):
        return _role(request.user) in ('mudeer', 'idaarah', 'ustaadh')

    def has_object_permission(self, request, view, obj):
        role = _role(request.user)
        if role in ('mudeer', 'idaarah'):
            return obj.madrasah == request.user.madrasah
        return obj.created_by == request.user and obj.madrasah == request.user.madrasah


class CanViewQuestionBank(BasePermission):
    def has_permission(self, request, view):
        return _role(request.user) in ('mudeer', 'idaarah', 'ustaadh')


class CanViewResults(BasePermission):
    """Students see own results; teachers/admins see all."""
    def has_permission(self, request, view):
        return _role(request.user) in ('mudeer', 'idaarah', 'ustaadh', 'student')


class CanManageViolations(BasePermission):
    def has_permission(self, request, view):
        return _role(request.user) in ('mudeer', 'idaarah', 'ustaadh')
