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

// The date that falls ~16 hours from now (used to find sits starting "tomorrow")
function targetDate() {
  const d = new Date(Date.now() + 16 * 60 * 60 * 1000)
  return d.toISOString().split('T')[0]
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

    <!-- ENGLISH -->
    <div class="header">
      <h1>You have an upcoming sit on ${dateEN}</h1>
      <p>A few things to keep in mind</p>
    </div>
    <div class="body">
      <span class="lang-badge">English</span>

      <p>Hi,</p>
      <p>You have an upcoming sit on ${dateEN}. Here are a few things to help it go smoothly.</p>

      <div class="section-title">Before you arrive</div>

      <div class="tip">
        <div class="tip-dot"></div>
        <div class="tip-text"><strong>Ask about escape history.</strong> Find out if the cat has slipped out before and how it happened. Knowing past patterns helps you stay alert to the same ones.</div>
      </div>
      <div class="tip">
        <div class="tip-dot"></div>
        <div class="tip-text"><strong>Know the stress triggers.</strong> Stress can make cats bolt. Ask what unsettles this cat so you can avoid or manage those situations.</div>
      </div>
      <div class="tip">
        <div class="tip-dot"></div>
        <div class="tip-text"><strong>Ask what treats work best.</strong> High-value rewards can help coax a nervous or hiding cat back out. Good to know before you need them.</div>
      </div>
      <div class="tip">
        <div class="tip-dot"></div>
        <div class="tip-text"><strong>Confirm the cat is microchipped and has an ID tag.</strong> If they do slip out, up-to-date identification helps get them home quickly.</div>
      </div>

      <div class="section-title">During the sit</div>

      <div class="tip">
        <div class="tip-dot"></div>
        <div class="tip-text"><strong>Keep doors and windows closed or secured.</strong> Cats are quick and curious. Doorways and open windows are the most common escape points.</div>
      </div>
      <div class="tip">
        <div class="tip-dot"></div>
        <div class="tip-text"><strong>Be careful when people come and go.</strong> Doorbells and movement at the entrance can startle cats and create a window to escape.</div>
      </div>
      <div class="tip">
        <div class="tip-dot"></div>
        <div class="tip-text"><strong>Do not bring friends or guests to the home.</strong> The cat parent has trusted you with their space and their cat. Keep it that way.</div>
      </div>
      <div class="tip">
        <div class="tip-dot"></div>
        <div class="tip-text"><strong>Leave the home as you found it, or better.</strong> Tidy up before you leave and make sure everything is back in place.</div>
      </div>
      <div class="tip">
        <div class="tip-dot"></div>
        <div class="tip-text"><strong>Be aware that some homes have security cameras.</strong> These are typically in common areas. Conduct yourself accordingly.</div>
      </div>

      <hr class="divider">
      <p>If anything feels off during the sit, reach out to the cat parent directly or contact the Purrfect Love team.</p>
      <p>Have a great sit.</p>
      <p style="color: #2C5F4F; font-weight: 600;">The Purrfect Love Team</p>
    </div>

    <!-- GERMAN -->
    <div class="header" style="background: #1e4437;">
      <h1>Du hast einen bevorstehenden Sit am ${dateDE}</h1>
      <p>Ein paar Dinge, die du im Blick haben solltest</p>
    </div>
    <div class="body">
      <span class="lang-badge">Deutsch</span>

      <p>Hallo,</p>
      <p>Du hast einen bevorstehenden Sit am ${dateDE}. Hier sind ein paar Hinweise, damit alles gut läuft.</p>

      <div class="section-title">Vor deiner Ankunft</div>

      <div class="tip">
        <div class="tip-dot"></div>
        <div class="tip-text"><strong>Frag nach der Ausreissgeschichte.</strong> Finde heraus, ob die Katze schon einmal entwischt ist und wie es passiert ist. Wer die Muster kennt, kann besser aufpassen.</div>
      </div>
      <div class="tip">
        <div class="tip-dot"></div>
        <div class="tip-text"><strong>Kenne die Stressauslöser.</strong> Gestresste Katzen können schnell flüchten. Frag, was diese Katze verunsichert, damit du solche Situationen vermeiden oder besser einschätzen kannst.</div>
      </div>
      <div class="tip">
        <div class="tip-dot"></div>
        <div class="tip-text"><strong>Frag, welche Leckerlis am besten wirken.</strong> Wenn eine Katze sich versteckt oder ängstlich ist, helfen die richtigen Belohnungen dabei, sie wieder hervor zu locken. Gut, das vorher zu wissen.</div>
      </div>
      <div class="tip">
        <div class="tip-dot"></div>
        <div class="tip-text"><strong>Prüfe, ob die Katze gechipt ist und ein ID-Tag trägt.</strong> Falls sie doch entwischen sollte, helfen aktuelle Identifikationsdaten dabei, sie schnell nach Hause zu bringen.</div>
      </div>

      <div class="section-title">Während des Sits</div>

      <div class="tip">
        <div class="tip-dot"></div>
        <div class="tip-text"><strong>Halte Türen und Fenster geschlossen oder gesichert.</strong> Katzen sind schnell und neugierig. Türbereiche und offene Fenster sind die häufigsten Fluchtwege.</div>
      </div>
      <div class="tip">
        <div class="tip-dot"></div>
        <div class="tip-text"><strong>Sei vorsichtig, wenn jemand kommt oder geht.</strong> Klingeln und Bewegung am Eingang können Katzen erschrecken und einen Fluchtmoment erzeugen.</div>
      </div>
      <div class="tip">
        <div class="tip-dot"></div>
        <div class="tip-text"><strong>Bring keine Freunde oder Gäste in die Wohnung.</strong> Die Katzenpfleger haben dir ihr Zuhause und ihre Katze anvertraut. Bitte halte das so.</div>
      </div>
      <div class="tip">
        <div class="tip-dot"></div>
        <div class="tip-text"><strong>Hinterlasse die Wohnung so, wie du sie vorgefunden hast, oder besser.</strong> Räum auf, bevor du gehst, und achte darauf, dass alles an seinem Platz ist.</div>
      </div>
      <div class="tip">
        <div class="tip-dot"></div>
        <div class="tip-text"><strong>Bitte beachte, dass manche Wohnungen Sicherheitskameras haben.</strong> Diese befinden sich in der Regel in den Gemeinschaftsbereichen. Verhalte dich entsprechend.</div>
      </div>

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

export async function GET(request) {
  const authHeader = request.headers.get('authorization') || ''
  const expected = process.env.CRON_SECRET
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const date = targetDate()
    const db = createSupabaseDbClient()

    const { data: bookings } = await db
      .from('bookings')
      .select('id, booking_ref, start_date, sitter_id')
      .eq('status', 'confirmed')
      .eq('start_date', date)
      .is('pre_sit_reminder_sent_at', null)
      .is('deleted_at', null)

    if (!bookings || bookings.length === 0) {
      return Response.json({ ok: true, date, bookings: 0, sent: 0 })
    }

    const sitterIds = [...new Set(bookings.map(b => b.sitter_id))]
    const profiles = await serverClient.fetch(
      `*[_type == "catSitter" && _id in $ids]{ _id, name, email }`,
      { ids: sitterIds }
    )
    const profileMap = Object.fromEntries(profiles.map(p => [p._id, p]))

    let sent = 0
    const now = new Date().toISOString()

    for (const booking of bookings) {
      const sitter = profileMap[booking.sitter_id]
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

      sent++
    }

    return Response.json({ ok: true, date, bookings: bookings.length, sent })
  } catch (error) {
    console.error('care/cron/pre-sit-reminder error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
