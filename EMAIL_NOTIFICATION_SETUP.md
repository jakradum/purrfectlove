# Email Notification Setup - Complete ✅

## Summary

Successfully set up automatic email notifications via Resend for contact form submissions from your Sanity CMS.

## What Was Done

### 1. Package Installation
- ✅ Installed `resend` package
- ✅ Verified RESEND_API_KEY in `.env.local`

### 2. Webhook Endpoint Created
- **Location:** [src/app/api/webhooks/contact-message/route.js](src/app/api/webhooks/contact-message/route.js)
- **URL:** `/api/webhooks/contact-message`
- **Method:** POST
- **Status:** ✅ Tested and working

### 3. Email Configuration
- **From:** `Purrfect Love <onboarding@resend.dev>`
- **To:** `pranavkarnad@gmail.com` (configurable via `NOTIFICATION_EMAIL` env variable)
- **Test Result:** ✅ Email sent successfully (ID: bcd1085e-6872-41be-ba63-1e441b212ca2)

### 4. Test Script Created
- **Location:** [test-webhook.sh](test-webhook.sh)
- **Usage:** `./test-webhook.sh [url]`
- **Default:** Tests against `http://localhost:3000`

## How It Works

```
Contact Form Submission
        ↓
    Saved to Sanity CMS
        ↓
  Sanity Webhook Triggered
        ↓
Your API Endpoint (/api/webhooks/contact-message)
        ↓
   Email sent via Resend
        ↓
You receive notification email!
```

## Email Content

The notification email includes:
- Contact person's name
- Email address
- Language (English 🇮🇳 or German 🇩🇪)
- Submission timestamp
- Full message content

## Next Steps - Configure Sanity Webhook

You need to set up the webhook in Sanity to trigger the email notifications:

### Step-by-Step Guide:

1. **Go to Sanity Dashboard**
   - Visit: https://www.sanity.io/manage/personal/project/kbircpfo
   - Navigate to: **API** → **Webhooks**

2. **Create New Webhook**
   - Click "Create webhook"
   - Fill in the following:

   **Name:** Contact Message Notification

   **URL:** `https://your-production-domain.com/api/webhooks/contact-message`

   (Replace with your actual deployed URL, e.g., your Vercel deployment)

   **Dataset:** production

   **Trigger on:** Create

   **Filter (GROQ):**
   ```
   _type == "contactMessage"
   ```

   **Projection:**
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

   **HTTP Method:** POST

   **API Version:** 2024-01-01

   **Include drafts:** No (unchecked)

3. **Save the Webhook**

4. **Test It**
   - Submit a test message through your contact form
   - Check the webhook logs in Sanity dashboard
   - Check your email inbox (pranavkarnad@gmail.com)

## Configuration Options

### Change Notification Email

Add to your `.env.local`:
```env
NOTIFICATION_EMAIL=your-custom-email@example.com
```

### Use Custom Domain (Recommended for Production)

1. Verify your domain in Resend: https://resend.com/domains
2. Update the `from` address in [route.js:26](src/app/api/webhooks/contact-message/route.js#L26):
   ```javascript
   from: 'Purrfect Love <notifications@yourdomain.com>'
   ```

### Add Multiple Recipients

Edit [route.js:27](src/app/api/webhooks/contact-message/route.js#L27):
```javascript
to: ['email1@example.com', 'email2@example.com', 'email3@example.com']
```

### Add Webhook Security (Optional)

To verify webhooks are actually from Sanity:

1. Add to `.env.local`:
   ```env
   SANITY_WEBHOOK_SECRET=your-secret-key-here
   ```

2. Update the webhook endpoint to verify the secret:
   ```javascript
   const webhookSecret = request.headers.get('x-webhook-secret');
   if (webhookSecret !== process.env.SANITY_WEBHOOK_SECRET) {
     return Response.json({ error: 'Unauthorized' }, { status: 401 });
   }
   ```

3. Add the header in Sanity webhook configuration:
   - Header name: `X-Webhook-Secret`
   - Header value: `your-secret-key-here`

## Testing

### Local Testing
```bash
# Start the dev server
npm run dev

# In another terminal, run the test script
./test-webhook.sh

# Or test manually
curl -X POST http://localhost:3000/api/webhooks/contact-message \
  -H "Content-Type: application/json" \
  -d '{
    "_type": "contactMessage",
    "name": "Test User",
    "email": "test@example.com",
    "message": "Test message",
    "locale": "en",
    "submittedAt": "2024-01-15T12:00:00.000Z"
  }'
```

### Production Testing
After deploying and configuring the Sanity webhook:
1. Go to your contact page
2. Fill out and submit the form
3. Check your email for the notification
4. Check Sanity webhook logs for delivery status

## Important Notes

⚠️ **Resend Test Domain Limitations:**
- The `onboarding@resend.dev` domain can only send to `pranavkarnad@gmail.com`
- For production use, verify your own domain in Resend
- Free tier: 3,000 emails/month, 100 emails/day

📧 **Email Deliverability:**
- Check spam folder if you don't see emails
- Verified domains have better deliverability
- Consider adding SPF/DKIM records for your domain

🔒 **Security:**
- Add webhook secret verification for production
- Consider rate limiting the webhook endpoint
- Monitor webhook logs for suspicious activity

## Troubleshooting

### Email not received
1. Check Resend dashboard for delivery logs
2. Check spam folder
3. Verify the `to` email address is correct
4. For test domain, ensure recipient is `pranavkarnad@gmail.com`

### Webhook not triggering
1. Check Sanity webhook logs
2. Verify the webhook URL is correct and accessible
3. Check the GROQ filter matches your document type
4. Ensure webhook is enabled

### Deployment checklist
- [ ] Deploy the updated code to production
- [ ] Update webhook URL in code to production domain
- [ ] Configure Sanity webhook with production URL
- [ ] Test with a real form submission
- [ ] Verify email received
- [ ] (Optional) Set up custom domain in Resend
- [ ] (Optional) Add webhook secret for security

## Files Created/Modified

- ✅ Created: `src/app/api/webhooks/contact-message/route.js`
- ✅ Created: `test-webhook.sh`
- ✅ Created: `WEBHOOK_SETUP.md`
- ✅ Created: `EMAIL_NOTIFICATION_SETUP.md`
- ✅ Modified: `package.json` (added resend dependency)

## Support Resources

- **Resend Documentation:** https://resend.com/docs
- **Sanity Webhooks:** https://www.sanity.io/docs/webhooks
- **Resend Dashboard:** https://resend.com/emails
- **Sanity Dashboard:** https://www.sanity.io/manage

---

**Status:** ✅ Email notifications are working locally. Next step is to configure the Sanity webhook after deploying to production.
