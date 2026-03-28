import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/careAuth';

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // Care portal auth protection (EN: /care/*, DE: /de/care/*)
  const isDeCarePath = pathname.startsWith('/de/care') && !pathname.startsWith('/de/care/login')
  const isEnCarePath = pathname.startsWith('/care') && !pathname.startsWith('/care/login')
  const isProtectedCarePath = (isDeCarePath || isEnCarePath) &&
    !pathname.startsWith('/api/care/send-otp') &&
    !pathname.startsWith('/api/care/verify-otp')

  if (isProtectedCarePath) {
    const token = request.cookies.get('care-auth')?.value;
    const loginUrl = pathname.startsWith('/de/')
      ? new URL('/de/care/login', request.url)
      : new URL('/care/login', request.url)

    if (!token) return NextResponse.redirect(loginUrl)
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.redirect(loginUrl)
  }

  // Clone the request headers and add the pathname
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // Return the response with the modified headers
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
