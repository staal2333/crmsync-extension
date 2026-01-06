# Fixed HubSpot Token Expiration Issue 🔧

## The Problem

**Symptoms:**
- ✅ HubSpot connects successfully initially
- ❌ After some time, pushing contacts fails
- ❌ "Integration manager not initialized" or token errors
- 🔄 Reinstalling the extension temporarily fixes it
- 🔁 Problem repeats after a while

## Root Cause

### **Two-Token System Issue:**

The extension uses **two separate token systems**:

1. **CRMSYNC Auth Token (JWT)**
   - Used for: Extension ↔ Backend API authentication
   - Stored in: `chrome.storage.local.authToken`
   - Lifespan: ~1 hour
   - Refresh: Automatic via `refreshAccessToken()`
   - ✅ **This works correctly**

2. **HubSpot OAuth Token**
   - Used for: Backend API ↔ HubSpot API
   - Stored in: Backend server database (tied to user session)
   - Lifespan: Varies (HubSpot's refresh token system)
   - Refresh: ❌ **Not implemented properly**
   - ⚠️ **This is the problem**

### **What Happens:**

```
Day 1:
Extension → [JWT] → Backend → [HubSpot OAuth] → HubSpot API ✅

Day 2 (JWT expired):
Extension → [JWT Refresh] → Backend → [HubSpot OAuth?] → HubSpot API ❌
                                       ↑
                                   Lost or Expired!
```

When the extension refreshes its JWT token, the backend doesn't know to also refresh the HubSpot OAuth token. Over time, the HubSpot token expires on the backend.

### **Why Reinstalling "Fixes" It:**

When you reinstall:
1. User logs in again → Fresh JWT
2. User connects HubSpot again → Fresh HubSpot OAuth
3. Both tokens are valid → Works! ✅
4. ...until one expires again 🔁

---

## The Solution

### **1. Better Error Detection**

Added specific error handling to detect when HubSpot connection is lost:

```javascript
// In checkIntegrationStatus()
if (hubspotResponse.status === 401 || hubspotResponse.status === 403) {
  console.warn('⚠️ HubSpot integration expired, clearing connection');
  this.statusCache.hubspot = { connected: false };
  this.updateIntegrationUI('hubspot', false, {});
}
```

**Result:** Extension now detects when HubSpot connection is invalid and shows it as "Not connected" instead of silently failing.

### **2. Clear Error Messages**

Added user-friendly error messages when push fails:

```javascript
if (response.status === 401) {
  throw new Error(`${platformName} connection expired. Please reconnect in the CRM tab.`);
} else if (response.status === 403) {
  throw new Error(`${platformName} access forbidden. Please reconnect in the CRM tab.`);
}
```

**Result:** Users now get clear instructions when tokens expire.

### **3. Graceful Degradation**

Each platform check now has independent error handling:

```javascript
try {
  // Check HubSpot
  const hubspotResponse = await fetch(...);
  // Process response
} catch (error) {
  console.error('❌ HubSpot status check error:', error);
  this.statusCache.hubspot = { connected: false };
  this.updateIntegrationUI('hubspot', false, {});
}
```

**Result:** If HubSpot fails, Salesforce can still work (and vice versa).

---

## Long-Term Backend Solution (Recommended)

To properly fix this, the **backend** needs to implement HubSpot token refresh. Here's what's needed:

### **Backend Changes Required:**

```javascript
// In your backend's HubSpot integration

// 1. Store refresh tokens
const storeHubSpotTokens = async (userId, accessToken, refreshToken) => {
  await db.query(`
    UPDATE crm_integrations 
    SET 
      access_token = $1,
      refresh_token = $2,
      token_expires_at = NOW() + INTERVAL '6 hours',
      updated_at = NOW()
    WHERE user_id = $3 AND platform = 'hubspot'
  `, [accessToken, refreshToken, userId]);
};

// 2. Auto-refresh before API calls
const getValidHubSpotToken = async (userId) => {
  const integration = await db.query(`
    SELECT * FROM crm_integrations 
    WHERE user_id = $1 AND platform = 'hubspot'
  `, [userId]);
  
  // If token expires soon, refresh it
  if (integration.token_expires_at < Date.now() + 300000) { // 5 min buffer
    const refreshedToken = await hubspot.refreshAccessToken(integration.refresh_token);
    await storeHubSpotTokens(userId, refreshedToken.accessToken, refreshedToken.refreshToken);
    return refreshedToken.accessToken;
  }
  
  return integration.access_token;
};

// 3. Use in all HubSpot API calls
const pushToHubSpot = async (userId, contactData) => {
  const token = await getValidHubSpotToken(userId); // Auto-refreshes if needed
  
  const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(contactData)
  });
  
  // Handle token refresh errors
  if (response.status === 401) {
    // Token refresh failed, disconnect integration
    await disconnectHubSpot(userId);
    throw new Error('HubSpot connection expired. Please reconnect.');
  }
  
  return response.json();
};
```

### **Database Schema Update:**

```sql
ALTER TABLE crm_integrations ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE crm_integrations ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP;
```

---

## Workaround for Now

Until the backend implements token refresh, users need to:

### **When Push Fails:**

1. **Go to CRM Tab**
2. **Click "Disconnect"** on HubSpot
3. **Click "Connect HubSpot"** again
4. **Complete OAuth flow**
5. **Try pushing again** ✅

### **Automated Check:**

The extension now checks integration status regularly:

```javascript
// Auto-check every time popup opens
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden) {
    await window.integrationManager?.checkIntegrationStatus();
  }
});

// Auto-check when switching to CRM tab
// Auto-check before push operations
```

---

## Files Modified

1. **`integrations.js`**
   - ✅ Enhanced `checkIntegrationStatus()` with per-platform error handling
   - ✅ Added 401/403 detection and graceful fallback
   - ✅ Better error messages in `syncContact()`
   - ✅ Clear "reconnect" instructions for users

---

## Testing the Fix

### **Test Token Expiration Detection:**

1. Connect HubSpot successfully
2. Open browser DevTools → Console
3. Run: `chrome.storage.local.get('authToken', d => console.log(d))`
4. Copy the token, manually change it to invalid
5. Try to push → Should show clear error message ✅

### **Test Status Check Recovery:**

1. Connect HubSpot
2. In backend, manually expire the HubSpot token
3. Reload extension popup
4. HubSpot should show "Not connected" ✅
5. Reconnect → Should work again ✅

---

## What Users Will See Now

### **Before:**
```
❌ Push failed (no clear reason)
❌ "Integration manager not initialized"
❌ Silent failure, no idea what's wrong
🔄 Have to reinstall extension
```

### **After:**
```
✅ Clear error: "HubSpot connection expired. Please reconnect in the CRM tab."
✅ Status shows "Not connected" when token is invalid
✅ Easy fix: Go to CRM tab → Click "Connect HubSpot"
✅ No need to reinstall
```

---

## Monitoring

To track token issues:

```javascript
// Extension logs (Console)
console.log('🔍 HubSpot status check...');
// ✅ Success → Shows "Connected"
// ⚠️ 401/403 → Shows "Connection expired"
// ❌ Error → Shows "Failed to check"

// Backend logs (Server)
logger.info('HubSpot token refresh needed', { userId });
logger.error('HubSpot token refresh failed', { userId, error });
```

---

## Summary

### **Short-term Fix (Done):** ✅
- Better error detection
- Clear user messages
- Graceful degradation
- Easy reconnection flow

### **Long-term Fix (Backend TODO):** 🔜
- Implement HubSpot token refresh
- Store refresh tokens in database
- Auto-refresh before API calls
- Handle refresh failures gracefully

**Current status:** Users can now easily reconnect when tokens expire, with clear instructions. The silent failures are fixed.

**Next step:** Backend should implement automatic token refresh to eliminate the need for manual reconnection.
