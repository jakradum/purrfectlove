import { createClient } from '@sanity/client'
import { Resend } from 'resend'
import { verifyToken } from '@/lib/careAuth'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const resend = new Resend(process.env.RESEND_API_KEY)

async function getAuth(request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/auth_token=([^;]+)/)
  const token = match ? decodeURIComponent(match[1]) : null
  if (!token) return null
  return verifyToken(token)
}

function expandDateRange(startYMD, endYMD) {
  const dates = []
  const cur = new Date(startYMD + 'T00:00:00Z')
  const end = new Date(endYMD + 'T00:00:00Z')
  while (cur <= end) {
    const y = cur.getUTCFullYear()
    const m = String(cur.getUTCMonth() + 1).padStart(2, '0')
    const d = String(cur.getUTCDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return dates
}

function formatDate(ymd) {
  if (!ymd) return ''
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
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

export async function POST(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { bookingId } = await request.json()
    if (!bookingId) return Response.json({ error: 'bookingId is required' }, { status: 400 })

    // Fetch the booking request with both parties' details
    const booking = await serverClient.fetch(
      `*[_type == "bookingRequest" && _id == $id][0]{
        _id, bookingRef, startDate, endDate, status, cats,
        notifiedAt, notificationDelivered,
        sitter -> { _id, name, email, location, blockedByBooking },
        parent -> { _id, name, email },
      }`,
      { id: bookingId }
    )

    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.sitter._id !== payload.sitterId) {
      return Response.json({ error: 'Only the sitter can accept this booking' }, { status: 403 })
    }
    if (booking.status === 'accepted') {
      return Response.json({ error: 'Already accepted' }, { status: 409 })
    }

    const ref = booking.bookingRef
    const startFmt = formatDate(booking.startDate)
    const endFmt = formatDate(booking.endDate)
    const sitterName = booking.sitter.name || 'Your sitter'
    const parentName = booking.parent.name || 'Your cat parent'
    const lat = booking.sitter.location?.lat
    const lng = booking.sitter.location?.lng
    const mapsUrl = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : null

    // 1. Mark booking as accepted; write respondedAt and responseTimeHours for scoring
    const respondedAt = new Date().toISOString()
    const acceptPatch = { status: 'accepted', respondedAt }
    if (booking.notificationDelivered && booking.notifiedAt) {
      const hours = parseFloat(
        ((Date.now() - new Date(booking.notifiedAt).getTime()) / 3_600_000).toFixed(1)
      )
      acceptPatch.responseTimeHours = hours
    }
    await serverClient.patch(bookingId).set(acceptPatch).commit()

    // 2. Create sitRecord
    await serverClient.create({
      _type: 'sitRecord',
      sitter: { _type: 'reference', _ref: booking.sitter._id },
      parent: { _type: 'reference', _ref: booking.parent._id },
      startDate: booking.startDate,
      endDate: booking.endDate,
      bookingRef: ref,
      createdAt: new Date().toISOString(),
    })

    // 3. Auto-block dates on sitter's catSitter doc
    const newBlockedDates = expandDateRange(booking.startDate, booking.endDate)
    const existingBlocked = booking.sitter.blockedByBooking || []
    const mergedBlocked = [...new Set([...existingBlocked, ...newBlockedDates])]
    await serverClient.patch(booking.sitter._id).set({ blockedByBooking: mergedBlocked }).commit()

    // 4. In-app notification to sitter
    const notifBody = `Your cats are being looked after ${startFmt}–${endFmt}. We've marked those dates as unavailable for sitting. You can override this in your profile.`
    await serverClient.create({
      _type: 'notification',
      type: 'booking_blocked',
      recipient: { _type: 'reference', _ref: booking.sitter._id },
      body: notifBody,
      linkPath: '/care/profile',
      read: false,
      createdAt: new Date().toISOString(),
    })

    // 5. Email to parent
    if (booking.parent.email) {
      await resend.emails.send({
        from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
        replyTo: 'support@purrfectlove.org',
        to: [booking.parent.email],
        subject: `Booking confirmed! #${ref}`,
        html: brandedEmail({
          heading: 'Your booking is confirmed! 🐾',
          body: `
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 12px;"><strong>${sitterName}</strong> has accepted your booking.</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">
              <tr><td style="padding:4px 0;font-size:14px;color:#666;">Dates</td><td style="padding:4px 0;font-size:14px;color:#2D2D2D;font-weight:600;">${startFmt} – ${endFmt}</td></tr>
              <tr><td style="padding:4px 0;font-size:14px;color:#666;">Booking ID</td><td style="padding:4px 0;font-size:14px;color:#2C5F4F;font-weight:700;">#${ref}</td></tr>
            </table>
            <p style="font-size:14px;color:#555;margin:0 0 8px;">${sitterName}&apos;s approximate location:</p>
            ${mapsUrl ? `<a href="${mapsUrl}" style="display:inline-block;color:#C85C3F;font-size:14px;font-weight:600;">View on Google Maps →</a>` : '<p style="font-size:14px;color:#999;margin:0;">Location not available.</p>'}
          `,
        }),
        text: `Your booking is confirmed! #${ref}\n\n${sitterName} has accepted your booking.\n\nDates: ${startFmt} – ${endFmt}\nBooking ID: #${ref}${mapsUrl ? `\n\n${sitterName}'s approximate location:\n${mapsUrl}` : ''}\n\n– The Purrfect Love Community`,
      })
    }

    // 6. Email to sitter — includes availability-block notice.
    // NOTE: This email is sent unconditionally. When a notificationDelivered tracking system
    // is added, gate this send so the booking_blocked in-app notification doesn't also
    // trigger a duplicate email. At that point, move the availability notice to the
    // notification delivery email instead.
    if (booking.sitter.email) {
      await resend.emails.send({
        from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
        replyTo: 'support@purrfectlove.org',
        to: [booking.sitter.email],
        subject: `Booking confirmed! #${ref}`,
        html: brandedEmail({
          heading: 'Booking confirmed! 🐾',
          body: `
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 12px;"><strong>${parentName}</strong> has booked you from ${startFmt} – ${endFmt}.</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">
              <tr><td style="padding:4px 0;font-size:14px;color:#666;">Booking ID</td><td style="padding:4px 0;font-size:14px;color:#2C5F4F;font-weight:700;">#${ref}</td></tr>
            </table>
            <p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 8px;">We've also marked ${startFmt}–${endFmt} as unavailable on your availability calendar. If you'd like to override any of those dates, you can do so from your <a href="https://purrfectlove.org/care/profile" style="color:#C85C3F;text-decoration:none;font-weight:600;">profile page</a>.</p>
          `,
        }),
        text: `Booking confirmed! #${ref}\n\n${parentName} has booked you from ${startFmt} – ${endFmt}.\n\nBooking ID: #${ref}\n\nWe've also marked ${startFmt}–${endFmt} as unavailable on your availability calendar. To override any dates, visit: https://purrfectlove.org/care/profile\n\n– The Purrfect Love Community`,
      })
    }

    return Response.json({ success: true, bookingRef: ref })
  } catch (error) {
    console.error('bookings/accept error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
