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

function brandedEmail({ heading, body }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;background-color:#FFF8F0;color:#2D2D2D;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#2C5F4F;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;font-family:'Trebuchet MS',sans-serif;font-size:24px;color:#F6F4F0;font-weight:700;">Purrfect Love</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;">
            <h2 style="margin:0 0 24px;font-size:18px;color:#2C5F4F;font-family:'Trebuchet MS',sans-serif;">${heading}</h2>
            ${body}
            <p style="font-size:14px;line-height:1.7;color:#999;margin:32px 0 0;">– Purrfect Love automated digest</p>
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

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function sectionHeader(title, count) {
  const colour = count > 0 ? '#2C5F4F' : '#999'
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 12px;">
      <tr>
        <td style="border-left:4px solid ${colour};padding:4px 0 4px 12px;">
          <span style="font-family:'Trebuchet MS',sans-serif;font-size:15px;font-weight:700;color:${colour};">${title}</span>
          <span style="font-size:13px;color:#999;margin-left:8px;">${count} this week</span>
        </td>
      </tr>
    </table>`
}

function table(headers, rows) {
  if (rows.length === 0) {
    return `<p style="font-size:14px;color:#aaa;margin:0 0 8px;padding-left:4px;">Nothing to show.</p>`
  }
  const thStyle = 'font-family:"Trebuchet MS",sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#888;padding:8px 10px;border-bottom:2px solid #E8E4DC;text-align:left;white-space:nowrap;'
  const tdStyle = 'font-size:13px;color:#2D2D2D;padding:8px 10px;border-bottom:1px solid #F0EDE8;vertical-align:top;'
  const ths = headers.map(h => `<th style="${thStyle}">${h}</th>`).join('')
  const trs = rows.map(cells =>
    `<tr>${cells.map(c => `<td style="${tdStyle}">${c ?? '—'}</td>`).join('')}</tr>`
  ).join('')
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:8px;">
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
      html: brandedEmail({ heading: 'Weekly Activity Digest', body }),
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
