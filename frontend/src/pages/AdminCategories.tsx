import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  image_url: string | null;   // 👈 full Cloudinary URL
  parent: number | null;
  is_active: boolean;
}

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent: '',
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/categories/');
      let categoriesData: Category[] = [];
      if (Array.isArray(res.data)) {
        categoriesData = res.data;
      } else if (res.data?.results) {
        categoriesData = res.data.results;
      }
      setCategories(categoriesData);
    } catch (err) {
      setError('Failed to load categories.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
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
      parent: '',
      is_active: true,
    });
    setImageFile(null);
    setExistingImage(null);
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
      payload.append('name', formData.name);
      payload.append('slug', formData.slug);
      if (formData.description) payload.append('description', formData.description);
      if (formData.parent) payload.append('parent', formData.parent);
      payload.append('is_active', String(formData.is_active));
      if (imageFile) {
        payload.append('image_upload', imageFile);
      }

      // Debug log
      console.log('=== Uploading Category ===');
      for (let [key, value] of payload.entries()) {
        console.log(key, value);
      }
      console.log('==========================');

      if (editingId) {
        await apiClient.patch(`/categories/${editingId}/`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setFormSuccess(true);
      } else {
        await apiClient.post('/categories/', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setFormSuccess(true);
        resetForm();
      }
      await fetchCategories();
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.image_upload ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to save category.';
      setFormError(errorMsg);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parent: category.parent ? String(category.parent) : '',
      is_active: category.is_active,
    });
    setExistingImage(category.image_url);   // ✅ use full URL
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => resetForm();

  // Delete handlers
  const openDeleteModal = (id: number) => {
    setCategoryToDelete(id);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCategoryToDelete(null);
  };
  const confirmDelete = async () => {
    if (categoryToDelete === null) return;
    try {
      await apiClient.delete(`/categories/${categoryToDelete}/`);
      await fetchCategories();
      closeDeleteModal();
    } catch (err) {
      alert('Failed to delete category.');
      console.error(err);
      closeDeleteModal();
    }
  };

  // --- Inline styles ---
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
    thumbnail: {
      maxWidth: '100px',
      maxHeight: '80px',
      marginTop: '0.5rem',
      borderRadius: '4px',
      border: '1px solid #e2e8f0',
    },
  };

  if (loading) return <div style={styles.loading}>Loading categories...</div>;
  if (error) return <div style={styles.loading}>{error}</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Category Management</h1>

      {/* ---- Form ---- */}
      <div style={styles.card}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          {editingId ? 'Edit Category' : 'Add New Category'}
        </h2>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
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
                value={formData.slug}
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
              value={formData.description}
              onChange={handleChange}
              style={styles.textarea}
            />
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Parent Category</label>
              <select
                name="parent"
                value={formData.parent}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="">None</option>
                {Array.isArray(categories) &&
                  categories
                    .filter(c => c.id !== editingId)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <div style={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  style={{ width: '1.1rem', height: '1.1rem' }}
                />
                <label style={styles.label}>Active</label>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Category Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={styles.fileInput}
            />
            {imageFile && <span style={{ fontSize: '0.9rem', color: '#2563eb' }}>{imageFile.name}</span>}
            {existingImage && !imageFile && (
              <div>
                <img src={existingImage} alt="Current category" style={styles.thumbnail} />
                <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem' }}>Current image</span>
              </div>
            )}
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
          {formSuccess && <div style={styles.success}>Category saved successfully!</div>}
        </form>
      </div>

      {/* ---- Category List ---- */}
      <div style={styles.card}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>All Categories</h2>
        {!Array.isArray(categories) || categories.length === 0 ? (
          <p>No categories yet.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Image</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Slug</th>
                <th style={styles.th}>Parent</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td style={styles.td}>{cat.id}</td>
                  <td style={styles.td}>
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td style={styles.td}>{cat.name}</td>
                  <td style={styles.td}>{cat.slug}</td>
                  <td style={styles.td}>{cat.parent ? categories.find(c => c.id === cat.parent)?.name : '—'}</td>
                  <td style={styles.td}>
                    <span style={cat.is_active ? styles.badgeActive : styles.badgeInactive}>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        onClick={() => handleEdit(cat)}
                        style={{ ...styles.buttonDanger, background: '#2563eb' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(cat.id)}
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
            <h3 style={styles.modalTitle}>Delete Category</h3>
            <p style={styles.modalMessage}>Are you sure? This will also delete any sub‑categories.</p>
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