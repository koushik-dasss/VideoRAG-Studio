import api from './api';

export const getAllLectures = (userId) => 
  api.get(`/lectures/user/${userId}`);

export const getLecture = (id) => 
  api.get(`/lectures/${id}`);

export const createLecture = (data) => 
  api.post('/lectures', data);

export const getUserJobs = (userId) =>
  api.get(`/lectures/jobs/${userId}`);