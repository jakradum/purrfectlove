import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/careAuth'
import BookingsPage from '@/components/Care/BookingsPage'

export const metadata = { title: 'My Bookings | Purrfect Love Community' }

export default async function Page() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) redirect('/care/login')

  let payload
  try { payload = await verifyToken(token) } catch { redirect('/care/login') }
  if (!payload) redirect('/care/login')

  return <BookingsPage locale="en" />
}
