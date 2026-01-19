# 🚀 Deploy Website Changes to Vercel

## Changes Made:
- ✅ Added `Logout.tsx` page for extension-triggered logout
- ✅ Updated `App.tsx` to handle `/#/logout` route
- ✅ Website build completed successfully

---

## Deployment Steps:

### **Option 1: Deploy via Vercel CLI (Recommended)**

```bash
cd "C:\Users\sebas\Downloads\Saas Tool-20251202T124049Z-3-001\Crm-sync"

# Deploy to production
vercel --prod
```

### **Option 2: Deploy via Git (If connected to GitHub)**

```bash
cd "C:\Users\sebas\Downloads\Saas Tool-20251202T124049Z-3-001"

# Commit changes
git add Crm-sync/pages/Logout.tsx
git add Crm-sync/App.tsx
git commit -m "Add logout page for extension synchronization"

# Push to trigger auto-deployment
git push origin main
```

### **Option 3: Manual Upload via Vercel Dashboard**

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your `crm-sync` project
3. Click "Settings" → "Git"
4. If not connected, click "Deploy" → "Upload"
5. Upload the `dist` folder from:
   ```
   C:\Users\sebas\Downloads\Saas Tool-20251202T124049Z-3-001\Crm-sync\dist
   ```

---

## Testing After Deployment:

1. **Visit:** https://www.crm-sync.net/#/logout
2. **Expected:** Shows loading spinner, logs out, redirects to home
3. **Test Extension Logout:**
   - Open extension popup
   - Click "Sign Out"
   - Should see website tab briefly open to /#/logout
   - Both extension and website logged out

---

## Files Modified:

- ✅ `Crm-sync/pages/Logout.tsx` (NEW)
- ✅ `Crm-sync/App.tsx` (UPDATED)
- ✅ `Saas Tool/auth.js` (UPDATED)
- ✅ `Saas Tool/background.js` (UPDATED)

---

**Next:** Deploy and test the complete logout flow! 🚀
