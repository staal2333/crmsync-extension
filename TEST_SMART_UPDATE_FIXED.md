# Test: Smart Contact Updates (Fixed Version)

## What This Does
When you open a Gmail thread with an **existing** contact (already synced to HubSpot), the extension will:
1. Extract signature from current email
2. Compare with stored contact
3. If NEW fields found (phone/company/title) → show notification
4. Click "Review in Popup" → opens popup modal
5. Select updates → sync to HubSpot

## How to Test (Real Scenario)

### Step 1: Enable the Feature
In popup → Settings → ✅ "Update Existing CRM Contacts"

### Step 2: Find a Real Test Contact
You need a contact that:
- Is already synced to HubSpot (has `crmMappings` in storage)
- Has **MISSING** fields (e.g., only name+email, no phone)
- You can find in a Gmail thread with NEW info in signature

Run in popup console:
```javascript
// Find contacts synced to HubSpot
chrome.storage.local.get(['contacts'], (r) => {
  const synced = r.contacts.filter(c => c.crmMappings && c.crmMappings.hubspot);
  console.log('Synced contacts:', synced.length);
  
  // Find ones missing phone/company
  const missing = synced.filter(c => !c.phone || !c.company);
  console.log('Contacts with missing fields:');
  missing.forEach(c => {
    console.log(`- ${c.firstName} ${c.lastName} (${c.email})`);
    console.log(`  Missing: ${!c.phone ? 'phone' : ''} ${!c.company ? 'company' : ''}`);
  });
});
```

### Step 3: Open Gmail Thread
1. Go to Gmail
2. Open a thread with one of the contacts above
3. **Make sure the email HAS a signature** with phone/company info

### Expected Result:
- ✅ Console shows: `✨ CRMSYNC: Found NEW fields for [email]: { phone: '...', company: '...' }`
- ✅ Notification appears top-right of Gmail
- ✅ Notification shows new fields
- ✅ Click "Review in Popup" → popup opens to CRM tab
- ✅ Modal shows with checkboxes for each contact
- ✅ Select contacts → "Update Selected" → syncs to HubSpot

### Debug Console Logs (Gmail F12):

Expected sequence:
```
⏭️ CRMSYNC: contact@example.com already exists
✨ CRMSYNC: Found NEW fields for contact@example.com: {phone: "...", company: "..."}
💾 CRMSYNC: Update candidate stored for contact@example.com
🔔 Showing update notification
```

## Troubleshooting

### "No notification appears"
- Check if contact has `crmMappings.hubspot` in storage
- Check if signature was detected: look for `✍️ CRMSYNC: Found signature`
- Check if fields are actually NEW (not already stored)
- Check 60-second debounce (won't show twice in 1 minute)

### "Endless loop"
Fixed! Now uses:
- `sessionStorage` to prevent showing twice
- 60-second cooldown per contact
- Only triggers when NEW fields are found

### "Modal doesn't open"
- Click "Review in Popup" button (new label)
- Popup should auto-open and show modal
- Check popup console for `integrationManager` errors

## Manual Force-Test (Popup Console)

If you want to manually trigger a test notification:
```javascript
// Create fake update candidate
const testUpdate = {
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  crmId: '12345',
  platform: 'hubspot',
  newFields: {
    phone: '+45 12 34 56 78',
    company: 'Test Corp'
  }
};

// Store it
chrome.storage.local.set({ pendingUpdates: [testUpdate] });

// Show modal
if (window.integrationManager) {
  window.integrationManager.showUpdateReviewModal([testUpdate], 'hubspot');
}
```

## Expected User Flow

1. **User opens Gmail thread** → existing contact detected
2. **Signature scanned** → new phone/company found
3. **Notification appears**: "Contact has new information"
4. **User clicks "Review in Popup"**
5. **Popup opens automatically** to CRM tab
6. **Modal shows**:
   ```
   📋 Update 1 Contact with New Information
   
   ☑ John Doe (john@example.com)
       ➕ phone: +45 12 34 56 78
       ➕ company: Acme Inc
   
   [Update Selected] [Skip]
   ```
7. **User clicks "Update Selected"**
8. **Success toast**: "✅ Updated 1 contact in HubSpot"
9. **Storage updated** with new fields

---

**Key Fix**: Removed storage polling loop, now triggers ONLY when new signature is detected in real-time.
