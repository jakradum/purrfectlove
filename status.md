# Product Requirements Document - Purrfect Love Website

**Organization**: Purrfect Love - Cat Adoption & Rescue Group  
**Location**: Bangalore, India (with team member in Germany)  
**Domain**: purrfectlove.org (GoDaddy)  
**Repository**: GitHub  
**Development**: Pranav (co-developer with Claude)  
**Constraint**: Pro bono project - no-cost platforms/tools only  
**Current Status**: Coming soon page live

**Tech Stack:**
- **Hosting**: Vercel
- **Code Repository**: GitHub
- **Domain**: GoDaddy
- **CMS & Backend**: Sanity.io (all content + applications)

**Timeline:**
- **v0 Launch**: End of November 2025 (Public site)
- **v0.5**: December 2025 (Adoption application system)
- **v1 Launch**: January 2026 (German version)
- **v2+**: February 2026 onwards (Advanced features)

---

## 🎯 PRIORITY TASK LIST - WHAT'S DUE WHEN

### 🔴 CRITICAL - Due Mid-November 2025 (6 weeks from now)

**Anandhi (Logo):**
- [ ] Logo concepts and iterations
- [ ] Final logo in SVG format
- [ ] Logo in PNG (512px, 256px, 128px)
- [ ] Logo variations (full color, white, monotone)
- [ ] Brand colors (if not finalized)

**Chithra (Design):**
- [ ] Complete design system (colors, fonts, spacing)
- [ ] All page mockups (home, adoption, about, contact, etc.)
- [ ] Cat card component design
- [ ] Navigation & footer design
- [ ] Button & form designs
- [ ] Mobile responsive layouts

**Pranav (Developer):**
- [ ] Vercel deployment configured
- [ ] Domain connected (purrfectlove.org)
- [ ] Sanity CMS fully set up and working
- [ ] All page functionality built (with placeholder styling)
- [ ] Forms connected and tested
- [ ] Analytics installed
- [ ] SEO configured

**Team (Content):**
- [ ] 5-10 cat profiles collected (photos + info)
- [ ] All page copy written
- [ ] Team bios and photos
- [ ] 3-5 testimonials/success stories
- [ ] FAQ list (8-10 questions)

### 🟡 HIGH PRIORITY - Due Late November 2025 (1 week before launch)
- [ ] Design applied to all pages
- [ ] All real cat data uploaded to Sanity
- [ ] Cross-browser testing complete
- [ ] Mobile device testing complete
- [ ] Team trained on using Sanity CMS
- [ ] Final content review and polish
- [ ] Launch announcement prepared for Instagram

### 🟢 LAUNCH - End of November 2025
- [ ] **v0 GOES LIVE** 🚀
- [ ] Monitor for bugs and issues
- [ ] Gather user feedback
- [ ] Instagram announcement

### 🔵 POST-LAUNCH - December 2025 (v0.5)

**Public Site Improvements:**
- [ ] Bug fixes from launch
- [ ] Performance optimizations
- [ ] Add more cats as they arrive
- [ ] Gather feedback for v1

**Adoption Application System (HIGH PRIORITY - Backend Work):**
- [ ] **Build custom application form on website**
- [ ] **Sanity schema for applications**:
  - Application pipeline stages
  - Team feedback/voting system
  - Notes and status tracking
  - Email notifications
- [ ] Custom Sanity Studio views for application review
- [ ] Train team on reviewing applications in Sanity
- [ ] Optional: Google Sheets sync for backup
- [ ] Document workflow

### ⚪ v1 FEATURES - January 2026
- [ ] German version complete
- [ ] Advanced filters on adoption page
- [ ] Enhanced success stories section
- [ ] Foster program page
- [ ] Newsletter signup
- [ ] Instagram feed integration

### 🟣 FUTURE - February 2026+
- [ ] Advanced application analytics dashboard
- [ ] Donation integration (Razorpay/Stripe)
- [ ] Blog/resources section
- [ ] Foster portal with tracking
- [ ] Advanced automation and workflows

---

## Target Audience

- Prospective cat adopters in Bangalore
- Cat lovers seeking information about adoption
- Potential fosterers
- People looking to support rescue efforts

---

## Version 0 - Initial Launch (English Only) - November 2025

### Core Pages

#### 1. Home Page
**Priority: P0 (Must Have)**

- Hero section with mission statement
- Featured cats (3-5 available for adoption)
- Call-to-action: "Adopt a Cat" (links to Google Form initially, custom form in v0.5)
- Success stories/testimonials (2-3)
- Instagram feed preview or link
- Quick stats display (optional):
  - Cats currently available
  - Successful adoptions
  - Years active

#### 2. Adoption Page
**Priority: P0 (Must Have)**

- Grid/card layout of available cats
- Each cat card includes:
  - Photo(s)
  - Name
  - Age
  - Gender
  - Brief personality description
  - Health status (vaccinated, neutered/spayed, etc.)
  - Special needs (if any)
- "Apply to Adopt" button → Links to existing Google Form (v0), custom form (v0.5+)
- Simple filters (P1):
  - Age (kitten, young, adult, senior)
  - Gender
  - Special needs
- **Important**: Clearly state "No adoption fees"

#### 3. Adoption Process
**Priority: P0 (Must Have)**

Step-by-step guide:
1. **Browse & Choose**: Look through available cats
2. **Submit Application**: Fill out application form
3. **Initial Review**: We review your application (24-48 hours)
4. **Meet & Greet**: Virtual or in-person meeting with the cat
5. **Home Visit**: Quick check of your space
6. **Adoption Day**: Take your new friend home!

Additional content:
- Requirements for adopters (housing, lifestyle, etc.)
- Timeline expectations
- What happens after application submission
- **FAQs section**

#### 4. First Days at Home
**Priority: P0 (Must Have)**

- **Essential Supplies Checklist**:
  - Litter box and litter
  - Food and water bowls
  - Cat food (recommended brands)
  - Scratching post
  - Toys
  - Carrier
  - Bed/hiding spots

- **Bringing Cat Home**:
  - Preparing your space
  - The first 24 hours
  - Setting up a safe room

- **Settling In Tips**:
  - Expected behaviors
  - Building trust
  - Introducing to other pets (if applicable)
  - Common mistakes to avoid

- **Important Contacts**:
  - Emergency vet numbers (Bangalore)
  - Purrfect Love support contact
  - 24-hour helpline (if available)

#### 5. About Us / Introduction
**Priority: P0 (Must Have)**

- **Mission & Vision**: Why Purrfect Love exists
- **Our Story**: How the group started
- **The Team**:
  - Core volunteers (photos + brief bios)
  - Bangalore team
  - Germany team member
- **Our Impact**: Stats and achievements
- **Become a Fosterer**: Brief section on fostering cats (detailed form for v1)

#### 6. Contact Us
**Priority: P0 (Must Have)**

- **Contact Methods**:
  - General inquiries email
  - Adoption-specific email
  - Germany contact (separate)
  - Instagram: @purrfectlove.bangalore
  - Phone (if available)

- **Contact Form** (P1):
  - Name
  - Email
  - Subject dropdown (General, Adoption, Fostering, Other)
  - Message
  - Uses EmailJS or Formspree (free tier)

- **Response Time**: "We typically respond within 48 hours"
- **Office Hours** (if applicable)
- **No physical location disclaimer** (if that's the case)

---

## Priority Matrix

### P0 - Must Have for Launch
**These are essential for v0 to go live**

- [ ] Home page with hero and mission
- [ ] Adoption page with cat listings
- [ ] Link to existing Google Form (adoption application)
- [ ] Adoption process explained clearly
- [ ] First Days guide (essential supplies + tips)
- [ ] About Us page
- [ ] Contact page with email addresses
- [ ] Mobile responsive design
- [ ] Basic SEO (meta tags, page titles)
- [ ] Clear "No adoption fees" messaging

### P1 - Should Have (Add within 2-4 weeks of launch)
**Critical for ongoing operations**

- [ ] **Content Management System (CMS)** - High priority due to frequent cat updates
  - Sanity.io
  - Team can add/edit/remove cats without developer
  - Image upload and management
  - Mark cats as adopted/returned
- [ ] Filter functionality on adoption page
- [ ] Contact form (vs just email addresses)
- [ ] Photo gallery for each cat (multiple images)

### P2 - Nice to Have (v1+)
**Future enhancements**

- [ ] Instagram feed integration
- [ ] Success stories section with more detail
- [ ] Fostering information section
- [ ] Newsletter signup (free: Mailchimp, Substack)
- [ ] German version of entire site
- [ ] Blog/resources section
- [ ] **Become a Fosterer page** (requirements, benefits, application)
- [ ] Cat care guides/articles
- [ ] Lost & found section
- [ ] Sponsorship program
- [ ] Donation integration (Razorpay/Stripe)

### P3 - Advanced Features (v2+)
**Long-term enhancements and automation**

- [ ] Advanced application analytics dashboard
- [ ] Foster portal (track cats in foster care)
- [ ] Automated email sequences
- [ ] Calendar integration for home visits
- [ ] Advanced analytics dashboard
- [ ] Mobile app (future consideration)

---

## Technical Specifications

### Tech Stack

**Platform Stack (4 Core Services):**
1. **Vercel** - Hosting & deployment
2. **GitHub** - Code repository
3. **GoDaddy** - Domain registration
4. **Sanity.io** - CMS + adoption management system

**Additional Free Tools:**
- Next.js 15.5.4 (framework)
- EmailJS/Formspree (contact forms)
- Google Analytics 4 (analytics)
- Cloudflare Turnstile (spam protection)

### Sanity.io - All Backend Needs

**What Sanity Handles:**
- ✅ Cat profiles (CMS)
- ✅ Team bios, FAQs, success stories (CMS)
- ✅ Adoption applications (forms + data)
- ✅ Application review pipeline
- ✅ Team feedback and voting
- ✅ Image hosting and optimization
- ✅ All content management

**Sanity Free Tier:**
- 3 users (core team)
- Unlimited documents (cats, applications, etc.)
- Unlimited API requests
- 10GB bandwidth
- 5GB asset storage
- Global CDN included

### Free Tools & Services

**Deployment:**
- Vercel (free tier: 100GB bandwidth, unlimited requests)
- Automatic deployments from GitHub
- Preview deployments for each PR
- Built-in image optimization
- Environment variables management

**Forms:**
- Adoption Application: Custom form → Sanity (v0.5+)
- Contact Form (P1): EmailJS or Formspree (500 submissions/month free)
- Spam Protection: Cloudflare Turnstile (free)

**Content Management:**
- **CMS**: Sanity.io (3 users, unlimited content, fast CDN)
- Sanity Studio for team to manage all content
- Next.js integration via `next-sanity` package

**Media:**
- Images: Sanity's built-in CDN (included)
- Image Optimization: Sanity + Next.js Image component

**Analytics:**
- Google Analytics 4 (free)
- Vercel Analytics (free tier)

**Email:**
- Gmail accounts (free)
- EmailJS for contact form automation (free tier: 200 emails/month)

**Future (v2+):**
- Newsletter: Mailchimp (2,000 contacts free) or Substack
- Payments: Razorpay (India) or Stripe (international)

### Performance Goals
- Page load time: < 3 seconds
- Lighthouse score: > 90
- Mobile-first, fully responsive
- Image optimization (WebP/AVIF format)
- Accessible (WCAG 2.1 AA)

### Recommended Setup Commands

**Vercel Setup:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from your Next.js repo
vercel

# Connect domain
vercel domains add purrfectlove.org
```

**Sanity Setup (Mid-Late November 2025):**
```bash
# Create new Sanity project
npm create sanity@latest

# Choose:
# - Project name: Purrfect Love
# - Dataset: production
# - Output path: ./sanity (or ./studio)
# - Schema: Clean project (we'll add our own)

# Install in Next.js project
npm install next-sanity @sanity/image-url

# Start Sanity Studio locally
cd sanity (or studio)
npm run dev
# Opens at localhost:3333
```

**Environment Variables:**
```bash
# In Next.js project root, create .env.local
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_token

# Add to Vercel:
vercel env add NEXT_PUBLIC_SANITY_PROJECT_ID
vercel env add NEXT_PUBLIC_SANITY_DATASET
vercel env add SANITY_API_TOKEN
```

**Analytics:**
```bash
# Install Google Analytics
npm install @next/third-parties

# Add to layout.js:
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
      <GoogleAnalytics gaId="G-XXXXXXXXXX" />
    </html>
  )
}
```

---

## Content Requirements

### Brand Voice
- Warm and caring
- Professional but approachable
- Informative without being overwhelming
- Cat-positive and encouraging

### Visual Assets Needed

**P0 - Required for Launch:**
- [ ] Logo (design pending)
- [ ] Cat photos (minimum 5-10 cats)
  - High quality (min 1200px width)
  - Good lighting
  - Show personality
- [ ] Placeholder images for cats without photos
- [ ] Team photos (optional but recommended)

**P1 - Nice to Have:**
- [ ] Brand pattern/background elements
- [ ] Success story photos
- [ ] Icons for adoption process steps
- [ ] Social media assets

### Brand Colors (from current code)
- Primary Blue: `#2a4674`
- Accent Yellow: `#ffc544`
- Background: White/Light gray
- Text: Dark gray/Black

**To Define:**
- Success/confirmation green
- Error/warning red
- Neutral grays

---

## Internal Tools - Sanity-Based Adoption Management System (December 2025)

### Overview
**PRIORITY: Implement in December 2025 (v0.5)** - immediately after v0 launch.

Replace Google Forms with custom application form integrated with Sanity. Team reviews applications, provides feedback, and tracks pipeline all in Sanity Studio.

### Sanity Schema for Applications

```javascript
// schemas/application.js
export default {
  name: 'application',
  title: 'Adoption Application',
  type: 'document',
  fields: [
    // Applicant Information
    {
      name: 'applicantName',
      title: 'Applicant Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: Rule => Rule.required().email()
    },
    {
      name: 'phone',
      title: 'Phone',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'address',
      title: 'Address',
      type: 'text'
    },
    
    // Cat Reference
    {
      name: 'cat',
      title: 'Interested in Cat',
      type: 'reference',
      to: [{type: 'cat'}],
      validation: Rule => Rule.required()
    },
    
    // Application Details
    {
      name: 'housingType',
      title: 'Housing Type',
      type: 'string',
      options: {
        list: [
          {title: 'Own House', value: 'own'},
          {title: 'Rented Apartment', value: 'rent'},
          {title: 'Other', value: 'other'}
        ]
      }
    },
    {
      name: 'hasOtherPets',
      title: 'Has Other Pets',
      type: 'boolean'
    },
    {
      name: 'otherPetsDetails',
      title: 'Other Pets Details',
      type: 'text',
      hidden: ({parent}) => !parent?.hasOtherPets
    },
    {
      name: 'whyAdopt',
      title: 'Why Do You Want to Adopt?',
      type: 'text',
      validation: Rule => Rule.required().min(50)
    },
    {
      name: 'experience',
      title: 'Experience with Cats',
      type: 'text'
    },
    
    // Pipeline Status
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: '🆕 New', value: 'new'},
          {title: '👀 Under Review', value: 'review'},
          {title: '📞 Interview Scheduled', value: 'interview'},
          {title: '🏠 Home Visit Pending', value: 'homeVisit'},
          {title: '✅ Approved', value: 'approved'},
          {title: '❌ Rejected', value: 'rejected'},
          {title: '🎉 Adopted', value: 'adopted'}
        ]
      },
      initialValue: 'new'
    },
    
    // Team Collaboration
    {
      name: 'assignedTo',
      title: 'Assigned To',
      type: 'string'
    },
    {
      name: 'teamNotes',
      title: 'Team Notes',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          {name: 'author', type: 'string', title: 'Team Member'},
          {name: 'note', type: 'text', title: 'Note'},
          {name: 'timestamp', type: 'datetime', title: 'Date'},
          {
            name: 'vote',
            type: 'string',
            title: 'Vote',
            options: {
              list: ['Approve', 'Reject', 'Needs Discussion']
            }
          }
        ],
        preview: {
          select: {
            author: 'author',
            note: 'note',
            vote: 'vote'
          },
          prepare({author, note, vote}) {
            return {
              title: `${author} - ${vote}`,
              subtitle: note
            }
          }
        }
      }]
    },
    
    // Scheduling
    {
      name: 'interviewDate',
      title: 'Interview Date',
      type: 'datetime'
    },
    {
      name: 'homeVisitDate',
      title: 'Home Visit Date',
      type: 'datetime'
    },
    
    // Decision
    {
      name: 'decision',
      title: 'Final Decision',
      type: 'text'
    },
    {
      name: 'decisionDate',
      title: 'Decision Date',
      type: 'datetime'
    },
    
    // Metadata
    {
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      initialValue: () => new Date().toISOString()
    }
  ],
  
  preview: {
    select: {
      name: 'applicantName',
      cat: 'cat.name',
      status: 'status',
      date: 'submittedAt'
    },
    prepare({name, cat, status, date}) {
      return {
        title: name,
        subtitle: `${cat} - ${status} - ${new Date(date).toLocaleDateString()}`
      }
    }
  }
}
```

### Custom Sanity Studio Views

**Kanban Board View:**
```javascript
// sanity.config.js
import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'

export default defineConfig({
  // ... other config
  plugins: [
    deskTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            // Applications Board
            S.listItem()
              .title('📋 Applications')
              .child(
                S.list()
                  .title('By Status')
                  .items([
                    S.listItem()
                      .title('🆕 New Applications')
                      .child(
                        S.documentList()
                          .title('New')
                          .filter('_type == "application" && status == "new"')
                      ),
                    S.listItem()
                      .title('👀 Under Review')
                      .child(
                        S.documentList()
                          .title('Review')
                          .filter('_type == "application" && status == "review"')
                      ),
                    S.listItem()
                      .title('📞 Interview Scheduled')
                      .child(
                        S.documentList()
                          .title('Interview')
                          .filter('_type == "application" && status == "interview"')
                      ),
                    S.listItem()
                      .title('🏠 Home Visit Pending')
                      .child(
                        S.documentList()
                          .title('Home Visit')
                          .filter('_type == "application" && status == "homeVisit"')
                      ),
                    S.listItem()
                      .title('✅ Approved')
                      .child(
                        S.documentList()
                          .title('Approved')
                          .filter('_type == "application" && status == "approved"')
                      ),
                    S.listItem()
                      .title('🎉 Adopted')
                      .child(
                        S.documentList()
                          .title('Adopted')
                          .filter('_type == "application" && status == "adopted"')
                      )
                  ])
              ),
              
            // Cats
            S.documentTypeListItem('cat').title('🐱 Cats'),
            
            // Other content
            S.documentTypeListItem('successStory').title('Success Stories'),
            S.documentTypeListItem('teamMember').title('Team'),
            S.documentTypeListItem('faq').title('FAQs')
          ])
    })
  ]
})
```

### Application Form on Website

**Custom form component:**
```javascript
// pages/apply/[catId].js
import {useState} from 'react'
import {sanityClient} from '@/lib/sanity'

export default function ApplyPage({cat}) {
  const [formData, setFormData] = useState({})
  const [submitting, setSubmitting] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // Create application in Sanity
      await sanityClient.create({
        _type: 'application',
        cat: {
          _type: 'reference',
          _ref: cat._id
        },
        applicantName: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        housingType: formData.housing,
        hasOtherPets: formData.hasOtherPets,
        otherPetsDetails: formData.otherPetsDetails,
        whyAdopt: formData.whyAdopt,
        experience: formData.experience,
        status: 'new',
        submittedAt: new Date().toISOString()
      })
      
      // Send confirmation email
      await fetch('/api/send-confirmation', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          cat: cat.name
        })
      })
      
      // Success message
      alert('Application submitted successfully!')
      
    } catch (error) {
      alert('Error submitting application. Please try again.')
    }
    
    setSubmitting(false)
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Application'}
      </button>
    </form>
  )
}
```

### Team Workflow in Sanity Studio

**What team sees:**

1. **Applications Dashboard** - Organized by status
2. **Click any application** - See full details
3. **Add notes** - Team members can comment
4. **Vote** - Approve/Reject/Discuss
5. **Change status** - Drag to new status or update
6. **Schedule** - Set interview/home visit dates
7. **Export** - Download as CSV anytime

### Email Notifications

**Webhook for status changes:**
```javascript
// pages/api/sanity-webhook.js
export default async function handler(req, res) {
  const {_type, status, email, applicantName, cat} = req.body
  
  if (_type === 'application') {
    // Send email based on status
    const emailTemplates = {
      review: 'Your application is under review',
      interview: 'Interview scheduled',
      approved: 'Application approved!',
      rejected: 'Application update',
      adopted: 'Congratulations on your new cat!'
    }
    
    if (emailTemplates[status]) {
      await sendEmail({
        to: email,
        subject: `Purrfect Love - ${emailTemplates[status]}`,
        body: `Hi ${applicantName}, ...`
      })
    }
  }
  
  res.status(200).json({sent: true})
}
```

**Setup:**
- Sanity Dashboard → API → Webhooks
- Add webhook: `https://purrfectlove.org/api/sanity-webhook`
- Trigger: On update of 'application'

### Optional: Google Sheets Sync

For backup and analysis:

```javascript
// Same webhook, also sync to Google Sheets
await appendToGoogleSheet({
  name: applicantName,
  email: email,
  cat: cat.name,
  status: status,
  date: new Date().toISOString()
})
```

### Implementation Timeline

**Week 1 (Early December):**
- [ ] Create application schema in Sanity
- [ ] Set up custom Studio views
- [ ] Test with dummy data

**Week 2 (Mid December):**
- [ ] Build application form on website
- [ ] Add spam protection (Turnstile)
- [ ] Set up webhook for email notifications
- [ ] Test end-to-end flow

**Week 3 (Late December):**
- [ ] Train team on Sanity Studio
- [ ] Create quick reference guide
- [ ] Optional: Set up Google Sheets sync
- [ ] Test with real applications

**Week 4 (End December):**
- [ ] Go live with new system
- [ ] Monitor and fix any issues
- [ ] Gather team feedback
- [ ] Document improvements for v2

### Key Features

✅ **All-in-One System**: Cats + Applications in same platform  
✅ **Real-time Updates**: Team sees new applications instantly  
✅ **Collaboration**: Notes, voting, assignments  
✅ **Pipeline Tracking**: Visual status for each application  
✅ **Direct Cat Reference**: See which cats are most popular  
✅ **Email Automation**: Notify applicants at each stage  
✅ **Export Capability**: Download data as CSV anytime  
✅ **Spam Protection**: Turnstile on application form  
✅ **Mobile Friendly**: Team can review on phone  
✅ **Version History**: Sanity tracks all changes  

---

## Launch Phases (Updated with Parallel Tracks)

### Phase 0: Current State ✓
- Coming soon page live
- Instagram active
- Google Form for adoption applications (temporary)
- GitHub repo ready
- Domain purchased

### Phase 1: Foundation (Early-Mid November 2025) - START NOW
**Backend Track (Independent of design):**

- [ ] Connect GitHub to Vercel
- [ ] Configure purrfectlove.org domain on Vercel
- [ ] Set up Google Analytics 4
- [ ] Configure email addresses (adoption@, info@, etc.)
- [ ] Set up EmailJS/Formspree
- [ ] Organize existing cat photos
- [ ] Start writing page copy

**Design Track (Parallel):**
- [ ] Logo design kickoff with Anandhi
- [ ] Site design kickoff with Chithra
- [ ] Gather design inspiration/references

**Deliverables:**
- ✅ Working deployment pipeline (Vercel + GitHub)
- ✅ Domain connected
- ✅ Analytics installed
- ✅ Email infrastructure ready

### Phase 2: CMS & Content (Mid November 2025) - DON'T WAIT
**Backend Track:**

- [ ] Create Sanity.io account and project
- [ ] Design cat content schema
- [ ] Set up other schemas (success stories, team, FAQs)
- [ ] Deploy Sanity Studio
- [ ] Invite team members (3 users max)
- [ ] Install `next-sanity` package
- [ ] Create data fetching utilities
- [ ] Add test cats to Sanity

**Content Track:**
- [ ] Finalize all page copy
- [ ] Collect 5-10 cat profiles
- [ ] Write team bios
- [ ] Create FAQ list (8-10 questions)
- [ ] Gather success stories/testimonials

**Design Track (Parallel):**
- [ ] Logo design progress
- [ ] Homepage design
- [ ] Cat card design
- [ ] Page layouts

**Deliverables:**
- ✅ Sanity CMS fully configured
- ✅ Team can add/edit cats
- ✅ All written content ready
- ✅ Test data in system

### Phase 3: Backend Development (Mid-Late November 2025) - USE PLACEHOLDER DESIGN
**Backend Track:**

- [ ] Build cat listing page (fetch from Sanity)
- [ ] Create cat detail views
- [ ] Implement search/filter logic (backend)
- [ ] Set up contact form submission
- [ ] Link to Google Form for adoption (temporary)
- [ ] Add SEO meta tags
- [ ] Implement sitemap generation
- [ ] Set up image optimization
- [ ] Create reusable components (with placeholder styling)
- [ ] Add loading states
- [ ] Implement error handling

**Design Track (Should be ready by end of this phase):**
- [ ] Finalize logo ← NEEDED FOR FINAL PHASE
- [ ] Complete all page designs ← NEEDED FOR FINAL PHASE
- [ ] Create design system documentation
- [ ] Export all design assets

**Deliverables:**
- ✅ All pages functional (basic styling)
- ✅ CMS connected and working
- ✅ Forms working
- ✅ Ready for design application

### Phase 4: Design Integration & Launch (Late November 2025)
**Integration Track:**

- [ ] Apply final logo
- [ ] Implement design system (colors, fonts, spacing)
- [ ] Style all components per designs
- [ ] Add animations/interactions
- [ ] Implement responsive layouts
- [ ] Polish mobile experience
- [ ] Test on all devices/browsers

**Content Track:**
- [ ] Upload all real cats to Sanity
- [ ] Add team photos and bios
- [ ] Populate success stories
- [ ] Final copywriting review

**Testing & Launch:**
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Lighthouse audit (>90 score)
- [ ] Accessibility check
- [ ] Team review and feedback
- [ ] Fix any bugs
- [ ] **v0 LAUNCH - END OF NOVEMBER 2025** 🚀
- [ ] Announce on Instagram
- [ ] Monitor for issues

**Deliverables:**
- ✅ Beautiful, designed website
- ✅ CMS working for team
- ✅ All content live
- ✅ Site launched publicly

### Phase 5: Adoption Application System (December 2025 - v0.5)

**Week 1 - Schema & Setup:**
- [ ] Create application schema in Sanity
- [ ] Design custom Studio views (Kanban board)
- [ ] Set up team permissions
- [ ] Test with dummy applications

**Week 2 - Form Development:**
- [ ] Build custom application form on website
- [ ] Add Cloudflare Turnstile (spam protection)
- [ ] Connect form to Sanity
- [ ] Test form submission flow

**Week 3 - Notifications & Integration:**
- [ ] Set up Sanity webhook
- [ ] Configure email notifications (status changes)
- [ ] Optional: Google Sheets sync for backup
- [ ] Test end-to-end workflow

**Week 4 - Training & Launch:**
- [ ] Train team on Sanity Studio application review
- [ ] Create documentation/quick guide
- [ ] Replace Google Form with custom form
- [ ] Monitor and iterate

**Deliverables:**
- ✅ Custom application form live on website
- ✅ Team reviews applications in Sanity Studio
- ✅ Automated email notifications
- ✅ Full pipeline tracking (New → Adopted)
- ✅ Team collaboration features (notes, voting)

### Phase 6: v1 - Enhanced Features (January 2026)
- [ ] Set up Sanity localization for German
- [ ] Translate all content to German
- [ ] Language switcher implementation
- [ ] German contact info
- [ ] Advanced filters on adoption page
- [ ] Success stories section enhancement
- [ ] Foster program page
- [ ] Newsletter signup (Mailchimp/Substack)
- [ ] Instagram feed integration
- [ ] **v1 LAUNCH - JANUARY 2026** 🚀

### Phase 7: Advanced Features (February 2026+)
- [ ] Advanced application analytics dashboard
- [ ] Donation integration (Razorpay/Stripe)
- [ ] Blog/resources section
- [ ] Foster portal with tracking
- [ ] Advanced analytics and reporting
- [ ] Automated workflows and sequences
- [ ] Additional features as needed

---

## Visual Timeline - Parallel Work Tracks

```
EARLY-MID NOVEMBER 2025: Foundation
├── PRANAV (Backend)
│   ├── Vercel setup ✓
│   ├── Domain config ✓
│   ├── Analytics setup ✓
│   └── Email setup ✓
│
├── ANANDHI (Design)
│   └── Logo design (in progress...)
│
├── CHITHRA (Design)
│   └── Design research (in progress...)
│
└── TEAM (Content)
    └── Collect cat info (in progress...)

MID NOVEMBER 2025: CMS & Content
├── PRANAV (Backend)
│   ├── Sanity project created ✓
│   ├── Cat schemas designed ✓
│   ├── Team invited ✓
│   └── Integration tested ✓
│
├── ANANDHI (Design)
│   └── Logo iterations → DELIVER BY MID-NOVEMBER
│
├── CHITHRA (Design)
│   ├── Homepage design (in progress...)
│   └── Component designs (in progress...)
│
└── TEAM (Content)
    ├── All copy written ✓
    └── Cat profiles collected ✓

MID-LATE NOVEMBER 2025: Backend Build (Placeholder Design)
├── PRANAV (Backend)
│   ├── All pages built ✓
│   ├── CMS connected ✓
│   ├── Forms working ✓
│   └── SEO configured ✓
│   (Using basic/placeholder styling)
│
├── ANANDHI (Design)
│   └── Logo delivered ✓
│
├── CHITHRA (Design)
│   ├── All designs complete ✓
│   └── Design system documented ✓
│   → DELIVER BY MID-LATE NOVEMBER
│
└── TEAM (Content)
    └── Test cats in Sanity ✓

LATE NOVEMBER 2025: Design Integration & Launch 🚀
├── PRANAV (Integration)
│   ├── Apply logo ✓
│   ├── Apply design system ✓
│   ├── Style all components ✓
│   ├── Polish & test ✓
│   └── v0 LAUNCH - END OF NOVEMBER ✓
│
├── CHITHRA (Design)
│   └── Support & feedback
│
└── TEAM (Content)
    ├── Upload real cats ✓
    └── Final review ✓

DECEMBER 2025: Adoption Application System (v0.5)
├── WEEK 1
│   └── Sanity application schema + Studio views
│
├── WEEK 2
│   └── Custom application form on website
│
├── WEEK 3
│   └── Email notifications + integrations
│
└── WEEK 4
    └── Team training + go live

JANUARY 2026: v1 Launch 🚀
├── PRANAV (Development)
│   ├── German version ✓
│   ├── Enhanced features ✓
│   └── v1 LAUNCH ✓
│
└── TEAM (Content)
    └── German translations ✓

FEBRUARY 2026+: Advanced Features
├── Application analytics dashboard
├── Donation integration
├── Foster portal
└── Advanced automation
```

### Critical Path
**Early-Mid Nov 2025**: Can work fully in parallel (no blockers)  
**Mid-Late Nov 2025**: Backend builds with placeholder (needs logo by mid-Nov)  
**Late Nov 2025**: Design integration (BLOCKER: needs all designs from Chithra)  
**End of Nov 2025**: **v0 LAUNCH** 🚀  
**December 2025**: **Application System Build**  
**January 2026**: **v1 LAUNCH** 🚀

---

## Success Metrics

### Website Performance
- Unique visitors per month
- Page views
- Average time on site
- Bounce rate
- Mobile vs desktop traffic

### Adoption Funnel
- Adoption page visits
- Application form submissions
- Applications to actual adoptions ratio
- Time from application to adoption

### Engagement
- Instagram clicks/follows from website
- Contact form submissions
- Newsletter signups (when added)

### Goals (First 3 Months - Dec 2025-Feb 2026)

**Website Performance:**
- 500+ unique visitors
- < 40% bounce rate
- Average 2+ pages per session

**Adoption Success:**
- 20+ adoption applications
- 5+ successful adoptions
- < 48 hour application response time

**Team Efficiency (v0.5 onwards):**
- 100% of applications tracked in Sanity
- Team consensus documented for all decisions
- Average review time: < 3 days per application
- Zero lost applications due to tracking issues
- Real-time application visibility for entire team

**v0 Launch**: End of November 2025  
**v0.5 Launch**: December 2025

---

## Questions to Answer Before Launch

### For v0 (November 2025):
1. **Cat Information**: Photo requirements, min/max photos per cat
2. **Who manages content**: Which 3 team members get Sanity access?
3. **Photos**: Do we have permission to use all cat photos?
4. **Testimonials**: Do we have written consent to use success stories?
5. **Liability**: Any disclaimers needed for adoption advice?
6. **Germany connection**: How prominent should the Germany team member be?
7. **Service area**: Is adoption only in Bangalore, or wider?

### For v0.5 - Adoption Application System (December 2025):
1. **Application volume**: How many applications per week/month typically?
2. **Decision process**: Is it consensus-based? Majority vote? Single decision-maker?
3. **Interview format**: Phone? Video? In-person? (Affects form fields)
4. **Home visit**: Who does these? How scheduled?
5. **Rejection reasons**: What are common reasons? (For templates)
6. **Follow-up**: Do you check in after adoption? How? (Could be automated)
7. **Data retention**: How long keep rejected applications?
8. **Required fields**: What information is absolutely necessary in application form?

---

## Appendix

### Platform URLs & Access

**Core Services:**
- **GitHub Repo**: [Add after repo created]
- **Vercel Dashboard**: [Add after Vercel setup]
- **Vercel Live URL**: [Auto-generated after first deploy]
- **Sanity Project Dashboard**: [Add after Sanity setup]
- **Sanity Studio**: [Add after Studio deployed]
- **GoDaddy Account**: https://www.godaddy.com (DNS management)

**Live Sites:**
- **Production**: https://purrfectlove.org
- **Preview**: [Vercel preview URL]

**Analytics:**
- **Google Analytics Dashboard**: [Add after GA setup]

**Social Media:**
- **Instagram**: https://instagram.com/purrfectlove.bangalore

**Documentation:**
- Next.js Documentation: https://nextjs.org/docs
- Vercel Deployment Guide: https://vercel.com/docs
- Sanity.io Documentation: https://www.sanity.io/docs
- Google Analytics Setup: https://analytics.google.com
- Cloudflare Turnstile: https://www.cloudflare.com/products/turnstile/

> **Note**: Update STATUS.md with actual URLs as platforms are configured.

### Team Contacts
- Developer: Pranav
- Logo Design: Anandhi
- Site Design: Chithra
- [Primary team contact name & role]
- [Germany team member name & role]

---

**Document Version**: 4.0 (Final - Sanity All-in-One)  
**Last Updated**: October 2025  
**Next Review**: After v0 launch (End of November 2025)  
**Prepared by**: Pranav (co-developer with Claude)

**Tech Stack Summary:**
1. ✅ **Vercel** - Hosting
2. ✅ **GitHub** - Code repository
3. ✅ **GoDaddy** - Domain
4. ✅ **Sanity.io** - CMS + Adoption Management

**Key Milestones:**
- v0 Launch: End of November 2025 (Public website with Sanity CMS)
- v0.5: December 2025 (Custom application system in Sanity)
- v1 Launch: January 2026 (German version)
- v2+: February 2026 onwards (Advanced features)