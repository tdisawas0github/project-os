import { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created: string;
  lastLogin?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    loading: true
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      verifyToken(token);
    } else {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await axios.get('/api/v1/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAuthState({
        user: response.data.user,
        token,
        isAuthenticated: true,
        loading: false
      });
    } catch (error) {
      // Token is invalid, remove it
      localStorage.removeItem('token');
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      });
    }
  };

  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await axios.post('/api/v1/auth/login', {
        username,
        password
      });

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setAuthState({
        user,
        token,
        isAuthenticated: true,
        loading: false
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const token = authState.token;
      if (token) {
        await axios.post('/api/v1/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('token');
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      });
    }
  };

  return {
    ...authState,
    login,
    logout
  };
};