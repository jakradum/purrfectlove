import { createClient } from '@sanity/client'
import twilio from 'twilio'
import { Resend } from 'resend'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const resend = new Resend(process.env.RESEND_API_KEY)

// In-memory rate limit: max 3 OTPs per identifier per hour
const otpRequests = new Map()

function checkRateLimit(key) {
  const now = Date.now()
  const hour = 60 * 60 * 1000
  const requests = (otpRequests.get(key) || []).filter(t => now - t < hour)
  if (requests.length >= 3) return false
  otpRequests.set(key, [...requests, now])
  if (otpRequests.size > 500) {
    for (const [k, times] of otpRequests.entries()) {
      if (times.every(t => now - t > hour)) otpRequests.delete(k)
    }
  }
  return true
}

// Strip all whitespace; produce both compact and spaced variants for Sanity matching
function phoneVariants(raw) {
  const norm = raw.replace(/\s+/g, '')
  const spaced = norm.replace(/^(\+\d{2})(\d)/, '$1 $2')
  return { norm, spaced }
}

function otpEmailHtml(code) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;background-color:#FFF8F0;color:#2D2D2D;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background-color:#2C5F4F;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;font-family:'Trebuchet MS',sans-serif;font-size:24px;color:#F6F4F0;font-weight:700;">Purrfect Love</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;">
            <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#4A4A4A;">Hello,</p>
            <p style="margin:0 0 24px 0;font-size:16px;line-height:1.7;color:#4A4A4A;">
              Your verification code for the Purrfect Love Care Portal is:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
              <tr>
                <td style="background-color:#F5F0E8;border-radius:12px;padding:28px;text-align:center;">
                  <p style="margin:0;font-family:'Courier New',monospace;font-size:40px;font-weight:bold;color:#2C5F4F;letter-spacing:8px;">${code}</p>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#4A4A4A;">
              This code will expire in <strong>10 minutes</strong>.
            </p>
            <p style="margin:0 0 32px 0;font-size:15px;line-height:1.7;color:#4A4A4A;">
              If you didn't request this code, please ignore this email.
            </p>
            <p style="margin:0;font-size:15px;color:#4A4A4A;">
              Best,<br />
              <strong style="color:#2C5F4F;">The Purrfect Love Team</strong>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#F5F0E8;padding:20px 32px;text-align:center;border-top:1px solid #E8E4DC;">
            <p style="margin:0 0 4px 0;font-size:13px;color:#6B6B6B;font-weight:600;">Purrfect Love · Cat Adoption &amp; Rescue</p>
            <p style="margin:0;font-size:12px;color:#999999;">
              <a href="https://care.purrfectlove.org" style="color:#C85C3F;text-decoration:none;">care.purrfectlove.org</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function otpEmailText(code) {
  return `Hello,

Your verification code for the Purrfect Love Care Portal is:

${code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best,
The Purrfect Love Team

---
Purrfect Love - Cat Adoption & Rescue
care.purrfectlove.org`
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

    // Check catSitter OR teamMember for the identifier
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
      return Response.json(
        { error: 'Account not found. Contact support@purrfectlove.org to join.' },
        { status: 403 }
      )
    }

    // Rate limit
    if (!checkRateLimit(identifier)) {
      return Response.json({ error: 'Too many requests. Please wait before trying again.' }, { status: 429 })
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Delete any existing OTP for this identifier
    if (type === 'phone') {
      await sanity.delete({ query: '*[_type == "otpCode" && phone == $phone]', params: { phone: identifier } })
    } else {
      await sanity.delete({ query: '*[_type == "otpCode" && email == $email]', params: { email: identifier } })
    }

    // Save new OTP
    const otpDoc = {
      _type: 'otpCode',
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    }
    if (type === 'phone') {
      otpDoc.phone = identifier
    } else {
      otpDoc.email = identifier
    }
    await sanity.create(otpDoc)

    // In development, skip external sends and log the OTP to the terminal
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n[DEV] OTP for ${identifier}: ${otp}\n`)
      return Response.json({ success: true })
    }

    // Send OTP
    if (type === 'phone') {
      const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      await twilioClient.messages.create({
        body: `Your Purrfect Love code: ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: identifier,
      })
    } else {
      const { error: resendError } = await resend.emails.send({
        from: 'Purrfect Love <no-reply@purrfectlove.org>',
        replyTo: 'support@purrfectlove.org',
        to: [identifier],
        subject: 'Your Purrfect Love verification code',
        html: otpEmailHtml(otp),
        text: otpEmailText(otp),
      })
      if (resendError) {
        console.error('send-otp Resend error:', resendError)
        return Response.json({ error: 'Failed to send code. Please try again.' }, { status: 500 })
      }
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('send-otp error:', error)
    return Response.json({ error: 'Failed to send code. Please try again.' }, { status: 500 })
  }
}
