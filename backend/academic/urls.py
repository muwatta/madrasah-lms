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
]
