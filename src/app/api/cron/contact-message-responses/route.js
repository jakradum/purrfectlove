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

// ─── Classification ───────────────────────────────────────────────────────────
// Returns: 'surrender' | 'stray' | 'adoption' | null

async function classify(name, message) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You classify contact form messages for a cat rescue organisation. Respond with JSON only: { "type": "surrender" | "stray" | "adoption" | "other" }'
        },
        {
          role: 'user',
          content: `Classify this message into one of four categories:
- "surrender": the person owns a cat and wants to give it up, rehome it, or find it an adoptive/foster home
- "stray": the person has found a stray, abandoned, or feral cat/kitten, or is dealing with an unexpected litter or emergency foster situation
- "adoption": the person wants to adopt a cat FROM Purrfect Love — they express interest in adopting (even vaguely, e.g. "I'd like to adopt a cat"), ask about a specific listed cat, ask about the adoption process or requirements, or ask what cats are available. Important: "I want to find my cat a home" or "I need someone to adopt my cat" = surrender, not adoption. Only use "adoption" when the person clearly wants to take a cat home FROM us.
- "other": anything else (catio/product inquiries, general questions, partnership requests, media, feedback, etc.)

Name: ${name}
Message: ${message}`
        }
      ],
      temperature: 0,
      max_tokens: 30,
    }),
  })

  if (!response.ok) return null

  try {
    const data = await response.json()
    let text = data.choices[0]?.message?.content?.trim()
    if (text.startsWith('```')) text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(text)
    if (parsed.type === 'surrender' || parsed.type === 'stray' || parsed.type === 'adoption') return parsed.type
    return null
  } catch {
    return null
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────

const LINKS_HTML = `
  <ul style="font-size:15px;line-height:1.9;color:#4A4A4A;padding-left:20px;margin:0 0 24px;">
    <li><a href="https://www.purrfectlove.org/guides/blog/what-makes-a-furrever-home" style="color:#C85C3F;text-decoration:none;">What Makes a Furrever Home</a></li>
    <li><a href="https://www.purrfectlove.org/guides/blog/message-for-foster-moms-what-to-focus-on-when-recruiting-an-adopter" style="color:#C85C3F;text-decoration:none;">How to Find the Right Adopter</a></li>
    <li><a href="https://www.purrfectlove.org/guides/blog/why-responsible-rescuers-neuter-before-adoption-a-long-term-commitment-to-welfare" style="color:#C85C3F;text-decoration:none;">Why Responsible Rescuers Neuter Before Adoption</a></li>
  </ul>`

const LINKS_TEXT = `- What Makes a Furrever Home: https://www.purrfectlove.org/guides/blog/what-makes-a-furrever-home
- How to Find the Right Adopter: https://www.purrfectlove.org/guides/blog/message-for-foster-moms-what-to-focus-on-when-recruiting-an-adopter
- Why Responsible Rescuers Neuter Before Adoption: https://www.purrfectlove.org/guides/blog/why-responsible-rescuers-neuter-before-adoption-a-long-term-commitment-to-welfare`

function buildAdoptionEmail(name, originalMessage) {
  const quotedMessage = originalMessage.split('\n').map(l => `> ${l}`).join('\n')
  const safeMessage = originalMessage.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const plainText = `Hi ${name},

Thank you for reaching out — it's wonderful to hear you're thinking about adopting.

All our cats available for adoption are listed on our website. You can browse them and submit an application directly from each cat's profile page.

Browse cats available for adoption: https://www.purrfectlove.org/adopt

We review every application carefully. If your application looks like a good fit, a member of our team will reach out to take things further.

With love,
The Purrfect Love Team

---
Please do not reply to this email. This mailbox is not monitored.

Your original message:
${quotedMessage}`

  const html = `<!DOCTYPE html>
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
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">Hi ${name},</p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">Thank you for reaching out — it's wonderful to hear you're thinking about adopting.</p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 24px;">All our cats available for adoption are listed on our website. You can browse them and submit an application directly from each cat's profile page.</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td style="background:#2C5F4F;border-radius:8px;padding:13px 28px;">
                  <a href="https://www.purrfectlove.org/adopt" style="color:#F6F4F0;text-decoration:none;font-family:'Trebuchet MS',sans-serif;font-size:15px;font-weight:700;">Browse cats available for adoption →</a>
                </td>
              </tr>
            </table>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">We review every application carefully. If your application looks like a good fit, a member of our team will reach out to take things further.</p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0;">With love,<br>The Purrfect Love Team</p>
          </td>
        </tr>
        <tr>
          <td style="background:#F5F0E8;padding:20px 32px;text-align:center;border-top:1px solid #E8E4DC;">
            <p style="margin:0;font-size:12px;color:#aaa;">Please do not reply to this email. This mailbox is not monitored.</p>
            <p style="margin:8px 0 0;font-size:13px;color:#6B6B6B;font-weight:600;">Purrfect Love · Cat Adoption &amp; Rescue</p>
            <p style="margin:4px 0 0;font-size:12px;color:#999;">
              <a href="https://purrfectlove.org" style="color:#C85C3F;text-decoration:none;">purrfectlove.org</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #E8E4DC;background:#FAFAFA;">
            <p style="margin:0 0 8px;font-size:11px;font-family:'Trebuchet MS',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#aaa;">Your original message</p>
            <p style="margin:0;font-size:13px;line-height:1.7;color:#888;white-space:pre-wrap;">${safeMessage}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { html, plainText }
}

function buildEmail(name, type, originalMessage) {
  const isSurrender = type === 'surrender'

  const opening = isSurrender
    ? `Thank you for reaching out to Purrfect Love. We really appreciate you caring enough to find your cat a good home rather than just letting things be.`
    : `Thank you for reaching out to Purrfect Love. It means a lot that you stopped to help rather than walk away.`

  const quotedMessage = originalMessage.split('\n').map(l => `> ${l}`).join('\n')

  const plainText = `Hi ${name},

${opening}

We want to be upfront with you: our team is deeply committed to the cats already in our care, and we're quite stretched at the moment. We aren't typically able to take in cats being surrendered or rehomed directly, and we wouldn't want to give you false hope. We've noted your message and will reach out if something changes on our end, though we can't make any guarantees.

In the meantime, here are some resources that might help you find a path forward on your own:

${LINKS_TEXT}

With love,
The Purrfect Love Team

---
Please do not reply to this email. This mailbox is not monitored.

Your original message:
${quotedMessage}`

  const safeMessage = originalMessage.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const html = `<!DOCTYPE html>
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
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">Hi ${name},</p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">${opening}</p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">We want to be upfront with you: our team is deeply committed to the cats already in our care, and we're quite stretched at the moment. We aren't typically able to take in cats being surrendered or rehomed directly, and we wouldn't want to give you false hope. We've noted your message and will reach out if something changes on our end, though we can't make any guarantees.</p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">In the meantime, here are some resources that might help you find a path forward on your own:</p>
            ${LINKS_HTML}
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0;">With love,<br>The Purrfect Love Team</p>
          </td>
        </tr>
        <tr>
          <td style="background:#F5F0E8;padding:20px 32px;text-align:center;border-top:1px solid #E8E4DC;">
            <p style="margin:0;font-size:12px;color:#aaa;">Please do not reply to this email. This mailbox is not monitored.</p>
            <p style="margin:8px 0 0;font-size:13px;color:#6B6B6B;font-weight:600;">Purrfect Love · Cat Adoption &amp; Rescue</p>
            <p style="margin:4px 0 0;font-size:12px;color:#999;">
              <a href="https://purrfectlove.org" style="color:#C85C3F;text-decoration:none;">purrfectlove.org</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #E8E4DC;background:#FAFAFA;">
            <p style="margin:0 0 8px;font-size:11px;font-family:'Trebuchet MS',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#aaa;">Your original message</p>
            <p style="margin:0;font-size:13px;line-height:1.7;color:#888;white-space:pre-wrap;">${safeMessage}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { html, plainText }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const messages = await serverClient.fetch(
      `*[_type == "contactMessage" && status == "open" && aiResponded != true] | order(submittedAt desc) {
        _id, name, email, message, submittedAt
      }`
    )

    console.log(`contact-message-responses: ${messages.length} unresponded open messages`)

    const batch = messages.slice(0, 10)

    // Classify all in parallel
    const classifications = await Promise.all(
      batch.map(msg => classify(msg.name, msg.message).catch(() => null))
    )

    const results = []

    for (let i = 0; i < batch.length; i++) {
      const msg = batch[i]
      const type = classifications[i]

      if (!type) {
        results.push({ _id: msg._id, name: msg.name, status: 'skipped' })
        continue
      }

      try {
        const { html, plainText } = type === 'adoption'
          ? buildAdoptionEmail(msg.name, msg.message)
          : buildEmail(msg.name, type, msg.message)

        const { error } = await resend.emails.send({
          from: 'Purrfect Love <no-reply@purrfectlove.org>',
          to: [msg.email],
          subject: 'Re: Your message to Purrfect Love',
          html,
          text: plainText,
        })

        if (error) {
          console.error(`Failed to send to ${msg.email}:`, error)
          results.push({ _id: msg._id, name: msg.name, status: 'email_failed', error: error.message })
          continue
        }

        await serverClient.patch(msg._id).set({
          aiResponded: true,
          aiRespondedAt: new Date().toISOString(),
          aiResponseText: plainText,
        }).commit()

        console.log(`Responded to ${msg.name} <${msg.email}> [${type}]`)
        results.push({ _id: msg._id, name: msg.name, type, status: 'responded' })

      } catch (err) {
        console.error(`Error processing ${msg._id}:`, err)
        results.push({ _id: msg._id, name: msg.name, status: 'error', error: err.message })
      }
    }

    const responded = results.filter(r => r.status === 'responded').length
    const skipped   = results.filter(r => r.status === 'skipped').length
    const failed    = results.filter(r => ['email_failed', 'error'].includes(r.status)).length

    return Response.json({ success: true, responded, skipped, failed, results })

  } catch (err) {
    console.error('contact-message-responses cron error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
