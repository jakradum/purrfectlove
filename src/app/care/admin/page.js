import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { Suspense } from 'react'
import AdminPage from '@/components/Care/AdminPage'

export const metadata = { title: 'Admin | Purrfect Love Community' }

export default async function AdminRoute() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/care/login')
  if (!user.user_metadata?.isTeamMember) redirect('/care')

  return (
    <Suspense>
      <AdminPage />
    </Suspense>
  )
}
