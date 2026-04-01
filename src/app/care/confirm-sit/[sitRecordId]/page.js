import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@sanity/client'
import { verifyToken } from '@/lib/careAuth'
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
  const token = cookieStore.get('auth_token')?.value
  if (!token) redirect('/login')

  const payload = await verifyToken(token)
  if (!payload) redirect('/login')

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

  const isSitter = record.sitterId === payload.sitterId
  const isParent = record.parentId === payload.sitterId

  if (!isSitter && !isParent) {
    redirect('/')
  }

  return (
    <SitConfirmPage
      record={record}
      role={isSitter ? 'sitter' : 'parent'}
      currentUserId={payload.sitterId}
    />
  )
}
