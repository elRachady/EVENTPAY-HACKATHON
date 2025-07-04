import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3005/api' // Restored '/api' to match backend routes
});

// Add interceptor to attach Authorization header if user is logged in
api.interceptors.request.use((config) => {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const parsed = JSON.parse(user);
      if (parsed && parsed.auth_token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${parsed.auth_token}`;
      }
    } catch (e) {
      // ignore
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

console.log('🚀 Serveur démarré sur http://localhost:3005');

export default api;
