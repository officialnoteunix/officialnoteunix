export const ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
};

export const FILE_TYPES = {
  PDF: 'application/pdf',
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
