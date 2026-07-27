// src/api/services/authService.ts
import apiClient from '../client';

export const authService = {
  // ✅ POST /api/token/ (from backend/urls.py)
  login: async (username: string, password: string) => {
    const response = await apiClient.post('/token/', { username, password });
    const { access, refresh } = response.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    return response.data;
  },

  // ✅ POST /api/users/register/ (from ecommerceAPP/urls.py)
  register: async (data: any) => {
    const response = await apiClient.post('/users/register/', data);
    return response.data;
  },

  // ❓ You might need to add this endpoint to your UserViewSet
  // GET /api/users/me/  (custom action)
  getCurrentUser: async () => {
    const response = await apiClient.get('/users/me/');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};