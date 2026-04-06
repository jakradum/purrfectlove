/**
 * Purge all bookingRequest and membershipRequest documents from Sanity.
 * Run once after confirming Supabase data is correct.
 *
 * Usage:
 *   node --env-file=.env.local scripts/purgeSanityDocs.mjs --dry-run
 *   node --env-file=.env.local scripts/purgeSanityDocs.mjs
 */

import { createClient } from '@sanity/client'

const DRY_RUN = process.argv.includes('--dry-run')

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const TYPES = ['bookingRequest', 'membershipRequest']

async function run() {
  console.log(`\n🗑  Purging Sanity documents${DRY_RUN ? ' [DRY RUN]' : ''}\n`)

  for (const type of TYPES) {
    const docs = await sanity.fetch(`*[_type == $type]{ _id }`, { type })
    console.log(`Found ${docs.length} ${type} document(s)`)

    if (docs.length === 0) continue

    if (DRY_RUN) {
      docs.forEach(d => console.log(`  would delete: ${d._id}`))
      continue
    }

    const ids = docs.map(d => d._id)
    const tx = sanity.transaction()
    ids.forEach(id => tx.delete(id))
    await tx.commit()
    console.log(`  ✅ Deleted ${ids.length} ${type} document(s)`)
  }

  console.log(`\n${DRY_RUN ? '✅ Dry run complete — no documents deleted.' : '✅ Done.'}\n`)
}

run().catch(err => { console.error(err); process.exit(1) })
