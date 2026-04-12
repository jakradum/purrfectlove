import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { captureServerEvent } from '@/lib/posthogServer'

export async function POST() {
  const cookieStore = await cookies()
  const cookiesToSet = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (incoming) => cookiesToSet.push(...incoming),
      },
    }
  )

  // Capture before signing out while we still have the session
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const sitterIdForEvent = currentUser?.user_metadata?.sitterId
  if (sitterIdForEvent) {
    captureServerEvent(sitterIdForEvent, 'user_logged_out').catch(() => {})
  }

  await supabase.auth.signOut()

  const response = Response.json({ success: true })
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options)
  }
  return response
}
