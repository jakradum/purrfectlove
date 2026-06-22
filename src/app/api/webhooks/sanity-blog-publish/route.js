import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import crypto from 'crypto';

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2021-03-25',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

function verifySignature(payload, signature, secret) {
  if (!secret) return true;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature || ''),
    Buffer.from(expectedSignature)
  );
}

function extractPlainText(blocks) {
  if (!blocks || !Array.isArray(blocks)) return '';
  return blocks
    .filter(block => block._type === 'block')
    .map(block => block.children?.map(child => child.text).join('') || '')
    .join(' ')
    .slice(0, 2000);
}

// ─── Tags ────────────────────────────────────────────────────────────────────

const ALLOWED_TAGS = [
  'cats-101', 'cat-safety', 'multi-cat-homes', 'adoption',
  'new-cat', 'health-and-vet', 'nutrition', 'grief-and-loss',
];
const ALLOWED_TAGS_DE = [
  'katzen-101', 'katzensicherheit', 'mehrkatzenhaltung', 'adoption',
  'neue-katze', 'gesundheit-und-tierarzt', 'ernaehrung', 'trauer-und-verlust',
];

async function generateTags(titleEn, contentEn, titleDe, contentDe) {
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
- katzen-101, katzensicherheit, mehrkatzenhaltung, adoption, neue-katze, gesundheit-und-tierarzt, ernaehrung, trauer-und-verlust

Return JSON only: { "tags": ["tag-1"], "tagsDe": ["tag-de-1"] }
If no German content, return tagsDe as [].

EN Title: ${titleEn || ''}
EN Content: ${contentEn || ''}
${hasDE ? `\nDE Title: ${titleDe}\nDE Content: ${contentDe}` : ''}`;

  const data = await callOpenAI(prompt, 150, 0.3);
  if (!data) return null;

  let text = data.choices[0]?.message?.content?.trim();
  if (text.startsWith('```')) text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed?.tags)) return null;
  return {
    tags:   parsed.tags.filter(t => ALLOWED_TAGS.includes(t)).slice(0, 2),
    tagsDe: (parsed.tagsDe || []).filter(t => ALLOWED_TAGS_DE.includes(t)).slice(0, 2),
  };
}

// ─── Overview ────────────────────────────────────────────────────────────────

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

  const data = await callOpenAI(prompt, 200, 0.5);
  if (!data) return null;

  let text = data.choices[0]?.message?.content?.trim();
  if (text.startsWith('```')) text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  const parsed = JSON.parse(text);
  return typeof parsed?.overview === 'string' ? parsed.overview.trim() : null;
}

// ─── Shared OpenAI helper ────────────────────────────────────────────────────

async function callOpenAI(prompt, maxTokens, temperature) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    console.error('OpenAI error:', response.status, await response.text());
    return null;
  }
  return response.json();
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('sanity-webhook-signature');
    const webhookSecret = process.env.SANITY_WEBHOOK_SECRET;

    if (webhookSecret && !verifySignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const { _id, _type } = body;

    if (_type !== 'blogPost') {
      return NextResponse.json({ message: 'Not a blog post, skipping' }, { status: 200 });
    }

    const post = await sanityClient.fetch(
      `*[_id == $id][0]{ _id, title, content, tags, language }`,
      { id: _id }
    );

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const titleEn   = post.title?.en || '';
    const titleDe   = post.title?.de || '';
    const contentEn = extractPlainText(post.content?.en);
    const contentDe = extractPlainText(post.content?.de);
    const hasEN     = !!(titleEn || contentEn);
    const hasDE     = !!(titleDe || contentDe);
    const skipTags  = post.tags && post.tags.length > 0;

    // Run all generation tasks in parallel
    const [tagsResult, overviewEn, overviewDe] = await Promise.all([
      skipTags
        ? Promise.resolve(null)
        : generateTags(titleEn, contentEn, titleDe, contentDe),
      hasEN ? generateOverview(titleEn, contentEn, 'en') : Promise.resolve(null),
      hasDE ? generateOverview(titleDe, contentDe, 'de') : Promise.resolve(null),
    ]);

    const patch = {};
    if (tagsResult) {
      patch.tags   = tagsResult.tags;
      patch.tagsDe = tagsResult.tagsDe;
    }
    if (overviewEn) patch.overviewEn = overviewEn;
    if (overviewDe) patch.overviewDe = overviewDe;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ message: 'Nothing to update' }, { status: 200 });
    }

    await sanityClient.patch(_id).set(patch).commit();

    console.log('Blog publish webhook processed:', _id, Object.keys(patch));
    return NextResponse.json({ success: true, documentId: _id, updated: Object.keys(patch) }, { status: 200 });

  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'sanity-blog-publish' });
}
