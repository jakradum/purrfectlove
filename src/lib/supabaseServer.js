import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

/**
 * Read-only Supabase client for API routes.
 * Reads session from request cookies; does not write cookies.
 * Returns { user, sitterId, isTeamMember } or null.
 */
export async function getSupabaseUser(request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return {
    user,
    sitterId: user.user_metadata?.sitterId || null,
    isTeamMember: user.user_metadata?.isTeamMember || false,
  }
}

/**
 * Service-role admin client. Use for auth.admin.* ops and Postgres queries.
 * Never expose to the browser.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/** Alias: Postgres-only operations (bookings, membership_requests, etc.) */
export const createSupabaseDbClient = createSupabaseAdminClient
