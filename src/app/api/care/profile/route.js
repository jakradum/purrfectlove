import { createClient } from '@sanity/client'
import { verifyToken } from '@/lib/careAuth'
import { cookies } from 'next/headers'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

async function getAuth(request) {
  // Try cookie from request headers first
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/care-auth=([^;]+)/)
  const token = match ? match[1] : null
  if (!token) return null
  return verifyToken(token)
}

export async function GET(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sitter = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]`,
      { id: payload.sitterId }
    )

    if (!sitter) {
      return Response.json({ error: 'Profile not found' }, { status: 404 })
    }

    return Response.json(sitter)
  } catch (error) {
    console.error('profile GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Only allow member-editable fields
    const allowedFields = [
      'name', 'contactPreference', 'bio', 'bedrooms', 'householdSize',
      'cats', 'alwaysAvailable', 'unavailableDates', 'availableDates',
      'maxCats', 'feedingTypes', 'behavioralTraits', 'canSit', 'needsSitting',
    ]

    const patch = {}
    for (const field of allowedFields) {
      if (field in body) {
        patch[field] = body[field]
      }
    }

    const updated = await serverClient
      .patch(payload.sitterId)
      .set(patch)
      .commit()

    return Response.json(updated)
  } catch (error) {
    console.error('profile PATCH error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
