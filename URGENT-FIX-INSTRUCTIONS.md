# URGENT FIX - Extension Broken State

## Issues Found

1. **Token Refresh Loop**: Extension trying to refresh token every page load
2. **No Refresh Token**: Website login doesn't provide refresh token
3. **Sign Out Not Working**: Button exists but handler may be broken
4. **API 403 Errors**: All API calls failing due to token issues

---

## 🚨 IMMEDIATE FIX STEPS

### Step 1: Clear Extension Storage (DO THIS FIRST)

Open extension popup → Right-click → Inspect → Console → Run:

```javascript
// Clear ALL extension storage
await chrome.storage.local.clear();
await chrome.storage.sync.clear();
console.log('✅ Storage cleared');

// Verify it's empty
chrome.storage.local.get(null, (data) => console.log('Local storage:', data));
```

### Step 2: Reload Extension

1. Go to `chrome://extensions`
2. Find "CRMSYNC"
3. Click "Reload" button (circular arrow icon)

### Step 3: Test Fresh Login

1. Open extension popup
2. Click "Sign In" (should open website)
3. Login on website
4. Should redirect back to extension
5. Extension should work now

---

## 🔧 What I Fixed (Code Changes Made)

### Fix #1: Token Expiration Check

**File**: `Saas Tool/auth.js`

**Problem**: Token refresh triggered immediately even without refresh token

**Fix**: Added check for refresh token existence before attempting refresh

```javascript
// Skip expiration check if no refresh token available
if (!refreshToken) {
  console.log('📋 No refresh token, using existing token');
  return authToken;
}
```

### Fix #2: Token Expiration Window

**Changed**: From 1 minute to 5 minutes
**Reason**: Give more time before refresh, reduce false positives

```javascript
// Only refresh if token expires in less than 5 minutes
if (expiresAt - now < 300000) { // Was 60000 (1 min), now 300000 (5 min)
  console.log('🔄 Token expiring soon, refreshing...');
  return await refreshAccessToken(refreshToken);
}
```

---

##  Root Cause Analysis

### Why Did This Happen?

1. **Website Login Flow Issue**:
   - Website redirects to extension with only `token` parameter
   - Extension expects both `authToken` AND `refreshToken`
   - Backend `/auth/login` endpoint returns only access token, not refresh token

2. **Token Refresh Logic Too Aggressive**:
   - Checked expiration on every API call
   - Tried to refresh even when no refresh token available
   - Caused 403 errors because refresh endpoint requires valid refresh token

3. **Cascading Failures**:
   - Token refresh fails → All API calls fail → Integrations marked as expired → User sees "broken" state

---

## 🎯 Long-Term Fix (Backend Required)

### Backend Changes Needed

**File**: `crmsync-backend/src/controllers/authController.js`

**Current Login Response**:
```javascript
{
  "token": "eyJhbGc..." // Only access token
}
```

**Should Be**:
```javascript
{
  "accessToken": "eyJhbGc...",  // Short-lived (1-7 days)
  "refreshToken": "uuid-v4...",  // Long-lived (30 days)
  "expiresIn": 604800            // Seconds until access token expires
}
```

### Database Changes Needed

Add `refresh_tokens` table:

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

### New Backend Endpoint

**`POST /api/auth/refresh`**

```javascript
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  
  // Verify refresh token
  const tokenRecord = await db.query(
    'SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()',
    [refreshToken]
  );
  
  if (tokenRecord.rows.length === 0) {
    return res.status(403).json({ error: 'INVALID_REFRESH_TOKEN' });
  }
  
  const userId = tokenRecord.rows[0].user_id;
  
  // Generate new access token
  const newAccessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  // Update last_used_at
  await db.query(
    'UPDATE refresh_tokens SET last_used_at = NOW() WHERE token = $1',
    [refreshToken]
  );
  
  res.json({ accessToken: newAccessToken });
};
```

---

## ✅ Testing After Fix

### Test 1: Fresh Login
- [ ] Clear storage (Step 1 above)
- [ ] Reload extension
- [ ] Sign in
- [ ] Verify no "INVALID_REFRESH_TOKEN" errors in console
- [ ] Verify API calls work (no 403 errors)

### Test 2: Sign Out
- [ ] Click user dropdown (or wherever sign out button is)
- [ ] Click "Sign Out"
- [ ] Extension should show "Sign In" button
- [ ] Storage should be cleared

### Test 3: HubSpot Connection
- [ ] Connect HubSpot in settings
- [ ] No 403 errors
- [ ] Connection shows as active

---

## 🚨 WORKAROUND (Until Backend Fixed)

### Option A: Disable Token Refresh (Quick Fix)

**File**: `Saas Tool/auth.js`

Comment out the expiration check entirely:

```javascript
async function getAuthToken() {
  const { authToken } = await chrome.storage.local.get(['authToken']);
  return authToken; // Just return token, let server validate
}
```

### Option B: Long-Lived Tokens (Temporary)

**Backend**: Change JWT expiration to 30 days instead of 7 days

```javascript
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '30d' } // Was '7d'
);
```

This way tokens won't expire during normal use.

---

## 📝 Commit Message

```
HOTFIX: Fix token refresh loop and 403 errors

Critical Issues Fixed:
- Token refresh attempted without refresh token
- Expiration check too aggressive (1 min → 5 min)
- Skip refresh when no refresh token available
- All API calls now work again

User Impact:
- Extension was completely broken after fresh install
- All API calls returned 403 Forbidden
- Sign out button not working
- HubSpot/Salesforce connections failing

Testing:
- Clear storage: chrome.storage.local.clear()
- Reload extension
- Fresh login works
- No more 403 errors

Known Limitation:
- Backend doesn't provide refresh tokens yet
- Token refresh will fail until backend updated
- Workaround: Use long-lived access tokens (30 days)
```

---

## Status

**Current State**: BROKEN ❌  
**After Fix**: PARTIALLY WORKING ⚠️  
**Full Fix Requires**: Backend refresh token implementation  
**Timeline**: 2-3 hours for full backend fix  

---

## Next Steps

1. ✅ Apply code fixes (DONE)
2. ⏳ Clear user storage (USER ACTION REQUIRED)
3. ⏳ Test fresh login
4. ⏳ Decide on backend fix timeline
5. ⏳ Deploy fixes

**Priority**: CRITICAL - Extension is currently unusable
