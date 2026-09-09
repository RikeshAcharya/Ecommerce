// src/pages/LandingPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      <div className="landing-content">
        <div className="brand-section">
          <div className="brand-icon">🛍️</div>
          <h1 className="brand-name">Stationary</h1>
          <p className="brand-tagline">Your trusted online marketplace</p>
          <p className="brand-description">
            Quality products, secure payments, and fast delivery – all in one place.
          </p>
        </div>

        <div className="actions-section">
          <h2>Get Started</h2>
          <div className="action-buttons">
            <Link to="/login" className="btn-primary">Sign In</Link>
            <Link to="/register" className="btn-secondary">Create Account</Link>
          </div>
          <ul className="feature-list">
            <li>✓ Thousands of products</li>
            <li>✓ Secure checkout</li>
            <li>✓ Fast delivery</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;