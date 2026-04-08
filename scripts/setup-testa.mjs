/**
 * One-time setup: creates the TESTA Sharma test sitter profile in Sanity.
 *
 * Run once:
 *   node scripts/setup-testa.mjs
 *
 * Copy the printed _id into scripts/testa-auto-accept.mjs as TESTA_SITTER_ID.
 *
 * Location: VGRX+MF Bengaluru ≈ 12.9784° N, 77.5918° E (Shivajinagar area).
 * Verify / adjust at: https://maps.google.com/?q=VGRX%2BMF+Bengaluru
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token:     process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function run() {
  // Guard: don't create duplicates
  const existing = await client.fetch(
    `*[_type == "catSitter" && name == "TESTA Sharma"][0]{ _id }`
  );
  if (existing) {
    console.log(`✓ TESTA Sharma already exists: ${existing._id}`);
    console.log('  Set TESTA_SITTER_ID =', existing._id, 'in scripts/testa-auto-accept.mjs');
    return;
  }

  const doc = await client.create({
    _type: 'catSitter',
    name:  'TESTA Sharma',
    email: 'test+testa@purrfectlove.org',
    location: {
      lat:  12.9784,
      lng:  77.5918,
      name: 'Shivajinagar',  // VGRX+MF Bengaluru approximate
    },
    bio: '[TEST ACCOUNT] Auto-accepts all booking requests. Do not use for real sits.',
    locale: 'en',
    alwaysAvailable: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  });

  console.log('✓ Created TESTA Sharma');
  console.log('  _id:', doc._id);
  console.log('\nNext step: set TESTA_SITTER_ID =', `'${doc._id}'`, 'in scripts/testa-auto-accept.mjs');
}

run().catch(err => { console.error(err); process.exit(1); });
