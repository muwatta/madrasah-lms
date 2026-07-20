from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/subjects/', include('curriculum.urls')),
    path('api/', include('assessments.urls')),
    path('api/', include('results.urls')),
    path('api/', include('results.dashboard_urls')),
    path('api/enrollments/', include('curriculum.enrollment_urls')),
    path('api/school/', include('school_ops.urls')),
    path('api/academic/', include('academic.urls')),
    path('api/lessons/', include('lessons.urls')),
    path('api/admissions/', include('admissions.urls')),
]
