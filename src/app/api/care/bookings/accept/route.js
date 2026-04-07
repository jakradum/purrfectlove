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

const resend = new Resend(process.env.RESEND_API_KEY)

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

function ctaButton({ label, url }) {
  return `<p style="margin:24px 0 0;text-align:center;">
    <a href="${url}" style="display:inline-block;background:#2C5F4F;color:#F6F4F0;text-decoration:none;font-family:'Trebuchet MS',sans-serif;font-size:15px;font-weight:700;padding:12px 28px;border-radius:8px;">${label} →</a>
  </p>`
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
    const user = await getSupabaseUser(request)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { bookingId } = await request.json()
    if (!bookingId) return Response.json({ error: 'bookingId is required' }, { status: 400 })

    const db = createSupabaseDbClient()

    // Fetch booking from Supabase
    const { data: booking, error: fetchError } = await db
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) return Response.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.sitter_id !== user.sitterId) {
      return Response.json({ error: 'Only the sitter can accept this booking' }, { status: 403 })
    }
    if (booking.status === 'confirmed' || booking.status === 'accepted') {
      return Response.json({ error: 'Already confirmed' }, { status: 409 })
    }

    // Fetch sitter + parent profiles from Sanity
    const [sitterProfile, parentProfile] = await Promise.all([
      serverClient.fetch(
        `*[_type == "catSitter" && _id == $id][0]{ _id, name, email, location, blockedByBooking }`,
        { id: booking.sitter_id }
      ),
      serverClient.fetch(
        `*[_type == "catSitter" && _id == $id][0]{ _id, name, email }`,
        { id: booking.parent_id }
      ),
    ])

    const ref = booking.booking_ref
    const startFmt = formatDate(booking.start_date)
    const endFmt = formatDate(booking.end_date)
    const sitterName = sitterProfile?.name || 'Your sitter'
    const parentName = parentProfile?.name || 'Your cat parent'
    const lat = sitterProfile?.location?.lat
    const lng = sitterProfile?.location?.lng
    const mapsUrl = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : null

    // 1. Mark booking as confirmed; write responded_at and response_time_hours for scoring
    const respondedAt = new Date().toISOString()
    const acceptPatch = { status: 'confirmed', responded_at: respondedAt }
    if (booking.notification_delivered && booking.notified_at) {
      const hours = parseFloat(
        ((Date.now() - new Date(booking.notified_at).getTime()) / 3_600_000).toFixed(1)
      )
      acceptPatch.response_time_hours = hours
    }
    await db.from('bookings').update(acceptPatch).eq('id', bookingId)

    // 2. Mark overlapping pending bookings for this sitter as unavailable
    const { data: overlapping } = await db
      .from('bookings')
      .select('id')
      .neq('id', bookingId)
      .eq('sitter_id', booking.sitter_id)
      .eq('status', 'pending')
      .lte('start_date', booking.end_date)
      .gte('end_date', booking.start_date)

    if (overlapping?.length > 0) {
      await db.from('bookings')
        .update({ status: 'unavailable' })
        .in('id', overlapping.map(b => b.id))
    }

    // 3. Create sitRecord in Sanity (post-sit confirmation record)
    await serverClient.create({
      _type: 'sitRecord',
      sitter: { _type: 'reference', _ref: booking.sitter_id },
      parent: { _type: 'reference', _ref: booking.parent_id },
      startDate: booking.start_date,
      endDate: booking.end_date,
      bookingRef: ref,
      createdAt: new Date().toISOString(),
    })

    // 4. Auto-block dates on sitter's catSitter doc
    const newBlockedDates = expandDateRange(booking.start_date, booking.end_date)
    const existingBlocked = sitterProfile?.blockedByBooking || []
    const mergedBlocked = [...new Set([...existingBlocked, ...newBlockedDates])]
    await serverClient.patch(booking.sitter_id).set({ blockedByBooking: mergedBlocked }).commit()

    // 5. In-app notification to sitter
    const notifBody = `Your cats are being looked after ${startFmt}–${endFmt}. We've marked those dates as unavailable for sitting. You can override this in your profile.`
    await serverClient.create({
      _type: 'notification',
      type: 'booking_blocked',
      recipient: { _type: 'reference', _ref: booking.sitter_id },
      body: notifBody,
      linkPath: '/care/profile',
      read: false,
      createdAt: new Date().toISOString(),
    })

    const parentDeepLink = `https://care.purrfectlove.org/bookings?booking=${bookingId}&role=parent`
    const sitterDeepLink = `https://care.purrfectlove.org/bookings?booking=${bookingId}&role=sitter`

    // 6. Email to parent
    if (parentProfile?.email) {
      await resend.emails.send({
        from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
        replyTo: 'support@purrfectlove.org',
        to: [parentProfile.email],
        subject: `Booking confirmed! #${ref}`,
        html: brandedEmail({
          heading: 'Your booking is confirmed!',
          body: `
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 12px;"><strong>${sitterName}</strong> has accepted your booking.</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">
              <tr><td style="padding:4px 0;font-size:14px;color:#666;">Dates</td><td style="padding:4px 0;font-size:14px;color:#2D2D2D;font-weight:600;">${startFmt} – ${endFmt}</td></tr>
              <tr><td style="padding:4px 0;font-size:14px;color:#666;">Booking ID</td><td style="padding:4px 0;font-size:14px;color:#2C5F4F;font-weight:700;">#${ref}</td></tr>
            </table>
            <p style="font-size:14px;color:#555;margin:0 0 8px;">${sitterName}&apos;s approximate location:</p>
            ${mapsUrl ? `<a href="${mapsUrl}" style="display:inline-block;color:#C85C3F;font-size:14px;font-weight:600;">View on Google Maps →</a>` : '<p style="font-size:14px;color:#999;margin:0;">Location not available.</p>'}
            ${ctaButton({ label: 'View booking', url: parentDeepLink })}
          `,
        }),
        text: `Your booking is confirmed! #${ref}\n\n${sitterName} has accepted your booking.\n\nDates: ${startFmt} – ${endFmt}\nBooking ID: #${ref}${mapsUrl ? `\n\n${sitterName}'s approximate location:\n${mapsUrl}` : ''}\n\nView booking: ${parentDeepLink}\n\n– The Purrfect Love Community`,
      })
    }

    // 7. Email to sitter
    if (sitterProfile?.email) {
      await resend.emails.send({
        from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
        replyTo: 'support@purrfectlove.org',
        to: [sitterProfile.email],
        subject: `Booking confirmed! #${ref}`,
        html: brandedEmail({
          heading: 'Booking confirmed!',
          body: `
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 12px;"><strong>${parentName}</strong> has booked you from ${startFmt} – ${endFmt}.</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">
              <tr><td style="padding:4px 0;font-size:14px;color:#666;">Booking ID</td><td style="padding:4px 0;font-size:14px;color:#2C5F4F;font-weight:700;">#${ref}</td></tr>
            </table>
            <p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 8px;">We've also marked ${startFmt}–${endFmt} as unavailable on your availability calendar. If you'd like to override any of those dates, you can do so from your <a href="https://care.purrfectlove.org/profile" style="color:#C85C3F;text-decoration:none;font-weight:600;">profile page</a>.</p>
            ${ctaButton({ label: 'View booking', url: sitterDeepLink })}
          `,
        }),
        text: `Booking confirmed! #${ref}\n\n${parentName} has booked you from ${startFmt} – ${endFmt}.\n\nBooking ID: #${ref}\n\nWe've also marked ${startFmt}–${endFmt} as unavailable on your availability calendar.\n\nView booking: ${sitterDeepLink}\n\n– The Purrfect Love Community`,
      })
    }

    return Response.json({ success: true, bookingRef: ref })
  } catch (error) {
    console.error('bookings/accept error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
