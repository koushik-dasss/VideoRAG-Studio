import api from './api';

export const semanticSearch = (query, limit = 10) => 
  api.post('/search', { query, limit });
