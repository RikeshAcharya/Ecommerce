import apiClient from '../client';
import type { WishlistItem } from '../types';

export const wishlistService = {
  getMyWishlist: async (): Promise<WishlistItem[]> => {
    const response = await apiClient.get('/wishlist/');
    return response.data;
  },

  addToWishlist: async (productId: number): Promise<WishlistItem> => {
    const response = await apiClient.post('/wishlist/', { product_id: productId });
    return response.data;
  },

  removeFromWishlist: async (id: number): Promise<void> => {
    await apiClient.delete(`/wishlist/${id}/`);
  },
};