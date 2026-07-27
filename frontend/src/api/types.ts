// src/api/types.ts

// ---------- Users ----------
export interface CustomUser {
  id: number;
  username: string;
  email: string;
  user_type: 'B2B' | 'B2C' | 'admin';
  company_name?: string;
  business_registration_number?: string;
  tax_id?: string;
  phone_number?: string;
  is_verified: boolean;
  is_vip: boolean;
  credit_limit: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface UserRegistration {
  username: string;
  email: string;
  password: string;
  password2: string;
  user_type: 'B2B' | 'B2C';
  company_name?: string;
  business_registration_number?: string;
  tax_id?: string;
  phone_number?: string;
  first_name: string;
  last_name: string;
}

// ---------- Categories ----------
export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: number;
  children: ProductCategory[];
  product_count: number;
  is_active: boolean;
}

// ---------- Product Images & Variants ----------
export interface ProductImage {
  id: number;
  image: string;
  is_primary: boolean;
  alt_text?: string;
}

export interface ProductVariant {
  id: number;
  name: string;
  value: string;
  retail_price_adjustment: string;
  wholesale_price_adjustment: string;
  stock: number;
  sku: string;
}

// ---------- Products ----------
export interface ProductBase {
  id: number;
  name: string;
  slug: string;
  description?: string;
  sku: string;
  brand?: string;
  retail_price: string;
  wholesale_price: string;
  wholesale_min_quantity: number;
  bulk_discount_tiers: any;
  stock: number;
  low_stock_threshold: number;
  weight_grams?: number;
  dimensions?: string;
  category: number;
  category_name: string;
  is_active: boolean;
  is_featured: boolean;
  average_rating: string;
  total_reviews: number;
  images: ProductImage[];
  variants: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface Product extends ProductBase {
  price: number;
  wholesale_price_display: string;
}

export interface ProductList {
  id: number;
  name: string;
  slug: string;
  price: number;
  primary_image?: string;
  stock: number;
  average_rating: string;
  total_reviews: number;
  is_featured: boolean;
}

// ---------- Cart ----------
export interface CartItem {
  id: number;
  product: Product;
  variant?: number;
  quantity: number;
  price: string;
  total_price: string;
}

export interface CartItemCreate {
  product_id: number;
  variant?: number;
  quantity: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total_price: string;
  item_count: number;
  is_b2b_order: boolean;
  created_at: string;
  updated_at: string;
}

// ---------- Orders ----------
export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  variant?: number;
  quantity: number;
  price: string;
  total: string;
}

export interface Order {
  id: number;
  order_number: string;
  order_type: 'B2B' | 'B2C';
  order_type_display: string;
  user: CustomUser;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  status_display: string;
  total_amount: string;
  purchase_order_number?: string;
  delivery_instructions?: string;
  require_signature: boolean;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country: string;
  payment_method: string;
  payment_status: string;
  payment_reference?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  expected_delivery_date?: string;
}

// ---------- Reviews ----------
export interface Review {
  id: number;
  product: number;
  user: CustomUser;
  rating: number;
  comment?: string;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}

// ---------- Wishlist ----------
export interface WishlistItem {
  id: number;
  product: Product;
  created_at: string;
}

// ---------- B2B Quotes ----------
export interface B2BQuote {
  id: number;
  user: CustomUser;
  product: Product;
  product_id: number;
  quantity: number;
  requested_price: string;
  offered_price?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ---------- Company Address ----------
export interface CompanyAddress {
  id: number;
  user: number;
  address_type: 'shipping' | 'billing' | 'both';
  company_name?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone?: string;
  is_default: boolean;
  contact_person: string;
  contact_phone: string;
}

// ---------- Bulk Order Discount ----------
export interface BulkOrderDiscount {
  id: number;
  min_quantity: number;
  discount_percentage: string;
  product_category?: number;
  product?: number;
  is_active: boolean;
}