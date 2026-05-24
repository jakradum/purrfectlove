// One-off script: send Gabby Love's German adoption contract to Björn Veit
// Run with: npx tsx scripts/sendGabbyContractDE.tsx

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import { Resend } from 'resend'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'

// @ts-ignore — JSX component
import { AdoptionContractPDF_DE } from '../src/lib/adoptionContractPDF_DE.jsx'

const BJORN_APP_ID = 'hXBlQR9dKV67XAMKCqNz9F'
const GABBY_CAT_ID = 'd458c5f4-de8c-4ab1-9757-7d45f41d048b'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const urlBuilder = imageUrlBuilder(sanity)
const resend = new Resend(process.env.RESEND_API_KEY!)

const AGE_LABELS: Record<string, string> = {
  kitten: 'Kitten (0–6 months)',
  young: 'Young (6 months – 2 years)',
  adult: 'Adult (2–7 years)',
  senior: 'Senior (7+ years)',
}

async function run() {
  console.log('Fetching Björn application and Gabby cat data...')

  const [application, cat] = await Promise.all([
    sanity.fetch(
      `*[_type == "application" && _id == $id][0]{
        applicationId, applicantName, email, phone, address
      }`,
      { id: BJORN_APP_ID }
    ),
    sanity.fetch(
      `*[_type == "cat" && _id == $id][0]{
        name, age, ageMonths, gender, "photoAsset": photos[0].asset
      }`,
      { id: GABBY_CAT_ID }
    ),
  ])

  if (!application) throw new Error(`Application ${BJORN_APP_ID} not found`)
  if (!cat) throw new Error(`Cat ${GABBY_CAT_ID} not found`)

  console.log(`Application: ${application.applicantName} <${application.email}> #${application.applicationId}`)
  console.log(`Cat: ${cat.name} (${cat.age}, ${cat.gender})`)

  let catPhotoUrl: string | null = null
  if (cat.photoAsset?._ref) {
    catPhotoUrl = urlBuilder.image({ asset: cat.photoAsset }).width(400).height(400).fit('crop').url()
    console.log('Cat photo URL:', catPhotoUrl)
  }

  let catAge: string | null = AGE_LABELS[cat.age] || null
  if (cat.ageMonths) {
    catAge = `${cat.ageMonths} Monat${cat.ageMonths === 1 ? '' : 'e'} (${AGE_LABELS[cat.age] || cat.age})`
  }

  const logoPath = path.join(process.cwd(), 'public', 'logo.png')
  const logoDataUrl = fs.existsSync(logoPath)
    ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
    : null

  const date = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })

  console.log('Generating PDF...')
  const pdfBuffer = await renderToBuffer(
    createElement(AdoptionContractPDF_DE, {
      applicantName: application.applicantName,
      applicantEmail: application.email,
      applicantPhone: application.phone || '',
      applicantAddress: application.address || '',
      catName: cat.name,
      applicationId: application.applicationId,
      date,
      catPhotoUrl,
      logoDataUrl,
      catAge,
      catGender: cat.gender,
    })
  )
  console.log(`PDF generated: ${pdfBuffer.byteLength} bytes`)

  const colors = {
    hunterGreen: '#2C5F4F',
    tabbyBrown: '#C85C3F',
    whiskerCream: '#F6F4F0',
    textDark: '#2A2A2A',
    textLight: '#6B6B6B',
  }

  const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, serif; background-color: ${colors.whiskerCream}; color: ${colors.textDark};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.whiskerCream}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color: ${colors.hunterGreen}; padding: 32px; text-align: center;">
              <h1 style="margin: 0; font-family: sans-serif; font-size: 28px; color: ${colors.whiskerCream}; font-weight: 700;">Purrfect Love</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: ${colors.whiskerCream}; opacity: 0.85;">Adoptionsvereinbarung</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; line-height: 1.5;">Hallo ${application.applicantName},</p>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7;">
                Ihre Adoptionsbewerbung wurde geprüft. Wir freuen uns sehr, dass <strong>${cat.name}</strong> bei Ihnen einzieht! 🐱
              </p>
              <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.7; color: ${colors.textLight};">
                Im Anhang finden Sie Ihre Adoptionsvereinbarung. Bitte lesen Sie diese sorgfältig durch, unterschreiben Sie beide Exemplare und schicken Sie uns eines zurück an
                <a href="mailto:support@purrfectlove.org" style="color: ${colors.tabbyBrown}; text-decoration: none;">support@purrfectlove.org</a>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td style="background-color: ${colors.whiskerCream}; border-left: 4px solid ${colors.hunterGreen}; border-radius: 8px; padding: 18px 20px;">
                    <p style="margin: 0 0 6px 0; font-size: 13px; color: ${colors.textLight}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Ihre Adoptionsdetails</p>
                    <p style="margin: 0 0 4px 0; font-size: 15px;"><strong>Katze:</strong> ${cat.name}</p>
                    <p style="margin: 0 0 4px 0; font-size: 15px;"><strong>Bewerbungs-ID:</strong> #${application.applicationId}</p>
                    <p style="margin: 0; font-size: 15px;"><strong>Datum:</strong> ${date}</p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${colors.textLight};">
                Bei Fragen antworten Sie einfach auf diese E-Mail oder schreiben Sie uns an
                <a href="mailto:support@purrfectlove.org" style="color: ${colors.tabbyBrown}; text-decoration: none;">support@purrfectlove.org</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: ${colors.whiskerCream}; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: ${colors.textLight};">Bangalore • Stuttgart</p>
              <p style="margin: 0; font-size: 13px; color: ${colors.textLight};">Mit 🧡 für Katzen und Katzenliebhaber</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  console.log(`Sending to ${application.email}...`)
  const { data, error } = await resend.emails.send({
    from: 'Purrfect Love <support@purrfectlove.org>',
    replyTo: 'support@purrfectlove.org',
    to: [application.email],
    subject: `Ihre Adoptionsvereinbarung für ${cat.name} – Purrfect Love`,
    html: emailHtml,
    text: `Hallo ${application.applicantName},\n\nIhre Adoptionsbewerbung wurde geprüft. Wir freuen uns sehr, dass ${cat.name} bei Ihnen einzieht!\n\nIm Anhang finden Sie Ihre Adoptionsvereinbarung.\n\nKatze: ${cat.name}\nBewerbungs-ID: #${application.applicationId}\nDatum: ${date}\n\n— Purrfect Love`,
    attachments: [{ filename: `Adoptionsvereinbarung_${application.applicationId}.pdf`, content: pdfBuffer }],
  })

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)

  console.log('Email sent! ID:', data?.id)

  // Patch Gabby's cat record with contractSentAt + contractLanguage
  await sanity.patch(GABBY_CAT_ID).set({ contractSentAt: new Date().toISOString(), contractLanguage: 'de' }).commit()
  console.log('Sanity patched: contractSentAt + contractLanguage on Gabby')
}

run().catch(err => { console.error(err); process.exit(1) })
