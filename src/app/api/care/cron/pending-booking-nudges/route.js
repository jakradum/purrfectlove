import { createClient } from '@sanity/client'
import { Resend } from 'resend'
import { createSupabaseDbClient } from '@/lib/supabaseServer'

// Runs hourly. Two independent jobs:
//
// 1. Pending booking nudges (status = 'pending'):
//   24 hrs  → email sitter: reminder
//   48 hrs  → email sitter: final reminder, warns of auto-withdraw
//   96 hrs  OR 12 hrs before sit start (whichever comes first)
//           → withdraw the request (status → cancelled, cancelled_by = 'system')
//             email sitter (no-show notice) + email parent (find another sitter)
//
// 2. Pre-sit reminder (status = 'confirmed'):
//   ~16 hrs before start_date → email sitter: tips for the upcoming sit

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

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_DE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']

function shortDateEN(ymd) {
  const [, m, d] = ymd.split('-').map(Number)
  return `${d} ${MONTHS_EN[m - 1]}`
}

function shortDateDE(ymd) {
  const [, m, d] = ymd.split('-').map(Number)
  return `${d}. ${MONTHS_DE[m - 1]}`
}

function preSitEmail(startDate) {
  const dateEN = shortDateEN(startDate)
  const dateDE = shortDateDE(startDate)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pre-Sit Reminder</title>
  <style>
    body { margin: 0; padding: 0; background: #F6F4F0; font-family: Arial, Helvetica, sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
    .header { background: #2C5F4F; padding: 32px 40px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: -0.3px; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.7); font-size: 14px; }
    .body { padding: 36px 40px; color: #2A2A2A; font-size: 15px; line-height: 1.7; }
    .body p { margin: 0 0 16px; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #C85C3F; margin: 28px 0 12px; }
    .tip { display: flex; gap: 12px; margin-bottom: 12px; }
    .tip-dot { width: 6px; height: 6px; border-radius: 50%; background: #2C5F4F; flex-shrink: 0; margin-top: 8px; }
    .tip-text { font-size: 15px; color: #2A2A2A; line-height: 1.6; }
    .tip-text strong { color: #2C5F4F; font-weight: 600; }
    .divider { border: none; border-top: 1px solid #F0EDE8; margin: 28px 0; }
    .footer { background: #F6F4F0; padding: 24px 40px; font-size: 13px; color: #888; line-height: 1.6; }
    .footer a { color: #2C5F4F; text-decoration: none; }
    .lang-badge { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; background: #F5D5C8; color: #C85C3F; border-radius: 4px; padding: 2px 8px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>You have an upcoming sit on ${dateEN}</h1>
      <p>A few things to keep in mind</p>
    </div>
    <div class="body">
      <p>Hi,</p>
      <p>You have an upcoming sit on ${dateEN}. Here are a few things to help it go smoothly.</p>
      <div class="section-title">Before you arrive</div>
      <div class="tip"><div class="tip-dot"></div><div class="tip-text"><strong>Ask about escape history.</strong> Find out if the cat has slipped out before and how it happened. Knowing past patterns helps you stay alert to the same ones.</div></div>
      <div class="tip"><div class="tip-dot"></div><div class="tip-text"><strong>Know the stress triggers.</strong> Stress can make cats bolt. Ask what unsettles this cat so you can avoid or manage those situations.</div></div>
      <div class="tip"><div class="tip-dot"></div><div class="tip-text"><strong>Ask what treats work best.</strong> High-value rewards can help coax a nervous or hiding cat back out. Good to know before you need them.</div></div>
      <div class="section-title">During the sit</div>
      <div class="tip"><div class="tip-dot"></div><div class="tip-text"><strong>Keep doors and windows closed or secured.</strong> Cats are quick and curious. Doorways and open windows are the most common escape points.</div></div>
      <div class="tip"><div class="tip-dot"></div><div class="tip-text"><strong>Be careful when people come and go.</strong> Doorbells and movement at the entrance can startle cats and create a window to escape.</div></div>
      <div class="tip"><div class="tip-dot"></div><div class="tip-text"><strong>Do not bring friends or guests to the home.</strong> The cat parent has trusted you with their space and their cat. Keep it that way.</div></div>
      <div class="tip"><div class="tip-dot"></div><div class="tip-text"><strong>Leave the home as you found it, or better.</strong> Tidy up before you leave and make sure everything is back in place.</div></div>
      <div class="tip"><div class="tip-dot"></div><div class="tip-text"><strong>Be aware that some homes have security cameras.</strong> These are typically in common areas. Conduct yourself accordingly.</div></div>
      <hr class="divider">
      <p>If anything feels off during the sit, reach out to the cat parent directly or contact the Purrfect Love team.</p>
      <p>Have a great sit.</p>
      <p style="color: #2C5F4F; font-weight: 600;">The Purrfect Love Team</p>
    </div>
    <div class="header" style="background: #1e4437;">
      <h1>Du hast einen bevorstehenden Sit am ${dateDE}</h1>
      <p>Ein paar Dinge, die du im Blick haben solltest</p>
    </div>
    <div class="body">
      <p>Hallo,</p>
      <p>Du hast einen bevorstehenden Sit am ${dateDE}. Hier sind ein paar Hinweise, damit alles gut läuft.</p>
      <div class="section-title">Vor deiner Ankunft</div>
      <div class="tip"><div class="tip-dot"></div><div class="tip-text"><strong>Frag nach der Ausreissgeschichte.</strong> Finde heraus, ob die Katze schon einmal entwischt ist und wie es passiert ist. Wer die Muster kennt, kann besser aufpassen.</div></div>
      <div class="tip"><div class="tip-dot"></div><div class="tip-text"><strong>Kenne die Stressauslöser.</strong> Gestresste Katzen können schnell flüchten. Frag, was diese Katze verunsichert, damit du solche Situationen vermeiden oder besser einschätzen kannst.</div></div>
      <div class="tip"><div class="tip-dot"></div><div class="tip-text"><strong>Frag, welche Leckerlis am besten wirken.</strong> Wenn eine Katze sich versteckt oder ängstlich ist, helfen die richtigen Belohnungen dabei, sie wieder hervor zu locken. Gut, das vorher zu wissen.</div></div>
      <div class="tip"><div class="tip-dot"></div><div class="tip-text"><strong>Prüfe, ob die Katze gechipt ist und ein ID-Tag trägt.</strong> Falls sie doch entwischen sollte, helfen aktuelle Identifikationsdaten dabei, sie schnell nach Hause zu bringen.</div></div>
      <div class="section-title">Während des Sits</div>
      <div class="tip"><div class="tip-dot"></div><div class="tip-text"><strong>Halte Türen und Fenster geschlossen oder gesichert.</strong> Katzen sind schnell und neugierig. Türbereiche und offene Fenster sind die häufigsten Fluchtwege.</div></div>
      <div class="tip"><div class="tip-dot"></div><div class="tip-text"><strong>Sei vorsichtig, wenn jemand kommt oder geht.</strong> Klingeln und Bewegung am Eingang können Katzen erschrecken und einen Fluchtmoment erzeugen.</div></div>
      <div class="tip"><div class="tip-dot"></div><div class="tip-text"><strong>Bring keine Freunde oder Gäste in die Wohnung.</strong> Die Katzenpfleger haben dir ihr Zuhause und ihre Katze anvertraut. Bitte halte das so.</div></div>
      <div class="tip"><div class="tip-dot"></div><div class="tip-text"><strong>Hinterlasse die Wohnung so, wie du sie vorgefunden hast, oder besser.</strong> Räum auf, bevor du gehst, und achte darauf, dass alles an seinem Platz ist.</div></div>
      <div class="tip"><div class="tip-dot"></div><div class="tip-text"><strong>Bitte beachte, dass manche Wohnungen Sicherheitskameras haben.</strong> Diese befinden sich in der Regel in den Gemeinschaftsbereichen. Verhalte dich entsprechend.</div></div>
      <hr class="divider">
      <p>Wenn während des Sits etwas nicht stimmt, wende dich direkt an die Katzenpfleger oder kontaktiere das Purrfect Love Team.</p>
      <p>Viel Spaß beim Sit.</p>
      <p style="color: #2C5F4F; font-weight: 600;">Das Purrfect Love Team</p>
    </div>
    <div class="footer">
      Purrfect Love Community &nbsp;|&nbsp; <a href="https://care.purrfectlove.org">care.purrfectlove.org</a>
    </div>
  </div>
</body>
</html>`
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
        // Fire when: 96+ hrs elapsed OR (sit starts within 12 hrs AND request is at least 4 hrs old)
        // The 4hr minimum prevents brand-new requests from being instantly withdrawn
        // just because the sit happens to start soon.
        if (elapsed >= 96 || (hoursToStart <= 12 && elapsed >= 4)) {
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
          const { count: updated48 } = await db
            .from('bookings')
            .update({ reminder_48h_sent_at: now }, { count: 'exact' })
            .eq('id', booking.id)
            .eq('status', 'pending')
          if (!updated48) continue // cancelled between bulk query and now

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
          const { count: updated24 } = await db
            .from('bookings')
            .update({ reminder_24h_sent_at: now }, { count: 'exact' })
            .eq('id', booking.id)
            .eq('status', 'pending')
          if (!updated24) continue // cancelled between bulk query and now

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

    // ── Pre-sit reminder (confirmed bookings, ~16 hrs before start) ────────────
    const targetDate = new Date(Date.now() + 16 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: upcoming } = await db
      .from('bookings')
      .select('id, booking_ref, start_date, sitter_id')
      .eq('status', 'confirmed')
      .eq('start_date', targetDate)
      .is('pre_sit_reminder_sent_at', null)
      .is('deleted_at', null)

    let preSitSent = 0
    if (upcoming && upcoming.length > 0) {
      const upcomingSitterIds = [...new Set(upcoming.map(b => b.sitter_id))]
      const upcomingProfiles = await serverClient.fetch(
        `*[_type == "catSitter" && _id in $ids]{ _id, name, email }`,
        { ids: upcomingSitterIds }
      )
      const upcomingProfileMap = Object.fromEntries(upcomingProfiles.map(p => [p._id, p]))

      for (const booking of upcoming) {
        try {
          const sitter = upcomingProfileMap[booking.sitter_id]
          if (!sitter?.email) continue

          await resend.emails.send({
            from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
            to: [sitter.email],
            subject: `You have an upcoming sit on ${shortDateEN(booking.start_date)}`,
            html: preSitEmail(booking.start_date),
            text: `Hi,\n\nYou have an upcoming sit on ${shortDateEN(booking.start_date)}. Please review the tips in this email to help it go smoothly.\n\nView your booking: https://care.purrfectlove.org/bookings?booking=${booking.id}&role=sitter\n\n– The Purrfect Love Team`,
          })

          await db
            .from('bookings')
            .update({ pre_sit_reminder_sent_at: now })
            .eq('id', booking.id)

          preSitSent++
          console.log(`[pending-nudges] Pre-sit reminder sent for #${booking.booking_ref}`)
        } catch (err) {
          console.error(`[pending-nudges] Pre-sit reminder error for #${booking.booking_ref}:`, err)
        }
      }
    }

    return Response.json({ ok: true, ...stats, pre_sit_sent: preSitSent })
  } catch (error) {
    console.error('[pending-nudges] Fatal error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
