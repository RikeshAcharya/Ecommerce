import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { cartService } from '../api/services/cartService';
import type { Product } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import styles from './ProductDetail.module.css';

const getImageUrl = (img: any) => {
  if (!img) return null;
  if (img.image_url && typeof img.image_url === 'string') return img.image_url;
  if (img.image && img.image.startsWith('http')) return img.image;
  if (img.image && typeof img.image === 'string') {
    const cloudName = 'bwaexc7u';
    let publicId = img.image;
    if (publicId.startsWith('image/upload/')) {
      publicId = publicId.replace('image/upload/', '');
    }
    if (publicId.startsWith('/image/upload/')) {
      publicId = publicId.replace('/image/upload/', '');
    }
    if (publicId.includes('res.cloudinary.com')) {
      return publicId;
    }
    return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
  }
  return null;
};

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { cart, refreshCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<number | undefined>();
  const [showB2BPricing, setShowB2BPricing] = useState(
    user?.user_type === 'B2B'
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [stockWarning, setStockWarning] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/products/${id}/`);
        setProduct(response.data);
        if (response.data.images?.length) {
          const primaryIdx = response.data.images.findIndex((img: any) => img.is_primary);
          setSelectedImageIndex(primaryIdx !== -1 ? primaryIdx : 0);
        }
        setQuantity(1);
        setStockWarning(null);
      } catch (error) {
        console.error('Failed to fetch product', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
    else setLoading(false);
  }, [id]);

  const getDisplayPrice = () => {
    if (!product) return 0;
    if (showB2BPricing) {
      const tiers = product.bulk_discount_tiers as any[];
      const tier = tiers?.slice().sort((a: any, b: any) => b.min_qty - a.min_qty)
        .find((t: any) => {
          const qty = cart?.items?.find((item) => item.product.id === product.id)?.quantity || 1;
          return qty >= t.min_qty;
        });
      if (tier) return Number(product.wholesale_price) * (1 - tier.discount / 100);
      return Number(product.wholesale_price);
    }
    return Number(product.retail_price);
  };

  const handleQuantityChange = (val: number) => {
    if (!product) return;
    const maxStock = product.stock || 999;
    if (val < 1) val = 1;
    if (val > maxStock) {
      setStockWarning(`Only ${maxStock} items available in stock.`);
      val = maxStock;
    } else {
      setStockWarning(null);
    }
    setQuantity(val);
  };

  const handleIncrement = () => {
    if (!product) return;
    const maxStock = product.stock || 999;
    if (quantity < maxStock) {
      setQuantity(quantity + 1);
      setStockWarning(null);
    } else {
      setStockWarning(`Only ${maxStock} items available in stock.`);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
      setStockWarning(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      setQuantity(1);
      return;
    }
    const val = parseInt(raw, 10);
    if (!isNaN(val)) handleQuantityChange(val);
  };

  const addToCart = async () => {
    if (!product || quantity > product.stock) {
      setAddError(`Only ${product?.stock || 0} items available.`);
      return;
    }
    setIsAdding(true);
    setAddError(null);
    try {
      await cartService.addToCart({
        product_id: product.id,
        quantity,
        variant: selectedVariant,
      });
      await refreshCart();
    } catch (error: any) {
      setAddError(error.message || 'Failed to add item to cart.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddToCart = async () => {
    await addToCart();
  };

  const handleBuyNow = async () => {
    await addToCart();
    if (!addError) navigate('/checkout');
  };

  const openLightbox = () => setLightboxOpen(true);
  const closeLightbox = () => setLightboxOpen(false);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!product) return <div className={styles.error}>Product not found</div>;

  const cartItem = cart?.items?.find((item) => item.product.id === product.id);
  const isInCart = !!cartItem;
  const currentImage = product.images?.[selectedImageIndex] ? getImageUrl(product.images[selectedImageIndex]) : null;

  return (
    <div className={styles.container}>
      {/* Gallery */}
      <div className={styles.gallery}>
        <div className={styles.mainImageWrapper} onClick={openLightbox}>
          {currentImage ? <img src={currentImage} alt={product.name} /> : <div className={styles.noImage}>No image</div>}
        </div>
        {product.images?.length > 1 && (
          <div className={styles.thumbnailList}>
            {product.images.map((img, idx) => (
              <div
                key={img.id}
                className={`${styles.thumbnail} ${idx === selectedImageIndex ? styles.active : ''}`}
                onClick={() => setSelectedImageIndex(idx)}
              >
                <img src={getImageUrl(img) || ''} alt="thumbnail" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className={styles.info}>
        <h1 className={styles.name}>{product.name}</h1>
		
        <p className={styles.brand}>Brand: {product.brand || 'No brand'}</p>
        <p className={styles.sku}>SKU: {product.sku || 'N/A'}</p>

        <div className={styles.summaryRow}>
          <span className={styles.price}>NRs. {getDisplayPrice().toFixed(2)}</span>
          <span className={styles.rating}>
            ⭐ {Number(product.average_rating).toFixed(1)} / 5
            <span className={styles.reviewCount}>({product.total_reviews || 0} reviews)</span>
          </span>
        </div>

        <div className={styles.stockInfo}>
          <span className={product.stock > 0 ? styles.inStock : styles.lowStock}>
            {product.stock > 0 ? `✓ ${product.stock} in stock` : '❌ Out of Stock'}
          </span>
        </div>

        {product.variants?.length > 0 && (
          <div className={styles.variants}>
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                className={selectedVariant === variant.id ? styles.selected : ''}
                onClick={() => setSelectedVariant(variant.id)}
              >
                {variant.name}: {variant.value}
              </button>
            ))}
          </div>
        )}

        {/* Quantity */}
		
        <div className={styles.quantitySelector}>
          Quantity <button onClick={handleDecrement} disabled={isAdding || quantity <= 1}>−</button>
          <input
            type="number"
            value={quantity}
            onChange={handleInputChange}
            min={1}
            max={product.stock || 999}
            disabled={isAdding}
          />
          <button onClick={handleIncrement} disabled={isAdding || (product.stock && quantity >= product.stock)}>+</button>
        </div>
        {stockWarning && <div className={styles.stockWarning}>{stockWarning}</div>}

        {/* Buttons */}
        <div className={styles.cartActions}>
          <button
            className={styles.addToCart}
            onClick={handleAddToCart}
            disabled={isAdding || quantity > product.stock || product.stock < 1}
          >
            {isAdding ? 'Adding...' : 'Add to Cart'}
          </button>
          <button
            className={styles.buyNow}
            onClick={handleBuyNow}
            disabled={isAdding || quantity > product.stock || product.stock < 1}
          >
            Buy Now
          </button>
        </div>

        {isInCart && (
          <button
            className={styles.deleteBtn}
            onClick={async () => {
              const item = cart?.items?.find((i) => i.product.id === product.id);
              if (!item) return;
              try {
                await cartService.removeFromCart(item.id);
                await refreshCart();
              } catch (err) {
                console.error(err);
              }
            }}
          >
            Delete from Cart
          </button>
        )}

        {addError && <div className={styles.errorMessage}>{addError}</div>}

        {user?.user_type === 'B2B' && (
          <div className={styles.actions}>
            <button className={styles.requestQuote}>Request Quote</button>
          </div>
        )}

        <div className={styles.description}>
          <h3>Description</h3>
          <p>{product.description || 'No description available.'}</p>
        </div>

        <div className={styles.reviews}>
          <h3>Reviews ({product.total_reviews || 0})</h3>
          <div className={styles.ratingSummary}>
            ⭐ {Number(product.average_rating).toFixed(1)} / 5
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && currentImage && (
        <div className={styles.lightbox} onClick={closeLightbox}>
          <div className={styles.lightboxContent}>
            <img src={currentImage} alt={product.name} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;