// src/api/services/cartService.ts
import apiClient from '../client';
import type { CartItem } from '../types';

export const cartService = {
  // ✅ GET /api/cart/ (from router)
  getCart: async (): Promise<any> => {
    const response = await apiClient.get('/cart/');
    return response.data;
  },

  // ✅ POST /api/cart/ (from router)
  addToCart: async (data: { product_id: number; quantity: number }): Promise<any> => {
    const response = await apiClient.post('/cart/', data);
    return response.data;
  },

  // ✅ PUT /api/cart/{id}/ (from router)
  updateCartItem: async (id: number, data: { quantity: number }): Promise<any> => {
    const response = await apiClient.put(`/cart/${id}/`, data);
    return response.data;
  },

  // ✅ DELETE /api/cart/{id}/ (from router)
  removeFromCart: async (id: number): Promise<void> => {
    await apiClient.delete(`/cart/${id}/`);
  },

  // ❓ Custom action: Clear cart
  clearCart: async (): Promise<void> => {
    await apiClient.post('/cart/clear/');
  },
};