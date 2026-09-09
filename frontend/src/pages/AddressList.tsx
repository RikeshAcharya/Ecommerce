import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';

interface Address {
  id: number;
  address_type: string;
  company_name: string;
  address_line1: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
}

export const AddressList: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await apiClient.get('/addresses/');
        console.log('Addresses response:', res.data);
        // If the data is an array, use it; otherwise adapt
        if (Array.isArray(res.data)) {
          setAddresses(res.data);
        } else if (res.data && typeof res.data === 'object' && Array.isArray(res.data.results)) {
          setAddresses(res.data.results);
        } else {
          setAddresses([]);
        }
      } catch (err) {
        console.error('Error fetching addresses:', err);
        // Optionally set an error state
      } finally {
        setLoading(false);
      }
    };
    fetchAddresses();
  }, []);

  // --- Styles (inline) ---
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
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '1.25rem',
    },
    card: {
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      padding: '1.5rem',
      border: '1px solid #e2e8f0',
    },
    company: {
      fontWeight: 'bold',
      fontSize: '1.1rem',
      marginBottom: '0.25rem',
    },
    badge: {
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      background: '#d1fae5',
      color: '#065f46',
    },
    loading: {
      textAlign: 'center',
      padding: '3rem',
      fontSize: '1.125rem',
      color: '#64748b',
    },
  };

  if (loading) {
    return <div style={styles.loading}>Loading addresses...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>My Addresses</h1>

      {addresses.length === 0 ? (
        <p>
          You have no saved addresses.{' '}
          <a href="/add-address" style={{ color: '#2563eb', textDecoration: 'none' }}>
            Add one now
          </a>
        </p>
      ) : (
        <div style={styles.grid}>
          {addresses.map((addr) => (
            <div key={addr.id} style={styles.card}>
              <div style={styles.company}>{addr.company_name}</div>
              <p>{addr.address_line1}</p>
              <p>
                {addr.city}, {addr.state} {addr.zip_code}
              </p>
              <p>{addr.country}</p>
              {addr.is_default && <span style={styles.badge}>Default</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};