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

    const { data: booking, error: fetchError } = await db
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) return Response.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.sitter_id !== user.sitterId) {
      return Response.json({ error: 'Only the sitter can decline this booking' }, { status: 403 })
    }
    if (booking.status !== 'pending') {
      return Response.json({ error: `Cannot decline a booking with status "${booking.status}".` }, { status: 409 })
    }

    const respondedAt = new Date().toISOString()
    const declinePatch = { status: 'declined', responded_at: respondedAt }
    if (booking.notification_delivered && booking.notified_at) {
      const hours = parseFloat(
        ((Date.now() - new Date(booking.notified_at).getTime()) / 3_600_000).toFixed(1)
      )
      declinePatch.response_time_hours = hours
    }
    await db.from('bookings').update(declinePatch).eq('id', bookingId)

    // Email the parent
    const [sitterProfile, parentProfile] = await Promise.all([
      serverClient.fetch(`*[_type == "catSitter" && _id == $id][0]{ name }`, { id: booking.sitter_id }),
      serverClient.fetch(`*[_type == "catSitter" && _id == $id][0]{ name, email }`, { id: booking.parent_id }),
    ])

    const ref = booking.booking_ref
    const startFmt = formatDate(booking.start_date)
    const endFmt = formatDate(booking.end_date)
    const sitterName = sitterProfile?.name || 'The sitter'
    const parentName = parentProfile?.name || 'there'

    if (parentProfile?.email) {
      await resend.emails.send({
        from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
        replyTo: 'support@purrfectlove.org',
        to: [parentProfile.email],
        subject: `Booking request #${ref} was not available`,
        html: brandedEmail({
          heading: 'Booking request update',
          body: `
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 12px;">Hi ${parentName},</p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 12px;">Unfortunately, <strong>${sitterName}</strong> is not available for your requested dates (${startFmt} – ${endFmt}).</p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 12px;">Don't worry — there are other sitters in the community who may be a great fit. Browse available sitters and send another request.</p>
            <p style="font-size:14px;color:#555;margin:0;">Questions? Contact us at <a href="mailto:support@purrfectlove.org" style="color:#C85C3F;">support@purrfectlove.org</a>.</p>
            ${ctaButton({ label: 'Find a sitter', url: 'https://care.purrfectlove.org' })}
          `,
        }),
        text: `Hi ${parentName},\n\nUnfortunately, ${sitterName} is not available for your requested dates (${startFmt} – ${endFmt}).\n\nBrowse other available sitters: https://care.purrfectlove.org\n\n– The Purrfect Love Community`,
      })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('bookings/decline error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
