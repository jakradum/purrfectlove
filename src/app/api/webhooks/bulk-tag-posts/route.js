import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';

// Sanity client with write access
const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2021-03-25',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// Extract plain text from Portable Text blocks
function extractPlainText(blocks) {
  if (!blocks || !Array.isArray(blocks)) return '';
  return blocks
    .filter(block => block._type === 'block')
    .map(block => block.children?.map(child => child.text).join('') || '')
    .join(' ')
    .slice(0, 3000);
}

const ALLOWED_TAGS = [
  'cats-101', 'cat-safety', 'multi-cat-homes', 'adoption',
  'new-cat', 'health-and-vet', 'nutrition', 'grief-and-loss',
];

const ALLOWED_TAGS_DE = [
  'katzen-101', 'katzensicherheit', 'mehrkatzenhaltung', 'adoption',
  'neue-katze', 'gesundheit-und-tierarzt', 'ernaehrung', 'trauer-und-verlust',
];

async function generateTags(titleEn, contentEn, titleDe, contentDe) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) return null;

  const hasDE = !!(titleDe || contentDe);

  const prompt = `You are tagging blog posts for a cat rescue and adoption organisation called Purrfect Love.

Assign a maximum of 2 tags per post from this fixed list only. Do not invent new tags.

Available tags (EN):
- cats-101: cat psychology, instincts, behavior myths, personality, cat-human bond, domestication
- cat-safety: indoor vs outdoor, balcony and window netting, air quality, home setup, enrichment
- multi-cat-homes: introducing cats, territorial stress, resource distribution, basecamp method
- adoption: adoption process, responsible rescue, neutering policy, fostering, what makes a good home
- new-cat: first weeks with a new cat, settling in, adjustment period, onboarding
- health-and-vet: FIC, litter box issues (medical), vaccinations, deworming, kitten care schedules
- nutrition: cat food quality, ingredients, feeding schedules
- grief-and-loss: losing a pet, bereavement, adopting after loss

Available tags (DE):
- katzen-101
- katzensicherheit
- mehrkatzenhaltung
- adoption
- neue-katze
- gesundheit-und-tierarzt
- ernaehrung
- trauer-und-verlust

Return JSON only in this format:
{ "tags": ["tag-1", "tag-2"], "tagsDe": ["tag-de-1", "tag-de-2"] }

If the post has no German content, return tagsDe as an empty array.
If only one tag applies, return an array with one item.

EN Title: ${titleEn || ''}
EN Content: ${contentEn || ''}
${hasDE ? `\nDE Title: ${titleDe}\nDE Content: ${contentDe}` : ''}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates blog tags. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    let tagsText = data.choices[0]?.message?.content?.trim();

    if (tagsText.startsWith('```')) {
      tagsText = tagsText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(tagsText);

    if (parsed && Array.isArray(parsed.tags)) {
      return {
        tags:   parsed.tags.filter(t => ALLOWED_TAGS.includes(t)).slice(0, 2),
        tagsDe: (parsed.tagsDe || []).filter(t => ALLOWED_TAGS_DE.includes(t)).slice(0, 2),
      };
    }
    return null;
  } catch (error) {
    console.error('Error generating tags:', error);
    return null;
  }
}

export async function POST(request) {
  // Temporarily disabled auth for one-time bulk run
  // TODO: Re-enable or delete this endpoint after use

  try {
    // Fetch ALL blog posts for retagging with fixed categories
    const posts = await sanityClient.fetch(
      `*[_type == "blogPost"] {
        _id,
        title,
        content,
        language
      }`
    );

    console.log(`Found ${posts.length} posts to retag`);

    const results = [];

    for (const post of posts) {
      // Get English content
      const titleEn = post.title?.en || '';
      const contentEn = extractPlainText(post.content?.en);

      // Get German content
      const titleDe = post.title?.de || '';
      const contentDe = extractPlainText(post.content?.de);

      // Check if post has any content
      const hasEnglishContent = titleEn || contentEn;
      const hasGermanContent = titleDe || contentDe;

      if (!hasEnglishContent && !hasGermanContent) {
        results.push({
          _id: post._id,
          status: 'skipped',
          reason: 'no content',
          debug: { hasTitle: !!post.title, hasContent: !!post.content }
        });
        continue;
      }

      const result = await generateTags(titleEn, contentEn, titleDe, contentDe);
      await new Promise(resolve => setTimeout(resolve, 500));

      if (result) {
        await sanityClient.patch(post._id)
          .set({ tags: result.tags, tagsDe: result.tagsDe })
          .commit();

        results.push({ _id: post._id, status: 'success', tags: result.tags, tagsDe: result.tagsDe });
        console.log(`Tagged post ${post._id}:`, result);
      } else {
        results.push({
          _id: post._id,
          status: 'failed',
          reason: 'tag generation failed',
          debug: { hasEnglishContent, hasGermanContent }
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: posts.length,
      results
    });

  } catch (error) {
    console.error('Bulk tag error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'bulk-tag-posts',
    version: '7-bilingual-tags',
    allowedTags: ALLOWED_TAGS,
    allowedTagsDe: ALLOWED_TAGS_DE
  });
}
