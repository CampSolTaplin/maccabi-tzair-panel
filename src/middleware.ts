import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'mtz-session';
const PUBLIC_PATHS = ['/login', '/api/auth/login'];
const MADRICH_ALLOWED = ['/take-attendance', '/api/data', '/api/auth/me', '/api/auth/logout'];

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/letterhead')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const role = payload.role as string;

    // Madrich role: restrict to allowed paths only
    if (role === 'madrich') {
      // Redirect root to take-attendance
      if (pathname === '/') {
        return NextResponse.redirect(new URL('/take-attendance', request.url));
      }
      // Only allow specific paths
      const isAllowed = MADRICH_ALLOWED.some(p => pathname.startsWith(p));
      if (!isAllowed) {
        return NextResponse.redirect(new URL('/take-attendance', request.url));
      }
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|letterhead/).*)',
  ],
};
