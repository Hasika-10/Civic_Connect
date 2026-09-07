import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('civicconnect_token');
    const stored = localStorage.getItem('civicconnect_user');
    if (token && stored) {
      setUser(JSON.parse(stored));
      api.get('/auth/me').then(res => {
        setUser(res.data);
        localStorage.setItem('civicconnect_user', JSON.stringify(res.data));
      }).catch(() => {
        logout();
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('civicconnect_token', res.data.token);
    localStorage.setItem('civicconnect_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('civicconnect_token', res.data.token);
    localStorage.setItem('civicconnect_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('civicconnect_token');
    localStorage.removeItem('civicconnect_user');
    setUser(null);
  };

  const updateUser = (data) => {
    setUser(data);
    localStorage.setItem('civicconnect_user', JSON.stringify(data));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

