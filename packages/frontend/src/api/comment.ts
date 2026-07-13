import api from './axios';

export const commentApi = {
  list: (noteId: string) => api.get(`/comments/note/${noteId}`),
  create: (noteId: string, content: string) => api.post(`/comments/note/${noteId}`, { content }),
  reply: (commentId: string, content: string) => api.post(`/comments/${commentId}/reply`, { content }),
  like: (commentId: string) => api.post(`/comments/${commentId}/like`),
  delete: (commentId: string) => api.delete(`/comments/${commentId}`),
};
