import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: number;
  retail_price: string;
  wholesale_price: string | null;
  wholesale_min_quantity: number;
  bulk_discount_tiers: any;
  stock: number;
  low_stock_threshold: number;
  brand: string;
  sku: string;
  weight_grams: number | null;
  dimensions: string;
  is_active: boolean;
  is_featured: boolean;
  image?: File | string | null;
}

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    slug: '',
    description: '',
    category: 0,
    retail_price: '',
    wholesale_price: '',
    wholesale_min_quantity: 10,
    bulk_discount_tiers: [],
    stock: 0,
    low_stock_threshold: 10,
    brand: '',
    sku: '',
    weight_grams: null,
    dimensions: '',
    is_active: true,
    is_featured: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  // --- Helper to extract array from response (handles pagination) ---
  const extractArray = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray(data.results)) return data.results;
    return [];
  };

  // --- Fetch products and categories ---
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/products/');
        console.log('Products API response:', res.data);
        setProducts(extractArray(res.data));
      } catch (err) {
        setError('Failed to load products.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await apiClient.get('/categories/');
        console.log('Categories API response:', res.data);
        setCategories(extractArray(res.data));
      } catch (err) {
        console.error('Failed to load categories:', err);
        setCategories([]);
      }
    };

    fetchProducts();
    fetchCategories();
  }, []);

  // --- Form handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === 'checkbox') {
      val = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      val = value === '' ? '' : Number(value);
    }
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      category: 0,
      retail_price: '',
      wholesale_price: '',
      wholesale_min_quantity: 10,
      bulk_discount_tiers: [],
      stock: 0,
      low_stock_threshold: 10,
      brand: '',
      sku: '',
      weight_grams: null,
      dimensions: '',
      is_active: true,
      is_featured: false,
    });
    setImageFile(null);
    setEditingId(null);
    setFormError(null);
    setFormSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(false);

    try {
      const payload = new FormData();

      // Build payload – send only defined fields
      const fieldsToSend = { ...formData };
      Object.keys(fieldsToSend).forEach((key) => {
        const value = fieldsToSend[key as keyof Product];
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'bulk_discount_tiers') {
            // Send as JSON string if it's an array/object
            if (Array.isArray(value)) {
              payload.append(key, JSON.stringify(value));
            }
          } else if (key === 'category') {
            // Ensure category is sent as integer
            payload.append(key, String(value));
          } else {
            payload.append(key, String(value));
          }
        }
      });

      // Append image file if selected
      if (imageFile) {
        payload.append('image', imageFile);
      }

      // Debug: log FormData contents
      console.log('FormData payload:');
      for (let [key, value] of payload.entries()) {
        console.log(key, value);
      }

      let response;
      if (editingId) {
        response = await apiClient.patch(`/products/${editingId}/`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await apiClient.post('/products/', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setFormSuccess(true);
      if (!editingId) resetForm();

      // Refetch products
      const res = await apiClient.get('/products/');
      setProducts(extractArray(res.data));
    } catch (err: any) {
      // Extract detailed error from server
      const serverError = err.response?.data;
      let errorMsg = 'Failed to save product.';
      if (serverError) {
        // Try to get the first validation error
        if (typeof serverError === 'object') {
          const firstKey = Object.keys(serverError)[0];
          if (firstKey) {
            errorMsg = `${firstKey}: ${serverError[firstKey]}`;
          } else {
            errorMsg = serverError.detail || serverError.message || JSON.stringify(serverError);
          }
        } else {
          errorMsg = String(serverError);
        }
      }
      setFormError(errorMsg);
      console.error('Full error response:', err.response?.data);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      ...product,
      bulk_discount_tiers: product.bulk_discount_tiers || [],
    });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => resetForm();

  // --- Delete handlers ---
  const openDeleteModal = (id: number) => {
    setProductToDelete(id);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setProductToDelete(null);
  };
  const confirmDelete = async () => {
    if (productToDelete === null) return;
    try {
      await apiClient.delete(`/products/${productToDelete}/`);
      const res = await apiClient.get('/products/');
      setProducts(extractArray(res.data));
      closeDeleteModal();
    } catch (err) {
      alert('Failed to delete product.');
      console.error(err);
      closeDeleteModal();
    }
  };

  // --- Inline styles (unchanged) ---
  const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' },
    heading: { fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem' },
    card: {
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      padding: '1.5rem',
      border: '1px solid #e2e8f0',
      marginBottom: '2rem',
    },
    formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' },
    formGroup: { display: 'flex', flexDirection: 'column' as const },
    label: { fontWeight: '500', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#334155' },
    input: {
      padding: '0.5rem 0.75rem',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: '0.95rem',
      outline: 'none',
    },
    textarea: {
      padding: '0.5rem 0.75rem',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: '0.95rem',
      outline: 'none',
      minHeight: '80px',
      fontFamily: 'inherit',
    },
    checkboxGroup: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' },
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
      marginRight: '0.5rem',
    },
    buttonDanger: {
      background: '#dc2626',
      color: '#fff',
      padding: '0.25rem 0.75rem',
      fontSize: '0.8rem',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
    },
    buttonSecondary: {
      background: '#e2e8f0',
      color: '#1e293b',
      padding: '0.5rem 1.5rem',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '500',
      cursor: 'pointer',
    },
    buttonDisabled: { opacity: 0.6, cursor: 'not-allowed' },
    error: { color: '#dc2626', fontSize: '0.9rem', marginTop: '0.5rem' },
    success: { color: '#16a34a', fontSize: '0.9rem', marginTop: '0.5rem' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '0.75rem 0.5rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: '600' },
    td: { padding: '0.75rem 0.5rem', borderBottom: '1px solid #f1f5f9' },
    badgeActive: { background: '#d1fae5', color: '#065f46', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' },
    badgeInactive: { background: '#fee2e2', color: '#991b1b', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' },
    actions: { display: 'flex', gap: '0.5rem' },
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
    modalTitle: { fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' },
    modalMessage: { color: '#475569', marginBottom: '1.5rem' },
    modalActions: { display: 'flex', gap: '0.75rem', justifyContent: 'center' },
    modalButtonCancel: {
      padding: '0.5rem 1.5rem',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      background: '#fff',
      color: '#1e293b',
      fontWeight: '500',
      cursor: 'pointer',
    },
    modalButtonDelete: {
      padding: '0.5rem 1.5rem',
      border: 'none',
      borderRadius: '8px',
      background: '#dc2626',
      color: '#fff',
      fontWeight: '500',
      cursor: 'pointer',
    },
    loading: { textAlign: 'center', padding: '3rem', color: '#64748b' },
    fileInput: { padding: '0.5rem 0' },
  };

  if (loading) return <div style={styles.loading}>Loading products...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Product Management</h1>

      {/* ---- Form ---- */}
      <div style={styles.card}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          {editingId ? 'Edit Product' : 'Add New Product'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Slug *</label>
              <input
                type="text"
                name="slug"
                value={formData.slug || ''}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="auto-generated if empty"
              />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              style={styles.textarea}
            />
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Category *</label>
              <select
                name="category"
                value={formData.category || 0}
                onChange={handleChange}
                required
                style={styles.input}
              >
                <option value={0}>Select category</option>
                {Array.isArray(categories) && categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>SKU</label>
              <input
                type="text"
                name="sku"
                value={formData.sku || ''}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Retail Price *</label>
              <input
                type="number"
                step="0.01"
                name="retail_price"
                value={formData.retail_price || ''}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Wholesale Price</label>
              <input
                type="number"
                step="0.01"
                name="wholesale_price"
                value={formData.wholesale_price || ''}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock || 0}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Low Stock Threshold</label>
              <input
                type="number"
                name="low_stock_threshold"
                value={formData.low_stock_threshold || 10}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Brand</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Weight (grams)</label>
              <input
                type="number"
                name="weight_grams"
                value={formData.weight_grams || ''}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Dimensions</label>
            <input
              type="text"
              name="dimensions"
              value={formData.dimensions || ''}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g., 10x20x30 cm"
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.checkboxGroup}>
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active || false}
                onChange={handleChange}
                style={{ width: '1.1rem', height: '1.1rem' }}
              />
              <label style={styles.label}>Active</label>
            </div>
            <div style={styles.checkboxGroup}>
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured || false}
                onChange={handleChange}
                style={{ width: '1.1rem', height: '1.1rem' }}
              />
              <label style={styles.label}>Featured</label>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Product Image (primary)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={styles.fileInput}
            />
            {imageFile && <span style={{ fontSize: '0.9rem', color: '#2563eb' }}>{imageFile.name}</span>}
          </div>

          <div>
            <button type="submit" disabled={submitting} style={{ ...styles.button, ...(submitting ? styles.buttonDisabled : {}) }}>
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} style={styles.buttonSecondary}>
                Cancel
              </button>
            )}
          </div>
          {formError && <div style={styles.error}>{formError}</div>}
          {formSuccess && <div style={styles.success}>Product saved successfully!</div>}
        </form>
      </div>

      {/* ---- Product List ---- */}
      <div style={styles.card}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>All Products</h2>
        {products.length === 0 ? (
          <p>No products yet.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td style={styles.td}>{p.id}</td>
                  <td style={styles.td}>{p.name}</td>
                  <td style={styles.td}>NRs. {p.retail_price}</td>
                  <td style={styles.td}>{p.stock}</td>
                  <td style={styles.td}>
                    <span style={p.is_active ? styles.badgeActive : styles.badgeInactive}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        onClick={() => handleEdit(p)}
                        style={{ ...styles.buttonDanger, background: '#2563eb' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(p.id)}
                        style={styles.buttonDanger}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ---- Delete Modal ---- */}
      {deleteModalOpen && (
        <div style={styles.modalOverlay} onClick={closeDeleteModal}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Delete Product</h3>
            <p style={styles.modalMessage}>Are you sure? This action cannot be undone.</p>
            <div style={styles.modalActions}>
              <button style={styles.modalButtonCancel} onClick={closeDeleteModal}>Cancel</button>
              <button style={styles.modalButtonDelete} onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};