import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@sanity/client'
import { verifyToken } from '@/lib/careAuth'
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
  title: 'Inbox | Cat Sitting Network',
}

export default async function InboxPageRoute() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) redirect('/login')

  const payload = await verifyToken(token)
  if (!payload) redirect('/login')

  const profile = await serverClient.fetch(
    `*[_type == "catSitter" && _id == $id][0]{ ${COMPLETENESS_FIELDS} }`,
    { id: payload.sitterId }
  ).catch(() => null)

  if (!isProfileComplete(profile)) {
    return <IncompleteProfileGate />
  }

  return (
    <Suspense>
      <InboxPage
        currentUserId={payload.sitterId}
        currentUserName={payload.name || ''}
        locale="en"
      />
    </Suspense>
  )
}
