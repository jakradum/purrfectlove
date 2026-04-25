'use server'

import { createClient } from '@sanity/client'
import { Resend } from 'resend'
import { createSupabaseAdminClient, createSupabaseDbClient } from '@/lib/supabaseServer'
import { computeCohort } from '@/lib/cohort'
import { writeAuditLog } from '@/lib/auditLog'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const resend = new Resend(process.env.RESEND_API_KEY)

async function findSupabaseUserByEmail(supabaseAdmin, email) {
  let page = 1
  while (true) {
    const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000, page })
    const users = data?.users ?? []
    const found = users.find(u => u.email === email)
    if (found) return found
    if (users.length < 1000) return null
    page++
  }
}

// Shared approval logic — called from both the email-link GET and this Studio action
async function runApproval(req, sanityRequestId) {
  const supabaseAdmin = createSupabaseAdminClient()

  let sitter
  if (req.email) {
    const existing = await serverClient.fetch(
      `*[_type == "catSitter" && email == $email][0]{ _id }`,
      { email: req.email }
    )
    if (existing) {
      await serverClient.patch(existing._id).set({ admitted: true, memberVerified: true }).commit()
      sitter = existing
    }
  }
  if (!sitter) {
    sitter = await serverClient.create({
      _type: 'catSitter',
      name: req.name || null,
      phone: req.phone || null,
      email: req.email || null,
      admitted: true,
      memberVerified: true,
      welcomeSent: false,
    })
  }

  if (req.email) {
    try {
      const existingUser = await findSupabaseUserByEmail(supabaseAdmin, req.email)
      if (existingUser) {
        if (existingUser.user_metadata?.sitterId !== sitter._id) {
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            user_metadata: { ...existingUser.user_metadata, sitterId: sitter._id },
          })
        }
      } else {
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: req.email,
          email_confirm: true,
          user_metadata: { sitterId: sitter._id, isTeamMember: false },
        })
        if (createErr) {
          console.error('approveRequest: createUser error:', createErr)
        } else if (created?.user?.id) {
          const cohort = computeCohort(created.user.id, false)
          await supabaseAdmin.auth.admin.updateUserById(created.user.id, {
            user_metadata: { sitterId: sitter._id, isTeamMember: false, cohort },
          })
        }
      }
    } catch (err) {
      console.error('approveRequest: Supabase user sync failed:', err)
    }
  }

  let emailSent = false
  if (req.email) {
    try {
      const displayName = (req.name || 'there').split(' ')[0]
      await resend.emails.send({
        from: 'Purrfect Love <no-reply@purrfectlove.org>',
        to: [req.email],
        subject: 'Welcome to the Purrfect Love Community',
        html: buildWelcomeHtml(displayName),
        text: `Hi ${displayName},\n\nWelcome to the Purrfect Love Community! Your application has been approved.\n\nLog in at https://care.purrfectlove.org/login\n\n– The Purrfect Love Team`,
      })
      emailSent = true
    } catch (err) {
      console.error('approveRequest: welcome email failed:', err)
    }
  }

  await serverClient.patch(sitter._id).set({ welcomeSent: emailSent }).commit()

  if (sanityRequestId) {
    serverClient.patch(sanityRequestId).set({ status: 'approved' }).commit().catch(() => {})
  }

  writeAuditLog({
    action: 'member_approved',
    actorId: 'studio',
    targetId: sitter._id,
    targetName: req.name || null,
    details: { email: req.email || null, supabaseRequestId: req.id || null },
  }).catch(() => {})

  return { emailSent }
}

export async function approveRequest(requestId) {
  if (!requestId) return { error: 'requestId is required' }

  try {
    const membershipReq = await serverClient.fetch(
      `*[_type == "membershipRequest" && _id == $id][0]{ _id, name, email, phone, supabaseRequestId, status }`,
      { id: requestId }
    )
    if (!membershipReq) return { error: 'Request not found' }
    if (membershipReq.status === 'approved') return { success: true, alreadyApproved: true }
    if (membershipReq.status === 'entry_denied') return { error: 'This request has been denied and cannot be approved.' }

    if (membershipReq.email) {
      const denied = await serverClient.fetch(
        `*[_type == "catSitter" && email == $email && admitted == false][0]._id`,
        { email: membershipReq.email }
      )
      if (denied) return { error: 'This applicant was previously denied. Update their Sanity record to override.' }
    }

    const db = createSupabaseDbClient()
    if (membershipReq.supabaseRequestId) {
      const { data: locked } = await db
        .from('membership_requests')
        .update({ status: 'approved' })
        .eq('id', membershipReq.supabaseRequestId)
        .eq('status', 'pending')
        .select('id')
        .single()

      if (!locked) {
        serverClient.patch(requestId).set({ status: 'approved' }).commit().catch(() => {})
        return { success: true, alreadyApproved: true }
      }
    }

    const { emailSent } = await runApproval(
      { ...membershipReq, id: membershipReq.supabaseRequestId },
      requestId
    )
    return { success: true, emailSent, email: membershipReq.email }
  } catch (err) {
    console.error('approveRequest action error:', err)
    return { error: 'Internal server error' }
  }
}

export async function rejectRequest(requestId) {
  if (!requestId) return { error: 'requestId is required' }

  try {
    const membershipReq = await serverClient.fetch(
      `*[_type == "membershipRequest" && _id == $id][0]{ _id, name, email, supabaseRequestId, status }`,
      { id: requestId }
    )
    if (!membershipReq) return { error: 'Request not found' }
    if (membershipReq.status === 'entry_denied') return { success: true, alreadyDenied: true }
    if (membershipReq.status === 'approved') return { error: 'This request has already been approved.' }

    const db = createSupabaseDbClient()
    if (membershipReq.supabaseRequestId) {
      await db
        .from('membership_requests')
        .update({ status: 'entry_denied' })
        .eq('id', membershipReq.supabaseRequestId)
        .eq('status', 'pending')
    }

    let deniedId = null
    if (membershipReq.email) {
      const existing = await serverClient.fetch(
        `*[_type == "catSitter" && email == $email][0]{ _id, admitted }`,
        { email: membershipReq.email }
      )
      if (existing) {
        await serverClient.patch(existing._id).set({ admitted: false }).commit()
        deniedId = existing._id
      } else {
        const denied = await serverClient.create({
          _type: 'catSitter',
          name: membershipReq.name || null,
          email: membershipReq.email,
          admitted: false,
          memberVerified: false,
          welcomeSent: false,
        })
        deniedId = denied._id
      }
    }

    serverClient.patch(requestId).set({ status: 'entry_denied' }).commit().catch(() => {})

    writeAuditLog({
      action: 'member_rejected',
      actorId: 'studio',
      targetId: deniedId || null,
      targetName: membershipReq.name || null,
      details: { email: membershipReq.email || null, supabaseRequestId: membershipReq.supabaseRequestId },
    }).catch(() => {})

    return { success: true }
  } catch (err) {
    console.error('rejectRequest action error:', err)
    return { error: 'Internal server error' }
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
        <tr>
          <td style="background:#2C5F4F;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;font-family:'Trebuchet MS',sans-serif;font-size:24px;color:#F6F4F0;font-weight:700;">Purrfect Love</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;">
            <p style="font-size:16px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">Hi ${displayName},</p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
              Welcome to the <strong>Purrfect Love Community</strong>! Your application has been approved and your account is ready.
            </p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 24px;">
              You can log in using your email at the link below.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="background:#2C5F4F;border-radius:8px;padding:12px 24px;">
                  <a href="https://care.purrfectlove.org/login" style="color:#F6F4F0;text-decoration:none;font-size:15px;font-weight:700;font-family:'Trebuchet MS',sans-serif;">Log in to the Community →</a>
                </td>
              </tr>
            </table>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0;">– The Purrfect Love Team</p>
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
</html>`
}
