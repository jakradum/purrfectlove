// scripts/migrateFaqsToLanguageSeparated.mjs
// Migrates old bilingual FAQs (questionEn/answerEn, questionDe/answerDe)
// to new language-separated format (question/answer with language field)

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

async function migrateFaqs() {
  console.log('Fetching old FAQs...');

  // Fetch all FAQs that have the old format (questionEn field exists)
  const oldFaqs = await client.fetch('*[_type == "faq" && defined(questionEn)]');
  console.log(`Found ${oldFaqs.length} old-format FAQs to migrate\n`);

  if (oldFaqs.length === 0) {
    console.log('No old FAQs found. Migration not needed.');
    return;
  }

  let englishCreated = 0;
  let germanCreated = 0;

  for (const faq of oldFaqs) {
    console.log(`Processing: "${faq.questionEn?.substring(0, 50)}..."`);

    // Create English FAQ if English content exists
    if (faq.questionEn && faq.answerEn) {
      const englishFaq = {
        _type: 'faq',
        language: 'en',
        question: faq.questionEn,
        answer: faq.answerEn,
        category: faq.category,
        order: faq.order,
      };

      await client.create(englishFaq);
      englishCreated++;
      console.log(`  ✓ Created English FAQ`);
    }

    // Create German FAQ if German content exists
    if (faq.questionDe && faq.answerDe) {
      const germanFaq = {
        _type: 'faq',
        language: 'de',
        question: faq.questionDe,
        answer: faq.answerDe,
        category: faq.category,
        order: faq.order,
      };

      await client.create(germanFaq);
      germanCreated++;
      console.log(`  ✓ Created German FAQ`);
    }

    // Delete the old FAQ
    await client.delete(faq._id);
    console.log(`  ✓ Deleted old bilingual FAQ\n`);
  }

  console.log('='.repeat(50));
  console.log(`Migration complete!`);
  console.log(`  - ${englishCreated} English FAQs created`);
  console.log(`  - ${germanCreated} German FAQs created`);
  console.log(`  - ${oldFaqs.length} old FAQs removed`);
}

migrateFaqs().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
