import { createClient } from '@sanity/client'
import { Resend } from 'resend'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const resend = new Resend(process.env.RESEND_API_KEY)

const STUDIO_URL = 'https://www.purrfectlove.org/studio'
const DAY_MS = 24 * 60 * 60 * 1000

// Internal ops nudge levels — 20/40/60 days, same cadence for both tracks.
// Level 3 is the final one; nothing further fires after that until the
// application actually moves (or someone manually intervenes).
const LEVELS = [
  { level: 1, days: 20, tone: 'gentle' },
  { level: 2, days: 40, tone: 'direct' },
  { level: 3, days: 60, tone: 'urgent' },
]
const levelDays = Object.fromEntries(LEVELS.map(({ level, days }) => [level, days]))
const MAX_LEVEL = LEVELS[LEVELS.length - 1].level

function studioLink(id) {
  return `${STUDIO_URL}/structure/application;${id}`
}

// Per-item copy, keyed by level. Escalates from informational to urgent.
function itemLine({ track, level, days, name, studioUrl }) {
  const label = name || 'This applicant'
  const daysStr = Math.floor(days)

  const messages = {
    new: {
      1: `<strong>${label}</strong> has been sitting <strong>unassigned</strong> for ${daysStr} days. Please take a look when you can.`,
      2: `<strong>${label}</strong> is now <strong>${daysStr} days</strong> old with no movement, still unassigned. Please prioritize reviewing it this week.`,
      3: `<strong>${label}</strong> has been open for <strong>${daysStr} days</strong> without resolution. Please advance it to the next stage or close it with a rejection now — applicants shouldn't be left waiting this long.`,
    },
    evaluation: {
      1: `<strong>${label}</strong> has been in evaluation for ${daysStr} days. Please check in on where it stands.`,
      2: `<strong>${label}</strong> has been in evaluation for <strong>${daysStr} days</strong> with no closure. Please prioritize wrapping this one up.`,
      3: `<strong>${label}</strong> has been in evaluation for <strong>${daysStr} days</strong> without resolution. Please advance to adoption or close it with a rejection now.`,
    },
  }

  return `
    <li style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#2A2A2A;">
      ${messages[track][level]}
      <br/><a href="${studioUrl}" style="font-size:12.5px;color:#1A1A1A;font-weight:700;text-decoration:none;">Open in Studio →</a>
    </li>`
}

function brandedEmail({ heading, subheading, body }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#F4F4F4;color:#1A1A1A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F4F4;padding:32px 16px;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #DCDCDC;">
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
        <tr>
          <td style="padding:28px 32px;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #DCDCDC;background:#F9F9F9;">
            <p style="margin:0;font-size:11px;color:#999;">Automated application triage reminder · <a href="https://purrfectlove.org" style="color:#999;">purrfectlove.org</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization') || ''
  const expected = process.env.CRON_SECRET
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = Date.now()

    // One snapshot, one advance-at-most-one-level-per-run per application -
    // same reasoning as the adoption-feedback cron fix: re-querying live
    // between levels would let a badly-overdue application (or a long cron
    // outage) fire multiple levels back to back in one run.
    const [newApps, evalApps] = await Promise.all([
      serverClient.fetch(
        `*[_type == "application" && status == "new" && !defined(assignedTo)]{
          _id, applicantName, submittedAt, newStageReminderLevel
        }`
      ),
      serverClient.fetch(
        `*[_type == "application" && status == "evaluation" && defined(evaluationStartedAt)]{
          _id, applicantName, evaluationStartedAt, evaluationReminderLevel
        }`
      ),
    ])

    const dueNew = []
    const dueEval = []
    const patches = []

    for (const app of newApps) {
      const currentLevel = app.newStageReminderLevel ?? 0
      const nextLevel = currentLevel + 1
      if (nextLevel > MAX_LEVEL) continue
      const days = (now - new Date(app.submittedAt).getTime()) / DAY_MS
      if (days < levelDays[nextLevel]) continue

      dueNew.push({ id: app._id, name: app.applicantName, level: nextLevel, days })
      patches.push({
        id: app._id,
        set: { newStageReminderLevel: nextLevel, newStageLastReminderAt: new Date().toISOString() },
      })
    }

    for (const app of evalApps) {
      const currentLevel = app.evaluationReminderLevel ?? 0
      const nextLevel = currentLevel + 1
      if (nextLevel > MAX_LEVEL) continue
      const days = (now - new Date(app.evaluationStartedAt).getTime()) / DAY_MS
      if (days < levelDays[nextLevel]) continue

      dueEval.push({ id: app._id, name: app.applicantName, level: nextLevel, days })
      patches.push({
        id: app._id,
        set: { evaluationReminderLevel: nextLevel, evaluationLastReminderAt: new Date().toISOString() },
      })
    }

    const checked = newApps.length + evalApps.length
    const due = dueNew.length + dueEval.length

    if (due === 0) {
      return Response.json({ ok: true, checked, due: 0, sent: false })
    }

    const maxLevel = Math.max(...dueNew.map(d => d.level), ...dueEval.map(d => d.level))
    const subjectByLevel = {
      1: 'Applications awaiting closure',
      2: 'Follow-up: applications still awaiting closure',
      3: 'Urgent: applications overdue for closure',
    }
    const subheadingByLevel = {
      1: 'A quick heads-up on applications that need attention.',
      2: 'These have been open for a while now — please prioritize.',
      3: 'These are significantly overdue. Please resolve as soon as possible.',
    }

    let body = ''

    if (dueNew.length > 0) {
      body += `<h2 style="margin:0 0 12px;font-size:15px;color:#1A1A1A;font-family:Arial,Helvetica,sans-serif;">New & Unassigned</h2>`
      body += `<ul style="margin:0 0 24px;padding-left:20px;">`
      for (const item of dueNew) {
        body += itemLine({ track: 'new', level: item.level, days: item.days, name: item.name, studioUrl: studioLink(item.id) })
      }
      body += `</ul>`
    }

    if (dueEval.length > 0) {
      body += `<h2 style="margin:0 0 12px;font-size:15px;color:#1A1A1A;font-family:Arial,Helvetica,sans-serif;">In Evaluation</h2>`
      body += `<ul style="margin:0 0 0;padding-left:20px;">`
      for (const item of dueEval) {
        body += itemLine({ track: 'evaluation', level: item.level, days: item.days, name: item.name, studioUrl: studioLink(item.id) })
      }
      body += `</ul>`
    }

    const html = brandedEmail({
      heading: subjectByLevel[maxLevel],
      subheading: subheadingByLevel[maxLevel],
      body,
    })

    const { error: resendError } = await resend.emails.send({
      from: 'Purrfect Love <no-reply@purrfectlove.org>',
      to: ['support@purrfectlove.org'],
      subject: subjectByLevel[maxLevel],
      html,
    })

    if (resendError) {
      console.error('stale-applications: Resend error:', resendError)
      return Response.json({ ok: false, checked, due, sent: false, error: resendError.message }, { status: 500 })
    }

    // Only commit the level-advance patches after the email actually sent -
    // otherwise a failed send would silently mark items as reminded.
    try {
      await Promise.all(
        patches.map(({ id, set }) => serverClient.patch(id).set(set).commit())
      )
    } catch (patchError) {
      console.error('stale-applications: patch error after send:', patchError)
      return Response.json({ ok: true, checked, due, sent: true, patchError: patchError.message })
    }

    return Response.json({ ok: true, checked, due, sent: true })
  } catch (error) {
    console.error('cron/stale-applications error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
