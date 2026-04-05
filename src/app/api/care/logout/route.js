import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

  await supabase.auth.signOut()

  const response = Response.json({ success: true })
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options)
  }
  return response
}
