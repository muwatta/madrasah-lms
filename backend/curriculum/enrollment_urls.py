from django.urls import path
from . import enrollment_views

urlpatterns = [
    path('', enrollment_views.EnrollmentListView.as_view(), name='enrollment-list'),
    path('my/', enrollment_views.StudentEnrollmentsView.as_view(), name='student-enrollments'),
    path('teacher/students/', enrollment_views.TeacherStudentsView.as_view(), name='teacher-students'),
]
