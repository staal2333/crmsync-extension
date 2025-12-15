# Chrome Web Store Submission Checklist

## ✅ Pre-Submission Requirements

### 1. Manifest.json
- [x] Updated with icons, author, homepage_url
- [x] Content Security Policy added
- [x] All permissions justified
- [ ] Update `author` field with your actual name/company
- [ ] Update `homepage_url` with your actual website/GitHub repo

### 2. Icons (REQUIRED)
- [ ] Create `icons/icon16.png` (16x16 pixels)
- [ ] Create `icons/icon48.png` (48x48 pixels)
- [ ] Create `icons/icon128.png` (128x128 pixels)

**Icon Design Tips:**
- Use a mail/contact/CRM theme
- Simple, recognizable design
- High contrast for visibility
- Test at all sizes

**Quick Options:**
- Use online icon generator: https://www.favicon-generator.org/
- Use Figma/Canva to create
- Use free icons from Flaticon or Icons8

### 3. Privacy Policy (REQUIRED)
- [x] Privacy policy template created (`PRIVACY_POLICY.md`)
- [ ] Host privacy policy online (GitHub Pages, your website, etc.)
- [ ] Update contact email in privacy policy
- [ ] Add privacy policy URL to Chrome Web Store listing

### 4. Testing
- [ ] Test extension in unpacked mode
- [ ] Test all features work correctly
- [ ] Check for console errors
- [ ] Test on fresh Chrome profile
- [ ] Verify icons display correctly

### 5. Package Preparation
- [ ] Remove development files (if desired):
  - `preview.html` (optional - can keep for users)
  - `LOAD_INSTRUCTIONS.txt` (optional)
- [ ] Keep user-facing docs:
  - `README.md` ✓
  - `INSTALLATION.md` ✓
  - `QUICK_START.md` ✓
- [ ] Create ZIP file of extension folder

### 6. Store Listing Assets

#### Screenshots (REQUIRED)
- [ ] Small promotional tile: 440x280px
- [ ] At least 1 screenshot: 1280x800px or 640x400px
- [ ] Up to 5 screenshots showing:
  - Daily Review screen
  - Follow-up Queue
  - Wins & Objections dashboard
  - Settings panel
  - Export functionality

#### Description
- [ ] Short description (132 chars): "Automatically track email contacts, manage follow-ups, and export to CRM. Smart reply classification and daily review dashboard."
- [ ] Detailed description (up to 16,000 chars) - use README as base

#### Category
- [ ] Select: **Productivity**

### 7. Chrome Web Store Developer Account
- [ ] Sign up at: https://chrome.google.com/webstore/devconsole
- [ ] Pay one-time $5 registration fee
- [ ] Verify account

### 8. Permissions Justification (for review)

Prepare explanations for each permission:

- **storage**: "Store contact data and user preferences locally on device"
- **activeTab**: "Access Gmail/Outlook tabs when user clicks extension icon"
- **scripting**: "Inject content scripts to detect and extract email contact information"
- **downloads**: "Export contact data as CSV files to user's computer"
- **host_permissions (Gmail/Outlook)**: "Read email content to extract contact information, names, companies, and email metadata"

### 9. Submission Steps

1. [ ] Log into Chrome Web Store Developer Dashboard
2. [ ] Click "New Item"
3. [ ] Upload ZIP file
4. [ ] Fill in store listing:
   - Name: CRMSYNC
   - Summary: (132 chars)
   - Description: (full description)
   - Category: Productivity
   - Language: English
   - Privacy policy URL: (your hosted URL)
   - Homepage URL: (optional)
   - Support URL: (optional)
5. [ ] Upload screenshots
6. [ ] Upload promotional images (optional)
7. [ ] Fill in permissions justification
8. [ ] Set visibility (Unlisted for testing, Public for launch)
9. [ ] Submit for review

### 10. Post-Submission

- [ ] Review typically takes 1-3 business days
- [ ] Check email for review status
- [ ] Address any review feedback
- [ ] Once approved, extension goes live!

## 🚨 Important Notes

1. **Icons are REQUIRED** - Extension will be rejected without them
2. **Privacy Policy URL is REQUIRED** - Must be publicly accessible
3. **Permissions must be justified** - Be clear about why each permission is needed
4. **Test thoroughly** - Reviewers will test your extension
5. **No external APIs** - Your extension is compliant (all local storage)

## 📝 Quick Action Items

**Before submitting, you MUST:**
1. ✅ Update manifest.json (DONE - just update author/homepage_url)
2. ⚠️ Create icon files (16x16, 48x48, 128x128)
3. ⚠️ Host privacy policy online and get URL
4. ⚠️ Test extension in unpacked mode
5. ⚠️ Create ZIP file
6. ⚠️ Take screenshots
7. ⚠️ Write store listing description

## 🎯 Estimated Time to Complete

- Icons: 30-60 minutes
- Privacy policy hosting: 15 minutes
- Testing: 30 minutes
- Screenshots: 30 minutes
- Store listing: 30 minutes
- **Total: ~2-3 hours**

Good luck with your submission! 🚀

