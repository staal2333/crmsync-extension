# 🌐 Vercel Deployment Guide - CRM-Sync Website

## ✅ **Backend Status:**
- API endpoint verified: `{"error":"Access token required"}` ✅
- Database ready ✅
- Code pushed to GitHub ✅

---

## 🚀 **Deploy Website to Vercel (5-10 min)**

### **Option A: Auto-Deploy (If Already Connected)**

If your Vercel project is already connected to GitHub:

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard

2. **Find your project** (probably "crm-sync" or "crmsync")

3. **Check Deployments tab:**
   - Should automatically detect new commit `39621b3`
   - Will trigger deployment in ~1-2 minutes

4. **Watch build logs:**
   ```
   ✅ Building...
   ✅ Build succeeded
   ✅ Deploying to production...
   ✅ Deployed to https://crm-sync.net
   ```

---

### **Option B: Manual Deploy (If Not Connected)**

If Vercel isn't auto-deploying:

#### **Step 1: Build Locally (Test)**

```powershell
cd "c:\Users\sebas\Downloads\Saas Tool-20251202T124049Z-3-001\Crm-sync"

# Install dependencies
npm install

# Build for production
npm run build

# Test the build locally (optional)
npm run preview
```

**Expected output:**
```
✅ vite v6.2.0 building for production...
✅ build complete
✅ dist folder created
```

#### **Step 2: Deploy to Vercel**

**Via Vercel CLI:**

```powershell
# Install Vercel CLI (if not already)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

**Follow prompts:**
```
? Set up and deploy "~\Crm-sync"? Y
? Which scope? Your Account
? Link to existing project? Y (if exists) or N (create new)
? What's your project name? crm-sync
? In which directory is your code? ./
? Want to override settings? N
```

**Via Vercel Dashboard:**

1. Go to https://vercel.com/new
2. Import Git Repository → Select `crmsync-extension` repo
3. **Root Directory:** `Crm-sync`
4. **Framework Preset:** Vite
5. **Build Command:** `npm run build`
6. **Output Directory:** `dist`
7. Click **Deploy**

---

## ⚙️ **Vercel Configuration (Important!)**

Make sure these settings are correct in Vercel dashboard:

| Setting | Value |
|---------|-------|
| **Root Directory** | `Crm-sync` |
| **Framework** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Node Version** | 18.x or higher |
| **Install Command** | `npm install` |

---

## 🔗 **Environment Variables (If Needed)**

If your website needs to talk to the backend, add these in Vercel:

```
VITE_API_URL=https://crmsync-api.onrender.com
```

**How to add:**
1. Vercel Dashboard → Your Project → Settings
2. Environment Variables
3. Add variable
4. Redeploy

---

## ✅ **After Deployment:**

### **1. Verify New Pages:**

Visit these URLs:

```
✅ https://crm-sync.net/#/connect-crm
✅ https://crm-sync.net/#/exclusions
✅ https://crm-sync.net/#/install
✅ https://crm-sync.net/#/done
```

### **2. Check Console:**

Open browser DevTools → Console, look for:
- No 404 errors
- No React errors
- Pages load correctly

### **3. Test Navigation:**

1. Start at homepage
2. Navigate through onboarding flow
3. Verify all pages render

---

## 🎯 **Current Status:**

```
✅ Backend API live (tested)
✅ Code pushed to GitHub
⏳ Vercel deployment (THIS STEP)
⏳ Test complete onboarding flow
```

---

## 🆘 **Troubleshooting:**

### **Build Fails:**

If Vercel build fails, check:

1. **Node version:** Should be 18+
2. **Dependencies:** Run `npm install` locally first
3. **Build command:** Should be `npm run build`
4. **Root directory:** Should be `Crm-sync`

### **Pages Not Found (404):**

If pages 404 after deployment:

1. Check that `App.tsx` has the new routes
2. Verify hash-based routing is working
3. Check browser console for errors

### **API Calls Fail:**

If frontend can't reach backend:

1. Check CORS settings on backend
2. Verify API URL is correct
3. Check browser network tab

---

## 📊 **Next After Deployment:**

Once Vercel deployment succeeds:

1. **Reload Extension:**
   ```
   Chrome → Extensions → CRM-Sync → Reload
   ```

2. **Test Complete Flow:**
   - Visit crm-sync.net
   - Sign in
   - Navigate through all onboarding pages
   - Open Gmail
   - Test contact detection

---

## 🚀 **Let's Deploy!**

**Choose your method:**

1. **Auto-deploy** (if Vercel is already connected) - Just wait 1-2 min
2. **Vercel CLI** - Run `vercel --prod` in Crm-sync folder
3. **Vercel Dashboard** - Import repo manually

**Which method are you using?** Let me know if you need help with any step! 🎯
