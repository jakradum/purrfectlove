# Sanity Webhook Setup for Contact Messages

This guide explains how to set up automatic email notifications via Resend when someone submits a contact message.

## Prerequisites

- ✅ Resend package installed
- ✅ RESEND_API_KEY configured in `.env.local`
- ✅ Webhook endpoint created at `/api/webhooks/contact-message`

## Configuration Steps

### 1. Configure Your Email Settings

Edit the webhook endpoint at `src/app/api/webhooks/contact-message/route.js`:

```javascript
// Line 24-25: Update these values
from: 'Purrfect Love <notifications@yourdomain.com>', // Replace with your verified Resend domain
to: ['your-email@example.com'], // Replace with your email address(es)
```

**Important:**
- The `from` email must be from a domain you've verified in Resend
- You can add multiple email addresses in the `to` array: `['email1@example.com', 'email2@example.com']`

### 2. Set Up Webhook in Sanity

1. Go to your Sanity project dashboard: https://www.sanity.io/manage
2. Select your project: **kbircpfo** (production dataset)
3. Navigate to **API** → **Webhooks**
4. Click **Create webhook**

### 3. Configure the Webhook

Fill in the following details:

**Name:** Contact Message Notification

**URL:**
```
https://yourdomain.com/api/webhooks/contact-message
```
Replace `yourdomain.com` with your actual deployed domain (e.g., Vercel deployment URL)

**Dataset:** production

**Trigger on:** Create

**Filter (GROQ):**
```
_type == "contactMessage"
```

**Projection (optional but recommended):**
```
{
  _type,
  name,
  email,
  message,
  locale,
  submittedAt
}
```

**HTTP method:** POST

**API version:** 2024-01-01

**Include drafts:** No

**HTTP Headers (optional):**
If you want to add webhook security, you can add a secret header:
```
X-Webhook-Secret: your-secret-key-here
```

Then update the webhook route to verify this header.

### 4. Deploy Your Changes

After configuring the webhook, make sure your application is deployed with the new webhook endpoint:

```bash
npm run build
# Deploy to your hosting platform (Vercel, etc.)
```

### 5. Test the Webhook

1. Go to your contact page and submit a test message
2. Check the Sanity webhook logs in the dashboard to see if it triggered successfully
3. Check your email inbox for the notification
4. Check the webhook endpoint logs in your deployment platform

## Webhook Payload Example

When a contact message is created, Sanity will send a POST request with this structure:

```json
{
  "_type": "contactMessage",
  "_id": "abc123",
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I'm interested in adopting a cat...",
  "locale": "en",
  "submittedAt": "2024-01-15T10:30:00.000Z"
}
```

## Troubleshooting

### Email not sending
- Verify your RESEND_API_KEY is correct in `.env.local`
- Check that your `from` email domain is verified in Resend
- Check webhook logs in Sanity dashboard
- Check application logs in your deployment platform

### Webhook not triggering
- Verify the webhook URL is correct and accessible
- Check the GROQ filter matches your document type
- Ensure the webhook is enabled in Sanity
- Test the webhook endpoint manually using curl or Postman

### Testing the endpoint locally

```bash
curl -X POST http://localhost:3000/api/webhooks/contact-message \
  -H "Content-Type: application/json" \
  -d '{
    "_type": "contactMessage",
    "name": "Test User",
    "email": "test@example.com",
    "message": "Test message",
    "locale": "en",
    "submittedAt": "2024-01-15T10:30:00.000Z"
  }'
```

## Security Enhancements (Optional)

To add webhook verification, update the route to check for a secret header:

```javascript
// At the start of the POST function
const webhookSecret = request.headers.get('x-webhook-secret');
if (webhookSecret !== process.env.SANITY_WEBHOOK_SECRET) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

Then add `SANITY_WEBHOOK_SECRET` to your `.env.local` and configure the same value in the Sanity webhook headers.

## Support

For issues with:
- **Resend**: Check https://resend.com/docs
- **Sanity Webhooks**: Check https://www.sanity.io/docs/webhooks

---

# Sanity Webhook Setup for Auto-Tagging Blog Posts

This section explains how to set up the Sanity webhook that automatically generates tags for blog posts using OpenAI.

## Overview

When a blog post is published in Sanity, a webhook triggers an API endpoint that:
1. Receives the document ID from Sanity
2. Fetches the blog post content
3. Sends the content to OpenAI GPT-4o-mini
4. Generates 3-6 MECE (Mutually Exclusive, Collectively Exhaustive) tags
5. Updates the blog post document with the generated tags

## Environment Variables Required

Add these to your Vercel project (Settings → Environment Variables):

```
OPENAI_API_KEY=sk-...
SANITY_API_TOKEN=sk...  # Must have write permissions
SANITY_WEBHOOK_SECRET=your-secret-here  # Optional but recommended
```

### Getting the API Keys

1. **OpenAI API Key**: https://platform.openai.com/api-keys
2. **Sanity API Token**:
   - Go to https://www.sanity.io/manage
   - Select your project → API → Tokens
   - Create a new token with **Editor** permissions (needs write access)
3. **Webhook Secret**: Generate a random string for security

## Setting Up the Sanity Webhook

1. Go to https://www.sanity.io/manage
2. Select your project
3. Navigate to **API** → **Webhooks**
4. Click **Create webhook**

### Webhook Configuration

| Field | Value |
|-------|-------|
| **Name** | Auto-tag Blog Posts |
| **URL** | `https://purrfectlove.org/api/webhooks/sanity-tag-generator` |
| **Dataset** | production |
| **Trigger on** | Create, Update |
| **Filter** | `_type == "blogPost"` |
| **Projection** | `{_id, _type}` |
| **HTTP method** | POST |
| **HTTP Headers** | (leave empty unless adding auth) |
| **Secret** | (paste your SANITY_WEBHOOK_SECRET value) |
| **API version** | v2021-03-25 (or v2025-02-19) |
| **Draft documents** | Disabled (only trigger on published) |

5. Click **Save**

## How It Works

### Tag Generation Logic

The webhook only generates tags when:
- The document is a `blogPost`
- The post does NOT already have tags (prevents re-generation on every edit)

Tags are generated based on:
- English content (preferred) or German content
- Title and first ~3000 characters of content

### MECE Tag Categories

The AI is prompted to use these categories when applicable:
- `cat-health`
- `cat-behavior`
- `adoption`
- `rescue-stories`
- `cat-care`
- `indoor-cats`
- `nutrition`
- `veterinary`
- `community`
- `foster-care`

### Manual Override

Editors can manually edit tags in Sanity after they're generated. The field is not read-only, allowing corrections.

## Testing the Webhook

### Local Testing

```bash
# Test the health check endpoint
curl http://localhost:3000/api/webhooks/sanity-tag-generator

# Simulate a webhook call (replace with actual document ID)
curl -X POST http://localhost:3000/api/webhooks/sanity-tag-generator \
  -H "Content-Type: application/json" \
  -d '{"_id": "your-document-id", "_type": "blogPost"}'
```

### Production Testing

1. Create a test blog post in Sanity
2. Publish it
3. Check the Sanity webhook logs for success/failure
4. Verify tags appear on the document

## Troubleshooting

### Tags not generating

1. Check Vercel function logs for errors
2. Verify environment variables are set
3. Ensure Sanity token has write permissions
4. Check webhook is enabled and URL is correct

### Webhook signature errors

If you see "Invalid signature":
1. Ensure SANITY_WEBHOOK_SECRET matches between Vercel and Sanity webhook config
2. Or remove the secret from both places to disable verification

### Rate limits

OpenAI has rate limits. If you're bulk-publishing posts:
- Wait a few seconds between publishes
- Or manually add tags in Sanity

## Cost Estimation

Using GPT-4o-mini:
- ~$0.15 per 1M input tokens
- ~$0.60 per 1M output tokens
- Each blog post: ~1000-2000 input tokens, ~50 output tokens
- **Estimated cost: ~$0.0002 per blog post** (negligible)

## Re-generating Tags

To regenerate tags for a post:
1. Open the blog post in Sanity
2. Clear the tags field (remove all tags)
3. Publish the post
4. The webhook will generate new tags
