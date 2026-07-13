import api from './axios';
import type { APIResponse, PaginatedData, User, UserDetail, Note, AuditLog } from '../types';

export const adminApi = {
  stats: () => api.get<APIResponse<any>>('/admin/stats'),
  users: (page = 1, limit = 5) =>
    api.get<APIResponse<PaginatedData<User>>>('/admin/users', { params: { page, limit } }),
  userDetail: (id: string) =>
    api.get<APIResponse<UserDetail>>(`/admin/users/${id}`),
  notes: (approved?: boolean, page = 1, limit = 5) =>
    api.get<APIResponse<PaginatedData<Note>>>('/admin/notes', { params: { approved, page, limit } }),
  createNote: (formData: FormData) =>
    api.post<APIResponse<Note>>('/admin/notes', formData),
  approveNote: (id: string) =>
    api.patch<APIResponse<Note>>(`/admin/notes/${id}/approve`),
  deleteNote: (id: string) =>
    api.delete<APIResponse<void>>(`/admin/notes/${id}`),
  toggleBan: (id: string) =>
    api.patch<APIResponse<User>>(`/admin/users/${id}/ban`),
  suspendUser: (id: string, durationHours: number) =>
    api.patch<APIResponse<User>>(`/admin/users/${id}/suspend`, { durationHours }),
  deleteUser: (id: string) =>
    api.delete<APIResponse<void>>(`/admin/users/${id}`),
  analytics: () => api.get<APIResponse<any>>('/analytics/overview'),
  contacts: () => api.get<APIResponse<any[]>>('/contact'),
  markContactRead: (id: string) => api.patch<APIResponse<any>>(`/contact/${id}/read`),
  markAllContactRead: () => api.patch<APIResponse<void>>('/contact/read-all'),
  deleteContact: (id: string) => api.delete<APIResponse<void>>(`/contact/${id}`),
  comments: (page = 1, limit = 10) =>
    api.get<APIResponse<PaginatedData<any>>>('/admin/comments', { params: { page, limit } }),
  deleteComment: (id: string) => api.delete<APIResponse<void>>(`/admin/comments/${id}`),
  auditLogs: (page = 1, limit = 30) =>
    api.get<APIResponse<PaginatedData<AuditLog>>>('/admin/audit-logs', { params: { page, limit } }),
  sendEmail: (data: { subject: string; html: string; recipientType: 'all' | 'single'; recipientEmail?: string }) =>
    api.post<APIResponse<{ sent: number; failed: number; errors: Array<{ email: string; error: string }> }>>('/admin/send-email', data),
  replyContact: (id: string, replyContent: string) =>
    api.post<APIResponse<any>>(`/admin/contact/${id}/reply`, { replyContent }),
};
