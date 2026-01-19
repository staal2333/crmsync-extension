# 🚀 Deploy Updated Website to Vercel

## ✅ What We Fixed
- Updated `stripeService.ts` to properly throw errors instead of bypassing Stripe
- Your `constants.tsx` already has the correct LIVE Price IDs
- Built the website successfully

## 📤 Deploy Steps

### Option 1: Deploy via Vercel Dashboard (EASIEST)
1. **Go to**: https://vercel.com/dashboard
2. **Find your project**: `crm-sync` or similar
3. **Click**: "Deployments" tab
4. **Click**: "Redeploy" button
5. **Wait**: 1-2 minutes for deployment
6. **Done!** ✅

### Option 2: Deploy via CLI (if you prefer)
```bash
# Step 1: Login to Vercel
vercel login

# Step 2: Deploy to production
vercel --prod
```

### Option 3: Connect to Git (BEST for future)
If you haven't already:
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Every push to `main` will auto-deploy

---

## 🧪 After Deployment - Test Checklist

1. **Wait 2-3 minutes** for Vercel to deploy
2. **Clear browser cache**: Ctrl+Shift+Delete (or hard refresh: Ctrl+F5)
3. **Open**: https://www.crm-sync.net/#/pricing
4. **Open Console**: Press F12
5. **Click**: "Start Pro Trial"
6. **Expected**: Should redirect to Stripe Checkout page

---

## ✅ What Should Happen Now

When you click "Start Pro Trial":
- ✅ Browser console shows: `💳 Creating Stripe checkout for pro (monthly)...`
- ✅ Browser console shows: `✅ Checkout session created: cs_test_...`
- ✅ New tab opens with **Stripe Checkout page**
- ✅ You see Stripe's payment form
- ❌ Should NOT see "Payment Successful" immediately

---

## 🐛 If Still Not Working

Check these:
1. **Hard refresh the website** (Ctrl+Shift+R)
2. **Check browser console** for errors
3. **Verify Render backend** is running: https://crmsync-api.onrender.com/api/health
4. **Check Render env vars** have the live Price IDs

---

## 📋 Current Live Price IDs (for reference)

Already configured in `constants.tsx`:
```
PRO_MONTHLY:  price_1SewtEFyB6BgsXQ0urEgr6hN
PRO_YEARLY:   price_1SewtzFyB6BgsXQ028jd0Xmo
BUSINESS_MONTHLY: price_1SewvGFyB6BgsXQ079zbn4cm
BUSINESS_YEARLY:  price_1SewvqFyB6BgsXQ0ctLLwzd9
```

---

## 🎯 Quick Deploy Now

**Easiest method** (no CLI needed):
1. Go to: https://vercel.com/dashboard
2. Find your project
3. Click "Redeploy"
4. Wait 2 minutes
5. Test at: https://www.crm-sync.net/#/pricing

That's it! 🚀
