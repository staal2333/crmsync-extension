# ⚡ CRMSYNC - Quick Deploy Guide

**Get from code to live in 7 days!**

---

## 📅 7-Day Deployment Plan

### Day 1: Setup Accounts (30 min)
```
✓ GitHub account
✓ Render account  
✓ Buy domain (optional)
```

### Day 2: Deploy Backend (1-2 hours)
```bash
# 1. Push to GitHub
cd crmsync-backend
git init && git add . && git commit -m "Deploy"
git push

# 2. Deploy on Render
→ Create PostgreSQL database
→ Create web service
→ Add environment variables
→ Deploy!

# 3. Test
curl https://your-backend.onrender.com/health
```

### Day 3: Deploy Website (2-4 hours)
```
Option A: Use v0.dev with the prompt
Option B: Use template + customize
Option C: Hire developer on Upwork

Deploy to Vercel → Connect domain
```

### Day 4: Configure Extension (30 min)
```javascript
// Update Saas Tool/subscriptionService.js
ENVIRONMENT: 'production'
PRODUCTION: 'https://your-backend.onrender.com'
Pricing URL: 'https://your-domain.com/pricing'

// Test → Create ZIP
```

### Day 5: Prepare Store Listing (1 hour)
```
✓ Take 5 screenshots
✓ Create promotional images
✓ Write description
✓ Privacy policy ready
```

### Day 6: Submit Extension (30 min)
```
→ Upload to Chrome Web Store
→ Pay $5 fee
→ Submit for review
```

### Day 7-14: Wait for Approval
```
→ Review takes 3-7 days
→ Test everything again
→ Prepare launch announcement
```

---

## 🎯 Critical URLs to Update

### In Extension Code:
```javascript
// Saas Tool/subscriptionService.js
PRODUCTION: 'https://_____.onrender.com'  ← Your Render URL
Pricing: 'https://_____.com/pricing'      ← Your website
```

### In Backend:
```env
FRONTEND_URL=https://_____.com            ← Your website
ALLOWED_ORIGINS=...,https://_____.com     ← Your website
```

---

## ✅ Pre-Deploy Checklist

**Backend:**
- [ ] Code pushed to GitHub
- [ ] Database created on Render
- [ ] Web service deployed
- [ ] All environment variables set
- [ ] Migration ran
- [ ] `/health` endpoint works

**Website:**
- [ ] Built and tested locally
- [ ] Deployed to Vercel
- [ ] Domain connected (optional)
- [ ] Checkout flow tested
- [ ] Privacy policy published

**Extension:**
- [ ] Production URLs set
- [ ] Tested with production backend
- [ ] ZIP file created
- [ ] Screenshots taken
- [ ] Store listing written

---

## 💰 Costs Summary

**One-time:**
- Domain: $12/year
- Chrome Store: $5
**Total: $17**

**Monthly:**
- Backend: $0-7
- Database: $0-7
- Website: $0
**Total: $0-14/month**

**Break-even: 2 Pro users!**

---

## 📞 Important Links

**Your URLs** (fill in):
- Backend: ___________________________________
- Website: ___________________________________
- Extension: ___________________________________

**Dashboards:**
- Render: https://dashboard.render.com
- Vercel: https://vercel.com/dashboard
- Stripe: https://dashboard.stripe.com
- Chrome Store: https://chrome.google.com/webstore/devconsole

---

## 🚨 Common Mistakes to Avoid

❌ Committing .env to GitHub  
✅ Added to .gitignore

❌ Using test keys in production  
✅ Switch to live keys when ready

❌ Forgetting to update extension URLs  
✅ Update BOTH backend and pricing URLs

❌ Not testing before submission  
✅ Test everything with production backend

❌ Rushing Chrome Web Store submission  
✅ Take time with screenshots and description

---

## 🎉 Success Metrics

**Week 1:**
- 10+ installs
- 1+ paying customer
- 5-star review

**Month 1:**
- 100+ installs
- $100 MRR
- Break-even

**Month 3:**
- 500+ installs
- $500 MRR
- Profitable!

---

## 📚 Full Documentation

For detailed instructions, see:

1. **DEPLOYMENT_CHECKLIST.md** - Complete checklist
2. **DEPLOYMENT_SUMMARY.md** - Overview & roadmap
3. **crmsync-backend/README-DEPLOYMENT.md** - Backend guide
4. **Saas Tool/DEPLOYMENT_INSTRUCTIONS.md** - Extension guide

---

**Ready to deploy?**

→ Open **DEPLOYMENT_CHECKLIST.md**  
→ Start checking off items  
→ Launch in 7 days! 🚀

