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

const STUDIO_URL = 'https://www.purrfectlove.org/studio'

function brandedEmail({ heading, subheading, body }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#F4F4F4;color:#1A1A1A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F4F4;padding:32px 16px;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #DCDCDC;">

        <!-- Header -->
        <tr>
          <td style="padding:24px 32px;border-bottom:3px solid #1A1A1A;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#888;">Purrfect Love</p>
                  <h1 style="margin:4px 0 0;font-size:20px;font-weight:700;color:#1A1A1A;font-family:Arial,Helvetica,sans-serif;">${heading}</h1>
                  ${subheading ? `<p style="margin:4px 0 0;font-size:13px;color:#666;">${subheading}</p>` : ''}
                </td>
                <td align="right" style="vertical-align:top;">
                  <a href="${STUDIO_URL}" style="display:inline-block;padding:8px 16px;background:#1A1A1A;color:#fff;font-size:12px;font-weight:700;text-decoration:none;font-family:Arial,Helvetica,sans-serif;letter-spacing:0.04em;">Open Studio →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #DCDCDC;background:#F9F9F9;">
            <p style="margin:0;font-size:11px;color:#999;">Automated weekly digest · <a href="https://purrfectlove.org" style="color:#999;">purrfectlove.org</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function sectionHeader(title, count) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 10px;">
      <tr>
        <td style="border-bottom:2px solid #1A1A1A;padding-bottom:6px;">
          <span style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1A1A1A;">${title}</span>
          <span style="font-size:12px;color:#999;margin-left:10px;font-weight:400;text-transform:none;letter-spacing:0;">${count} this week</span>
        </td>
      </tr>
    </table>`
}

function table(headers, rows) {
  if (rows.length === 0) {
    return `<p style="font-size:13px;color:#aaa;margin:0 0 8px;">Nothing this week.</p>`
  }
  const thStyle = 'font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#666;padding:7px 10px 7px 0;border-bottom:1px solid #DCDCDC;text-align:left;white-space:nowrap;'
  const tdStyle = 'font-size:13px;color:#1A1A1A;padding:8px 10px 8px 0;border-bottom:1px solid #EFEFEF;vertical-align:top;line-height:1.5;'
  const ths = headers.map(h => `<th style="${thStyle}">${h}</th>`).join('')
  const trs = rows.map((cells, ri) => {
    const bg = ri % 2 === 1 ? ' background:#FAFAFA;' : ''
    return `<tr>${cells.map(c => `<td style="${tdStyle}${bg}">${c ?? '—'}</td>`).join('')}</tr>`
  }).join('')
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:4px;">
      <thead><tr>${ths}</tr></thead>
      <tbody>${trs}</tbody>
    </table>`
}

export async function GET(request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const weekAgoIso = weekAgo.toISOString()
  const dateRange = `${fmtDate(weekAgoIso)} – ${fmtDate(now.toISOString())}`

  const db = createSupabaseDbClient()

  // ── 1. Membership requests ─────────────────────────────────────────────────
  const { data: membershipRequests = [], error: mrErr } = await db
    .from('membership_requests')
    .select('id, name, email, submitted_at, status')
    .gte('submitted_at', weekAgoIso)
    .order('submitted_at', { ascending: false })

  if (mrErr) console.error('[weekly-digest] membership_requests error:', mrErr)

  // ── 2. New bookings ────────────────────────────────────────────────────────
  const { data: bookings = [], error: bkErr } = await db
    .from('bookings')
    .select('booking_ref, status, created_at, start_date, end_date, sit_type')
    .gte('created_at', weekAgoIso)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (bkErr) console.error('[weekly-digest] bookings error:', bkErr)

  // ── 3. Contact messages (Sanity) ───────────────────────────────────────────
  let contactMessages = []
  try {
    const raw = await serverClient.fetch(
      `*[_type == "contactMessage" && defined(submittedAt) && dateTime(submittedAt) >= dateTime($since)]
       | order(submittedAt desc) {
         _id, name, email, submittedAt, status, message
       }`,
      { since: weekAgoIso }
    )
    contactMessages = raw.map(m => ({ ...m, preview: (m.message || '').slice(0, 90) }))
  } catch (e) {
    console.error('[weekly-digest] contactMessage query error:', e)
  }

  // ── 4. Adoption applications (Sanity) ─────────────────────────────────────
  let applications = []
  try {
    applications = await serverClient.fetch(
      `*[_type == "application" && dateTime(_createdAt) >= dateTime($since)]
       | order(_createdAt desc) {
         _id, applicantName, email, _createdAt, status
       }`,
      { since: weekAgoIso }
    )
  } catch (e) {
    console.error('[weekly-digest] application query error:', e)
  }

  const total = membershipRequests.length + bookings.length + contactMessages.length + applications.length

  // ── Build email body ───────────────────────────────────────────────────────

  const intro = `
    <p style="font-size:14px;line-height:1.8;color:#4A4A4A;margin:0 0 4px;">
      Here's a summary of activity on Purrfect Love for the week of <strong>${dateRange}</strong>.
    </p>
    <p style="font-size:14px;color:#4A4A4A;margin:0 0 4px;">
      <strong>${total}</strong> new item${total !== 1 ? 's' : ''} across all categories.
    </p>`

  // Membership requests section
  const mrSection = sectionHeader('Membership Requests', membershipRequests.length) +
    table(
      ['Name', 'Email', 'Submitted', 'Status'],
      membershipRequests.map(r => [
        r.name,
        `<a href="mailto:${r.email}" style="color:#C85C3F;text-decoration:none;">${r.email}</a>`,
        fmtDate(r.submitted_at),
        r.status,
      ])
    )

  // Bookings section
  const sitTypeLabel = t => t === 'home_visit' ? 'Home visit' : t === 'drop_off' ? 'Drop-off' : '—'
  const bkSection = sectionHeader('Booking Requests', bookings.length) +
    table(
      ['Ref', 'Type', 'Dates', 'Status', 'Requested'],
      bookings.map(b => [
        `<strong>${b.booking_ref}</strong>`,
        sitTypeLabel(b.sit_type),
        `${fmtDate(b.start_date)} – ${fmtDate(b.end_date)}`,
        b.status,
        fmtDate(b.created_at),
      ])
    )

  // Contact messages section
  const cmSection = sectionHeader('Contact Messages', contactMessages.length) +
    table(
      ['Name', 'Email', 'Received', 'Status', 'Preview'],
      contactMessages.map(m => [
        m.name,
        `<a href="mailto:${m.email}" style="color:#C85C3F;text-decoration:none;">${m.email}</a>`,
        fmtDate(m.submittedAt),
        m.status || '—',
        m.preview ? `<span style="color:#888;">${m.preview}${m.preview.length >= 90 ? '…' : ''}</span>` : '—',
      ])
    )

  // Adoption applications section
  const apSection = sectionHeader('Adoption Applications', applications.length) +
    table(
      ['Name', 'Email', 'Submitted', 'Status'],
      applications.map(a => [
        a.applicantName,
        `<a href="mailto:${a.email}" style="color:#C85C3F;text-decoration:none;">${a.email}</a>`,
        fmtDate(a._createdAt),
        a.status || '—',
      ])
    )

  const body = intro + mrSection + bkSection + cmSection + apSection

  // ── Send ───────────────────────────────────────────────────────────────────
  try {
    await resend.emails.send({
      from: 'Purrfect Love <no-reply@purrfectlove.org>',
      to: ['support@purrfectlove.org'],
      bcc: ['pranavkarnad@gmail.com'],
      subject: `Weekly Digest — ${dateRange}`,
      html: brandedEmail({ heading: 'Weekly Activity Digest', subheading: dateRange, body }),
    })
  } catch (e) {
    console.error('[weekly-digest] send error:', e)
    return Response.json({ error: 'Email send failed', detail: e.message }, { status: 500 })
  }

  console.log(`[weekly-digest] sent — ${total} items (mr:${membershipRequests.length} bk:${bookings.length} cm:${contactMessages.length} ap:${applications.length})`)

  return Response.json({
    success: true,
    period: dateRange,
    counts: {
      membershipRequests: membershipRequests.length,
      bookings: bookings.length,
      contactMessages: contactMessages.length,
      adoptionApplications: applications.length,
      total,
    },
  })
}
