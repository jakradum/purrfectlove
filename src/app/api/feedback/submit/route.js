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

    const timeframeLabels = {
      lt1month: 'Less than 1 month ago',
      '1to3': '1–3 months ago',
      '3to6': '3–6 months ago',
      gt6months: 'More than 6 months ago',
    }
    const recommendLabels = { yes: 'Yes', notsure: 'Not sure', no: 'No' }
    const r = responses ?? {}
    const lines = [
      `Adoption timeframe: ${timeframeLabels[r.adoptionTimeframe] ?? r.adoptionTimeframe ?? '—'}`,
      '',
      'Overall experience',
      `  Overall satisfaction: ${r.overallSatisfaction ?? '—'}/5`,
      `  Process clarity: ${r.processClarity ?? '—'}/5`,
      `  Team support: ${r.teamSupport ?? '—'}/5`,
      '',
      'Communication',
      `  Before adoption: ${r.commBeforeAdoption ?? '—'}/5`,
      `  After adoption: ${r.commAfterAdoption ?? '—'}/5`,
      `  Response time: ${r.responseTime ?? '—'}/5`,
      '',
      'Matching & preparation',
      `  Cat match: ${r.catMatch ?? '—'}/5`,
      `  Cat info accuracy: ${r.catInfoAccuracy ?? '—'}/5`,
      `  Prepared for arrival: ${r.preparedForArrival ?? '—'}/5`,
      '',
      'Post-adoption',
      `  Settling in: ${r.settlingIn ?? '—'}/5`,
      `  Post-adoption support: ${r.postAdoptionSupport ?? '—'}/5`,
      '',
      `What they appreciated: ${r.appreciated || '—'}`,
      `What could be improved: ${r.improvements || '—'}`,
      `Would recommend: ${recommendLabels[r.wouldRecommend] ?? r.wouldRecommend ?? '—'}`,
      `Additional comments: ${r.additionalComments || '—'}`,
    ]

    await serverClient
      .patch(application._id)
      .set({
        feedbackResponses: lines.join('\n'),
        feedbackSubmittedAt: new Date().toISOString(),
      })
      .commit()

    return Response.json({ success: true })
  } catch (error) {
    console.error('feedback/submit error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
