import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const content = {
  en: {
    subject: (id) => `Welcome to Purrfect Love! Your Application #${id}`,
    greeting: (name) => `Welcome, ${name}!`,
    intro: "Thank you for submitting your adoption application with Purrfect Love! We're thrilled that you're considering giving a cat a loving forever home.",
    catInfoSpecific: (name) => `You've applied to adopt <strong>${name}</strong>.`,
    catInfoAny: "You've indicated you're open to meeting any of our cats - that's wonderful!",
    applicationIdLabel: "Your Application ID",
    saveForRecords: "Please save this for your records",
    whatNext: "What happens next?",
    steps: [
      {
        title: "Application Review",
        description: "Our team will review your application within 3-5 days."
      },
      {
        title: "Orientation Call & Resources",
        description: "We schedule a call to discuss the 4 pillars of adoption—neutering, nutrition, cat-proofing, and lifelong commitment—and share essential resources on introducing the cat to your home."
      },
      {
        title: "Meet & Prepare",
        description: "Meet your chosen cat at the foster home to understand their personality. We also plan a quick home check to give tips for a smooth welcome. Meanwhile, prepare your home by cat-proofing and setting up a comfortable basecamp."
      },
      {
        title: "Your Cat Comes Home!",
        description: "The foster parent brings the cat to their furrever home, providing comfort to the cat and guidance to you, ensuring a smooth and loving transition."
      }
    ],
    learnMore: "In the meantime, feel free to check out our",
    faqsLink: "FAQs",
    orText: "or learn more about our",
    processLink: "adoption process",
    questionsText: "Have questions? Simply reply to this email or reach out through our",
    contactLink: "contact page",
    signoff: "With whiskers and purrs,",
    team: "The Purrfect Love Team",
    location: "Bangalore • Stuttgart",
    madeWith: "Made with 🧡 for cats and cat lovers",
    disclaimer: "This is a system-generated email. Please do not reply to this message. For any support with the adoption process, contact us at support@purrfectlove.org",
    faqsUrl: "/guides/faqs",
    processUrl: "/guides/process",
    contactUrl: "/contact"
  },
  de: {
    subject: (id) => `Willkommen bei Purrfect Love! Deine Bewerbung #${id}`,
    greeting: (name) => `Willkommen, ${name}!`,
    intro: "Vielen Dank für deine Adoptionsbewerbung bei Purrfect Love! Wir freuen uns sehr, dass du einer Katze ein liebevolles Zuhause geben möchtest.",
    catInfoSpecific: (name) => `Du hast dich für die Adoption von <strong>${name}</strong> beworben.`,
    catInfoAny: "Du hast angegeben, dass du offen für jede unserer Katzen bist – das ist wunderbar!",
    applicationIdLabel: "Deine Bewerbungsnummer",
    saveForRecords: "Bitte bewahre diese für deine Unterlagen auf",
    whatNext: "Wie geht es weiter?",
    steps: [
      {
        title: "Bewerbungsprüfung",
        description: "Unser Team prüft deine Bewerbung innerhalb von 3-5 Tagen."
      },
      {
        title: "Orientierungsgespräch & Ressourcen",
        description: "Wir vereinbaren einen Anruf, um die 4 Säulen der Adoption zu besprechen – Kastration, Ernährung, katzensichere Gestaltung und lebenslange Verantwortung – und teilen wichtige Ressourcen zur Eingewöhnung."
      },
      {
        title: "Kennenlernen & Vorbereitung",
        description: "Triff deine Wunschkatze im Pflegezuhause, um ihre Persönlichkeit kennenzulernen. Wir vereinbaren auch einen kurzen Haus-Check für Tipps. Bereite dein Zuhause vor: sichere Balkone und richte einen gemütlichen Platz ein."
      },
      {
        title: "Der Einzug!",
        description: "Die Pflegemama bringt die Katze ins neue Zuhause. So fühlt sich die Katze wohl, die Pflegeperson kann Tipps geben, und der Übergang wird für alle liebevoll gestaltet."
      }
    ],
    learnMore: "In der Zwischenzeit kannst du gerne unsere",
    faqsLink: "FAQs",
    orText: "ansehen oder mehr über unseren",
    processLink: "Adoptionsprozess",
    questionsText: "Hast du Fragen? Antworte einfach auf diese E-Mail oder kontaktiere uns über unsere",
    contactLink: "Kontaktseite",
    signoff: "Mit Schnurrern und Pfötchen,",
    team: "Das Purrfect Love Team",
    location: "Bangalore • Stuttgart",
    madeWith: "Mit 🧡 für Katzen und Katzenliebhaber gemacht",
    disclaimer: "Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht auf diese Nachricht. Für Unterstützung im Adoptionsprozess kontaktieren Sie uns unter support@purrfectlove.org",
    faqsUrl: "/de/guides/faqs",
    processUrl: "/de/guides/process",
    contactUrl: "/de/contact"
  }
}

export async function sendWelcomeEmail({ to, applicantName, applicationId, catName, isOpenToAnyCat, locale = 'en' }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.purrfectlove.org'
  const t = content[locale] || content.en

  const catInfo = isOpenToAnyCat ? t.catInfoAny : t.catInfoSpecific(catName)
  const catInfoText = isOpenToAnyCat ? t.catInfoAny : `${locale === 'de' ? 'Du hast dich für die Adoption von' : "You've applied to adopt"} ${catName}.`

  const stepsHtml = t.steps.map((step, i) => `
    <tr>
      <td style="padding: 12px 0; ${i < t.steps.length - 1 ? 'border-bottom: 1px solid #E8E8E8;' : ''}">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 32px; vertical-align: top;">
              <span style="display: inline-block; width: 24px; height: 24px; background-color: #2D5A3D; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-family: sans-serif;">${i + 1}</span>
            </td>
            <td style="padding-left: 12px;">
              <p style="margin: 0; font-size: 15px; color: #4A4A4A;"><strong>${step.title}</strong> - ${step.description}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('')

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
              <h1 style="margin: 0; font-family: 'Trebuchet MS', sans-serif; font-size: 28px; color: #F6F4F0; font-weight: 700;">Purrfect Love</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 32px;">
              <h1 style="margin: 0 0 24px 0; font-family: 'Trebuchet MS', sans-serif; font-size: 28px; color: #2D5A3D;">
                ${t.greeting(applicantName)} 🐱
              </h1>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.7; color: #4A4A4A;">
                ${t.intro}
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: #4A4A4A;">
                ${catInfo}
              </p>

              <!-- Application ID Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #F5F0E8; border-radius: 12px; padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B6B6B; text-transform: uppercase; letter-spacing: 1px;">
                      ${t.applicationIdLabel}
                    </p>
                    <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #2D5A3D; letter-spacing: 4px;">
                      #${applicationId}
                    </p>
                    <p style="margin: 12px 0 0 0; font-size: 13px; color: #8B8B8B;">
                      ${t.saveForRecords}
                    </p>
                  </td>
                </tr>
              </table>

              <h2 style="margin: 32px 0 16px 0; font-family: 'Trebuchet MS', sans-serif; font-size: 20px; color: #2D5A3D;">
                ${t.whatNext}
              </h2>

              <table width="100%" cellpadding="0" cellspacing="0">
                ${stepsHtml}
              </table>

              <p style="margin: 32px 0 16px 0; font-size: 16px; line-height: 1.7; color: #4A4A4A;">
                ${t.learnMore} <a href="${siteUrl}${t.faqsUrl}" style="color: #C85C3F; text-decoration: none;">${t.faqsLink}</a> ${t.orText} <a href="${siteUrl}${t.processUrl}" style="color: #C85C3F; text-decoration: none;">${t.processLink}</a>.
              </p>

              <p style="margin: 24px 0 0 0; font-size: 16px; line-height: 1.7; color: #4A4A4A;">
                ${t.questionsText} <a href="${siteUrl}${t.contactUrl}" style="color: #C85C3F; text-decoration: none;">${t.contactLink}</a>.
              </p>

              <p style="margin: 32px 0 0 0; font-size: 16px; color: #4A4A4A;">
                ${t.signoff}<br />
                <strong style="color: #2D5A3D;">${t.team}</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F5F0E8; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B6B6B;">
                ${t.location}
              </p>
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #8B8B8B;">
                ${t.madeWith}
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999; line-height: 1.5; border-top: 1px solid #E0E0E0; padding-top: 16px;">
                ${t.disclaimer}
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
${t.greeting(applicantName)}

${t.intro}

${catInfoText}

${t.applicationIdLabel.toUpperCase()}: #${applicationId}
${t.saveForRecords}

${t.whatNext.toUpperCase()}

${t.steps.map((step, i) => `${i + 1}. ${step.title} - ${step.description}`).join('\n\n')}

${t.learnMore} ${t.faqsLink}: ${siteUrl}${t.faqsUrl}
${t.orText} ${t.processLink}: ${siteUrl}${t.processUrl}

${t.questionsText} ${t.contactLink}: ${siteUrl}${t.contactUrl}

${t.signoff}
${t.team}

${t.location}

---
${t.disclaimer}
`

  try {
    const { data, error } = await resend.emails.send({
      from: 'Purrfect Love <no-reply@purrfectlove.org>',
      to: [to],
      cc: ['support@purrfectlove.org'],
      subject: t.subject(applicationId),
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
