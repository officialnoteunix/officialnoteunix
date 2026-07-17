const IS_PROD = () => process.env.NODE_ENV === 'production';

export const ACCESS_COOKIE_OPTIONS = () => ({
  httpOnly: true,
  secure: IS_PROD(),
  sameSite: IS_PROD() ? 'none' : 'lax',
  maxAge: 15 * 60 * 1000,
});

export const REFRESH_COOKIE_OPTIONS = () => ({
  httpOnly: true,
  secure: IS_PROD(),
  sameSite: IS_PROD() ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
});

export function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS());
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS());
}

export function clearAuthCookies(res) {
  res.clearCookie('accessToken', ACCESS_COOKIE_OPTIONS());
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS());
}

