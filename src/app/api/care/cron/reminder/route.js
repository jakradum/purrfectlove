import { createClient } from '@sanity/client'
import { Resend } from 'resend'
import { createSupabaseDbClient } from '@/lib/supabaseServer'

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

function formatDate(ymd, locale = 'en') {
  if (!ymd) return ''
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function waLink(phone) {
  if (!phone) return null
  return `https://wa.me/${phone.replace(/\D/g, '')}`
}

function brandedEmail({ heading, body, isDE = false }) {
  const signoff = isDE ? '– Die Purrfect Love Community' : '– The Purrfect Love Community'
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
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:24px 0 0;">${signoff}</p>
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

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function distanceStr(p1, p2) {
  if (!p1?.lat || !p1?.lng || !p2?.lat || !p2?.lng) return null
  const km = haversineKm(p1.lat, p1.lng, p2.lat, p2.lng)
  return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`
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
    const db = createSupabaseDbClient()

    // Fixed: was querying status == "accepted" — correct value is "confirmed"
    const { data: bookings } = await db
      .from('bookings')
      .select('id, booking_ref, start_date, end_date, sitter_id, parent_id, sit_type')
      .in('status', ['confirmed', 'accepted']) // include legacy 'accepted' for migrated rows
      .eq('start_date', date)
      .is('deleted_at', null)

    if (!bookings || bookings.length === 0) {
      return Response.json({ ok: true, date, bookings: 0, sent: 0 })
    }

    // Batch-fetch all profiles from Sanity
    const allIds = [...new Set(bookings.flatMap(b => [b.sitter_id, b.parent_id]))]
    const profiles = await serverClient.fetch(
      `*[_type == "catSitter" && _id in $ids]{ _id, name, email, phone, location, locale }`,
      { ids: allIds }
    )
    const profileMap = Object.fromEntries(profiles.map(p => [p._id, p]))

    let sent = 0

    for (const booking of bookings) {
      const sitter = profileMap[booking.sitter_id]
      const parent = profileMap[booking.parent_id]
      const bookingRef = booking.booking_ref

      const parentDeepLink = `https://care.purrfectlove.org/bookings?booking=${booking.id}&role=parent`
      const sitterDeepLink = `https://care.purrfectlove.org/bookings?booking=${booking.id}&role=sitter`

      const isParentDE = parent?.locale === 'de'
      const isSitterDE = sitter?.locale === 'de'

      const startFmtParent = formatDate(booking.start_date, parent?.locale)
      const endFmtParent = formatDate(booking.end_date, parent?.locale)
      const startFmtSitter = formatDate(booking.start_date, sitter?.locale)
      const endFmtSitter = formatDate(booking.end_date, sitter?.locale)

      const dist = distanceStr(parent?.location, sitter?.location)
      const parentNeighbourhood = parent?.location?.name
      const sitterNeighbourhood = sitter?.location?.name

      const sitTypeLabelParent = booking.sit_type === 'home_visit' ? (isParentDE ? 'Hausbesuch' : 'Home visit') : booking.sit_type === 'drop_off' ? (isParentDE ? 'Abgabe' : 'Drop-off') : null
      const sitTypeRowParent = sitTypeLabelParent
        ? `<tr><td style="padding:5px 0;font-size:14px;color:#666;width:90px;">${isParentDE ? 'Art der Betreuung' : 'Sit type'}</td><td style="padding:5px 0;font-size:14px;color:#2D2D2D;font-weight:600;">${sitTypeLabelParent}</td></tr>`
        : ''
      const sitTypeTextParent = sitTypeLabelParent ? `\n${isParentDE ? 'Art der Betreuung' : 'Sit type'}: ${sitTypeLabelParent}` : ''

      const sitTypeLabelSitter = booking.sit_type === 'home_visit' ? (isSitterDE ? 'Hausbesuch' : 'Home visit') : booking.sit_type === 'drop_off' ? (isSitterDE ? 'Abgabe' : 'Drop-off') : null
      const sitTypeRowSitter = sitTypeLabelSitter
        ? `<tr><td style="padding:5px 0;font-size:14px;color:#666;width:90px;">${isSitterDE ? 'Art der Betreuung' : 'Sit type'}</td><td style="padding:5px 0;font-size:14px;color:#2D2D2D;font-weight:600;">${sitTypeLabelSitter}</td></tr>`
        : ''
      const sitTypeTextSitter = sitTypeLabelSitter ? `\n${isSitterDE ? 'Art der Betreuung' : 'Sit type'}: ${sitTypeLabelSitter}` : ''

      const locationLabelParent = isParentDE ? 'Standort' : 'Location'
      const locationLabelSitter = isSitterDE ? 'Standort' : 'Location'

      const parentLocationHtml = parentNeighbourhood
        ? `<tr><td style="padding:5px 0;font-size:14px;color:#666;width:90px;">${locationLabelSitter}</td><td style="padding:5px 0;font-size:14px;color:#2D2D2D;">${parentNeighbourhood}${dist ? ` <span style="color:#888;">(${dist})</span>` : ''}</td></tr>`
        : ''
      const sitterLocationHtml = sitterNeighbourhood
        ? `<tr><td style="padding:5px 0;font-size:14px;color:#666;width:90px;">${locationLabelParent}</td><td style="padding:5px 0;font-size:14px;color:#2D2D2D;">${sitterNeighbourhood}${dist ? ` <span style="color:#888;">(${dist})</span>` : ''}</td></tr>`
        : ''
      const parentLocationText = parentNeighbourhood ? `\n${locationLabelSitter}: ${parentNeighbourhood}${dist ? ` (${dist})` : ''}` : ''
      const sitterLocationText = sitterNeighbourhood ? `\n${locationLabelParent}: ${sitterNeighbourhood}${dist ? ` (${dist})` : ''}` : ''

      if (parent?.email) {
        const subjectParent = isParentDE
          ? `Dein Sit beginnt in 2 Tagen — hier sind die Kontaktdaten`
          : `Your sit starts in 2 days — here are the contact details`
        await resend.emails.send({
          from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
          to: [parent.email],
          subject: subjectParent,
          html: brandedEmail({
            isDE: isParentDE,
            heading: isParentDE ? 'Dein Sit beginnt in 2 Tagen' : 'Your sit starts in 2 days',
            body: isParentDE ? `
              <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
                Deine Buchung mit <strong>${sitter?.name || 'deinem Sitter'}</strong> beginnt am <strong>${startFmtParent}</strong>${booking.end_date !== booking.start_date ? ` und läuft bis ${endFmtParent}` : ''}.
                Hier sind die Kontaktdaten, damit ihr euch koordinieren könnt:
              </p>
              ${sitTypeLabelParent ? `<table cellpadding="0" cellspacing="0" style="margin:0 0 12px;width:100%;">${sitTypeRowParent}</table>` : ''}
              ${sitterLocationHtml ? `<table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">${sitterLocationHtml}</table>` : ''}
              ${contactBlock({ name: sitter?.name, email: sitter?.email, phone: sitter?.phone })}
              <p style="font-size:13px;color:#999;margin:0 0 4px;">Buchungs-ID: #${bookingRef}</p>
              ${ctaButton({ label: 'Buchung ansehen', url: parentDeepLink })}
            ` : `
              <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
                Your booking with <strong>${sitter?.name || 'your sitter'}</strong> starts on <strong>${startFmtParent}</strong>${booking.end_date !== booking.start_date ? ` and runs until ${endFmtParent}` : ''}.
                Here are their contact details so you can coordinate:
              </p>
              ${sitTypeLabelParent ? `<table cellpadding="0" cellspacing="0" style="margin:0 0 12px;width:100%;">${sitTypeRowParent}</table>` : ''}
              ${sitterLocationHtml ? `<table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">${sitterLocationHtml}</table>` : ''}
              ${contactBlock({ name: sitter?.name, email: sitter?.email, phone: sitter?.phone })}
              <p style="font-size:13px;color:#999;margin:0 0 4px;">Booking ID: #${bookingRef}</p>
              ${ctaButton({ label: 'View booking', url: parentDeepLink })}
            `,
          }),
          text: isParentDE
            ? `Dein Sit beginnt in 2 Tagen!\n\nDeine Buchung mit ${sitter?.name || 'deinem Sitter'} beginnt am ${startFmtParent}${booking.end_date !== booking.start_date ? ` und läuft bis ${endFmtParent}` : ''}.${sitTypeTextParent}\n\nKontaktdaten des Sitters:${sitterLocationText}\n${contactBlockText({ name: sitter?.name, email: sitter?.email, phone: sitter?.phone })}\n\nBuchungs-ID: #${bookingRef}\n\nBuchung ansehen: ${parentDeepLink}\n\n– Die Purrfect Love Community`
            : `Your sit starts in 2 days!\n\nYour booking with ${sitter?.name || 'your sitter'} starts on ${startFmtParent}${booking.end_date !== booking.start_date ? ` and runs until ${endFmtParent}` : ''}.${sitTypeTextParent}\n\nSitter contact details:${sitterLocationText}\n${contactBlockText({ name: sitter?.name, email: sitter?.email, phone: sitter?.phone })}\n\nBooking ID: #${bookingRef}\n\nView booking: ${parentDeepLink}\n\n– The Purrfect Love Community`,
        })
        sent++
      }

      if (sitter?.email) {
        const subjectSitter = isSitterDE
          ? `Dein Sit beginnt in 2 Tagen — hier sind die Kontaktdaten`
          : `Your sit starts in 2 days — here are the contact details`
        await resend.emails.send({
          from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
          to: [sitter.email],
          subject: subjectSitter,
          html: brandedEmail({
            isDE: isSitterDE,
            heading: isSitterDE ? 'Dein Sit beginnt in 2 Tagen' : 'Your sit starts in 2 days',
            body: isSitterDE ? `
              <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
                Deine Betreuungsverpflichtung für <strong>${parent?.name || 'dein Katzenelternteil'}</strong> beginnt am <strong>${startFmtSitter}</strong>${booking.end_date !== booking.start_date ? ` und läuft bis ${endFmtSitter}` : ''}.
                Hier sind ihre Kontaktdaten:
              </p>
              ${sitTypeLabelSitter ? `<table cellpadding="0" cellspacing="0" style="margin:0 0 12px;width:100%;">${sitTypeRowSitter}</table>` : ''}
              ${parentLocationHtml ? `<table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">${parentLocationHtml}</table>` : ''}
              ${contactBlock({ name: parent?.name, email: parent?.email, phone: parent?.phone })}
              <p style="font-size:13px;color:#999;margin:0 0 4px;">Buchungs-ID: #${bookingRef}</p>
              ${ctaButton({ label: 'Buchung ansehen', url: sitterDeepLink })}
            ` : `
              <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
                Your sitting commitment for <strong>${parent?.name || 'your cat parent'}</strong> starts on <strong>${startFmtSitter}</strong>${booking.end_date !== booking.start_date ? ` and runs until ${endFmtSitter}` : ''}.
                Here are their contact details:
              </p>
              ${sitTypeLabelSitter ? `<table cellpadding="0" cellspacing="0" style="margin:0 0 12px;width:100%;">${sitTypeRowSitter}</table>` : ''}
              ${parentLocationHtml ? `<table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">${parentLocationHtml}</table>` : ''}
              ${contactBlock({ name: parent?.name, email: parent?.email, phone: parent?.phone })}
              <p style="font-size:13px;color:#999;margin:0 0 4px;">Booking ID: #${bookingRef}</p>
              ${ctaButton({ label: 'View booking', url: sitterDeepLink })}
            `,
          }),
          text: isSitterDE
            ? `Dein Sit beginnt in 2 Tagen!\n\nDeine Betreuungsverpflichtung für ${parent?.name || 'dein Katzenelternteil'} beginnt am ${startFmtSitter}${booking.end_date !== booking.start_date ? ` und läuft bis ${endFmtSitter}` : ''}.${sitTypeTextSitter}\n\nKontaktdaten des Katzenelternteils:${parentLocationText}\n${contactBlockText({ name: parent?.name, email: parent?.email, phone: parent?.phone })}\n\nBuchungs-ID: #${bookingRef}\n\nBuchung ansehen: ${sitterDeepLink}\n\n– Die Purrfect Love Community`
            : `Your sit starts in 2 days!\n\nYour sitting commitment for ${parent?.name || 'your cat parent'} starts on ${startFmtSitter}${booking.end_date !== booking.start_date ? ` and runs until ${endFmtSitter}` : ''}.${sitTypeTextSitter}\n\nCat parent contact details:${parentLocationText}\n${contactBlockText({ name: parent?.name, email: parent?.email, phone: parent?.phone })}\n\nBooking ID: #${bookingRef}\n\nView booking: ${sitterDeepLink}\n\n– The Purrfect Love Community`,
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
