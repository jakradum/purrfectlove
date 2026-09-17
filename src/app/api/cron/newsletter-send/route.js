import { createClient } from '@sanity/client'
import { Resend } from 'resend'
import { getNextTheme, commitThemeSent, isDueForNextSend } from '@/lib/newsletterCycle'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const resend = new Resend(process.env.RESEND_API_KEY)

const PL_GREEN = '#2C5F4F'
const LOGO_URL = 'https://www.purrfectlove.org/logo.png'
const SITE_URL = 'https://www.purrfectlove.org'

// Belt-and-suspenders: strip any em/en dash that slips past the prompt
// instruction, since the model isn't perfectly reliable about style rules.
function stripDashes(text) {
  if (typeof text !== 'string') return text
  return text.replace(/\s*[—–]\s*/g, ', ')
}

async function fetchCandidatePosts(locale) {
  const query = locale === 'de'
    ? `*[_type == "blogPost" && (language == "de" || language == "both") && defined(publishedAt) && defined(title.de) && defined(overviewDe) && defined(slugDe.current)] | order(publishedAt desc)[0...15]{ "title": title.de, "overview": overviewDe, "tags": tagsDe, "slug": slugDe.current }`
    : `*[_type == "blogPost" && (language == "en" || language == "both") && defined(publishedAt) && defined(title.en) && defined(overviewEn) && defined(slug.current)] | order(publishedAt desc)[0...15]{ "title": title.en, "overview": overviewEn, "tags": tags, "slug": slug.current }`

  return serverClient.fetch(query)
}

async function generateNewsletterContent({ theme, locale, posts }) {
  const openaiApiKey = process.env.OPENAI_API_KEY
  if (!openaiApiKey) throw new Error('OPENAI_API_KEY not configured')

  const isDE = locale === 'de'
  const postList = posts
    .map((p, i) => `${i + 1}. "${p.title}" (slug: ${p.slug})\n   Overview: ${p.overview}\n   Tags: ${(p.tags || []).join(', ') || 'none'}`)
    .join('\n\n')

  const systemPrompt = `You write the Purrfect Love newsletter, a cat adoption and rescue organization in Bangalore and Stuttgart. Match a warm, direct voice.

Hard rules:
- Never use em dashes or en dashes. Use periods, commas, or "and"/"but" instead.
- Do not be overly prosaic or flowery. Write plainly, like a person talking to another person.
- No filler sentences, no throat-clearing openers ("In today's world...", "As cat lovers, we know...").
- Keep paragraphs short: 2-4 sentences each.
- ${isDE ? 'Write entirely in German.' : 'Write entirely in English.'}
- Return valid JSON only. No markdown, no commentary outside the JSON.`

  const userPrompt = `Theme for this newsletter: "${theme.name}"

Theme brief (background research, not reader-facing, use it to write accurately, don't quote it verbatim):
${theme.knowledge}

Here are this newsletter's candidate blog posts already published on the site:

${postList || '(no candidate posts available)'}

Do three things:
1. Pick the 1-2 posts from the list above most relevant to this theme. If none are genuinely relevant, return an empty array rather than forcing a bad match. Use the exact slug shown.
2. Write a subject line, under 60 characters, no em dashes.
3. Write the newsletter body: one short intro paragraph tying the theme to why it matters right now, then 2-3 substantive paragraphs (practical, specific, true to the theme brief), then a short closing paragraph that naturally leads into the featured post(s) without sounding like an ad.

Return JSON exactly in this shape:
{
  "subject": "string",
  "introParagraph": "string",
  "bodyParagraphs": ["string", "string"],
  "closingParagraph": "string",
  "featuredPostSlugs": ["slug-1"]
}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 1200,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${await response.text()}`)
  }

  const data = await response.json()
  let text = data.choices[0]?.message?.content?.trim()
  if (text?.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  const parsed = JSON.parse(text)
  return {
    subject: stripDashes(parsed.subject),
    introParagraph: stripDashes(parsed.introParagraph),
    bodyParagraphs: (parsed.bodyParagraphs || []).map(stripDashes),
    closingParagraph: stripDashes(parsed.closingParagraph),
    featuredPostSlugs: Array.isArray(parsed.featuredPostSlugs) ? parsed.featuredPostSlugs : [],
  }
}

function brandedEmail({ heading, body }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;background-color:#FFF8F0;color:#2D2D2D;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="padding:28px 32px 20px;text-align:center;border-bottom:3px solid ${PL_GREEN};">
            <img src="${LOGO_URL}" width="110" alt="Purrfect Love" style="display:block;margin:0 auto;border:0;" />
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px;">
            <h2 style="margin:0 0 20px;font-size:19px;color:${PL_GREEN};font-family:'Trebuchet MS',sans-serif;">${heading}</h2>
            ${body}
          </td>
        </tr>
        <tr>
          <td style="background:#F5F0E8;padding:20px 32px;text-align:center;border-top:1px solid #E8E4DC;">
            <p style="margin:0;font-size:13px;color:#6B6B6B;font-weight:600;">Purrfect Love · Cat Adoption &amp; Rescue</p>
            <p style="margin:4px 0 0;font-size:12px;color:#999;">purrfectlove.org</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildEmailHtml({ content, matchedPosts, locale }) {
  const isDE = locale === 'de'
  const p = (text) => `<p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">${text}</p>`

  let body = p(content.introParagraph)
  body += content.bodyParagraphs.map(p).join('')

  if (matchedPosts.length > 0) {
    const label = isDE ? 'Weiterlesen' : 'Read more'
    body += `<div style="margin:24px 0;padding:18px 20px;background:#FAF9F7;border-radius:8px;">`
    body += `<p style="margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:${PL_GREEN};font-weight:700;">${label}</p>`
    body += matchedPosts
      .map(post => `<p style="margin:0 0 8px;font-size:14.5px;"><a href="${post.url}" style="color:${PL_GREEN};font-weight:700;text-decoration:none;">${post.title} →</a></p>`)
      .join('')
    body += `</div>`
  }

  body += p(content.closingParagraph)

  return brandedEmail({ heading: content.subject, body })
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization') || ''
  const expected = process.env.CRON_SECRET
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const due = await isDueForNextSend(serverClient)
    if (!due) {
      return Response.json({ ok: true, due: false, sent: false })
    }

    const theme = await getNextTheme(serverClient)

    const subscribers = await serverClient.fetch(
      `*[_type == "newsletterSubscriber"]{ email, locale }`
    )

    const byLocale = { en: [], de: [] }
    for (const s of subscribers) {
      const locale = s.locale === 'de' ? 'de' : 'en'
      byLocale[locale].push(s.email)
    }

    const results = {}
    let sentAny = false

    for (const locale of ['en', 'de']) {
      const recipients = byLocale[locale]
      if (recipients.length === 0) {
        results[locale] = { skipped: 'no subscribers' }
        continue
      }

      try {
        const posts = await fetchCandidatePosts(locale)
        const content = await generateNewsletterContent({ theme, locale, posts })

        const matchedPosts = content.featuredPostSlugs
          .map(slug => posts.find(p => p.slug === slug))
          .filter(Boolean)
          .map(p => ({
            title: p.title,
            url: locale === 'de' ? `${SITE_URL}/de/guides/blog/${p.slug}` : `${SITE_URL}/guides/blog/${p.slug}`,
          }))

        const html = buildEmailHtml({ content, matchedPosts, locale })

        let sentCount = 0
        const errors = []
        for (const email of recipients) {
          const { error } = await resend.emails.send({
            from: 'Purrfect Love <no-reply@purrfectlove.org>',
            to: [email],
            subject: content.subject,
            html,
          })
          if (error) errors.push({ email, error: error.message })
          else sentCount++
        }

        if (sentCount > 0) sentAny = true
        results[locale] = { theme: theme.name, subject: content.subject, sent: sentCount, total: recipients.length, errors: errors.length > 0 ? errors : undefined }
      } catch (err) {
        console.error(`newsletter-send: ${locale} generation/send failed:`, err)
        results[locale] = { error: err.message }
      }
    }

    if (sentAny) {
      await commitThemeSent(serverClient, theme)
    }

    return Response.json({ ok: true, due: true, theme: theme.name, results })
  } catch (error) {
    console.error('cron/newsletter-send error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
