import { createClient } from '@sanity/client'
import { getSupabaseUser, createSupabaseAdminClient, createSupabaseDbClient } from '@/lib/supabaseServer'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export async function POST(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sitterId = user.sitterId

    // Fetch the sitter document to get phone/email before deleting
    const sitter = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ phone, email }`,
      { id: sitterId }
    )

    if (sitter) {
      const { phone, email } = sitter

      // Delete associated OTP codes
      if (phone || email) {
        await serverClient.delete({
          query: '*[_type == "otpCode" && (phone == $phone || email == $email)]',
          params: { phone: phone || '', email: email || '' },
        })
      }
    }

    // Delete the catSitter document
    await serverClient.delete(sitterId)

    // Purge all Sanity documents containing the user's personal data
    await Promise.allSettled([
      // Messages (sent or received)
      serverClient.delete({
        query: `*[_type == "message" && (from._ref == $id || to._ref == $id)]`,
        params: { id: sitterId },
      }),
      // Bug reports / portal feedback submitted by this user
      serverClient.delete({
        query: `*[_type == "portalFeedback" && submittedBy._ref == $id]`,
        params: { id: sitterId },
      }),
      // Member reports (as reporter or subject)
      serverClient.delete({
        query: `*[_type == "memberReport" && (reporter._ref == $id || reportedMember._ref == $id)]`,
        params: { id: sitterId },
      }),
      // In-app notifications addressed to this user
      serverClient.delete({
        query: `*[_type == "notification" && recipient._ref == $id]`,
        params: { id: sitterId },
      }),
      // Block relationships involving this user
      serverClient.delete({
        query: `*[_type == "blockedUser" && (blocker._ref == $id || blocked._ref == $id)]`,
        params: { id: sitterId },
      }),
    ])

    // Soft-delete all bookings involving this user in Supabase
    // (preserves booking history for the other party while removing the association)
    const db = createSupabaseDbClient()
    await db
      .from('bookings')
      .update({ deleted_at: new Date().toISOString() })
      .or(`parent_id.eq.${sitterId},sitter_id.eq.${sitterId}`)
      .is('deleted_at', null)

    // Delete the Supabase auth user — completes GDPR right to erasure
    const supabaseAdmin = createSupabaseAdminClient()
    await supabaseAdmin.auth.admin.deleteUser(user.user.id)

    return Response.json({ success: true })
  } catch (error) {
    console.error('delete-account error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
