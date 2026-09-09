from django.db.models import Q
from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from django.http import JsonResponse
import uuid
import stripe
import hashlib
import hmac
import logging
from decimal import Decimal

from .models import *
from .serializers import *
from .permissions import IsAdminOrB2BOwner, IsOrderOwnerOrAdmin, IsB2BUser, IsVerifiedB2B

logger = logging.getLogger(__name__)

# ─── STRIPE (if not configured, set secret key in settings) ───
stripe.api_key = settings.STRIPE_SECRET_KEY

# ─── Product & Category ───
class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticatedOrReadOnly()]


class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer

    def get_queryset(self):
        try:
            queryset = Product.objects.all()
            if not (self.request.user.is_authenticated and self.request.user.is_staff):
                queryset = queryset.filter(is_active=True)

            category_slug = self.request.query_params.get('category')
            if category_slug:
                queryset = queryset.filter(category__slug=category_slug)

            featured = self.request.query_params.get('featured')
            if featured and featured.lower() == 'true':
                queryset = queryset.filter(is_featured=True)

            search = self.request.query_params.get('search')
            if search:
                search = search.strip()
                logger.info(f"Searching for: '{search}'")
                queryset = queryset.filter(
                    Q(name__icontains=search) |
                    Q(description__icontains=search) |
                    Q(brand__icontains=search)
                )
            return queryset
        except Exception as e:
            logger.error(f"Error in get_queryset: {e}")
            raise


# ─── Cart API ───
class CartViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_cart(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return cart

    def list(self, request):
        cart = self.get_cart(request)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        cart = self.get_cart(request)
        serializer = CartItemSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            product = serializer.validated_data['product']
            variant = serializer.validated_data.get('variant')
            quantity = serializer.validated_data.get('quantity', 1)

            if variant:
                if variant.stock < quantity:
                    return Response({'error': 'Not enough stock for this variant.'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                if product.stock < quantity:
                    return Response({'error': 'Not enough stock.'}, status=status.HTTP_400_BAD_REQUEST)

            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                variant=variant,
                defaults={'quantity': quantity}
            )

            if not created:
                new_quantity = cart_item.quantity + quantity
                if variant:
                    if variant.stock < new_quantity:
                        return Response({'error': 'Not enough stock.'}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    if product.stock < new_quantity:
                        return Response({'error': 'Not enough stock.'}, status=status.HTTP_400_BAD_REQUEST)
                if variant:
                    variant.stock -= quantity
                    variant.save()
                else:
                    product.stock -= quantity
                    product.save()
                cart_item.quantity = new_quantity
                cart_item.save()
            else:
                if variant:
                    variant.stock -= quantity
                    variant.save()
                else:
                    product.stock -= quantity
                    product.save()

            if request.user.user_type == UserType.B2B:
                cart.is_b2b_order = True
                cart.save()

            return Response(
                CartSerializer(cart, context={'request': request}).data,
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def update_item(self, request):
        item_id = request.data.get('item_id')
        quantity = request.data.get('quantity')
        if not item_id or quantity is None:
            return Response({'error': 'item_id and quantity required'}, status=status.HTTP_400_BAD_REQUEST)
        cart = self.get_cart(request)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
        if quantity <= 0:
            cart_item.delete()
            return Response(CartSerializer(cart, context={'request': request}).data)

        product = cart_item.product
        variant = cart_item.variant
        delta = quantity - cart_item.quantity
        if delta > 0:
            if variant:
                if variant.stock < delta:
                    return Response({'error': 'Not enough stock.'}, status=status.HTTP_400_BAD_REQUEST)
                variant.stock -= delta
                variant.save()
            else:
                if product.stock < delta:
                    return Response({'error': 'Not enough stock.'}, status=status.HTTP_400_BAD_REQUEST)
                product.stock -= delta
                product.save()
        elif delta < 0:
            if variant:
                variant.stock += abs(delta)
                variant.save()
            else:
                product.stock += abs(delta)
                product.save()

        cart_item.quantity = quantity
        cart_item.save()
        return Response(CartSerializer(cart, context={'request': request}).data)

    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        item_id = request.data.get('item_id')
        if not item_id:
            return Response({'error': 'item_id required'}, status=status.HTTP_400_BAD_REQUEST)
        cart = self.get_cart(request)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)

        product = cart_item.product
        variant = cart_item.variant
        if variant:
            variant.stock += cart_item.quantity
            variant.save()
        else:
            product.stock += cart_item.quantity
            product.save()

        cart_item.delete()
        return Response(CartSerializer(cart, context={'request': request}).data)

    @action(detail=False, methods=['post'])
    def clear(self, request):
        cart = self.get_cart(request)
        for item in cart.items.all():
            if item.variant:
                item.variant.stock += item.quantity
                item.variant.save()
            else:
                item.product.stock += item.quantity
                item.product.save()
        cart.items.all().delete()
        return Response({'message': 'Cart cleared'})

    def create(self, request):
        return self.add_item(request)

    def update(self, request, pk=None):
        quantity = request.data.get('quantity')
        if quantity is None:
            return Response({'error': 'quantity required'}, status=status.HTTP_400_BAD_REQUEST)
        cart = self.get_cart(request)
        cart_item = get_object_or_404(CartItem, id=pk, cart=cart)
        if quantity <= 0:
            product = cart_item.product
            variant = cart_item.variant
            if variant:
                variant.stock += cart_item.quantity
                variant.save()
            else:
                product.stock += cart_item.quantity
                product.save()
            cart_item.delete()
        else:
            delta = quantity - cart_item.quantity
            if delta > 0:
                if cart_item.variant:
                    if cart_item.variant.stock < delta:
                        return Response({'error': 'Not enough stock.'}, status=status.HTTP_400_BAD_REQUEST)
                    cart_item.variant.stock -= delta
                    cart_item.variant.save()
                else:
                    if cart_item.product.stock < delta:
                        return Response({'error': 'Not enough stock.'}, status=status.HTTP_400_BAD_REQUEST)
                    cart_item.product.stock -= delta
                    cart_item.product.save()
            elif delta < 0:
                if cart_item.variant:
                    cart_item.variant.stock += abs(delta)
                    cart_item.variant.save()
                else:
                    cart_item.product.stock += abs(delta)
                    cart_item.product.save()
            cart_item.quantity = quantity
            cart_item.save()
        return Response(CartSerializer(cart, context={'request': request}).data)

    def destroy(self, request, pk=None):
        return self.remove_item(request)


# ─── Order API ───
class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        cart = get_object_or_404(Cart, user=self.request.user)
        items = cart.items.all()
        if not items:
            raise serializers.ValidationError("Cart is empty")
        total = cart.get_total_price()

        order = serializer.save(
            user=self.request.user,
            order_number=f"ORD-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
            order_type='b2b' if cart.is_b2b_order else 'b2c',
            total_amount=total,
            payment_status='pending'
        )

        for item in items:
            price = item.get_price()
            OrderItem.objects.create(
                order=order,
                product=item.product,
                variant=item.variant,
                quantity=item.quantity,
                price=price,
                total=price * item.quantity
            )
        items.delete()
        cart.delete()


# ─── Review API ───
class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ─── Wishlist API ───
class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ─── B2B Quote API ───
class B2BQuoteViewSet(viewsets.ModelViewSet):
    serializer_class = B2BQuoteSerializer
    permission_classes = [IsB2BUser]

    def get_queryset(self):
        if self.request.user.is_staff:
            return B2BQuote.objects.all()
        return B2BQuote.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, status='pending')


# ─── Company Address API ───
class CompanyAddressViewSet(viewsets.ModelViewSet):
    serializer_class = CompanyAddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CompanyAddress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)


# ─── User Registration and Profile ───
class UserRegistrationView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# ─── Admin quote approval ───
class AdminB2BQuoteApprovalView(generics.UpdateAPIView):
    queryset = B2BQuote.objects.all()
    serializer_class = B2BQuoteSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_update(self, serializer):
        status = serializer.validated_data.get('status')
        offered_price = serializer.validated_data.get('offered_price')
        if status in ['approved', 'rejected']:
            serializer.save()
        else:
            raise serializers.ValidationError("Invalid status")


class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['user_type', 'is_staff', 'is_active', 'is_verified']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['id', 'username', 'date_joined']


# ──────────────────────────────────────────────
# 💳 PAYMENT ENDPOINTS
# ──────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_stripe_checkout_session(request):
    order_id = request.data.get('order_id')
    order = get_object_or_404(Order, id=order_id, user=request.user)
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {'name': f'Order #{order.order_number}'},
                    'unit_amount': int(order.total_amount * 100),
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url='http://localhost:5173/payment-success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='http://localhost:5173/payment-cancel',
            metadata={'order_id': order.id},
        )
        return Response({'session_id': checkout_session.id, 'url': checkout_session.url})
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_esewa_payment(request):
    order_id = request.data.get('order_id')
    order = get_object_or_404(Order, id=order_id, user=request.user)
    amount = int(order.total_amount * 100)  # NPR in paisa
    transaction_uuid = f"ORD-{order.id}-{uuid.uuid4().hex[:6]}"
    message = f"{settings.ESEWA_MERCHANT_CODE},{transaction_uuid},{amount}"
    signature = hmac.new(
        settings.ESEWA_SECRET_KEY.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    data = {
        'amt': amount,
        'pdc': 0,
        'psc': 0,
        'txAmt': 0,
        'tAmt': amount,
        'pid': transaction_uuid,
        'scd': settings.ESEWA_MERCHANT_CODE,
        'su': 'http://localhost:5173/payment-success',
        'fu': 'http://localhost:5173/payment-cancel',
        'signature': signature,
    }
    return Response({'url': 'https://uat.esewa.com.np/epay/main', 'params': data})