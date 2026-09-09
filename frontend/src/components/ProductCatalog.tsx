import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import styles from './ProductCatalog.module.css';
import { AddToCartButton } from './AddToCartButton';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number | string;
  retail_price: number | string;
  wholesale_price: number | string | null;
  primary_image: string | null;
  category_name: string;
  stock: number;
  average_rating: number | string;
  total_reviews: number;
  is_featured: boolean;
  bulk_discount_tiers: any;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  product_count: number;
}

const ProductCatalog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';
  const featured = searchParams.get('featured') === 'true';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const extractArray = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray(data.results)) return data.results;
    return [];
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page };
      if (categorySlug) params.category = categorySlug;
      if (searchQuery) params.search = searchQuery;
      if (featured) params.featured = true;
      const response = await api.get('products/', { params });
      const productList = extractArray(response.data);
      setProducts(productList);
      if (response.data && typeof response.data === 'object' && response.data.count) {
        setTotalPages(Math.ceil(response.data.count / 20));
      } else {
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [page, categorySlug, searchQuery, featured]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await api.get('categories/');
      const categoriesData = extractArray(res.data);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategoryClick = (slug: string) => {
    setPage(1);
    if (slug === categorySlug) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', slug);
    }
    setSearchParams(searchParams);
  };

  const clearCategoryFilter = () => {
    searchParams.delete('category');
    setPage(1);
    setSearchParams(searchParams);
  };

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

  if (loading && products.length === 0) {
    return <div className={styles.loading}>Loading products...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  const selectedCategoryName = Array.isArray(categories)
    ? categories.find(c => c.slug === categorySlug)?.name || 'All Products'
    : 'All Products';

  const pageTitle = featured ? 'Featured Products' : (categorySlug ? selectedCategoryName : 'All Products');

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.categoryCard}>
          <h2 className={styles.categoryTitle}>Categories</h2>
          {loadingCategories ? (
            <p className={styles.categoryLoading}>Loading...</p>
          ) : (
            <ul className={styles.categoryList}>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <div
                    className={`${styles.categoryItem} ${cat.slug === categorySlug ? styles.categoryItemActive : ''}`}
                    onClick={() => handleCategoryClick(cat.slug)}
                  >
                    <span>{cat.name}</span>
                    <span className={styles.categoryCount}>{cat.product_count}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {categorySlug && (
            <div className={styles.clearFilter} onClick={clearCategoryFilter}>
              Clear filter
            </div>
          )}
        </div>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.header}>
          <h1>{pageTitle}</h1>
        </div>

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
        {products.length === 0 && <div className={styles.empty}>No products found.</div>}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`${styles.pageButton} ${p === page ? styles.pageButtonActive : ''}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductCatalog;