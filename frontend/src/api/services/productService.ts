// src/api/services/productService.ts
import apiClient from '../client';
import type { ProductList } from '../types';

export const productService = {
  // ✅ GET /api/products/ (from router)
  getAll: async (): Promise<{ results: ProductList[] }> => {
    const response = await apiClient.get('/products/');
    return response.data;
  },

  // ✅ GET /api/products/{id}/ (from router)
  getById: async (id: string): Promise<ProductList> => {
    const response = await apiClient.get(`/products/${id}/`);
    return response.data;
  },

  // ✅ POST /api/products/ (from router)
  create: async (data: any): Promise<ProductList> => {
    const response = await apiClient.post('/products/', data);
    return response.data;
  },

  // ✅ PUT /api/products/{id}/ (from router)
  update: async (id: string, data: any): Promise<ProductList> => {
    const response = await apiClient.put(`/products/${id}/`, data);
    return response.data;
  },

  // ✅ DELETE /api/products/{id}/ (from router)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}/`);
  },
};