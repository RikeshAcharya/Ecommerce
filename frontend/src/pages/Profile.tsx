import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

// --- Types ---
interface Address {
  id: number;
  address_type: string;
  company_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
  contact_person: string;
  contact_phone: string;
}

// --- Component ---
export const Profile: React.FC = () => {
  const { user } = useAuth();

  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);

  // New address form state
  const [formData, setFormData] = useState({
    address_type: 'shipping',
    company_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    is_default: false,
    contact_person: '',
    contact_phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Fetch addresses
  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/addresses/');
      console.log('Addresses response:', res.data);
      if (Array.isArray(res.data)) {
        setAddresses(res.data);
      } else if (res.data?.results) {
        setAddresses(res.data.results);
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // --- Open/close delete modal ---
  const openDeleteModal = (id: number) => {
    setAddressToDelete(id);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setAddressToDelete(null);
  };

  // --- Confirm delete ---
  const confirmDelete = async () => {
    if (addressToDelete === null) return;
    setDeletingIds((prev) => new Set(prev).add(addressToDelete));
    try {
      await apiClient.delete(`/addresses/${addressToDelete}/`);
      setAddresses((prev) => prev.filter((addr) => addr.id !== addressToDelete));
      closeDeleteModal();
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete address.');
      closeDeleteModal();
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(addressToDelete);
        return newSet;
      });
    }
  };

  // --- Form handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(false);

    try {
      await apiClient.post('/addresses/', formData);
      setFormSuccess(true);
      setFormData({
        address_type: 'shipping',
        company_name: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        is_default: false,
        contact_person: '',
        contact_phone: '',
      });
      await fetchAddresses();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to add address.');
      console.error('Add address error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Inline styles ---
  const styles = {
    container: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '2rem 1.5rem',
    },
    section: {
      marginBottom: '2.5rem',
    },
    heading: {
      fontSize: '2rem',
      fontWeight: '700',
      marginBottom: '0.5rem',
    },
    subheading: {
      fontSize: '1.25rem',
      fontWeight: '600',
      marginBottom: '1rem',
      borderBottom: '2px solid #e2e8f0',
      paddingBottom: '0.5rem',
    },
    card: {
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      padding: '1.5rem',
      border: '1px solid #e2e8f0',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '1.25rem',
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
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1rem',
      marginBottom: '1rem',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
    },
    label: {
      fontWeight: '500',
      marginBottom: '0.25rem',
      fontSize: '0.9rem',
      color: '#334155',
    },
    input: {
      padding: '0.5rem 0.75rem',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: '0.95rem',
      outline: 'none',
      transition: 'border 0.15s ease',
    },
    checkboxGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '1rem',
    },
    button: {
      padding: '0.5rem 1.5rem',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background 0.15s ease',
      background: '#2563eb',
      color: '#fff',
      fontSize: '0.95rem',
    },
    buttonDanger: {
      background: '#dc2626',
      color: '#fff',
      marginTop: '0.5rem',
      padding: '0.25rem 0.75rem',
      fontSize: '0.8rem',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background 0.15s ease',
    },
    buttonDangerHover: {
      background: '#b91c1c',
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    error: {
      color: '#dc2626',
      fontSize: '0.9rem',
      marginTop: '0.5rem',
    },
    success: {
      color: '#16a34a',
      fontSize: '0.9rem',
      marginTop: '0.5rem',
    },
    loading: {
      textAlign: 'center',
      padding: '3rem',
      color: '#64748b',
    },
    noAddress: {
      color: '#64748b',
      fontStyle: 'italic',
    },
    cardFooter: {
      marginTop: '0.75rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
    },
    modalBox: {
      background: '#fff',
      borderRadius: '12px',
      padding: '2rem',
      maxWidth: '450px',
      width: '100%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      textAlign: 'center' as const,
    },
    modalTitle: {
      fontSize: '1.25rem',
      fontWeight: '700',
      marginBottom: '0.5rem',
    },
    modalMessage: {
      color: '#475569',
      marginBottom: '1.5rem',
    },
    modalActions: {
      display: 'flex',
      gap: '0.75rem',
      justifyContent: 'center',
    },
    modalButtonCancel: {
      padding: '0.5rem 1.5rem',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      background: '#fff',
      color: '#1e293b',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background 0.15s ease',
    },
    modalButtonDelete: {
      padding: '0.5rem 1.5rem',
      border: 'none',
      borderRadius: '8px',
      background: '#dc2626',
      color: '#fff',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background 0.15s ease',
    },
  };

  // --- Render ---
  return (
    <div style={styles.container}>
      {/* ---- Profile Info ---- */}
      <section style={styles.section}>
        <h1 style={styles.heading}>My Profile</h1>
        <div style={styles.card}>
          <p><strong>Username:</strong> {user?.username}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>User Type:</strong> {user?.user_type}</p>
          <p><strong>Company:</strong> {user?.company_name || 'N/A'}</p>
          <p><strong>Phone:</strong> {user?.phone_number || 'N/A'}</p>
        </div>
      </section>

      {/* ---- Addresses ---- */}
      <section style={styles.section}>
        <h2 style={styles.subheading}>Saved Addresses</h2>
        {loading ? (
          <div style={styles.loading}>Loading addresses...</div>
        ) : addresses.length === 0 ? (
          <p style={styles.noAddress}>No addresses saved yet.</p>
        ) : (
          <div style={styles.grid}>
            {addresses.map((addr) => (
              <div key={addr.id} style={styles.card}>
                <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{addr.company_name || 'No company'}</p>
                <p>{addr.address_line1}</p>
                {addr.address_line2 && <p>{addr.address_line2}</p>}
                <p>{addr.city}, {addr.state} {addr.zip_code}</p>
                <p>{addr.country}</p>
                <p>Contact: {addr.contact_person} ({addr.contact_phone})</p>
                <div style={styles.cardFooter}>
                  {addr.is_default && <span style={styles.badge}>Default</span>}
                  <button
                    style={styles.buttonDanger}
                    onClick={() => openDeleteModal(addr.id)}
                    disabled={deletingIds.has(addr.id)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = styles.buttonDangerHover.background)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#dc2626')}
                  >
                    {deletingIds.has(addr.id) ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Add Address Form ---- */}
      <section style={styles.section}>
        <h2 style={styles.subheading}>Add New Address</h2>
        <div style={styles.card}>
          <form onSubmit={handleSubmit}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Company Name (optional)</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Address Type</label>
                <select
                  name="address_type"
                  value={formData.address_type}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="shipping">Shipping</option>
                  <option value="billing">Billing</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Address Line 1 *</label>
                <input
                  type="text"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Address Line 2</label>
                <input
                  type="text"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>State *</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>ZIP Code *</label>
                <input
                  type="text"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Country *</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Contact Person *</label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Contact Phone *</label>
                <input
                  type="text"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.checkboxGroup}>
              <input
                type="checkbox"
                name="is_default"
                checked={formData.is_default}
                onChange={handleChange}
                style={{ width: '1.1rem', height: '1.1rem' }}
              />
              <label style={styles.label}>Set as default address</label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.button,
                ...(submitting ? styles.buttonDisabled : {}),
              }}
            >
              {submitting ? 'Adding...' : 'Add Address'}
            </button>

            {formError && <div style={styles.error}>{formError}</div>}
            {formSuccess && <div style={styles.success}>Address added successfully!</div>}
          </form>
        </div>
      </section>

      {/* ---- Delete Confirmation Modal ---- */}
      {deleteModalOpen && (
        <div style={styles.modalOverlay} onClick={closeDeleteModal}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Delete Address</h3>
            <p style={styles.modalMessage}>
              Are you sure you want to delete this address? This action cannot be undone.
            </p>
            <div style={styles.modalActions}>
              <button style={styles.modalButtonCancel} onClick={closeDeleteModal}>
                Cancel
              </button>
              <button style={styles.modalButtonDelete} onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};