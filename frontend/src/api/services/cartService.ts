// src/api/services/cartService.ts
import apiClient from '../client';

export const cartService = {
  // GET /api/cart/
  getCart: async (): Promise<any> => {
    const response = await apiClient.get('/cart/');
    return response.data;
  },

  // POST /api/cart/  --> accepts product_id, quantity, and optional variant
  addToCart: async (data: { 
    product_id: number; 
    quantity: number; 
    variant?: number;  // variant ID (optional)
  }): Promise<any> => {
    const response = await apiClient.post('/cart/', data);
    return response.data;
  },

  // PUT /api/cart/{id}/
  updateCartItem: async (id: number, data: { quantity: number }): Promise<any> => {
    const response = await apiClient.put(`/cart/${id}/`, data);
    return response.data;
  },

  // DELETE /api/cart/{id}/
  removeFromCart: async (id: number): Promise<void> => {
    await apiClient.delete(`/cart/${id}/`);
  },

  // Clear cart
  clearCart: async (): Promise<void> => {
    await apiClient.post('/cart/clear/');
  },
};