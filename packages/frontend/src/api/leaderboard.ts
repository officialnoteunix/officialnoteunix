import api from './axios';

export const leaderboardApi = {
  get: () => api.get('/users/leaderboard'),
  topNotes: (type = 'downloads', limit = 10) => api.get('/notes/top', { params: { type, limit } }),
};
