import { createClient } from '@sanity/client'
import { createServerClient } from '@supabase/ssr'
import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

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

export async function POST(request) {
  try {
    const { identifier: rawIdentifier, code } = await request.json()

    if (!rawIdentifier || !code) {
      return Response.json({ error: 'Email and code are required.' }, { status: 400 })
    }

    const email = rawIdentifier.trim().toLowerCase()

    // Buffer cookies that Supabase wants to set on the response
    const cookiesToSet = []
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookies) => cookiesToSet.push(...cookies),
        },
      }
    )

    // Verify OTP with Supabase (email only)
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })

    if (error || !data.user) {
      return Response.json(
        { error: error?.message === 'Token has expired or is invalid' ? 'Code expired. Request a new one.' : 'Invalid code' },
        { status: 400 }
      )
    }

    // Look up the catSitter / teamMember in Sanity to get sitterId
    const [catSitter, teamMember] = await Promise.all([
      sanity.fetch(
        `*[_type == "catSitter" && email == $email && memberVerified == true][0]{ _id, name, email, locale, welcomeSent }`,
        { email }
      ),
      sanity.fetch(
        `*[_type == "teamMember" && email == $email][0]{ _id, name }`,
        { email }
      ),
    ])

    // If teamMember matched but no catSitter, find their linked catSitter by name
    let resolvedCatSitter = catSitter
    if (!catSitter && teamMember) {
      resolvedCatSitter = await sanity.fetch(
        `*[_type == "catSitter" && name == $name && siteAdmin == true && memberVerified == true][0]{ _id, name, email, locale, welcomeSent }`,
        { name: teamMember.name }
      )
    }

    const account = resolvedCatSitter || teamMember
    if (!account) {
      return Response.json({ error: 'Account not found or not verified.' }, { status: 403 })
    }

    const sitterId = account._id
    const isTeamMember = !resolvedCatSitter && !!teamMember

    // Write sitterId + isTeamMember into Supabase user_metadata via service role
    const supabaseAdmin = createSupabaseAdminClient()
    await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
      user_metadata: { sitterId, isTeamMember },
    })

    // Send welcome email on first login (catSitters only)
    if (resolvedCatSitter && !resolvedCatSitter.welcomeSent) {
      const recipientEmail = resolvedCatSitter.email || email
      if (recipientEmail && process.env.NODE_ENV === 'production') {
        const locale = resolvedCatSitter.locale || 'en'
        const firstName = (resolvedCatSitter.name || '').split(' ')[0] || 'there'
        const unsubUrl = `https://care.purrfectlove.org/api/care/unsubscribe?id=${resolvedCatSitter._id}`
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
          await sanity.patch(resolvedCatSitter._id).set({ welcomeSent: true }).commit()
        } catch (err) {
          console.error('welcome email error:', err)
          // Non-fatal — don't block login
        }
      }
    }

    // Build response, applying Supabase session cookies
    const response = NextResponse.json({ success: true })
    for (const { name, value, options } of cookiesToSet) {
      response.cookies.set(name, value, options)
    }
    return response
  } catch (error) {
    console.error('verify-otp error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
