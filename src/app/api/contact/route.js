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

    // 6. SEND EMAIL (via mailto: we'll just log for now, you can integrate with SendGrid/Resend later)
    console.log('Contact form submission:', {
      name: body.name,
      email: body.email,
      subject: body.subject || 'No subject',
      message: body.message,
      timestamp: new Date().toISOString()
    });

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // For now, we'll just return success - the form data is logged

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
