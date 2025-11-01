import axios from 'axios';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3003';

const api = axios.create({
  baseURL: `${API_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Register
export const register = async (username, email, password) => {
  try {
    const response = await api.post('/register', {
      username,
      email,
      password
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Registration failed' };
  }
};

// Login
export const login = async (username, password) => {
  try {
    const response = await api.post('/login', {
      username,
      password
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};

// Verify Token
export const verifyToken = async (token) => {
  try {
    const response = await api.get('/verify', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Token verification failed' };
  }
};

export default api;
