import { createSupabaseDbClient } from '@/lib/supabaseServer'

export async function POST(request) {
  try {
    const { name, phone, email, message, turnstileToken } = await request.json()

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

    const db = createSupabaseDbClient()
    const { error } = await db.from('membership_requests').insert({
      name:         name.trim(),
      phone:        phone?.trim() || null,
      email:        email?.trim().toLowerCase() || null,
      message:      message?.trim() || null,
      submitted_at: new Date().toISOString(),
      status:       'pending',
    })

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    console.error('join error:', error)
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
