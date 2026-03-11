import { Resend } from 'resend';

// Diagnostic endpoint — protected by requiring last 8 chars of RESEND_API_KEY as ?secret=
// Usage: /api/test-email?secret=XXXXXXXX
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return Response.json({
      status: 'error',
      issue: 'RESEND_API_KEY is not set in Vercel environment variables',
      fix: 'Go to Vercel → Project Settings → Environment Variables and add RESEND_API_KEY',
    });
  }

  // Protect with last 8 chars of the actual key so only the key holder can trigger this
  if (secret !== apiKey.slice(-8)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: 'Purrfect Love <no-reply@purrfectlove.org>',
    to: ['support@purrfectlove.org'],
    subject: 'Purrfect Love — Production email test',
    html: '<p>This is a diagnostic test email to verify Resend is working in production.</p>',
  });

  if (error) {
    return Response.json({
      status: 'error',
      issue: 'Resend API returned an error — key is set but sending is failing',
      error,
      keyPrefix: apiKey.slice(0, 8) + '...',
    });
  }

  return Response.json({
    status: 'ok',
    message: 'Test email sent successfully to support@purrfectlove.org — Resend is working',
    emailId: data?.id,
    keyPrefix: apiKey.slice(0, 8) + '...',
  });
}
