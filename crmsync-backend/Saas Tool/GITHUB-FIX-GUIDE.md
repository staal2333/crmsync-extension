# 🔧 GitHub Repositories Fix Guide

You have 2 repos that need updates to fix the CORS issue and get everything working.

---

## 📦 Repository 1: Backend API

**Repo:** https://github.com/staal2333/crmsync-extension  
**Path:** `crmsync-backend/`

### What to Fix:
Add CORS to allow requests from www.crm-sync.net

### Steps:

1. **Clone the repo** (if you haven't):
```bash
git clone https://github.com/staal2333/crmsync-extension.git
cd crmsync-extension/crmsync-backend
```

2. **Find the main server file:**
   - Look for: `server.js`, `index.js`, or `app.js`

3. **Add CORS code at the TOP** (right after creating the app):

```javascript
const express = require('express');
const cors = require('cors');

const app = express();

// ✅ ADD THIS - CORS Configuration (MUST be BEFORE other middleware)
app.use(cors({
  origin: [
    'https://www.crm-sync.net',
    'https://crm-sync.net',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Then your other middleware
app.use(express.json());

// Your routes below...
```

4. **Make sure CORS package is installed:**

Check `package.json` - if `cors` is not listed, add it:

```bash
npm install cors
```

5. **Commit and push:**
```bash
git add .
git commit -m "Enable CORS for www.crm-sync.net"
git push origin main
```

6. **Render will auto-deploy** (check your Render dashboard)

---

## 🌐 Repository 2: Frontend Website

**Repo:** https://github.com/staal2333/Crm-sync

### What to Fix:
Update API URL to point to your backend

### Steps:

1. **Clone the repo** (if you haven't):
```bash
git clone https://github.com/staal2333/Crm-sync.git
cd Crm-sync
```

2. **Find API configuration:**

Look for these files (check each one):
- `services/api.js` or `services/api.ts`
- `services/authService.js` or similar
- `constants.tsx` (I see this in your repo!)
- `.env` or `.env.local`

3. **Update the API URL:**

**If using constants.tsx:**
```typescript
// constants.tsx
export const API_URL = 'https://crmsync-api.onrender.com';
// OR if you move backend to same domain:
// export const API_URL = 'https://www.crm-sync.net/api';
```

**If using .env file:**
```env
VITE_API_URL=https://crmsync-api.onrender.com
```

**If using services/api.ts:**
```typescript
// services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://crmsync-api.onrender.com';

export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};
```

4. **Commit and push:**
```bash
git add .
git commit -m "Update API URL to backend"
git push origin main
```

5. **Vercel will auto-deploy** (check your Vercel dashboard)

---

## ✅ Repository 3: Extension (Already Updated!)

**Repo:** https://github.com/staal2333/crmsync-extension  
**Path:** `Saas Tool/`

The extension code in your local folder is already updated with:
- ✅ Correct website URL (www.crm-sync.net)
- ✅ Contact limit system
- ✅ Upgrade prompts
- ✅ Website authentication flow

**To update the extension in GitHub:**

```bash
# From your current location:
cd "c:\Users\sebas\Downloads\Saas Tool-20251202T124049Z-3-001"

# If you haven't set up git here yet:
git init
git remote add origin https://github.com/staal2333/crmsync-extension.git
git fetch
git checkout main

# Copy your updated extension files:
# (Your "Saas Tool" folder should replace the one in the repo)

# Then commit:
git add "Saas Tool"/*
git commit -m "Update extension with contact limits and website auth"
git push origin main
```

---

## 🎯 Priority Order:

### **Do This FIRST:** Fix Backend CORS
1. Go to `crmsync-extension` repo
2. Open `crmsync-backend/server.js` (or similar)
3. Add CORS code
4. Push to GitHub
5. Wait for Render to deploy (~2 minutes)

### **Do This SECOND:** Fix Frontend API URL
1. Go to `Crm-sync` repo
2. Find where API URL is defined
3. Update it
4. Push to GitHub
5. Wait for Vercel to deploy (~1 minute)

### **Do This THIRD:** Test Everything
1. Go to www.crm-sync.net/#/login
2. Try logging in
3. Should redirect to extension
4. Extension should show your account

---

## 🔍 Quick Check - Which Files to Look For:

### In `crmsync-extension/crmsync-backend/`:
- [ ] `server.js` or `index.js` or `app.js`
- [ ] `package.json` (check if `cors` is installed)

### In `Crm-sync/`:
- [ ] `constants.tsx` (likely has API_URL!)
- [ ] `services/api.ts` or `services/authService.ts`
- [ ] `.env` or `.env.local`
- [ ] Look in `pages/` folder for login page

---

## 🆘 Can't Find the Files?

### For Backend:
```bash
cd crmsync-extension/crmsync-backend
ls -la
# Look for: server.js, index.js, app.js, src/server.js
```

### For Frontend:
```bash
cd Crm-sync
ls -la services/
ls -la pages/
grep -r "crmsync-api.onrender.com" .
# This will show you which files have the API URL
```

---

## 📞 Need Help?

Share with me:
1. Screenshot of `crmsync-backend/` folder contents
2. Screenshot of `Crm-sync/services/` folder contents
3. Content of `Crm-sync/constants.tsx` file

And I'll give you the exact code to paste! 🚀
