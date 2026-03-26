import fs from 'fs'
import path from 'path'
import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import { Resend } from 'resend'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { AdoptionContractPDF } from '@/lib/adoptionContractPDF'

const resend = new Resend(process.env.RESEND_API_KEY)

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const urlBuilder = imageUrlBuilder(serverClient)

// Cached logo data URL (read once per cold start)
let _logoDataUrl = null
function getLogoDataUrl() {
  if (_logoDataUrl) return _logoDataUrl
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png')
    const logoBuffer = fs.readFileSync(logoPath)
    _logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`
  } catch {
    _logoDataUrl = null
  }
  return _logoDataUrl
}

const AGE_LABELS = {
  kitten: 'Kitten (0–6 months)',
  young: 'Young (6 months – 2 years)',
  adult: 'Adult (2–7 years)',
  senior: 'Senior (7+ years)',
}

export async function POST(request) {
  try {
    const { documentId } = await request.json()

    if (!documentId) {
      return Response.json({ error: 'Document ID required' }, { status: 400 })
    }

    const cleanId = documentId.replace(/^drafts\./, '')

    const application = await serverClient.fetch(
      `*[_type == "application" && (_id == $id || _id == $draftId)][0]{
        applicationId,
        applicantName,
        email,
        phone,
        address,
        submittedAt,
        isOpenToAnyCat,
        "cat": select(
          isOpenToAnyCat != true => cat->{
            name,
            age,
            ageMonths,
            gender,
            "photoAsset": photos[0].asset
          },
          defined(reassignToCat) => reassignToCat->{
            name,
            age,
            ageMonths,
            gender,
            "photoAsset": photos[0].asset
          },
          null
        )
      }`,
      { id: cleanId, draftId: `drafts.${cleanId}` }
    )

    if (!application) {
      return Response.json({ error: 'Application not found' }, { status: 404 })
    }

    if (!application.cat?.name) {
      return Response.json(
        { error: 'Cat not assigned to this application. For "open to any cat" applications, use "Redirect to New Cat" to assign one first.' },
        { status: 400 }
      )
    }

    const cat = application.cat
    const catName = cat.name

    // Build cat photo URL (400×400 crop from Sanity CDN)
    let catPhotoUrl = null
    if (cat.photoAsset?._ref) {
      catPhotoUrl = urlBuilder
        .image({ asset: cat.photoAsset })
        .width(400).height(400).fit('crop').url()
    }

    // Age label
    let catAge = AGE_LABELS[cat.age] || null
    if (cat.ageMonths) {
      catAge = `${cat.ageMonths} month${cat.ageMonths === 1 ? '' : 's'} (${AGE_LABELS[cat.age] || cat.age})`
    }

    const logoDataUrl = getLogoDataUrl()
    const date = new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      createElement(AdoptionContractPDF, {
        applicantName: application.applicantName,
        applicantEmail: application.email,
        applicantPhone: application.phone || '',
        applicantAddress: application.address || '',
        catName,
        applicationId: application.applicationId,
        date,
        catPhotoUrl,
        logoDataUrl,
        catAge,
        catGender: cat.gender,
      })
    )

    // Email HTML
    const colors = {
      hunterGreen: '#2C5F4F',
      tabbyBrown: '#C85C3F',
      whiskerCream: '#F6F4F0',
      textDark: '#2A2A2A',
      textLight: '#6B6B6B',
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Lora:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'Lora', Georgia, serif; background-color: ${colors.whiskerCream}; color: ${colors.textDark};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.whiskerCream}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color: ${colors.hunterGreen}; padding: 32px; text-align: center;">
              <h1 style="margin: 0; font-family: 'Outfit', 'Trebuchet MS', sans-serif; font-size: 28px; color: ${colors.whiskerCream}; font-weight: 700;">Purrfect Love</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: ${colors.whiskerCream}; opacity: 0.85; font-family: 'Lora', Georgia, serif;">Adoption Contract</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; line-height: 1.5; color: ${colors.textDark};">
                Hey ${application.applicantName},
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: ${colors.textDark};">
                Your adoption application has been reviewed. We're so excited you're taking <strong>${catName}</strong> home! 🐱
              </p>
              <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.7; color: ${colors.textLight};">
                Please find your adoption contract attached. Read through it carefully, sign both copies, and send one back to us at
                <a href="mailto:support@purrfectlove.org" style="color: ${colors.tabbyBrown}; text-decoration: none;">support@purrfectlove.org</a>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td style="background-color: ${colors.whiskerCream}; border-left: 4px solid ${colors.hunterGreen}; border-radius: 8px; padding: 18px 20px;">
                    <p style="margin: 0 0 6px 0; font-size: 13px; font-family: 'Outfit', sans-serif; color: ${colors.textLight}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Adoption Details</p>
                    <p style="margin: 0 0 4px 0; font-size: 15px; font-family: 'Outfit', sans-serif; color: ${colors.textDark};"><strong>Cat:</strong> ${catName}</p>
                    <p style="margin: 0 0 4px 0; font-size: 15px; font-family: 'Outfit', sans-serif; color: ${colors.textDark};"><strong>Application ID:</strong> #${application.applicationId}</p>
                    <p style="margin: 0; font-size: 15px; font-family: 'Outfit', sans-serif; color: ${colors.textDark};"><strong>Date:</strong> ${date}</p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${colors.textLight};">
                Have questions? Reply to this email or reach us at
                <a href="mailto:support@purrfectlove.org" style="color: ${colors.tabbyBrown}; text-decoration: none;">support@purrfectlove.org</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: ${colors.whiskerCream}; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; font-family: 'Outfit', sans-serif; color: ${colors.textLight};">Bangalore • Stuttgart</p>
              <p style="margin: 0; font-size: 13px; font-family: 'Lora', Georgia, serif; color: ${colors.textLight};">Made with 🧡 for cats and cat lovers</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    const { data, error } = await resend.emails.send({
      from: 'Purrfect Love <support@purrfectlove.org>',
      replyTo: 'support@purrfectlove.org',
      to: [application.email],
      subject: `Your Adoption Contract for ${catName} – Purrfect Love`,
      html: emailHtml,
      text: `Hey ${application.applicantName},\n\nYour adoption application has been reviewed. We're so excited you're taking ${catName} home!\n\nPlease find your adoption contract attached. Read through it, sign both copies, and send one back to support@purrfectlove.org.\n\nCat: ${catName}\nApplication ID: #${application.applicationId}\nDate: ${date}\n\n— Purrfect Love`,
      attachments: [
        {
          filename: `Adoption_Contract_${application.applicationId}.pdf`,
          content: pdfBuffer,
        },
      ],
    })

    if (error) {
      console.error('Resend error sending contract:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    // Record contractSentAt on the published document
    await serverClient
      .patch(cleanId)
      .set({ contractSentAt: new Date().toISOString() })
      .commit()
      .catch(err => console.error('Failed to update contractSentAt:', err))

    console.log('Adoption contract sent:', data?.id, 'to', application.email)
    return Response.json({ success: true, emailId: data?.id })

  } catch (err) {
    console.error('Error sending adoption contract:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
