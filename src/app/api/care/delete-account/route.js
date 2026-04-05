import { createClient } from '@sanity/client'
import { getSupabaseUser } from '@/lib/supabaseServer'

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

    return Response.json({ success: true })
  } catch (error) {
    console.error('delete-account error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
