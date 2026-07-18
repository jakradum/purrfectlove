import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import crypto from 'crypto'

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

function verifySignature(payload, signature, secret) {
  if (!secret) return true
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expected = hmac.digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature || ''),
    Buffer.from(expected)
  )
}

export async function POST(request) {
  const rawBody = await request.text()
  const signature = request.headers.get('sanity-webhook-signature')
  const webhookSecret = process.env.SANITY_WEBHOOK_SECRET

  if (webhookSecret && !verifySignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { _id, status } = payload

  if (!_id || status !== 'rejected') {
    return NextResponse.json({ skipped: true })
  }

  // Find all applications that are duplicates of this one and still open
  const duplicates = await sanityClient.fetch(
    `*[_type == "application" && isDuplicateOf._ref == $originalId && status in ["new", "evaluation"]] { _id, applicationId }`,
    { originalId: _id }
  )

  if (duplicates.length === 0) {
    return NextResponse.json({ rejected: 0 })
  }

  await Promise.all(
    duplicates.map(dup =>
      sanityClient.patch(dup._id).set({ status: 'rejected' }).commit()
    )
  )

  console.log(`[application-rejected] original=${_id} auto-rejected ${duplicates.length} duplicate(s): ${duplicates.map(d => d.applicationId).join(', ')}`)

  return NextResponse.json({ rejected: duplicates.length, ids: duplicates.map(d => d._id) })
}
