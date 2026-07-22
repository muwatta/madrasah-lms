"""
Fasaaha permission classes.

Enforces role-based access for:
- Students: view missions, submit attempts, view own progress
- Teachers (ustaadh): manage missions, review attempts, view class analytics
- Admin (mudeer/idaarah): full access
"""
from __future__ import annotations

from rest_framework.permissions import BasePermission


def _role(user):
    return getattr(user, 'role', None) or getattr(user, 'user_type', None)


def _is_mudeer_or_idaarah(user):
    return _role(user) in ('mudeer', 'idaarah')


#  Simple role permissions


class IsFasaahaStudent(BasePermission):
    """Allow only student role."""
    def has_permission(self, request, view):
        return _role(request.user) == 'student'


class IsFasaahaTeacher(BasePermission):
    """Allow only ustaadh (teacher) role."""
    def has_permission(self, request, view):
        return _role(request.user) == 'ustaadh'


class IsFasaahaAdmin(BasePermission):
    """Allow mudeer and idaarah roles."""
    def has_permission(self, request, view):
        return _is_mudeer_or_idaarah(request.user)


#  Composite / functional permissions


class CanViewMissions(BasePermission):
    """Any authenticated user can view missions."""
    def has_permission(self, request, view):
        return request.user.is_authenticated


class CanManageMissions(BasePermission):
    """Teachers and admins can create/edit missions."""
    def has_permission(self, request, view):
        return _role(request.user) in ('ustaadh', 'mudeer', 'idaarah')

    def has_object_permission(self, request, view, obj):
        if _is_mudeer_or_idaarah(request.user):
            return True
        return obj.created_by == request.user and obj.madrasah == request.user.madrasah  # pyright: ignore[reportAttributeAccessIssue]


class CanSubmitAttempt(BasePermission):
    """Only students can submit speaking attempts."""
    def has_permission(self, request, view):
        return _role(request.user) == 'student'


class CanViewOwnAttempts(BasePermission):
    """Students see own attempts, teachers see class attempts, admins see all."""
    def has_permission(self, request, view):
        return _role(request.user) in ('student', 'ustaadh', 'mudeer', 'idaarah')


class CanReviewAttempts(BasePermission):
    """Teachers and admins can review student attempts."""
    def has_permission(self, request, view):
        return _role(request.user) in ('ustaadh', 'mudeer', 'idaarah')


class CanManageAssignments(BasePermission):
    """Teachers and admins can assign missions."""
    def has_permission(self, request, view):
        return _role(request.user) in ('ustaadh', 'mudeer', 'idaarah')


class CanViewProgress(BasePermission):
    """Students see own progress, teachers see class, admins see all."""
    def has_permission(self, request, view):
        return _role(request.user) in ('student', 'ustaadh', 'mudeer', 'idaarah')


class CanManageLevels(BasePermission):
    """Only admins can manage speaking levels."""
    def has_permission(self, request, view):
        return _is_mudeer_or_idaarah(request.user)


class CanManageCategories(BasePermission):
    """Only admins can manage mission categories."""
    def has_permission(self, request, view):
        return _is_mudeer_or_idaarah(request.user)


class CanViewAnalytics(BasePermission):
    """Teachers see class analytics, admins see all."""
    def has_permission(self, request, view):
        return _role(request.user) in ('ustaadh', 'mudeer', 'idaarah')


class CanViewSchoolAnalytics(BasePermission):
    """Only admins can view school-wide analytics."""
    def has_permission(self, request, view):
        return _is_mudeer_or_idaarah(request.user)
