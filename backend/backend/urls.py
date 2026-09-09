from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from ecommerceAPP import views
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
    UserViewSet,                     # ✅ ADDED
)

class DebugTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        print("🔍 Login attempt with data:", request.data)
        response = super().post(request, *args, **kwargs)
        if response.status_code != 200:
            print("❌ Error response:", response.data)
        else:
            print("✅ Login success, tokens issued")
        return response

router = DefaultRouter()
router.register(r'categories', ProductCategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'wishlist', WishlistViewSet, basename='wishlist')
router.register(r'quotes', B2BQuoteViewSet, basename='quote')
router.register(r'addresses', CompanyAddressViewSet, basename='address')
router.register(r'users', UserViewSet, basename='user')   # ✅ ADDED

# Direct fallback views
user_list = UserViewSet.as_view({'get': 'list', 'post': 'create'})
user_detail = UserViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})

urlpatterns = [
    path('admin/', admin.site.urls),

    # HTML views
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

    # API
    path('api/', include(router.urls)),

    # Direct user endpoints (fallback)
    path('api/users/', user_list, name='user-list'),
    path('api/users/<int:pk>/', user_detail, name='user-detail'),

    path('api/register/', UserRegistrationView.as_view(), name='api_register'),
    path('api/profile/', UserProfileView.as_view(), name='api_profile'),
    path('api/admin/quotes/<int:pk>/', AdminB2BQuoteApprovalView.as_view(), name='api_admin_quote_approve'),
    path('api/token/', DebugTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api-auth/', include('rest_framework.urls')),
]