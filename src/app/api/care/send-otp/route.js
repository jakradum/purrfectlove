import { createClient } from '@sanity/client'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export async function POST(request) {
  try {
    const { identifier: rawIdentifier } = await request.json()

    if (!rawIdentifier) {
      return Response.json({ error: 'Email address is required.' }, { status: 400 })
    }

    const email = rawIdentifier.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    // Membership gate: must exist as a verified catSitter or a teamMember
    const [catSitter, teamMember] = await Promise.all([
      sanity.fetch(
        `*[_type == "catSitter" && email == $email && memberVerified == true][0]{ _id }`,
        { email }
      ),
      sanity.fetch(
        `*[_type == "teamMember" && email == $email][0]{ _id }`,
        { email }
      ),
    ])

    if (!catSitter && !teamMember) {
      return Response.json({ error: 'ACCOUNT_NOT_FOUND' }, { status: 403 })
    }

    // Trigger Supabase email OTP.
    // shouldCreateUser: false — non-members are blocked above, but if the gate
    // fails for any reason we must not silently create a Supabase account.
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })

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
