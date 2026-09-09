import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register: React.FC = () => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone_number: '',
    user_type: 'b2c',
    company_name: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      // Send password2 as the confirmation field
      const payload = {
        ...data,
        password2: confirmPassword,
      };
      await register(payload);
      navigate('/login');
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const messages = Object.entries(errorData)
            .map(([field, fieldErrors]) => {
              if (Array.isArray(fieldErrors)) {
                return `${field}: ${fieldErrors.join(' ')}`;
              }
              return `${field}: ${fieldErrors}`;
            })
            .join(' | ');
          setError(messages);
        } else {
          setError(String(errorData));
        }
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'username', label: 'Username', type: 'text', placeholder: 'Choose a username' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter your email' },
    { name: 'phone_number', label: 'Phone Number', type: 'tel', placeholder: 'Enter phone number' },
  ];

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-hero">
          <h1>Join E‑Commerce</h1>
          <p>Create your account and start shopping today.</p>
          <div className="auth-features">
            <span>✓ Exclusive deals</span>
            <span>✓ Wishlist & reviews</span>
            <span>✓ Order tracking</span>
          </div>
        </div>
        <div className="auth-card register-card">
          <h2>Create Account</h2>
          <form onSubmit={handleSubmit}>
            {fields.map((field) => (
              <div className="form-group" key={field.name}>
                <label htmlFor={field.name}>{field.label}</label>
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  value={form[field.name as keyof typeof form] as string}
                  onChange={handleChange}
                  required
                  placeholder={field.placeholder}
                />
              </div>
            ))}
            <div className="form-group">
              <label htmlFor="user_type">Account Type</label>
              <select
                id="user_type"
                name="user_type"
                value={form.user_type}
                onChange={handleChange}
              >
                <option value="b2c">Retail Customer (B2C)</option>
                <option value="b2b">Wholesale Business (B2B)</option>
              </select>
            </div>
            {form.user_type === 'b2b' && (
              <div className="form-group">
                <label htmlFor="company_name">Company Name</label>
                <input
                  id="company_name"
                  name="company_name"
                  type="text"
                  value={form.company_name}
                  onChange={handleChange}
                  placeholder="Enter your company name"
                />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Create a password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;