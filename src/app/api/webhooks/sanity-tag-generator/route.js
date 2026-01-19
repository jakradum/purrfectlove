import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import crypto from 'crypto';

// Sanity client with write access for updating tags
const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2021-03-25',
  token: process.env.SANITY_API_TOKEN, // Needs write access
  useCdn: false,
});

// Verify Sanity webhook signature
function verifySignature(payload, signature, secret) {
  if (!secret) return true; // Skip verification if no secret configured
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature || ''),
    Buffer.from(expectedSignature)
  );
}

// Extract plain text from Portable Text blocks
function extractPlainText(blocks) {
  if (!blocks || !Array.isArray(blocks)) return '';
  return blocks
    .filter(block => block._type === 'block')
    .map(block => block.children?.map(child => child.text).join('') || '')
    .join(' ')
    .slice(0, 3000); // Limit to ~3000 chars to stay within token limits
}

// Generate MECE tags using OpenAI
async function generateTags(title, content) {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    console.error('OPENAI_API_KEY not configured');
    return null;
  }

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

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return null;
    }

    const data = await response.json();
    let tagsText = data.choices[0]?.message?.content?.trim();

    // Remove markdown code blocks if present
    if (tagsText.startsWith('```')) {
      tagsText = tagsText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    // Parse the JSON response
    const tags = JSON.parse(tagsText);

    if (Array.isArray(tags) && tags.every(t => typeof t === 'string')) {
      return tags.slice(0, 6); // Max 6 tags
    }

    return null;
  } catch (error) {
    console.error('Error generating tags:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('sanity-webhook-signature');

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.SANITY_WEBHOOK_SECRET;
    if (webhookSecret && !verifySignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    // Sanity sends the document ID and operation type
    const { _id, _type } = body;

    // Only process blog posts
    if (_type !== 'blogPost') {
      return NextResponse.json({ message: 'Not a blog post, skipping' }, { status: 200 });
    }

    // Fetch the full document to get content
    const post = await sanityClient.fetch(
      `*[_id == $id][0] {
        _id,
        title,
        content,
        tags
      }`,
      { id: _id }
    );

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Skip if tags already exist (to prevent re-running on every edit)
    if (post.tags && post.tags.length > 0) {
      return NextResponse.json({ message: 'Tags already exist, skipping' }, { status: 200 });
    }

    // Get title and content (prefer English, fallback to German)
    const title = post.title?.en || post.title?.de || '';
    const contentText = extractPlainText(post.content?.en) || extractPlainText(post.content?.de);

    if (!title || !contentText) {
      return NextResponse.json({ error: 'No content to analyze' }, { status: 400 });
    }

    // Generate tags using OpenAI
    const tags = await generateTags(title, contentText);

    if (!tags) {
      return NextResponse.json({ error: 'Failed to generate tags' }, { status: 500 });
    }

    // Update the document with the generated tags
    await sanityClient.patch(_id)
      .set({ tags })
      .commit();

    return NextResponse.json({
      success: true,
      documentId: _id,
      tags
    }, { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'sanity-tag-generator' });
}
