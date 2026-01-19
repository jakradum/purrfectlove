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

// Fixed MECE tag categories - exactly 7 options
const ALLOWED_TAGS = [
  'adoption',      // Adoption process, tips, what to expect
  'cat-care',      // General care, grooming, daily routines
  'cat-health',    // Health, medical, veterinary, nutrition
  'cat-behavior',  // Behavior, training, understanding cats
  'rescue-stories', // Success stories, rescue journeys
  'foster-care',   // Fostering information and experiences
  'community'      // Events, volunteers, organization news
];

// Generate tags using OpenAI
async function generateTags(title, content) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) return null;

  const prompt = `You are a content tagger for a cat rescue organization's blog. Categorize this blog post using ONLY tags from this fixed list:

ALLOWED TAGS (pick 1-3 that best fit):
- adoption: Adoption process, tips, preparing for adoption, what to expect
- cat-care: General care, grooming, litter, daily routines, supplies
- cat-health: Health issues, medical care, veterinary visits, nutrition, vaccinations
- cat-behavior: Understanding cat behavior, training, socialization
- rescue-stories: Success stories, rescue journeys, happy endings
- foster-care: Fostering cats, temporary care, foster experiences
- community: Events, volunteers, organization news, partnerships

IMPORTANT: Only use tags from this exact list. Do not create new tags.

Title: ${title}

Content excerpt:
${content}

Return ONLY a JSON array with 1-3 tags from the allowed list. Example: ["adoption", "cat-behavior"]`;

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

    // Remove markdown code blocks if present
    if (tagsText.startsWith('```')) {
      tagsText = tagsText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const tags = JSON.parse(tagsText);

    if (Array.isArray(tags) && tags.every(t => typeof t === 'string')) {
      // Filter to only allowed tags and limit to 3
      const validTags = tags.filter(t => ALLOWED_TAGS.includes(t)).slice(0, 3);
      return validTags.length > 0 ? validTags : null;
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
        content
      }`
    );

    console.log(`Found ${posts.length} posts to retag`);

    const results = [];

    for (const post of posts) {
      // Try multiple title/content structures
      const title = post.title?.en || post.title?.de || post.title || '';
      let contentText = extractPlainText(post.content?.en) || extractPlainText(post.content?.de);

      // If no localized content, try direct content field
      if (!contentText && post.content) {
        contentText = extractPlainText(post.content);
      }

      if (!title && !contentText) {
        results.push({
          _id: post._id,
          status: 'skipped',
          reason: 'no content',
          debug: { hasTitle: !!post.title, hasContent: !!post.content }
        });
        continue;
      }

      // Use title as fallback content if no body
      const textForTags = contentText || title;

      const tags = await generateTags(title || 'Untitled', textForTags);

      if (tags) {
        await sanityClient.patch(post._id)
          .set({ tags })
          .commit();

        results.push({ _id: post._id, status: 'success', tags });
        console.log(`Tagged post ${post._id}:`, tags);
      } else {
        results.push({
          _id: post._id,
          status: 'failed',
          reason: 'tag generation failed',
          debug: { titleLen: title?.length, contentLen: textForTags?.length }
        });
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
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
    version: '6-mece-7-tags',
    allowedTags: ALLOWED_TAGS
  });
}
