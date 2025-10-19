import axios from 'axios';

const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/user/register', data),
  login: (data) => api.post('/user/login', data),
  getUserInfo: () => api.get('/user/user-info'),
  getUsers: () => api.get('/user/users'),
  changeRole: (data) => api.put('/user/change-role', data),
  toggleActive: (data) => api.put('/user/toggle-active', data)
};

export const urlAPI = {
  getUrls: () => api.get('/url'),
  getUrlById: (id) => api.get(`/url/${id}`),
  createUrl: (data) => api.post('/url', data),
  updateUrl: (id, data) => api.put(`/url/${id}`, data),
  deleteUrl: (id) => api.delete(`/url/${id}`)
};

export const analyticsAPI = {
  getUrlAnalytics: (urlId) => api.get(`/analytics/url/${urlId}`),
  getClicks: (urlId, params) => api.get(`/analytics/clicks/${urlId}`, { params }),
  getSummary: (urlId) => api.get(`/analytics/summary/${urlId}`),
  getDashboard: () => api.get('/analytics/dashboard')
};

export default api;