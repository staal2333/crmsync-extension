# ⚡ Quick Fix Checklist - Get Login Working

## 🎯 Goal
Fix CORS so users can log in on www.crm-sync.net and use the extension.

---

## ✅ Fix #1: Backend CORS (5 minutes)

**Repo:** crmsync-extension  
**Folder:** crmsync-backend/

### Quick Steps:
```bash
# 1. Clone repo
git clone https://github.com/staal2333/crmsync-extension.git
cd crmsync-extension/crmsync-backend

# 2. Find main file (one of these)
ls server.js index.js app.js src/server.js

# 3. Open that file and add CORS at the top
```

### Code to Add:
```javascript
const cors = require('cors');

app.use(cors({
  origin: ['https://www.crm-sync.net', 'https://crm-sync.net'],
  credentials: true
}));
```

### Deploy:
```bash
git add .
git commit -m "Enable CORS"
git push
```

**Result:** Render auto-deploys in ~2 min

---

## ✅ Fix #2: Frontend API URL (3 minutes)

**Repo:** Crm-sync

### Quick Steps:
```bash
# 1. Clone repo
git clone https://github.com/staal2333/Crm-sync.git
cd Crm-sync

# 2. Find API URL (try these commands)
grep -r "crmsync-api.onrender.com" .
# OR
cat constants.tsx
cat .env
cat services/api.ts
```

### Update API URL:

**In constants.tsx:**
```typescript
export const API_URL = 'https://crmsync-api.onrender.com';
```

**In .env:**
```env
VITE_API_URL=https://crmsync-api.onrender.com
```

### Deploy:
```bash
git add .
git commit -m "Configure API URL"
git push
```

**Result:** Vercel auto-deploys in ~1 min

---

## 🧪 Test It Works

After both are deployed:

1. Go to: https://www.crm-sync.net/#/login
2. Enter your credentials
3. Click "Sign In"
4. Should NOT see CORS error
5. Should redirect to extension
6. Extension shows your account + tier

---

## 🆘 If You Get Stuck

### Can't find the files?

Run this in each repo:
```bash
# In crmsync-backend
ls -la

# In Crm-sync
ls -la services/
cat constants.tsx
```

Share the output with me!

### CORS still not working?

Check Render logs:
1. Go to Render dashboard
2. Click "crmsync-api"
3. Click "Logs"
4. Look for CORS errors

### Need the exact code?

Tell me:
1. What's in your `crmsync-backend/` folder?
2. What's in your `Crm-sync/constants.tsx`?

I'll give you the exact code to paste!

---

## ⏱️ Time Estimate

- Clone repos: 2 min
- Find files: 3 min
- Add CORS code: 2 min
- Add API URL: 2 min
- Push & deploy: 5 min

**Total: ~15 minutes** ⚡
