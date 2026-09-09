import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import apiClient from './api/client';
import Login from './components/Login';
import Register from './components/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminCategories } from './pages/AdminCategories';
import { AdminProducts } from './pages/AdminProducts';
import { AdminOrders } from './pages/AdminOrders';
import { AdminUsers } from './pages/AdminUsers';
import ProductCatalog from './components/ProductCatalog';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Home } from './pages/Home';               
import { CategoryList } from './pages/CategoryList';
import { Profile } from './pages/Profile';
import { AddressList } from './pages/AddressList';
import { OrderList } from './pages/OrderList';
import { NotFound } from './pages/NotFound';
import { Checkout } from './pages/Checkout';
import styles from './components/NavBar.module.css';
import './styles/auth.css';

// ─── Types ───
interface Category {
  id: number;
  name: string;
  slug: string;
}

// ============================
// 1. Regular NavBar (users + category dropdown)
// ============================
const NavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  

  // Fetch categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get('/categories/');
        let cats: Category[] = [];
        if (Array.isArray(res.data)) cats = res.data;
        else if (res.data?.results) cats = res.data.results;
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load categories for nav:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/shop');
    }
    setSearchQuery('');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navTop}>
        <Link to="/" className={styles.logo}>
          <span>E</span>Stationary
        </Link>

        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            🔍
          </button>
        </form>

        <ul className={styles.navLinks}>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/shop">Shop</Link></li>

          {/* Categories dropdown – hover to open */}
          <li
            className={styles.dropdown}
            onMouseEnter={() => setCategoriesDropdownOpen(true)}
            onMouseLeave={() => setCategoriesDropdownOpen(false)}
          >
            <span className={styles.dropdownToggle} style={{ cursor: 'pointer' }}>
              Categories <span style={{ fontSize: '10px' }}>▼</span>
            </span>
            <div className={`${styles.dropdownMenu} ${categoriesDropdownOpen ? styles.dropdownOpen : ''}`}>
              {categoriesLoading ? (
                <div className={styles.dropdownItem} style={{ color: '#94a3b8' }}>Loading...</div>
              ) : categories.length === 0 ? (
                <div className={styles.dropdownItem} style={{ color: '#94a3b8' }}>No categories</div>
              ) : (
                categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/shop?category=${cat.slug}`}
                    className={styles.dropdownItem}
                    onClick={() => setCategoriesDropdownOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))
              )}
            </div>
          </li>

          {user && user.is_staff && <li><Link to="/admin">Admin</Link></li>}
          {user && user.is_staff && (
            <li>
              <a href="http://127.0.0.1:8000/admin/" target="_blank" rel="noopener noreferrer">
                Django Admin
              </a>
            </li>
          )}
          <li><Link to="/cart">Cart ({totalItems})</Link></li>
          <li>
            {user ? (
              <div className={styles.dropdown} ref={dropdownRef}>
                <button
                  className={styles.dropdownToggle}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {user.username}
                  <span style={{ fontSize: '12px' }}>▼</span>
                </button>
                <div className={`${styles.dropdownMenu} ${dropdownOpen ? styles.dropdownOpen : ''}`}>
                  <Link to="/profile" onClick={() => setDropdownOpen(false)}>My Profile</Link>
                  <Link to="/addresses" onClick={() => setDropdownOpen(false)}>Addresses</Link>
                  <Link to="/orders" onClick={() => setDropdownOpen(false)}>Orders</Link>
                  <hr />
                  <button onClick={handleLogout}>Logout</button>
                </div>
              </div>
            ) : (
              <Link to="/login">Login</Link>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
};

// ============================
// 2. Admin NavBar (no category dropdown)
// ============================
const AdminNavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <nav className={styles.adminNavbar}>
      <Link to="/admin" className={styles.logo}>
        <span>Admin</span>Panel
      </Link>
      <ul className={styles.navLinks}>
        <li><Link to="/admin" className={isActive('/admin')}>Dashboard</Link></li>
        <li><Link to="/admin/categories" className={isActive('/admin/categories')}>Categories</Link></li>
        <li><Link to="/admin/products" className={isActive('/admin/products')}>Products</Link></li>
        <li><Link to="/admin/orders" className={isActive('/admin/orders')}>Orders</Link></li>
        <li><Link to="/admin/users" className={isActive('/admin/users')}>Users</Link></li>
        <li>
          <a href="http://127.0.0.1:8000/admin/" target="_blank" rel="noopener noreferrer">
            Django Admin
          </a>
        </li>
        <li>
          <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
        </li>
      </ul>
    </nav>
  );
};

// ============================
// 3. Layouts
// ============================
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return (
    <>
      {user?.is_staff ? <AdminNavBar /> : <NavBar />}
      {children}
    </>
  );
};

// ============================
// 4. PrivateRoute (unchanged)
// ============================
const PrivateRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !user.is_staff) return <Navigate to="/" />;
  return <>{children}</>;
};

// ============================
// 5. Main App
// ============================
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Home page – public, but with navbar */}
            <Route path="/" element={<AppLayout><Home /></AppLayout>} />

            {/* Protected – user */}
            <Route path="/shop" element={<PrivateRoute><AppLayout><ProductCatalog /></AppLayout></PrivateRoute>} />
            <Route path="/product/:id" element={<PrivateRoute><AppLayout><ProductDetail /></AppLayout></PrivateRoute>} />
            <Route path="/cart" element={<PrivateRoute><AppLayout><Cart /></AppLayout></PrivateRoute>} />
            <Route path="/categories" element={<PrivateRoute><AppLayout><CategoryList /></AppLayout></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><AppLayout><Profile /></AppLayout></PrivateRoute>} />
            <Route path="/addresses" element={<PrivateRoute><AppLayout><AddressList /></AppLayout></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute><AppLayout><OrderList /></AppLayout></PrivateRoute>} />
			<Route path="/checkout" element={<PrivateRoute><AppLayout><Checkout /></AppLayout></PrivateRoute>} />

            {/* Admin-only */}
            <Route path="/admin" element={<PrivateRoute adminOnly><AppLayout><AdminDashboard /></AppLayout></PrivateRoute>} />
            <Route path="/admin/categories" element={<PrivateRoute adminOnly><AppLayout><AdminCategories /></AppLayout></PrivateRoute>} />
            <Route path="/admin/products" element={<PrivateRoute adminOnly><AppLayout><AdminProducts /></AppLayout></PrivateRoute>} />
            <Route path="/admin/orders" element={<PrivateRoute adminOnly><AppLayout><AdminOrders /></AppLayout></PrivateRoute>} />
            <Route path="/admin/users" element={<PrivateRoute adminOnly><AppLayout><AdminUsers /></AppLayout></PrivateRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;