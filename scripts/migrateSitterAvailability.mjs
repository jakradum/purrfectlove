// scripts/migrateSitterAvailability.mjs
// One-time script: copies availability data from Sanity catSitter documents
// into the new Supabase sitter_availability table.
//
// Usage:
//   node --env-file=.env.local scripts/migrateSitterAvailability.mjs --dry-run
//   node --env-file=.env.local scripts/migrateSitterAvailability.mjs

import { createClient as createSanity } from '@sanity/client'
import { createClient as createSupabase } from '@supabase/supabase-js'

const sanity = createSanity({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token:     process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const supabase = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const dryRun = process.argv.includes('--dry-run')

async function main() {
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Fetching all catSitter documents from Sanity…`)

  const members = await sanity.fetch(
    `*[_type == "catSitter"]{ _id, availabilityDefault, unavailableDatesV2, blockedByBooking }`
  )
  console.log(`Found ${members.length} members.\n`)

  let migrated = 0
  let skipped = 0

  for (const m of members) {
    const row = {
      sitter_id:            m._id,
      availability_default: m.availabilityDefault || 'available',
      unavailable_dates:    m.unavailableDatesV2   || [],
      blocked_by_booking:   m.blockedByBooking     || [],
    }

    const hasData = row.unavailable_dates.length > 0 || row.blocked_by_booking.length > 0 || row.availability_default !== 'available'

    if (dryRun) {
      console.log(`  [dry-run] ${m._id}  default=${row.availability_default}  unavailable=${row.unavailable_dates.length}d  blocked=${row.blocked_by_booking.length}d`)
      migrated++
      continue
    }

    const { error } = await supabase
      .from('sitter_availability')
      .upsert(row, { onConflict: 'sitter_id' })

    if (error) {
      console.error(`  ERROR ${m._id}:`, error.message)
      skipped++
    } else {
      console.log(`  ✓ ${m._id}  default=${row.availability_default}  unavailable=${row.unavailable_dates.length}d  blocked=${row.blocked_by_booking.length}d${!hasData ? '  (empty)' : ''}`)
      migrated++
    }
  }

  console.log(`\nDone. ${migrated} upserted, ${skipped} errors.`)

  if (!dryRun) {
    console.log('\nVerifying row count in Supabase…')
    const { count } = await supabase.from('sitter_availability').select('*', { count: 'exact', head: true })
    console.log(`sitter_availability rows: ${count} (expected ${members.length})`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
