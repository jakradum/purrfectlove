import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail({ to, applicantName, applicationId, catName, isOpenToAnyCat }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://purrfectlove.org'

  const catInfo = isOpenToAnyCat
    ? "You've indicated you're open to meeting any of our cats - that's wonderful!"
    : `You've applied to adopt <strong>${catName}</strong>.`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #FFF8F0; color: #2D2D2D;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFF8F0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color: #2D5A3D; padding: 32px; text-align: center;">
              <img src="${siteUrl}/logo-white.svg" alt="Purrfect Love" width="180" style="max-width: 180px;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 32px;">
              <h1 style="margin: 0 0 24px 0; font-family: 'Trebuchet MS', sans-serif; font-size: 28px; color: #2D5A3D;">
                Welcome, ${applicantName}! 🐱
              </h1>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.7; color: #4A4A4A;">
                Thank you for submitting your adoption application with Purrfect Love! We're thrilled that you're considering giving a cat a loving forever home.
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: #4A4A4A;">
                ${catInfo}
              </p>

              <!-- Application ID Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #F5F0E8; border-radius: 12px; padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B6B6B; text-transform: uppercase; letter-spacing: 1px;">
                      Your Application ID
                    </p>
                    <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #2D5A3D; letter-spacing: 4px;">
                      #${applicationId}
                    </p>
                    <p style="margin: 12px 0 0 0; font-size: 13px; color: #8B8B8B;">
                      Please save this for your records
                    </p>
                  </td>
                </tr>
              </table>

              <h2 style="margin: 32px 0 16px 0; font-family: 'Trebuchet MS', sans-serif; font-size: 20px; color: #2D5A3D;">
                What happens next?
              </h2>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E8E8E8;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: #2D5A3D; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-family: sans-serif;">1</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; font-size: 15px; color: #4A4A4A;"><strong>Application Review</strong> - Our team will review your application within 3-5 days.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E8E8E8;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: #2D5A3D; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-family: sans-serif;">2</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; font-size: 15px; color: #4A4A4A;"><strong>Interview</strong> - We'll reach out to schedule a phone or video call to get to know you better.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E8E8E8;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: #2D5A3D; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-family: sans-serif;">3</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; font-size: 15px; color: #4A4A4A;"><strong>Home Visit</strong> - A quick visit to ensure a safe environment for your new furry friend.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: #2D5A3D; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-family: sans-serif;">4</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; font-size: 15px; color: #4A4A4A;"><strong>Meet & Adopt</strong> - If all goes well, you'll meet your new companion and complete the adoption!</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 16px 0; font-size: 16px; line-height: 1.7; color: #4A4A4A;">
                In the meantime, feel free to check out our <a href="${siteUrl}/guides/faqs" style="color: #C85C3F; text-decoration: none;">FAQs</a> or learn more about our <a href="${siteUrl}/guides/process" style="color: #C85C3F; text-decoration: none;">adoption process</a>.
              </p>

              <p style="margin: 24px 0 0 0; font-size: 16px; line-height: 1.7; color: #4A4A4A;">
                Have questions? Simply reply to this email or reach out through our <a href="${siteUrl}/contact" style="color: #C85C3F; text-decoration: none;">contact page</a>.
              </p>

              <p style="margin: 32px 0 0 0; font-size: 16px; color: #4A4A4A;">
                With whiskers and purrs,<br />
                <strong style="color: #2D5A3D;">The Purrfect Love Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F5F0E8; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B6B6B;">
                Bangalore • Stuttgart
              </p>
              <p style="margin: 0; font-size: 13px; color: #8B8B8B;">
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
`

  const text = `
Welcome, ${applicantName}!

Thank you for submitting your adoption application with Purrfect Love! We're thrilled that you're considering giving a cat a loving forever home.

${isOpenToAnyCat ? "You've indicated you're open to meeting any of our cats - that's wonderful!" : `You've applied to adopt ${catName}.`}

YOUR APPLICATION ID: #${applicationId}
Please save this for your records.

WHAT HAPPENS NEXT?

1. Application Review - Our team will review your application within 3-5 days.
2. Interview - We'll reach out to schedule a phone or video call to get to know you better.
3. Home Visit - A quick visit to ensure a safe environment for your new furry friend.
4. Meet & Adopt - If all goes well, you'll meet your new companion and complete the adoption!

In the meantime, feel free to check out our FAQs at ${siteUrl}/guides/faqs or learn more about our adoption process at ${siteUrl}/guides/process.

Have questions? Reply to this email or visit ${siteUrl}/contact.

With whiskers and purrs,
The Purrfect Love Team

Bangalore • Stuttgart
`

  try {
    const { data, error } = await resend.emails.send({
      from: 'Purrfect Love <support@purrfectlove.org>',
      to: [to],
      subject: `Welcome to Purrfect Love! Your Application #${applicationId}`,
      html,
      text
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error }
    }

    console.log('Welcome email sent:', data?.id)
    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    return { success: false, error: error.message }
  }
}
