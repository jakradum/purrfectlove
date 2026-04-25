// scripts/notifyVaccinationRecords.mjs
// One-time script to notify all verified members about the vaccination records requirement.
//
// Usage:
//   node --env-file=.env.local scripts/notifyVaccinationRecords.mjs --test-email pranavkarnad@gmail.com
//   node --env-file=.env.local scripts/notifyVaccinationRecords.mjs --dry-run
//   node --env-file=.env.local scripts/notifyVaccinationRecords.mjs

import { createClient } from '@sanity/client'
import { Resend } from 'resend'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const resend = new Resend(process.env.RESEND_API_KEY)

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const testEmailIdx = args.indexOf('--test-email')
const testEmail = testEmailIdx !== -1 ? args[testEmailIdx + 1] : null

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
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:24px 0 0;">– The Purrfect Love Team</p>
          </td>
        </tr>
        <tr>
          <td style="background:#F5F0E8;padding:20px 32px;text-align:center;border-top:1px solid #E8E4DC;">
            <p style="margin:0;font-size:13px;color:#6B6B6B;font-weight:600;">Purrfect Love · Cat Adoption &amp; Rescue</p>
            <p style="margin:4px 0 0;font-size:12px;color:#999;">
              <a href="https://purrfectlove.org" style="color:#C85C3F;text-decoration:none;">purrfectlove.org</a>
              &nbsp;·&nbsp;
              <a href="mailto:support@purrfectlove.org" style="color:#C85C3F;text-decoration:none;">support@purrfectlove.org</a>
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

function buildEmail(firstName) {
  const uploadUrl = 'https://care.purrfectlove.org/care/profile?edit=cat&catIndex=0&section=vaccination'
  const html = brandedEmail({
    heading: 'New on Purrfect Love — Vaccination records now required',
    body: `
      <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">Hi ${firstName},</p>
      <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">We've introduced a new requirement on the Purrfect Love Community portal: <strong>vaccination records are now required for each of your cats</strong> before you can request a sit.</p>
      <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">This helps sitters feel confident about the cats they're caring for, and keeps our community safe.</p>
      <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">Please upload your cat's vaccination records (JPEG, PNG, or PDF, max 1MB per file) at your earliest convenience.</p>
      ${ctaButton({ label: 'Upload vaccination records', url: uploadUrl })}
      <p style="font-size:14px;line-height:1.7;color:#888;margin:24px 0 0;text-align:center;">Questions? Reply to this email or message us on WhatsApp.</p>
    `,
  })
  const text = `Hi ${firstName},\n\nWe've introduced a new requirement on the Purrfect Love Community portal: vaccination records are now required for each of your cats before you can request a sit.\n\nThis helps sitters feel confident about the cats they're caring for, and keeps our community safe.\n\nPlease upload your cat's vaccination records (JPEG, PNG, or PDF, max 1MB per file) at your earliest convenience.\n\nUpload vaccination records: ${uploadUrl}\n\nQuestions? Reply to this email or message us on WhatsApp.\n\n– The Purrfect Love Team`
  return { html, text }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  console.log('Fetching verified members from Sanity…')
  const members = await sanity.fetch(
    `*[_type == "catSitter" && memberVerified == true]{ _id, name, email } | order(name asc)`
  )
  console.log(`Found ${members.length} verified members.\n`)

  if (testEmail) {
    // Test mode: send one email to the specified address using the first member's name
    const sample = members.find(m => m.email === testEmail) || members.find(m => m.email) || members[0]
    const firstName = (sample?.name || '').split(' ')[0] || 'there'
    console.log(`TEST MODE — sending to ${testEmail} (name: ${firstName})`)
    const { html, text } = buildEmail(firstName)
    const { error } = await resend.emails.send({
      from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
      to: [testEmail],
      subject: 'New on Purrfect Love — Vaccination records now required',
      html,
      text,
    })
    if (error) {
      console.error('Failed to send test email:', error)
      process.exit(1)
    }
    console.log(`✓ Test email sent to ${testEmail}`)
    return
  }

  let sent = 0
  let skipped = 0

  for (const member of members) {
    if (!member.email) {
      console.log(`  SKIP  ${member.name || member._id} — no email`)
      skipped++
      continue
    }

    const firstName = (member.name || '').split(' ')[0] || 'there'

    if (dryRun) {
      console.log(`  [dry-run] Would email: ${member.name} <${member.email}>`)
      sent++
      continue
    }

    const { html, text } = buildEmail(firstName)
    const { error } = await resend.emails.send({
      from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
      to: [member.email],
      subject: 'New on Purrfect Love — Vaccination records now required',
      html,
      text,
    })

    if (error) {
      console.error(`  ERROR ${member.name} <${member.email}>:`, error.message)
      skipped++
    } else {
      console.log(`  ✓ Sent to ${member.name} <${member.email}>`)
      sent++
    }

    await sleep(500)
  }

  console.log(`\nDone. Sent to ${sent} member${sent !== 1 ? 's' : ''}, skipped ${skipped} (no email or error).`)
}

main().catch(err => { console.error(err); process.exit(1) })
