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

const PROFILE_URL = 'https://care.purrfectlove.org/profile?edit=availability'

function buildEmail(name, locale) {
  const isDE = locale === 'de'

  const subject = isDE
    ? 'Kurze Erinnerung: Deine Verfügbarkeit auf Purrfect Love'
    : 'Quick reminder: update your availability on Purrfect Love'

  const plainText = isDE
    ? `Hallo ${name},

Dies ist deine monatliche Erinnerung, deine Verfügbarkeit in der Purrfect Love Community zu aktualisieren.

Aktuelle Angaben helfen Katzeneltern, den richtigen Sitter zu finden und vermeiden unnötige Anfragen, wenn du nicht verfügbar bist.

Verfügbarkeit aktualisieren: ${PROFILE_URL}

Mit lieben Grüßen,
Das Purrfect Love Team`
    : `Hi ${name},

This is your monthly reminder to update your availability on the Purrfect Love Community.

Accurate dates help cat parents find the right sitter and save you from requests landing when you're not free.

Update your availability: ${PROFILE_URL}

With love,
The Purrfect Love Team`

  const ctaLabel = isDE ? 'Verfügbarkeit aktualisieren →' : 'Update availability →'
  const bodyText = isDE
    ? `Dies ist deine monatliche Erinnerung, deine Verfügbarkeit in der Purrfect Love Community zu aktualisieren. Aktuelle Angaben helfen Katzeneltern, den richtigen Sitter zu finden, und vermeiden unnötige Anfragen, wenn du nicht verfügbar bist.`
    : `This is your monthly reminder to update your availability on the Purrfect Love Community. Accurate dates help cat parents find the right sitter and save you from requests landing when you're not free.`

  const html = `<!DOCTYPE html>
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
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">${isDE ? `Hallo ${name},` : `Hi ${name},`}</p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 24px;">${bodyText}</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td style="background:#2C5F4F;border-radius:8px;padding:13px 28px;">
                  <a href="${PROFILE_URL}" style="color:#F6F4F0;text-decoration:none;font-family:'Trebuchet MS',sans-serif;font-size:15px;font-weight:700;">${ctaLabel}</a>
                </td>
              </tr>
            </table>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0;">${isDE ? 'Mit lieben Grüßen,<br>Das Purrfect Love Team' : 'With love,<br>The Purrfect Love Team'}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#F5F0E8;padding:20px 32px;text-align:center;border-top:1px solid #E8E4DC;">
            <p style="margin:0;font-size:13px;color:#6B6B6B;font-weight:600;">Purrfect Love · Cat Adoption &amp; Rescue</p>
            <p style="margin:4px 0 0;font-size:12px;color:#999;">
              <a href="https://care.purrfectlove.org" style="color:#C85C3F;text-decoration:none;">care.purrfectlove.org</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, html, plainText }
}

export async function GET(request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all verified sitters
  const sitters = await serverClient.fetch(
    `*[_type == "catSitter" && memberVerified == true && defined(email)] {
      _id, name, email, locale
    }`
  )

  console.log(`availability-reminder: sending to ${sitters.length} verified members`)

  const results = []

  for (const sitter of sitters) {
    const locale = sitter.locale === 'de' ? 'de' : 'en'
    const { subject, html, plainText } = buildEmail(sitter.name, locale)

    const { error } = await resend.emails.send({
      from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
      to: [sitter.email],
      subject,
      html,
      text: plainText,
    })

    if (error) {
      console.error(`Failed to send to ${sitter.email}:`, error)
      results.push({ name: sitter.name, status: 'failed' })
    } else {
      results.push({ name: sitter.name, locale, status: 'sent' })
    }
  }

  const sent = results.filter(r => r.status === 'sent').length
  const failed = results.filter(r => r.status === 'failed').length

  return Response.json({ success: true, sent, failed, results })
}
