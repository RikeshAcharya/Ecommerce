import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import LogoutButton from './components/LogoutButton';
import AdminDashboard from './pages/AdminDashboard';
import ProductCatalog from './components/ProductCatalog';
import styles from './components/NavBar.module.css';
import './styles/auth.css';

const NavBar: React.FC = () => {
  const { user } = useAuth();
  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        <span>E</span>Commerce
      </Link>
      <ul className={styles.navLinks}>
        <li>
          <Link to="/">Home</Link>
        </li>
        {user && user.is_staff && (
          <li>
            <Link to="/admin">Admin</Link>
          </li>
        )}
        {user && user.is_staff && (
          <li>
            <a href="http://127.0.0.1:8000/admin/" target="_blank" rel="noopener noreferrer">
              Django Admin
            </a>
          </li>
        )}
        <li>
          {user ? (
            <LogoutButton />
          ) : (
            <Link to="/login">Login</Link>
          )}
        </li>
      </ul>
    </nav>
  );
};

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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavBar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <ProductCatalog />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute adminOnly>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;