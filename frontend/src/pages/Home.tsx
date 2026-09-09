import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import styles from './Home.module.css';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number | string;
  retail_price: number | string;
  wholesale_price: number | string | null;
  primary_image: string | null;
  category_name: string;
  category_slug: string;
  stock: number;
  average_rating: number | string;   // 👈 already present
  total_reviews: number;              // 👈 already present
  is_featured: boolean;
  bulk_discount_tiers: any;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  image_url: string | null;
  product_count: number;
}

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          apiClient.get('/products/'),
          apiClient.get('/categories/'),
        ]);

        let productList: Product[] = [];
        if (Array.isArray(productsRes.data)) {
          productList = productsRes.data;
        } else if (productsRes.data?.results) {
          productList = productsRes.data.results;
        }
        setProducts(productList);

        let categoryList: Category[] = [];
        if (Array.isArray(categoriesRes.data)) {
          categoryList = categoriesRes.data;
        } else if (categoriesRes.data?.results) {
          categoryList = categoriesRes.data.results;
        }
        setCategories(categoryList);
      } catch (err) {
        setError('Failed to load data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getDiscount = (product: Product): number | null => {
    const retail = Number(product.retail_price);
    const wholesale = Number(product.wholesale_price);
    if (wholesale && wholesale < retail) {
      return Math.round(((retail - wholesale) / retail) * 100);
    }
    return null;
  };

  const getRating = (product: Product) => {
    const avg = Number(product.average_rating);
    return isNaN(avg) ? 0 : avg;
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      {/* Hero */}
      <div className={styles.hero}>
        <h1>Welcome to ECommerce</h1>
        <p>Discover amazing products at great prices</p>
      </div>

      {/* Category Grid */}
      <section className={styles.categorySection}>
        <h2 className={styles.sectionTitle}>Browse Categories</h2>
        <div className={styles.categoryGrid}>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className={styles.categoryCard}
            >
              {cat.image_url ? (
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className={styles.categoryImage}
                  loading="lazy"
                />
              ) : (
                <div className={styles.categoryPlaceholder}>
                  <span className={styles.categoryPlaceholderIcon}>📁</span>
                  <span className={styles.categoryPlaceholderText}>No image</span>
                </div>
              )}
              <div className={styles.categoryInfo}>
                <div className={styles.categoryName}>{cat.name}</div>
                <div className={styles.categoryCount}>{cat.product_count} products</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <section className={styles.productSection}>
        <h2 className={styles.sectionTitle}>Featured Products</h2>
        <div className={styles.grid}>
          {products.map((product) => {
            const discount = getDiscount(product);
            const rating = getRating(product);
            return (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className={styles.card}
              >
                {discount && <div className={styles.discountBadge}>-{discount}%</div>}
                {product.primary_image ? (
                  <img
                    src={product.primary_image}
                    alt={product.name}
                    className={styles.image}
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.placeholderImage}>No image</div>
                )}
                <div className={styles.cardBody}>
                  <div className={styles.name}>{product.name}</div>
                  <div className={styles.price}>NRs. {Number(product.price)?.toFixed(2)}</div>
                  {/* 👇 Rating display */}
                  <div className={styles.ratingRow}>
                    <span className={styles.ratingStars}>⭐ {rating.toFixed(1)}</span>
                    <span className={styles.ratingCount}>({product.total_reviews || 0})</span>
                  </div>
                  <div className={styles.category}>{product.category_name || 'Uncategorized'}</div>
                </div>
              </Link>
            );
          })}
        </div>
        {products.length === 0 && <div className={styles.empty}>No products available.</div>}
      </section>
    </div>
  );
};