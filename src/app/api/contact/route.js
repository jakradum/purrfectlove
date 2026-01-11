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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://purrfectlove.org';
    const sanityStudioUrl = `${siteUrl}/studio/structure/contactMessage;${result._id}`;

    const truncatedMessage = body.message.length > 150
      ? body.message.substring(0, 150) + '...'
      : body.message;

    const colors = {
      tabbyBrown: '#C85C3F',
      hunterGreen: '#2C5F4F',
      whiskerCream: '#F6F4F0',
      textDark: '#2A2A2A',
      textLight: '#6B6B6B',
      pawPink: '#F5D5C8'
    };

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
              <p style="margin: 8px 0 0 0; font-size: 14px; color: ${colors.whiskerCream}; font-family: 'Lora', Georgia, serif;">New Message Notification</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 24px 0; font-family: 'Outfit', 'Trebuchet MS', sans-serif; font-size: 24px; color: ${colors.hunterGreen}; font-weight: 600;">You have a new message on purrfectlove.org - ${languageLabel} ${languageFlag}</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td style="background-color: ${colors.whiskerCream}; border-left: 4px solid ${colors.tabbyBrown}; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0 0 12px 0; font-size: 14px; font-family: 'Outfit', sans-serif; color: ${colors.textLight}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">From</p>
                    <p style="margin: 0 0 4px 0; font-size: 18px; font-family: 'Outfit', sans-serif; font-weight: 600; color: ${colors.textDark};">${body.name}</p>
                    <p style="margin: 0; font-size: 15px; font-family: 'Lora', Georgia, serif; color: ${colors.textLight};"><a href="mailto:${body.email}" style="color: ${colors.tabbyBrown}; text-decoration: none;">${body.email}</a></p>
                    <p style="margin: 12px 0 0 0; font-size: 13px; font-family: 'Lora', Georgia, serif; color: ${colors.textLight};">${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px 0;">
                <tr>
                  <td style="background-color: ${colors.pawPink}; border-radius: 12px; padding: 24px;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-family: 'Outfit', sans-serif; color: ${colors.textLight}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Message Preview</p>
                    <p style="margin: 0; font-size: 16px; line-height: 1.6; font-family: 'Lora', Georgia, serif; color: ${colors.textDark};">${truncatedMessage.replace(/\n/g, '<br>')}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${sanityStudioUrl}" style="display: inline-block; background-color: ${colors.hunterGreen}; color: ${colors.whiskerCream}; font-family: 'Outfit', 'Trebuchet MS', sans-serif; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">View Full Message in Message Board →</a>
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
</html>`;

    // Send email notification (non-blocking)
    resend.emails.send({
      from: 'Purrfect Love <no-reply@purrfectlove.org>',
      to: ['support@purrfectlove.org'],
      cc: ['support@purrfectlove.org'],
      subject: `New message from ${body.name} - ${languageLabel} ${languageFlag}`,
      html: emailHtml
    }).then(result => {
      console.log('Contact notification email sent:', result.data?.id);
    }).catch(err => {
      console.error('Failed to send contact notification email:', err);
    });

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
