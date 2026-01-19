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

// Generate tags using OpenAI
async function generateTags(title, content) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) return null;

  const prompt = `You are a content tagger for a cat rescue organization's blog. Generate 3-6 MECE (Mutually Exclusive, Collectively Exhaustive) tags for this blog post.

Tags should be:
- Lowercase, hyphenated (e.g., "cat-health", "adoption-tips")
- Relevant to cat rescue, adoption, and cat care topics
- Specific enough to be useful for filtering
- From these general categories when applicable: cat-health, cat-behavior, adoption, rescue-stories, cat-care, indoor-cats, nutrition, veterinary, community, foster-care

Title: ${title}

Content excerpt:
${content}

Return ONLY a JSON array of tag strings, no explanation. Example: ["cat-health", "indoor-cats", "cat-care"]`;

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

    if (!response.ok) return null;

    const data = await response.json();
    const tagsText = data.choices[0]?.message?.content?.trim();
    const tags = JSON.parse(tagsText);

    if (Array.isArray(tags) && tags.every(t => typeof t === 'string')) {
      return tags.slice(0, 6);
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
    // Fetch all blog posts without tags
    const posts = await sanityClient.fetch(
      `*[_type == "blogPost" && (!defined(tags) || count(tags) == 0)] {
        _id,
        title,
        content
      }`
    );

    console.log(`Found ${posts.length} posts without tags`);

    const results = [];

    for (const post of posts) {
      const title = post.title?.en || post.title?.de || '';
      const contentText = extractPlainText(post.content?.en) || extractPlainText(post.content?.de);

      if (!title || !contentText) {
        results.push({ _id: post._id, status: 'skipped', reason: 'no content' });
        continue;
      }

      const tags = await generateTags(title, contentText);

      if (tags) {
        await sanityClient.patch(post._id)
          .set({ tags })
          .commit();

        results.push({ _id: post._id, status: 'success', tags });
        console.log(`Tagged post ${post._id}:`, tags);
      } else {
        results.push({ _id: post._id, status: 'failed', reason: 'tag generation failed' });
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
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
    version: '3-noauth'
  });
}
