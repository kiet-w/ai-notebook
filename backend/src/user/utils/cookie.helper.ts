import type { Response } from 'express';

const isProduction = process.env.NODE_ENV === 'production';
const isCrossDomain =
  process.env.CROSS_DOMAIN_COOKIES === 'true' || isProduction;

export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
): void {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isCrossDomain,
    sameSite: isCrossDomain ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isCrossDomain,
    sameSite: isCrossDomain ? 'none' : 'lax',
    path: '/',
  });
}
