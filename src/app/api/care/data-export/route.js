import { createClient } from '@sanity/client'
import { verifyToken } from '@/lib/careAuth'

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

export async function GET(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = payload.sitterId

    // Fetch all data associated with this member in parallel
    const [profile, messages, feedbackItems, memberReports] = await Promise.all([
      sanity.fetch(
        `*[_type == "catSitter" && _id == $id][0]{
          _id, _createdAt, _updatedAt, name, username, email, phone, bio, location,
          cats, canSit, needsSitting, contactPreference, bedrooms, householdSize,
          hideEmail, hideWhatsApp, newsletterOptOut, guidelinesAccepted,
          alwaysAvailable, unavailableDatesV2, feedingTypes, behavioralTraits, maxHomesPerDay,
          memberVerified, welcomeSent
        }`,
        { id }
      ),
      sanity.fetch(
        `*[_type == "message" && (from._ref == $id || to._ref == $id)] | order(createdAt asc) {
          _id, createdAt, body, read, markedAsSpam,
          "fromId": from._ref,
          "toId": to._ref
        }`,
        { id }
      ),
      sanity.fetch(
        `*[_type == "feedback" && member._ref == $id] | order(_createdAt desc) {
          _id, _createdAt, message, type
        }`,
        { id }
      ),
      sanity.fetch(
        `*[_type == "memberReport" && reporter._ref == $id] | order(_createdAt desc) {
          _id, _createdAt, reason, note, resolved
        }`,
        { id }
      ),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
      profile: profile || null,
      messages: messages || [],
      feedbackSubmitted: feedbackItems || [],
      reportsSubmitted: memberReports || [],
    }

    const json = JSON.stringify(exportData, null, 2)
    const filename = `purrfectlove-data-${id}-${new Date().toISOString().split('T')[0]}.json`

    return new Response(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('data-export error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
