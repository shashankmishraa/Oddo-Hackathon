import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('transitops_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
