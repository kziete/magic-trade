from django.urls import path
from .views import CardListView, VariantListView, AvailableListView

urlpatterns = [
    path('cards/', CardListView.as_view()),
    path('cards/<int:card_id>/variants/', VariantListView.as_view()),
    path('cards/<int:card_id>/available/', AvailableListView.as_view()),
]
