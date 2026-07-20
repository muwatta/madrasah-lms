from django.contrib import admin
from django.urls import path, include
from users import landing_views as users_landing_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/landing/stats/', users_landing_views.landing_stats),
    path('api/subjects/', include('curriculum.urls')),
    path('api/', include('assessments.urls')),
    path('api/', include('results.urls')),
    path('api/', include('results.dashboard_urls')),
    path('api/enrollments/', include('curriculum.enrollment_urls')),
    path('api/school/', include('school_ops.urls')),
    path('api/academic/', include('academic.urls')),
    path('api/lessons/', include('lessons.urls')),
    path('api/admissions/', include('admissions.urls')),
    path('api/quran/', include('quran.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/guidance/', include('guidance.urls')),
    path('api/learning/', include('learning.urls')),
]
