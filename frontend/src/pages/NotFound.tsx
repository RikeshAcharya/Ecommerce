import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center' as const,
      padding: '2rem 1.5rem',
    },
    title: {
      fontSize: '6rem',
      fontWeight: '800',
      color: '#1e293b',
      marginBottom: '0.5rem',
      lineHeight: 1,
    },
    subtitle: {
      fontSize: '2rem',
      fontWeight: '600',
      color: '#334155',
      marginBottom: '1rem',
    },
    message: {
      fontSize: '1.1rem',
      color: '#64748b',
      maxWidth: '500px',
      marginBottom: '2rem',
    },
    button: {
      padding: '0.75rem 2rem',
      background: '#2563eb',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '500',
      fontSize: '1rem',
      cursor: 'pointer',
      textDecoration: 'none',
      transition: 'background 0.15s ease',
      display: 'inline-block',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>404</div>
      <div style={styles.subtitle}>Page Not Found</div>
      <p style={styles.message}>
        Oops! The page you’re looking for doesn’t exist. It might have been moved or deleted.
      </p>
      <Link to="/" style={styles.button}>
        Go to Homepage
      </Link>
    </div>
  );
};