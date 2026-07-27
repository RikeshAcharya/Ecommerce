import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../api/services/authService';
import './Register.css'; // 👈 IMPORT THE CSS FILE

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password2: '',
    user_type: 'B2C' as 'B2B' | 'B2C',
    company_name: '',
    phone_number: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.register(formData);
      navigate('/login');
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const firstError = Object.values(data)[0];
        setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-stationery">
      <div className="register-card">
        
        <h2>Create Account</h2>
        <p className="subtitle">Join the Stationery community</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="username"
              className="input-field"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              name="email"
              className="input-field"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              name="first_name"
              className="input-field"
              placeholder="First Name"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              name="last_name"
              className="input-field"
              placeholder="Last Name"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              name="password"
              className="input-field"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              name="password2"
              className="input-field"
              placeholder="Confirm Password"
              value={formData.password2}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <select
              name="user_type"
              className="select-field"
              value={formData.user_type}
              onChange={handleChange}
            >
              <option value="B2C">Retail (B2C)</option>
              <option value="B2B">Wholesale (B2B)</option>
            </select>
          </div>

          {/* Conditional B2B fields */}
          {formData.user_type === 'B2B' && (
            <div className="conditional-group">
              <div className="form-group">
                <input
                  type="text"
                  name="company_name"
                  className="input-field"
                  placeholder="Company Name"
                  value={formData.company_name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  name="phone_number"
                  className="input-field"
                  placeholder="Phone Number"
                  value={formData.phone_number}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="footer-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>

      </div>
    </div>
  );
};

export default Register;