import { createClient } from '@sanity/client'
import { NextResponse } from 'next/server'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// Public GET: ?id=<sitterId> — sets newsletterOptOut: true
// Linked from welcome email footer; no auth required (id is the secret)
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return new NextResponse('Missing id', { status: 400 })
  }
  try {
    await sanity.patch(id).set({ newsletterOptOut: true }).commit()
    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribed</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:3rem;color:#333;">
        <h1>You've been unsubscribed</h1>
        <p>You will no longer receive community emails from Purrfect Love.</p>
        <p>You can re-enable emails at any time from your <a href="https://care.purrfectlove.org/profile">profile settings</a>.</p>
      </body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  } catch (err) {
    console.error('unsubscribe error:', err)
    return new NextResponse('Something went wrong. Please try again.', { status: 500 })
  }
}
