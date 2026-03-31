import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/careAuth';

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get('host') || '';
  const isCareDomain = host === 'care.purrfectlove.org';

  // Public paths that never require authentication
  const PUBLIC_PREFIXES = [
    '/care/login', '/care/privacy', '/care/join',
    '/de/care/login', '/de/care/privacy', '/de/care/join',
    '/api/care/send-otp', '/api/care/verify-otp', '/api/care/join', '/api/care/unsubscribe',
    // Subdomain equivalents (before the /care rewrite is applied)
    '/login', '/privacy', '/join',
  ];

  const isPublic = PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));

  // Care portal auth protection
  let isProtectedCarePath = false;
  let loginUrl;

  if (isCareDomain) {
    isProtectedCarePath = !isPublic;
    loginUrl = new URL('/login', request.url);
  } else {
    const isCareRoute = pathname.startsWith('/care') || pathname.startsWith('/de/care');
    isProtectedCarePath = isCareRoute && !isPublic &&
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
