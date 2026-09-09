import React from 'react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1.5rem',
    },
    heading: {
      fontSize: '2rem',
      fontWeight: '700',
      marginBottom: '0.5rem',
    },
    subheading: {
      color: '#64748b',
      marginBottom: '2rem',
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
    },
    cardHover: {
      transform: 'translateY(-4px)',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)',
    },
    icon: {
      fontSize: '2rem',
      marginBottom: '0.5rem',
    },
    cardTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      marginBottom: '0.25rem',
    },
    cardDescription: {
      fontSize: '0.9rem',
      color: '#64748b',
    },
    badge: {
      display: 'inline-block',
      fontSize: '0.7rem',
      fontWeight: '600',
      padding: '0.15rem 0.5rem',
      borderRadius: '9999px',
      background: '#dbeafe',
      color: '#1e40af',
      marginTop: '0.5rem',
    },
    externalLink: {
      fontSize: '0.8rem',
      color: '#2563eb',
      marginTop: '0.5rem',
      display: 'inline-block',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Admin Dashboard</h1>
      <p style={styles.subheading}>Manage your store – products, categories, orders, users, and more.</p>

      <div style={styles.grid}>
        {/* ---- Categories (built) ---- */}
        <Link
          to="/admin/categories"
          style={styles.card}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' })}
        >
          <div style={styles.icon}>📂</div>
          <div style={styles.cardTitle}>Categories</div>
          <div style={styles.cardDescription}>Create, edit, and delete product categories.</div>
          <span style={styles.badge}>Ready</span>
        </Link>

        {/* ---- Products (built) ---- */}
        <Link
          to="/admin/products"
          style={styles.card}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' })}
        >
          <div style={styles.icon}>📦</div>
          <div style={styles.cardTitle}>Products</div>
          <div style={styles.cardDescription}>Add, edit, and manage product inventory with images.</div>
          <span style={styles.badge}>Ready</span>
        </Link>

        {/* ---- Orders (built) ---- */}
        <Link
          to="/admin/orders"
          style={styles.card}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' })}
        >
          <div style={styles.icon}>🛒</div>
          <div style={styles.cardTitle}>Orders</div>
          <div style={styles.cardDescription}>View, update, and fulfill customer orders.</div>
          <span style={styles.badge}>Ready</span>
        </Link>

        {/* ---- Users (built) ---- */}
        <Link
          to="/admin/users"
          style={styles.card}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' })}
        >
          <div style={styles.icon}>👤</div>
          <div style={styles.cardTitle}>Users</div>
          <div style={styles.cardDescription}>Manage customers, B2B accounts, and staff.</div>
          <span style={styles.badge}>Ready</span>
        </Link>

        {/* ---- B2B Quotes ---- */}
        <a
          href="http://127.0.0.1:8000/admin/shop/b2bquote/"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.card}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' })}
        >
          <div style={styles.icon}>📋</div>
          <div style={styles.cardTitle}>B2B Quotes</div>
          <div style={styles.cardDescription}>Review and respond to wholesale quote requests.</div>
          <span style={{ ...styles.badge, background: '#e2e8f0', color: '#475569' }}>Via Django Admin</span>
          <div style={styles.externalLink}>Opens in new tab →</div>
        </a>

        {/* ---- Reviews ---- */}
        <a
          href="http://127.0.0.1:8000/admin/shop/review/"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.card}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' })}
        >
          <div style={styles.icon}>⭐</div>
          <div style={styles.cardTitle}>Reviews</div>
          <div style={styles.cardDescription}>Moderate product reviews and ratings.</div>
          <span style={{ ...styles.badge, background: '#e2e8f0', color: '#475569' }}>Via Django Admin</span>
          <div style={styles.externalLink}>Opens in new tab →</div>
        </a>

        {/* ---- Discounts ---- */}
        <a
          href="http://127.0.0.1:8000/admin/shop/bulkorderdiscount/"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.card}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' })}
        >
          <div style={styles.icon}>🏷️</div>
          <div style={styles.cardTitle}>Discounts</div>
          <div style={styles.cardDescription}>Create and manage bulk order discounts.</div>
          <span style={{ ...styles.badge, background: '#e2e8f0', color: '#475569' }}>Via Django Admin</span>
          <div style={styles.externalLink}>Opens in new tab →</div>
        </a>

        {/* ---- Reports (placeholder) ---- */}
        <div
          style={{ ...styles.card, cursor: 'default' }}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, { ...styles.cardHover, cursor: 'default' })}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', cursor: 'default' })}
        >
          <div style={styles.icon}>📊</div>
          <div style={styles.cardTitle}>Reports</div>
          <div style={styles.cardDescription}>Sales, revenue, and analytics dashboard.</div>
          <span style={{ ...styles.badge, background: '#e2e8f0', color: '#475569' }}>Coming Soon</span>
        </div>
      </div>
    </div>
  );
};