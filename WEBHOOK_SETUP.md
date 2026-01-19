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
