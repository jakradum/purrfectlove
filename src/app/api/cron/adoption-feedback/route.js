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

// Reminder schedule: stage N fires `days` after adoptedAt, as long as the
// adopter still hasn't submitted feedback and was last on stage N-1 (or, for
// stage 1, has never been sent anything at all).
const STAGES = [
  { stage: 1, days: 30 },
  { stage: 2, days: 60 },
  { stage: 3, days: 120 },
  { stage: 4, days: 240 },
  { stage: 5, days: 365 },
]

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
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:24px 0 0;">The Purrfect Love Team</p>
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

// Per-stage subject/body copy, EN and DE. Stage 1 is the original 30-day ask;
// 2-4 are gentle nudges; 5 says explicitly that it's the last one.
const COPY = {
  1: {
    en: {
      subject: 'How has life with your cat been?',
      body: (catName) => `
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          It has been about a month since <strong>${catName}</strong> came home.
          We hope the two of you are settling in well.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          We would love to hear how the adoption has been for you.
          Your feedback helps us improve and support more cats and families.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          It only takes a few minutes.
        </p>`,
      closing: (catName) => `Thank you for giving <strong>${catName}</strong> a home.`,
    },
    de: {
      subject: 'Wie läuft es mit Ihrer Katze?',
      body: (catName) => `
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          Es ist nun etwa ein Monat vergangen, seit <strong>${catName}</strong> bei Ihnen eingezogen ist.
          Wir hoffen, dass Sie sich gut eingelebt haben.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          Wir würden uns sehr freuen, von Ihren Erfahrungen zu hören.
          Ihr Feedback hilft uns, noch mehr Katzen und Familien zu unterstützen.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          Es dauert nur wenige Minuten.
        </p>`,
      closing: (catName) => `Vielen Dank, dass Sie <strong>${catName}</strong> ein Zuhause gegeben haben.`,
    },
  },
  2: {
    en: {
      subject: (catName) => `A quick follow-up about ${catName}`,
      body: (catName) => `
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          We reached out about a month ago to hear how things are going with <strong>${catName}</strong>, but haven't heard back yet.
          No worries, life gets busy!
        </p>
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          If you have a few minutes, we'd still love to hear about your experience. It really helps us support future adopters and cats.
        </p>`,
      closing: (catName) => `Thank you again for giving <strong>${catName}</strong> a home.`,
    },
    de: {
      subject: (catName) => `Eine kurze Nachfrage zu ${catName}`,
      body: (catName) => `
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          Vor einigen Wochen haben wir uns bei Ihnen gemeldet, um zu erfahren, wie es mit <strong>${catName}</strong> läuft, aber wir haben noch nichts von Ihnen gehört.
          Kein Problem, das Leben ist manchmal einfach voll!
        </p>
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          Falls Sie ein paar Minuten Zeit haben, würden wir uns sehr über Ihr Feedback freuen. Es hilft uns, künftige Adoptionen und Katzen noch besser zu unterstützen.
        </p>`,
      closing: (catName) => `Vielen Dank, dass Sie <strong>${catName}</strong> ein Zuhause gegeben haben.`,
    },
  },
  3: {
    en: {
      subject: "How's your cat doing? We'd love to know",
      body: (catName) => `
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          It's been a few months since <strong>${catName}</strong> joined your family, and we still haven't heard how things are going.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          Your feedback, even just a couple of quick answers, makes a real difference in how we support adopters and match future cats with the right homes.
        </p>`,
      closing: (catName) => `We hope you and <strong>${catName}</strong> are doing wonderfully.`,
    },
    de: {
      subject: 'Wie geht es Ihrer Katze? Wir würden uns freuen, es zu erfahren',
      body: (catName) => `
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          Es sind nun einige Monate vergangen, seit <strong>${catName}</strong> bei Ihnen eingezogen ist, und wir haben noch nichts von Ihnen gehört.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          Ihr Feedback, auch nur ein paar kurze Antworten, hilft uns sehr dabei, Adoptierende zu unterstützen und künftige Katzen den passenden Zuhause zuzuordnen.
        </p>`,
      closing: (catName) => `Wir hoffen, dass es Ihnen und <strong>${catName}</strong> bestens geht.`,
    },
  },
  4: {
    en: {
      subject: (catName) => `We'd still love to hear about ${catName}`,
      body: (catName) => `
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          It's been a while since <strong>${catName}</strong> came home with you, and we'd still love to hear how the adoption has gone.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          If you can spare a few minutes, your feedback genuinely helps us improve the adoption experience for others.
        </p>`,
      closing: (catName) => `Thank you for the difference you've made in <strong>${catName}</strong>'s life.`,
    },
    de: {
      subject: (catName) => `Wir würden immer noch gerne von ${catName} hören`,
      body: (catName) => `
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          Es ist nun eine Weile her, seit <strong>${catName}</strong> bei Ihnen eingezogen ist, und wir würden immer noch gerne hören, wie die Adoption verlaufen ist.
        </p>
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          Falls Sie ein paar Minuten erübrigen können, hilft uns Ihr Feedback wirklich dabei, die Erfahrung für andere zu verbessern.
        </p>`,
      closing: (catName) => `Vielen Dank für den Unterschied, den Sie in <strong>${catName}</strong>'s Leben gemacht haben.`,
    },
  },
  5: {
    en: {
      subject: (catName) => `One year with ${catName}, a final note from us`,
      body: (catName) => `
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          It's been a full year since <strong>${catName}</strong> joined your home. Happy adoption anniversary!
        </p>
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          This is the last time we'll reach out about feedback, but the option to share your experience remains open any time you'd like.
        </p>`,
      closing: (catName) => `Thank you, always, for giving <strong>${catName}</strong> a loving home.`,
    },
    de: {
      subject: (catName) => `Ein Jahr mit ${catName}, eine letzte Nachricht von uns`,
      body: (catName) => `
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          Es ist nun ein ganzes Jahr her, seit <strong>${catName}</strong> bei Ihnen eingezogen ist. Herzlichen Glückwunsch zum Adoptionsjubiläum!
        </p>
        <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
          Dies ist die letzte Nachricht, die wir zu diesem Thema senden, aber die Möglichkeit, Ihr Feedback zu teilen, bleibt jederzeit offen.
        </p>`,
      closing: (catName) => `Vielen Dank, dass Sie <strong>${catName}</strong> ein liebevolles Zuhause gegeben haben.`,
    },
  },
}

function buildEmail({ stage, applicantName, catName, feedbackToken, locale }) {
  const url = `https://purrfectlove.org/adopt/feedback?token=${feedbackToken}`
  const isDE = locale === 'de'
  const lang = isDE ? 'de' : 'en'
  const copy = COPY[stage][lang]

  const subject = typeof copy.subject === 'function' ? copy.subject(catName) : copy.subject
  const heading = isDE ? `Hallo ${applicantName},` : `Hi ${applicantName},`
  const ctaLabel = isDE ? 'Feedback geben' : 'Share your feedback'

  const body = `
    ${copy.body(catName)}
    ${ctaButton({ label: ctaLabel, url })}
    <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:32px 0 0;">
      ${copy.closing(catName)}
    </p>
  `

  return { subject, html: brandedEmail({ heading, body }) }
}

const DAY_MS = 24 * 60 * 60 * 1000
const stageDays = Object.fromEntries(STAGES.map(({ stage, days }) => [stage, days]))
const MAX_STAGE = STAGES[STAGES.length - 1].stage

export async function GET(request) {
  const authHeader = request.headers.get('authorization') || ''
  const expected = process.env.CRON_SECRET
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Single snapshot of every adopted application that hasn't submitted
    // feedback yet. Each one advances AT MOST one stage per run, computed
    // from this snapshot - not by re-querying live mid-loop. Re-querying per
    // stage (the previous version of this cron) let an adopter who's crossed
    // several thresholds at once (e.g. a backdated adoptedAt, or a long cron
    // outage) get bumped through multiple stages - and multiple emails - in
    // a single run, since each stage's query would see the previous stage's
    // just-committed patch. Never send more than one reminder per run.
    const now = Date.now()

    const applications = await serverClient.fetch(
      `*[_type == "application" && status == "adopted" && feedbackToken != null && feedbackSubmittedAt == null]{
        _id, feedbackToken, feedbackLocale, applicantName, email, adoptedAt, feedbackSentAt, feedbackReminderStage,
        "catName": cat->name
      }`
    )

    let checked = 0
    let sent = 0
    const errors = []

    for (const app of applications) {
      const { _id, feedbackToken, feedbackLocale, applicantName, email, adoptedAt, feedbackSentAt, feedbackReminderStage } = app

      // Never sent anything -> next stage is 1. Otherwise, the next stage is
      // one past whatever was last sent (coalescing to 1 for pre-reminder-
      // system adopters who only ever got the original feedbackSentAt).
      const currentStage = feedbackSentAt ? (feedbackReminderStage ?? 1) : 0
      const nextStage = currentStage + 1
      if (nextStage > MAX_STAGE) continue // already had the final reminder

      const daysSinceAdoption = (now - new Date(adoptedAt).getTime()) / DAY_MS
      if (daysSinceAdoption < stageDays[nextStage]) continue // not due yet

      checked++

      if (!email) {
        console.warn(`adoption-feedback: skipping ${_id} (stage ${nextStage}), no email`)
        continue
      }

      const { subject, html } = buildEmail({
        stage: nextStage,
        applicantName: applicantName || 'there',
        catName: app.catName || 'your cat',
        feedbackToken,
        locale: feedbackLocale || 'en',
      })

      const { error: resendError } = await resend.emails.send({
        from: 'Purrfect Love <no-reply@purrfectlove.org>',
        to: [email],
        subject,
        html,
      })

      if (resendError) {
        console.error(`adoption-feedback: Resend error for ${_id} (stage ${nextStage}):`, resendError)
        errors.push({ id: _id, stage: nextStage, error: resendError.message })
        continue
      }

      try {
        const nowIso = new Date().toISOString()
        const patch = serverClient.patch(_id).set({ feedbackReminderStage: nextStage, feedbackLastReminderAt: nowIso })
        if (nextStage === 1) patch.set({ feedbackSentAt: nowIso })
        await patch.commit()
        sent++
      } catch (patchError) {
        console.error(`adoption-feedback: patch error for ${_id} (stage ${nextStage}):`, patchError)
        errors.push({ id: _id, stage: nextStage, error: patchError.message })
      }
    }

    return Response.json({ ok: true, checked, sent, errors: errors.length > 0 ? errors : undefined })
  } catch (error) {
    console.error('cron/adoption-feedback error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
