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

const ALLOWED_TAGS = [
  'cats-101', 'cat-safety', 'multi-cat-homes', 'adoption',
  'new-cat', 'health-and-vet', 'nutrition', 'grief-and-loss',
];

const ALLOWED_TAGS_DE = [
  'katzen-101', 'katzensicherheit', 'mehrkatzenhaltung', 'adoption',
  'neue-katze', 'gesundheit-und-tierarzt', 'ernaehrung', 'trauer-und-verlust',
];

// Generate both EN and DE tags using OpenAI
async function generateTags(titleEn, contentEn, titleDe, contentDe) {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    console.error('OPENAI_API_KEY not configured');
    return null;
  }

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
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
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
      `*[_id == $id][0] { _id, title, content, tags, tagsDe }`,
      { id: _id }
    );

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Skip if tags already exist (to prevent re-running on every edit)
    if (post.tags && post.tags.length > 0) {
      return NextResponse.json({ message: 'Tags already exist, skipping' }, { status: 200 });
    }

    const titleEn = post.title?.en || '';
    const titleDe = post.title?.de || '';
    const contentEn = extractPlainText(post.content?.en);
    const contentDe = extractPlainText(post.content?.de);

    if (!titleEn && !titleDe) {
      return NextResponse.json({ error: 'No content to analyze' }, { status: 400 });
    }

    const result = await generateTags(titleEn, contentEn, titleDe, contentDe);

    if (!result) {
      return NextResponse.json({ error: 'Failed to generate tags' }, { status: 500 });
    }

    await sanityClient.patch(_id)
      .set({ tags: result.tags, tagsDe: result.tagsDe })
      .commit();

    return NextResponse.json({
      success: true,
      documentId: _id,
      tags: result.tags,
      tagsDe: result.tagsDe,
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
