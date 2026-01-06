# Clear Extension Cache & Re-Sync

## Problem
- Contacts showing "C" (CRM-Sync) instead of "H" (HubSpot)
- Synced indicator (✓H) not showing

## Cause
Extension is using **cached contact data** from before the backend fix.

---

## Solution: Clear Cache & Re-Sync

### **Option 1: Quick Reset (Recommended)**

1. **Open Extension Popup**
2. **Right-click** anywhere in the popup
3. Click **"Inspect"** (opens DevTools)
4. Go to **Console** tab
5. Paste this command:
   ```javascript
   chrome.storage.local.clear().then(() => {
     console.log('✅ Cache cleared! Please reload the extension.');
     window.close();
   });
   ```
6. Press **Enter**
7. **Close and reopen** the popup
8. **Sign in again** (your account still exists on backend)
9. Go to **CRM tab** → Click **"Sync from HubSpot"**
10. Contacts should now show correct badges! ✅

---

### **Option 2: Toggle Extension**

1. Go to `chrome://extensions`
2. Find **CRM-Sync** extension
3. Toggle it **OFF**
4. Wait 2 seconds
5. Toggle it **ON**
6. Open popup
7. Sign in
8. Sync from HubSpot

---

## Expected Result

After re-syncing, contacts from HubSpot should show:
- **Source Badge:** 🔵 HubSpot (not C)
- **Sync Indicator:** ✓H (green checkmark)
- **Source Label:** "hubspot" in database

---

## If Still Wrong

If contacts still show "C" after clearing cache, it means:
1. Backend is still returning wrong source values
2. Need to check backend logs
3. May need to re-run SQL migration

**Tell me if this happens!**
