import { createClient } from '@sanity/client'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// Strip all whitespace; produce both compact and spaced variants for Sanity matching
function phoneVariants(raw) {
  const norm = raw.replace(/\s+/g, '')
  const spaced = norm.replace(/^(\+\d{2})(\d)/, '$1 $2')
  return { norm, spaced }
}

export async function POST(request) {
  try {
    const { identifier: rawIdentifier, type } = await request.json()

    if (!rawIdentifier || !type || !['phone', 'email'].includes(type)) {
      return Response.json({ error: 'identifier and type (phone or email) are required' }, { status: 400 })
    }

    let identifier

    if (type === 'phone') {
      const { norm } = phoneVariants(rawIdentifier)
      identifier = norm
      if (!/^\+\d{10,15}$/.test(identifier)) {
        return Response.json({ error: 'Invalid phone number. Use E.164 format (e.g. +91XXXXXXXXXX).' }, { status: 400 })
      }
    } else {
      identifier = rawIdentifier.trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        return Response.json({ error: 'Invalid email address.' }, { status: 400 })
      }
    }

    // Membership gate: must exist as a verified catSitter or a teamMember
    let catSitter, teamMember

    if (type === 'phone') {
      const { norm: phone, spaced: phoneSpaced } = phoneVariants(rawIdentifier)
      ;[catSitter, teamMember] = await Promise.all([
        sanity.fetch(
          `*[_type == "catSitter" && (phone == $phone || phone == $phoneSpaced) && memberVerified == true][0]{ _id }`,
          { phone, phoneSpaced }
        ),
        sanity.fetch(
          `*[_type == "teamMember" && (phone == $phone || phone == $phoneSpaced)][0]{ _id }`,
          { phone, phoneSpaced }
        ),
      ])
    } else {
      ;[catSitter, teamMember] = await Promise.all([
        sanity.fetch(
          `*[_type == "catSitter" && email == $email && memberVerified == true][0]{ _id }`,
          { email: identifier }
        ),
        sanity.fetch(
          `*[_type == "teamMember" && email == $email][0]{ _id }`,
          { email: identifier }
        ),
      ])
    }

    if (!catSitter && !teamMember) {
      return Response.json({ error: 'ACCOUNT_NOT_FOUND' }, { status: 403 })
    }

    // Trigger Supabase OTP
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    let otpError
    if (type === 'phone') {
      const { error } = await supabase.auth.signInWithOtp({ phone: identifier })
      otpError = error
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email: identifier,
        options: { shouldCreateUser: true },
      })
      otpError = error
    }

    if (otpError) {
      console.error('send-otp Supabase error:', otpError)
      return Response.json({ error: 'Failed to send code. Please try again.' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('send-otp error:', error)
    return Response.json({ error: 'Failed to send code. Please try again.' }, { status: 500 })
  }
}
