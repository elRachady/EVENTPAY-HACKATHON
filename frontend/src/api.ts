import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3005/api'
});

console.log('🚀 Serveur démarré sur http://localhost:3005');

export default api;
