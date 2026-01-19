import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();

    // Verify the webhook is from Sanity (basic check)
    // You can add more sophisticated verification if needed
    if (!body._type || body._type !== 'contactMessage') {
      return Response.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // Extract contact message details
    const { name, email, message, locale, submittedAt, _id } = body;

    // Determine language for the notification
    const languageLabel = locale === 'de' ? 'German' : 'English';
    const languageFlag = locale === 'de' ? '🇩🇪' : '🇮🇳';

    // Site URL and Sanity Studio URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://purrfectlove.org';
    const sanityStudioUrl = `${siteUrl}/studio/structure/contactMessage;${_id}`;

    // Truncate message for preview (max 150 chars)
    const truncatedMessage = message.length > 150
      ? message.substring(0, 150) + '...'
      : message;

    // Brand colors
    const colors = {
      tabbyBrown: '#C85C3F',
      hunterGreen: '#2C5F4F',
      whiskerCream: '#F6F4F0',
      textDark: '#2A2A2A',
      textLight: '#6B6B6B',
      pawPink: '#F5D5C8'
    };

    // HTML email template
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Georgia', 'Times New Roman', serif; background-color: ${colors.whiskerCream}; color: ${colors.textDark};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.whiskerCream}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${colors.hunterGreen} 0%, ${colors.tabbyBrown} 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; font-family: 'Trebuchet MS', sans-serif; font-size: 28px; color: ${colors.whiskerCream}; font-weight: 700;">
                Purrfect Love
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: ${colors.whiskerCream}; opacity: 0.9;">
                New Message Notification
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 32px;">
              <!-- Title -->
              <h2 style="margin: 0 0 24px 0; font-family: 'Trebuchet MS', sans-serif; font-size: 24px; color: ${colors.hunterGreen};">
                You have a new message on purrfectlove.org - ${languageLabel} ${languageFlag}
              </h2>

              <!-- From Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td style="background-color: ${colors.whiskerCream}; border-left: 4px solid ${colors.tabbyBrown}; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0 0 12px 0; font-size: 14px; color: ${colors.textLight}; text-transform: uppercase; letter-spacing: 1px;">
                      From
                    </p>
                    <p style="margin: 0 0 4px 0; font-size: 18px; font-weight: bold; color: ${colors.textDark};">
                      ${name}
                    </p>
                    <p style="margin: 0; font-size: 15px; color: ${colors.textLight};">
                      <a href="mailto:${email}" style="color: ${colors.tabbyBrown}; text-decoration: none;">${email}</a>
                    </p>
                    <p style="margin: 12px 0 0 0; font-size: 13px; color: ${colors.textLight};">
                      ${new Date(submittedAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Message Preview Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px 0;">
                <tr>
                  <td style="background-color: ${colors.pawPink}; border-radius: 12px; padding: 24px;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: ${colors.textLight}; text-transform: uppercase; letter-spacing: 1px;">
                      Message Preview
                    </p>
                    <p style="margin: 0; font-size: 16px; line-height: 1.6; color: ${colors.textDark};">
                      ${truncatedMessage.replace(/\n/g, '<br>')}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 24px 0;">
                    <a href="${sanityStudioUrl}" style="display: inline-block; background-color: ${colors.hunterGreen}; color: ${colors.whiskerCream}; font-family: 'Trebuchet MS', sans-serif; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 2px 8px rgba(44, 95, 79, 0.3);">
                      View Full Message in Message Board →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Quick Actions -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #E8E8E8; padding-top: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px 0; font-size: 14px; color: ${colors.textLight};">
                      Quick Actions:
                    </p>
                    <p style="margin: 0;">
                      <a href="mailto:${email}" style="color: ${colors.tabbyBrown}; text-decoration: none; font-size: 15px;">Reply to ${name}</a>
                      <span style="color: ${colors.textLight}; margin: 0 8px;">•</span>
                      <a href="${sanityStudioUrl}" style="color: ${colors.tabbyBrown}; text-decoration: none; font-size: 15px;">View in Sanity</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${colors.whiskerCream}; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: ${colors.textLight};">
                Bangalore • Stuttgart
              </p>
              <p style="margin: 0; font-size: 13px; color: ${colors.textLight};">
                Made with 🧡 for cats and cat lovers
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    // Plain text version
    const text = `
NEW MESSAGE ON PURRFECTLOVE.ORG - ${languageLabel.toUpperCase()} ${languageFlag}

FROM: ${name}
EMAIL: ${email}
SUBMITTED: ${new Date(submittedAt).toLocaleString()}

MESSAGE PREVIEW:
${truncatedMessage}

---

VIEW FULL MESSAGE:
${sanityStudioUrl}

REPLY TO ${name}:
mailto:${email}

---
Bangalore • Stuttgart
Made with 🧡 for cats and cat lovers
    `;

    // Send email notification via Resend
    const emailResult = await resend.emails.send({
      from: 'Purrfect Love <onboarding@resend.dev>', // Use Resend's test domain or replace with your verified domain
      to: [process.env.NOTIFICATION_EMAIL || 'pranavkarnad@gmail.com'], // Configure via environment variable
      subject: `New message from ${name} - ${languageLabel} ${languageFlag}`,
      html,
      text
    });

    console.log('Email sent successfully:', emailResult);

    return Response.json({
      success: true,
      emailId: emailResult.data?.id
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return Response.json(
      { error: 'Failed to process webhook', details: error.message },
      { status: 500 }
    );
  }
}
