from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'traits', views.CharacterTraitViewSet, basename='character-trait')
router.register(r'evaluations', views.CharacterEvaluationViewSet, basename='character-evaluation')

urlpatterns = [
    path('', include(router.urls)),
]
