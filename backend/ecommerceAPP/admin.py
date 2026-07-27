from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from . import models

class ProductImageInline(admin.TabularInline):
    model = models.ProductImage
    extra = 1
    fields = ('image', 'is_primary', 'alt_text')

class ProductVariantInline(admin.TabularInline):
    model = models.ProductVariant
    extra = 1

class CartItemInline(admin.TabularInline):
    model = models.CartItem
    extra = 0
    raw_id_fields = ('product', 'variant')

class OrderItemInline(admin.TabularInline):
    model = models.OrderItem
    extra = 0
    raw_id_fields = ('product', 'variant')

@admin.register(models.CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'user_type', 'company_name', 'is_verified', 'is_vip', 'credit_limit')
    list_filter = ('user_type', 'is_verified', 'is_vip', 'is_active')
    search_fields = ('username', 'email', 'company_name', 'phone_number')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'phone_number')}),
        ('Business info', {'fields': ('user_type', 'company_name', 'business_registration_number', 'tax_id')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('B2B settings', {'fields': ('is_verified', 'is_vip', 'credit_limit')}),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'user_type', 'phone_number'),
        }),
    )

@admin.register(models.ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'parent')
    search_fields = ('name', 'slug')
    list_filter = ('is_active',)
    prepopulated_fields = {'slug': ('name',)}

@admin.register(models.Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'retail_price', 'wholesale_price', 'stock', 'is_active', 'is_featured')
    list_filter = ('category', 'is_active', 'is_featured', 'brand')
    search_fields = ('name', 'sku', 'brand')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('average_rating', 'total_reviews', 'created_at', 'updated_at')
    inlines = [ProductImageInline, ProductVariantInline]
    fieldsets = (
        (None, {'fields': ('name', 'slug', 'description', 'category')}),
        ('Pricing', {'fields': ('retail_price', 'wholesale_price', 'wholesale_min_quantity', 'bulk_discount_tiers')}),
        ('Inventory', {'fields': ('stock', 'low_stock_threshold')}),
        ('Attributes', {'fields': ('brand', 'sku', 'weight_grams', 'dimensions')}),
        ('Status', {'fields': ('is_active', 'is_featured')}),
        ('Ratings', {'fields': ('average_rating', 'total_reviews')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )

@admin.register(models.ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'is_primary', 'alt_text')
    list_filter = ('is_primary',)
    search_fields = ('product__name', 'alt_text')
    raw_id_fields = ('product',)

@admin.register(models.ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('product', 'name', 'value', 'sku', 'stock')
    list_filter = ('product',)
    search_fields = ('product__name', 'sku', 'value')
    raw_id_fields = ('product',)

@admin.register(models.Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'session_id', 'is_b2b_order', 'created_at')
    list_filter = ('is_b2b_order',)
    search_fields = ('user__username', 'session_id')
    inlines = [CartItemInline]
    raw_id_fields = ('user',)

@admin.register(models.CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'product', 'variant', 'quantity')
    list_filter = ('cart__is_b2b_order',)
    raw_id_fields = ('cart', 'product', 'variant')

@admin.register(models.Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'user', 'order_type', 'status', 'total_amount', 'created_at')
    list_filter = ('order_type', 'status', 'payment_status', 'created_at')
    search_fields = ('order_number', 'user__username', 'shipping_address')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [OrderItemInline]
    fieldsets = (
        (None, {'fields': ('order_number', 'user', 'order_type', 'status', 'total_amount')}),
        ('B2B details', {'fields': ('purchase_order_number', 'delivery_instructions', 'require_signature')}),
        ('Shipping', {'fields': ('shipping_address', 'shipping_city', 'shipping_state', 'shipping_zip', 'shipping_country')}),
        ('Payment', {'fields': ('payment_method', 'payment_status', 'payment_reference')}),
        ('Dates', {'fields': ('created_at', 'updated_at', 'expected_delivery_date')}),
    )

@admin.register(models.OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'variant', 'quantity', 'price', 'total')
    raw_id_fields = ('order', 'product', 'variant')

@admin.register(models.Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'rating', 'is_verified_purchase', 'created_at')
    list_filter = ('rating', 'is_verified_purchase', 'created_at')
    search_fields = ('product__name', 'user__username', 'comment')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(models.Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'created_at')
    search_fields = ('user__username', 'product__name')
    raw_id_fields = ('user', 'product')

@admin.register(models.B2BQuote)
class B2BQuoteAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'quantity', 'requested_price', 'offered_price', 'status')
    list_filter = ('status', 'created_at')
    search_fields = ('product__name', 'user__company_name', 'user__username')
    raw_id_fields = ('user', 'product')

@admin.register(models.CompanyAddress)
class CompanyAddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'company_name', 'address_type', 'city', 'is_default')
    list_filter = ('address_type', 'is_default')
    search_fields = ('company_name', 'city', 'contact_person')
    raw_id_fields = ('user',)

@admin.register(models.BulkOrderDiscount)
class BulkOrderDiscountAdmin(admin.ModelAdmin):
    list_display = ('name', 'min_order_value', 'discount_percentage', 'is_active', 'valid_from', 'valid_to')
    list_filter = ('is_active', 'valid_from', 'valid_to')
    search_fields = ('name',)

@admin.register(models.PriceHistory)
class PriceHistoryAdmin(admin.ModelAdmin):
    list_display = ('product', 'old_price', 'new_price', 'price_type', 'changed_by', 'changed_at')
    list_filter = ('price_type', 'changed_at')
    search_fields = ('product__name',)
    raw_id_fields = ('product', 'changed_by')