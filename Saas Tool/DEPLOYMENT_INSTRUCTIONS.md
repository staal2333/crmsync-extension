# 📦 Chrome Extension Deployment Instructions

## Before Deployment

### 1. Update Configuration

**File: `subscriptionService.js`**

Find these lines and update:

```javascript
const API_CONFIG = {
  LOCAL: 'http://localhost:3000',
  PRODUCTION: 'https://YOUR-BACKEND-URL.onrender.com', // ← Update this!
  ENVIRONMENT: 'local' // ← Change to 'production' for deployment!
};
```

And update the pricing URL:

```javascript
const PRICING_URL = API_CONFIG.ENVIRONMENT === 'production'
  ? 'https://YOUR-DOMAIN.com/pricing' // ← Update this!
  : 'http://localhost:3001/pricing';
```

### 2. Update Manifest Version

**File: `manifest.json`**

Increment the version number:

```json
{
  "version": "2.0.1"  // Increment for each submission
}
```

### 3. Remove Debug Code

Search for and remove/disable:
- `console.log()` statements (or disable them)
- Any test/debug features
- Development-only features

### 4. Test Everything

- [ ] Load extension with production config
- [ ] Test contact creation
- [ ] Test contact limits (50 for free)
- [ ] Test upgrade prompts
- [ ] Test "View Plans" button (opens correct URL)
- [ ] Test with production backend

---

## Creating the ZIP File

### Option 1: Windows PowerShell

```powershell
# Navigate to parent directory
cd "C:\Users\sebas\Downloads\Saas Tool-20251202T124049Z-3-001"

# Create ZIP (exclude unnecessary files)
Compress-Archive -Path "Saas Tool\*" -DestinationPath "crmsync-v2.0.0.zip" -Force
```

### Option 2: Windows Explorer

1. Open folder containing "Saas Tool" directory
2. Right-click on "Saas Tool" folder
3. Select "Send to" → "Compressed (zipped) folder"
4. Rename to `crmsync-v2.0.0.zip`

### Option 3: Command Line (Git Bash)

```bash
cd "Saas Tool"
zip -r ../crmsync-v2.0.0.zip . -x "*.git*" -x "node_modules/*" -x ".DS_Store"
```

---

## Checklist Before Packaging

- [ ] `subscriptionService.js` → `ENVIRONMENT: 'production'`
- [ ] `subscriptionService.js` → Production backend URL set
- [ ] `subscriptionService.js` → Production pricing URL set
- [ ] `manifest.json` → Version incremented
- [ ] All console.logs removed or disabled
- [ ] Tested with production backend
- [ ] Icons present (16x16, 48x48, 128x128)
- [ ] All necessary files included
- [ ] No unnecessary files (node_modules, .git, etc.)

---

## What to Include in ZIP

**✅ Include:**
- `manifest.json`
- All `.js` files (background.js, content.js, popup.js, etc.)
- All `.html` files (popup.html, login.html, etc.)
- All `.css` files (styles.css, popup.css, etc.)
- `icons/` folder with all images
- `PRIVACY_POLICY.md` (optional)
- `README.md` (optional)

**❌ Exclude:**
- `.git/` folder
- `node_modules/` folder
- `.env` files
- `.DS_Store` files
- Test files
- Development scripts
- This DEPLOYMENT_INSTRUCTIONS.md file

---

## Chrome Web Store Submission

### 1. Go to Developer Dashboard

https://chrome.google.com/webstore/devconsole

### 2. Upload ZIP

Click "New Item" → Upload `crmsync-v2.0.0.zip`

### 3. Fill Out Listing

**Required Information:**

- **Name:** CRMSYNC - Gmail Contact Manager
- **Summary (132 chars):** Automatically capture and organize contacts from Gmail. Cloud sync, CRM export, smart reminders. Free forever!
- **Category:** Productivity
- **Language:** English

**Description:** (Use detailed description from DEPLOYMENT_CHECKLIST.md)

**Screenshots:** Upload 5 screenshots (1280x800 or 640x400)

**Promotional Images:**
- Small tile: 440x280
- Large tile: 920x680
- Marquee: 1400x560

**Links:**
- Website: https://crmsync.com
- Support: support@crmsync.com
- Privacy Policy: https://crmsync.com/privacy-policy

### 4. Privacy Practices

**Permissions Usage:**
- `storage`: Store contacts and settings locally
- `activeTab`: Read Gmail page to extract contacts
- `scripting`: Inject content script into Gmail
- `downloads`: Export contacts as CSV
- `identity`: Google OAuth sign-in (optional)

**Data Collection:**
- Contact information (names, emails, companies)
- Email activity metadata (sent/received counts)
- User settings and preferences

**Data Usage:**
- Stored locally or in user's cloud account
- Never sold to third parties
- Used only for contact management features

### 5. Submit for Review

- Answer all required questions
- Submit
- **Review time:** 3-7 business days

---

## After Approval

### 1. Extension Goes Live

- Available on Chrome Web Store
- Users can install
- Public URL: `https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID`

### 2. Monitor

- Check Chrome Web Store reviews
- Monitor support email
- Check error logs in backend
- Track metrics (installs, active users)

### 3. Update Extension ID

Save your extension ID for future updates!

**Extension ID:** `_____________________________`

---

## Updating the Extension

### When to Update

- Bug fixes
- New features
- Backend URL changes
- Security patches

### How to Update

1. Make changes to code
2. Increment version in `manifest.json`
3. Test thoroughly
4. Create new ZIP file
5. Upload to Chrome Web Store
6. Submit for review (faster than initial review)
7. Auto-updates to users within 24-48 hours

---

## Troubleshooting

**Submission Rejected:**
- Read feedback carefully
- Make required changes
- Common issues:
  - Privacy policy missing/inadequate
  - Permissions not justified
  - Screenshot quality issues
  - Description unclear
- Resubmit after fixes

**Extension Not Working After Deployment:**
- Check backend URL is correct
- Verify CORS settings on backend
- Check Chrome console for errors
- Verify production environment is set correctly

**Users Can't Install:**
- Check extension is public (not draft)
- Verify it passed review
- Check for regional restrictions

---

## Quick Reference

**Production Checklist:**
```javascript
// In subscriptionService.js:
ENVIRONMENT: 'production' // ✅
PRODUCTION: 'https://your-actual-backend.com' // ✅
Pricing URL: 'https://your-actual-domain.com/pricing' // ✅

// In manifest.json:
"version": "2.0.X" // ✅ Incremented
```

**Support:**
- Chrome Web Store Help: https://support.google.com/chrome_webstore
- Developer Forums: https://groups.google.com/a/chromium.org/g/chromium-extensions

---

**Last Updated:** December 16, 2025  
**Current Version:** 2.0.0  
**Status:** Ready for deployment

