import { Resend } from 'resend';

// Diagnostic endpoint — tests both emails sent on adoption form submission
// Usage: /api/test-email?secret=XXXXXXXX  (last 8 chars of RESEND_API_KEY)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return Response.json({ error: 'RESEND_API_KEY not set in environment' });
  }
  if (secret !== apiKey.slice(-8)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resend = new Resend(apiKey);
  const results = {};

  // Test 1: Welcome email to applicant (same config as sendWelcomeEmail in resend.js)
  const welcome = await resend.emails.send({
    from: 'Purrfect Love <no-reply@purrfectlove.org>',
    replyTo: 'support@purrfectlove.org',
    to: ['support@purrfectlove.org'],
    subject: '[TEST] Welcome to Purrfect Love! Your Application #TEST',
    html: '<p>This is a <strong>test welcome email</strong> (sent to applicant in production). Checking: from=no-reply, replyTo=support.</p>',
    text: 'Test welcome email. Checking: from=no-reply, replyTo=support.',
  });
  results.welcomeEmail = welcome.error
    ? { status: 'FAILED', error: welcome.error }
    : { status: 'OK', id: welcome.data?.id };

  // Test 2: Support notification (same config as route.js support notification)
  const notification = await resend.emails.send({
    from: 'Purrfect Love <no-reply@purrfectlove.org>',
    replyTo: 'Test Applicant <support@purrfectlove.org>',
    to: ['support@purrfectlove.org'],
    subject: '[TEST] New adoption application from Test Applicant - Any Cat',
    html: '<p>This is a <strong>test support notification</strong>. Checking: from=no-reply, replyTo=applicant, to=support.</p>',
  });
  results.supportNotification = notification.error
    ? { status: 'FAILED', error: notification.error }
    : { status: 'OK', id: notification.data?.id };

  const allOk = results.welcomeEmail.status === 'OK' && results.supportNotification.status === 'OK';
  return Response.json({ overall: allOk ? 'ALL OK' : 'SOME FAILED', ...results });
}
