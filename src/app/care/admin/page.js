import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@sanity/client'
import { verifyToken } from '@/lib/careAuth'
import AdminDashboard from '@/components/Care/AdminDashboard'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export const metadata = {
  title: 'Admin Dashboard | Cat Sitting Network',
}

export default async function AdminPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) redirect('/care/login')

  const payload = await verifyToken(token)
  if (!payload) redirect('/care/login')

  // Verify isAdmin in Sanity
  let isAdmin = false
  try {
    const sitter = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ isAdmin }`,
      { id: payload.sitterId }
    )
    isAdmin = sitter?.isAdmin === true
  } catch {
    // continue — will show forbidden
  }

  if (!isAdmin) {
    redirect('/care')
  }

  return <AdminDashboard locale="en" />
}
