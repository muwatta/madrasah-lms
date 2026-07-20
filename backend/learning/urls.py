from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'paths', views.LearningPathViewSet, basename='learningpath')
router.register(r'decks', views.FlashCardDeckViewSet, basename='flashcarddeck')

urlpatterns = [
    path('', include(router.urls)),
    path(
        'decks/<int:deck_pk>/cards/',
        views.FlashCardViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='deck-cards-list'
    ),
    path(
        'decks/<int:deck_pk>/cards/<int:pk>/',
        views.FlashCardViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}),
        name='deck-cards-detail'
    ),
    path(
        'decks/<int:deck_pk>/cards/review/<int:pk>/',
        views.FlashCardViewSet.as_view({'post': 'review'}),
        name='deck-cards-review'
    ),
    path(
        'decks/<int:deck_pk>/cards/due/',
        views.FlashCardViewSet.as_view({'get': 'due'}),
        name='deck-cards-due'
    ),
]
