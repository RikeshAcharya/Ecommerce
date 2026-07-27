import apiClient from '../client';
import type { B2BQuote } from '../types';

export const quoteService = {
  createQuote: async (data: { product_id: number; quantity: number; requested_price: string; notes?: string }): Promise<B2BQuote> => {
    const response = await apiClient.post('/quotes/', data);
    return response.data;
  },

  getMyQuotes: async (): Promise<B2BQuote[]> => {
    const response = await apiClient.get('/quotes/');
    return response.data;
  },
};