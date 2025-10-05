# Sanity CMS Setup Guide - Purrfect Love

Complete setup instructions for the Sanity CMS integration with Next.js.

**Date Created**: October 5, 2025  
**Last Updated**: October 5, 2025

---

## Overview

Sanity powers all content management for Purrfect Love:
- Cat profiles
- Team member bios
- FAQs
- Success stories
- Future: Adoption applications (v0.5)

**Studio Location**: `/studio` route (embedded in Next.js app)

---

## Initial Setup (Already Complete)

### 1. Create Sanity Project

```bash
npm create sanity@latest
```

**Prompts answered:**
- Project name: `Purrfect Love`
- Dataset: `production`
- Embedded Studio: `Yes`
- Studio route: `/studio`
- Template: `Clean project with no predefined schemas`

### 2. Install Dependencies

```bash
npm install next-sanity @sanity/image-url
```

### 3. Update Next.js Config

**File**: `next.config.mjs`

Removed `output: 'export'` to support dynamic Studio route:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
};

export default nextConfig;
```

### 4. Environment Variables

**File**: `.env.local` (never commit this!)

```
NEXT_PUBLIC_SANITY_PROJECT_ID=kbircpfo
NEXT_PUBLIC_SANITY_DATASET=production
```

**Vercel Environment Variables** (already added):
- Same variables added in Vercel Dashboard → Settings → Environment Variables
- Applied to: Production, Preview, Development

---

## Schema Files Created

All schemas are in: `src/sanity/schemaTypes/`

### Cat Schema (`cat.js`)

Fields include:
- Name, slug, photos (1-10 images)
- Age group (kitten/young/adult/senior)
- Age in months (exact)
- Gender (male/female)
- Traits (comma-separated: "quiet, cuddler, playful")
- Description (personality, ~100 words)
- Location (area in Bangalore)
- Health status (vaccinated checkbox, health notes)
- Special needs
- Good with (children/cats/dogs)
- Status (available/pending/adopted/foster)
- Featured on homepage (boolean)
- Adoption date

### Team Member Schema (`teamMember.js`)

Fields include:
- Name, role, location (Bangalore/Germany)
- Photo, bio (300 char max)
- Email (optional)
- Display order

### FAQ Schema (`faq.js`)

Fields include:
- Question, answer
- Category (process/care/fees/requirements/general)
- Display order

### Success Story Schema (`successStory.js`)

Fields include:
- Cat reference (links to cat)
- Adopter name, adoption date
- Testimonial (50-500 chars)
- Photos from new home
- Featured on homepage
- Consent to publish (required)

### Schema Index (`schemaTypes/index.js`)

```javascript
import cat from './cat'
import teamMember from './teamMember'
import faq from './faq'
import successStory from './successStory'

export const schema = {
  types: [cat, teamMember, faq, successStory],
}
```

---

## Studio Structure

**File**: `src/sanity/structure.js`

Custom navigation with organized sections:

```javascript
export const structure = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('🐱 Cats')
        .child(
          S.documentTypeList('cat')
            .title('All Cats')
        ),
      S.divider(),
      S.listItem()
        .title('👥 Team Members')
        .child(S.documentTypeList('teamMember').title('Team')),
      S.listItem()
        .title('❓ FAQs')
        .child(S.documentTypeList('faq').title('FAQs')),
      S.listItem()
        .title('🎉 Success Stories')
        .child(S.documentTypeList('successStory').title('Success Stories')),
    ])
```

---

## Next.js Integration

**File**: `src/lib/sanity.js`

Client setup and common queries:

```javascript
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

const builder = imageUrlBuilder(client)

export function urlFor(source) {
  return builder.image(source)
}
```

Includes pre-written queries for:
- All available cats
- Featured cats
- Single cat by slug
- Team members
- FAQs by category
- Success stories

---

## Accessing Sanity Studio

### Locally

1. Start Next.js dev server:
```bash
npm run dev
```

2. Visit: http://localhost:3000/studio

### On Staging

Visit: https://purrfectlove-git-staging-pranav-karnads-projects.vercel.app/studio

### On Production (when deployed)

Will be: https://purrfectlove.org/studio

---

## CORS Configuration

**Already configured** at https://sanity.io/manage:

Allowed origins:
- `http://localhost:3000` (local development)
- `https://purrfectlove-git-staging-pranav-karnads-projects.vercel.app` (staging)
- Will add: `https://purrfectlove.org` (when domain connects)

**Credentials**: Enabled (required for Studio login)

---

## Usage Examples

### Fetching Cats in Next.js

```javascript
import { client } from '@/lib/sanity'

export default async function CatsPage() {
  const cats = await client.fetch(`*[_type == "cat" && status == "available"] {
    _id,
    name,
    slug,
    photos,
    age,
    gender,
    description
  }`)

  return (
    <div>
      {cats.map(cat => (
        <div key={cat._id}>
          <h2>{cat.name}</h2>
          <p>{cat.description}</p>
        </div>
      ))}
    </div>
  )
}
```

### Displaying Images

```javascript
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'

<Image 
  src={urlFor(cat.photos[0]).width(400).url()}
  alt={cat.name}
  width={400}
  height={300}
/>
```

---

## Team Access

### Inviting Team Members

1. Go to https://sanity.io/manage
2. Select "Purrfect Love" project
3. Go to Team tab
4. Click "Invite member"
5. Enter email address
6. They'll receive invitation to access Studio

**Free tier limit**: 3 users total

### Who Should Get Access?

Decide which 3 team members need to:
- Add/edit/remove cats
- Update team bios
- Manage FAQs
- Add success stories

---

## Common Tasks

### Adding a New Cat

1. Go to Studio → Cats
2. Click "Create" button
3. Fill in required fields:
   - Name
   - Generate slug (click button)
   - Upload at least 1 photo
   - Select age group and gender
   - Add description
   - Set status to "Available"
4. Click "Publish"

### Marking a Cat as Adopted

1. Find cat in Studio
2. Change status to "Adopted"
3. Add adoption date
4. Click "Publish"

### Featuring a Cat on Homepage

1. Edit cat
2. Check "Featured on Homepage"
3. Click "Publish"
4. Note: Only check 3-5 cats as featured

---

## Troubleshooting

### "Schema type not found" Error

**Cause**: `schemaTypes/index.js` export doesn't match `sanity.config.js` import

**Fix**: Ensure `index.js` exports as:
```javascript
export const schema = {
  types: [cat, teamMember, faq, successStory],
}
```

### Studio Shows Blank/Crashes

**Cause**: Structure file references schema that doesn't exist

**Fix**: Check `src/sanity/structure.js` only references: cat, teamMember, faq, successStory

### Images Not Loading

**Cause**: Missing image URL builder or CORS not configured

**Fix**: 
- Check `urlFor` function in `src/lib/sanity.js`
- Verify CORS origins include your deployment URL
- Check `next.config.mjs` has Sanity CDN in remotePatterns

### Can't Log Into Studio on Vercel

**Cause**: Environment variables not set or CORS not configured

**Fix**:
- Verify env vars in Vercel dashboard
- Check CORS origins at sanity.io/manage
- Make sure "Allow credentials" is checked

---

## Best Practices

### Content Guidelines

**Cat Photos:**
- Minimum 1, maximum 10 per cat
- High quality (at least 1200px width recommended)
- Good lighting, shows cat's personality
- First photo is the "cover" photo

**Descriptions:**
- Around 100 words
- Focus on personality, not just appearance
- Mention any special needs clearly
- Be honest about temperament

**Traits:**
- Keep to 2-4 traits maximum
- Use simple, descriptive words
- Comma-separated: "quiet, cuddler, playful"

### Team Workflow

1. **Add cats as they arrive** - don't batch too many at once
2. **Mark adopted immediately** - keep listings current
3. **Update health status** - when cats get vaccinated/tested
4. **Regular photo updates** - especially for long-term fosters

---

## Project IDs & Keys

**Sanity Project ID**: `kbircpfo`  
**Dataset**: `production`  
**Studio Route**: `/studio`

**Important**: Never commit `.env.local` to git. It's already in `.gitignore`.

---

## Resources

- **Sanity Dashboard**: https://sanity.io/manage
- **Sanity Docs**: https://www.sanity.io/docs
- **GROQ Query Docs**: https://www.sanity.io/docs/query-cheat-sheet
- **Next.js + Sanity Guide**: https://www.sanity.io/guides/nextjs-app-router-live-preview

---

## Next Steps (Future)

### v0.5 - Adoption Application System (December 2025)

Will add `application` schema to track:
- Application submissions
- Applicant information
- Application status pipeline
- Team notes and voting
- Interview/home visit scheduling

This will be covered in a separate setup guide.

---

**Questions?** 

Check the main PRD or status.md, or ask in the team channel.