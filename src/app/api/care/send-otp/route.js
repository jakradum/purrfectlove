import { createClient } from '@sanity/client'
import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { Resend } from 'resend'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const resend = new Resend(process.env.RESEND_API_KEY)

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
              Your verification code for the Purrfect Love Community is:
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

Your verification code for the Purrfect Love Community is:

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

    // Generate OTP token via Supabase admin — does not send any email itself.
    // We extract email_otp and send it via Resend using our own template.
    const supabaseAdmin = createSupabaseAdminClient()
    const { data, error: genError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (genError || !data?.properties?.email_otp) {
      console.error('send-otp generateLink error:', genError)
      return Response.json({ error: 'Failed to send code. Please try again.' }, { status: 500 })
    }

    const otp = data.properties.email_otp

    const { error: resendError } = await resend.emails.send({
      from: 'Purrfect Love <no-reply@purrfectlove.org>',
      replyTo: 'support@purrfectlove.org',
      to: [email],
      subject: 'Your Purrfect Love verification code',
      html: otpEmailHtml(otp),
      text: otpEmailText(otp),
    })

    if (resendError) {
      console.error('send-otp Resend error:', resendError)
      return Response.json({ error: 'Failed to send code. Please try again.' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('send-otp error:', error)
    return Response.json({ error: 'Failed to send code. Please try again.' }, { status: 500 })
  }
}
