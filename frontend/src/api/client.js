// Base instance for making consistent API requests with auth token
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem('wardwatch_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        // Unauthorized - possibly token expired
        localStorage.removeItem('wardwatch_token');
        localStorage.removeItem('wardwatch_user');
      }
      throw new Error(data.error || 'API Request Failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};
