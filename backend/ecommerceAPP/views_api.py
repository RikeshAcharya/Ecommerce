from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import *
from .serializers import *
from .permissions import IsAdminOrB2BOwner, IsOrderOwnerOrAdmin, IsB2BUser, IsVerifiedB2B
import uuid
from decimal import Decimal

# ----- Product & Category (Read‑only for non‑admins) -----
class ProductCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and retrieve product categories.
    """
    queryset = ProductCategory.objects.filter(is_active=True)
    serializer_class = ProductCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and retrieve products.
    Pricing is adjusted based on the logged‑in user's type (B2C / B2B).
    """
    queryset = Product.objects.filter(is_active=True)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        # Optional filtering by category or search
        category_slug = self.request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(brand__icontains=search)
            )
        return queryset


# ----- Cart API -----
class CartViewSet(viewsets.ViewSet):
    """
    Manage the user's cart.
    """
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

            # Set cart type based on user
            if request.user.user_type == UserType.B2B:
                cart.is_b2b_order = True
                cart.save()

            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                variant=variant,
                defaults={'quantity': quantity}
            )
            if not created:
                cart_item.quantity += quantity
                cart_item.save()

            # Return updated cart
            return Response(CartSerializer(cart, context={'request': request}).data, status=status.HTTP_200_OK)
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
        else:
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
        cart_item.delete()
        return Response(CartSerializer(cart, context={'request': request}).data)

    @action(detail=False, methods=['post'])
    def clear(self, request):
        cart = self.get_cart(request)
        cart.items.all().delete()
        return Response({'message': 'Cart cleared'})


# ----- Order API -----
class OrderViewSet(viewsets.ModelViewSet):
    """
    List, retrieve, and create orders.
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users see only their own orders; admins see all
        if self.request.user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        cart = get_object_or_404(Cart, user=self.request.user)
        items = cart.items.all()
        if not items:
            raise serializers.ValidationError("Cart is empty")
        total = cart.get_total_price()

        # Create order with data from the request
        order = serializer.save(
            user=self.request.user,
            order_number=f"ORD-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
            order_type='b2b' if cart.is_b2b_order else 'b2c',
            total_amount=total,
            payment_status='pending'
        )

        # Transfer cart items to order items
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
        # Clear cart
        items.delete()
        cart.delete()


# ----- Review API -----
class ReviewViewSet(viewsets.ModelViewSet):
    """
    List and create reviews.
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Check if user has purchased this product (optional)
        # For now, allow any authenticated user
        serializer.save(user=self.request.user)


# ----- Wishlist API -----
class WishlistViewSet(viewsets.ModelViewSet):
    """
    List, add, and remove wishlist items.
    """
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ----- B2B Quote API -----
class B2BQuoteViewSet(viewsets.ModelViewSet):
    """
    List and create B2B quotes.
    Only B2B users can create quotes.
    """
    serializer_class = B2BQuoteSerializer
    permission_classes = [IsB2BUser]  # from permissions.py

    def get_queryset(self):
        if self.request.user.is_staff:
            return B2BQuote.objects.all()
        return B2BQuote.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, status='pending')


# ----- Company Address API -----
class CompanyAddressViewSet(viewsets.ModelViewSet):
    """
    Manage company addresses.
    """
    serializer_class = CompanyAddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CompanyAddress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)


# ----- User Registration and Profile -----
class UserRegistrationView(generics.CreateAPIView):
    """
    Register a new user.
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Retrieve and update the logged‑in user's profile.
    """
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# ----- Admin only: Approve B2B applications, manage quotes -----
class AdminB2BQuoteApprovalView(generics.UpdateAPIView):
    """
    Admin endpoint to approve/reject B2B quotes.
    """
    queryset = B2BQuote.objects.all()
    serializer_class = B2BQuoteSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_update(self, serializer):
        # Only allow updating status and offered_price
        status = serializer.validated_data.get('status')
        offered_price = serializer.validated_data.get('offered_price')
        if status in ['approved', 'rejected']:
            serializer.save()
        else:
            raise serializers.ValidationError("Invalid status")