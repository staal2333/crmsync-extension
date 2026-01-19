# CRMSYNC Extension - Complete Test Flow

Use this document to systematically test every feature of the extension and log bugs.

---

## Pre-Test Setup

### 1. Load Extension in Chrome
```
1. Open chrome://extensions
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select: Saas Tool folder
5. Verify extension icon appears in toolbar
```

### 2. Open DevTools for Debugging
```
- Right-click extension icon → "Inspect popup" (for popup.js logs)
- Open Gmail → F12 → Console (for content.js logs)
- chrome://extensions → "Service Worker" link (for background.js logs)
```

---

## Test Flow Checklist

### Phase 1: Extension Load & Basic UI
| # | Test | Expected Result | Status | Notes |
|---|------|-----------------|--------|-------|
| 1.1 | Click extension icon | Popup opens without errors | ⬜ | |
| 1.2 | Check popup layout | Header, tabs (Contacts/CRM), footer visible | ⬜ | |
| 1.3 | Check console for errors | No red errors in popup console | ⬜ | |
| 1.4 | Verify logo loads | CRMSYNC logo displays correctly | ⬜ | |
| 1.5 | Check tier badge | Shows "FREE" badge initially | ⬜ | |

### Phase 2: Authentication Flow
| # | Test | Expected Result | Status | Notes |
|---|------|-----------------|--------|-------|
| 2.1 | Click "Sign In" button | Opens crm-sync.net login page | ⬜ | |
| 2.2 | Sign up with email | Account created, redirects back | ⬜ | |
| 2.3 | Sign in with email | Login successful, popup shows user | ⬜ | |
| 2.4 | Sign in with Google | OAuth flow completes, user logged in | ⬜ | |
| 2.5 | Verify token storage | Check chrome.storage.local has token | ⬜ | |
| 2.6 | Close/reopen popup | User still logged in (persisted) | ⬜ | |
| 2.7 | Click Settings (⚙️) | Settings panel opens | ⬜ | |
| 2.8 | Click "Sign Out" | User logged out, "Sign In" returns | ⬜ | |

**Debug Commands (run in popup console):**
```javascript
// Check stored auth data
chrome.storage.local.get(['token', 'user', 'refreshToken'], console.log);

// Check if auth module loaded
console.log('Auth loaded:', typeof window.CRMSyncAuth);
```

### Phase 3: Gmail Integration
| # | Test | Expected Result | Status | Notes |
|---|------|-----------------|--------|-------|
| 3.1 | Open Gmail | Extension loads without breaking Gmail | ⬜ | |
| 3.2 | Check for widget | Floating widget appears (bottom-right or side) | ⬜ | |
| 3.3 | Click widget | Sidebar expands showing contacts | ⬜ | |
| 3.4 | Check content.js console | No errors, shows "CRMSYNC initialized" | ⬜ | |
| 3.5 | Toggle widget visibility | Widget shows/hides correctly | ⬜ | |

**Debug Commands (run in Gmail console):**
```javascript
// Check if content script loaded
console.log('Content script active:', typeof window.crmsyncInitialized);

// Check contacts in storage
chrome.storage.local.get(['contacts'], (data) => console.log('Contacts:', data.contacts?.length || 0));

// Check settings
chrome.storage.sync.get(null, console.log);
```

### Phase 4: Contact Extraction (Core Feature)
| # | Test | Expected Result | Status | Notes |
|---|------|-----------------|--------|-------|
| 4.1 | Open an email thread | Extension scans email automatically | ⬜ | |
| 4.2 | Check for new contact popup | "New contact found" notification appears | ⬜ | |
| 4.3 | Approve contact | Contact added to list with "approved" status | ⬜ | |
| 4.4 | Reject contact | Contact dismissed, added to rejected list | ⬜ | |
| 4.5 | Check extracted data | Name, email, company, phone extracted correctly | ⬜ | |
| 4.6 | Send a new email | Outbound email recipient captured | ⬜ | |
| 4.7 | Receive reply | Inbound count increments, signature parsed | ⬜ | |
| 4.8 | Check duplicate handling | Same email not added twice | ⬜ | |

**Test Emails to Try:**
```
1. Email with full signature (name, title, company, phone)
2. Email with minimal info (just name)
3. Email from personal address (gmail, outlook)
4. Email from corporate domain
5. Reply chain with multiple participants
```

**Debug Commands:**
```javascript
// Force a scan
chrome.runtime.sendMessage({ action: 'SCAN_EMAILS' });

// Check pending contacts
chrome.storage.local.get(['pendingContacts'], console.log);

// Check rejected emails
chrome.storage.local.get(['rejectedEmails'], console.log);
```

### Phase 5: Contact Management
| # | Test | Expected Result | Status | Notes |
|---|------|-----------------|--------|-------|
| 5.1 | View contacts list | All approved contacts displayed | ⬜ | |
| 5.2 | Search contacts | Filter works correctly | ⬜ | |
| 5.3 | Edit a contact | Edit modal opens, changes save | ⬜ | |
| 5.4 | Delete a contact | Confirmation shown, contact removed | ⬜ | |
| 5.5 | Archive a contact | Status changes to "archived" | ⬜ | |
| 5.6 | Bulk select contacts | Checkboxes work, bulk actions available | ⬜ | |
| 5.7 | Sort contacts | Sorting by name/date works | ⬜ | |
| 5.8 | Filter by status | Pending/Approved/Archived filters work | ⬜ | |

### Phase 6: Export Functionality
| # | Test | Expected Result | Status | Notes |
|---|------|-----------------|--------|-------|
| 6.1 | Click "Export" button | Export options appear | ⬜ | |
| 6.2 | Export as CSV | CSV file downloads with correct data | ⬜ | |
| 6.3 | Export selected only | Only selected contacts in export | ⬜ | |
| 6.4 | Check export limits (Free) | Shows limit warning if exceeded | ⬜ | |
| 6.5 | Verify CSV format | Opens correctly in Excel/Sheets | ⬜ | |

### Phase 7: CRM Integrations (Pro Feature)
| # | Test | Expected Result | Status | Notes |
|---|------|-----------------|--------|-------|
| 7.1 | Click "CRM" tab | Integration panel shows | ⬜ | |
| 7.2 | Free user: Connect HubSpot | Shows upgrade modal | ⬜ | |
| 7.3 | Pro user: Connect HubSpot | OAuth popup opens | ⬜ | |
| 7.4 | Complete HubSpot OAuth | Connection success, status shows "Connected" | ⬜ | |
| 7.5 | Sync to HubSpot | Loading spinner, success notification | ⬜ | |
| 7.6 | Check HubSpot for contacts | Contacts appear in HubSpot CRM | ⬜ | |
| 7.7 | Connect Salesforce | OAuth flow works | ⬜ | |
| 7.8 | Sync to Salesforce | Contacts sync correctly | ⬜ | |
| 7.9 | Disconnect integration | Integration removed, status updates | ⬜ | |
| 7.10 | Check sync history | Shows recent sync operations | ⬜ | |

**Debug Commands:**
```javascript
// Check integration status
chrome.storage.local.get(['hubspotConnected', 'salesforceConnected'], console.log);

// Check last sync
chrome.storage.local.get(['lastSyncAt', 'syncHistory'], console.log);
```

### Phase 8: Subscription & Payments
| # | Test | Expected Result | Status | Notes |
|---|------|-----------------|--------|-------|
| 8.1 | Check free tier limits | Contact limit (50) enforced | ⬜ | |
| 8.2 | Click "Upgrade" button | Opens pricing page | ⬜ | |
| 8.3 | Select Pro plan | Stripe checkout opens | ⬜ | |
| 8.4 | Complete test payment | Subscription activated, tier updates | ⬜ | |
| 8.5 | Verify Pro features | CRM connect unlocked, limits removed | ⬜ | |
| 8.6 | Check subscription badge | Shows "PRO" instead of "FREE" | ⬜ | |

**Stripe Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Auth: 4000 0025 0000 3155
```

### Phase 9: Settings & Preferences
| # | Test | Expected Result | Status | Notes |
|---|------|-----------------|--------|-------|
| 9.1 | Open settings (⚙️) | Settings panel displays | ⬜ | |
| 9.2 | Toggle auto-sync | Setting saved, persists on reload | ⬜ | |
| 9.3 | Add excluded domain | Domain added to exclusion list | ⬜ | |
| 9.4 | Remove excluded domain | Domain removed from list | ⬜ | |
| 9.5 | Toggle dark mode | UI switches to dark theme | ⬜ | |
| 9.6 | Test keyboard shortcuts | Hotkeys work when enabled | ⬜ | |
| 9.7 | Reset settings | Settings return to defaults | ⬜ | |

### Phase 10: Onboarding Flow
| # | Test | Expected Result | Status | Notes |
|---|------|-----------------|--------|-------|
| 10.1 | Fresh install | Onboarding checklist appears | ⬜ | |
| 10.2 | Complete step 1 (Sign in) | Checkmark appears, step completed | ⬜ | |
| 10.3 | Complete step 2 (Connect CRM) | Step marked complete | ⬜ | |
| 10.4 | Complete step 3 (First contact) | Step marked complete | ⬜ | |
| 10.5 | Dismiss onboarding | Checklist hides, doesn't return | ⬜ | |

### Phase 11: Error Handling
| # | Test | Expected Result | Status | Notes |
|---|------|-----------------|--------|-------|
| 11.1 | Disconnect internet, sync | Graceful error message shown | ⬜ | |
| 11.2 | Invalid token | Prompts re-login, doesn't crash | ⬜ | |
| 11.3 | API timeout | Shows timeout error, retry option | ⬜ | |
| 11.4 | CRM OAuth cancel | Returns to popup without error | ⬜ | |
| 11.5 | Exceed contact limit | Shows upgrade prompt, not error | ⬜ | |

### Phase 12: Performance
| # | Test | Expected Result | Status | Notes |
|---|------|-----------------|--------|-------|
| 12.1 | 100+ contacts load time | Popup opens in < 1 second | ⬜ | |
| 12.2 | Gmail with extension | Gmail loads normally, no lag | ⬜ | |
| 12.3 | Memory usage | < 50MB memory footprint | ⬜ | |
| 12.4 | Background service worker | Stays active, handles messages | ⬜ | |

---

## Bug Report Template

```markdown
### Bug ID: BUG-XXX
**Test Phase:** (e.g., Phase 4 - Contact Extraction)
**Test #:** (e.g., 4.5)

**Description:**
[What went wrong]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Console Errors:**
```
[Paste any console errors here]
```

**Screenshots:**
[Attach if helpful]

**Environment:**
- Chrome version: 
- Extension version: 2.0.1
- User tier: Free/Pro
- Logged in: Yes/No
```

---

## Quick Debug Commands Reference

```javascript
// === STORAGE INSPECTION ===
// View all local storage
chrome.storage.local.get(null, console.log);

// View all sync storage  
chrome.storage.sync.get(null, console.log);

// Clear all contacts (for fresh test)
chrome.storage.local.set({ contacts: [], pendingContacts: [] });

// === AUTH DEBUG ===
// Check auth state
chrome.storage.local.get(['token', 'user', 'refreshToken'], console.log);

// Force logout
chrome.storage.local.remove(['token', 'user', 'refreshToken']);

// === CONTACTS DEBUG ===
// Get contact count
chrome.storage.local.get(['contacts'], (d) => console.log('Count:', d.contacts?.length));

// Add test contact
chrome.storage.local.get(['contacts'], (data) => {
  const contacts = data.contacts || [];
  contacts.push({
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    company: 'Test Corp',
    status: 'pending',
    createdAt: new Date().toISOString()
  });
  chrome.storage.local.set({ contacts });
});

// === MESSAGING ===
// Trigger background action
chrome.runtime.sendMessage({ action: 'GET_CONTACTS' }, console.log);

// === RESET EXTENSION ===
// Nuclear option - clear everything
chrome.storage.local.clear();
chrome.storage.sync.clear();
```

---

## Notes Section

### Bugs Found:
1. 
2. 
3. 

### Questions:
1. 
2. 

### Ideas for Improvement:
1. 
2. 

---

*Last Updated: December 2024*
*Extension Version: 2.0.1*
