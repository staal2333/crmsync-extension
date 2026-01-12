# ✅ ONBOARDING FLOW FIXED - TESTING GUIDE

## 🔴 The Problem
When you clicked "Load unpacked" to install the extension in development mode, the onboarding page didn't open automatically.

## ✅ The Fix
Chrome's `chrome.runtime.onInstalled` doesn't always fire with `reason='install'` during development.

**Solution**: Added fallback logic that:
1. Logs the actual installation reason for debugging
2. Checks if storage is empty (no authToken, no hasCompletedOnboarding)
3. If empty → Opens onboarding flow
4. If user exists → Just initializes normally

---

## 🧪 **How to Test** (Fresh Install Simulation)

### Method 1: Clean Slate Test (Recommended)

1. **Remove Extension Completely**
   ```
   1. Go to chrome://extensions/
   2. Find CRMSYNC
   3. Click "Remove" button
   4. Confirm deletion
   ```

2. **Clear Extension Data**
   ```
   1. Press F12 (open DevTools)
   2. Go to "Application" tab
   3. Click "Storage" in left sidebar
   4. Click "Clear site data"
   5. Close DevTools
   ```

3. **Load Extension Fresh**
   ```
   1. Go to chrome://extensions/
   2. Click "Load unpacked"
   3. Select: C:\Users\sebas\Downloads\Saas Tool-20251202T124049Z-3-001\Saas Tool
   4. Click "Select Folder"
   ```

4. **Expected Result** ✅
   - Background console opens showing:
     ```
     📦 Extension event: chrome_update (or shared_module_update)
     👋 First run detected (via storage check) - starting onboarding
     ```
   - **New tab opens automatically** with:
     ```
     https://www.crm-sync.net/#/register?source=extension
     ```

---

### Method 2: Quick Test (If Already Installed)

1. **Open Background Console**
   ```
   1. Go to chrome://extensions/
   2. Find CRMSYNC
   3. Click "Inspect views: service worker"
   ```

2. **Clear Storage Manually**
   In the background console, run:
   ```javascript
   chrome.storage.local.clear(() => {
     console.log('✅ Storage cleared - simulating first run');
   });
   ```

3. **Reload Extension**
   ```
   1. Go back to chrome://extensions/
   2. Click 🔄 Reload button on CRMSYNC
   3. Watch background console
   ```

4. **Expected Result** ✅
   - Console shows: "👋 First run detected - starting onboarding"
   - New tab opens with registration page

---

## 🔍 **Debugging**

### Check Installation Reason:
In background console after reload, look for:
```
📦 Extension event: [reason]
```

Common reasons:
- `install` = Fresh install from Chrome Web Store
- `chrome_update` = Chrome browser updated
- `shared_module_update` = Extension reloaded/updated
- `update` = Extension version changed

### If Onboarding DOESN'T Open:

Run this in background console:
```javascript
chrome.storage.local.get(['authToken', 'hasCompletedOnboarding'], (data) => {
  console.log('Storage check:', data);
  console.log('Should open onboarding?', !data.authToken && !data.hasCompletedOnboarding);
});
```

Expected output for first run:
```
Storage check: {}
Should open onboarding? true
```

---

## 🎯 **What Happens Next**

After onboarding opens, the flow should be:
1. User lands on `/register?source=extension`
2. User creates account
3. Completes exclusions setup
4. Connects to HubSpot/Salesforce (optional)
5. Sees "Done" page with "Try it in Gmail" button
6. Extension popup is auto-logged in

---

## 📋 **Quick Checklist**

Test these scenarios:

- [ ] **Fresh install** (Method 1) - Does onboarding open?
- [ ] **Reload with existing user** - Does it initialize without opening onboarding?
- [ ] **Service worker loads** - No "Status code: 15" error?
- [ ] **Background console logs** - See initialization messages?

---

## 🚀 **Ready to Test**

**Remove the extension, reload it fresh, and the onboarding should open automatically!**

If it doesn't work:
1. Share what you see in background console
2. Share the "Extension event: [reason]" message
3. Run the storage check command above
4. I'll debug further!
