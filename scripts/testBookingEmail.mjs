// scripts/testBookingEmail.mjs
// Usage: node --env-file=.env.local scripts/testBookingEmail.mjs
//
// Creates a test booking (status=pending) in Supabase and sends the
// branded booking-request notification email to the sitter.
// The booking is marked test_only so it can be cleaned up easily.

import { createClient as createSanityClient } from '@sanity/client'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const sanity = createSanityClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const resend = new Resend(process.env.RESEND_API_KEY)

const SITTER_ID  = '38ecbdca-4de8-4c38-bf78-5e9f470616a1' // pranavkarnad@gmail.com
const PARENT_ID  = 'AqajPoz2zfhysRWKE951hL'               // [TESTING] Rohan Sharma
const START_DATE = '2026-04-20'
const END_DATE   = '2026-04-24'
const CATS       = ['Luna', 'Mochi']
const MESSAGE    = 'Hi! I saw your profile and would love for you to look after my two girls while I travel. They are very friendly and low-maintenance.'
const BOOKING_REF = 'TestWhisker2004'

function formatDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
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

// Insert booking
const { data: booking, error: insertError } = await supabase
  .from('bookings')
  .insert({
    booking_ref: BOOKING_REF,
    sitter_id:   SITTER_ID,
    parent_id:   PARENT_ID,
    start_date:  START_DATE,
    end_date:    END_DATE,
    cats:        CATS,
    message:     MESSAGE,
    status:      'pending',
    created_at:  new Date().toISOString(),
  })
  .select('id')
  .single()

if (insertError) {
  console.error('Failed to insert booking:', insertError.message)
  process.exit(1)
}

const bookingId = booking.id
console.log(`✓ Booking created: id=${bookingId} ref=${BOOKING_REF}`)

// Fetch sitter
const sitter = await sanity.fetch(
  `*[_type == "catSitter" && _id == $id][0]{ name, email }`,
  { id: SITTER_ID }
)
const parent = await sanity.fetch(
  `*[_type == "catSitter" && _id == $id][0]{ name }`,
  { id: PARENT_ID }
)

const startFmt = formatDate(START_DATE)
const endFmt = formatDate(END_DATE)
const sitterFirstName = (sitter.name || '').split(' ')[0] || 'there'
const parentName = parent.name || 'A member'
const catList = CATS.join(', ')
const deepLink = `https://purrfectlove.org/care/bookings?booking=${bookingId}&role=sitter`

const { error: emailError } = await resend.emails.send({
  from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
  replyTo: 'support@purrfectlove.org',
  to: [sitter.email],
  subject: `New sit request #${BOOKING_REF}`,
  html: brandedEmail({
    heading: `New sit request from ${parentName} 🐾`,
    body: `
      <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">Hi ${sitterFirstName},</p>
      <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;"><strong>${parentName}</strong> has sent you a sit request. Here are the details:</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">
        <tr><td style="padding:5px 0;font-size:14px;color:#666;width:100px;">Dates</td><td style="padding:5px 0;font-size:14px;color:#2D2D2D;font-weight:600;">${startFmt} – ${endFmt}</td></tr>
        <tr><td style="padding:5px 0;font-size:14px;color:#666;">Cats</td><td style="padding:5px 0;font-size:14px;color:#2D2D2D;">${catList}</td></tr>
        <tr><td style="padding:5px 0;font-size:14px;color:#666;vertical-align:top;">Message</td><td style="padding:5px 0;font-size:14px;color:#2D2D2D;font-style:italic;">"${MESSAGE}"</td></tr>
        <tr><td style="padding:5px 0;font-size:14px;color:#666;">Booking ID</td><td style="padding:5px 0;font-size:14px;color:#2C5F4F;font-weight:700;">#${BOOKING_REF}</td></tr>
      </table>
      <p style="font-size:14px;color:#555;margin:0 0 8px;">Log in to accept or decline this request:</p>
      ${ctaButton({ label: 'View booking', url: deepLink })}
    `,
  }),
  text: `Hi ${sitterFirstName},\n\n${parentName} has sent you a sit request.\n\nDates: ${startFmt} – ${endFmt}\nCats: ${catList}\nMessage: "${MESSAGE}"\nBooking ID: #${BOOKING_REF}\n\nAccept or decline: ${deepLink}\n\n– The Purrfect Love Community`,
})

if (emailError) {
  console.error('Failed to send email:', emailError.message)
  process.exit(1)
}

console.log(`✓ Email sent to ${sitter.email}`)
console.log(`✓ Deep link: ${deepLink}`)
console.log(`\nTo clean up this test booking, run:`)
console.log(`  node --env-file=.env.local -e "import('@supabase/supabase-js').then(({createClient})=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY).from('bookings').delete().eq('id','${bookingId}').then(r=>console.log('deleted',r)))"`)
