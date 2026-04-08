/**
 * TESTA Sharma auto-accept bot.
 *
 * Polls Supabase every 2 seconds for pending bookings assigned to TESTA Sharma
 * and immediately accepts them — including cancelling the parent's other pending
 * requests for overlapping dates (mirrors the production accept flow).
 *
 * Usage:
 *   1. Run setup-testa.mjs once to create the Sanity profile and get the _id.
 *   2. Paste that _id below as TESTA_SITTER_ID.
 *   3. node scripts/testa-auto-accept.mjs
 *
 * Uses Supabase SERVICE ROLE key — keep this script local, never commit secrets.
 */

import { createClient as createSupabase } from '@supabase/supabase-js';
import { createClient as createSanity }   from '@sanity/client';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

// ── CONFIGURE THIS ────────────────────────────────────────────────────────────
const TESTA_SITTER_ID = 'jSzIV9KGh2VLJ9xNYx3zjB'; // TESTA Sharma — created 2026-04-08
// ─────────────────────────────────────────────────────────────────────────────

if (TESTA_SITTER_ID === 'PASTE_SANITY_ID_HERE') {
  console.error('Set TESTA_SITTER_ID first — run setup-testa.mjs to get it.');
  process.exit(1);
}

const db = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // service role bypasses RLS
);

const sanity = createSanity({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:    process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token:      process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

function formatDate(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function acceptBooking(booking) {
  const ref   = booking.booking_ref;
  const start = booking.start_date;
  const end   = booking.end_date;

  // 1. Race check: parent already confirmed with someone else?
  const { data: alreadyConfirmed } = await db
    .from('bookings')
    .select('id')
    .eq('parent_id', booking.parent_id)
    .in('status', ['confirmed', 'accepted'])
    .neq('id', booking.id)
    .lte('start_date', end)
    .gte('end_date', start)
    .limit(1);

  if (alreadyConfirmed?.length > 0) {
    console.log(`  ⚠ #${ref}: parent already confirmed with another sitter — skipping`);
    // Mark unavailable so we stop retrying
    await db.from('bookings').update({ status: 'unavailable' }).eq('id', booking.id);
    return;
  }

  // 2. Atomic confirm (only succeeds if still pending)
  const { data: confirmed } = await db
    .from('bookings')
    .update({ status: 'confirmed', responded_at: new Date().toISOString() })
    .eq('id', booking.id)
    .eq('status', 'pending')
    .select('id');

  if (!confirmed?.length) {
    console.log(`  ⚠ #${ref}: lost the race — already changed`);
    return;
  }

  console.log(`  ✓ #${ref} confirmed (${formatDate(start)} – ${formatDate(end)})`);

  // 3. Cancel TESTA's own overlapping pending bookings
  const { data: sitterOverlap } = await db
    .from('bookings')
    .select('id, booking_ref')
    .neq('id', booking.id)
    .eq('sitter_id', TESTA_SITTER_ID)
    .eq('status', 'pending')
    .lte('start_date', end)
    .gte('end_date', start);

  if (sitterOverlap?.length) {
    await db.from('bookings').update({ status: 'unavailable' }).in('id', sitterOverlap.map(b => b.id));
    console.log(`    → marked ${sitterOverlap.length} of TESTA's other overlapping bookings unavailable`);
  }

  // 4. Cancel the parent's other pending requests for overlapping dates
  const { data: parentOverlap } = await db
    .from('bookings')
    .select('id, booking_ref, sitter_id')
    .eq('parent_id', booking.parent_id)
    .eq('status', 'pending')
    .neq('id', booking.id)
    .lte('start_date', end)
    .gte('end_date', start);

  if (parentOverlap?.length) {
    await db.from('bookings').update({ status: 'unavailable' }).in('id', parentOverlap.map(b => b.id));
    console.log(`    → cancelled ${parentOverlap.length} other pending requests from same parent`);
  }

  // 5. Create sitRecord in Sanity (mirrors production flow)
  try {
    await sanity.create({
      _type:      'sitRecord',
      sitter:     { _type: 'reference', _ref: TESTA_SITTER_ID },
      parent:     { _type: 'reference', _ref: booking.parent_id },
      startDate:  start,
      endDate:    end,
      bookingRef: ref,
      createdAt:  new Date().toISOString(),
    });
    console.log(`    → sitRecord created in Sanity`);
  } catch (e) {
    console.warn('    ⚠ sitRecord creation failed:', e.message);
  }

  // NOTE: Emails are intentionally skipped in test mode.
}

async function tick() {
  const { data: pending, error } = await db
    .from('bookings')
    .select('*')
    .eq('sitter_id', TESTA_SITTER_ID)
    .eq('status', 'pending');

  if (error) { console.error('Supabase error:', error.message); return; }
  if (!pending?.length) return;

  console.log(`[${new Date().toISOString()}] Found ${pending.length} pending booking(s) for TESTA`);
  for (const booking of pending) {
    await acceptBooking(booking);
  }
}

console.log(`TESTA Sharma auto-accept bot running (sitter_id: ${TESTA_SITTER_ID})`);
console.log('Polling every 2s — Ctrl+C to stop\n');
tick();
setInterval(tick, 2000);
