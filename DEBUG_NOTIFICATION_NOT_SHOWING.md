# Debug Smart Update Notification - Step by Step

## Current Issue
Detection works (`✨ CRMSYNC: Found NEW fields for jva@statedrinks.com: {phone: '42 44 51 40'}`), but notification doesn't show.

## Testing Steps

### Step 1: Reload Extension
```
Chrome → Extensions → CRM-SYNC → Reload
```

### Step 2: Check Feature is Enabled
Popup → Settings → ✅ "Update Existing CRM Contacts"

Run in **popup console** (F12 on popup):
```javascript
chrome.storage.local.get(['settings'], (r) => {
  console.log('updateExistingContacts:', r.settings?.updateExistingContacts);
});
```

Should show: `updateExistingContacts: true`

### Step 3: Verify Contact Has CRM Mapping
Run in **popup console**:
```javascript
chrome.storage.local.get(['contacts'], (r) => {
  const contact = r.contacts.find(c => c.email === 'jva@statedrinks.com');
  console.log('Contact found:', !!contact);
  console.log('Has crmMappings:', !!contact?.crmMappings);
  console.log('crmMappings:', contact?.crmMappings);
  console.log('Current phone:', contact?.phone);
  console.log('Current company:', contact?.company);
});
```

Should show:
- `Contact found: true`
- `Has crmMappings: true`
- `crmMappings: { hubspot: { id: "..." } }`
- `Current phone: null` or `undefined` (missing field)

### Step 4: Open Gmail Thread
1. Go to Gmail
2. Open thread with `jva@statedrinks.com`
3. Watch **Gmail console** (F12 on Gmail page)

### Expected Console Logs (in order):

**Gmail Console:**
```
✨ CRMSYNC: Found NEW fields for jva@statedrinks.com: {phone: '42 44 51 40'}
📤 CRMSYNC: Sending storeUpdateCandidate message to background...
📥 CRMSYNC: Received response from background: {success: true, updateCandidate: {...}}
💾 CRMSYNC: Update candidate stored for jva@statedrinks.com
🔍 CRMSYNC: Debounce check - lastShown: null, now: 1736680000000
🔔 CRMSYNC: Debounce passed, showing notification
```

**Background Console** (Extensions → CRM-SYNC → Service Worker → "Inspect"):
```
📥 BACKGROUND: Received storeUpdateCandidate message: {action: 'storeUpdateCandidate', contact: {...}, newFields: {...}}
🔍 BACKGROUND: Contact: jva@statedrinks.com has crmMappings: true
🔍 BACKGROUND: New fields: {phone: '42 44 51 40'}
🔍 BACKGROUND: Settings: {...}
🔍 BACKGROUND: updateExistingContacts enabled? true
✅ BACKGROUND: Created update candidate for hubspot: {...}
📋 BACKGROUND: Existing pending updates: 0
💾 BACKGROUND: Added new pending update for jva@statedrinks.com (hubspot)
✅ BACKGROUND: Saved 1 pending updates to storage
📤 BACKGROUND: Sent success response with updateCandidate
```

### Step 5: Check for Errors

If you see:
- `❌ CRMSYNC: Runtime error` → Background script not responding
- `❌ BACKGROUND: Contact not synced to CRM` → Contact missing `crmMappings`
- `❌ BACKGROUND: Feature disabled` → Setting not enabled
- `⏭️ CRMSYNC: Debounce blocked` → Already shown in last 60 seconds

### Step 6: Manual Trigger (if notification still doesn't show)

Run in **Gmail console**:
```javascript
// Create fake notification manually
const testCandidate = {
  email: 'jva@statedrinks.com',
  firstName: 'Jon',
  lastName: 'Andersen',
  crmId: '12345',
  platform: 'hubspot',
  newFields: {
    phone: '42 44 51 40'
  }
};

// This function exists in content.js
showContactUpdateNotification([testCandidate]);
```

Expected: Notification appears top-right of Gmail.

If this works → problem is in message passing.
If this fails → problem is in notification UI.

### Step 7: Check Storage

Run in **popup console**:
```javascript
chrome.storage.local.get(['pendingUpdates'], (r) => {
  console.log('Pending updates:', r.pendingUpdates);
  console.log('Count:', r.pendingUpdates?.length || 0);
});
```

Should show at least 1 update for `jva@statedrinks.com`.

### Step 8: Clear Debounce (if needed)

If notification was already shown recently, clear debounce:

Run in **Gmail console**:
```javascript
sessionStorage.clear();
console.log('✅ Debounce cleared, refresh Gmail page');
```

Then refresh Gmail and open thread again.

---

## What Each Log Means

| Log | Means |
|-----|-------|
| `✨ Found NEW fields` | ✅ Detection working |
| `📤 Sending storeUpdateCandidate` | ✅ Message being sent |
| `📥 Received response` | ✅ Background responded |
| `💾 Update candidate stored` | ✅ Storage successful |
| `🔔 Debounce passed` | ✅ Ready to show notification |
| `❌ Runtime error` | ❌ Background not responding |
| `⏭️ Debounce blocked` | ℹ️ Already shown recently |

---

## Quick Fix If Logs Show Success But No Notification

Run in Gmail console:
```javascript
// Force show notification (bypasses debounce)
chrome.storage.local.get(['pendingUpdates'], (r) => {
  if (r.pendingUpdates && r.pendingUpdates.length > 0) {
    console.log('Found pending updates:', r.pendingUpdates);
    sessionStorage.clear(); // Clear debounce
    showContactUpdateNotification([r.pendingUpdates[0]]);
  } else {
    console.log('No pending updates found');
  }
});
```

---

## Report Back

Please provide:
1. ✅ or ❌ for each expected log in Step 4
2. Any error messages in red
3. Result of Step 7 (storage check)
4. Did manual trigger (Step 6) work?

This will tell us exactly where the flow is breaking!
