import { createClient } from '@sanity/client';

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false
});

// Simple in-memory rate limiting
const submissions = new Map();

export async function POST(request) {
  try {
    const body = await request.json();

    // 1. HONEYPOT CHECK
    if (body.website) {
      console.log('Honeypot triggered - spam detected');
      return Response.json({ error: 'Invalid submission' }, { status: 400 });
    }

    // 2. RATE LIMITING (2 minutes per IP)
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const lastSubmission = submissions.get(ip);

    if (lastSubmission && now - lastSubmission < 120000) {
      return Response.json(
        { error: 'Please wait before sending another message' },
        { status: 429 }
      );
    }

    // 3. TURNSTILE VERIFICATION
    if (!body.turnstileToken) {
      return Response.json(
        { error: 'Verification required' },
        { status: 400 }
      );
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
    );

    const turnstileResult = await turnstileResponse.json();

    if (!turnstileResult.success) {
      return Response.json(
        { error: 'Verification failed. Please try again.' },
        { status: 400 }
      );
    }

    // 4. BASIC VALIDATION
    if (!body.name || !body.email || !body.message) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 5. EMAIL VALIDATION
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 6. SAVE TO SANITY
    const result = await serverClient.create({
      _type: 'contactMessage',
      name: body.name,
      email: body.email,
      message: body.message,
      locale: body.locale || 'en',
      submittedAt: new Date().toISOString(),
      status: 'open'
    });

    console.log('Contact message saved:', result._id);

    // Update rate limit tracker
    submissions.set(ip, now);

    // Clean up old entries
    if (submissions.size > 100) {
      const cutoff = now - 120000;
      for (const [key, value] of submissions.entries()) {
        if (value < cutoff) submissions.delete(key);
      }
    }

    return Response.json({
      success: true,
      message: 'Message sent successfully!'
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    return Response.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
