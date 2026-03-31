import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export async function POST(request) {
  try {
    const { name, phone, email, message, turnstileToken } = await request.json()

    // Validate required fields
    if (!name?.trim()) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!phone?.trim() && !email?.trim()) {
      return Response.json({ error: 'Please provide at least a phone number or email' }, { status: 400 })
    }

    // Verify Turnstile token
    const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      }),
    })
    const turnstileData = await turnstileRes.json()
    if (!turnstileData.success) {
      return Response.json({ error: 'Please complete the human verification.' }, { status: 400 })
    }

    const doc = {
      _type: 'membershipRequest',
      name: name.trim(),
      phone: phone?.trim() || undefined,
      email: email?.trim().toLowerCase() || undefined,
      message: message?.trim() || undefined,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    }

    await sanity.create(doc)
    return Response.json({ success: true })
  } catch (error) {
    console.error('join error:', error)
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
