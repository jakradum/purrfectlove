import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export async function adjustScore(memberId, change, reason) {
  const member = await sanity.fetch(
    `*[_type == "catSitter" && _id == $id][0]{ memberScore, scoreHistory }`,
    { id: memberId }
  )
  const currentScore = member?.memberScore ?? 100
  await sanity
    .patch(memberId)
    .set({ memberScore: Math.max(0, currentScore + change) })
    .append('scoreHistory', [{ change, reason, timestamp: new Date().toISOString() }])
    .commit()
}
