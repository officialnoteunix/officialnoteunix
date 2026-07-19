import type { AxiosError } from 'axios';

export const API_BASE_URL = '/api';

const TECH_PATTERNS = [
  /casterror/gi,
  /validation\s*failed/gi,
  /path\s*`[^`]*`\s*is\s*required/gi,
  /duplicate\s*key/gi,
  /mongoServerError/gi,
  /E11000/gi,
  /SyntaxError.*body/gi,
  /jwt/gi,
  /token\s*expired/gi,
  /internal\s*server\s*error/gi,
  /ERR_NETWORK/gi,
  /ECONNABORTED/gi,
  /axios/gi,
  /mongoose/gi,
  /multer/gi,
  /rate.?limit/gi,
  /SMTP/gi,
  /SMTP_HOST/gi,
  /SMTP_USER/gi,
];

const FRIENDLY_MAP: [RegExp, string][] = [
  [/casterror/gi, ''],
  [/invalid\s*(\w+):\s*[\w-]+/gi, ''],
  [/validation\s*failed.*?(?:errors.*)?$/i, 'Please check your input and try again.'],
  [/duplicate\s*entry/i, 'This already exists.'],
  [/duplicate\s*key.*?"?(\w+)"?\s*"?([^"]*)"?/i, 'This value is already taken.'],
  [/path\s*`[^`]*`\s*is\s*required/gi, 'Please fill in all required fields.'],
  [/email\s*service\s*is\s*not\s*configured.*$/i, 'Email sending is temporarily unavailable. Please try again later.'],
];

function sanitize(raw: string): string {
  let msg = raw;
  for (const [pat, replacement] of FRIENDLY_MAP) {
    msg = msg.replace(pat, replacement);
  }
  msg = msg.replace(TECH_PATTERNS[0], '');
  for (const pat of TECH_PATTERNS.slice(1)) {
    msg = msg.replace(pat, '');
  }
  msg = msg.replace(/\s{2,}/g, ' ').trim();
  if (!msg || msg.length < 3) return '';
  return msg;
}

export function getApiError(err: unknown, fallback = 'Something went wrong'): string {
  if (!err || typeof err !== 'object') return fallback;
  const axiosErr = err as AxiosError<{ success?: boolean; message?: string; errors?: Record<string, string> }>;

  const raw = axiosErr.response?.data?.message;
  if (raw && typeof raw === 'string') {
    const cleaned = sanitize(raw);
    if (cleaned) return cleaned;
  }

  const fieldErrors = axiosErr.response?.data?.errors;
  if (fieldErrors && typeof fieldErrors === 'object') {
    const first = Object.values(fieldErrors)[0];
    if (typeof first === 'string' && first.length > 0) {
      const cleaned = sanitize(first);
      if (cleaned) return cleaned;
    }
  }

  if (axiosErr.code === 'ERR_NETWORK') return 'Unable to connect. Please check your internet connection.';
  if (axiosErr.code === 'ECONNABORTED') return 'The request took too long. Please try again.';
  if (axiosErr.response?.status === 404) return 'The requested resource was not found.';
  if (axiosErr.response?.status === 403) return 'You don\'t have permission to do this.';
  if (axiosErr.response?.status === 401) return 'Your session has expired. Please log in again.';
  if (axiosErr.response?.status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (axiosErr.response && axiosErr.response.status >= 500) return 'Something went wrong on our end. Please try again later.';

  return fallback;
}

export type UserRole = 'student' | 'maintainer' | 'admin';

export type Permission =
  | 'note:moderate'
  | 'comment:moderate'
  | 'report:manage'
  | 'contact:manage'
  | 'note:create'
  | 'analytics:view'
  | 'taxonomy:edit'
  | 'ad:manage';

export interface PermissionDef {
  key: Permission;
  label: string;
  description: string;
}

export const MAINTAINER_PERMISSIONS: PermissionDef[] = [
  { key: 'note:moderate', label: 'Moderate Notes', description: 'Approve, reject, edit or delete any note' },
  { key: 'comment:moderate', label: 'Moderate Comments', description: 'List and delete any comment' },
  { key: 'report:manage', label: 'Manage Reports', description: 'View, resolve or dismiss reports' },
  { key: 'contact:manage', label: 'Manage Messages', description: 'View, read, reply to and delete contact messages' },
  { key: 'note:create', label: 'Create Notes', description: 'Upload notes on behalf of the platform' },
  { key: 'analytics:view', label: 'View Analytics', description: 'Access dashboards and stats' },
  { key: 'taxonomy:edit', label: 'Edit Taxonomy', description: 'Create or edit university, course, semester and subject' },
  { key: 'ad:manage', label: 'Manage Ads', description: 'Create and edit advertisements' },
];

export const DEFAULT_MAINTAINER_PERMISSIONS: Permission[] = MAINTAINER_PERMISSIONS.map(p => p.key);

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  maintainer: 'Maintainer',
  admin: 'Admin',
};
