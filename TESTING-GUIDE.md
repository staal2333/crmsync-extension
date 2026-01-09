# Testing Guide - HubSpot Auto-Sync & Subscription Update

## Pre-Testing Checklist
- [ ] Backend deployed with latest code (commit: ea8cc62)
- [ ] Database migration `008_add_subscription_columns.sql` executed
- [ ] Extension loaded in Chrome (unpacked or from .zip)
- [ ] Test HubSpot account with at least 10 contacts

---

## Test 1: HubSpot Auto-Sync (Pull Feature)

### Setup
1. Open Chrome extension popup
2. Go to "Settings" tab → "CRM Integrations"
3. Click "Connect to HubSpot"
4. Authorize with your HubSpot test account
5. Verify connection shows "Connected ✓"

### Test Steps
1. **Manual Pull Test**
   - Click the purple "⬇️ Pull from HubSpot" button
   - Verify button shows "⏳ Syncing..." state
   - Wait for completion (should take 5-15 seconds)
   - Expected: Toast notification with sync stats appears
   - Expected: Contacts tab shows new contacts with "H" badges

2. **Verify Contact Data**
   - Go to "Contacts" tab
   - Check that contacts from HubSpot have:
     - Correct email addresses
     - First and last names populated
     - Company names (if in HubSpot)
     - Small orange "H" badge next to their name

3. **Check Sync Status**
   - In Settings → CRM Integrations
   - Verify "Last synced: X seconds ago" appears
   - Verify sync stats card shows:
     - "X contacts synced"
     - "X new contacts"
     - "X updated contacts"

4. **Test Update Detection**
   - In HubSpot, edit a contact (change name or company)
   - Wait 1 minute for cache to clear
   - Click "Pull from HubSpot" again
   - Expected: Contact updates with new data
   - Expected: Toast shows "0 new, 1 updated"

### Expected Results ✅
- Contacts appear within 15 seconds
- No duplicate contacts created
- Updates replace old data correctly
- Console logs show: `✅ HubSpot sync complete: X total, Y new, Z updated`

### Troubleshooting
- **Error: "HubSpot not connected"**
  - Re-connect HubSpot in settings
  - Check backend logs for OAuth errors
  
- **No contacts appear**
  - Open Developer Tools → Console
  - Look for `❌ HubSpot sync error:` messages
  - Check network tab for failed API calls to `/api/integrations/hubspot/fetch-contacts`

---

## Test 2: Automatic HubSpot Sync (Background)

### Setup
1. Connect HubSpot (as in Test 1)
2. Close popup
3. Wait 30 minutes (or modify alarm timing in code for faster testing)

### Test Steps
1. **Check Alarm Creation**
   - Open `chrome://extensions` → Find CRMSYNC → "Service worker (inactive)"
   - Click "service worker" to open background console
   - Look for: `✅ HubSpot connected, starting auto-sync`
   - Look for: `⏰ Running scheduled HubSpot sync...` (after 30 min)

2. **Verify Automatic Sync**
   - After 30 minutes, open popup
   - Check "Last synced" timestamp
   - Should be ~30 minutes after previous sync
   - Contacts tab should have any new HubSpot contacts

3. **Test After Extension Restart**
   - Go to `chrome://extensions`
   - Click "Reload" on CRMSYNC
   - Open popup immediately
   - Expected: Auto-sync runs within 1 minute
   - Expected: Alarm is re-created for next 30-min cycle

### Expected Results ✅
- Sync runs automatically every 30 minutes
- Continues running even when popup is closed
- Survives browser restarts (Chrome alarms persist)
- Console shows: `⏰ Running scheduled HubSpot sync...`

### Troubleshooting
- **Alarm not firing**
  - Check `chrome.alarms` in background console: `chrome.alarms.getAll(console.log)`
  - Should show: `{ name: 'hubspot-auto-sync', periodInMinutes: 30 }`
  
- **Sync runs but fails**
  - Check token expiration (OAuth tokens last 24h)
  - Re-connect HubSpot if needed

---

## Test 3: Subscription Auto-Update

### Setup
1. Create a test account on crm-sync.net (or use existing free account)
2. Install extension and login
3. Verify popup shows "FREE" tier badge

### Test Steps
1. **Manual Tier Update (Database)**
   ```sql
   -- SSH into Render, run:
   psql $DATABASE_URL
   UPDATE users SET subscription_tier = 'pro' WHERE email = 'YOUR_TEST_EMAIL@example.com';
   \q
   ```

2. **Wait for Auto-Detection**
   - Keep popup open (or close and reopen every minute)
   - Wait up to 5 minutes
   - Expected: Toast notification appears: "🎉 Subscription upgraded to PRO!"
   - Expected: Popup reloads automatically after 1 second
   - Expected: "PRO" badge now shows in header

3. **Verify Pro Features Unlocked**
   - Go to Settings → CRM Integrations
   - Click "Connect to HubSpot" or "Connect to Salesforce"
   - Expected: OAuth flow starts immediately (no upgrade modal)
   - Previous behavior: Would show "Requires Pro" modal

4. **Check Background Logs**
   - Open background service worker console
   - Look for: `🔄 Checking for subscription updates...`
   - Look for: `🎉 Subscription tier changed: free → pro`
   - Look for: `SUBSCRIPTION_TIER_UPDATED` message sent to popup

### Expected Results ✅
- Tier update detected within 5 minutes
- Popup shows upgrade notification
- Pro features immediately available
- No manual refresh needed
- Console shows: `🎉 Subscription tier changed: free → pro`

### Troubleshooting
- **Update not detected after 5 minutes**
  - Check backend logs for `/api/user/me` calls (should happen every 5 min)
  - Verify database was actually updated: `SELECT email, subscription_tier FROM users WHERE email = '...'`
  
- **Notification shows but features still locked**
  - Hard refresh popup: Close and reopen
  - Check `chrome.storage.local` for `user.tier` value
  - Should show `"pro"` not `"free"`

---

## Test 4: Webhook Subscription Update (Optional)

### Setup
1. Install cURL or Postman
2. Get a valid JWT token from extension (inspect `chrome.storage.local.authToken`)

### Test Steps
1. **Trigger Manual Webhook**
   ```bash
   curl -X POST https://crmsync-api.onrender.com/api/webhooks/subscription-update \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "YOUR_USER_UUID",
       "tier": "pro",
       "event": "manual_test"
     }'
   ```

2. **Check Database**
   ```sql
   SELECT email, subscription_tier, updated_at FROM users WHERE id = 'YOUR_USER_UUID';
   ```
   - Expected: `subscription_tier` is now `'pro'`
   - Expected: `updated_at` is current timestamp

3. **Check Extension**
   - Wait up to 5 minutes (or manually trigger check in background console)
   - Expected: Extension detects tier change and notifies user

### Expected Results ✅
- Webhook returns: `{ "success": true, "message": "Subscription updated successfully" }`
- Database updates immediately
- Extension detects change within 5 minutes

---

## Performance Benchmarks

### HubSpot Sync Speed
- 100 contacts: < 10 seconds
- 500 contacts: < 30 seconds
- 1000 contacts: < 60 seconds

### Subscription Check Overhead
- Background check: < 500ms
- Network request: < 1s
- Zero impact on browsing

### Resource Usage
- Background sync: ~5MB memory
- Popup open: ~15MB memory
- Alarm timers: < 1KB storage

---

## Known Issues & Limitations

### HubSpot Sync
- Maximum 1000 contacts per sync (10 pages × 100)
- 30-minute sync interval (not configurable yet)
- Requires active HubSpot connection (tokens expire after 24h)

### Subscription Check
- 5-minute detection delay (not instant without webhook)
- Requires internet connection
- Tier changes only detected when extension is running

---

## Success Criteria

All tests pass when:
- ✅ Contacts sync from HubSpot in < 15 seconds
- ✅ No duplicate contacts created
- ✅ Updates overwrite old data correctly
- ✅ Automatic sync runs every 30 minutes
- ✅ Subscription upgrades detected within 5 minutes
- ✅ Pro features unlock automatically
- ✅ No console errors or warnings
- ✅ UI updates reflect changes immediately

---

**Tester**: _______________  
**Date**: _______________  
**Result**: ⬜ PASS  ⬜ FAIL  ⬜ NEEDS FIXES

**Notes**:
