# Contact Message Email Preview

## Visual Design

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ╔══════════════════════════════════════════════════════╗ │
│  ║  [Gradient: Hunter Green → Tabby Brown]              ║ │
│  ║                                                       ║ │
│  ║              Purrfect Love                            ║ │
│  ║          New Message Notification                     ║ │
│  ║                                                       ║ │
│  ╚══════════════════════════════════════════════════════╝ │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  You have a new message on purrfectlove.org -       │  │
│  │  English 🇮🇳                                          │  │
│  │                                                      │  │
│  │  ┌───────────────────────────────────────────────┐  │  │
│  │  │ FROM                                          │  │  │
│  │  │ John Doe                                      │  │  │
│  │  │ john@example.com                              │  │  │
│  │  │ Jan 15, 2024, 12:30 PM                        │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  │                                                      │  │
│  │  ┌───────────────────────────────────────────────┐  │  │
│  │  │ MESSAGE PREVIEW                               │  │  │
│  │  │                                               │  │  │
│  │  │ This is a test message from the webhook      │  │  │
│  │  │ test script. It includes multiple lines      │  │  │
│  │  │ to test formatting...                         │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  │                                                      │  │
│  │  ┌───────────────────────────────────────────────┐  │  │
│  │  │  View Full Message in Message Board →        │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  │                                                      │  │
│  │  Quick Actions:                                     │  │
│  │  Reply to John Doe • View in Sanity                │  │
│  │                                                      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           Bangalore • Stuttgart                      │  │
│  │    Made with 🧡 for cats and cat lovers             │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Color Scheme

### Header Gradient:
- **Start:** Hunter Green (#2C5F4F)
- **End:** Tabby Brown (#C85C3F)

### Body Elements:
- **H2 Title:** Hunter Green (#2C5F4F)
- **From Box Background:** Whisker Cream (#F6F4F0)
- **From Box Border:** Tabby Brown (#C85C3F) - 4px left border
- **Message Preview Box:** Paw Pink (#F5D5C8)
- **CTA Button:** Hunter Green (#2C5F4F)
- **Links:** Tabby Brown (#C85C3F)
- **Body Text:** Text Dark (#2A2A2A)
- **Secondary Text:** Text Light (#6B6B6B)
- **Footer Background:** Whisker Cream (#F6F4F0)

## Typography

- **Header Font:** Trebuchet MS (sans-serif fallback)
- **Body Font:** Georgia, Times New Roman (serif fallback)
- **Button Font:** Trebuchet MS (sans-serif fallback)

## Key Features

### 1. Responsive Design
- Mobile-friendly layout
- Scales properly on all devices
- Email client compatible

### 2. Professional Styling
- Clean, modern aesthetic
- Proper spacing and padding
- Subtle shadows and rounded corners

### 3. Actionable
- Direct link to Sanity message board
- Quick reply via mailto link
- All important info at a glance

### 4. Brand Consistent
- Uses exact project colors
- Matches website design language
- Professional representation

## Email Content Structure

1. **Header Section**
   - Gradient background
   - Logo/title
   - Subtitle: "New Message Notification"

2. **Main Content**
   - Clear H2 heading with language indicator
   - From box with contact details
   - Message preview (150 char limit)
   - Prominent CTA button
   - Quick action links

3. **Footer**
   - Location information
   - Brand tagline

## Example Subject Line

```
New message from John Doe - English 🇮🇳
```

## Plain Text Version

For email clients that don't support HTML:

```
NEW MESSAGE ON PURRFECTLOVE.ORG - ENGLISH 🇮🇳

FROM: John Doe
EMAIL: john@example.com
SUBMITTED: 1/15/2024, 12:30:00 PM

MESSAGE PREVIEW:
This is a test message from the webhook test script...

---

VIEW FULL MESSAGE:
https://purrfectlove.org/studio/structure/contactMessage;test-123

REPLY TO John Doe:
mailto:john@example.com

---
Bangalore • Stuttgart
Made with 🧡 for cats and cat lovers
```

## Customization Options

You can easily customize the email by editing [route.js](src/app/api/webhooks/contact-message/route.js):

1. **Change colors** (lines 35-42)
2. **Modify truncation length** (line 30) - currently 150 chars
3. **Add/remove sections** in the HTML template
4. **Update footer text** (lines 147-151)
5. **Customize button text** (line 120)

## Testing the Design

To see the actual email in your inbox:

```bash
npm run dev
./test-webhook.sh
```

Check `pranavkarnad@gmail.com` for the notification!
