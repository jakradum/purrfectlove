import { createClient } from '@sanity/client'
import { signToken } from '@/lib/careAuth'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export async function POST(request) {
  try {
    const { phone: rawPhone, code } = await request.json()

    if (!rawPhone || !code) {
      return Response.json({ error: 'Phone and code are required' }, { status: 400 })
    }

    // Normalize to match how send-otp stored the OTP (always space-free)
    const phone = rawPhone.replace(/\s+/g, '')
    const phoneSpaced = phone.replace(/^(\+\d{2})(\d)/, '$1 $2')

    const otpDoc = await sanity.fetch(
      `*[_type == "otpCode" && phone == $phone && code == $code][0]{ _id, expiresAt }`,
      { phone, code }
    )

    if (!otpDoc) {
      return Response.json({ error: 'Invalid code' }, { status: 400 })
    }

    if (new Date(otpDoc.expiresAt) < new Date()) {
      await sanity.delete(otpDoc._id)
      return Response.json({ error: 'Code expired. Request a new one.' }, { status: 400 })
    }

    await sanity.delete(otpDoc._id)

    const [catSitter, teamMember] = await Promise.all([
      sanity.fetch(
        `*[_type == "catSitter" && (phone == $phone || phone == $phoneSpaced) && memberVerified == true][0]{ _id, name }`,
        { phone, phoneSpaced }
      ),
      sanity.fetch(
        `*[_type == "teamMember" && (phone == $phone || phone == $phoneSpaced)][0]{ _id, name }`,
        { phone, phoneSpaced }
      ),
    ])

    const account = catSitter || teamMember
    if (!account) {
      return Response.json({ error: 'Account not found or not verified' }, { status: 403 })
    }

    const token = await signToken({
      phone,
      sitterId: account._id,
      name: account.name || '',
      isTeamMember: !catSitter && !!teamMember,
    })

    const isProduction = process.env.NODE_ENV === 'production'
    const maxAge = 90 * 24 * 3600
    const cookieValue = `auth_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${isProduction ? '; Secure' : ''}`

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookieValue },
    })
  } catch (error) {
    console.error('verify-otp error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
