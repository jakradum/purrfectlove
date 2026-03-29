import { createClient } from '@sanity/client'
import twilio from 'twilio'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// In-memory rate limit: max 3 OTPs per phone per hour
const otpRequests = new Map()

function checkRateLimit(phone) {
  const now = Date.now()
  const hour = 60 * 60 * 1000
  const requests = (otpRequests.get(phone) || []).filter(t => now - t < hour)
  if (requests.length >= 3) return false
  otpRequests.set(phone, [...requests, now])
  // Clean up old entries periodically
  if (otpRequests.size > 500) {
    for (const [key, times] of otpRequests.entries()) {
      if (times.every(t => now - t > hour)) otpRequests.delete(key)
    }
  }
  return true
}

// Strip all whitespace and produce both normalized and spaced variants
// so we match "+919945029549" and "+91 9945029549" stored in Sanity
function phoneVariants(raw) {
  const norm = raw.replace(/\s+/g, '')
  const spaced = norm.replace(/^(\+\d{2})(\d)/, '$1 $2')
  return { norm, spaced }
}

export async function POST(request) {
  try {
    const { phone: rawPhone } = await request.json()

    const { norm: phone, spaced: phoneSpaced } = phoneVariants(rawPhone || '')

    if (!phone || !/^\+\d{10,15}$/.test(phone)) {
      return Response.json({ error: 'Invalid phone number. Use E.164 format (e.g. +91XXXXXXXXXX).' }, { status: 400 })
    }

    // Check member exists — match regardless of whether team stored with or without space
    const sitter = await sanity.fetch(
      `*[_type == "catSitter" && (phone == $phone || phone == $phoneSpaced) && memberVerified == true][0]{ _id }`,
      { phone, phoneSpaced }
    )
    if (!sitter) {
      return Response.json({ error: 'Phone number not found. Contact support@purrfectlove.org to join.' }, { status: 403 })
    }

    // Rate limit
    if (!checkRateLimit(phone)) {
      return Response.json({ error: 'Too many requests. Please wait before trying again.' }, { status: 429 })
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Delete existing OTPs for this phone
    await sanity.delete({ query: '*[_type == "otpCode" && phone == $phone]', params: { phone } })

    // Save new OTP
    await sanity.create({
      _type: 'otpCode',
      phone,
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })

    // Send SMS via Twilio
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    await client.messages.create({
      body: `Your Purrfect Love code: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('send-otp error:', error)
    return Response.json({ error: 'Failed to send code. Please try again.' }, { status: 500 })
  }
}
