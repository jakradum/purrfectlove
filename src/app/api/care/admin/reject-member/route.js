import { createClient } from '@sanity/client'
import { Resend } from 'resend'
import { getSupabaseUser, createSupabaseDbClient } from '@/lib/supabaseServer'

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

    const { requestId } = await request.json()
    if (!requestId) return Response.json({ error: 'requestId is required' }, { status: 400 })

    const db = createSupabaseDbClient()

    const { data: req, error: fetchError } = await db
      .from('membership_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !req) return Response.json({ error: 'Request not found' }, { status: 404 })
    if (req.status === 'rejected') return Response.json({ error: 'Already rejected' }, { status: 409 })

    await db.from('membership_requests').update({ status: 'rejected' }).eq('id', requestId)

    // Send rejection email if they have one
    if (req.email) {
      const displayName = req.name || 'there'
      await resend.emails.send({
        from: 'Purrfect Love <no-reply@purrfectlove.org>',
        replyTo: 'support@purrfectlove.org',
        to: [req.email],
        subject: 'Regarding your Purrfect Love Community application',
        html: `<!DOCTYPE html>
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
            Thank you for your interest in joining the Purrfect Love Community. After reviewing your application, we are unable to approve it at this time.
          </p>
          <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0;">
            If you have any questions, please reach out to us at <a href="mailto:support@purrfectlove.org" style="color:#C85C3F;">support@purrfectlove.org</a>.
          </p>
          <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:24px 0 0;">– The Purrfect Love Team</p>
        </td></tr>
        <tr><td style="background:#F5F0E8;padding:20px 32px;text-align:center;border-top:1px solid #E8E4DC;">
          <p style="margin:0;font-size:13px;color:#6B6B6B;font-weight:600;">Purrfect Love · Cat Adoption &amp; Rescue</p>
          <p style="margin:4px 0 0;font-size:12px;color:#999;"><a href="https://purrfectlove.org" style="color:#C85C3F;text-decoration:none;">purrfectlove.org</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        text: `Hi ${displayName},\n\nThank you for your interest in the Purrfect Love Community. After reviewing your application, we are unable to approve it at this time.\n\nIf you have questions, please email support@purrfectlove.org.\n\n– The Purrfect Love Team`,
      })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('reject-member error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
