import { createClient } from '@sanity/client'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export async function POST(request) {
  try {
    const body = await request.json()
    const { token, responses } = body

    if (!token || typeof token !== 'string') {
      return Response.json({ error: 'Missing token' }, { status: 400 })
    }

    const application = await serverClient.fetch(
      `*[_type == "application" && feedbackToken == $token][0]{ _id, feedbackSubmittedAt }`,
      { token }
    )

    if (!application) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    if (application.feedbackSubmittedAt) {
      return Response.json({ error: 'Feedback already submitted' }, { status: 409 })
    }

    await serverClient
      .patch(application._id)
      .set({
        feedbackResponses: responses ?? {},
        feedbackSubmittedAt: new Date().toISOString(),
      })
      .commit()

    return Response.json({ success: true })
  } catch (error) {
    console.error('feedback/submit error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
