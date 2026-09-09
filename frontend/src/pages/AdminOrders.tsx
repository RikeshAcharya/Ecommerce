import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

interface OrderItem {
  id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  price: string;
  total: string;
}

interface Order {
  id: number;
  order_number: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
  status: string;
  status_display: string;
  total_amount: string;
  created_at: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country: string;
  payment_method: string;
  payment_status: string;
  items: OrderItem[];
}

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `/orders/?page=${page}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (searchTerm) url += `&search=${searchTerm}`;
      const res = await apiClient.get(url);
      setOrders(res.data.results || res.data);
      setTotalPages(Math.ceil((res.data.count || res.data.length) / 20));
    } catch (err) {
      setError('Failed to load orders.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, searchTerm]);

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await apiClient.patch(`/orders/${orderId}/`, { status: newStatus });
      // Refresh the list
      fetchOrders();
    } catch (err) {
      alert('Failed to update order status.');
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#fef3c7',
      processing: '#dbeafe',
      confirmed: '#e0e7ff',
      shipped: '#d1fae5',
      delivered: '#a7f3d0',
      cancelled: '#fee2e2',
    };
    return colors[status] || '#f3f4f6';
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
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '0.75rem 0.5rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: '600' },
    td: { padding: '0.75rem 0.5rem', borderBottom: '1px solid #f1f5f9' },
    badge: (status: string) => ({
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      background: getStatusColor(status),
      color: '#1e293b',
    }),
    button: {
      padding: '0.25rem 0.75rem',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.8rem',
      background: '#2563eb',
      color: '#fff',
      marginRight: '0.5rem',
    },
    buttonDanger: {
      padding: '0.25rem 0.75rem',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.8rem',
      background: '#dc2626',
      color: '#fff',
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
      maxWidth: '700px',
      width: '90%',
      maxHeight: '80vh',
      overflowY: 'auto' as const,
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    },
    filterRow: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.5rem',
      flexWrap: 'wrap' as const,
    },
    input: {
      padding: '0.5rem 0.75rem',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: '0.95rem',
      flex: 1,
      minWidth: '200px',
    },
    select: {
      padding: '0.5rem 0.75rem',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: '0.95rem',
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      gap: '0.5rem',
      marginTop: '1.5rem',
    },
    pageButton: (active: boolean) => ({
      padding: '0.5rem 1rem',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      background: active ? '#2563eb' : '#fff',
      color: active ? '#fff' : '#1e293b',
      cursor: 'pointer',
    }),
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading orders...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '3rem' }}>{error}</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Order Management</h1>

      <div style={styles.card}>
        {/* Filters */}
        <div style={styles.filterRow}>
          <input
            type="text"
            placeholder="Search order #"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.input}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.select}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Table */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Order #</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td style={styles.td}>{order.order_number}</td>
                <td style={styles.td}>{order.user.username}</td>
                <td style={styles.td}>${order.total_amount}</td>
                <td style={styles.td}>
                  <span style={styles.badge(order.status)}>{order.status_display}</span>
                </td>
                <td style={styles.td}>{new Date(order.created_at).toLocaleDateString()}</td>
                <td style={styles.td}>
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setModalOpen(true);
                    }}
                    style={styles.button}
                  >
                    View
                  </button>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    style={{ padding: '0.25rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={styles.pagination}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={styles.pageButton(p === page)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Order Details Modal */}
      {modalOpen && selectedOrder && (
        <div style={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2>Order #{selectedOrder.order_number}</h2>
            <p><strong>Customer:</strong> {selectedOrder.user.username} ({selectedOrder.user.email})</p>
            <p><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
            <p><strong>Status:</strong> <span style={styles.badge(selectedOrder.status)}>{selectedOrder.status_display}</span></p>
            <p><strong>Payment Method:</strong> {selectedOrder.payment_method}</p>
            <p><strong>Payment Status:</strong> {selectedOrder.payment_status}</p>
            <p><strong>Total:</strong> ${selectedOrder.total_amount}</p>
            <hr />
            <h3>Shipping Address</h3>
            <p>{selectedOrder.shipping_address}</p>
            <p>{selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_zip}</p>
            <p>{selectedOrder.shipping_country}</p>
            <hr />
            <h3>Items</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Product</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name} (SKU: {item.product_sku})</td>
                    <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>${item.price}</td>
                    <td style={{ textAlign: 'right' }}>${item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setModalOpen(false)} style={{ marginTop: '1rem', ...styles.button }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};