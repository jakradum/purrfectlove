import { createClient } from '@sanity/client'
import { sendWelcomeEmail } from '@/lib/resend'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false
})

// Simple in-memory rate limiting
const submissions = new Map()

// Generate unique 4-character alphanumeric ID
async function generateUniqueId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars: I, O, 0, 1
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    let id = ''
    for (let i = 0; i < 4; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // Check if ID already exists
    const existing = await serverClient.fetch(
      `*[_type == "application" && applicationId == $id][0]`,
      { id }
    )

    if (!existing) {
      return id
    }
    attempts++
  }

  // Fallback: use timestamp-based ID if random fails
  return Date.now().toString(36).slice(-4).toUpperCase()
}

export async function POST(request) {
  try {
    const body = await request.json()
    console.log('Received submission for cat:', body.catId || 'Any Cat')
    console.log('Turnstile token present:', !!body.turnstileToken)
    console.log('Is open to any cat:', body.isOpenToAnyCat || false)

    // 1. HONEYPOT CHECK
    if (body.website) {
      console.log('Honeypot triggered - spam detected')
      return Response.json({ error: 'Invalid submission' }, { status: 400 })
    }
    
    // 2. RATE LIMITING (5 minutes per IP)
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const lastSubmission = submissions.get(ip)
    
    if (lastSubmission && now - lastSubmission < 300000) {
      return Response.json(
        { error: 'Please wait 5 minutes before submitting another application' },
        { status: 429 }
      )
    }
    
    // 3. TURNSTILE VERIFICATION
    if (!body.turnstileToken) {
      return Response.json(
        { error: 'Verification required' },
        { status: 400 }
      )
    }
    
    const turnstileResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: body.turnstileToken
        })
      }
    )
    
    const turnstileResult = await turnstileResponse.json()
    console.log('Turnstile result:', turnstileResult)

    if (!turnstileResult.success) {
      console.log('Turnstile verification failed:', turnstileResult['error-codes'])
      return Response.json(
        { error: 'Verification failed. Please try again.' },
        { status: 400 }
      )
    }
    
    // 4. BASIC VALIDATION
    if (!body.applicantName || !body.email || !body.phone || !body.whyAdopt) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check if this is an "any cat" application or a specific cat
    const isOpenToAnyCat = body.isOpenToAnyCat === true

    if (!body.catId && !isOpenToAnyCat) {
      return Response.json(
        { error: 'Cat ID is required' },
        { status: 400 }
      )
    }
    
    // 5. EMAIL VALIDATION
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }
    
    // Block disposable email services
    const disposableEmails = [
      'tempmail.com', '10minutemail.com', 'guerrillamail.com',
      'mailinator.com', 'throwaway.email', 'temp-mail.org',
      'yopmail.com', 'maildrop.cc', 'getnada.com'
    ]
    const emailDomain = body.email.split('@')[1]
    if (disposableEmails.includes(emailDomain)) {
      return Response.json(
        { error: 'Please use a permanent email address' },
        { status: 400 }
      )
    }
    
    // 6. PHONE VALIDATION (Indian format)
    const phoneDigits = body.phone.replace(/\D/g, '')
    if (phoneDigits.length < 10 || phoneDigits.length > 12) {
      return Response.json(
        { error: 'Invalid phone number. Please enter a 10-digit mobile number.' },
        { status: 400 }
      )
    }
    
    // 7. GENERATE UNIQUE APPLICATION ID
    const applicationId = await generateUniqueId()

    // 8. CREATE APPLICATION IN SANITY
    const applicationData = {
      _type: 'application',
      applicationId,
      applicantName: body.applicantName,
      email: body.email,
      phone: body.phone,
      address: body.address || '',
      housingType: body.housingType || '',
      hasOtherPets: body.hasOtherPets || false,
      otherPetsDetails: body.otherPetsDetails || '',
      whyAdopt: body.whyAdopt,
      experience: body.experience || '',
      submittedAt: new Date().toISOString(),
      status: 'new',
      finalDecision: 'pending'
    }

    // Add cat reference or isOpenToAnyCat flag
    let catName = null
    if (isOpenToAnyCat) {
      applicationData.isOpenToAnyCat = true
    } else {
      applicationData.cat = {
        _type: 'reference',
        _ref: body.catId
      }
      // Fetch cat name for the welcome email
      const cat = await serverClient.fetch(
        `*[_type == "cat" && _id == $catId][0]{ name }`,
        { catId: body.catId }
      )
      catName = cat?.name || 'your chosen cat'
    }

    const result = await serverClient.create(applicationData)

    // Update rate limit tracker
    submissions.set(ip, now)

    // Clean up old entries (every 100 submissions)
    if (submissions.size > 100) {
      const cutoff = now - 300000
      for (const [key, value] of submissions.entries()) {
        if (value < cutoff) submissions.delete(key)
      }
    }

    // Send welcome email to applicant (non-blocking)
    sendWelcomeEmail({
      to: body.email,
      applicantName: body.applicantName,
      applicationId,
      catName,
      isOpenToAnyCat,
      locale: body.locale || 'en'
    }).catch(err => console.error('Failed to send welcome email:', err))

    // Send notification email to support (non-blocking)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://purrfectlove.org'
    const sanityStudioUrl = `${siteUrl}/studio/structure/application;${result._id}`

    const colors = {
      tabbyBrown: '#C85C3F',
      hunterGreen: '#2C5F4F',
      whiskerCream: '#F6F4F0',
      textDark: '#2A2A2A',
      textLight: '#6B6B6B',
      pawPink: '#F5D5C8'
    }

    const catDisplayName = isOpenToAnyCat ? 'Any Cat' : (catName || 'a cat')
    const whyAdoptPreview = body.whyAdopt.length > 150
      ? body.whyAdopt.substring(0, 150) + '...'
      : body.whyAdopt

    const notificationHtml = `
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
              <p style="margin: 8px 0 0 0; font-size: 14px; color: ${colors.whiskerCream}; font-family: 'Lora', Georgia, serif;">New Adoption Application</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 24px 0; font-family: 'Outfit', 'Trebuchet MS', sans-serif; font-size: 24px; color: ${colors.hunterGreen}; font-weight: 600;">You have a new applicant to adopt ${catDisplayName}</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td style="background-color: ${colors.whiskerCream}; border-left: 4px solid ${colors.tabbyBrown}; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0 0 12px 0; font-size: 14px; font-family: 'Outfit', sans-serif; color: ${colors.textLight}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Applicant Details</p>
                    <p style="margin: 0 0 4px 0; font-size: 18px; font-family: 'Outfit', sans-serif; font-weight: 600; color: ${colors.textDark};">${body.applicantName}</p>
                    <p style="margin: 0 0 4px 0; font-size: 15px; font-family: 'Lora', Georgia, serif; color: ${colors.textLight};"><a href="mailto:${body.email}" style="color: ${colors.tabbyBrown}; text-decoration: none;">${body.email}</a></p>
                    <p style="margin: 0; font-size: 15px; font-family: 'Lora', Georgia, serif; color: ${colors.textLight};">${body.phone}</p>
                    <p style="margin: 12px 0 0 0; font-size: 13px; font-family: 'Lora', Georgia, serif; color: ${colors.textLight};">Application ID: #${applicationId}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; font-family: 'Lora', Georgia, serif; color: ${colors.textLight};">${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px 0;">
                <tr>
                  <td style="background-color: ${colors.pawPink}; border-radius: 12px; padding: 24px;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-family: 'Outfit', sans-serif; color: ${colors.textLight}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Why They Want to Adopt</p>
                    <p style="margin: 0; font-size: 16px; line-height: 1.6; font-family: 'Lora', Georgia, serif; color: ${colors.textDark};">${whyAdoptPreview.replace(/\n/g, '<br>')}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${sanityStudioUrl}" style="display: inline-block; background-color: ${colors.hunterGreen}; color: ${colors.whiskerCream}; font-family: 'Outfit', 'Trebuchet MS', sans-serif; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">View Full Application →</a>
                  </td>
                </tr>
              </table>
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

    resend.emails.send({
      from: 'Purrfect Love <support@purrfectlove.org>',
      to: ['support@purrfectlove.org'],
      subject: `New adoption application from ${body.applicantName} - ${catDisplayName}`,
      html: notificationHtml
    }).then(emailResult => {
      console.log('Adoption notification email sent:', emailResult.data?.id)
    }).catch(err => {
      console.error('Failed to send adoption notification email:', err)
    })

    console.log('Application created successfully:', result._id)
    return Response.json({
      success: true,
      applicationId: result._id,
      message: 'Application submitted successfully!'
    })
  } catch (error) {
    console.error('Error creating application:', error)
    return Response.json(
      {
        error: 'Failed to submit application',
        details: error.message
      },
      { status: 500 }
    )
  }
}