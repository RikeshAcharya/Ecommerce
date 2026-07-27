import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import styles from './ProductCatalog.module.css';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number | string;   // might be string
  primary_image: string | null;
  stock: number;
  average_rating: number | string; // might be string
  total_reviews: number;
  is_featured: boolean;
}

const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('products/', {
          params: { search: searchTerm || undefined },
        });
        console.log('API response:', response.data);

        let productList: Product[] = [];
        if (response.data && Array.isArray(response.data)) {
          productList = response.data;
        } else if (response.data && response.data.results) {
          productList = response.data.results;
        } else {
          productList = [];
        }
        setProducts(productList);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  if (loading && products.length === 0) {
    return <div className={styles.loading}>Loading products...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Our Products</h1>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {products.length === 0 ? (
        <div className={styles.empty}>No products found.</div>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
            <div key={product.id} className={styles.card}>
              {product.is_featured && <div className={styles.featuredBadge}>Featured</div>}
              <div className={styles.imageWrapper}>
                {product.primary_image ? (
                  <img src={product.primary_image} alt={product.name} />
                ) : (
                  <div className={styles.placeholderImage}>No image</div>
                )}
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.productName}>{product.name}</h3>
                <div className={styles.price}>
                  NRs. {Number(product.price)?.toFixed(2) ?? '0.00'}
                </div>
                <div className={styles.rating}>
                  <span>⭐ {Number(product.average_rating)?.toFixed(1) ?? '0.0'}</span>
                  <span className={styles.reviewCount}>({product.total_reviews})</span>
                </div>
                <div className={styles.stock}>
                  {product.stock > 0 ? (
                    <span className={styles.inStock}>In Stock</span>
                  ) : (
                    <span className={styles.outOfStock}>Out of Stock</span>
                  )}
                </div>
                <button className={styles.addToCartBtn}>Add to Cart</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;