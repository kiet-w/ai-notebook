import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Lấy Refresh Token từ HttpOnly Cookie do backend set
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // Kiểm tra xem user có đang ở các route liên quan đến xác thực không (/auth/login, /auth/register)
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');

  if (!refreshToken) {
    // 1. CHƯA ĐĂNG NHẬP:
    // Nếu cố tình vào các trang bên trong (không phải /auth) thì đá về /auth/login
    if (!isAuthPage) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  } else {
    // 2. ĐÃ ĐĂNG NHẬP:
    // Nếu cố tình vào lại trang /auth/login hoặc /auth/register thì đá về trang chủ (/)
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Cho phép đi tiếp
  return NextResponse.next();
}

// Cấu hình Middleware chỉ hoạt động trên các route cần thiết (bỏ qua file tĩnh, _next, api)
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
