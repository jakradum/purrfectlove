import { createClient } from '@sanity/client'
import { signToken } from '@/lib/careAuth'

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
    const { email, code } = body

    if (!email || !code) {
      return Response.json({ error: 'Email and code are required' }, { status: 400 })
    }

    const emailLower = email.toLowerCase()

    // Look up OTP
    const otpDoc = await serverClient.fetch(
      `*[_type == "otpCode" && email == $email && code == $code][0]{ _id, expiresAt }`,
      { email: emailLower, code }
    )

    if (!otpDoc) {
      return Response.json({ error: 'Invalid code' }, { status: 400 })
    }

    // Check expiry
    if (new Date(otpDoc.expiresAt) < new Date()) {
      await serverClient.delete(otpDoc._id)
      return Response.json({ error: 'Code expired. Request a new one.' }, { status: 400 })
    }

    // Delete the used OTP
    await serverClient.delete(otpDoc._id)

    // Fetch sitter
    const sitter = await serverClient.fetch(
      `*[_type == "catSitter" && email == $email && memberVerified == true][0]{ _id, name }`,
      { email: emailLower }
    )

    if (!sitter) {
      return Response.json({ error: 'Account not found or not verified' }, { status: 403 })
    }

    // Sign JWT
    const token = await signToken({
      email: emailLower,
      sitterId: sitter._id,
      name: sitter.name || '',
    })

    const isProduction = process.env.NODE_ENV === 'production'
    const cookieValue = `care-auth=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 3600}${isProduction ? '; Secure' : ''}`

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookieValue,
      },
    })
  } catch (error) {
    console.error('verify-otp error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
