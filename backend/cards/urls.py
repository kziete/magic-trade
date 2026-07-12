from django.urls import path
from .views import CardListView, CardDetailView, VariantListView, AvailableListView, InventoryListView, InventoryDetailView, UserInventoryListView, InventoryImportView

urlpatterns = [
    path('cards/', CardListView.as_view()),
    path('cards/<int:pk>/', CardDetailView.as_view()),
    path('cards/<int:card_id>/variants/', VariantListView.as_view()),
    path('cards/<int:card_id>/available/', AvailableListView.as_view()),
    path('inventory/', InventoryListView.as_view()),
    path('inventory/<int:pk>/', InventoryDetailView.as_view()),
    path('inventory/import/', InventoryImportView.as_view()),
    path('users/<str:username>/inventory/', UserInventoryListView.as_view()),
]
