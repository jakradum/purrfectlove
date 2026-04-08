import { createClient } from '@sanity/client'
import { getSupabaseUser, createSupabaseAdminClient } from '@/lib/supabaseServer'

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

    const body = await request.json()
    const { body: reportBody, pageUrl, screenshotUrl } = body

    if (!reportBody || reportBody.trim().length === 0) {
      return Response.json({ error: 'Report body is required' }, { status: 400 })
    }

    await serverClient.create({
      _type: 'portalFeedback',
      body: reportBody.trim(),
      pageUrl: pageUrl || null,
      screenshotUrl: screenshotUrl || null,
      submittedBy: user.sitterId
        ? { _type: 'reference', _ref: user.sitterId }
        : undefined,
      date: new Date().toISOString().slice(0, 10),
      status: 'new',
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('bugreport error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
