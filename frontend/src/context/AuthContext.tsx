// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import api from '../api/axios';

interface AuthContextType {
  user: any | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api
        .get('profile/')
        .then((res) => {
          setUser(res.data);
          setLoading(false);
        })
        .catch(() => {
          // Token invalid – clear everything
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // Also remove any nested auth keys (e.g., Supabase leftovers)
          localStorage.removeItem('sb-vsjhkykdtdvvgkuzbmy-auth-token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('token/', { username, password });
      console.log('Login response:', response.data); // Debug

      // Store tokens – assuming the backend returns { access, refresh }
      const accessToken = response.data.access;
      const refreshToken = response.data.refresh;

      if (!accessToken || !refreshToken) {
        throw new Error('Invalid token response from server');
      }

      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);

      // Remove any nested legacy keys (like Supabase)
      localStorage.removeItem('sb-vsjhkykdtdvvgkuzbmy-auth-token');

      // Fetch user profile
      const profileRes = await api.get('profile/');
      setUser(profileRes.data);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      await api.post('register/', userData);
      // Registration successful – no auto-login
    } catch (error: any) {
      if (error.response && error.response.data) {
        throw error.response.data; // pass validation errors
      }
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('sb-vsjhkykdtdvvgkuzbmy-auth-token'); // clean legacy
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};