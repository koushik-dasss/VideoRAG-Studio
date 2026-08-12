import api from './api';

export const getAllLectures = (userId) => 
  api.get(`/lectures/user/${userId}`);

export const getLecture = (id) => 
  api.get(`/lectures/${id}`);

export const createLecture = (data) => 
  api.post('/lectures', data);

export const updateLecture = (id, data) => 
  api.patch(`/lectures/${id}`, data);

export const deleteLecture = (id) => 
  api.delete(`/lectures/${id}`);