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

function localeFromMember(member) {
  if (member.phone) {
    const norm = member.phone.replace(/\s+/g, '');
    if (norm.startsWith('+49')) return 'de';
  }
  if (member.language === 'de') return 'de';
  return 'en';
}

async function createProfiles() {
  // Fetch ALL team members regardless of phone/email
  const teamMembers = await client.fetch(
    `*[_type == "teamMember"]{ _id, name, phone, email, image, language }`
  );

  if (!teamMembers.length) {
    console.log('No team members found.');
    return;
  }

  console.log(`Found ${teamMembers.length} team members.\n`);

  for (const member of teamMembers) {
    const phone = member.phone ? member.phone.replace(/\s+/g, '') : null;
    const phoneSpaced = phone ? phone.replace(/^(\+\d{2})(\d)/, '$1 $2') : null;
    const email = member.email ? member.email.trim().toLowerCase() : null;

    // Check if catSitter already exists — match by phone, email, or name
    let existing = null;

    if (phone) {
      existing = await client.fetch(
        `*[_type == "catSitter" && (phone == $phone || phone == $phoneSpaced)][0]{ _id, name }`,
        { phone, phoneSpaced }
      );
    }
    if (!existing && email) {
      existing = await client.fetch(
        `*[_type == "catSitter" && email == $email][0]{ _id, name }`,
        { email }
      );
    }
    if (!existing && member.name) {
      existing = await client.fetch(
        `*[_type == "catSitter" && name == $name && siteAdmin == true][0]{ _id, name }`,
        { name: member.name }
      );
    }

    if (existing) {
      // Patch to ensure siteAdmin, memberVerified, phone, and email are all up to date
      const patch = { siteAdmin: true, memberVerified: true };
      if (phone) patch.phone = phone;
      if (email) patch.email = email;
      await client.patch(existing._id).set(patch).commit();
      const details = [phone, email].filter(Boolean).join(', ') || 'no phone or email';
      console.log(`⏭  ${member.name} — updated (${existing._id}): ${details}`);
      continue;
    }

    const doc = {
      _type: 'catSitter',
      name: member.name,
      memberVerified: true,
      siteAdmin: true,
      locale: localeFromMember(member),
      ...(phone ? { phone } : {}),
      ...(email ? { email } : {}),
      ...(member.image?.asset ? {
        photo: { _type: 'image', asset: { _type: 'reference', _ref: member.image.asset._ref } }
      } : {}),
    };

    try {
      const created = await client.create(doc);
      const details = [phone, email].filter(Boolean).join(', ') || 'no phone or email';
      console.log(`✅ ${member.name} — created ${created._id} (locale: ${doc.locale}, ${details})`);
    } catch (err) {
      console.error(`❌ ${member.name} — ${err.message}`);
    }
  }

  console.log('\nDone.');
}

createProfiles();
