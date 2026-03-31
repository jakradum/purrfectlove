import { createClient } from '@sanity/client'
import { signToken } from '@/lib/careAuth'
import { Resend } from 'resend'
import { generateUniqueUsername } from '@/lib/generateUsername'

const resend = new Resend(process.env.RESEND_API_KEY)

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

function welcomeEmailHtml(firstName, unsubUrl, isDE) {
  const plusCodesUrl = 'https://plus.codes'
  const body = isDE ? `
    <p>Scharf die Krallen gewetzt — die PL Community ist dein neues Kratzbaum-Paradies.</p>
    <p>Vorerst konzentrieren wir uns darauf, Katzeneltern eine Betreuung für ihre Katzen zu vermitteln. Wenn du Interesse hast, jemandes Katze zu betreuen, kannst du dich auch als Sitter eintragen.</p>
    <p><strong>Einige allgemeine Tipps und Regeln:</strong></p>
    <ul>
      <li>Zuerst: Fülle dein Profil aus. Gib deine Adresse (als <a href="${plusCodesUrl}">Plus Code</a>), deine Katzen und Infos zu dir/deinem Haushalt an. Wir fragen nie nach deiner genauen Adresse – der Plus Code gibt uns nur eine ungefähre Lage für die Entfernungsberechnung.</li>
      <li>Deine Telefonnummer und E-Mail sind standardmäßig für alle Mitglieder sichtbar. Du kannst eines oder beides ausblenden. Falls du beides ausblendest, können andere Mitglieder dich nur über den eingebauten Posteingang erreichen. Wenn jemand dir dort schreibt, erhältst du eine E-Mail – sorge also dafür, dass Nachrichten von PL in deinem Hauptpostfach landen.</li>
      <li>Wenn du über WhatsApp, E-Mail oder den Posteingang mit einem Mitglied schreibst, bleibe bitte respektvoll.</li>
      <li>Für Feedback zur Plattform: Nutze den Feedback-Button in deinem Profil.</li>
      <li>Falls bei einer Betreuung etwas schiefläuft (wir hoffen, dass das nie passiert – aber gut vorbereitet zu sein ist wichtig): Schreib uns eine E-Mail an <a href="mailto:support@purrfectlove.org">support@purrfectlove.org</a>.</li>
    </ul>
    <p><em>PS: Wir haben noch kein Forum/Schwarzes Brett. Wir arbeiten daran, diesen Ort für alle Katzeneltern angenehm und produktiv zu gestalten.</em></p>
  ` : `
    <p>Sharpen those claws — the PL Community is your new scratch post.</p>
    <p>For now, we focus on finding cat parents a sitter for their cats, and if you're interested in sitting someone's cat, you can volunteer to help too.</p>
    <p><strong>Some general tips and rules:</strong></p>
    <ul>
      <li>First things first, make sure to fill out your profile. Enter details of your location, your cats, and yourself/your household. We never ask for your exact location, we only need your <a href="${plusCodesUrl}">Plus Code</a> which provides us with an approximate location to your area needed for computing distances from other Purrfect parents.</li>
      <li>Your phone number and email are revealed to all members by default. You can choose to hide one or the other, or both. If you hide both, other members can only reach you via the in-site message inbox. When someone sends you a message in the inbox, we will email you, so make sure to move this email to your main inbox so that you see emails from PL more easily.</li>
      <li>When you message a member either on WhatsApp, email or via the in-website inbox, keep the conversation respectful.</li>
      <li>For any feedback with regards to the platform, drop us a message via the feedback button in your profile section.</li>
      <li>If anything goes wrong during a cat-sitting assignment (we hope it never happens, but it's good to be prepared), shoot us an email at <a href="mailto:support@purrfectlove.org">support@purrfectlove.org</a>.</li>
    </ul>
    <p><em>PS: We don't have a forum/notice board yet. We are working towards making this an engaging and productive space for all cat parents.</em></p>
  `
  return `<!DOCTYPE html>
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
            <p style="font-size:16px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">Hello ${firstName},</p>
            ${body}
          </td>
        </tr>
        <tr>
          <td style="background:#F5F0E8;padding:20px 32px;text-align:center;border-top:1px solid #E8E4DC;">
            <p style="margin:0 0 4px;font-size:13px;color:#6B6B6B;font-weight:600;">Purrfect Love · Cat Adoption &amp; Rescue</p>
            <p style="margin:0;font-size:12px;color:#999;">
              <a href="https://care.purrfectlove.org" style="color:#C85C3F;text-decoration:none;">care.purrfectlove.org</a>
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#bbb;">
              <a href="${unsubUrl}" style="color:#bbb;text-decoration:underline;">Unsubscribe from community emails</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function welcomeEmailText(firstName, unsubUrl, isDE) {
  const plusCodesUrl = 'https://plus.codes'
  if (isDE) {
    return `Hallo ${firstName},

Scharf die Krallen gewetzt — die PL Community ist dein neues Kratzbaum-Paradies.

Vorerst konzentrieren wir uns darauf, Katzeneltern eine Betreuung für ihre Katzen zu vermitteln. Wenn du Interesse hast, jemandes Katze zu betreuen, kannst du dich auch als Sitter eintragen.

Einige allgemeine Tipps und Regeln:

* Zuerst: Fülle dein Profil aus. Gib deine Adresse (als Plus Code – ${plusCodesUrl}), deine Katzen und Infos zu dir/deinem Haushalt an.
* Deine Telefonnummer und E-Mail sind standardmäßig für alle Mitglieder sichtbar. Du kannst eines oder beides ausblenden.
* Bleibe in allen Gesprächen respektvoll.
* Für Feedback: Nutze den Feedback-Button in deinem Profil.
* Falls bei einer Betreuung etwas schiefläuft: support@purrfectlove.org

PS: Wir haben noch kein Forum/Schwarzes Brett. Wir arbeiten daran.

---
Abmelden: ${unsubUrl}`
  }
  return `Hello ${firstName},

Sharpen those claws — the PL Community is your new scratch post.

For now, we focus on finding cat parents a sitter for their cats, and if you're interested in sitting someone's cat, you can volunteer to help too.

Some general tips and rules:

* First things first, make sure to fill out your profile. Enter details of your location, your cats, and yourself/your household. We never ask for your exact location, we only need your Plus Code (${plusCodesUrl}) which provides us with an approximate location needed for computing distances from other Purrfect parents.
* Your phone number and email are revealed to all members by default. You can choose to hide one or the other, or both. If you hide both, other members can only reach you via the in-site message inbox.
* When you message a member either on WhatsApp, email or via the in-website inbox, keep the conversation respectful.
* For any feedback with regards to the platform, drop us a message via the feedback button in your profile section.
* If anything goes wrong during a cat-sitting assignment, shoot us an email at support@purrfectlove.org

PS: We don't have a forum/notice board yet. We are working towards making this an engaging and productive space for all cat parents.

---
Unsubscribe from community emails: ${unsubUrl}`
}

function phoneVariants(raw) {
  const norm = raw.replace(/\s+/g, '')
  const spaced = norm.replace(/^(\+\d{2})(\d)/, '$1 $2')
  return { norm, spaced }
}

export async function POST(request) {
  try {
    const { identifier: rawIdentifier, type, code } = await request.json()

    if (!rawIdentifier || !type || !code || !['phone', 'email'].includes(type)) {
      return Response.json({ error: 'identifier, type, and code are required' }, { status: 400 })
    }

    let identifier
    if (type === 'phone') {
      identifier = rawIdentifier.replace(/\s+/g, '')
    } else {
      identifier = rawIdentifier.trim().toLowerCase()
    }

    const MAX_ATTEMPTS = 5

    // Fetch OTP record by identifier only (not by code) so we can track failed attempts
    let otpDoc
    if (type === 'phone') {
      otpDoc = await sanity.fetch(
        `*[_type == "otpCode" && phone == $identifier][0]{ _id, code, expiresAt, attempts }`,
        { identifier }
      )
    } else {
      otpDoc = await sanity.fetch(
        `*[_type == "otpCode" && email == $identifier][0]{ _id, code, expiresAt, attempts }`,
        { identifier }
      )
    }

    if (!otpDoc) {
      return Response.json({ error: 'Invalid code' }, { status: 400 })
    }

    if (new Date(otpDoc.expiresAt) < new Date()) {
      await sanity.delete(otpDoc._id)
      return Response.json({ error: 'Code expired. Request a new one.' }, { status: 400 })
    }

    if (otpDoc.code !== code) {
      const attempts = (otpDoc.attempts || 0) + 1
      if (attempts >= MAX_ATTEMPTS) {
        await sanity.delete(otpDoc._id)
        await new Promise(r => setTimeout(r, 1000))
        return Response.json({ error: 'Too many attempts, request a new code.' }, { status: 429 })
      }
      await sanity.patch(otpDoc._id).set({ attempts }).commit()
      await new Promise(r => setTimeout(r, 1000))
      return Response.json({ error: 'Invalid code' }, { status: 400 })
    }

    await sanity.delete(otpDoc._id)

    // Find the account
    let catSitter, teamMember

    if (type === 'phone') {
      const { norm: phone, spaced: phoneSpaced } = phoneVariants(rawIdentifier)
      ;[catSitter, teamMember] = await Promise.all([
        sanity.fetch(
          `*[_type == "catSitter" && (phone == $phone || phone == $phoneSpaced) && memberVerified == true][0]{ _id, name, email, locale, welcomeSent, username }`,
          { phone, phoneSpaced }
        ),
        sanity.fetch(
          `*[_type == "teamMember" && (phone == $phone || phone == $phoneSpaced)][0]{ _id, name }`,
          { phone, phoneSpaced }
        ),
      ])
    } else {
      ;[catSitter, teamMember] = await Promise.all([
        sanity.fetch(
          `*[_type == "catSitter" && email == $email && memberVerified == true][0]{ _id, name, email, locale, welcomeSent, username }`,
          { email: identifier }
        ),
        sanity.fetch(
          `*[_type == "teamMember" && email == $email][0]{ _id, name }`,
          { email: identifier }
        ),
      ])
    }

    // If teamMember matched but no catSitter did, find their linked catSitter by name
    if (!catSitter && teamMember) {
      catSitter = await sanity.fetch(
        `*[_type == "catSitter" && name == $name && siteAdmin == true && memberVerified == true][0]{ _id, name, email, locale, welcomeSent, username }`,
        { name: teamMember.name }
      )
    }

    const account = catSitter || teamMember
    if (!account) {
      return Response.json({ error: 'Account not found or not verified' }, { status: 403 })
    }

    const token = await signToken({
      identifier,
      identifierType: type,
      sitterId: account._id,
      name: account.name || '',
      isTeamMember: !catSitter && !!teamMember,
    })

    // Auto-generate username if catSitter has none (must happen before welcome email)
    let resolvedUsername = catSitter?.username || null
    if (catSitter && !catSitter.username) {
      try {
        resolvedUsername = await generateUniqueUsername(sanity)
        await sanity.patch(catSitter._id).set({ username: resolvedUsername }).commit()
      } catch (err) {
        console.error('username generation error:', err)
        // Non-fatal
      }
    }

    // Send welcome email on first login (catSitters only, not pure teamMembers)
    if (catSitter && !catSitter.welcomeSent) {
      const recipientEmail = catSitter.email || (type === 'email' ? identifier : null)
      if (recipientEmail && process.env.NODE_ENV === 'production') {
        const locale = catSitter.locale || 'en'
        const firstName = resolvedUsername || (catSitter.name || '').split(' ')[0] || 'there'
        const unsubUrl = `https://care.purrfectlove.org/api/care/unsubscribe?id=${catSitter._id}`
        const isDE = locale === 'de'
        try {
          await resend.emails.send({
            from: 'Purrfect Love <no-reply@purrfectlove.org>',
            replyTo: 'support@purrfectlove.org',
            to: [recipientEmail],
            subject: 'Welcome to the Purrfect Love Community',
            html: welcomeEmailHtml(firstName, unsubUrl, isDE),
            text: welcomeEmailText(firstName, unsubUrl, isDE),
          })
          await sanity.patch(catSitter._id).set({ welcomeSent: true }).commit()
        } catch (err) {
          console.error('welcome email error:', err)
          // Non-fatal — don't block login
        }
      }
    }

    const isProduction = process.env.NODE_ENV === 'production'
    const maxAge = 90 * 24 * 3600
    const cookieValue = `auth_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${isProduction ? '; Secure' : ''}`

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookieValue },
    })
  } catch (error) {
    console.error('verify-otp error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
