import api from './api';

export const getDashboardStats = async (userId) => {
  return api.get('/dashboard/stats', {
    params: { userId }
  });
};
