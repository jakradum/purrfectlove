// Dev-only: renders weekly digest email variants with mock data.
// Visit /api/preview-digest?v=1  /api/preview-digest?v=2  /api/preview-digest?v=3

const MOCK = {
  dateRange: '26 Jun 2026 – 3 Jul 2026',
  membershipRequests: [
    { name: 'Priya Nair', email: 'priya.nair@gmail.com', submitted_at: '2026-06-28T10:14:00Z', status: 'pending' },
    { name: 'Arjun Mehta', email: 'arjun.mehta@gmail.com', submitted_at: '2026-07-01T08:45:00Z', status: 'pending' },
  ],
  bookings: [
    { booking_ref: 'Purr2301', sit_type: 'home_visit', start_date: '2026-07-10', end_date: '2026-07-13', status: 'confirmed', created_at: '2026-06-27T14:30:00Z' },
    { booking_ref: 'Purr2302', sit_type: 'drop_off',   start_date: '2026-07-05', end_date: '2026-07-06', status: 'pending',   created_at: '2026-06-29T09:10:00Z' },
    { booking_ref: 'Purr2303', sit_type: 'home_visit', start_date: '2026-07-18', end_date: '2026-07-22', status: 'cancelled', created_at: '2026-07-02T16:55:00Z' },
  ],
  contactMessages: [
    { name: 'Sunita Rao', email: 'sunita.rao@yahoo.com', submittedAt: '2026-06-30T11:20:00Z', status: 'open', preview: 'Hi, I saw your post about Mango and wanted to know if she is still available for adoption...' },
    { name: 'Vikram Singh', email: 'vikram.s@hotmail.com', submittedAt: '2026-07-02T07:35:00Z', status: 'open', preview: 'We lost our cat last month and are looking to adopt again. Can you tell me more about your process?' },
  ],
  applications: [
    { applicantName: 'Deepika Krishnan', email: 'deepika.k@gmail.com', _createdAt: '2026-07-01T13:00:00Z', status: 'evaluation' },
  ],
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const sitLabel = t => t === 'home_visit' ? 'Home visit' : t === 'drop_off' ? 'Drop-off' : '—'

const statusPill = (status, bg) => `<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;background:${bg};color:#fff;text-transform:uppercase;letter-spacing:0.04em;">${status}</span>`

const statusColour = s => ({ confirmed: '#2C5F4F', pending: '#C85C3F', cancelled: '#999', open: '#C85C3F', evaluation: '#7B5EA7', new: '#2C5F4F' }[s] || '#999')

// ─────────────────────────────────────────────────────────────
// VARIANT 1 — current style (green header, bordered tables)
// ─────────────────────────────────────────────────────────────
function v1() {
  const total = MOCK.membershipRequests.length + MOCK.bookings.length + MOCK.contactMessages.length + MOCK.applications.length

  const thS = 'font-family:"Trebuchet MS",sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#888;padding:8px 10px;border-bottom:2px solid #E8E4DC;text-align:left;white-space:nowrap;'
  const tdS = 'font-size:13px;color:#2D2D2D;padding:8px 10px;border-bottom:1px solid #F0EDE8;vertical-align:top;'

  function section(title, count, headers, rows) {
    const colour = count > 0 ? '#2C5F4F' : '#999'
    const hdr = `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 12px;"><tr><td style="border-left:4px solid ${colour};padding:4px 0 4px 12px;"><span style="font-family:'Trebuchet MS',sans-serif;font-size:15px;font-weight:700;color:${colour};">${title}</span><span style="font-size:13px;color:#999;margin-left:8px;">${count} this week</span></td></tr></table>`
    if (rows.length === 0) return hdr + `<p style="font-size:14px;color:#aaa;margin:0 0 8px;padding-left:4px;">Nothing to show.</p>`
    const ths = headers.map(h => `<th style="${thS}">${h}</th>`).join('')
    const trs = rows.map(r => `<tr>${r.map(c => `<td style="${tdS}">${c}</td>`).join('')}</tr>`).join('')
    return hdr + `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:8px;"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`
  }

  const body = `
    <p style="font-size:14px;line-height:1.8;color:#4A4A4A;margin:0 0 4px;">Week of <strong>${MOCK.dateRange}</strong> · <strong>${total}</strong> new items</p>
    ${section('Membership Requests', MOCK.membershipRequests.length,
      ['Name','Email','Submitted','Status'],
      MOCK.membershipRequests.map(r => [r.name, `<a href="mailto:${r.email}" style="color:#C85C3F;">${r.email}</a>`, fmtDate(r.submitted_at), r.status])
    )}
    ${section('Booking Requests', MOCK.bookings.length,
      ['Ref','Type','Dates','Status','Requested'],
      MOCK.bookings.map(b => [`<strong>${b.booking_ref}</strong>`, sitLabel(b.sit_type), `${fmtDate(b.start_date)} – ${fmtDate(b.end_date)}`, b.status, fmtDate(b.created_at)])
    )}
    ${section('Contact Messages', MOCK.contactMessages.length,
      ['Name','Email','Received','Status','Preview'],
      MOCK.contactMessages.map(m => [m.name, `<a href="mailto:${m.email}" style="color:#C85C3F;">${m.email}</a>`, fmtDate(m.submittedAt), m.status, `<span style="color:#888;">${m.preview}</span>`])
    )}
    ${section('Adoption Applications', MOCK.applications.length,
      ['Name','Email','Submitted','Status'],
      MOCK.applications.map(a => [a.applicantName, `<a href="mailto:${a.email}" style="color:#C85C3F;">${a.email}</a>`, fmtDate(a._createdAt), a.status])
    )}`

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;background:#FFF8F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;padding:40px 20px;"><tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
      <tr><td style="background:#2C5F4F;padding:28px 32px;text-align:center;">
        <p style="margin:0 0 4px;font-family:'Trebuchet MS',sans-serif;font-size:12px;color:rgba(246,244,240,0.6);letter-spacing:0.1em;text-transform:uppercase;">Purrfect Love</p>
        <h1 style="margin:0;font-family:'Trebuchet MS',sans-serif;font-size:22px;color:#F6F4F0;font-weight:700;">Weekly Activity Digest</h1>
      </td></tr>
      <tr><td style="padding:40px 32px;">${body}<p style="font-size:14px;color:#999;margin:32px 0 0;">– Purrfect Love automated digest</p></td></tr>
      <tr><td style="background:#F5F0E8;padding:20px 32px;text-align:center;border-top:1px solid #E8E4DC;">
        <p style="margin:0;font-size:13px;color:#6B6B6B;font-weight:600;">Purrfect Love · Cat Adoption &amp; Rescue</p>
        <p style="margin:4px 0 0;font-size:12px;color:#999;"><a href="https://purrfectlove.org" style="color:#C85C3F;text-decoration:none;">purrfectlove.org</a></p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`
}

// ─────────────────────────────────────────────────────────────
// VARIANT 2 — stat boxes up top, items as a clean list below
// ─────────────────────────────────────────────────────────────
function v2() {
  const counts = [
    { n: MOCK.membershipRequests.length, label: 'Membership\nRequests', icon: '🐾' },
    { n: MOCK.bookings.length,           label: 'Booking\nRequests',    icon: '📅' },
    { n: MOCK.contactMessages.length,    label: 'Contact\nMessages',    icon: '💬' },
    { n: MOCK.applications.length,       label: 'Adoption\nApplications', icon: '🐱' },
  ]

  const statBox = ({ n, label, icon }) => `
    <td width="25%" style="padding:4px;">
      <div style="background:#F5FAF7;border:1px solid #D0E8DC;border-radius:10px;padding:16px 10px;text-align:center;">
        <div style="font-size:22px;margin-bottom:4px;">${icon}</div>
        <div style="font-family:'Trebuchet MS',sans-serif;font-size:28px;font-weight:700;color:#2C5F4F;line-height:1;">${n}</div>
        <div style="font-size:11px;color:#6B9E88;margin-top:5px;line-height:1.4;white-space:pre-line;">${label}</div>
      </div>
    </td>`

  const rowS = 'padding:10px 0;border-bottom:1px solid #F0EDE8;'
  const labelS = 'font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;'
  const nameS = 'font-size:14px;font-weight:700;color:#2D2D2D;'
  const metaS = 'font-size:12px;color:#888;margin-top:2px;'

  function listSection(title, items, renderItem) {
    if (items.length === 0) return `
      <div style="margin:24px 0 0;">
        <p style="font-family:'Trebuchet MS',sans-serif;font-size:13px;font-weight:700;color:#2C5F4F;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 8px;">${title}</p>
        <p style="font-size:13px;color:#aaa;margin:0;">Nothing this week.</p>
      </div>`
    return `
      <div style="margin:24px 0 0;">
        <p style="font-family:'Trebuchet MS',sans-serif;font-size:13px;font-weight:700;color:#2C5F4F;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #2C5F4F;padding-bottom:6px;margin:0 0 0;">${title}</p>
        ${items.map(renderItem).join('')}
      </div>`
  }

  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>${counts.map(statBox).join('')}</tr>
    </table>
    <p style="font-size:13px;color:#888;margin:0 0 4px;">Week of <strong style="color:#4A4A4A;">${MOCK.dateRange}</strong></p>

    ${listSection('Membership Requests', MOCK.membershipRequests, r => `
      <div style="${rowS}">
        <div style="${nameS}">${r.name}</div>
        <div style="${metaS}"><a href="mailto:${r.email}" style="color:#C85C3F;text-decoration:none;">${r.email}</a> &nbsp;·&nbsp; ${fmtDate(r.submitted_at)} &nbsp;·&nbsp; ${statusPill(r.status, statusColour(r.status))}</div>
      </div>`)}

    ${listSection('Booking Requests', MOCK.bookings, b => `
      <div style="${rowS}">
        <div style="${nameS}">${b.booking_ref} &nbsp;<span style="font-weight:400;color:#888;font-size:13px;">${sitLabel(b.sit_type)}</span></div>
        <div style="${metaS}">${fmtDate(b.start_date)} – ${fmtDate(b.end_date)} &nbsp;·&nbsp; Requested ${fmtDate(b.created_at)} &nbsp;·&nbsp; ${statusPill(b.status, statusColour(b.status))}</div>
      </div>`)}

    ${listSection('Contact Messages', MOCK.contactMessages, m => `
      <div style="${rowS}">
        <div style="${nameS}">${m.name} &nbsp;<span style="font-weight:400;font-size:13px;color:#888;">&lt;${m.email}&gt;</span></div>
        <div style="${metaS}">${fmtDate(m.submittedAt)} &nbsp;·&nbsp; ${statusPill(m.status, statusColour(m.status))}</div>
        <div style="font-size:13px;color:#666;margin-top:4px;font-style:italic;">"${m.preview}"</div>
      </div>`)}

    ${listSection('Adoption Applications', MOCK.applications, a => `
      <div style="${rowS}">
        <div style="${nameS}">${a.applicantName}</div>
        <div style="${metaS}"><a href="mailto:${a.email}" style="color:#C85C3F;text-decoration:none;">${a.email}</a> &nbsp;·&nbsp; ${fmtDate(a._createdAt)} &nbsp;·&nbsp; ${statusPill(a.status, statusColour(a.status))}</div>
      </div>`)}`

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;background:#FFF8F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;padding:40px 20px;"><tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
      <tr><td style="background:#2C5F4F;padding:24px 32px;">
        <table width="100%"><tr>
          <td><h1 style="margin:0;font-family:'Trebuchet MS',sans-serif;font-size:20px;color:#F6F4F0;font-weight:700;">Purrfect Love</h1>
            <p style="margin:2px 0 0;font-size:13px;color:rgba(246,244,240,0.65);">Weekly Activity Digest</p></td>
          <td style="text-align:right;font-family:'Trebuchet MS',sans-serif;font-size:12px;color:rgba(246,244,240,0.5);">${MOCK.dateRange}</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:32px 32px 40px;">${body}<p style="font-size:13px;color:#bbb;margin:28px 0 0;">Automated weekly digest · Purrfect Love</p></td></tr>
      <tr><td style="background:#F5F0E8;padding:16px 32px;text-align:center;border-top:1px solid #E8E4DC;">
        <p style="margin:0;font-size:12px;color:#999;"><a href="https://purrfectlove.org" style="color:#C85C3F;text-decoration:none;">purrfectlove.org</a></p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`
}

// ─────────────────────────────────────────────────────────────
// VARIANT 3 — minimal, no heavy header, newsletter feel
// ─────────────────────────────────────────────────────────────
function v3() {
  const total = MOCK.membershipRequests.length + MOCK.bookings.length + MOCK.contactMessages.length + MOCK.applications.length

  const categories = [
    {
      title: 'Membership Requests',
      count: MOCK.membershipRequests.length,
      items: MOCK.membershipRequests.map(r => ({
        primary: r.name,
        secondary: r.email,
        meta: fmtDate(r.submitted_at),
        status: r.status,
        note: null,
      })),
    },
    {
      title: 'Booking Requests',
      count: MOCK.bookings.length,
      items: MOCK.bookings.map(b => ({
        primary: b.booking_ref,
        secondary: `${sitLabel(b.sit_type)} · ${fmtDate(b.start_date)} – ${fmtDate(b.end_date)}`,
        meta: `Requested ${fmtDate(b.created_at)}`,
        status: b.status,
        note: null,
      })),
    },
    {
      title: 'Contact Messages',
      count: MOCK.contactMessages.length,
      items: MOCK.contactMessages.map(m => ({
        primary: m.name,
        secondary: m.email,
        meta: fmtDate(m.submittedAt),
        status: m.status,
        note: m.preview,
      })),
    },
    {
      title: 'Adoption Applications',
      count: MOCK.applications.length,
      items: MOCK.applications.map(a => ({
        primary: a.applicantName,
        secondary: a.email,
        meta: fmtDate(a._createdAt),
        status: a.status,
        note: null,
      })),
    },
  ]

  const categorySections = categories.map(cat => {
    const dot = cat.count > 0 ? '#2C5F4F' : '#ccc'
    const rows = cat.items.length === 0
      ? `<p style="font-size:13px;color:#bbb;margin:8px 0 0;">Nothing this week.</p>`
      : cat.items.map(item => `
        <div style="display:flex;justify-content:space-between;align-items:baseline;padding:9px 0;border-bottom:1px solid #F5F2EE;">
          <div style="flex:1;min-width:0;">
            <span style="font-size:14px;font-weight:700;color:#2D2D2D;">${item.primary}</span>
            <span style="font-size:13px;color:#888;margin-left:8px;">${item.secondary}</span>
            ${item.note ? `<div style="font-size:12px;color:#aaa;margin-top:3px;font-style:italic;">${item.note}</div>` : ''}
          </div>
          <div style="text-align:right;margin-left:16px;flex-shrink:0;">
            <div style="font-size:12px;color:#aaa;">${item.meta}</div>
            <div style="margin-top:3px;">${statusPill(item.status, statusColour(item.status))}</div>
          </div>
        </div>`).join('')

    return `
      <div style="margin:0 0 28px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="padding:0 0 10px;border-bottom:2px solid #F0EDE8;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dot};margin-right:8px;vertical-align:middle;"></span>
            <span style="font-family:'Trebuchet MS',sans-serif;font-size:13px;font-weight:700;color:#2D2D2D;text-transform:uppercase;letter-spacing:0.07em;vertical-align:middle;">${cat.title}</span>
            <span style="font-size:12px;color:#bbb;margin-left:6px;vertical-align:middle;">${cat.count}</span>
          </td>
        </tr></table>
        ${rows}
      </div>`
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;background:#F8F6F2;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F6F2;padding:40px 20px;"><tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

      <!-- minimal top bar -->
      <tr><td style="background:#fff;padding:28px 36px 20px;border-bottom:3px solid #2C5F4F;">
        <table width="100%"><tr>
          <td>
            <p style="margin:0;font-family:'Trebuchet MS',sans-serif;font-size:17px;font-weight:700;color:#2C5F4F;">Purrfect Love</p>
            <p style="margin:3px 0 0;font-size:13px;color:#aaa;">Weekly digest · ${MOCK.dateRange}</p>
          </td>
          <td style="text-align:right;">
            <div style="display:inline-block;background:#F5FAF7;border:1px solid #C8E2D4;border-radius:6px;padding:6px 14px;text-align:center;">
              <div style="font-family:'Trebuchet MS',sans-serif;font-size:22px;font-weight:700;color:#2C5F4F;line-height:1;">${total}</div>
              <div style="font-size:10px;color:#6B9E88;text-transform:uppercase;letter-spacing:0.06em;margin-top:1px;">new items</div>
            </div>
          </td>
        </tr></table>
      </td></tr>

      <!-- body -->
      <tr><td style="padding:28px 36px 36px;">
        ${categorySections}
        <p style="font-size:12px;color:#ccc;margin:8px 0 0;">Automated weekly digest</p>
      </td></tr>

    </table>
  </td></tr></table>
</body></html>`
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const v = searchParams.get('v') || '1'
  const html = v === '2' ? v2() : v === '3' ? v3() : v1()
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
