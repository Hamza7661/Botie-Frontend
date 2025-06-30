import Constants from 'expo-constants';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = Constants.expoConfig.extra.apiBaseUrl;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global event emitter for auth events
const authEvents = {
  listeners: new Set(),
  emit(event) {
    this.listeners.forEach(listener => listener(event));
  },
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
};

export { authEvents };

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear stored auth data
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Emit auth event to notify AuthContext
      authEvents.emit('unauthorized');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  changePassword: (passwordData) => api.put('/auth/changepassword', passwordData),
  forgotPassword: (email) => api.post('/auth/forgotpassword', { email }),
  resetPassword: (token, newPassword) => api.put(`/auth/resetpassword/${token}`, { newPassword }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
};

// User API
export const userAPI = {
  getUserById: (userId) => api.get(`/users/${userId}`),
  updateUser: (userId, userData) => api.put(`/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/users/${userId}`),
};

// Tasks/Appointments API
export const tasksAPI = {
  getTasks: (params = {}) => {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = params;
    return api.get('/tasks', {
      params: { page, limit, search, sortBy, sortOrder }
    });
  },
  getTaskById: (taskId) => api.get(`/tasks/${taskId}`),
  createTask: (taskData) => api.post('/tasks', taskData),
  updateTask: (taskId, taskData) => api.put(`/tasks/${taskId}`, taskData),
  deleteTask: (taskId) => api.delete(`/tasks/${taskId}`),
};

// Customer API
export const customerAPI = {
  getCustomers: () => api.get('/customers'),
  searchCustomers: (searchQuery) => api.get('/customers', {
    params: { search: searchQuery }
  }),
};

export default api; 