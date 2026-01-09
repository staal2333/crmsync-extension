# 🧹 EXTENSION CLEANUP - REMOVE BEFORE PACKAGING

These files should be DELETED before creating the ZIP for Chrome Web Store:

---

## ❌ **DOCUMENTATION FILES (Remove ALL .md files):**

```
ARCHITECTURE-FIX-MAP.md
BACKEND-SETUP-GUIDE.md
BUGS-FIXED-SUMMARY.md
BULK-ACTIONS-FIX.md
CODE-QUALITY-AUDIT.md
CONSOLE-ERRORS-FIXED.md
CONTACT-SOURCE-TRACKING.md
DEPLOYMENT_INSTRUCTIONS.md
EMAIL-SYSTEM-SUMMARY.md
FINAL-PRODUCTION-READY.md
FIXES-APPLIED.md
GITHUB-FIX-GUIDE.md
LAYOUT-FIX.md
NEW-TODAY-CLICKABLE-FEATURE.md
OAUTH-SETUP-GUIDE.md
ONBOARDING-COMPLETE.md
OPTIMAL-WORKFLOW-GUIDE.md
OPTION-A-QUICK-UI-POLISH-COMPLETE.md
OPTION-C-PRODUCTION-ESSENTIALS-COMPLETE.md
OVERVIEW-TAB-REMOVED.md
PHASE-1-FIXES-COMPLETE.md
PRIVACY_POLICY.md (keep only if needed, but privacy policy should be on website)
PRODUCTION-READY-NEXT-STEPS.md
QUICK-FIX-CHECKLIST.md
QUICK-FIX-NOW.md
QUICK-FIX-REGISTRATION.md
QUICK-WEBSITE-FIX.md
README.md (optional: keep a short version)
REGISTRATION-LOOP-FIX.md
SETTINGS-BUTTON-FIX.md
SETTINGS-MOVED-TO-HEADER.md
SMART-FEATURES-IMPLEMENTED.md
TEST-NOW.md
TESTING-CHECKLIST.md
TIER-SYNC-FIX.md
TODAY-TAB-MERGED.md
UPGRADE-PROMPTS-SUMMARY.md
WEBSITE-INTEGRATION.md
WEBSITE-LOGIN-INTEGRATION.md
WHATS-NEXT-ROADMAP.md
```

---

## ❌ **TEST/DEBUG FILES (Remove these):**

```
debug-signin.html
test-backend.html
sample-data.js
auth-callback.html (not needed for Chrome Store version)
auth-callback.js (not needed)
```

---

## ❌ **UNUSED ASSETS:**

```
icons/widget-logo.png.png (duplicate/wrong extension)
```

---

## ✅ **KEEP THESE FILES:**

### **Required:**
- `manifest.json`
- `background.js`
- `content.js`
- `popup.html`
- `popup.js`
- `popup.css`
- `styles.css`
- All icon files (icon16.png, icon48.png, icon128.png)

### **Supporting Files:**
- `config.js`
- `analytics.js`
- `auth.js`
- `darkMode.js`
- `error-handler.js`
- `feature-tour.js`
- `guest-mode-banner.js`
- `integrations.js`
- `loading-manager.js`
- `logger.js`
- `login-page.js`
- `onboarding.js`
- `popup-enhancements.js`
- `popup-subscription.js`
- `quickActions.js`
- `subscriptionService.js`
- `sync.js`
- `toast.js`

### **HTML Pages:**
- `popup.html`
- `login.html`
- `onboarding.html`

### **Icons:**
- `icons/icon16.png`
- `icons/icon48.png`
- `icons/icon128.png`
- `icons/header-logo.png`
- `icons/widget-logo-animated.gif`

---

## 🔧 **HOW TO CLEAN UP:**

### **Option 1: Manual (Safest)**
1. Go to `Saas Tool` folder
2. Delete each .md file one by one
3. Delete test-backend.html, debug-signin.html
4. Delete sample-data.js, auth-callback.html, auth-callback.js

### **Option 2: PowerShell Script**
Run this in PowerShell from the "Saas Tool" directory:

```powershell
# Delete all .md files
Get-ChildItem -Path . -Filter *.md | Remove-Item

# Delete test files
Remove-Item -Path "debug-signin.html" -ErrorAction SilentlyContinue
Remove-Item -Path "test-backend.html" -ErrorAction SilentlyContinue
Remove-Item -Path "sample-data.js" -ErrorAction SilentlyContinue
Remove-Item -Path "auth-callback.html" -ErrorAction SilentlyContinue
Remove-Item -Path "auth-callback.js" -ErrorAction SilentlyContinue
Remove-Item -Path "icons/widget-logo.png.png" -ErrorAction SilentlyContinue

Write-Host "Cleanup complete! ✅"
```

---

## ✅ **AFTER CLEANUP, YOUR FOLDER SHOULD HAVE:**

```
Saas Tool/
├── manifest.json          ✅
├── background.js          ✅
├── content.js             ✅
├── popup.html             ✅
├── popup.js               ✅
├── popup.css              ✅
├── styles.css             ✅
├── config.js              ✅
├── [other .js files]      ✅
├── [HTML pages]           ✅
└── icons/
    ├── icon16.png         ✅
    ├── icon48.png         ✅
    ├── icon128.png        ✅
    ├── header-logo.png    ✅
    └── widget-logo-animated.gif ✅
```

**Total size should be:** ~500KB - 2MB (much smaller without .md files)

---

**Ready to clean?** Let me know and I'll run the cleanup script for you! 🧹
