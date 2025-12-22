# 🧹 Extension Reset Guide

## Method 1: Quick Reset (Recommended)

### Option A: Via Extension Popup Console
1. Open the extension popup (click the icon)
2. Right-click anywhere → **Inspect**
3. Go to **Console** tab
4. Copy & paste this code:

```javascript
(async function() {
  await chrome.storage.local.clear();
  await chrome.storage.sync.clear();
  await chrome.storage.local.set({
    contacts: [],
    settings: {
      darkMode: false,
      autoApprove: true,
      reminderDays: 3,
      sidebarEnabled: true,
      trackedLabels: [],
      noReplyAfterDays: [3, 7, 14],
      soundEffects: false,
      hotkeysEnabled: false
    },
    isGuest: false,
    isAuthenticated: false,
    hasSeenWelcome: false
  });
  await chrome.storage.sync.set({
    userTier: 'free',
    autoSyncEnabled: false
  });
  console.log('✅ Reset complete! Reloading...');
  setTimeout(() => window.location.reload(), 1000);
})();
```

5. Press **Enter**
6. Wait for popup to reload

### Option B: Via Background Service Worker
1. Go to `chrome://extensions`
2. Find **CRMSYNC**
3. Click **Service Worker** (in blue, under "Inspect views")
4. Copy & paste the same code from Option A
5. Press **Enter**
6. Reload the extension

---

## Method 2: Manual Reset

### Step 1: Clear Extension Data
1. Go to `chrome://extensions`
2. Find **CRMSYNC**
3. Click **Remove** button
4. Click **Add** → **Load unpacked**
5. Select the extension folder again

### Step 2: Clear Chrome Storage (Optional)
1. Go to `chrome://settings/siteData`
2. Search for "chrome-extension"
3. Remove any entries related to CRMSYNC

---

## Method 3: Nuclear Option (Complete Wipe)

### For Development/Testing Only
1. Close Chrome completely
2. Delete extension folder
3. Re-download/clone from GitHub
4. Load unpacked in Chrome
5. Fresh start!

---

## After Reset

### What You Should See:
✅ Welcome banner with "Sign In / Sign Up" button  
✅ Empty contacts list  
✅ Staging Dashboard shows "0" for all counts  
✅ No CRM connections  
✅ Guest mode available  

### Test Fresh Account Creation:
1. Click "Sign In / Sign Up"
2. Click "Create account"
3. Enter email, password, name
4. Test registration flow
5. Verify email verification (if enabled)

### Test Guest Mode:
1. Click "Continue Offline"
2. Verify guest banner appears periodically
3. Test contact capture
4. Verify data stays local

---

## Troubleshooting

### "Still seeing old data?"
- Make sure you **reloaded the extension** after clearing storage
- Try closing and reopening the popup
- Check if service worker is still running old code

### "Welcome screen not showing?"
Clear the flag manually:
```javascript
chrome.storage.local.set({ hasSeenWelcome: false });
```

### "Auth state stuck?"
Clear auth completely:
```javascript
chrome.storage.local.remove(['authToken', 'refreshToken', 'user', 'isAuthenticated']);
```

---

## Quick Commands Reference

```javascript
// Check current storage
chrome.storage.local.get(null, (data) => console.log('Local:', data));
chrome.storage.sync.get(null, (data) => console.log('Sync:', data));

// Clear everything
chrome.storage.local.clear();
chrome.storage.sync.clear();

// Reset welcome screen
chrome.storage.local.set({ hasSeenWelcome: false });

// Force guest mode
chrome.storage.local.set({ isGuest: true, isAuthenticated: false });

// Check contact count
chrome.storage.local.get(['contacts'], (d) => console.log('Contacts:', d.contacts?.length || 0));
```

---

## Backend Reset (If Needed)

### Clear Backend User Data:
If you also want to reset your backend account:

1. Go to your backend database (Render dashboard)
2. Connect to PostgreSQL shell
3. Run:
```sql
-- Delete your test user (replace email)
DELETE FROM contacts WHERE user_id IN (SELECT id FROM users WHERE email = 'test@example.com');
DELETE FROM crm_integrations WHERE user_id IN (SELECT id FROM users WHERE email = 'test@example.com');
DELETE FROM crm_contact_mappings WHERE user_id IN (SELECT id FROM users WHERE email = 'test@example.com');
DELETE FROM crm_sync_logs WHERE user_id IN (SELECT id FROM users WHERE email = 'test@example.com');
DELETE FROM users WHERE email = 'test@example.com';
```

**WARNING:** This permanently deletes all data for that user!

---

## Automated Reset Script

Run this in terminal (from extension folder):
```powershell
# Quick reset - just reload extension
Write-Host "Reloading extension..." -ForegroundColor Cyan
# (You'll need to manually reload in chrome://extensions)
```

---

Need help? The reset script is now in `reset-extension.js`!
