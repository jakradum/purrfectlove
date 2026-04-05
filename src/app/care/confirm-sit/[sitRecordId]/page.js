import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@sanity/client'
import { createServerClient } from '@supabase/ssr'
import SitConfirmPage from '@/components/Care/SitConfirmPage'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export const metadata = {
  title: 'Confirm Sit | Purrfect Love Community',
}

export default async function ConfirmSitRoute({ params }) {
  const { sitRecordId } = await params

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sitterId = user.user_metadata?.sitterId

  const record = await serverClient.fetch(
    `*[_type == "sitRecord" && _id == $id][0]{
      _id, startDate, endDate,
      sitterResponse, parentResponse,
      sitterFeedbackNote, parentFeedbackNote,
      "sitterId": sitter._ref,
      "parentId": parent._ref,
      "sitterName": sitter->username,
      "parentName": parent->username
    }`,
    { id: sitRecordId }
  ).catch(() => null)

  if (!record) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Sit record not found.</p>
      </main>
    )
  }

  const isSitter = record.sitterId === sitterId
  const isParent = record.parentId === sitterId

  if (!isSitter && !isParent) {
    redirect('/')
  }

  return (
    <SitConfirmPage
      record={record}
      role={isSitter ? 'sitter' : 'parent'}
      currentUserId={sitterId}
    />
  )
}
