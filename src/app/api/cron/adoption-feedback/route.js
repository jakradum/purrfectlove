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

function brandedEmail({ heading, body }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;background-color:#FFF8F0;color:#2D2D2D;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#2C5F4F;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;font-family:'Trebuchet MS',sans-serif;font-size:24px;color:#F6F4F0;font-weight:700;">Purrfect Love</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;">
            <h2 style="margin:0 0 20px;font-size:18px;color:#2C5F4F;font-family:'Trebuchet MS',sans-serif;">${heading}</h2>
            ${body}
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:24px 0 0;">– The Purrfect Love Team</p>
          </td>
        </tr>
        <tr>
          <td style="background:#F5F0E8;padding:20px 32px;text-align:center;border-top:1px solid #E8E4DC;">
            <p style="margin:0;font-size:13px;color:#6B6B6B;font-weight:600;">Purrfect Love · Cat Adoption &amp; Rescue</p>
            <p style="margin:4px 0 0;font-size:12px;color:#999;">
              <a href="https://purrfectlove.org" style="color:#C85C3F;text-decoration:none;">purrfectlove.org</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function ctaButton({ label, url }) {
  return `<p style="margin:24px 0 0;text-align:center;">
    <a href="${url}" style="display:inline-block;background:#2C5F4F;color:#F6F4F0;text-decoration:none;font-family:'Trebuchet MS',sans-serif;font-size:15px;font-weight:700;padding:12px 28px;border-radius:8px;">${label} →</a>
  </p>`
}

function buildEmail({ applicantName, catName, feedbackToken, locale }) {
  const url = `https://purrfectlove.org/adopt/feedback?token=${feedbackToken}`
  const isDE = locale === 'de'

  const subject = isDE
    ? 'Wie läuft es mit Ihrer Katze?'
    : 'How has life with your cat been?'

  const heading = isDE
    ? `Hallo ${applicantName},`
    : `Hi ${applicantName},`

  const body = isDE
    ? `
      <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
        Es ist nun etwa ein Monat vergangen, seit <strong>${catName}</strong> bei Ihnen eingezogen ist.
        Wir hoffen, dass Sie sich gut eingelebt haben.
      </p>
      <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
        Wir würden uns sehr freuen, von Ihren Erfahrungen zu hören.
        Ihr Feedback hilft uns, noch mehr Katzen und Familien zu unterstützen.
      </p>
      <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
        Es dauert nur wenige Minuten.
      </p>
      ${ctaButton({ label: 'Feedback geben', url })}
      <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:32px 0 0;">
        Vielen Dank, dass Sie <strong>${catName}</strong> ein Zuhause gegeben haben.
      </p>
    `
    : `
      <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
        It has been about a month since <strong>${catName}</strong> came home.
        We hope the two of you are settling in well.
      </p>
      <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
        We would love to hear how the adoption has been for you.
        Your feedback helps us improve and support more cats and families.
      </p>
      <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
        It only takes a few minutes.
      </p>
      ${ctaButton({ label: 'Share your feedback', url })}
      <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:32px 0 0;">
        Thank you for giving <strong>${catName}</strong> a home.
      </p>
    `

  return { subject, html: brandedEmail({ heading, body }) }
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization') || ''
  const expected = process.env.CRON_SECRET
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const from = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString()
    const to = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const applications = await serverClient.fetch(
      `*[_type == "application" && status == "adopted" && feedbackToken != null && feedbackSentAt == null && adoptedAt > $from && adoptedAt <= $to]{
        _id,
        feedbackToken,
        feedbackLocale,
        applicantName,
        email,
        "catName": cat->name
      }`,
      { from, to }
    )

    if (!applications || applications.length === 0) {
      return Response.json({ ok: true, checked: 0, sent: 0 })
    }

    let sent = 0
    const errors = []

    for (const app of applications) {
      const { _id, feedbackToken, feedbackLocale, applicantName, email, catName } = app

      if (!email) {
        console.warn(`adoption-feedback: skipping ${_id} — no email`)
        continue
      }

      const { subject, html } = buildEmail({
        applicantName: applicantName || 'there',
        catName: catName || 'your cat',
        feedbackToken,
        locale: feedbackLocale || 'en',
      })

      const { error: resendError } = await resend.emails.send({
        from: 'Purrfect Love <no-reply@purrfectlove.org>',
        to: [email],
        subject,
        html,
      })

      if (resendError) {
        console.error(`adoption-feedback: Resend error for ${_id}:`, resendError)
        errors.push({ id: _id, error: resendError.message })
        continue
      }

      // Patch feedbackSentAt immediately after successful send
      try {
        await serverClient
          .patch(_id)
          .set({ feedbackSentAt: new Date().toISOString() })
          .commit()
        sent++
      } catch (patchError) {
        console.error(`adoption-feedback: patch error for ${_id}:`, patchError)
        errors.push({ id: _id, error: patchError.message })
      }
    }

    return Response.json({ ok: true, checked: applications.length, sent, errors: errors.length > 0 ? errors : undefined })
  } catch (error) {
    console.error('cron/adoption-feedback error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
