import { createClient } from '@sanity/client'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// Public, token-authenticated (no session) - same pattern as
// /api/feedback/submit. The token is the only thing authorizing this
// action, so it must be unguessable; it's a crypto.randomUUID() generated
// once per subscriber.
function page({ heading, body }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body { margin:0; padding:0; font-family: Georgia, 'Times New Roman', serif; background:#FFF8F0; color:#2D2D2D; }
  .card { max-width:480px; margin:60px auto; background:#fff; border-radius:16px; padding:40px 32px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.08); }
  h1 { font-size:20px; color:#2C5F4F; font-family: 'Trebuchet MS', sans-serif; margin:0 0 16px; }
  p { font-size:15px; line-height:1.7; color:#4A4A4A; margin:0; }
</style>
</head>
<body>
  <div class="card">
    <h1>${heading}</h1>
    <p>${body}</p>
  </div>
</body>
</html>`
}

export async function GET(request) {
  const token = new URL(request.url).searchParams.get('token')

  if (!token) {
    return new Response(page({ heading: 'Something went wrong', body: 'This unsubscribe link is missing its token.' }), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  try {
    const subscriber = await serverClient.fetch(
      `*[_type == "newsletterSubscriber" && unsubscribeToken == $token][0]{ _id, locale, unsubscribed }`,
      { token }
    )

    if (!subscriber) {
      return new Response(page({ heading: 'Link not found', body: "This unsubscribe link isn't valid, it may have already been used or the address may not be on our list." }), {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    if (!subscriber.unsubscribed) {
      await serverClient.patch(subscriber._id).set({ unsubscribed: true }).commit()
    }

    const isDE = subscriber.locale === 'de'
    return new Response(
      page({
        heading: isDE ? 'Sie wurden abgemeldet' : "You've been unsubscribed",
        body: isDE
          ? 'Sie erhalten von uns keine weiteren Newsletter mehr. Falls Sie sich das anders überlegen, können Sie sich jederzeit über unsere Website erneut anmelden.'
          : "You won't receive any more newsletters from us. If you change your mind, you can always sign up again on our site.",
      }),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error)
    return new Response(page({ heading: 'Something went wrong', body: 'Please try again in a moment.' }), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}
