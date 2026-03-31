import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/careAuth';

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get('host') || '';
  const isCareDomain = host === 'care.purrfectlove.org';

  // Care portal auth protection
  let isProtectedCarePath = false;
  let loginUrl;

  if (isCareDomain) {
    // On subdomain, protect all paths except /login, /privacy, and OTP endpoints
    const isLoginPath = pathname === '/login';
    const isPrivacyPath = pathname === '/privacy';
    const isJoinPath = pathname === '/join';
    const isOtpPath = pathname.startsWith('/api/care/send-otp') || pathname.startsWith('/api/care/verify-otp') || pathname.startsWith('/api/care/join');
    isProtectedCarePath = !isLoginPath && !isPrivacyPath && !isJoinPath && !isOtpPath;
    loginUrl = new URL('/login', request.url);
  } else {
    // On main domain, protect /care/* and /de/care/* except login, privacy, and OTP endpoints
    const isDeCarePath = pathname.startsWith('/de/care') && !pathname.startsWith('/de/care/login') && !pathname.startsWith('/de/care/privacy') && !pathname.startsWith('/de/care/join');
    const isEnCarePath = pathname.startsWith('/care') && !pathname.startsWith('/care/login') && !pathname.startsWith('/care/privacy') && !pathname.startsWith('/care/join');
    isProtectedCarePath = (isDeCarePath || isEnCarePath) &&
      !pathname.startsWith('/api/care/send-otp') &&
      !pathname.startsWith('/api/care/verify-otp') &&
      !pathname.startsWith('/api/care/join');
    loginUrl = pathname.startsWith('/de/')
      ? new URL('/de/care/login', request.url)
      : new URL('/care/login', request.url);
  }

  if (isProtectedCarePath) {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.redirect(loginUrl);
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.redirect(loginUrl);
  }

  // Rewrite care.purrfectlove.org/* → /care/* internally (after auth check)
  if (isCareDomain && !pathname.startsWith('/care') && !pathname.startsWith('/api')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === '/' ? '/care' : `/care${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Clone the request headers and add the pathname
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Run middleware on all routes except static files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
