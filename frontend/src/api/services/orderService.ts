// src/api/services/orderService.ts
import apiClient from '../client';
import type { Order } from '../types';

export const orderService = {
  // ✅ GET /api/orders/ (from router)
  getMyOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get('/orders/');
    const data = response.data;
    return Array.isArray(data) ? data : data.results || [];
  },

  // ✅ GET /api/orders/{id}/ (from router)
  getOrderDetail: async (id: number): Promise<Order> => {
    const response = await apiClient.get(`/orders/${id}/`);
    return response.data;
  },

  // ✅ POST /api/orders/ (from router)
  createOrder: async (orderData: any): Promise<Order> => {
    const response = await apiClient.post('/orders/', orderData);
    return response.data;
  },

  // ✅ PUT /api/orders/{id}/ (from router)
  updateOrder: async (id: number, data: any): Promise<Order> => {
    const response = await apiClient.put(`/orders/${id}/`, data);
    return response.data;
  },

  // ✅ DELETE /api/orders/{id}/ (from router)
  deleteOrder: async (id: number): Promise<void> => {
    await apiClient.delete(`/orders/${id}/`);
  },

  // ❓ Custom action: You might need to add this to your OrderViewSet
  // POST /api/orders/{id}/update_status/ (custom @action)
  updateOrderStatus: async (id: number, status: string): Promise<void> => {
    await apiClient.post(`/orders/${id}/update_status/`, { status });
  },
};