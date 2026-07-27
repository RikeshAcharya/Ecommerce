from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
# Import your app's views (template views)
from django.shortcuts import redirect
from ecommerceAPP import views as template_views

# Import your API views
from ecommerceAPP.views_api import (
    ProductCategoryViewSet,
    ProductViewSet,
    CartViewSet,
    OrderViewSet,
    ReviewViewSet,
    WishlistViewSet,
    B2BQuoteViewSet,
    CompanyAddressViewSet,
    UserRegistrationView,
    UserProfileView,
    AdminB2BQuoteApprovalView,
)

# ----- DRF Router -----
router = DefaultRouter()
router.register(r'categories', ProductCategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'wishlist', WishlistViewSet, basename='wishlist')
router.register(r'quotes', B2BQuoteViewSet, basename='quote')
router.register(r'addresses', CompanyAddressViewSet, basename='address')

# ----- Main URL Patterns -----
urlpatterns = [
    path('', lambda request: redirect('http://localhost:5173/')),

    path('admin/', admin.site.urls),
    # Admin
    path('admin/', admin.site.urls),

    # ----- Template (frontend) URLs -----
    # These are the original Django views that render HTML
    path('', template_views.ProductListView.as_view(), name='product_list'),
    path('category/<slug:category_slug>/', template_views.ProductListView.as_view(), name='product_list_by_category'),
    path('product/<slug:slug>/', template_views.ProductDetailView.as_view(), name='product_detail'),
    path('cart/', template_views.cart_detail, name='cart_detail'),
    path('cart/add/<int:product_id>/', template_views.add_to_cart, name='add_to_cart'),
    path('cart/update/<int:item_id>/', template_views.update_cart_item, name='update_cart_item'),
    path('checkout/', template_views.checkout, name='checkout'),
    path('orders/', template_views.order_list, name='order_list'),
    path('orders/<int:order_id>/', template_views.order_detail, name='order_detail'),
    path('review/add/<int:product_id>/', template_views.add_review, name='add_review'),
    path('wishlist/', template_views.wishlist_view, name='wishlist'),
    path('wishlist/toggle/<int:product_id>/', template_views.toggle_wishlist, name='toggle_wishlist'),
    path('quotes/', template_views.quote_list, name='quote_list'),
    path('quotes/request/<int:product_id>/', template_views.request_quote, name='request_quote'),
    path('profile/', template_views.profile_view, name='profile'),
    path('addresses/', template_views.address_list, name='address_list'),
    path('addresses/add/', template_views.add_address, name='add_address'),
    path('addresses/delete/<int:address_id>/', template_views.delete_address, name='delete_address'),

    # ----- REST API (all endpoints start with /api/) -----
    path('api/', include(router.urls)),
    path('api/register/', UserRegistrationView.as_view(), name='api_register'),
    path('api/profile/', UserProfileView.as_view(), name='api_profile'),
    path('api/admin/quotes/<int:pk>/', AdminB2BQuoteApprovalView.as_view(), name='api_admin_quote_approve'),

    # DRF's built‑in authentication views (for session auth via the browsable API)
    path('api-auth/', include('rest_framework.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# ----- Serve static/media files during development -----
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)