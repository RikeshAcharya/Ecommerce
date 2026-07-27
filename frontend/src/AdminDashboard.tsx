import React, { useEffect, useState } from 'react';
import { productService } from '../api/services/productService';
import { orderService } from '../api/services/orderService';
import { Product, Order } from '../api/types';
import { useAuth } from '../context/AuthContext';

const AdminDashboard: React.FC = () => {
  const { user, isB2B } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, ordersData] = await Promise.all([
          productService.getAll(),
          orderService.getMyOrders(),
        ]);
        setProducts(productsData.results || []);
        setOrders(ordersData);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData(); // only if authenticated
  }, [user]);

  if (loading) return <div>Loading dashboard...</div>;
  if (!user) return <div>Please log in.</div>;

  return (
    <div>
      <h1>Welcome, {user.username} ({user.user_type})</h1>
      <p>You are {isB2B ? 'B2B' : 'B2C'} user.</p>

      <section>
        <h2>Products ({products.length})</h2>
        <ul>
          {products.map(p => (
            <li key={p.id}>
              {p.name} – ${p.price} (stock: {p.stock})
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>My Orders ({orders.length})</h2>
        <ul>
          {orders.map(o => (
            <li key={o.id}>
              Order #{o.order_number} – {o.status} – ${o.total_amount}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AdminDashboard;