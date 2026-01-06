# Debugging Contact Source Display Issue

## Problem
- Database shows 1,742 contacts with `source = 'hubspot'` ✅
- But extension UI still not showing HubSpot badges

## Root Causes to Check:

### **1. Backend Not Deployed Yet**
The backend code changes (adding `source` to imports) were pushed to GitHub but **Render might not have auto-deployed them**.

**Check:**
1. Go to https://dashboard.render.com
2. Click your backend service
3. Check "Events" tab
4. Look for recent "Deploy" event

**If no recent deploy:**
- Click "Manual Deploy" button
- Select "main" branch
- Click "Deploy latest commit"

---

### **2. Frontend Caching**
Extension might be caching old contact data.

**Fix:**
1. Open extension popup
2. Press F12 (open Console)
3. Run: `chrome.storage.local.clear()`
4. Reload extension

---

### **3. Check What API Returns**

**Test the API directly:**
```bash
# In Render Shell or locally
curl https://crmsync-api.onrender.com/api/contacts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq '.contacts[0]'
```

**Expected to see:**
```json
{
  "id": "...",
  "email": "...",
  "source": "hubspot",  ← This field!
  "crmMappings": {...}
}
```

**If `source` is missing:**
- Backend needs to be deployed
- OR database column wasn't added properly

---

## Quick Debug Steps:

### **Step 1: Check Console Logs**
1. Open extension popup
2. Press F12
3. Go to "Console" tab
4. Reload popup
5. Look for contact data logs
6. Search for: `source`

**What to look for:**
```javascript
✅ Loaded 450 contacts
// Check if contacts have "source" field
```

### **Step 2: Manually Check a Contact**
In console, run:
```javascript
// Get first contact
chrome.storage.local.get('contacts', (data) => {
  console.log('First contact:', data.contacts[0]);
});
```

**Look for:**
```javascript
{
  email: "...",
  source: "hubspot"  ← Should be here!
}
```

**If `source` is missing/undefined:**
- Backend not returning it
- OR frontend not saving it

---

### **Step 3: Force Refresh from Backend**
1. Open popup
2. Go to CRM tab
3. Click "Sync from HubSpot" again
4. Check if newly synced contacts show correct source

---

## Manual Fix (Temporary):

If backend isn't deployed yet, you can manually set the source in the extension for testing:

**In Console:**
```javascript
chrome.storage.local.get('contacts', (data) => {
  const contacts = data.contacts || [];
  
  // Update all contacts with HubSpot mappings
  const updated = contacts.map(c => {
    if (c.crmMappings && c.crmMappings.hubspot) {
      c.source = 'hubspot';
    }
    return c;
  });
  
  chrome.storage.local.set({ contacts: updated }, () => {
    console.log('✅ Updated', updated.length, 'contacts');
    location.reload(); // Reload popup
  });
});
```

This will:
1. Get all contacts from storage
2. Set `source = 'hubspot'` for contacts with HubSpot mappings
3. Save them back
4. Reload popup to show new badges

---

## Expected Result After Fix:

**Contacts tab should show:**
```
Name/Company        | Email          | Status | Source | Synced
Julie Smith         | julie@ex.com   |   ●    |   🔵   |  ✓H
Luna Adams          | la@ex.com      |   ●    |   🔵   |  ✓H
Tanya Adams         | tb@ex.com      |   ●    |   🔵   |  ✓H
```

Where:
- 🔵 = HubSpot orange "H" badge (source)
- ✓H = Green checkmark + H (synced status)

---

## Most Likely Issue:

**Backend hasn't deployed the new code yet!**

The backend changes we made (setting `source = 'hubspot'` when importing) are in GitHub but not live on Render.

**Solution:**
1. Go to Render Dashboard
2. Manually deploy backend
3. Wait 2-3 minutes
4. Re-sync contacts from HubSpot
5. New imports will have correct source ✅

**Existing contacts:**
- Already fixed in database (1,742 updated)
- Just need backend to return the field
- Clear extension cache to refetch

---

## Quick Test Command:

Run this in your browser console (with popup open):

```javascript
// Check if contacts have source field
chrome.storage.local.get('contacts', (data) => {
  const contacts = data.contacts || [];
  const withSource = contacts.filter(c => c.source).length;
  const withoutSource = contacts.filter(c => !c.source).length;
  const hubspot = contacts.filter(c => c.source === 'hubspot').length;
  
  console.log('Total contacts:', contacts.length);
  console.log('With source:', withSource);
  console.log('Without source:', withoutSource);
  console.log('HubSpot source:', hubspot);
  
  // Show first few contacts
  console.table(contacts.slice(0, 5).map(c => ({
    email: c.email,
    source: c.source,
    hasMapping: !!c.crmMappings
  })));
});
```

This will tell you exactly what's in the extension's storage!
