import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/careAuth';

/**
 * Queries Sanity via the HTTP API (Edge Runtime-compatible — no Node.js SDK).
 * Returns true if the catSitter document has deletionRequested: true.
 * Falls back to false on any error so login is never blocked by a network hiccup.
 */
async function isDeletionPending(sitterId) {
  try {
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
    const token = process.env.SANITY_API_TOKEN;
    const query = '*[_type == "catSitter" && _id == $id][0].deletionRequested';
    const url = new URL(`https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}`);
    url.searchParams.set('query', query);
    url.searchParams.set('$id', JSON.stringify(sitterId)); // Sanity expects JSON-encoded param value
    const res = await fetch(url.toString(), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    if (!res.ok) return false;
    const data = await res.json();
    console.log('[middleware] deletionRequested fetch:', { sitterId, result: data.result });
    return data.result === true;
  } catch {
    return false;
  }
}

// Paths that are always the profile page (across domains and locales)
const PROFILE_PATHS = ['/care/profile', '/de/care/profile', '/profile'];
function isProfilePage(pathname) {
  return PROFILE_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

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
    if (!token) {
      loginUrl.searchParams.set('reason', 'session');
      return NextResponse.redirect(loginUrl);
    }
    const payload = await verifyToken(token);
    if (!payload) {
      loginUrl.searchParams.set('reason', 'expired');
      return NextResponse.redirect(loginUrl);
    }

    // Deletion lockout: redirect all page routes (not API routes) to /profile
    // for accounts with a pending deletion request.
    const isApiRoute = pathname.startsWith('/api/');
    if (!isApiRoute && !isProfilePage(pathname)) {
      const deletionPending = await isDeletionPending(payload.sitterId);
      if (deletionPending) {
        // On subdomain the profile page is /profile; on main domain it's /care/profile
        const profileRedirect = isCareDomain ? '/profile' : '/care/profile';
        return NextResponse.redirect(new URL(profileRedirect, request.url));
      }
    }
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
