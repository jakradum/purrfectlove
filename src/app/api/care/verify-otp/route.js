import { createClient } from '@sanity/client'
import { signToken } from '@/lib/careAuth'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

function phoneVariants(raw) {
  const norm = raw.replace(/\s+/g, '')
  const spaced = norm.replace(/^(\+\d{2})(\d)/, '$1 $2')
  return { norm, spaced }
}

export async function POST(request) {
  try {
    const { identifier: rawIdentifier, type, code } = await request.json()

    if (!rawIdentifier || !type || !code || !['phone', 'email'].includes(type)) {
      return Response.json({ error: 'identifier, type, and code are required' }, { status: 400 })
    }

    let identifier
    if (type === 'phone') {
      identifier = rawIdentifier.replace(/\s+/g, '')
    } else {
      identifier = rawIdentifier.trim().toLowerCase()
    }

    // Look up OTP
    let otpDoc
    if (type === 'phone') {
      otpDoc = await sanity.fetch(
        `*[_type == "otpCode" && phone == $identifier && code == $code][0]{ _id, expiresAt }`,
        { identifier, code }
      )
    } else {
      otpDoc = await sanity.fetch(
        `*[_type == "otpCode" && email == $identifier && code == $code][0]{ _id, expiresAt }`,
        { identifier, code }
      )
    }

    if (!otpDoc) {
      return Response.json({ error: 'Invalid code' }, { status: 400 })
    }

    if (new Date(otpDoc.expiresAt) < new Date()) {
      await sanity.delete(otpDoc._id)
      return Response.json({ error: 'Code expired. Request a new one.' }, { status: 400 })
    }

    await sanity.delete(otpDoc._id)

    // Find the account
    let catSitter, teamMember

    if (type === 'phone') {
      const { norm: phone, spaced: phoneSpaced } = phoneVariants(rawIdentifier)
      ;[catSitter, teamMember] = await Promise.all([
        sanity.fetch(
          `*[_type == "catSitter" && (phone == $phone || phone == $phoneSpaced) && memberVerified == true][0]{ _id, name }`,
          { phone, phoneSpaced }
        ),
        sanity.fetch(
          `*[_type == "teamMember" && (phone == $phone || phone == $phoneSpaced)][0]{ _id, name }`,
          { phone, phoneSpaced }
        ),
      ])
    } else {
      ;[catSitter, teamMember] = await Promise.all([
        sanity.fetch(
          `*[_type == "catSitter" && email == $email && memberVerified == true][0]{ _id, name }`,
          { email: identifier }
        ),
        sanity.fetch(
          `*[_type == "teamMember" && email == $email][0]{ _id, name }`,
          { email: identifier }
        ),
      ])
    }

    // If teamMember matched but no catSitter did, find their linked catSitter by name
    if (!catSitter && teamMember) {
      catSitter = await sanity.fetch(
        `*[_type == "catSitter" && name == $name && siteAdmin == true && memberVerified == true][0]{ _id, name }`,
        { name: teamMember.name }
      )
    }

    const account = catSitter || teamMember
    if (!account) {
      return Response.json({ error: 'Account not found or not verified' }, { status: 403 })
    }

    const token = await signToken({
      identifier,
      identifierType: type,
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
