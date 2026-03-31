import { createClient } from '@sanity/client'
import { verifyToken } from '@/lib/careAuth'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

async function getAuth(request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/auth_token=([^;]+)/)
  const token = match ? match[1] : null
  if (!token) return null
  return verifyToken(token)
}

export async function POST(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sitterId = payload.sitterId

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

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
      },
    })
  } catch (error) {
    console.error('delete-account error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
