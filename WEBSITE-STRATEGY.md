# CRMSYNC Website Strategy

## Overview

The marketing website (crm-sync.net) serves as the primary:
1. **Landing page** - First impression, value proposition
2. **Authentication hub** - Login/signup syncs with extension
3. **Payment portal** - Stripe checkout for Pro/Business
4. **Documentation** - How to use, FAQs, support

---

## Site Architecture

```
crm-sync.net/
├── / (Landing Page)
│   ├── Hero section
│   ├── Features overview
│   ├── How it works
│   ├── Testimonials
│   ├── Pricing preview
│   └── CTA: Install Extension
│
├── /pricing
│   ├── Tier comparison table
│   ├── Feature breakdown
│   ├── FAQ
│   └── CTA: Start Free / Upgrade
│
├── /login
│   ├── Email/password form
│   ├── Google OAuth button
│   └── Forgot password link
│
├── /signup
│   ├── Registration form
│   ├── Google OAuth button
│   └── Terms acceptance
│
├── /dashboard (Authenticated)
│   ├── Account overview
│   ├── Subscription status
│   ├── Contact statistics
│   └── Settings
│
├── /docs
│   ├── Getting started
│   ├── Gmail setup
│   ├── HubSpot integration
│   ├── Salesforce integration
│   └── Troubleshooting
│
├── /privacy
│   └── Privacy policy
│
├── /terms
│   └── Terms of service
│
└── /support
    ├── Contact form
    └── FAQ
```

---

## Page Specifications

### 1. Landing Page (/)

**Goal:** Convert visitors to extension installs

**Sections:**

#### Hero
```
Headline: "Stop Typing Contacts into Your CRM"
Subhead: "CRMSYNC automatically captures contacts from Gmail 
          and syncs them to HubSpot & Salesforce. Zero manual entry."
CTA: [Install Free Extension] [See How It Works]
Visual: Product screenshot or animation
```

#### Features Grid (3-4 cards)
```
1. 📧 Gmail Integration
   "Detects contacts from every email you open"

2. 🔄 Auto-Sync
   "One-click push to HubSpot or Salesforce"

3. 🧠 Smart Detection
   "Extracts name, email, phone, company automatically"

4. ⚡ Real-Time
   "See contacts appear as you browse emails"
```

#### How It Works (3 steps)
```
1. Install → Add Chrome extension (30 seconds)
2. Connect → Link your HubSpot or Salesforce account
3. Sync → Contacts flow automatically as you read emails
```

#### Social Proof
```
- User count: "10,000+ sales professionals"
- Testimonials: 2-3 short quotes with photos
- Logos: "Used by teams at [Company logos]"
```

#### Pricing Preview
```
Free: 50 contacts/month
Pro: Unlimited contacts, cloud sync
CTA: [View Full Pricing]
```

---

### 2. Pricing Page (/pricing)

**Goal:** Convert free users to Pro

**Tiers:**

| Feature | Free | Pro ($9/mo) | Business ($29/mo) |
|---------|------|-------------|-------------------|
| Contacts | 50/month | Unlimited | Unlimited |
| CRM Sync | 1 platform | All platforms | All platforms |
| Cloud Backup | ❌ | ✅ | ✅ |
| Team Sharing | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ✅ | ✅ |
| API Access | ❌ | ❌ | ✅ |

**CTA Buttons:**
- Free: "Get Started Free" → Chrome Web Store
- Pro: "Start 7-Day Trial" → Stripe Checkout
- Business: "Contact Sales" → Contact form

---

### 3. Documentation (/docs)

**Sections:**

#### Getting Started
1. Install the extension
2. Create an account
3. Connect your CRM
4. Start syncing contacts

#### Gmail Integration
- How detection works
- Exclusion settings
- Troubleshooting detection issues

#### HubSpot Setup
- OAuth connection guide
- Sync settings
- Field mapping

#### Salesforce Setup
- OAuth connection guide
- Sync settings
- Custom object support

#### FAQ
- "Why isn't a contact being detected?"
- "How do I exclude my own email?"
- "Can I sync to multiple CRMs?"
- "Is my data secure?"

---

### 4. Legal Pages

#### Privacy Policy (/privacy)
Required sections:
- What data we collect
- How we use data
- Data storage and security
- Third-party services (Stripe, HubSpot, Salesforce)
- User rights (GDPR, CCPA)
- Contact information

#### Terms of Service (/terms)
Required sections:
- Service description
- User obligations
- Payment terms
- Liability limitations
- Termination
- Dispute resolution

---

## Tech Stack Recommendations

### Option A: Static Site (Recommended for MVP)
```
- Next.js or Astro for static generation
- Tailwind CSS for styling
- Vercel or Netlify for hosting
- Stripe Elements for payment
```

**Pros:** Fast, cheap, SEO-friendly
**Cons:** Limited interactivity

### Option B: Full-Stack
```
- Next.js with API routes
- Database: Supabase or PlanetScale
- Auth: NextAuth.js
- Payments: Stripe
```

**Pros:** More control, custom dashboard
**Cons:** More complex, higher costs

---

## Design Guidelines

### Colors
```css
--primary: #667eea;      /* Purple-blue gradient start */
--primary-dark: #764ba2; /* Purple gradient end */
--success: #10b981;      /* Green for success states */
--warning: #f59e0b;      /* Orange for warnings */
--error: #ef4444;        /* Red for errors */
--text: #1e293b;         /* Dark blue-gray */
--text-light: #64748b;   /* Light gray */
--bg: #ffffff;           /* White background */
--surface: #f8fafc;      /* Light gray surface */
```

### Typography
```css
--font-heading: 'Inter', sans-serif;
--font-body: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Components
- Buttons: Rounded (8px), gradient primary, shadow on hover
- Cards: White bg, subtle border, 16px radius
- Forms: Large inputs, clear labels, inline validation
- Icons: Lucide or Heroicons

---

## SEO Strategy

### Target Keywords
- Primary: "gmail crm sync", "auto capture contacts gmail"
- Secondary: "hubspot gmail extension", "salesforce gmail integration"
- Long-tail: "automatically add gmail contacts to hubspot"

### Meta Tags (Homepage)
```html
<title>CRMSYNC - Auto-Sync Gmail Contacts to HubSpot & Salesforce</title>
<meta name="description" content="Stop manually entering contacts. CRMSYNC automatically captures contacts from Gmail and syncs to your CRM. Free Chrome extension.">
```

### Content Strategy
- Blog posts about sales productivity
- Comparison guides (vs competitors)
- Integration tutorials

---

## Launch Checklist

### Pre-Launch
- [ ] Landing page live
- [ ] Pricing page live
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Stripe checkout working
- [ ] Google OAuth working
- [ ] Extension-to-website sync working

### Launch
- [ ] Chrome Web Store listing published
- [ ] Product Hunt launch
- [ ] Social media announcements
- [ ] Email to beta users

### Post-Launch
- [ ] Analytics tracking (Plausible or GA4)
- [ ] Error monitoring (Sentry)
- [ ] User feedback collection
- [ ] Documentation expansion

---

## Timeline Estimate

| Phase | Tasks | Duration |
|-------|-------|----------|
| Design | Wireframes, mockups | 1-2 days |
| Development | Landing + Pricing | 2-3 days |
| Legal | Privacy + Terms | 1 day |
| Testing | Cross-browser, mobile | 1 day |
| Launch | Deploy + Store listing | 1 day |

**Total: 5-8 days for MVP website**

---

## Next Steps

1. **Immediate:** Create Privacy Policy and Terms of Service (required for Chrome Web Store)
2. **This week:** Build landing page with clear value proposition
3. **Next week:** Add documentation section
4. **Ongoing:** Collect user feedback, iterate on messaging
