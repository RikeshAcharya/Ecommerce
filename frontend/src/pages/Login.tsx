import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../api/services/authService';
import './Login.css'; // 👈 IMPORT THE CSS FILE

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'github') => {
    window.location.href = `${API_BASE}/auth/oauth/login/${provider}/`;
  };

  return (
    <div className="login-stationery">
      <div className="login-card">
        
        <h2>Stationery App</h2>
        <p className="subtitle">Welcome back. Please sign in.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              className="input-field"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              className="input-field"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="divider">or continue with</div>

        <div className="oauth-group">
          <button
            type="button"
            className="btn-oauth google"
            onClick={() => handleOAuth('google')}
          >
            Login with Google
          </button>
          <button
            type="button"
            className="btn-oauth github"
            onClick={() => handleOAuth('github')}
          >
            Login with GitHub
          </button>
        </div>

        <p className="footer-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>

      </div>
    </div>
  );
};

export default Login;