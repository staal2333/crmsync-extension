# 🗺️ CRMSYNC Architecture & Fix Map

## 🏗️ Your Current Setup

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌────────────────────┐       │
│  │  Chrome Extension│         │   Website Frontend │       │
│  │                  │         │  www.crm-sync.net  │       │
│  │  ✅ Already      │         │                    │       │
│  │     Fixed!       │         │  ❌ Needs API URL  │       │
│  └────────┬─────────┘         └─────────┬──────────┘       │
│           │                              │                  │
└───────────┼──────────────────────────────┼──────────────────┘
            │                              │
            │                              │ CORS ERROR! ❌
            │                              │
            │                              ↓
            │                   ┌──────────────────────┐
            │                   │   Backend API        │
            └──────────────────→│  Render              │
                                │  crmsync-api         │
                                │                      │
                                │  ❌ CORS Missing     │
                                └──────────┬───────────┘
                                           │
                                           ↓
                                ┌──────────────────────┐
                                │   Database           │
                                │   PostgreSQL         │
                                │   crmsync-db         │
                                │   ✅ Working         │
                                └──────────────────────┘
```

---

## 🎯 What Needs Fixing

### ❌ **Problem 1: Backend CORS**

**Location:** `crmsync-extension/crmsync-backend/server.js`

**Issue:**
```javascript
// Backend doesn't allow requests from www.crm-sync.net
// When website tries to call API → CORS blocks it
```

**Fix:**
```javascript
const cors = require('cors');

app.use(cors({
  origin: 'https://www.crm-sync.net',
  credentials: true
}));
```

**GitHub Repo:** https://github.com/staal2333/crmsync-extension  
**File Path:** `crmsync-backend/server.js` (or `index.js`)

---

### ❌ **Problem 2: Frontend API URL**

**Location:** `Crm-sync/constants.tsx` (or similar)

**Issue:**
```typescript
// Website might not have API URL configured
// Or it's pointing to wrong URL
```

**Fix:**
```typescript
// constants.tsx
export const API_URL = 'https://crmsync-api.onrender.com';
```

**GitHub Repo:** https://github.com/staal2333/Crm-sync  
**File Path:** `constants.tsx` or `services/api.ts`

---

## 🔄 Complete Flow (After Fixes)

```
User clicks "Sign In" in Extension
              ↓
Opens: www.crm-sync.net/#/login?source=extension&extensionId=abc
              ↓
User enters email/password
              ↓
Frontend calls: crmsync-api.onrender.com/api/auth/login
              ↓
Backend (with CORS) ✅ → Returns JWT token
              ↓
Frontend redirects to: chrome-extension://abc/auth-callback.html?token=JWT&tier=free
              ↓
Extension receives auth
              ↓
Extension shows: Account + Tier + Contact Limits
```

---

## 📋 Step-by-Step Fix Instructions

### **Step 1: Fix Backend (crmsync-extension repo)**

```bash
# Terminal commands:
git clone https://github.com/staal2333/crmsync-extension.git
cd crmsync-extension/crmsync-backend

# Find the main file:
ls -la | grep -E "server|index|app"

# Open the file (example):
# If you see "server.js":
code server.js  # or use your editor

# Add CORS at the top (after creating app)
# See code example above

# Save, commit, push:
npm install cors  # if not already installed
git add .
git commit -m "Enable CORS for www.crm-sync.net"
git push origin main

# Check Render dashboard - should start deploying
```

### **Step 2: Fix Frontend (Crm-sync repo)**

```bash
# Terminal commands:
git clone https://github.com/staal2333/Crm-sync.git
cd Crm-sync

# Find where API URL is defined:
grep -r "crmsync-api" .
# OR check these files:
cat constants.tsx
cat .env 2>/dev/null || echo ".env not found"
cat services/api.ts 2>/dev/null || echo "api.ts not found"

# Update the API URL in the file you found
# See code examples above

# Save, commit, push:
git add .
git commit -m "Configure backend API URL"
git push origin main

# Check Vercel dashboard - should start deploying
```

### **Step 3: Test**

```bash
# Wait for deployments (2-3 minutes total)

# Then test:
1. Go to www.crm-sync.net/#/login
2. Try logging in
3. Should work without CORS errors!
```

---

## 📊 Repository Overview

| Repo | What It Contains | Where It's Deployed | Status |
|------|------------------|---------------------|--------|
| **crmsync-extension** | Backend API + Extension | Render (crmsync-api.onrender.com) | ❌ Needs CORS |
| **Crm-sync** | Frontend Website | Vercel (www.crm-sync.net) | ❌ Needs API URL |
| **Local Extension** | Chrome Extension | Your computer | ✅ Already fixed! |

---

## 🧪 Test Commands

### Test Backend is Online:
```bash
curl https://crmsync-api.onrender.com/api/auth/login
```

### Test CORS (after fix):
```bash
curl -I -X OPTIONS https://crmsync-api.onrender.com/api/auth/login \
  -H "Origin: https://www.crm-sync.net"
# Should show: Access-Control-Allow-Origin: https://www.crm-sync.net
```

### Test Frontend:
```bash
# Just visit in browser:
https://www.crm-sync.net/#/login
```

---

## 🎉 Success Criteria

You'll know it's working when:
- ✅ No CORS errors in console
- ✅ Login succeeds on website
- ✅ Redirects to extension
- ✅ Extension shows your account
- ✅ Contact limits display correctly
- ✅ Upgrade button opens pricing page

---

## 💡 Pro Tip

You can test CORS fix immediately without waiting for deployment:

1. Add CORS code to backend
2. Run backend locally:
```bash
cd crmsync-backend
npm install
npm start
```

3. Update frontend to use local backend:
```typescript
const API_URL = 'http://localhost:3000';
```

4. Test login

5. If it works locally, push to GitHub!

---

**Need help with a specific file? Share a screenshot or file contents and I'll tell you exactly what to add!** 🚀
