import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  
  checkAuth: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      set({ token, user: JSON.parse(user) });
    }
  },
  
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const endpoint = userData.user_type === 'citizen'
        ? `${API_BASE_URL}/auth/register/citizen`
        : `${API_BASE_URL}/auth/register/${userData.user_type}`;
      
      const response = await axios.post(endpoint, userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ token, user, isLoading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Registration failed';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },
  
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ token, user, isLoading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Login failed';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
  
  updateUser: (userData) => {
    const updatedUser = { ...get().user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
  
  getHeaders: () => {
    const token = get().token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}));

export default useAuthStore;
