export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface User {
  _id: string;
  fullname: string;
  email: string;
  role: 'student' | 'admin';
  avatar: string | null;
  isVerified?: boolean;
  banned: boolean;
  suspendedUntil: string | null;
  createdAt: string;
}

export interface Subject {
  _id: string;
  name: string;
  code?: string;
  semesterId?: { _id: string; title: string } & Record<string, any>;
}

export interface NoteFile {
  url: string;
  fileType: string;
  fileSize: number;
}

export interface Note {
  _id: string;
  title: string;
  description?: string;
  resourceType: string;
  files?: NoteFile[];
  cloudinaryUrl?: string;
  fileType?: string;
  fileSize?: number;
  approved: boolean;
  downloads: number;
  averageRating: number;
  ratingsCount: number;
  userId?: Pick<User, '_id' | 'fullname' | 'avatar'> & { isVerified?: boolean };
  subjectId?: Pick<Subject, '_id' | 'name'> & { semesterId?: any };
  thumbnailUrl?: string;
  createdAt: string;
}

export interface Report {
  _id: string;
  note?: Pick<Note, '_id' | 'title'>;
  reportedBy?: Pick<User, '_id' | 'fullname'>;
  type: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface Ad {
  _id: string;
  slot: string;
  imageUrl: string;
  linkUrl?: string;
  description?: string;
  active: boolean;
  impressions: number;
  clicks: number;
  startDate: string;
  endDate: string;
}

export interface AuditLog {
  _id: string;
  adminId: { _id: string; fullname: string; email: string };
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  targetTitle: string;
  details?: string;
  createdAt: string;
}

export interface UserDetail extends User {
  stats?: {
    totalNotes: number;
    totalBookmarks: number;
    totalDownloads: number;
  };
  notesByMonth?: { _id: string; count: number }[];
  recentNotes?: Note[];
  recentBookmarks?: { _id: string; noteId?: Pick<Note, '_id' | 'title'>; createdAt: string }[];
}
