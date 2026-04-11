import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('wardwatch_user');
    const token = localStorage.getItem('wardwatch_token');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('wardwatch_user');
        localStorage.removeItem('wardwatch_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('wardwatch_token', data.token);
      localStorage.setItem('wardwatch_user', JSON.stringify(data.user));
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const sendOTP = async (email) => {
    try {
      const data = await apiClient('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const data = await apiClient('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      localStorage.setItem('wardwatch_token', data.token);
      localStorage.setItem('wardwatch_user', JSON.stringify(data.user));
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('wardwatch_token');
    localStorage.removeItem('wardwatch_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, sendOTP, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
