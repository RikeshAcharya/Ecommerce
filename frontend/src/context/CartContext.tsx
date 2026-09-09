// src/context/CartContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartService } from '../api/services/cartService';
import type { Cart } from '../types';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  totalItems: number;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchCart = async () => {
    // Don't attempt to fetch (and trigger a 401 redirect) when not authenticated.
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await cartService.getCart();
      setCart(data);
    } catch (error) {
      console.error('Failed to fetch cart', error);
      // Optionally, you can set cart to null or an empty state
    } finally {
      setIsLoading(false);
    }
  };

  // Compute total number of items (sum of quantities)
  const totalItems = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Fetch cart once auth state is resolved and the user is logged in
  useEffect(() => {
    if (!authLoading && user) {
      fetchCart();
    }
  }, [authLoading, user]);

  return (
    <CartContext.Provider value={{ cart, totalItems, isLoading, refreshCart: fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};