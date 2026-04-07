import { createClient } from '@sanity/client';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // 7. SEND EMAIL NOTIFICATION
    const languageLabel = body.locale === 'de' ? 'German' : 'English';
    const languageFlag = body.locale === 'de' ? '🇩🇪' : '🇮🇳';
    const sanityStudioUrl = `https://purrfectlove.org/studio/intent/edit/id=${result._id};type=contactMessage`;
    const fullMessage = body.message.replace(/\n/g, '<br>');

    const emailHtml = `<!DOCTYPE html>
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
            <h2 style="margin:0 0 20px;font-size:18px;color:#2C5F4F;font-family:'Trebuchet MS',sans-serif;">You have a new message on the Purrfect Love website message board</h2>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;width:100%;">
              <tr><td style="padding:5px 0;font-size:14px;color:#666;width:80px;">From</td><td style="padding:5px 0;font-size:14px;color:#2D2D2D;font-weight:600;">${body.name}</td></tr>
              <tr><td style="padding:5px 0;font-size:14px;color:#666;">Email</td><td style="padding:5px 0;font-size:14px;"><a href="mailto:${body.email}" style="color:#C85C3F;text-decoration:none;">${body.email}</a></td></tr>
              <tr><td style="padding:5px 0;font-size:14px;color:#666;">Language</td><td style="padding:5px 0;font-size:14px;color:#2D2D2D;">${languageLabel} ${languageFlag}</td></tr>
            </table>
            <div style="background:#F5F0E8;border-radius:8px;padding:20px;margin:0 0 24px;font-size:15px;line-height:1.7;color:#2D2D2D;">
              ${fullMessage}
            </div>
            <p style="margin:0 0 24px;text-align:center;">
              <a href="${sanityStudioUrl}" style="display:inline-block;background:#2C5F4F;color:#F6F4F0;text-decoration:none;font-family:'Trebuchet MS',sans-serif;font-size:15px;font-weight:700;padding:12px 28px;border-radius:8px;">Review here →</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#F5F0E8;padding:20px 32px;text-align:center;border-top:1px solid #E8E4DC;">
            <p style="margin:0;font-size:13px;color:#6B6B6B;font-weight:600;">Purrfect Love · Cat Adoption &amp; Rescue</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
      const { error: emailError } = await resend.emails.send({
        from: 'Purrfect Love <no-reply@purrfectlove.org>',
        to: ['support@purrfectlove.org'],
        subject: `New message on the website message board — ${body.name} ${languageFlag}`,
        html: emailHtml,
        text: `New message on the Purrfect Love website message board\n\nFrom: ${body.name} (${body.email})\nLanguage: ${languageLabel}\n\n${body.message}\n\nReview: ${sanityStudioUrl}`,
      });
      if (emailError) console.error('Contact notification email error:', emailError);
      else console.log('Contact notification email sent');
    } catch (err) {
      console.error('Failed to send contact notification email:', err);
    }

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
