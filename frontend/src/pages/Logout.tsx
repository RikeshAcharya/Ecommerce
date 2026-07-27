import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Logout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    const timer = setTimeout(() => navigate('/login', { replace: true }), 2000);
    return () => clearTimeout(timer);
  }, [logout, navigate]);

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 20, textAlign: 'center' }}>
      <h2>You have been logged out</h2>
      <p>Thank you for visiting. Redirecting to login...</p>
      <p>
        <Link to="/login">Go to Login</Link>
      </p>
    </div>
  );
};

export default Logout;
