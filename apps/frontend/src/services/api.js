import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Proxied via Nginx or Vite
  timeout: 10000,
});

export default api;