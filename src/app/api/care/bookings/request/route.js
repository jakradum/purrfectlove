import { createClient } from '@sanity/client'
import { Resend } from 'resend'
import { getSupabaseUser, createSupabaseDbClient } from '@/lib/supabaseServer'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const WORDS = [
  'Fur','Claw','Whisker','Mew','Floof','Loaf','Purr','Paw','Boop','Nap',
  'Scruff','Tuft','Biscuit','Zoomie','Blep','Chirp','Mlem','Derp','Flop','Snoot',
  'Sploot','Hiss','Bonk','Flick','Murr','Kneads','Trill','Huff','Yowl','Slink',
  'Stalk','Pounce','Rumble','Nibble','Sniff','Groom','Knead','Stretch','Curl','Perch',
  'Prowl','Nuzzle','Headbutt','Fluff','Burrow','Doze','Lunge','Skitter','Dash','Pallas',
]

function generateBookingRef(startDate) {
  const [, m, d] = startDate.split('-')
  const ddmm = `${d}${m}`
  const word = WORDS[Math.floor(Math.random() * WORDS.length)]
  return `${word}${ddmm}`
}

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
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:24px 0 0;">– The Purrfect Love Community</p>
          </td>
        </tr>
        <tr>
          <td style="background:#F5F0E8;padding:20px 32px;text-align:center;border-top:1px solid #E8E4DC;">
            <p style="margin:0;font-size:13px;color:#6B6B6B;font-weight:600;">Purrfect Love · Cat Adoption &amp; Rescue</p>
            <p style="margin:4px 0 0;font-size:12px;color:#999;">
              <a href="https://purrfectlove.org" style="color:#C85C3F;text-decoration:none;">purrfectlove.org</a>
              &nbsp;·&nbsp;
              <a href="mailto:support@purrfectlove.org" style="color:#C85C3F;text-decoration:none;">support@purrfectlove.org</a>
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

function formatDate(ymd) {
  if (!ymd) return ''
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

export async function POST(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { sitterId, startDate, endDate, cats, message } = await request.json()

    if (!sitterId || !startDate || !endDate) {
      return Response.json({ error: 'sitterId, startDate and endDate are required' }, { status: 400 })
    }
    if (sitterId === user.sitterId) {
      return Response.json({ error: 'Cannot book yourself' }, { status: 400 })
    }

    const db = createSupabaseDbClient()

    // Ensure unique bookingRef
    let bookingRef
    let attempts = 0
    do {
      bookingRef = generateBookingRef(startDate)
      const { data: existing } = await db
        .from('bookings')
        .select('id')
        .eq('booking_ref', bookingRef)
        .maybeSingle()
      if (!existing) break
    } while (++attempts < 5)

    // Insert booking
    const { data: booking, error: insertError } = await db
      .from('bookings')
      .insert({
        booking_ref: bookingRef,
        sitter_id:   sitterId,
        parent_id:   user.sitterId,
        start_date:  startDate,
        end_date:    endDate,
        cats:        cats || [],
        message:     message || null,
        status:      'pending',
        created_at:  new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    const bookingId = booking.id

    // Send sit-request notification email + write notified_at for response-time tracking
    try {
      const sitter = await serverClient.fetch(
        `*[_type == "catSitter" && _id == $id][0]{ name, email, notifEmailSitRequest }`,
        { id: sitterId }
      )
      if (sitter?.email && sitter?.notifEmailSitRequest !== false) {
        const startFmt = formatDate(startDate)
        const endFmt = formatDate(endDate)
        const sitterFirstName = (sitter.name || '').split(' ')[0] || 'there'
        const deepLink = `https://purrfectlove.org/care/bookings?booking=${bookingId}&role=sitter`
        const catList = (cats || []).join(', ') || 'not specified'

        // Fetch parent name for a personalised email
        let parentName = 'A member'
        try {
          const parent = await serverClient.fetch(
            `*[_type == "catSitter" && _id == $id][0]{ name }`,
            { id: user.sitterId }
          )
          if (parent?.name) parentName = parent.name
        } catch { /* non-fatal */ }

        const { error: resendError } = await resend.emails.send({
          from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
          replyTo: 'support@purrfectlove.org',
          to: [sitter.email],
          subject: `New sit request #${bookingRef}`,
          tags: [{ name: 'booking_id', value: bookingId }],
          html: brandedEmail({
            heading: `New sit request from ${parentName}`,
            body: `
              <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">Hi ${sitterFirstName},</p>
              <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;"><strong>${parentName}</strong> has sent you a sit request. Here are the details:</p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">
                <tr><td style="padding:5px 0;font-size:14px;color:#666;width:100px;">Dates</td><td style="padding:5px 0;font-size:14px;color:#2D2D2D;font-weight:600;">${startFmt} – ${endFmt}</td></tr>
                <tr><td style="padding:5px 0;font-size:14px;color:#666;">Cats</td><td style="padding:5px 0;font-size:14px;color:#2D2D2D;">${catList}</td></tr>
                ${message ? `<tr><td style="padding:5px 0;font-size:14px;color:#666;vertical-align:top;">Message</td><td style="padding:5px 0;font-size:14px;color:#2D2D2D;font-style:italic;">"${message}"</td></tr>` : ''}
                <tr><td style="padding:5px 0;font-size:14px;color:#666;">Booking ID</td><td style="padding:5px 0;font-size:14px;color:#2C5F4F;font-weight:700;">#${bookingRef}</td></tr>
              </table>
              <p style="font-size:14px;color:#555;margin:0 0 8px;">Log in to accept or decline this request:</p>
              ${ctaButton({ label: 'View booking', url: deepLink })}
            `,
          }),
          text: `Hi ${sitterFirstName},\n\n${parentName} has sent you a sit request.\n\nDates: ${startFmt} – ${endFmt}\nCats: ${catList}${message ? `\nMessage: "${message}"` : ''}\nBooking ID: #${bookingRef}\n\nAccept or decline: ${deepLink}\n\n– The Purrfect Love Community`,
        })
        if (!resendError) {
          await db.from('bookings').update({ notified_at: new Date().toISOString() }).eq('id', bookingId)
        }
      }
    } catch (notifError) {
      console.error('bookings/request notification error:', notifError)
    }

    return Response.json({ bookingRef, bookingId })
  } catch (error) {
    console.error('bookings/request error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
