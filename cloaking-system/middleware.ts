import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const TOKEN_COOKIE_NAME = '_verify_token';
const PROTECTED_PATHS = ['/resgate'];
const PUBLIC_PATHS = ['/', '/acesso'];
const API_PATHS = ['/api'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  if (API_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

  if (PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
    if (!token || !isValidToken(token)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      const response = NextResponse.redirect(url);

      if (token) {
        response.cookies.delete(TOKEN_COOKIE_NAME);
      }

      return response;
    }

    return NextResponse.next();
  }

  if (pathname === '/acesso') {
    return NextResponse.next();
  }

  if (pathname === '/') {
    if (token && isValidToken(token)) {
      const url = request.nextUrl.clone();
      url.pathname = '/resgate';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/';
  return NextResponse.redirect(url);
}

function isValidToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    if (!payload.exp || !payload.fp || !payload.iat) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return false;
    }

    const tokenAge = now - payload.iat;
    if (tokenAge > 86400) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
