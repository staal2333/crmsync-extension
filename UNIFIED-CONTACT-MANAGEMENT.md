# 🎯 Unified Contact Management & CRM Sync Hub

## Implementation Plan

---

## 📋 **Phase 1: Data Layer Separation** ✅ IN PROGRESS

### **A. Contact Schema Updates** ✅ DONE
- Added `source` field: `'local'` | `'crm'` | `'hybrid'`
- Added `crmSnapshot`: Stores original CRM data for comparison
- Added `pendingChanges`: Stores proposed updates not yet pushed
- Added `lastSyncedAt`: Timestamp of last CRM sync
- Added `hasPendingUpdates`: Quick boolean flag for filtering
- Added `crmMappings`: Maps to CRM platform IDs

### **B. Background.js Updates** ✅ DONE
- New contacts marked as `source: 'local'` by default
- Auto-sync disabled by default (manual push required)
- Logs indicate "App Layer" storage

---

## 📋 **Phase 2: CRM Import as Read-Only**

### **A. Update CRM Sync Controllers**

**File**: `crmsync-backend/src/controllers/hubspotController.js`
**Changes**:
```javascript
// When importing from HubSpot
contact.source = 'crm';
contact.crmSnapshot = { ...contactData }; // Store snapshot
contact.lastSyncedAt = new Date().toISOString();
```

**File**: `crmsync-backend/src/controllers/salesforceController.js`
**Changes**: Same as above

### **B. Detect Changes & Create Hybrid State**

When app finds new info for a CRM contact:
```javascript
// If contact has source='crm' and we found new data locally
if (contact.source === 'crm' && hasNewData) {
  contact.source = 'hybrid';
  contact.pendingChanges = {
    phone: newPhone, // Example: new field found
    title: newTitle
  };
  contact.hasPendingUpdates = true;
}
```

---

## 📋 **Phase 3: Staging Area UI**

### **A. Pending Updates Dashboard** (Top of Contacts Tab)

```html
<!-- NEW: Staging Dashboard -->
<div class="staging-dashboard">
  <div class="staging-stats">
    <div class="stat-item stat-local">
      <span class="stat-icon">📥</span>
      <div>
        <div class="stat-value" id="localContactsCount">8</div>
        <div class="stat-label">New Leads (Local)</div>
      </div>
      <button class="btn-push-all">Push All to CRM</button>
    </div>
    
    <div class="stat-item stat-hybrid">
      <span class="stat-icon">🔄</span>
      <div>
        <div class="stat-value" id="pendingUpdatesCount">14</div>
        <div class="stat-label">Proposed Updates</div>
      </div>
      <button class="btn-review">Review Updates</button>
    </div>
    
    <div class="stat-item stat-synced">
      <span class="stat-icon">✅</span>
      <div>
        <div class="stat-value" id="syncedContactsCount">1482</div>
        <div class="stat-label">Synced with CRM</div>
      </div>
    </div>
  </div>
</div>
```

### **B. Source Badges in Contact List**

```html
<!-- Each contact row shows source badge -->
<div class="contact-card">
  <div class="contact-info">
    <span class="source-badge source-local">📥 Local</span>
    <!-- OR -->
    <span class="source-badge source-crm">☁️ CRM</span>
    <!-- OR -->
    <span class="source-badge source-hybrid">🔄 Update Available</span>
  </div>
</div>
```

### **C. Filter by Source**

```html
<select id="sourceFilter">
  <option value="">All Sources</option>
  <option value="local">📥 Local Only (New)</option>
  <option value="hybrid">🔄 Updates Available</option>
  <option value="crm">☁️ CRM Only</option>
</select>
```

---

## 📋 **Phase 4: Diff Viewer Component**

### **A. Modal for Hybrid Contacts**

```html
<div class="diff-modal" id="diffModal">
  <div class="diff-header">
    <h2>Review Changes for john@example.com</h2>
    <button class="close-modal">×</button>
  </div>
  
  <div class="diff-content">
    <div class="diff-section">
      <h3>Current (CRM)</h3>
      <div class="data-snapshot">
        <div class="field">
          <label>Phone:</label>
          <span>+1 555-0100</span>
        </div>
        <div class="field">
          <label>Title:</label>
          <span>Manager</span>
        </div>
      </div>
    </div>
    
    <div class="diff-divider">→</div>
    
    <div class="diff-section">
      <h3>Proposed (Local)</h3>
      <div class="data-snapshot">
        <div class="field field-changed">
          <label>Phone:</label>
          <span>+1 555-0199</span>
          <span class="badge-new">NEW</span>
        </div>
        <div class="field field-changed">
          <label>Title:</label>
          <span>Senior Manager</span>
          <span class="badge-updated">UPDATED</span>
        </div>
      </div>
    </div>
  </div>
  
  <div class="diff-actions">
    <button class="btn btn-primary" id="mergeBtn">
      ✓ Merge to CRM
    </button>
    <button class="btn btn-secondary" id="keepCRMBtn">
      Keep CRM Data
    </button>
    <button class="btn btn-danger" id="discardBtn">
      🗑️ Discard Local Changes
    </button>
  </div>
</div>
```

---

## 📋 **Phase 5: Push/Merge/Discard Actions**

### **A. Push New to CRM**

```javascript
async function pushNewToCRM(contact, platform) {
  // 1. Validate contact is 'local'
  if (contact.source !== 'local') {
    throw new Error('Only local contacts can be pushed as new');
  }
  
  // 2. Call CRM API to create contact
  const response = await fetch(`/api/${platform}/sync-contact`, {
    method: 'POST',
    body: JSON.stringify(contact)
  });
  
  // 3. Update contact to 'crm' source
  contact.source = 'crm';
  contact.crmSnapshot = { ...contact }; // Save snapshot
  contact.lastSyncedAt = new Date().toISOString();
  contact.crmMappings[platform] = response.id;
  
  // 4. Save updated contact
  await updateContact(contact);
}
```

### **B. Merge Updates**

```javascript
async function mergeUpdatesToCRM(contact, platform) {
  // 1. Validate contact is 'hybrid'
  if (contact.source !== 'hybrid') {
    throw new Error('Only hybrid contacts have updates to merge');
  }
  
  // 2. Get pending changes
  const changes = contact.pendingChanges;
  
  // 3. Call CRM API to update contact
  await fetch(`/api/${platform}/update-contact`, {
    method: 'PATCH',
    body: JSON.stringify({
      id: contact.crmMappings[platform],
      updates: changes
    })
  });
  
  // 4. Merge changes into crmSnapshot
  contact.crmSnapshot = {
    ...contact.crmSnapshot,
    ...changes
  };
  
  // 5. Clear pending changes
  contact.pendingChanges = null;
  contact.hasPendingUpdates = false;
  contact.source = 'crm'; // Back to CRM-only
  contact.lastSyncedAt = new Date().toISOString();
  
  // 6. Save
  await updateContact(contact);
}
```

### **C. Discard Local Changes**

```javascript
async function discardLocalChanges(contact) {
  // 1. Validate contact is 'hybrid'
  if (contact.source !== 'hybrid') {
    throw new Error('Only hybrid contacts have changes to discard');
  }
  
  // 2. Revert to CRM snapshot
  const restoredContact = {
    ...contact,
    ...contact.crmSnapshot, // Restore all CRM fields
    source: 'crm',
    pendingChanges: null,
    hasPendingUpdates: false
  };
  
  // 3. Save
  await updateContact(restoredContact);
}
```

---

## 📋 **Phase 6: Conflict Resolution**

### **A. Detect Conflicts**

When user tries to push, but CRM data has changed:

```javascript
async function checkForConflicts(contact, platform) {
  // 1. Fetch latest CRM data
  const latestCRM = await fetchFromCRM(contact.crmMappings[platform]);
  
  // 2. Compare with snapshot
  const hasConflict = JSON.stringify(latestCRM) !== JSON.stringify(contact.crmSnapshot);
  
  if (hasConflict) {
    return {
      hasConflict: true,
      crmData: latestCRM,
      snapshotData: contact.crmSnapshot,
      localChanges: contact.pendingChanges
    };
  }
  
  return { hasConflict: false };
}
```

### **B. 3-Way Merge UI**

```html
<div class="conflict-modal">
  <h2>⚠️ Conflict Detected</h2>
  <p>CRM data has changed since you last synced.</p>
  
  <div class="merge-options">
    <div class="option">
      <h3>CRM Version (Latest)</h3>
      <pre>{...}</pre>
      <button class="btn-use-crm">Use This</button>
    </div>
    
    <div class="option">
      <h3>Your Local Version</h3>
      <pre>{...}</pre>
      <button class="btn-use-local">Use This</button>
    </div>
    
    <div class="option">
      <h3>Manual Merge</h3>
      <p>Pick fields individually</p>
      <button class="btn-manual">Merge Manually</button>
    </div>
  </div>
</div>
```

---

## 📋 **Files to Modify**

### **Backend**
1. ✅ `background.js` - Contact schema & saveContact
2. ⏳ `crmsync-backend/src/controllers/hubspotController.js` - Mark as 'crm'
3. ⏳ `crmsync-backend/src/controllers/salesforceController.js` - Mark as 'crm'

### **Frontend**
4. ⏳ `popup.html` - Add staging dashboard
5. ⏳ `popup.js` - Add source filter & staging logic
6. ⏳ `popup.css` - Add styling for badges & diff viewer
7. ⏳ `integrations.js` - Update sync logic to handle staging

---

## 🎯 **Testing Checklist**

- [ ] New contact detected → Marked as 'local'
- [ ] CRM import → Marked as 'crm'
- [ ] Local enrichment of CRM contact → Marked as 'hybrid'
- [ ] Staging dashboard shows correct counts
- [ ] Source filter works correctly
- [ ] Push new to CRM → Updates to 'crm'
- [ ] Merge updates → Clears pendingChanges
- [ ] Discard → Reverts to crmSnapshot
- [ ] Conflict detection works
- [ ] 3-way merge UI functional

---

## ⚡ **NEXT STEPS**

Do you want me to continue with:
1. **Backend updates** (mark CRM imports as read-only)
2. **UI implementation** (staging dashboard + diff viewer)
3. **Push/Merge/Discard actions** (workflow logic)
4. **All of the above** (full implementation)

Let me know which direction you'd like to take!