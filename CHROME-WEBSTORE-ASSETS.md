# Chrome Web Store Listing Assets

Complete guide for publishing CRMSYNC to the Chrome Web Store.

---

## Store Listing Information

### Extension Name
```
CRMSYNC - Gmail Contact Sync
```

### Short Description (132 characters max)
```
Auto-sync Gmail contacts to HubSpot & Salesforce. AI-powered detection, zero manual entry. Free forever plan available.
```

### Detailed Description (16,000 characters max)
```
🚀 STOP WASTING 6+ HOURS A WEEK ON DATA ENTRY

CRMSYNC automatically captures contacts from every email you read in Gmail and syncs them directly to your CRM. No more copy-pasting. No more missed contacts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ KEY FEATURES

📧 AUTOMATIC CONTACT DETECTION
• AI extracts names, emails, phone numbers, and companies from every email
• Works on email headers, signatures, and body text
• Real-time detection as you browse your inbox

🔄 ONE-CLICK CRM SYNC
• Push contacts to HubSpot with one click
• Push contacts to Salesforce with one click
• Smart duplicate detection prevents messy CRM data
• Bi-directional sync keeps everything updated

⚡ SMART AUTOMATION
• Auto-approve mode for hands-free operation
• Manual approval mode for full control
• Exclude specific domains, names, or emails
• Set up once, works forever

☁️ CLOUD SYNC (PRO)
• Access contacts from any device
• Automatic backup of all your data
• Sync across multiple computers

📊 ANALYTICS & INSIGHTS
• Track contacts added per day/week/month
• See sync history and status
• Export reports as CSV

🔒 PRIVACY FIRST
• Your email content is NEVER stored
• Contacts processed locally first
• GDPR and CCPA compliant
• You control your data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 PERFECT FOR

• Sales professionals tired of manual data entry
• Business development reps building pipelines
• Account managers tracking relationships
• Recruiters managing candidate contacts
• Anyone who emails a lot and uses a CRM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 PRICING

FREE FOREVER
• 50 contacts per month
• Gmail integration
• 1 CRM connection
• CSV export

PRO ($9/month)
• Unlimited contacts
• All CRM integrations
• Cloud sync & backup
• Priority support

BUSINESS ($29/month)
• Everything in Pro
• Team collaboration
• Admin dashboard
• API access

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 WHY USERS LOVE CRMSYNC

"I used to spend 6 hours a week copy-pasting contacts. Now it's completely automatic."
— Sarah, Sales Director

"Added 47 contacts last week without touching a form once. This is exactly what I needed."
— Michael, Founder

"My team synced 340 contacts in December with zero manual work."
— Jennifer, RevOps Manager

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 GET STARTED IN 2 MINUTES

1. Install the extension
2. Open Gmail
3. Start capturing contacts automatically!

No sign-up required to try. Create an account when you want cloud sync or CRM integration.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 SUPPORT

Website: https://crm-sync.net
Email: support@crm-sync.net
Documentation: https://crm-sync.net/docs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Built with ❤️ in Denmark by a sales ops professional who was tired of manual data entry.
```

---

## Required Images

### 1. Extension Icon
Already in your extension:
- `icons/icon16.png` (16x16)
- `icons/icon48.png` (48x48)
- `icons/icon128.png` (128x128)

### 2. Screenshots (1280x800 or 640x400)
You need **at least 1, recommended 5** screenshots.

**Screenshot 1: Contact Detection**
- Show Gmail with an email open
- CRMSYNC sidebar/popup showing "New Contact Found"
- Highlight the extracted contact info

**Screenshot 2: Extension Popup**
- Show the popup with contacts list
- Display stats (total contacts, pending, today)
- Show the search/filter options

**Screenshot 3: CRM Integration**
- Show the Integrations tab
- Display connected HubSpot/Salesforce
- Show "Sync All" and "Push" buttons

**Screenshot 4: Settings & Exclusions**
- Show the Settings tab
- Display exclusion tags (domains, names)
- Show toggle options

**Screenshot 5: One-Click Sync**
- Show a contact being synced
- Display success message
- Show the "In CRM" badge

### 3. Promotional Tiles

**Small Tile (440x280)**
- CRMSYNC logo
- Tagline: "Gmail to CRM in seconds"
- Show contact → CRM visual

**Large Tile (920x680) - Optional**
- More detailed feature showcase
- Include screenshot + text overlay

**Marquee (1400x560) - Optional**
- Hero-style banner
- "Stop typing contacts into your CRM"

---

## Screenshot Creation Tips

### Option A: Manual Screenshots
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Set custom size: 1280x800
4. Take screenshot (Ctrl+Shift+P → "Capture screenshot")

### Option B: Figma/Canva Template
1. Create 1280x800 canvas
2. Add browser mockup frame
3. Paste actual screenshot
4. Add annotations/highlights
5. Export as PNG

### Design Guidelines
- Use your brand colors (#667eea → #764ba2 gradient)
- Add subtle drop shadows to elements
- Use arrows/highlights to point out features
- Keep text minimal but impactful
- Match your website's design language

---

## Category & Tags

### Primary Category
```
Productivity
```

### Additional Categories
```
Communication
Business Tools
```

### Tags/Keywords (Not visible but helps search)
```
gmail, crm, hubspot, salesforce, contacts, sync, automation, sales, email, data entry
```

---

## Privacy Practices

### Required Disclosures

**Single Purpose Description:**
```
CRMSYNC extracts contact information from Gmail emails and syncs them to CRM platforms (HubSpot, Salesforce).
```

**Permissions Justification:**

| Permission | Justification |
|------------|---------------|
| storage | Store contacts, settings, and authentication tokens locally |
| activeTab | Detect when user is on Gmail to activate contact extraction |
| scripting | Inject content script to detect contacts in Gmail |
| downloads | Allow CSV export of contacts |
| identity | Enable OAuth authentication with Google and CRM platforms |
| alarms | Schedule background tasks like token refresh and sync |

**Host Permissions:**

| Domain | Justification |
|--------|---------------|
| mail.google.com | Extract contacts from Gmail interface |
| crm-sync.net | Authenticate users and sync with website |
| crmsync-api.onrender.com | API calls for cloud sync, CRM integration |

**Data Usage Disclosure:**
- ✅ Personally identifiable information (emails, names from contacts)
- ❌ Health information
- ❌ Financial information
- ❌ Authentication information
- ❌ Personal communications (we don't read email content)
- ✅ Location (not collected)
- ❌ Web history
- ❌ User activity

**Data Use Purposes:**
- ✅ Functionality (core feature - contact sync)
- ❌ Analytics (only anonymous usage stats)
- ❌ Developer communications
- ❌ Advertising
- ❌ Credit purposes
- ❌ Personalization

---

## Submission Checklist

### Before Submitting
- [ ] All icons are correct sizes (16, 48, 128px)
- [ ] Screenshots are 1280x800 or 640x400
- [ ] Privacy policy URL works (crm-sync.net/privacy or #/privacy)
- [ ] Extension works correctly when installed
- [ ] No console errors in extension
- [ ] Manifest.json has correct version number
- [ ] Description is under 16,000 characters

### Account Requirements
- [ ] $5 one-time developer registration fee paid
- [ ] Developer account verified
- [ ] Two-factor authentication enabled (recommended)

### Review Timeline
- First submission: 1-3 business days
- Updates: Usually same day
- Rejections: Fix issues and resubmit

---

## Common Rejection Reasons & Fixes

### 1. "Missing or inadequate privacy policy"
**Fix:** Ensure crm-sync.net/#/privacy has comprehensive content (see WEBSITE-CONTENT-UPDATE.md)

### 2. "Permission justifications insufficient"
**Fix:** Add detailed justifications in Developer Dashboard for each permission

### 3. "Misleading functionality"
**Fix:** Ensure description matches actual features

### 4. "Broken functionality"
**Fix:** Test all features before submitting

### 5. "Low quality screenshots"
**Fix:** Use 1280x800 screenshots with good lighting and annotations

---

## Post-Publish Tasks

- [ ] Set up Google Alerts for "CRMSYNC" reviews
- [ ] Respond to user reviews within 24 hours
- [ ] Monitor crash reports in Developer Dashboard
- [ ] Track installs and active users
- [ ] Plan feature updates based on feedback
