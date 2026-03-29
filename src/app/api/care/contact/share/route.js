import { createClient } from '@sanity/client'
import { verifyToken } from '@/lib/careAuth'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

async function getAuth(request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/auth_token=([^;]+)/)
  const token = match ? decodeURIComponent(match[1]) : null
  if (!token) return null
  return verifyToken(token)
}

export async function POST(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { recipientId, shareEmail, shareWhatsApp } = await request.json()

    if (!recipientId) {
      return Response.json({ error: 'recipientId is required' }, { status: 400 })
    }

    if (!shareEmail && !shareWhatsApp) {
      return Response.json({ error: 'Select at least one contact method to share' }, { status: 400 })
    }

    const sitterId = payload.sitterId

    const record = await serverClient.create({
      _type: 'contactShare',
      sharer: { _type: 'reference', _ref: sitterId },
      recipient: { _type: 'reference', _ref: recipientId },
      emailShared: shareEmail === true,
      whatsappShared: shareWhatsApp === true,
      sharedAt: new Date().toISOString(),
    })

    return Response.json({ success: true, shareId: record._id })
  } catch (error) {
    console.error('contact/share error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
