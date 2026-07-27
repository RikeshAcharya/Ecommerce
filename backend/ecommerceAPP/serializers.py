from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import *

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'user_type', 'company_name',
            'business_registration_number', 'tax_id', 'phone_number',
            'is_verified', 'is_vip', 'credit_limit', 'first_name',
            'last_name', 'created_at', 'is_staff', 'is_superuser',
        ]
        read_only_fields = ['is_verified', 'credit_limit', 'is_staff', 'is_superuser']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password', 'password2',
            'user_type', 'company_name', 'business_registration_number',
            'tax_id', 'phone_number', 'first_name', 'last_name'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        return user

class ProductCategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'slug', 'description', 'image', 'parent', 'children', 'product_count', 'is_active']
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True, 'allow_null': True},
            'description': {'required': False, 'allow_blank': True, 'allow_null': True},
            'image': {'required': False, 'allow_null': True},
        }
    
    def get_children(self, obj):
        if obj.children.exists():
            return ProductCategorySerializer(obj.children.filter(is_active=True), many=True).data
        return []
    
    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'is_primary', 'alt_text']

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'name', 'value', 'retail_price_adjustment',
            'wholesale_price_adjustment', 'stock', 'sku'
        ]
        extra_kwargs = {
            'sku': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)
    price = serializers.SerializerMethodField()
    wholesale_price_display = serializers.DecimalField(source='wholesale_price', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'sku', 'brand',
            'price', 'retail_price', 'wholesale_price',
            'wholesale_price_display', 'wholesale_min_quantity',
            'bulk_discount_tiers', 'stock', 'low_stock_threshold',
            'weight_grams', 'dimensions', 'category', 'category_name',
            'is_active', 'is_featured', 'average_rating', 'total_reviews',
            'images', 'variants', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True, 'allow_null': True},
            'sku': {'required': False, 'allow_blank': True, 'allow_null': True},
            'brand': {'required': False, 'allow_blank': True, 'allow_null': True},
            'wholesale_price': {'required': False, 'allow_null': True},
            'weight_grams': {'required': False, 'allow_null': True},
            'dimensions': {'required': False, 'allow_blank': True, 'allow_null': True},
            'bulk_discount_tiers': {'required': False, 'allow_null': True},
            'description': {'required': False, 'allow_blank': True, 'allow_null': True},
        }
    
    def get_price(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return float(obj.get_price_for_user(request.user))
        return float(obj.retail_price)

class ProductListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'price', 'primary_image',
            'stock', 'average_rating', 'total_reviews', 'is_featured'
        ]
    
    def get_price(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return float(obj.get_price_for_user(request.user))
        return float(obj.retail_price)
    
    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first()
        if primary:
            return primary.image.url
        first = obj.images.first()
        return first.image.url if first else None

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'variant', 'quantity', 'price', 'total_price']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_price', 'item_count', 'is_b2b_order', 'created_at', 'updated_at']
    
    def get_item_count(self, obj):
        return obj.items.count()

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_sku', 'variant', 'quantity', 'price', 'total']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user = CustomUserSerializer(read_only=True)
    order_type_display = serializers.CharField(source='get_order_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'order_type', 'order_type_display',
            'user', 'status', 'status_display', 'total_amount',
            'purchase_order_number', 'delivery_instructions',
            'require_signature', 'shipping_address', 'shipping_city',
            'shipping_state', 'shipping_zip', 'shipping_country',
            'payment_method', 'payment_status', 'payment_reference',
            'items', 'created_at', 'updated_at', 'expected_delivery_date'
        ]

class ReviewSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'product', 'user', 'rating', 'comment', 'is_verified_purchase', 'created_at', 'updated_at']
        read_only_fields = ['user', 'is_verified_purchase']

class WishlistSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = Wishlist
        fields = ['id', 'product', 'created_at']

class B2BQuoteSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    
    class Meta:
        model = B2BQuote
        fields = [
            'id', 'user', 'product', 'product_id', 'quantity',
            'requested_price', 'offered_price', 'status',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'status']

class CompanyAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyAddress
        fields = '__all__'
        read_only_fields = ['user']

class BulkOrderDiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BulkOrderDiscount
        fields = '__all__'