import { createClient } from '@sanity/client'
import crypto from 'crypto'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, language } = body

    // Email validation
    // See src/app/api/submit-application/route.js for why this is stricter
    // than a bare "has an @ and a dot" check.
    const emailRegex = /^(?!.*\.\.)[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/
    if (!email || !emailRegex.test(email)) {
      return Response.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase()
    const locale = (language || 'EN').toLowerCase() === 'de' ? 'de' : 'en'

    // Idempotent: a repeat signup with the same email is treated as success,
    // not a duplicate document. If they'd previously unsubscribed, signing
    // up again re-activates them rather than silently doing nothing.
    const existing = await serverClient.fetch(
      `*[_type == "newsletterSubscriber" && email == $email][0]{ _id, unsubscribed }`,
      { email: normalizedEmail }
    )

    if (!existing) {
      await serverClient.create({
        _type: 'newsletterSubscriber',
        email: normalizedEmail,
        locale,
        subscribedAt: new Date().toISOString(),
        source: 'footer_form',
        unsubscribed: false,
        unsubscribeToken: crypto.randomUUID(),
      })
    } else if (existing.unsubscribed) {
      await serverClient.patch(existing._id).set({ unsubscribed: false }).commit()
    }

    return Response.json({
      success: true,
      message: 'Successfully subscribed!',
    })
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return Response.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    )
  }
}
