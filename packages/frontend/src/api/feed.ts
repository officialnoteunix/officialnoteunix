import api from './axios';

export interface FeedAuthor {
  id: string;
  fullname: string;
  avatar: string | null;
  username?: string | null;
  bio?: string;
  role?: string;
  followersCount?: number;
  followingCount?: number;
}

export interface FeedMedia {
  url: string;
  fileType: string;
  fileSize: number;
  publicId?: string;
  kind: 'image' | 'video';
}

export interface FeedPost {
  id: string;
  content: string;
  media: FeedMedia[];
  visibility: 'public' | 'followers';
  tags: string[];
  topic: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  score: number;
  createdAt: string;
  updatedAt: string;
  author?: FeedAuthor;
  isLiked?: boolean;
}

export const feedApi = {
  feed: (tab: string, cursor?: string | null, limit = 20) =>
    api.get('/feed/feed', { params: { tab, cursor: cursor || undefined, limit } }),
  post: (id: string) => api.get(`/feed/posts/${id}`),
  create: (formData: FormData) => api.post('/feed/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id: string, data: { content?: string; visibility?: string; tags?: string[]; topic?: string }) =>
    api.patch(`/feed/posts/${id}`, data),
  remove: (id: string) => api.delete(`/feed/posts/${id}`),
  like: (id: string) => api.post(`/feed/posts/${id}/like`),
  share: (id: string) => api.post(`/feed/posts/${id}/share`),
  comment: (id: string, content: string) => api.post(`/feed/posts/${id}/comment`, { content }),
  follow: (id: string) => api.post(`/feed/users/${id}/follow`),
  userPosts: (id: string) => api.get(`/feed/users/${id}/posts`),
  updateProfile: (data: { username?: string; bio?: string }) => api.patch('/feed/profile', data),
  search: (q: string) => api.get('/feed/search', { params: { q } }),
  adminPosts: (params: { page?: number; limit?: number; author?: string; q?: string } = {}) =>
    api.get('/feed/admin/posts', { params }),
  adminDelete: (id: string) => api.delete(`/feed/admin/posts/${id}`),
};

export default feedApi;
