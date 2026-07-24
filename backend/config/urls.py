from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from users import urls as users_urls

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/v1/auth/', include(users_urls.auth_urlpatterns)),
    path('api/v1/public/', include('users.public_urls')),
    path('api/v1/users/', include(users_urls.user_urlpatterns)),

    path('api/v1/academic/', include('academic.urls')),
    path('api/v1/curriculum/', include('curriculum.urls')),
    path('api/v1/enrollments/', include('curriculum.enrollment_urls')),
    path('api/v1/lessons/', include('lessons.urls')),
    path('api/v1/assessments/', include('assessments.urls')),
    path('api/v1/results/', include('results.urls')),
    path('api/v1/dashboard/', include('results.dashboard_urls')),
    path('api/v1/school/', include('school_ops.urls')),
    path('api/v1/admissions/', include('admissions.urls')),
    path('api/v1/quran/', include('quran.urls')),
    path('api/v1/character/', include('character.urls')),
    path('api/v1/guidance/', include('guidance.urls')),
    path('api/v1/analytics/', include('analytics.urls')),
    path('api/v1/learning/', include('learning.urls')),
    path('api/v1/whatsapp/', include('whatsapp.urls')),
    path('api/webhooks/whatsapp/', include('whatsapp.webhook_urls')),
    path('api/v1/certificates/', include('certificates.urls')),
    path('api/v1/fasaaha/', include('fasaaha.urls')),
    path('api/v1/quizzes/', include('quizzes.urls')),
    path('api/v1/search/', include('search.urls')),
    path('api/v1/audit/', include('audit.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
