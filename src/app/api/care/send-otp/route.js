import { createClient } from '@sanity/client'
import { Resend } from 'resend'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const resend = new Resend(process.env.RESEND_API_KEY)

// Simple in-memory rate limiting (2 min per email)
const otpRequests = new Map()

const colors = {
  hunterGreen: '#2C5F4F',
  tabbyBrown: '#C85C3F',
  whiskerCream: '#F6F4F0',
  textDark: '#2A2A2A',
  textLight: '#6B6B6B',
  pawPink: '#F5D5C8',
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const emailLower = email.toLowerCase()

    // Rate limit: 2 minutes per email
    const now = Date.now()
    const lastRequest = otpRequests.get(emailLower)
    if (lastRequest && now - lastRequest < 2 * 60 * 1000) {
      const waitSeconds = Math.ceil((2 * 60 * 1000 - (now - lastRequest)) / 1000)
      return Response.json(
        { error: `Please wait ${waitSeconds} seconds before requesting a new code.` },
        { status: 429 }
      )
    }

    // Check if email is a verified member
    const sitter = await serverClient.fetch(
      `*[_type == "catSitter" && email == $email && memberVerified == true][0]{ _id }`,
      { email: emailLower }
    )

    if (!sitter) {
      return Response.json(
        { error: 'Email not found. Contact support@purrfectlove.org to join.' },
        { status: 404 }
      )
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Delete any existing OTP for this email
    await serverClient.delete({
      query: '*[_type == "otpCode" && email == $email]',
      params: { email: emailLower },
    })

    // Save new OTP
    await serverClient.create({
      _type: 'otpCode',
      email: emailLower,
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })

    // Update rate limit
    otpRequests.set(emailLower, now)
    if (otpRequests.size > 500) {
      const cutoff = now - 5 * 60 * 1000
      for (const [key, val] of otpRequests.entries()) {
        if (val < cutoff) otpRequests.delete(key)
      }
    }

    // Send OTP email
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Lora:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'Lora', Georgia, serif; background-color: ${colors.whiskerCream}; color: ${colors.textDark};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.whiskerCream}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color: ${colors.hunterGreen}; padding: 32px; text-align: center;">
              <h1 style="margin: 0; font-family: 'Outfit', 'Trebuchet MS', sans-serif; font-size: 28px; color: ${colors.whiskerCream}; font-weight: 700;">Purrfect Love</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: ${colors.whiskerCream}; font-family: 'Lora', Georgia, serif; opacity: 0.85;">Cat Sitting Network</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px 0; font-family: 'Outfit', 'Trebuchet MS', sans-serif; font-size: 24px; color: ${colors.hunterGreen}; font-weight: 600;">Your login code</h2>
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.7; color: ${colors.textLight};">
                Use the code below to log in to the Purrfect Love cat sitting portal. This code expires in 10 minutes.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px 0;">
                <tr>
                  <td style="background-color: ${colors.whiskerCream}; border: 2px solid ${colors.tabbyBrown}; border-radius: 12px; padding: 32px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; font-family: 'Outfit', sans-serif; color: ${colors.textLight}; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">One-time login code</p>
                    <p style="margin: 0; font-family: 'Outfit', 'Courier New', monospace; font-size: 48px; font-weight: 700; color: ${colors.hunterGreen}; letter-spacing: 8px;">${otp}</p>
                    <p style="margin: 12px 0 0 0; font-size: 13px; color: ${colors.textLight}; font-family: 'Lora', Georgia, serif;">Expires in 10 minutes</p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${colors.textLight};">
                If you didn't request this code, you can safely ignore this email.
              </p>
              <p style="margin: 24px 0 0 0; font-size: 16px; color: ${colors.textDark};">
                With whiskers and purrs,<br />
                <strong style="color: ${colors.hunterGreen};">The Purrfect Love Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: ${colors.whiskerCream}; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; font-family: 'Outfit', sans-serif; color: ${colors.textLight};">Bangalore • Stuttgart</p>
              <p style="margin: 0; font-size: 13px; font-family: 'Lora', Georgia, serif; color: ${colors.textLight};">Made with 🧡 for cats and cat lovers</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    const { error: emailError } = await resend.emails.send({
      from: 'Purrfect Love <no-reply@purrfectlove.org>',
      replyTo: 'support@purrfectlove.org',
      to: [emailLower],
      subject: 'Your Purrfect Love login code',
      html,
    })

    if (emailError) {
      console.error('Failed to send OTP email:', emailError)
      return Response.json({ error: 'Failed to send code. Please try again.' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('send-otp error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
