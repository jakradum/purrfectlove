import { createClient } from '@sanity/client'
import { verifyToken } from '@/lib/careAuth'
import { generateUniqueUsername } from '@/lib/generateUsername'

const sanity = createClient({
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
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if already regenerated
    const sitter = await sanity.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ usernameRegenerated }`,
      { id: payload.sitterId }
    )
    if (sitter?.usernameRegenerated) {
      return Response.json({ error: 'Username can only be regenerated once.' }, { status: 403 })
    }

    const username = await generateUniqueUsername(sanity)
    await sanity.patch(payload.sitterId).set({ username, usernameRegenerated: true }).commit()

    return Response.json({ username })
  } catch (err) {
    console.error('regenerate-username error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
