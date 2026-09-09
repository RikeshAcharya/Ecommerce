// src/components/Header.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export const Header: React.FC = () => {
  const { totalItems } = useCart();

  return (
    <header>
      <nav>
        <Link to="/">Shop</Link>
        <Link to="/cart" style={{ marginLeft: '1rem' }}>
          🛒 Cart ({totalItems})
        </Link>
      </nav>
    </header>
  );
};