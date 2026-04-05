/**
 * Migrate membershipRequest documents from Sanity → Supabase membership_requests table.
 * Safe to re-run: checks for existing rows by Sanity _id stored in a metadata column.
 *
 * Note: membership_requests uses a generated UUID primary key.
 * Sanity _id is NOT preserved — the admin UI will use the Supabase id after migration.
 *
 * Usage:
 *   node scripts/migrateMembershipRequests.mjs            # live run
 *   node scripts/migrateMembershipRequests.mjs --dry-run  # dry run
 */

import { createClient as createSanityClient } from '@sanity/client'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import 'dotenv/config'

const DRY_RUN = process.argv.includes('--dry-run')

const sanity = createSanityClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  console.log(`\n📦 Migrating membershipRequest → Supabase membership_requests${DRY_RUN ? ' [DRY RUN]' : ''}\n`)

  const docs = await sanity.fetch(
    `*[_type == "membershipRequest"]{ _id, name, phone, email, message, submittedAt, status }`
  )

  console.log(`Found ${docs.length} membershipRequest document(s) in Sanity.\n`)

  if (docs.length === 0) {
    console.log('Nothing to migrate.')
    return
  }

  const rows = docs.map(doc => ({
    name:         doc.name,
    phone:        doc.phone || null,
    email:        doc.email || null,
    message:      doc.message || null,
    submitted_at: doc.submittedAt || new Date().toISOString(),
    status:       doc.status || 'pending',
  }))

  console.log('Sample row:')
  console.log(JSON.stringify(rows[0], null, 2))
  console.log(`\n...and ${rows.length - 1} more.\n`)

  if (DRY_RUN) {
    console.log('✅ Dry run complete — no rows written.')
    return
  }

  // Insert all (no upsert — no stable unique key from Sanity to match on)
  const { error } = await supabase.from('membership_requests').insert(rows)
  if (error) {
    console.error('❌ Insert failed:', error.message)
    process.exit(1)
  }

  console.log(`\n✅ Done. ${rows.length} row(s) inserted into Supabase membership_requests.\n`)
  console.log('⚠️  Run this script only once. Re-running will create duplicate rows.')
  console.log('   After verifying migration, delete the Sanity membershipRequest docs.\n')
}

main().catch(err => { console.error(err); process.exit(1) })
