import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  product_count: number;
}

export const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get('/categories/');
        // Handle paginated response
        let categoriesData: Category[] = [];
        if (Array.isArray(res.data)) {
          categoriesData = res.data;
        } else if (res.data && typeof res.data === 'object' && Array.isArray(res.data.results)) {
          categoriesData = res.data.results;
        } else {
          categoriesData = [];
        }
        setCategories(categoriesData);
      } catch (err) {
        setError('Failed to load categories.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1.5rem',
    },
    heading: {
      fontSize: '2rem',
      fontWeight: '700',
      marginBottom: '1.5rem',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: '1.5rem',
    },
    card: {
      background: '#fff',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      textDecoration: 'none',
      color: '#0f172a',
      display: 'block',
      overflow: 'hidden',
    },
    cardHover: {
      transform: 'translateY(-4px)',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)',
    },
    image: {
      width: '100%',
      height: '160px',
      objectFit: 'cover' as const,
      borderRadius: '8px',
      marginBottom: '1rem',
      background: '#f1f5f9',
    },
    name: {
      fontSize: '1.125rem',
      fontWeight: '600',
      marginBottom: '0.25rem',
    },
    description: {
      fontSize: '0.9rem',
      color: '#64748b',
      marginBottom: '0.5rem',
    },
    count: {
      fontSize: '0.8rem',
      color: '#94a3b8',
      display: 'block',
    },
    loading: {
      textAlign: 'center',
      padding: '3rem',
      color: '#64748b',
    },
    error: {
      textAlign: 'center',
      padding: '3rem',
      color: '#dc2626',
    },
  };

  if (loading) return <div style={styles.loading}>Loading categories...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Browse Categories</h1>
      <div style={styles.grid}>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/shop?category=${cat.slug}`}
            style={styles.card}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' })}
          >
            {cat.image ? (
              <img src={cat.image} alt={cat.name} style={styles.image} />
            ) : (
              <div style={{ ...styles.image, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                No image
              </div>
            )}
            <div style={styles.name}>{cat.name}</div>
            <div style={styles.description}>{cat.description || 'No description'}</div>
            <span style={styles.count}>{cat.product_count} products</span>
          </Link>
        ))}
      </div>
    </div>
  );
};