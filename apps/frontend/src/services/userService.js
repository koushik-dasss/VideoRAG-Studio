import api from './api';

export const registerUser = (data) => 
  api.post('/users', data);

export const getUser = (id) => 
  api.get(`/users/${id}`);

export const getUserSettings = (id) => 
  api.get(`/users/${id}/settings`);

export const updateUserSettings = (id, data) => 
  api.put(`/users/${id}/settings`, data);