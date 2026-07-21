from django.urls import path
from . import dashboard_views

urlpatterns = [
    path('teacher/', dashboard_views.TeacherDashboardView.as_view(), name='teacher-dashboard'),
    path('teacher/student/<int:student_id>/performance/', dashboard_views.TeacherStudentPerformanceView.as_view(), name='teacher-student-performance'),
    path('parent/', dashboard_views.ParentDashboardView.as_view(), name='parent-dashboard'),
    path('admin/', dashboard_views.AdminDashboardView.as_view(), name='admin-dashboard'),
    path('student/', dashboard_views.StudentDashboardView.as_view(), name='student-dashboard'),
    path('board/', dashboard_views.BoardDashboardView.as_view(), name='board-dashboard'),
]
