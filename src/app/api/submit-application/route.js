import { createClient } from '@sanity/client'
import { sendWelcomeEmail } from '@/lib/resend'

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

    // Send welcome email (non-blocking)
    sendWelcomeEmail({
      to: body.email,
      applicantName: body.applicantName,
      applicationId,
      catName,
      isOpenToAnyCat,
      locale: body.locale || 'en'
    }).catch(err => console.error('Failed to send welcome email:', err))

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