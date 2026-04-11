/**
 * Task 5b — Seed Supabase with all verified care portal members
 *
 * Fetches all catSitter docs where memberVerified == true, then creates
 * matching Supabase auth users.
 *
 * Priority:
 *   1. Has email  → createUser with email (email_confirm: true)
 *   2. Has phone  → createUser with phone (phone_confirm: true)
 *   3. Neither    → skipped (can't create without an identifier)
 *
 * Exclusions:
 *   - name contains "test" (case-insensitive)
 *   - "sanjeev kumar"
 *   - "deutschland dude"
 *   - null / blank name with no email and no phone
 *
 * Safe to re-run: already-existing Supabase accounts are skipped.
 *
 * Usage:
 *   node scripts/seedSupabaseUsers.mjs
 *   node scripts/seedSupabaseUsers.mjs --dry-run
 */

import { createClient as createSanityClient } from '@sanity/client';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { computeCohort } from '../src/lib/cohort.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const DRY_RUN = process.argv.includes('--dry-run');
const BACKFILL = process.argv.includes('--backfill');

const SKIP_NAMES = new Set(['sanjeev kumar', 'deutschland dude']);

function shouldSkip(name) {
  if (!name) return true; // null / blank name records
  const lower = name.trim().toLowerCase();
  if (lower.includes('test')) return true;
  if (SKIP_NAMES.has(lower)) return true;
  return false;
}

// ── Sanity ──────────────────────────────────────────────────────────────────
const sanity = createSanityClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

// ── Supabase admin ──────────────────────────────────────────────────────────
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Backfill: assign cohort to all existing users that lack one ───────────────
async function backfill() {
  if (DRY_RUN) console.log('⚙  DRY RUN — no Supabase writes\n');
  console.log('── Cohort backfill ──────────────────────────────────────────\n');

  const results = { updated: 0, skipped: 0, errors: [] };
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) { console.error('listUsers error:', error.message); break; }
    const users = data?.users ?? [];
    if (!users.length) break;

    for (const user of users) {
      const meta = user.user_metadata ?? {};

      // Never overwrite an existing cohort assignment
      if (meta.cohort != null) {
        results.skipped++;
        continue;
      }

      // Team members stay null — skip
      if (meta.isTeamMember === true) {
        results.skipped++;
        continue;
      }

      const cohort = computeCohort(user.id, false);

      if (DRY_RUN) {
        console.log(`  [dry-run] uid=${user.id} → cohort=${cohort}`);
        continue;
      }

      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...meta, cohort },
      });

      if (updateErr) {
        results.errors.push({ id: user.id, message: updateErr.message });
        console.log(`  ✗  uid=${user.id} — ${updateErr.message}`);
      } else {
        results.updated++;
        console.log(`  ✓  uid=${user.id} → cohort=${cohort}`);
      }
    }

    if (!data.nextPage) break;
    page++;
  }

  if (!DRY_RUN) {
    console.log('\n── Summary ──────────────────────────────────────────────');
    console.log(`  Updated        : ${results.updated}`);
    console.log(`  Skipped        : ${results.skipped} (already had cohort or team member)`);
    console.log(`  Errors         : ${results.errors.length}`);
    if (results.errors.length) {
      console.log('\n  Error details:');
      for (const e of results.errors) console.log(`    uid=${e.id}: ${e.message}`);
    }
    if (results.errors.length === 0) console.log('\n✅ Done.');
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (BACKFILL) return backfill();
  if (DRY_RUN) console.log('⚙  DRY RUN — no Supabase writes\n');

  const catSitters = await sanity.fetch(
    `*[_type == "catSitter" && memberVerified == true]{ _id, name, email, phone, siteAdmin }`
  );
  console.log(`Fetched ${catSitters.length} verified catSitter(s).\n`);

  const results = { created: 0, skipped: 0, noIdentifier: 0, errors: [] };

  for (const cs of catSitters) {
    const label = cs.name || '(no name)';

    if (shouldSkip(cs.name)) {
      console.log(`  ⊘  skipping: ${label}`);
      continue;
    }

    const email = cs.email?.trim().toLowerCase() || null;
    const phone = cs.phone?.replace(/\s+/g, '') || null;

    if (!email && !phone) {
      console.log(`  –  ${label} — no email or phone, cannot create account`);
      results.noIdentifier++;
      continue;
    }

    const via = email ? `email: ${email}` : `phone: ${phone}`;

    if (DRY_RUN) {
      console.log(`  [dry-run] ${label} — ${via} (sitterId=${cs._id})`);
      continue;
    }

    const userPayload = email
      ? { email, email_confirm: true }
      : { phone, phone_confirm: true };

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      ...userPayload,
      user_metadata: {
        sitterId: cs._id,
        isTeamMember: false,
      },
    });

    if (error) {
      if (
        error.message?.includes('already been registered') ||
        error.message?.includes('already exists') ||
        error.code === 'email_exists' ||
        error.code === 'phone_exists'
      ) {
        results.skipped++;
        console.log(`  ·  ${label} (${via}) — already exists, skipped`);
      } else {
        results.errors.push({ name: label, via, message: error.message });
        console.log(`  ✗  ${label} (${via}) — ${error.message}`);
      }
    } else {
      results.created++;
      const cohort = computeCohort(data.user.id, false);
      await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
        user_metadata: { sitterId: cs._id, isTeamMember: false, cohort },
      });
      console.log(`  ✓  ${label} (${via}) — created uid=${data.user.id} cohort=${cohort}`);
    }
  }

  if (!DRY_RUN) {
    console.log('\n── Summary ──────────────────────────────────────────────');
    console.log(`  Created        : ${results.created}`);
    console.log(`  Already existed: ${results.skipped}`);
    console.log(`  No identifier  : ${results.noIdentifier} (add email to Sanity to migrate)`);
    console.log(`  Errors         : ${results.errors.length}`);
    if (results.errors.length) {
      console.log('\n  Error details:');
      for (const e of results.errors) console.log(`    ${e.name} (${e.via}): ${e.message}`);
    }
    if (results.errors.length === 0) console.log('\n✅ Done.');
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
