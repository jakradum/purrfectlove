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

async function generateOverview(title, content, locale) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.error('OPENAI_API_KEY not configured');
    return null;
  }

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
          { role: 'system', content: 'You are a helpful assistant that writes blog overviews. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return null;
    }

    const data = await response.json();
    let text = data.choices[0]?.message?.content?.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    const parsed = JSON.parse(text);
    return typeof parsed?.overview === 'string' ? parsed.overview.trim() : null;
  } catch (err) {
    console.error('Error generating overview:', err);
    return null;
  }
}

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
      `*[_id == $id][0]{ _id, title, content, language }`,
      { id: _id }
    );

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const titleEn = post.title?.en || '';
    const titleDe = post.title?.de || '';
    const contentEn = extractPlainText(post.content?.en);
    const contentDe = extractPlainText(post.content?.de);

    const hasEN = !!(titleEn || contentEn);
    const hasDE = !!(titleDe || contentDe);

    if (!hasEN && !hasDE) {
      return NextResponse.json({ error: 'No content to analyse' }, { status: 400 });
    }

    // Generate EN and DE in parallel where content exists
    const [overviewEn, overviewDe] = await Promise.all([
      hasEN ? generateOverview(titleEn, contentEn, 'en') : Promise.resolve(null),
      hasDE ? generateOverview(titleDe, contentDe, 'de') : Promise.resolve(null),
    ]);

    const patch = {};
    if (overviewEn) patch.overviewEn = overviewEn;
    if (overviewDe) patch.overviewDe = overviewDe;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Failed to generate overviews' }, { status: 500 });
    }

    await sanityClient.patch(_id).set(patch).commit();

    console.log('Blog overview generated for:', _id, patch);
    return NextResponse.json({ success: true, documentId: _id, ...patch }, { status: 200 });

  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'sanity-blog-overview' });
}
