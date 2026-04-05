import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@sanity/client'
import { createServerClient } from '@supabase/ssr'
import NotificationsPage from '@/components/Care/NotificationsPage'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export const metadata = {
  title: 'Notifications | Purrfect Love Community',
}

export default async function NotificationsPageRoute() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sitterId = user.user_metadata?.sitterId

  const notifications = await serverClient.fetch(
    `*[_type == "notification" && recipient._ref == $id] | order(createdAt desc) [0...100] {
      _id, type, linkPath, read, createdAt,
      "senderName": sender->username
    }`,
    { id: sitterId }
  ).catch(() => [])

  // Mark all as read
  const unread = notifications.filter(n => !n.read)
  if (unread.length > 0) {
    await Promise.allSettled(
      unread.map(n => serverClient.patch(n._id).set({ read: true }).commit())
    )
  }

  return <NotificationsPage notifications={notifications} locale="en" />
}
