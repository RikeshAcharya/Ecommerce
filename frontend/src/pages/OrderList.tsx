import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import '../styles/global.css';

interface Order {
  id: number;
  order_number: string;
  total_amount: string;
  status: string;
  created_at: string;
}

export const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await apiClient.get('/orders/');
        setOrders(res.data);
      } catch (error) {
        console.error('Failed to fetch orders', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1>My Orders</h1>
      {orders.length === 0 ? (
        <p>You haven't placed any orders yet.</p>
      ) : (
        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left' }}>Order #</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left' }}>Total</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                let badgeClass = 'badge badge-info';
                if (order.status === 'delivered') badgeClass = 'badge badge-success';
                else if (order.status === 'cancelled') badgeClass = 'badge badge-danger';
                else if (order.status === 'pending') badgeClass = 'badge badge-warning';

                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{order.order_number}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>${order.total_amount}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span className={badgeClass}>{order.status}</span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <Link to={`/orders/${order.id}`} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem' }}>
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};