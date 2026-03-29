import { createClient } from '@sanity/client'
import { verifyToken } from '@/lib/careAuth'
import { adjustScore } from '@/lib/memberScore'

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
  const token = match ? decodeURIComponent(match[1]) : null
  if (!token) return null
  return verifyToken(token)
}

export async function POST(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { revieweeId, fulfilled, rating, comment } = await request.json()

    if (!revieweeId || rating == null) {
      return Response.json({ error: 'revieweeId and rating are required' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return Response.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    if (comment && comment.length > 500) {
      return Response.json({ error: 'Comment must be 500 characters or fewer' }, { status: 400 })
    }

    const reviewerId = payload.sitterId

    if (reviewerId === revieweeId) {
      return Response.json({ error: 'Cannot leave feedback for yourself' }, { status: 400 })
    }

    await serverClient.create({
      _type: 'sittingFeedback',
      reviewer: { _type: 'reference', _ref: reviewerId },
      reviewee: { _type: 'reference', _ref: revieweeId },
      fulfilled: fulfilled === true,
      rating,
      comment: comment || '',
      createdAt: new Date().toISOString(),
    })

    // Adjust reviewee score based on rating
    if (rating >= 4) {
      await adjustScore(revieweeId, 3, `Received ${rating}-star feedback`)
    } else if (rating <= 2) {
      await adjustScore(revieweeId, -5, `Received ${rating}-star feedback`)
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('feedback/submit error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
