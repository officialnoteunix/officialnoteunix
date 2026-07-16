export const ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
};

export const FILE_TYPES = {
  PDF: 'application/pdf',
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const TOKEN = {
  ACCESS_EXPIRY: '15m',
  REFRESH_EXPIRY: '30d',
  REFRESH_EXPIRY_MS: 30 * 24 * 60 * 60 * 1000,
};

export const RATE_LIMIT = {
  AUTH_WINDOW_MS: 60 * 1000,
  AUTH_MAX_REQUESTS: 10,
  GENERAL_WINDOW_MS: 60 * 1000,
  GENERAL_MAX_REQUESTS: 60,
};

export function safeLimit(limit, defaultVal = 10) {
  const val = parseInt(limit);
  return Math.min(Math.max(isNaN(val) ? defaultVal : val, 1), PAGINATION.MAX_LIMIT);
}

export function safePage(page) {
  const val = parseInt(page);
  return Math.max(isNaN(val) ? 1 : val, 1);
}

export const MIME_TO_EXT = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/plain': 'txt',
  'text/rtf': 'rtf',
  'application/rtf': 'rtf',
  'application/vnd.oasis.opendocument.text': 'odt',
  'application/vnd.oasis.opendocument.presentation': 'odp',
  'application/vnd.oasis.opendocument.spreadsheet': 'ods',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'application/x-7z-compressed': '7z',
  'application/x-rar-compressed': 'rar',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export const EXT_TO_MIME = {
  pdf: 'application/pdf', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain', rtf: 'application/rtf',
  odt: 'application/vnd.oasis.opendocument.text',
  odp: 'application/vnd.oasis.opendocument.presentation',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  zip: 'application/zip', '7z': 'application/x-7z-compressed', rar: 'application/x-rar-compressed',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
};
