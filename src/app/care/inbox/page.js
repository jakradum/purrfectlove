import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/careAuth'
import InboxPage from '@/components/Care/InboxPage'
import { Suspense } from 'react'

export const metadata = {
  title: 'Inbox | Cat Sitting Network',
}

export default async function InboxPageRoute() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) redirect('/care/login')

  const payload = await verifyToken(token)
  if (!payload) redirect('/care/login')

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
