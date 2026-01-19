import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the pathname from the request
  const pathname = request.nextUrl.pathname;

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

// Run middleware on all routes except static files and API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     * - API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/).*)',
  ],
};
