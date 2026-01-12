# 🧪 Testing Smart Contact Updates

## ✅ Backend Endpoints Added

### HubSpot
- **Endpoint**: `PATCH /api/integrations/hubspot/update-contact`
- **File**: `crmsync-backend/src/controllers/hubspotController.js`
- **Route**: Added to `crmsync-backend/src/routes/integrations.js`

### Salesforce
- **Endpoint**: `PATCH /api/integrations/salesforce/update-contact`
- **File**: `crmsync-backend/src/controllers/salesforceController.js`
- **Route**: Added to `crmsync-backend/src/routes/integrations.js`

---

## 🚀 How to Deploy & Test

### Step 1: Deploy Backend

```bash
# Commit and push changes
cd "c:\Users\sebas\Downloads\Saas Tool-20251202T124049Z-3-001"
git add crmsync-backend/
git commit -m "Add smart contact update endpoints for HubSpot and Salesforce"
git push origin main
```

Then Render.com will auto-deploy (takes 2-3 minutes).

---

### Step 2: Test Backend API (Without Extension)

Once deployed, test the endpoint directly:

#### Test HubSpot Update

```bash
# Get your auth token first
# (From extension popup console or login response)
TOKEN="your_jwt_token_here"

# Test update endpoint
curl -X PATCH https://crmsync-api.onrender.com/api/integrations/hubspot/update-contact \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "crmId": "12345",
    "email": "test@example.com",
    "updates": {
      "phone": "+45 12345678",
      "company": "Test Company"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "contactId": "12345",
  "updated": ["phone", "company"],
  "hubspotResponse": {
    "id": "12345",
    "updatedAt": "2026-01-12T..."
  }
}
```

**Error Responses:**
- `400`: Missing crmId or updates
- `403`: HubSpot not connected or token expired
- `404`: Contact not found in HubSpot
- `500`: Update failed

---

### Step 3: Test Frontend UI (Manual Trigger)

1. **Reload Extension**
   ```
   chrome://extensions/ → CRMSYNC → Reload
   ```

2. **Enable Setting**
   - Open popup
   - Settings tab
   - Toggle ON: "Update Existing CRM Contacts"

3. **Open Popup Console**
   - Right-click extension icon → Inspect popup
   - Go to Console tab

4. **Run Test Code**
   ```javascript
   // Test notification with fake data
   const testUpdates = [
     {
       email: "josefine@test.com",
       firstName: "Josefine",
       lastName: "Møller",
       crmId: "12345",
       newFields: {
         phone: "+45 12345678",
         company: "TechCorp Denmark"
       }
     },
     {
       email: "sebastian@test.com",
       firstName: "Sebastian",
       lastName: "Staal",
       crmId: "67890",
       newFields: {
         title: "CEO",
         linkedin: "https://linkedin.com/in/sebastian"
       }
     }
   ];

   // Show notification
   window.integrationManager.showUpdateNotification(testUpdates, 'hubspot');
   ```

5. **Expected Result**
   - ✅ Small notification appears at bottom
   - ✅ Shows: "2 contacts have new information"
   - ✅ [Review] [Skip] buttons visible

6. **Click [Review]**
   - ✅ Modal opens
   - ✅ Shows both contacts with checkboxes
   - ✅ Shows new fields (phone, company, title, linkedin)
   - ✅ [Update Selected (2)] [Cancel] buttons

7. **Click [Update Selected]**
   - Will call backend API
   - Should show progress notification
   - ⚠️ Will FAIL if contact IDs are fake (expected!)

---

### Step 4: Test with REAL HubSpot Data

To test the full flow with real data, you need to integrate it into the sync flow. For now, you can test manually:

1. **Get Real Contact IDs from HubSpot**
   ```javascript
   // In popup console
   const contacts = await chrome.storage.local.get(['contacts']);
   console.log('Your contacts:', contacts.contacts);
   
   // Find one that exists in HubSpot
   const hubspotContact = contacts.contacts.find(c => c.crmMappings?.hubspot);
   console.log('HubSpot contact:', hubspotContact);
   ```

2. **Trigger Update with Real ID**
   ```javascript
   // Use real contact ID from above
   const realUpdate = [{
     email: hubspotContact.email,
     firstName: hubspotContact.firstName,
     lastName: hubspotContact.lastName,
     crmId: hubspotContact.crmMappings.hubspot.id,  // REAL ID
     newFields: {
       phone: "+45 98765432"  // New phone to add
     }
   }];

   window.integrationManager.showUpdateNotification(realUpdate, 'hubspot');
   ```

3. **Click Review → Update**
   - ✅ Should succeed!
   - ✅ Check HubSpot to verify phone was added
   - ✅ Check console for success message

---

## 🐛 Debugging

### Backend Logs

Check Render.com logs:
```
https://dashboard.render.com → Your Service → Logs
```

Look for:
- ✅ `🔄 Updating HubSpot contact: { email, crmId, updates }`
- ✅ `✅ Updated HubSpot contact 12345 with new fields: [ 'phone', 'company' ]`
- ❌ `❌ HubSpot update contact error:`

### Frontend Logs

In popup console, look for:
- ✅ `🔄 Updating ${contactsToUpdate.length} contact(s)...`
- ✅ `✅ Updated X contacts in HubSpot!`
- ❌ `❌ Batch update error:`

### Common Issues

**Error: "HubSpot not connected"**
- Solution: Go to CRM tab and reconnect HubSpot

**Error: "Contact not found"**
- Solution: Use a real contact ID from your HubSpot account

**Error: "Token expired"**
- Solution: Backend will auto-refresh, try again

**UI not showing**
- Solution: Reload extension, check console for errors

---

## ✅ Testing Checklist

### Backend
- [ ] Deploy to Render.com
- [ ] Test endpoint with curl
- [ ] Verify HubSpot contact updated
- [ ] Check error handling (bad ID, no auth, etc.)

### Frontend UI
- [ ] Reload extension
- [ ] Enable setting toggle
- [ ] Run manual test script
- [ ] Notification appears
- [ ] Modal opens on [Review]
- [ ] Checkboxes work
- [ ] Button shows count

### End-to-End
- [ ] Get real HubSpot contact ID
- [ ] Trigger update with real data
- [ ] Click [Review] → [Update]
- [ ] Verify in HubSpot account
- [ ] Check sync history

---

## 📊 Expected API Request/Response

### Request Format
```json
{
  "crmId": "12345",
  "email": "test@example.com",
  "updates": {
    "phone": "+45 12345678",
    "company": "TechCorp",
    "title": "CEO"
  }
}
```

### Success Response
```json
{
  "success": true,
  "contactId": "12345",
  "updated": ["phone", "company", "title"],
  "hubspotResponse": {
    "id": "12345",
    "updatedAt": "2026-01-12T10:30:00.000Z"
  }
}
```

### Error Response
```json
{
  "error": "Contact not found in HubSpot"
}
```

---

## 🎯 Quick Test Summary

**Fastest test (2 minutes):**
1. Deploy backend
2. Reload extension
3. Run test script in popup console
4. Click [Review] → see modal
5. ✅ UI works!

**Full test with real data (5 minutes):**
1. Enable setting
2. Get real contact ID from storage
3. Trigger update with real ID
4. Click [Update Selected]
5. Verify in HubSpot
6. ✅ Full feature works!

---

**Ready to test! Let me know if you need help with any step.** 🚀
