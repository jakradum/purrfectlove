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

async function isAdoptionRequest(name, message) {
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
          content: 'You classify contact form messages for a cat rescue organisation. Respond with JSON only: { "isAdoptionRequest": true/false }'
        },
        {
          role: 'user',
          content: `Classify this message. Return true if the person is asking the organisation to take in, foster, or help rehome a cat or kitten (including strays, surrenders, emergencies, or found animals). Return false for everything else (catio/product inquiries, general questions, partnership requests, etc.).

Name: ${name}
Message: ${message}`
        }
      ],
      temperature: 0,
      max_tokens: 30,
    }),
  })

  if (!response.ok) return false

  try {
    const data = await response.json()
    let text = data.choices[0]?.message?.content?.trim()
    if (text.startsWith('```')) text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(text)
    return parsed.isAdoptionRequest === true
  } catch {
    return false
  }
}

// ─── Email template ───────────────────────────────────────────────────────────

function buildEmail(name) {
  const plainText = `Hi ${name},

Thank you for reaching out to Purrfect Love. We really appreciate you caring enough to contact us.

We want to be upfront with you: our team is deeply committed to the cats already in our care, and we're quite stretched at the moment. We aren't typically able to take in cats being surrendered or rehomed directly, and we wouldn't want to give you false hope. We've noted your message and will reach out if something changes on our end, though we can't make any guarantees.

In the meantime, here are some resources that might help you find a path forward on your own:

- What Makes a Furrever Home: https://www.purrfectlove.org/guides/blog/what-makes-a-furrever-home
- How to Find the Right Adopter: https://www.purrfectlove.org/guides/blog/message-for-foster-moms-what-to-focus-on-when-recruiting-an-adopter
- Why Responsible Rescuers Neuter Before Adoption: https://www.purrfectlove.org/guides/blog/why-responsible-rescuers-neuter-before-adoption-a-long-term-commitment-to-welfare

With love,
The Purrfect Love Team`

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
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">Thank you for reaching out to Purrfect Love. We really appreciate you caring enough to contact us.</p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">We want to be upfront with you: our team is deeply committed to the cats already in our care, and we're quite stretched at the moment. We aren't typically able to take in cats being surrendered or rehomed directly, and we wouldn't want to give you false hope. We've noted your message and will reach out if something changes on our end, though we can't make any guarantees.</p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">In the meantime, here are some resources that might help you find a path forward on your own:</p>
            <ul style="font-size:15px;line-height:1.9;color:#4A4A4A;padding-left:20px;margin:0 0 24px;">
              <li><a href="https://www.purrfectlove.org/guides/blog/what-makes-a-furrever-home" style="color:#C85C3F;text-decoration:none;">What Makes a Furrever Home</a></li>
              <li><a href="https://www.purrfectlove.org/guides/blog/message-for-foster-moms-what-to-focus-on-when-recruiting-an-adopter" style="color:#C85C3F;text-decoration:none;">How to Find the Right Adopter</a></li>
              <li><a href="https://www.purrfectlove.org/guides/blog/why-responsible-rescuers-neuter-before-adoption-a-long-term-commitment-to-welfare" style="color:#C85C3F;text-decoration:none;">Why Responsible Rescuers Neuter Before Adoption</a></li>
            </ul>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0;">With love,<br>The Purrfect Love Team</p>
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

  return { html, plainText }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch open messages that haven't been AI-responded to yet
    const messages = await serverClient.fetch(
      `*[_type == "contactMessage" && status == "open" && aiResponded != true] | order(submittedAt desc) {
        _id, name, email, message, submittedAt
      }`
    )

    console.log(`contact-message-responses: ${messages.length} unresponded open messages`)

    const results = []

    for (const msg of messages) {
      try {
        const qualifies = await isAdoptionRequest(msg.name, msg.message)

        if (!qualifies) {
          results.push({ _id: msg._id, name: msg.name, status: 'skipped' })
          continue
        }

        const { html, plainText } = buildEmail(msg.name)

        const { error } = await resend.emails.send({
          from: 'Purrfect Love <support@purrfectlove.org>',
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

        console.log(`Responded to ${msg.name} <${msg.email}>`)
        results.push({ _id: msg._id, name: msg.name, status: 'responded' })

        // Small delay between sends
        await new Promise(r => setTimeout(r, 500))

      } catch (err) {
        console.error(`Error processing message ${msg._id}:`, err)
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
