# Background Script Not Responding - Debug Guide

## Problem
The `TRIGGER_HUBSPOT_SYNC` message is sent but background script never responds.
No callback fires (not even with error).

## Step 1: Check if Background Script is Running

1. Open `chrome://extensions/`
2. Find **CRMSYNC** extension
3. Look for **"Inspect views: service worker"** link
4. If it says **"service worker (inactive)"** → Click it to activate
5. If there's NO "Inspect views" link → Background script crashed

**If background script is inactive/crashed:**
- Click the 🔄 Reload button on the extension
- Then click "Inspect views: service worker" to open background console

## Step 2: Check Background Script Console

Once background console is open, look for:
- ❌ Red errors (especially on startup)
- ⚠️ Warnings about message listeners
- Any signs of crashes

## Step 3: Test Message Listener

In the **background script console** (NOT popup console), run:

```javascript
// Check if message listener exists
console.log('Testing message listener...');

// Manually trigger what should happen
chrome.storage.local.get(['contacts'], (r) => {
  console.log('Current contacts:', r.contacts?.length || 0);
});
```

## Step 4: Check for Syntax Errors

In background console, run:

```javascript
// Check if the function exists
typeof syncFromHubSpot
```

Should return `"function"`. If it returns `"undefined"`, there's a syntax error preventing the script from loading.

## Step 5: Manual Sync Test

If background script is running, try calling the sync function directly:

```javascript
// Get auth token
chrome.storage.local.get(['authToken'], async (data) => {
  console.log('Token exists:', !!data.authToken);
  
  if (data.authToken) {
    console.log('Calling syncFromHubSpot directly...');
    try {
      await syncFromHubSpot(data.authToken);
      console.log('✅ Manual sync completed!');
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
    }
  }
});
```

---

## Common Causes & Fixes

### Cause 1: Background Script Has Syntax Error
**Symptom**: No "Inspect views" link, or opening it shows red error on line 1

**Fix**: 
- Look at the error message
- The script failed to load due to syntax error
- Need to fix the error in background.js

### Cause 2: Message Listener Not Registered
**Symptom**: Background console shows no errors, but messages aren't received

**Fix**:
- In background console, check: `chrome.runtime.onMessage.hasListeners()`
- Should return `true`. If `false`, listener wasn't registered.

### Cause 3: Service Worker Suspended
**Symptom**: "service worker (inactive)" message

**Fix**:
- Click the link to wake it up
- Message should then work
- If it suspends again immediately, there's a keep-alive issue

---

## Quick Fix to Try First

1. Go to `chrome://extensions/`
2. **Turn OFF** the CRMSYNC extension
3. Wait 3 seconds
4. **Turn ON** the CRMSYNC extension
5. Click "Inspect views: service worker"
6. In that console, run: `console.log('Background alive!');`
7. Try the pull button again

---

## What to Report Back

Please share:
1. ✅ or ❌ - Is "Inspect views: service worker" link visible?
2. ✅ or ❌ - Are there any red errors in background console?
3. The output of: `chrome.runtime.onMessage.hasListeners()` (in background console)
4. The output of: `typeof syncFromHubSpot` (in background console)

This will tell me exactly what's wrong!
