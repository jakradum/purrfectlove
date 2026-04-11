import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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
    url.searchParams.set('$id', JSON.stringify(sitterId));
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
    '/api/care/resend-webhook', // verified by Svix signature, not session cookie
    '/api/care/admin/approve-member', // verified by HMAC token, not session cookie
    '/api/care/admin/reject-member',  // verified by HMAC token, not session cookie
    '/api/care/health',               // public health check, no auth required
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

  // Build Supabase client — buffers any session-refresh cookies for the response.
  // Wrapped in try/catch: if Supabase env vars are missing or the client throws,
  // fall through with user = null so the site stays up (protected routes redirect
  // to login, which is acceptable degraded behaviour).
  const cookiesToSet = [];
  let user = null;
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookies) => cookiesToSet.push(...cookies),
        },
      }
    );
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    console.error('[middleware] Supabase init/getUser failed:', err);
  }

  // Helper: apply any refreshed session cookies to a response before returning it
  function withSessionCookies(response) {
    for (const { name, value, options } of cookiesToSet) {
      response.cookies.set(name, value, options);
    }
    return response;
  }

  if (isProtectedCarePath) {
    if (!user) {
      loginUrl.searchParams.set('reason', 'session');
      return withSessionCookies(NextResponse.redirect(loginUrl));
    }

    // Deletion lockout: redirect all page routes (not API routes) to /profile
    const isApiRoute = pathname.startsWith('/api/');
    if (!isApiRoute && !isProfilePage(pathname)) {
      const sitterId = user.user_metadata?.sitterId;
      if (sitterId) {
        const deletionPending = await isDeletionPending(sitterId);
        if (deletionPending) {
          const profileRedirect = isCareDomain ? '/profile' : '/care/profile';
          return withSessionCookies(NextResponse.redirect(new URL(profileRedirect, request.url)));
        }
      }
    }
  }

  // Block inbox routes — contact details are released via 2-day reminder email only
  const INBOX_PREFIXES = ['/care/inbox', '/de/care/inbox', '/inbox'];
  const isInboxPath = INBOX_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (isInboxPath) {
    const home = isCareDomain ? '/' : '/care';
    return withSessionCookies(NextResponse.redirect(new URL(home, request.url)));
  }

  // Rewrite care.purrfectlove.org/* → /care/* internally (after auth check)
  if (isCareDomain && !pathname.startsWith('/care') && !pathname.startsWith('/api')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === '/' ? '/care' : `/care${pathname}`;
    return withSessionCookies(NextResponse.rewrite(url));
  }

  // Clone the request headers and add the pathname
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  return withSessionCookies(
    NextResponse.next({
      request: { headers: requestHeaders },
    })
  );
}

// Run middleware on all routes except static files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
