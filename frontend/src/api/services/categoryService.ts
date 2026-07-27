import apiClient from '../client';
import type { ProductCategory } from '../types';

export const categoryService = {
  getAll: async (): Promise<ProductCategory[]> => {
    const response = await apiClient.get('/categories/');
    return response.data;
  },
};