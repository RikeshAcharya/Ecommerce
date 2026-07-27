import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './AdminDashboard.module.css';

interface Product {
  id: number;
  name: string;
  sku: string;
  retail_price: number;
  wholesale_price: number;
  stock: number;
  description: string;
  category: number;
  is_active: boolean;
  images: { image: string; is_primary: boolean }[];
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  // Redirect if not staff
  useEffect(() => {
    if (user && !user.is_staff) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('products/'),
          api.get('categories/'),
        ]);
        setProducts(productsRes.data.results || productsRes.data);
        setCategories(categoriesRes.data.results || categoriesRes.data);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Delete product
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`products/${id}/`);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  // Open edit modal
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
  };

  // Close modal
  const handleCloseModal = () => {
    setEditingProduct(null);
    setFormData({});
  };

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  // Submit create/update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        // Update
        const { data } = await api.put(`products/${editingProduct.id}/`, formData);
        setProducts(products.map(p => (p.id === data.id ? data : p)));
      } else {
        // Create
        const { data } = await api.post('products/', formData);
        setProducts([data, ...products]);
      }
      handleCloseModal();
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <h1>Admin Dashboard – Products</h1>
      <button className={styles.createBtn} onClick={() => setEditingProduct({} as Product)}>
        + Add Product
      </button>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>SKU</th>
            <th>Retail Price</th>
            <th>Wholesale Price</th>
            <th>Stock</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>{product.name}</td>
              <td>{product.sku}</td>
              <td>${product.retail_price}</td>
              <td>${product.wholesale_price}</td>
              <td>{product.stock}</td>
              <td>{product.is_active ? '✅' : '❌'}</td>
              <td>
                <button className={styles.editBtn} onClick={() => handleEdit(product)}>Edit</button>
                <button className={styles.deleteBtn} onClick={() => handleDelete(product.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for create/edit */}
      {editingProduct !== null && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{editingProduct.id ? 'Edit Product' : 'Create Product'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Name *</label>
                <input name="name" value={formData.name || ''} onChange={handleChange} required />
              </div>
              <div className={styles.formGroup}>
                <label>SKU *</label>
                <input name="sku" value={formData.sku || ''} onChange={handleChange} required />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea name="description" value={formData.description || ''} onChange={handleChange} />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Retail Price *</label>
                  <input type="number" step="0.01" name="retail_price" value={formData.retail_price || ''} onChange={handleChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Wholesale Price</label>
                  <input type="number" step="0.01" name="wholesale_price" value={formData.wholesale_price || ''} onChange={handleChange} />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Stock</label>
                  <input type="number" name="stock" value={formData.stock || 0} onChange={handleChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select name="category" value={formData.category || ''} onChange={handleChange}>
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>
                  <input type="checkbox" name="is_active" checked={formData.is_active || false} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} />
                  Active
                </label>
              </div>
              <div className={styles.modalActions}>
                <button type="submit" className={styles.saveBtn}>Save</button>
                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;