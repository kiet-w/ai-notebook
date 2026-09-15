import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function buildCsp(isDev: boolean) {
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  ).replace(/\/+$/, '');

  const directives = [
    "default-src 'self'",
    isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https: ${apiUrl}`,
    "font-src 'self' data:",
    `connect-src 'self' ${apiUrl} wss: ws:`,
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ];

  // Khi đã có SSL thì mở dòng dưới
  // if (!isDev) directives.push("upgrade-insecure-requests");

  return directives.join('; ');
}

export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';
  const response = NextResponse.next();

  // ===== Security Headers =====
  response.headers.set('Content-Security-Policy', buildCsp(isDev));
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // ===== Logic Auth =====
  // Hỗ trợ cả cookie nội bộ auth_session (khi khác domain với backend) và refreshToken
  const hasAuth =
    request.cookies.get('auth_session')?.value ||
    request.cookies.get('refreshToken')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');

  if (!hasAuth) {
    if (!isAuthPage) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  } else {
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|uploads|favicon.ico).*)',
  ],
};
