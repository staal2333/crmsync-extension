# 🔧 Render Deployment Fix

## ❌ **Problem:**

Render is looking for `package.json` in the wrong directory:

```
Looking in:  /opt/render/project/src/crmsync-backend/package.json
Should be:   /opt/render/project/src/crmsync-backend/crmsync-backend/package.json
```

Your repo has a nested structure: `crmsync-backend/crmsync-backend/`

---

## ✅ **Solution: Update Render Root Directory**

### **Step 1: Go to Render Dashboard**
1. Visit https://dashboard.render.com
2. Select your backend service (e.g., "crmsync-api")
3. Click **"Settings"** tab

### **Step 2: Update Root Directory**
Find the **"Root Directory"** setting:

**Current value:** (probably empty or `crmsync-backend`)

**Change to:**
```
crmsync-backend/crmsync-backend
```

**Save Changes** (click the Save button)

### **Step 3: Trigger Deployment**
1. Click **"Manual Deploy"** button (top right)
2. Select **"Deploy latest commit"**
3. Watch the logs

---

## 📋 **Verify Your Settings:**

Your Render service should have:

| Setting | Value |
|---------|-------|
| **Root Directory** | `crmsync-backend/crmsync-backend` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` or `node src/server.js` |
| **Node Version** | >=16.0.0 (detected from package.json) |

---

## 🎯 **Expected Deployment Output:**

After changing the Root Directory, you should see:

```
✅ ==> Using Node.js version 25.2.1
✅ ==> Running build command 'npm install'...
✅ Found package.json
✅ Installing dependencies...
✅ Build succeeded
✅ ==> Running start command 'npm start'...
✅ Server listening on port 10000
```

---

## ⚠️ **If It Still Fails:**

If Render still can't find the package.json, check:

### **1. Verify GitHub Repo Structure:**
Go to: https://github.com/staal2333/crmsync-extension

Navigate to: `crmsync-backend/crmsync-backend/package.json`

You should see the file there.

### **2. Check Render's Git Branch:**
In Render Settings:
- **Branch:** `main` ✅
- **Auto-Deploy:** `Yes` ✅

### **3. Alternative: Use Build Command Path:**
If Root Directory doesn't work, try:

**Root Directory:** `crmsync-backend`

**Build Command:** 
```bash
cd crmsync-backend && npm install
```

**Start Command:**
```bash
cd crmsync-backend && npm start
```

---

## 🚀 **After Successful Deployment:**

1. **Check Logs:**
   ```
   Render Dashboard → Your Service → Logs
   ```
   Should see: "Server listening on port 10000"

2. **Test API:**
   ```bash
   curl https://crmsync-api.onrender.com/api/users/exclusions
   ```
   Expected: `401 Unauthorized` (means endpoint exists!)

3. **Verify Database:**
   ```bash
   # On Render shell
   psql $DATABASE_URL -c "\d user_exclusions"
   ```
   Should show the table structure.

---

## 📊 **Status After Fix:**

```
✅ Database migration complete
✅ Backend code pushed to GitHub
⏳ Render configuration (THIS STEP)
⏳ Successful deployment
⏳ Website deployment
⏳ End-to-end testing
```

---

## 🆘 **Still Having Issues?**

Share the deployment logs after changing the Root Directory, and I'll help debug!
