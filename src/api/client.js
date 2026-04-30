// frontend/src/api/client.js
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fo_token');
      localStorage.removeItem('fo_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);