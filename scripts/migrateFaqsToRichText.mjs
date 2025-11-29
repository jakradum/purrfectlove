// scripts/migrateFaqsToRichText.mjs
// Migrates existing FAQ answers from plain text (string) to rich text (array of blocks)

import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

// Convert plain text string to Portable Text block array
function textToPortableText(text) {
  if (!text || typeof text !== 'string') return [];

  return [
    {
      _type: 'block',
      _key: Math.random().toString(36).substring(2, 10),
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: Math.random().toString(36).substring(2, 10),
          text: text,
          marks: [],
        },
      ],
    },
  ];
}

async function migrateFaqs() {
  console.log('Fetching FAQs...');

  // Fetch all FAQs
  const faqs = await client.fetch('*[_type == "faq"]');
  console.log(`Found ${faqs.length} FAQs to check`);

  let migratedCount = 0;

  for (const faq of faqs) {
    const updates = {};

    // Check if answerEn needs migration (is a string instead of array)
    if (typeof faq.answerEn === 'string') {
      updates.answerEn = textToPortableText(faq.answerEn);
      console.log(`  - Converting English answer for: "${faq.questionEn?.substring(0, 50)}..."`);
    }

    // Check if answerDe needs migration (is a string instead of array)
    if (typeof faq.answerDe === 'string') {
      updates.answerDe = textToPortableText(faq.answerDe);
      console.log(`  - Converting German answer for: "${faq.questionDe?.substring(0, 50)}..."`);
    }

    // If there are updates, apply them
    if (Object.keys(updates).length > 0) {
      await client
        .patch(faq._id)
        .set(updates)
        .commit();
      migratedCount++;
      console.log(`  ✓ Migrated FAQ: ${faq.questionEn?.substring(0, 40)}...`);
    }
  }

  console.log(`\nMigration complete! ${migratedCount} FAQs updated.`);
}

migrateFaqs().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
