from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.http import JsonResponse
from .views_api import (
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
    UserViewSet,
    create_stripe_checkout_session,
    create_esewa_payment,
)

# --- Debug token view (unchanged) ---
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
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # API endpoints
    path('api/', include(router.urls)),
    path('api/register/', UserRegistrationView.as_view(), name='api_register'),
    path('api/profile/', UserProfileView.as_view(), name='api_profile'),
    path('api/admin/quotes/<int:pk>/', AdminB2BQuoteApprovalView.as_view(), name='api_admin_quote_approve'),

    # 💳 Payment
    path('api/create-stripe-session/', create_stripe_checkout_session, name='create_stripe_session'),
    path('api/create-esewa-payment/', create_esewa_payment, name='create_esewa_payment'),

    # JWT
    path('api/token/', DebugTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api-auth/', include('rest_framework.urls')),

    # Root – API status
    path('', lambda request: JsonResponse({"message": "Ecommerce API is running"})),
]