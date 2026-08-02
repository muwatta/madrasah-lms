from django.urls import path
from . import enrollment_views

urlpatterns = [
    path('', enrollment_views.EnrollmentListView.as_view(), name='enrollment-list'),
    path('my/', enrollment_views.StudentEnrollmentsView.as_view(), name='student-enrollments'),
    path('teacher/students/', enrollment_views.TeacherStudentsView.as_view(), name='teacher-students'),
    path('teacher/classes/', enrollment_views.TeacherClassesView.as_view(), name='teacher-classes'),
    path('class-teacher/classes/', enrollment_views.ClassTeacherClassesView.as_view(), name='class-teacher-classes'),
    path('<int:pk>/', enrollment_views.EnrollmentDetailView.as_view(), name='enrollment-detail'),
]
