# 🧪 Testing the Onboarding Flow

## Method 1: Simulate Fresh Install (Quick Test)

### Step 1: Open Extension Console
1. Click the CRMSYNC extension icon to open the popup
2. Right-click anywhere in the popup
3. Select **"Inspect"**
4. Go to the **Console** tab

### Step 2: Run Test Script
Copy and paste this into the console:

```javascript
(async function() {
  await chrome.storage.local.clear();
  await chrome.storage.sync.clear();
  console.log('✅ Storage cleared! Close popup and reopen.');
})();
```

### Step 3: Reopen Popup
1. Close the popup window
2. Click the extension icon again
3. **Onboarding should open automatically in a new tab!**

---

## Method 2: True Fresh Install (Full Test)

### Step 1: Remove Extension
1. Go to `chrome://extensions`
2. Find **CRMSYNC**
3. Click **"Remove"**
4. Confirm removal

### Step 2: Reinstall Extension
1. In `chrome://extensions`, enable **"Developer mode"** (top right)
2. Click **"Load unpacked"**
3. Select the `Saas Tool` folder
4. Extension is now reinstalled with zero data

### Step 3: Open Extension
1. Click the CRMSYNC icon
2. **Onboarding tab should open immediately!**

---

## What Should Happen

### ✅ Expected Behavior:
```
1. Click extension icon
2. Popup opens
3. New tab opens with onboarding.html
4. Popup shows welcome banner
5. Onboarding guides you through 5 steps
```

### ❌ If It Doesn't Work:

#### Check Console Logs:
1. Open popup → Right-click → Inspect → Console
2. Look for these logs:
   ```
   📄 DOM Content Loaded
   🔍 First-time check: { isAuthenticated: undefined, isGuest: undefined, hasSeenWelcome: undefined }
   🎉 FIRST TIME USER! Opening onboarding immediately...
   ✅ Onboarding tab opened: [tab-id]
   ⏸️ Stopping normal popup init
   ```

#### If you see different logs:
- **"Not first time user"** → Storage wasn't cleared properly
- **No logs at all** → Extension not loaded correctly
- **Error messages** → Share them with me!

---

## Debug Commands

### Check Current Storage State:
```javascript
chrome.storage.local.get(null, (data) => {
  console.log('📦 All storage:', data);
});
```

### Force First-Time State:
```javascript
(async function() {
  await chrome.storage.local.set({
    isAuthenticated: false,
    isGuest: false,
    hasSeenWelcome: false
  });
  console.log('✅ Set to first-time state');
})();
```

### Check if Onboarding File Exists:
```javascript
fetch(chrome.runtime.getURL('onboarding.html'))
  .then(r => console.log('✅ Onboarding file exists'))
  .catch(e => console.error('❌ File not found:', e));
```

---

## Common Issues

### Issue 1: Storage Not Clearing
**Symptom:** Still shows logged-in state after clearing

**Fix:**
```javascript
// Nuclear option - clear EVERYTHING
(async function() {
  await chrome.storage.local.clear();
  await chrome.storage.sync.clear();
  await chrome.storage.session.clear().catch(() => {});
  location.reload();
})();
```

### Issue 2: Onboarding Doesn't Open
**Symptom:** Popup opens but no onboarding tab

**Possible causes:**
1. `hasSeenWelcome` is still `true` → Clear storage
2. `isGuest` is `true` → Clear storage
3. `isAuthenticated` is `true` → Sign out first
4. Browser blocked popup → Check browser permissions

**Fix:** Run this in console:
```javascript
chrome.storage.local.get(['isAuthenticated', 'isGuest', 'hasSeenWelcome'], (data) => {
  console.log('Current state:', data);
  if (data.isAuthenticated || data.isGuest || data.hasSeenWelcome) {
    console.log('❌ Not in first-time state!');
  } else {
    console.log('✅ Should trigger onboarding!');
  }
});
```

### Issue 3: Onboarding Opens Every Time
**Symptom:** Onboarding keeps opening on every popup launch

**Cause:** `hasSeenWelcome` not being set after completion

**Fix:** Complete the onboarding flow OR manually set:
```javascript
chrome.storage.local.set({ hasSeenWelcome: true });
```

---

## Successful Test Checklist

- [ ] Cleared all storage
- [ ] Reopened popup
- [ ] Onboarding tab opened automatically
- [ ] Saw all 5 onboarding steps
- [ ] Animations worked smoothly
- [ ] Could skip or complete flow
- [ ] After completion, popup works normally
- [ ] Onboarding doesn't open again

---

## Need More Help?

Share these details:
1. Console logs from popup
2. Console logs from background script (chrome://extensions → service worker)
3. Current storage state
4. Browser version
5. Any error messages

The onboarding should now open 100% reliably on fresh installs! 🎉
