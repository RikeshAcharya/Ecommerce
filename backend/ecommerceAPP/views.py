from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.db.models import Q, Avg, Count
from django.http import JsonResponse, HttpResponseRedirect
from django.urls import reverse, reverse_lazy
from django.utils import timezone
from decimal import Decimal
import uuid

# ─── NEW: REST Framework imports ───
from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAdminUser
from .serializers import ProductCategorySerializer   # <-- import your serializer

from . import models
from .models import UserType, CustomUser, Product, Cart, CartItem, Order, OrderItem, Review, Wishlist, B2BQuote

# --- Mixins ---
class B2BRequiredMixin(UserPassesTestMixin):
    def test_func(self):
        return self.request.user.is_authenticated and self.request.user.user_type == UserType.B2B

    def handle_no_permission(self):
        messages.error(self.request, "You need a B2B account to access this page.")
        return redirect('product_list')

# --- Home / Product listing ---
class ProductListView(ListView):
    model = Product
    template_name = 'shop/product_list.html'
    context_object_name = 'products'
    paginate_by = 12

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True)
        category_slug = self.kwargs.get('category_slug')
        if category_slug:
            category = get_object_or_404(models.ProductCategory, slug=category_slug)
            queryset = queryset.filter(category=category)
        search_query = self.request.GET.get('q')
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(brand__icontains=search_query)
            )
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = models.ProductCategory.objects.filter(is_active=True)
        return context

class ProductDetailView(DetailView):
    model = Product
    template_name = 'shop/product_detail.html'
    context_object_name = 'product'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        product = self.object
        context['reviews'] = product.reviews.all().order_by('-created_at')
        context['average_rating'] = product.average_rating
        context['images'] = product.images.all()
        context['variants'] = product.variants.all()
        # Check if product is in wishlist
        if self.request.user.is_authenticated:
            context['in_wishlist'] = Wishlist.objects.filter(user=self.request.user, product=product).exists()
        else:
            context['in_wishlist'] = False
        return context

# --- Cart views ---
def get_or_create_cart(request):
    if request.user.is_authenticated:
        cart, created = Cart.objects.get_or_create(user=request.user, session_id=None)
        if not created and cart.session_id:
            # Migrate session cart to user cart
            session_cart = Cart.objects.filter(session_id=request.session.get('cart_id')).first()
            if session_cart:
                for item in session_cart.items.all():
                    item.cart = cart
                    item.save()
                session_cart.delete()
            cart.session_id = None
            cart.save()
    else:
        cart_id = request.session.get('cart_id')
        if cart_id:
            cart = Cart.objects.filter(session_id=cart_id).first()
            if not cart:
                cart = Cart.objects.create(session_id=cart_id)
        else:
            cart = Cart.objects.create(session_id=str(uuid.uuid4()))
            request.session['cart_id'] = cart.session_id
    return cart

@login_required
def add_to_cart(request, product_id):
    product = get_object_or_404(Product, id=product_id, is_active=True)
    cart = get_or_create_cart(request)
    variant_id = request.POST.get('variant')
    quantity = int(request.POST.get('quantity', 1))

    # Check if user is B2B and set cart type
    if request.user.is_authenticated and request.user.user_type == UserType.B2B:
        cart.is_b2b_order = True
        cart.save()

    cart_item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        variant_id=variant_id or None,
        defaults={'quantity': quantity}
    )
    if not created:
        cart_item.quantity += quantity
        cart_item.save()

    messages.success(request, f"Added {product.name} to your cart.")
    return redirect('cart_detail')

@login_required
def cart_detail(request):
    cart = get_or_create_cart(request)
    items = cart.items.all()
    total = cart.get_total_price()
    context = {
        'cart': cart,
        'items': items,
        'total': total,
    }
    return render(request, 'shop/cart.html', context)

@login_required
def update_cart_item(request, item_id):
    cart_item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'increase':
            cart_item.quantity += 1
        elif action == 'decrease' and cart_item.quantity > 1:
            cart_item.quantity -= 1
        elif action == 'remove':
            cart_item.delete()
            messages.success(request, "Item removed from cart.")
            return redirect('cart_detail')
        cart_item.save()
    return redirect('cart_detail')

# --- Checkout ---
@login_required
def checkout(request):
    cart = get_or_create_cart(request)
    items = cart.items.all()
    if not items:
        messages.warning(request, "Your cart is empty.")
        return redirect('product_list')

    total = cart.get_total_price()
    addresses = request.user.addresses.all()

    if request.method == 'POST':
        # Create order
        address_id = request.POST.get('address_id')
        if address_id:
            address = get_object_or_404(models.CompanyAddress, id=address_id, user=request.user)
            shipping_address = f"{address.address_line1}\n{address.address_line2}\n{address.city}, {address.state} {address.zip_code}\n{address.country}"
        else:
            # Use form fields
            shipping_address = request.POST.get('shipping_address')
            shipping_city = request.POST.get('shipping_city')
            shipping_state = request.POST.get('shipping_state')
            shipping_zip = request.POST.get('shipping_zip')
            shipping_country = request.POST.get('shipping_country')
            # For simplicity, we assume the address is provided as a single text field.
            # You can expand to separate fields.

        order = Order.objects.create(
            user=request.user,
            order_number=f"ORD-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
            order_type='b2b' if cart.is_b2b_order else 'b2c',
            total_amount=total,
            shipping_address=shipping_address,
            shipping_city=request.POST.get('shipping_city', ''),
            shipping_state=request.POST.get('shipping_state', ''),
            shipping_zip=request.POST.get('shipping_zip', ''),
            shipping_country=request.POST.get('shipping_country', ''),
            payment_method=request.POST.get('payment_method', 'cod'),
            payment_status='pending',
            delivery_instructions=request.POST.get('delivery_instructions', ''),
            require_signature=bool(request.POST.get('require_signature', False)),
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

        # Clear cart
        items.delete()
        # Optionally delete cart
        cart.delete()

        messages.success(request, f"Order {order.order_number} placed successfully!")
        return redirect('order_detail', order_id=order.id)

    context = {
        'cart': cart,
        'items': items,
        'total': total,
        'addresses': addresses,
    }
    return render(request, 'shop/checkout.html', context)

# --- Orders ---
@login_required
def order_list(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'shop/order_list.html', {'orders': orders})

@login_required
def order_detail(request, order_id):
    order = get_object_or_404(Order, id=order_id, user=request.user)
    return render(request, 'shop/order_detail.html', {'order': order})

# --- Reviews ---
@login_required
def add_review(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    if request.method == 'POST':
        rating = request.POST.get('rating')
        comment = request.POST.get('comment')
        if rating and comment:
            review, created = Review.objects.get_or_create(
                product=product,
                user=request.user,
                defaults={'rating': rating, 'comment': comment}
            )
            if not created:
                review.rating = rating
                review.comment = comment
                review.save()
            # Update product average rating
            avg = Review.objects.filter(product=product).aggregate(Avg('rating'))['rating__avg']
            product.average_rating = avg or 0
            product.total_reviews = Review.objects.filter(product=product).count()
            product.save()
            messages.success(request, "Review submitted.")
        else:
            messages.error(request, "Please provide a rating and comment.")
    return redirect('product_detail', slug=product.slug)

# --- Wishlist ---
@login_required
def toggle_wishlist(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    wishlist_item = Wishlist.objects.filter(user=request.user, product=product).first()
    if wishlist_item:
        wishlist_item.delete()
        messages.info(request, "Removed from wishlist.")
    else:
        Wishlist.objects.create(user=request.user, product=product)
        messages.success(request, "Added to wishlist.")
    return redirect(request.META.get('HTTP_REFERER', 'product_list'))

@login_required
def wishlist_view(request):
    items = Wishlist.objects.filter(user=request.user).select_related('product')
    return render(request, 'shop/wishlist.html', {'items': items})

# --- B2B Quote ---
@login_required
def request_quote(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    if request.user.user_type != UserType.B2B:
        messages.error(request, "Only B2B users can request quotes.")
        return redirect('product_detail', slug=product.slug)

    if request.method == 'POST':
        quantity = int(request.POST.get('quantity', 1))
        requested_price = Decimal(request.POST.get('requested_price'))
        notes = request.POST.get('notes', '')
        quote = B2BQuote.objects.create(
            user=request.user,
            product=product,
            quantity=quantity,
            requested_price=requested_price,
            notes=notes,
            status='pending'
        )
        messages.success(request, "Quote request submitted successfully.")
        return redirect('quote_list')
    return render(request, 'shop/request_quote.html', {'product': product})

@login_required
def quote_list(request):
    quotes = B2BQuote.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'shop/quote_list.html', {'quotes': quotes})

# --- User Profile / Addresses ---
@login_required
def profile_view(request):
    return render(request, 'shop/profile.html', {'user': request.user})

@login_required
def address_list(request):
    addresses = request.user.addresses.all()
    return render(request, 'shop/address_list.html', {'addresses': addresses})

@login_required
def add_address(request):
    if request.method == 'POST':
        # Simple form processing; you can use a ModelForm for cleaner code
        data = request.POST
        address = models.CompanyAddress.objects.create(
            user=request.user,
            address_type=data.get('address_type'),
            company_name=data.get('company_name'),
            address_line1=data.get('address_line1'),
            address_line2=data.get('address_line2', ''),
            city=data.get('city'),
            state=data.get('state'),
            zip_code=data.get('zip_code'),
            country=data.get('country'),
            is_default=data.get('is_default', False),
            contact_person=data.get('contact_person'),
            contact_phone=data.get('contact_phone'),
        )
        if address.is_default:
            # Unset other defaults
            request.user.addresses.exclude(id=address.id).update(is_default=False)
        messages.success(request, "Address added.")
        return redirect('address_list')
    return render(request, 'shop/add_address.html')

@login_required
def delete_address(request, address_id):
    address = get_object_or_404(models.CompanyAddress, id=address_id, user=request.user)
    address.delete()
    messages.success(request, "Address deleted.")
    return redirect('address_list')


# ──────────────────────────────────────────────────────────────
# ─── NEW: REST API ViewSet for ProductCategory ─────────────
# ──────────────────────────────────────────────────────────────
'''
class ProductCategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for product categories.
    - Only admin users can create, update, or delete.
    - Any authenticated user can list and retrieve.
    """
    queryset = models.ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    permission_classes = [IsAdminUser]   # staff only for write operations

    # Optional: if you want to allow read-only for non‑staff, you can override:
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]  # or [permissions.IsAuthenticated()]
        return [IsAdminUser()]
        '''