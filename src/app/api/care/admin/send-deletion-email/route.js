import { createClient } from '@sanity/client'
import { Resend } from 'resend'

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
    const { documentId } = await request.json()

    if (!documentId) {
      return Response.json({ error: 'documentId is required' }, { status: 400 })
    }

    // Fetch the document — must be a deletion-requested catSitter
    const doc = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id && deletionRequested == true][0]{
        _id, email, username, name, deletionReason
      }`,
      { id: documentId }
    )

    if (!doc) {
      return Response.json({ error: 'Document not found or deletion not requested' }, { status: 404 })
    }

    const displayName = doc.username || doc.name || 'there'

    // Step 1: Send confirmation email (non-fatal if no email on file)
    if (doc.email) {
      await resend.emails.send({
        from: 'Purrfect Love <no-reply@purrfectlove.org>',
        replyTo: 'support@purrfectlove.org',
        to: [doc.email],
        subject: 'Your Purrfect Love Community account has been deleted',
        html: `<!DOCTYPE html>
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
            <p style="font-size:16px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">Hi ${displayName},</p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
              Your Purrfect Love Community account has been deleted as requested.
            </p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0;">
              – The PL Team
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#F5F0E8;padding:20px 32px;text-align:center;border-top:1px solid #E8E4DC;">
            <p style="margin:0;font-size:13px;color:#6B6B6B;font-weight:600;">Purrfect Love · Cat Adoption &amp; Rescue</p>
            <p style="margin:4px 0 0;font-size:12px;color:#999;">
              <a href="https://purrfectlove.org" style="color:#C85C3F;text-decoration:none;">purrfectlove.org</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        text: `Hi ${displayName},\n\nYour Purrfect Love Community account has been deleted as requested.\n\n– The PL Team`,
      })
    }

    // Step 2: Create deletedAccount audit record (before deleting the doc so we have the data)
    await serverClient.create({
      _type: 'deletedAccount',
      generatedUsername: doc.username || null,
      deletedAt: new Date().toISOString(),
      reason: doc.deletionReason || null,
    })

    // Step 3: Delete the catSitter document
    await serverClient.delete(documentId)

    return Response.json({ success: true })
  } catch (error) {
    console.error('send-deletion-email error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
