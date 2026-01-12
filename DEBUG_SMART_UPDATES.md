# 🔍 Smart Updates - Debugging Guide

## **Run These Tests in Order**

### **Test 1: Check if Setting is Enabled**

Open **Popup Console** (Right-click popup → Inspect → Console):

```javascript
// Check if feature is enabled
chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
  console.log('Settings:', response.settings);
  console.log('✅ Update feature enabled?', response.settings?.updateExistingContacts);
});
```

**Expected**: `true`  
**If false**: Go to Settings tab, toggle ON "Update Existing CRM Contacts"

---

### **Test 2: Check if You Have CRM-Synced Contacts**

In **Popup Console**:

```javascript
// Check for contacts with CRM mappings
chrome.storage.local.get(['contacts'], (result) => {
  const contacts = result.contacts || [];
  const crmSynced = contacts.filter(c => c.crmMappings && Object.keys(c.crmMappings).length > 0);
  
  console.log('📊 Total contacts:', contacts.length);
  console.log('📊 CRM-synced contacts:', crmSynced.length);
  
  if (crmSynced.length > 0) {
    console.log('✅ CRM-synced contacts found:');
    crmSynced.forEach(c => {
      console.log(`  - ${c.email}`, {
        platforms: Object.keys(c.crmMappings),
        hasPhone: !!c.phone,
        hasCompany: !!c.company,
        hasTitle: !!c.title
      });
    });
  } else {
    console.log('❌ NO CRM-synced contacts found!');
    console.log('💡 You need to sync a contact to HubSpot first');
  }
});
```

**Expected**: At least 1 CRM-synced contact  
**If 0**: You need to sync contacts to HubSpot first (CRM tab → Push to HubSpot)

---

### **Test 3: Manually Trigger Detection**

In **Background Console** (chrome://extensions/ → service worker):

```javascript
// Simulate detecting a contact with new info
async function testDetection() {
  // Get a real contact from storage
  const { contacts } = await chrome.storage.local.get(['contacts']);
  const crmContact = contacts.find(c => c.crmMappings && Object.keys(c.crmMappings).length > 0);
  
  if (!crmContact) {
    console.log('❌ No CRM-synced contacts found to test with');
    return;
  }
  
  console.log('🧪 Testing with contact:', crmContact.email);
  
  // Create a "new" version with added phone
  const newVersion = {
    ...crmContact,
    phone: '+45 12345678',  // NEW field
    company: 'Test Company'  // NEW field
  };
  
  // Call the detection function
  const result = await detectContactUpdates(crmContact, newVersion);
  
  if (result) {
    console.log('✅ Detection worked! Found updates:', result);
    await storeUpdateCandidate(result);
    console.log('💾 Stored update candidates');
  } else {
    console.log('❌ No updates detected');
  }
}

testDetection();
```

**Expected**: "✅ Detection worked!" with list of new fields  
**If fails**: Check console for errors

---

### **Test 4: Check Pending Updates Storage**

In **Background Console**:

```javascript
// Check what's stored
chrome.storage.local.get(['pendingUpdates'], (result) => {
  const updates = result.pendingUpdates || [];
  console.log('📦 Pending updates count:', updates.length);
  
  if (updates.length > 0) {
    console.log('✅ Found pending updates:');
    updates.forEach(u => {
      console.log(`  - ${u.email} (${u.platform}):`, Object.keys(u.newFields));
    });
  } else {
    console.log('❌ No pending updates stored');
  }
});
```

**Expected**: At least 1 pending update  
**If 0**: Detection didn't run or found no new fields

---

### **Test 5: Manually Add Test Update**

In **Background Console**:

```javascript
// Force add a test update
const testUpdate = [{
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  crmId: "12345",
  platform: "hubspot",
  newFields: {
    phone: "+45 12345678",
    company: "Test Corp"
  },
  detectedAt: new Date().toISOString()
}];

chrome.storage.local.set({ pendingUpdates: testUpdate }, () => {
  console.log('✅ Test update stored!');
  console.log('💡 Now close and reopen the popup');
});
```

Then **close and reopen popup**. Notification should appear in 1.5 seconds.

**Expected**: Notification appears at bottom  
**If not**: Check popup console for errors

---

### **Test 6: Check Popup Initialization**

In **Popup Console**:

```javascript
// Check if checkPendingUpdates ran
// Look in console history for:
// "9️⃣ Checking for pending contact updates..."
// "✓ Pending updates checked"
// or
// "🔔 Found X pending contact update(s)"
```

Look for these specific log messages when popup opens.

**If missing**: Function not running, check for errors

---

### **Test 7: Manually Trigger Notification**

In **Popup Console** (with popup open):

```javascript
// Force show notification
const testUpdates = [{
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  crmId: "12345",
  platform: "hubspot",
  newFields: {
    phone: "+45 12345678",
    company: "Test Company"
  }
}];

if (window.integrationManager) {
  window.integrationManager.showUpdateNotification(testUpdates, 'hubspot');
  console.log('✅ Triggered notification');
} else {
  console.log('❌ integrationManager not found');
}
```

**Expected**: Notification appears immediately  
**If not**: UI component issue

---

## **Common Issues & Fixes**

### Issue: "No CRM-synced contacts"
**Fix**: 
1. Go to CRM tab in popup
2. Connect HubSpot
3. Add some contacts in Gmail
4. Push to HubSpot
5. Contacts now have `crmMappings`

### Issue: "Detection doesn't run"
**Fix**:
1. Check background console for errors
2. Reload extension completely
3. Make sure `saveContact` is being called (add logs)

### Issue: "Notification doesn't appear"
**Fix**:
1. Check if `window.integrationManager` exists (run Test 7)
2. Check for CSS issues hiding notification
3. Check popup console for errors during `checkPendingUpdates`

### Issue: "Feature setting keeps turning off"
**Fix**:
1. Check `chrome.storage.local.settings`
2. Re-enable in Settings tab
3. Close and reopen popup to verify it stays ON

---

## **Quick All-in-One Diagnostic**

Run this in **Background Console**:

```javascript
async function fullDiagnostic() {
  console.log('🔍 SMART UPDATES DIAGNOSTIC\n');
  
  // 1. Check settings
  const { settings } = await chrome.storage.local.get(['settings']);
  console.log('1️⃣ Feature enabled?', settings?.updateExistingContacts || false);
  
  // 2. Check contacts
  const { contacts } = await chrome.storage.local.get(['contacts']);
  const crmSynced = contacts.filter(c => c.crmMappings && Object.keys(c.crmMappings).length > 0);
  console.log('2️⃣ Total contacts:', contacts.length);
  console.log('2️⃣ CRM-synced:', crmSynced.length);
  
  // 3. Check pending updates
  const { pendingUpdates } = await chrome.storage.local.get(['pendingUpdates']);
  console.log('3️⃣ Pending updates:', pendingUpdates?.length || 0);
  
  // 4. Check functions exist
  console.log('4️⃣ detectContactUpdates exists?', typeof detectContactUpdates === 'function');
  console.log('4️⃣ storeUpdateCandidate exists?', typeof storeUpdateCandidate === 'function');
  
  console.log('\n📋 SUMMARY:');
  if (!settings?.updateExistingContacts) {
    console.log('❌ Feature is DISABLED - enable in Settings tab');
  }
  if (crmSynced.length === 0) {
    console.log('❌ No CRM-synced contacts - sync some to HubSpot first');
  }
  if (!pendingUpdates || pendingUpdates.length === 0) {
    console.log('⚠️ No pending updates - detection hasn\'t found any yet');
  }
  if (settings?.updateExistingContacts && crmSynced.length > 0) {
    console.log('✅ Setup looks good! Try Test 3 to trigger detection');
  }
}

fullDiagnostic();
```

---

## **Most Likely Issue:**

Based on your description, the most common issues are:

1. **Feature not enabled** → Check Settings tab
2. **No CRM-synced contacts** → Sync contacts to HubSpot first
3. **Contact doesn't have new fields** → Existing contact already has phone/company/etc.

**Run the full diagnostic above and share the output!** 🔍
