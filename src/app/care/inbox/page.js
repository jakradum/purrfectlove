import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@sanity/client'
import { createServerClient } from '@supabase/ssr'
import { isProfileComplete, COMPLETENESS_FIELDS } from '@/lib/profileComplete'
import InboxPage from '@/components/Care/InboxPage'
import IncompleteProfileGate from '@/components/Care/IncompleteProfileGate'
import { Suspense } from 'react'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export const metadata = {
  title: 'Inbox | Purrfect Love Community',
}

export default async function InboxPageRoute() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sitterId = user.user_metadata?.sitterId

  const profile = await serverClient.fetch(
    `*[_type == "catSitter" && _id == $id][0]{ ${COMPLETENESS_FIELDS}, name }`,
    { id: sitterId }
  ).catch(() => null)

  if (!isProfileComplete(profile)) {
    return <IncompleteProfileGate />
  }

  return (
    <Suspense>
      <InboxPage
        currentUserId={sitterId}
        currentUserName={profile?.name || ''}
        locale="en"
      />
    </Suspense>
  )
}
