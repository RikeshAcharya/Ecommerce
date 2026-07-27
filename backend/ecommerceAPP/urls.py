from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views_api import *

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'categories', ProductCategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'wishlist', WishlistViewSet, basename='wishlist')
router.register(r'quotes', B2BQuoteViewSet, basename='quote')
router.register(r'addresses', CompanyAddressViewSet, basename='address')

urlpatterns = [
    # Existing template URLs (keep them)
    path('', views.ProductListView.as_view(), name='product_list'),
    path('category/<slug:category_slug>/', views.ProductListView.as_view(), name='product_list_by_category'),
    path('product/<slug:slug>/', views.ProductDetailView.as_view(), name='product_detail'),
    path('cart/', views.cart_detail, name='cart_detail'),
    path('cart/add/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('cart/update/<int:item_id>/', views.update_cart_item, name='update_cart_item'),
    path('checkout/', views.checkout, name='checkout'),
    path('orders/', views.order_list, name='order_list'),
    path('orders/<int:order_id>/', views.order_detail, name='order_detail'),
    path('review/add/<int:product_id>/', views.add_review, name='add_review'),
    path('wishlist/', views.wishlist_view, name='wishlist'),
    path('wishlist/toggle/<int:product_id>/', views.toggle_wishlist, name='toggle_wishlist'),
    path('quotes/', views.quote_list, name='quote_list'),
    path('quotes/request/<int:product_id>/', views.request_quote, name='request_quote'),
    path('profile/', views.profile_view, name='profile'),
    path('addresses/', views.address_list, name='address_list'),
    path('addresses/add/', views.add_address, name='add_address'),
    path('addresses/delete/<int:address_id>/', views.delete_address, name='delete_address'),

    # API endpoints
    path('api/', include(router.urls)),
    path('api/register/', UserRegistrationView.as_view(), name='api_register'),
    path('api/profile/', UserProfileView.as_view(), name='api_profile'),
    path('api/admin/quotes/<int:pk>/', AdminB2BQuoteApprovalView.as_view(), name='api_admin_quote_approve'),

    # Optional: DRF auth login/logout (if using session auth)
    path('api-auth/', include('rest_framework.urls')),
]