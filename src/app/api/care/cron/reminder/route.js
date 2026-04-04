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

function targetDate() {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 2)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDate(ymd) {
  if (!ymd) return ''
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function waLink(phone) {
  if (!phone) return null
  return `https://wa.me/${phone.replace(/\D/g, '')}`
}

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
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:24px 0 0;">– The Purrfect Love Community</p>
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

function contactBlock({ name, email, phone }) {
  const wa = waLink(phone)
  const rows = [
    `<tr><td style="padding:5px 0;font-size:14px;color:#666;width:90px;">Name</td><td style="padding:5px 0;font-size:14px;color:#2D2D2D;font-weight:600;">${name || '—'}</td></tr>`,
    email
      ? `<tr><td style="padding:5px 0;font-size:14px;color:#666;">Email</td><td style="padding:5px 0;font-size:14px;"><a href="mailto:${email}" style="color:#C85C3F;text-decoration:none;font-weight:600;">${email}</a></td></tr>`
      : `<tr><td style="padding:5px 0;font-size:14px;color:#666;">Email</td><td style="padding:5px 0;font-size:14px;color:#999;">Not provided</td></tr>`,
    phone
      ? `<tr><td style="padding:5px 0;font-size:14px;color:#666;">Phone</td><td style="padding:5px 0;font-size:14px;color:#2D2D2D;font-weight:600;">${phone}</td></tr>`
      : '',
    wa
      ? `<tr><td style="padding:5px 0;font-size:14px;color:#666;">WhatsApp</td><td style="padding:5px 0;font-size:14px;"><a href="${wa}" style="color:#C85C3F;text-decoration:none;font-weight:600;">Open WhatsApp chat →</a></td></tr>`
      : '',
  ].filter(Boolean).join('')
  return `<table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">${rows}</table>`
}

function contactBlockText({ name, email, phone }) {
  const wa = waLink(phone)
  return [
    `Name: ${name || '—'}`,
    email ? `Email: ${email}` : 'Email: Not provided',
    phone ? `Phone: ${phone}` : '',
    wa ? `WhatsApp: ${wa}` : '',
  ].filter(Boolean).join('\n')
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization') || ''
  const expected = process.env.CRON_SECRET
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const date = targetDate()

    const bookings = await serverClient.fetch(
      `*[_type == "bookingRequest" && status == "accepted" && startDate == $date]{
        _id, bookingRef, startDate, endDate,
        sitter -> { _id, name, email, phone },
        parent -> { _id, name, email, phone }
      }`,
      { date }
    )

    let sent = 0

    for (const booking of bookings) {
      const { sitter, parent, startDate, endDate, bookingRef } = booking
      const startFmt = formatDate(startDate)
      const endFmt = formatDate(endDate)
      const subject = `Your sit starts in 2 days — here are the contact details`

      // Email to parent (contains sitter's contact info)
      if (parent?.email) {
        await resend.emails.send({
          from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
          replyTo: 'support@purrfectlove.org',
          to: [parent.email],
          subject,
          html: brandedEmail({
            heading: 'Your sit starts in 2 days 🐾',
            body: `
              <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
                Your booking with <strong>${sitter?.name || 'your sitter'}</strong> starts on <strong>${startFmt}</strong>${endDate !== startDate ? ` and runs until ${endFmt}` : ''}.
                Here are their contact details so you can coordinate:
              </p>
              ${contactBlock({ name: sitter?.name, email: sitter?.email, phone: sitter?.phone })}
              <p style="font-size:13px;color:#999;margin:0;">Booking ID: #${bookingRef}</p>
            `,
          }),
          text: `Your sit starts in 2 days!\n\nYour booking with ${sitter?.name || 'your sitter'} starts on ${startFmt}${endDate !== startDate ? ` and runs until ${endFmt}` : ''}.\n\nSitter contact details:\n${contactBlockText({ name: sitter?.name, email: sitter?.email, phone: sitter?.phone })}\n\nBooking ID: #${bookingRef}\n\n– The Purrfect Love Community`,
        })
        sent++
      }

      // Email to sitter (contains parent's contact info)
      if (sitter?.email) {
        await resend.emails.send({
          from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
          replyTo: 'support@purrfectlove.org',
          to: [sitter.email],
          subject,
          html: brandedEmail({
            heading: 'Your sit starts in 2 days 🐾',
            body: `
              <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
                Your sitting commitment for <strong>${parent?.name || 'your cat parent'}</strong> starts on <strong>${startFmt}</strong>${endDate !== startDate ? ` and runs until ${endFmt}` : ''}.
                Here are their contact details:
              </p>
              ${contactBlock({ name: parent?.name, email: parent?.email, phone: parent?.phone })}
              <p style="font-size:13px;color:#999;margin:0;">Booking ID: #${bookingRef}</p>
            `,
          }),
          text: `Your sit starts in 2 days!\n\nYour sitting commitment for ${parent?.name || 'your cat parent'} starts on ${startFmt}${endDate !== startDate ? ` and runs until ${endFmt}` : ''}.\n\nCat parent contact details:\n${contactBlockText({ name: parent?.name, email: parent?.email, phone: parent?.phone })}\n\nBooking ID: #${bookingRef}\n\n– The Purrfect Love Community`,
        })
        sent++
      }
    }

    return Response.json({ ok: true, date, bookings: bookings.length, sent })
  } catch (error) {
    console.error('care/cron/reminder error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
