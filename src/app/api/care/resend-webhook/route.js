import { Webhook } from 'svix'
import { createClient } from '@sanity/client'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export async function POST(request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    console.error('resend-webhook: RESEND_WEBHOOK_SECRET not set')
    return new Response('Configuration error', { status: 500 })
  }

  // Must read raw body as text before any parsing — Svix verifies the exact bytes
  const rawBody = await request.text()

  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing Svix headers', { status: 400 })
  }

  let event
  try {
    const wh = new Webhook(secret)
    event = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  // Only act on email.opened — acknowledge all other events without action
  if (event.type !== 'email.opened') {
    return new Response('OK', { status: 200 })
  }

  // Extract booking_id from email tags
  const tags = event.data?.tags
  const bookingTag = Array.isArray(tags) ? tags.find(t => t.name === 'booking_id') : null
  const bookingId = bookingTag?.value

  if (!bookingId) {
    // Not a booking notification email — nothing to do
    return new Response('OK', { status: 200 })
  }

  try {
    await serverClient.patch(bookingId).set({ notificationDelivered: true }).commit()
  } catch (error) {
    console.error('resend-webhook: failed to patch bookingRequest:', bookingId, error)
    // Return 200 so Resend doesn't retry — the email event was valid, just the DB write failed
    return new Response('OK', { status: 200 })
  }

  return new Response('OK', { status: 200 })
}
