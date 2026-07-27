import apiClient from '../client';
import type { Review } from '../types';

export const reviewService = {
  getProductReviews: async (productId: number): Promise<Review[]> => {
    const response = await apiClient.get(`/products/${productId}/reviews/`);
    return response.data;
  },

  createReview: async (productId: number, data: { rating: number; comment?: string }): Promise<Review> => {
    const response = await apiClient.post(`/products/${productId}/reviews/`, data);
    return response.data;
  },
};