import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { OpenLocationCode } from 'open-location-code';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

const olc = new OpenLocationCode();

// Berlin reference for expanding short codes
const BERLIN = { lat: 52.52, lng: 13.405 };

const testProfiles = [
  { name: 'Test DE 1', shortCode: 'Q5FH+XX', canSit: true,  needsSitting: false },
  { name: 'Test DE 2', shortCode: 'Q6G4+P7', canSit: true,  needsSitting: false },
  { name: 'Test DE 3', shortCode: 'Q5Q7+FR', canSit: false, needsSitting: true  },
  { name: 'Test DE 4', shortCode: 'Q5FM+7H', canSit: true,  needsSitting: true  },
  { name: 'Test DE 5', shortCode: 'Q593+5C', canSit: true,  needsSitting: false },
];

async function run() {
  for (const p of testProfiles) {
    // Expand short code using Berlin reference
    const fullCode = olc.recoverNearest(p.shortCode, BERLIN.lat, BERLIN.lng);
    const decoded = olc.decode(fullCode);
    const lat = decoded.latitudeCenter;
    const lng = decoded.longitudeCenter;

    // Check for existing test profile by name
    const existing = await client.fetch(
      `*[_type == "catSitter" && name == $name][0]{ _id }`,
      { name: p.name }
    );

    if (existing) {
      await client.patch(existing._id).set({
        location: { lat, lng, name: fullCode },
        memberVerified: true,
        locale: 'de',
        canSit: p.canSit,
        needsSitting: p.needsSitting,
      }).commit();
      console.log(`⏭  ${p.name} — updated (${existing._id}): ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } else {
      const doc = {
        _type: 'catSitter',
        name: p.name,
        memberVerified: true,
        locale: 'de',
        canSit: p.canSit,
        needsSitting: p.needsSitting,
        location: { lat, lng, name: fullCode },
      };
      const created = await client.create(doc);
      console.log(`✅ ${p.name} — created ${created._id}: ${lat.toFixed(4)}, ${lng.toFixed(4)} (${fullCode})`);
    }
  }
  console.log('\nDone.');
}

run().catch(console.error);
