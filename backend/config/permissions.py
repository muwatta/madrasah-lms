from rest_framework.permissions import IsAuthenticated, BasePermission


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
