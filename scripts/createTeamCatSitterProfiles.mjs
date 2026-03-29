import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

function localeFromPhone(phone) {
  if (!phone) return 'en';
  const norm = phone.replace(/\s+/g, '');
  if (norm.startsWith('+49')) return 'de';
  return 'en'; // +91, +44, etc.
}

async function createProfiles() {
  // Fetch all team members that have a phone number
  const teamMembers = await client.fetch(
    `*[_type == "teamMember" && defined(phone)]{ _id, name, phone, image }`
  );

  if (!teamMembers.length) {
    console.log('No team members with phone numbers found.');
    return;
  }

  console.log(`Found ${teamMembers.length} team members with phones.\n`);

  for (const member of teamMembers) {
    const phone = member.phone.replace(/\s+/g, '');

    // Check if catSitter with this phone already exists
    const existing = await client.fetch(
      `*[_type == "catSitter" && (phone == $phone || phone == $phoneSpaced)][0]{ _id, name }`,
      { phone, phoneSpaced: phone.replace(/^(\+\d{2})(\d)/, '$1 $2') }
    );

    if (existing) {
      console.log(`⏭  ${member.name} — catSitter already exists (${existing._id})`);
      continue;
    }

    const doc = {
      _type: 'catSitter',
      name: member.name,
      phone,
      memberVerified: true,
      siteAdmin: true,
      locale: localeFromPhone(phone),
      // Copy image asset reference from teamMember if present
      ...(member.image?.asset ? { photo: { _type: 'image', asset: { _type: 'reference', _ref: member.image.asset._ref } } } : {}),
    };

    try {
      const created = await client.create(doc);
      console.log(`✅ ${member.name} — created ${created._id} (locale: ${doc.locale})`);
    } catch (err) {
      console.error(`❌ ${member.name} — ${err.message}`);
    }
  }

  console.log('\nDone.');
}

createProfiles();
