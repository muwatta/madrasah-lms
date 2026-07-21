from django.urls import path
from . import landing_views

urlpatterns = [
    path('stats/', landing_views.landing_stats, name='landing-stats'),
]
