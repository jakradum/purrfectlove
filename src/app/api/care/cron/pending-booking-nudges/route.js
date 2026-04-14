import { createClient } from '@sanity/client'
import { Resend } from 'resend'
import { createSupabaseDbClient } from '@/lib/supabaseServer'

// Runs hourly. For pending booking requests that the sitter hasn't acted on:
//   24 hrs  → email sitter: reminder
//   48 hrs  → email sitter: final reminder, warns of auto-withdraw
//   96 hrs  OR 12 hrs before sit start (whichever comes first)
//           → withdraw the request (status → cancelled, cancelled_by = 'system')
//             email sitter (no-show notice) + email parent (find another sitter)
//
// Only targets status = 'pending'. Accepted/confirmed bookings are never touched.

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

function ctaButton({ label, url }) {
  return `<p style="margin:24px 0 0;text-align:center;">
    <a href="${url}" style="display:inline-block;background:#2C5F4F;color:#F6F4F0;text-decoration:none;font-family:'Trebuchet MS',sans-serif;font-size:15px;font-weight:700;padding:12px 28px;border-radius:8px;">${label} →</a>
  </p>`
}

// Hours since a timestamp
function hoursSince(ts) {
  return (Date.now() - new Date(ts).getTime()) / (1000 * 60 * 60)
}

// Hours until midnight on start_date (i.e. when the sit begins)
function hoursUntilStart(startDateYMD) {
  const [y, m, d] = startDateYMD.split('-').map(Number)
  const startMidnight = new Date(y, m - 1, d, 0, 0, 0).getTime()
  return (startMidnight - Date.now()) / (1000 * 60 * 60)
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization') || ''
  const expected = process.env.CRON_SECRET
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = createSupabaseDbClient()
    const now = new Date().toISOString()

    // All pending bookings that have been notified (i.e. sitter was emailed on request)
    const { data: pending, error } = await db
      .from('bookings')
      .select('id, booking_ref, start_date, end_date, sitter_id, parent_id, sit_type, notified_at, reminder_24h_sent_at, reminder_48h_sent_at')
      .eq('status', 'pending')
      .not('notified_at', 'is', null)
      .is('deleted_at', null)

    if (error) throw error
    if (!pending || pending.length === 0) {
      return Response.json({ ok: true, processed: 0 })
    }

    // Batch-fetch Sanity profiles for all parties involved
    const allIds = [...new Set(pending.flatMap(b => [b.sitter_id, b.parent_id]))]
    const profiles = await serverClient.fetch(
      `*[_type == "catSitter" && _id in $ids]{ _id, name, email }`,
      { ids: allIds }
    )
    const profileMap = Object.fromEntries(profiles.map(p => [p._id, p]))

    const stats = { reminders_24h: 0, reminders_48h: 0, auto_withdrawn: 0, errors: 0 }

    for (const booking of pending) {
      try {
        const elapsed = hoursSince(booking.notified_at)
        const hoursToStart = hoursUntilStart(booking.start_date)
        const sitter = profileMap[booking.sitter_id]
        const parent = profileMap[booking.parent_id]

        const startFmt = formatDate(booking.start_date)
        const endFmt = formatDate(booking.end_date)
        const dateRange = booking.end_date !== booking.start_date
          ? `${startFmt} – ${endFmt}`
          : startFmt
        const sitterDeepLink = `https://care.purrfectlove.org/bookings?booking=${booking.id}&role=sitter`
        const parentDeepLink = `https://care.purrfectlove.org/bookings?booking=${booking.id}&role=parent`
        const marketplaceLink = `https://care.purrfectlove.org/marketplace`

        // ── Stage 3: Auto-withdraw ─────────────────────────────────────────────
        // Fire when: 96+ hrs elapsed OR sit starts within 12 hrs
        if (elapsed >= 96 || hoursToStart <= 12) {
          await db.from('bookings').update({
            status: 'cancelled',
            cancelled_by: 'system',
            cancellation_reason: 'Booking request withdrawn automatically — sitter did not respond in time.',
            cancelled_at: now,
          }).eq('id', booking.id)

          // Email sitter
          if (sitter?.email) {
            await resend.emails.send({
              from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
              to: [sitter.email],
              subject: `Sitting request withdrawn — no response received (#${booking.booking_ref})`,
              html: brandedEmail({
                heading: "Sitting request withdrawn",
                body: `
                  <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
                    The sitting request from <strong>${parent?.name || 'a cat parent'}</strong> for <strong>${dateRange}</strong>
                    has been automatically withdrawn because it didn't receive a response in time.
                  </p>
                  <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
                    If you're regularly unable to respond to requests, please update your availability
                    or reach out to us so we can help.
                  </p>
                  <p style="font-size:13px;color:#999;margin:0 0 4px;">Booking ID: #${booking.booking_ref}</p>
                  ${ctaButton({ label: 'View booking', url: sitterDeepLink })}
                `,
              }),
              text: `Sitting request withdrawn\n\nThe sitting request from ${parent?.name || 'a cat parent'} for ${dateRange} has been automatically withdrawn because it didn't receive a response in time.\n\nIf you're regularly unable to respond, please update your availability.\n\nBooking ID: #${booking.booking_ref}\n\nView booking: ${sitterDeepLink}\n\n– The Purrfect Love Community`,
            })
          }

          // Email parent
          if (parent?.email) {
            await resend.emails.send({
              from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
              to: [parent.email],
              subject: `Your sitting request was withdrawn — sitter didn't respond (#${booking.booking_ref})`,
              html: brandedEmail({
                heading: "Your sitting request was withdrawn",
                body: `
                  <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
                    Unfortunately, <strong>${sitter?.name || 'the sitter'}</strong> did not respond to your sitting request
                    for <strong>${dateRange}</strong> in time, so it has been automatically withdrawn.
                  </p>
                  <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
                    We're sorry for the inconvenience. Please browse the marketplace to find another sitter for your dates.
                  </p>
                  <p style="font-size:13px;color:#999;margin:0 0 4px;">Booking ID: #${booking.booking_ref}</p>
                  ${ctaButton({ label: 'Find a sitter', url: marketplaceLink })}
                `,
              }),
              text: `Your sitting request was withdrawn\n\n${sitter?.name || 'The sitter'} did not respond to your sitting request for ${dateRange} in time, so it has been automatically withdrawn.\n\nPlease browse the marketplace to find another sitter: ${marketplaceLink}\n\nBooking ID: #${booking.booking_ref}\n\n– The Purrfect Love Community`,
            })
          }

          stats.auto_withdrawn++
          console.log(`[pending-nudges] Auto-withdrawn #${booking.booking_ref} (${elapsed.toFixed(1)}h elapsed, ${hoursToStart.toFixed(1)}h to start)`)
          continue
        }

        // ── Stage 2: 48hr reminder ─────────────────────────────────────────────
        if (elapsed >= 48 && !booking.reminder_48h_sent_at) {
          await db.from('bookings').update({ reminder_48h_sent_at: now }).eq('id', booking.id)

          if (sitter?.email) {
            await resend.emails.send({
              from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
              to: [sitter.email],
              subject: `Final reminder: sitting request needs your response (#${booking.booking_ref})`,
              html: brandedEmail({
                heading: "This request still needs your response",
                body: `
                  <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
                    <strong>${parent?.name || 'A cat parent'}</strong> is still waiting for your response to their sitting request for <strong>${dateRange}</strong>.
                  </p>
                  <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
                    This is your second reminder. If you don't respond, the request will be automatically withdrawn and
                    <strong>${parent?.name || 'the cat parent'}</strong> will be notified to find another sitter.
                  </p>
                  <p style="font-size:13px;color:#999;margin:0 0 4px;">Booking ID: #${booking.booking_ref}</p>
                  ${ctaButton({ label: 'Accept or decline', url: sitterDeepLink })}
                `,
              }),
              text: `Final reminder: sitting request needs your response\n\n${parent?.name || 'A cat parent'} is still waiting for your response for ${dateRange}.\n\nThis is your second reminder. If you don't respond, the request will be automatically withdrawn.\n\nBooking ID: #${booking.booking_ref}\n\nAccept or decline: ${sitterDeepLink}\n\n– The Purrfect Love Community`,
            })
          }

          stats.reminders_48h++
          console.log(`[pending-nudges] 48h reminder sent for #${booking.booking_ref}`)
          continue
        }

        // ── Stage 1: 24hr reminder ─────────────────────────────────────────────
        if (elapsed >= 24 && !booking.reminder_24h_sent_at) {
          await db.from('bookings').update({ reminder_24h_sent_at: now }).eq('id', booking.id)

          if (sitter?.email) {
            await resend.emails.send({
              from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
              to: [sitter.email],
              subject: `Reminder: you have a pending sitting request (#${booking.booking_ref})`,
              html: brandedEmail({
                heading: "You have a pending sitting request",
                body: `
                  <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
                    <strong>${parent?.name || 'A cat parent'}</strong> sent you a sitting request for <strong>${dateRange}</strong>
                    that's still waiting for your response.
                  </p>
                  <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
                    Please log in and let them know whether you can help — quick responses make a big difference!
                  </p>
                  <p style="font-size:13px;color:#999;margin:0 0 4px;">Booking ID: #${booking.booking_ref}</p>
                  ${ctaButton({ label: 'Accept or decline', url: sitterDeepLink })}
                `,
              }),
              text: `Reminder: pending sitting request\n\n${parent?.name || 'A cat parent'} sent you a sitting request for ${dateRange} that's still waiting for your response.\n\nPlease log in and let them know whether you can help.\n\nBooking ID: #${booking.booking_ref}\n\nAccept or decline: ${sitterDeepLink}\n\n– The Purrfect Love Community`,
            })
          }

          stats.reminders_24h++
          console.log(`[pending-nudges] 24h reminder sent for #${booking.booking_ref}`)
          continue
        }
      } catch (bookingErr) {
        stats.errors++
        console.error(`[pending-nudges] Error processing #${booking.booking_ref}:`, bookingErr)
      }
    }

    console.log('[pending-nudges] Done:', stats)
    return Response.json({ ok: true, ...stats })
  } catch (error) {
    console.error('[pending-nudges] Fatal error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
