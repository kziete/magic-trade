from django.urls import path
from .views import CardListView, CardDetailView, VariantListView, AvailableListView, InventoryListView, InventoryDetailView, AvailableWantedByView, UserInventoryListView, InventoryImportView, UserProfileView, LatestAvailableListView, WishlistListView, WishlistDetailView, WishlistMatchesView, UserWishlistListView, ContactUserView

urlpatterns = [
    path('cards/', CardListView.as_view()),
    path('cards/<int:pk>/', CardDetailView.as_view()),
    path('cards/<int:card_id>/variants/', VariantListView.as_view()),
    path('cards/<int:card_id>/available/', AvailableListView.as_view()),
    path('available/latest/', LatestAvailableListView.as_view()),
    path('inventory/', InventoryListView.as_view()),
    path('inventory/<int:pk>/', InventoryDetailView.as_view()),
    path('inventory/<int:pk>/wanted/', AvailableWantedByView.as_view()),
    path('inventory/import/', InventoryImportView.as_view()),
    path('wishlist/', WishlistListView.as_view()),
    path('wishlist/<int:pk>/', WishlistDetailView.as_view()),
    path('wishlist/<int:pk>/matches/', WishlistMatchesView.as_view()),
    path('users/<str:username>/inventory/', UserInventoryListView.as_view()),
    path('users/<str:username>/wishlist/', UserWishlistListView.as_view()),
    path('users/<str:username>/', UserProfileView.as_view()),
    path('users/<str:username>/contact/', ContactUserView.as_view()),
]
