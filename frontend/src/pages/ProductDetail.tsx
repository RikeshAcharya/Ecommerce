import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { productService } from '../api/services/productService';
import { cartService } from '../api/services/cartService';
import type { Product } from '../api/types';
import { useAuth } from '../context/AuthContext';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<number | undefined>();
  const [showB2BPricing, setShowB2BPricing] = useState(
    user?.user_type === 'B2B'
  );

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productService.getById(Number(id));
        setProduct(data);
      } catch (error) {
        console.error('Failed to fetch product', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await cartService.addItem({
        product_id: product.id,
        variant: selectedVariant,
        quantity,
      });
      alert('Added to cart!');
    } catch (error) {
      console.error('Failed to add to cart', error);
    }
  };

  const getDisplayPrice = () => {
    if (!product) return 0;
    if (showB2BPricing) {
      // Calculate bulk discount if applicable
      const tiers = product.bulk_discount_tiers as any[];
      const tier = tiers
        .slice()
        .sort((a: any, b: any) => b.min_qty - a.min_qty)
        .find((t: any) => quantity >= t.min_qty);

      if (tier) {
        return Number(product.wholesale_price) * (1 - tier.discount / 100);
      }
      return Number(product.wholesale_price);
    }
    return Number(product.retail_price);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!product) return <div className="error">Product not found</div>;

  return (
    <div className="product-detail">
      <div className="product-gallery">
        {product.images.map((img) => (
          <img key={img.id} src={img.image} alt={img.alt_text} />
        ))}
      </div>

      <div className="product-info">
        <h1>{product.name}</h1>
        <p className="brand">{product.brand}</p>
        <p className="sku">SKU: {product.sku}</p>

        {/* Pricing Section */}
        <div className="pricing">
          <div className="price-toggle">
            <button
              className={!showB2BPricing ? 'active' : ''}
              onClick={() => setShowB2BPricing(false)}
            >
              Retail Price
            </button>
            {user?.user_type === 'B2B' && (
              <button
                className={showB2BPricing ? 'active' : ''}
                onClick={() => setShowB2BPricing(true)}
              >
                Wholesale Price
              </button>
            )}
          </div>

          <div className="price-display">
            <span className="price">${getDisplayPrice().toFixed(2)}</span>
            {showB2BPricing && product.bulk_discount_tiers.length > 0 && (
              <div className="bulk-discounts">
                <p>Bulk Discounts:</p>
                {(product.bulk_discount_tiers as any[]).map((tier: any) => (
                  <span key={tier.min_qty}>
                    {tier.min_qty}+: {tier.discount}% off
                  </span>
                ))}
              </div>
            )}
          </div>

          {showB2BPricing && (
            <div className="wholesale-info">
              <p>Minimum order: {product.wholesale_min_quantity} units</p>
            </div>
          )}
        </div>

        {/* Stock & Quantity */}
        <div className="stock-info">
          <span className={product.stock > 10 ? 'in-stock' : 'low-stock'}>
            {product.stock > 10 ? 'In Stock' : `Only ${product.stock} left`}
          </span>
        </div>

        <div className="quantity-selector">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            -
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <button onClick={() => setQuantity(quantity + 1)}>+</button>
        </div>

        {/* Variants */}
        {product.variants.length > 0 && (
          <div className="variants">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                className={selectedVariant === variant.id ? 'selected' : ''}
                onClick={() => setSelectedVariant(variant.id)}
              >
                {variant.name}: {variant.value}
              </button>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="actions">
          <button className="add-to-cart" onClick={handleAddToCart}>
            Add to Cart
          </button>
          {user?.user_type === 'B2B' && (
            <button className="request-quote">
              Request Quote
            </button>
          )}
        </div>

        {/* Description */}
        <div className="description">
          <h3>Description</h3>
          <p>{product.description}</p>
        </div>

        {/* Reviews */}
        <div className="reviews">
          <h3>Reviews ({product.total_reviews})</h3>
          <div className="rating-summary">
            ⭐ {Number(product.average_rating).toFixed(1)} / 5
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
