/**
 * Migrate bookingRequest documents from Sanity → Supabase bookings table.
 * Safe to re-run: uses upsert (ON CONFLICT DO NOTHING on id).
 *
 * Usage:
 *   node scripts/migrateBookings.mjs            # live run
 *   node scripts/migrateBookings.mjs --dry-run  # dry run, no writes
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
  console.log(`\n📦 Migrating bookingRequest → Supabase bookings${DRY_RUN ? ' [DRY RUN]' : ''}\n`)

  const docs = await sanity.fetch(
    `*[_type == "bookingRequest"]{
      _id, bookingRef, status, startDate, endDate,
      cats, message, createdAt,
      notifiedAt, notificationDelivered, respondedAt, responseTimeHours,
      cancellationReason, cancelledBy, cancelledAt,
      "sitterId": sitter._ref,
      "parentId": parent._ref
    }`
  )

  console.log(`Found ${docs.length} bookingRequest document(s) in Sanity.\n`)

  if (docs.length === 0) {
    console.log('Nothing to migrate.')
    return
  }

  const rows = docs.map(doc => ({
    id:                     doc._id,
    booking_ref:            doc.bookingRef || `LEGACY-${doc._id.slice(0, 8)}`,
    sitter_id:              doc.sitterId,
    parent_id:              doc.parentId,
    start_date:             doc.startDate,
    end_date:               doc.endDate,
    cats:                   doc.cats || [],
    message:                doc.message || null,
    status:                 doc.status || 'pending',
    created_at:             doc.createdAt || new Date().toISOString(),
    notified_at:            doc.notifiedAt || null,
    notification_delivered: doc.notificationDelivered || false,
    responded_at:           doc.respondedAt || null,
    response_time_hours:    doc.responseTimeHours ?? null,
    cancellation_reason:    doc.cancellationReason || null,
    cancelled_by:           doc.cancelledBy || null,
    cancelled_at:           doc.cancelledAt || null,
  }))

  // Log sample
  console.log('Sample row:')
  console.log(JSON.stringify(rows[0], null, 2))
  console.log(`\n...and ${rows.length - 1} more.\n`)

  if (DRY_RUN) {
    console.log('✅ Dry run complete — no rows written.')
    return
  }

  // Upsert in batches of 50
  const BATCH = 50
  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase
      .from('bookings')
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: true })
    if (error) {
      console.error(`❌ Batch ${Math.floor(i / BATCH) + 1} failed:`, error.message)
      process.exit(1)
    }
    inserted += batch.length
    console.log(`  Upserted ${inserted}/${rows.length}`)
  }

  console.log(`\n✅ Done. ${inserted} row(s) upserted into Supabase bookings.\n`)
}

main().catch(err => { console.error(err); process.exit(1) })
