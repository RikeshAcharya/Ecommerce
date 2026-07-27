import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productService } from '../api/services/productService';
import { orderService } from '../api/services/orderService';
import type { ProductList, Order } from '../api/types';

const Dashboard: React.FC = () => {
  const { user, logout, isB2B } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductList[]>([]);
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
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Welcome, {user?.username}!</h1>
          <p>User type: {user?.user_type}</p>
          <p>You are {isB2B ? 'B2B' : 'B2C'} user.</p>
        </div>
        <div>
          <Link to="/logout" style={{ marginRight: 12 }}>Logout</Link>
          <button onClick={handleLogout}>Logout (direct)</button>
        </div>
      </header>

      <section>
        <h2>Products ({products.length})</h2>
        <ul>
          {products.map(p => (
            <li key={p.id}>
              <Link to={`/product/${p.id}`}>{p.name}</Link> – ${p.price} (stock: {p.stock})
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

export default Dashboard;
