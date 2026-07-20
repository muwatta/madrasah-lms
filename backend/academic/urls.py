from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'sessions', views.SessionViewSet, basename='session')
router.register(r'terms', views.TermViewSet, basename='term')
router.register(r'calendar-events', views.AcademicCalendarViewSet, basename='academiccalendar')
router.register(r'class-arms', views.ClassArmViewSet, basename='classarm')
router.register(r'timetables', views.TimetableViewSet, basename='timetable')
router.register(r'timetable-slots', views.TimetableSlotViewSet, basename='timetableslot')

urlpatterns = [
    path('', include(router.urls)),
    path('student/timetable/', views.StudentTimetableView.as_view(), name='student-timetable'),
    path('teacher/timetable/', views.TeacherTimetableView.as_view(), name='teacher-timetable'),
    path('student/calendar-events/', views.StudentCalendarEventsView.as_view(), name='student-calendar-events'),
]
