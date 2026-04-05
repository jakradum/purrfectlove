import { createClient } from '@sanity/client'
import { Resend } from 'resend'
import { getSupabaseUser, createSupabaseAdminClient } from '@/lib/supabaseServer'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ siteAdmin }`,
      { id: user.sitterId }
    )
    if (!admin?.siteAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { name, email, isTeamMember } = await request.json()
    if (!name?.trim()) return Response.json({ error: 'name is required' }, { status: 400 })
    if (!email?.trim()) return Response.json({ error: 'email is required' }, { status: 400 })

    const normalizedEmail = email.trim().toLowerCase()

    // 1. Create catSitter in Sanity
    const sitter = await serverClient.create({
      _type: 'catSitter',
      name: name.trim(),
      email: normalizedEmail,
      memberVerified: true,
      welcomeSent: false,
      siteAdmin: isTeamMember ? true : false,
    })

    // 2. Create Supabase auth user
    const supabaseAdmin = createSupabaseAdminClient()
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
      user_metadata: { sitterId: sitter._id, isTeamMember: isTeamMember ? true : false },
    })
    if (createError) {
      // Roll back Sanity doc creation
      await serverClient.delete(sitter._id).catch(() => {})
      return Response.json({ error: `Supabase user creation failed: ${createError.message}` }, { status: 500 })
    }

    // 3. Send welcome email
    const displayName = name.trim().split(' ')[0] || 'there'
    await resend.emails.send({
      from: 'Purrfect Love <no-reply@purrfectlove.org>',
      replyTo: 'support@purrfectlove.org',
      to: [normalizedEmail],
      subject: 'Welcome to the Purrfect Love Community 🐾',
      html: buildWelcomeHtml(displayName),
      text: `Hi ${displayName},\n\nWelcome to the Purrfect Love Community! Your account has been created.\n\nLog in at purrfectlove.org/care/login\n\n– The Purrfect Love Team`,
    })

    await serverClient.patch(sitter._id).set({ welcomeSent: true }).commit()

    return Response.json({ success: true, sitterId: sitter._id })
  } catch (error) {
    console.error('add-member error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function buildWelcomeHtml(displayName) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;background-color:#FFF8F0;color:#2D2D2D;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <tr><td style="background:#2C5F4F;padding:28px 32px;text-align:center;">
          <h1 style="margin:0;font-family:'Trebuchet MS',sans-serif;font-size:24px;color:#F6F4F0;font-weight:700;">Purrfect Love</h1>
        </td></tr>
        <tr><td style="padding:40px 32px;">
          <p style="font-size:16px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">Hi ${displayName},</p>
          <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
            Welcome to the <strong>Purrfect Love Community</strong>! 🐾 Your account has been created.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="background:#2C5F4F;border-radius:8px;padding:12px 24px;">
              <a href="https://purrfectlove.org/care/login" style="color:#F6F4F0;text-decoration:none;font-size:15px;font-weight:700;font-family:'Trebuchet MS',sans-serif;">Log in to the Community →</a>
            </td></tr>
          </table>
          <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0;">– The Purrfect Love Team</p>
        </td></tr>
        <tr><td style="background:#F5F0E8;padding:20px 32px;text-align:center;border-top:1px solid #E8E4DC;">
          <p style="margin:0;font-size:13px;color:#6B6B6B;font-weight:600;">Purrfect Love · Cat Adoption &amp; Rescue</p>
          <p style="margin:4px 0 0;font-size:12px;color:#999;"><a href="https://purrfectlove.org" style="color:#C85C3F;text-decoration:none;">purrfectlove.org</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
