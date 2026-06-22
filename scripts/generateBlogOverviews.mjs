import { createClient } from '@sanity/client';
import 'dotenv/config';

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2021-03-25',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

function extractPlainText(blocks) {
  if (!blocks || !Array.isArray(blocks)) return '';
  return blocks
    .filter(block => block._type === 'block')
    .map(block => block.children?.map(child => child.text).join('') || '')
    .join(' ')
    .slice(0, 2000);
}

async function generateOverview(title, content, locale) {
  const isDE = locale === 'de';

  const prompt = `You are writing reader-facing content for Purrfect Love, a cat rescue and adoption organisation based in India${isDE ? ' with a community in Stuttgart, Germany' : ''}.

Write a 2–3 sentence overview of the following blog post. This will appear just below the title to hook the reader before they start reading.

Rules:
- Do not make up any information — use only what is stated in the title and content below
- Warm, conversational tone — written for cat lovers
- Lean towards a positive, uplifting feeling even if the topic is difficult or sensitive
- Do not start with "This post", "This article", "In this post", or "Learn"
- Do not spoil the conclusion — make them want to read on
- ${isDE ? 'Write in German' : 'Write in English'}
- Return JSON only: { "overview": "..." }

Title: ${title}
Content: ${content}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that writes blog overviews. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  let text = data.choices[0]?.message?.content?.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  const parsed = JSON.parse(text);
  return typeof parsed?.overview === 'string' ? parsed.overview.trim() : null;
}

async function main() {
  console.log('Fetching all blog posts...');

  const posts = await sanityClient.fetch(
    `*[_type == "blogPost"]{ _id, title, content, language }`
  );

  console.log(`Found ${posts.length} posts.\n`);

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const post of posts) {
    const titleEn = post.title?.en || '';
    const titleDe = post.title?.de || '';
    const contentEn = extractPlainText(post.content?.en);
    const contentDe = extractPlainText(post.content?.de);

    const hasEN = !!(titleEn || contentEn);
    const hasDE = !!(titleDe || contentDe);

    if (!hasEN && !hasDE) {
      console.log(`⚠  ${post._id} — skipped (no content)`);
      skipped++;
      continue;
    }

    try {
      const [overviewEn, overviewDe] = await Promise.all([
        hasEN ? generateOverview(titleEn, contentEn, 'en') : Promise.resolve(null),
        hasDE ? generateOverview(titleDe, contentDe, 'de') : Promise.resolve(null),
      ]);

      const patch = {};
      if (overviewEn) patch.overviewEn = overviewEn;
      if (overviewDe) patch.overviewDe = overviewDe;

      await sanityClient.patch(post._id).set(patch).commit();

      const label = titleEn || titleDe || post._id;
      console.log(`✓  ${label.slice(0, 60)}`);
      if (overviewEn) console.log(`   EN: ${overviewEn.slice(0, 100)}...`);
      if (overviewDe) console.log(`   DE: ${overviewDe.slice(0, 100)}...`);
      succeeded++;
    } catch (err) {
      console.error(`✗  ${post._id} — ${err.message}`);
      failed++;
    }

    // Small delay to avoid hitting rate limits
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone. ${succeeded} succeeded, ${failed} failed, ${skipped} skipped.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
