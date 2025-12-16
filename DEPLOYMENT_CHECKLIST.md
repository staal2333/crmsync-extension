# ✅ CRMSYNC Deployment Checklist

Use this checklist to track your deployment progress.

## 📋 Pre-Deployment

### Code Preparation
- [ ] All code committed to git
- [ ] .gitignore configured (no .env files committed)
- [ ] README updated with production info
- [ ] Environment variables documented
- [ ] All features tested locally
- [ ] Security review completed

### Accounts Setup
- [ ] GitHub account created
- [ ] Render account created (or Railway/Heroku)
- [ ] Stripe account verified
- [ ] Domain purchased (optional but recommended)
- [ ] Chrome Web Store developer account ($5 fee paid)

### Stripe Configuration
- [ ] Products created (Pro, Business)
- [ ] Monthly prices added
- [ ] Yearly prices added  
- [ ] Price IDs copied and saved
- [ ] Test mode working
- [ ] Test cards verified

---

## 🔧 Backend Deployment

### Repository
- [ ] Code pushed to GitHub
- [ ] Repository is private/public (your choice)
- [ ] README.md includes setup instructions

### Database
- [ ] PostgreSQL database created on Render
- [ ] Database URL copied (Internal)
- [ ] Database credentials saved securely
- [ ] Migration script ready

### Web Service
- [ ] Web service created on Render
- [ ] Connected to GitHub repo
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Environment variables added (all of them!)
- [ ] Service deployed successfully

### Environment Variables Set
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `DATABASE_URL` (Internal URL from Render)
- [ ] `JWT_SECRET` (64+ characters)
- [ ] `REFRESH_TOKEN_SECRET` (64+ characters)
- [ ] `STRIPE_SECRET_KEY` (test or live)
- [ ] `STRIPE_PUBLISHABLE_KEY` (test or live)
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] All 4 `STRIPE_PRICE_*` variables
- [ ] `FRONTEND_URL`
- [ ] `ALLOWED_ORIGINS`
- [ ] `LOG_LEVEL=info`

### Database Migration
- [ ] Migration ran successfully
- [ ] Tables created (users, contacts, subscription_events, etc.)
- [ ] Test user created
- [ ] Database connection verified

### Testing
- [ ] Health endpoint responds: `/health`
- [ ] Auth endpoints work: `/api/auth/register`, `/api/auth/login`
- [ ] Subscription endpoints work: `/api/subscription/status`
- [ ] CORS configured correctly
- [ ] SSL certificate active (automatic on Render)

### Stripe Webhook
- [ ] Webhook endpoint created in Stripe
- [ ] URL: `https://your-backend.com/api/subscription/webhook`
- [ ] Events selected (6 events)
- [ ] Webhook secret copied
- [ ] Webhook secret added to environment
- [ ] Test webhook sent successfully
- [ ] Webhook logs show success

---

## 🌐 Website Deployment

### Website Creation
- [ ] Website built (Next.js/React/HTML)
- [ ] Homepage created
- [ ] Pricing page created
- [ ] Success page created
- [ ] Privacy policy page created
- [ ] Terms of service page created
- [ ] Mobile responsive
- [ ] SEO optimized (meta tags, etc.)

### Repository
- [ ] Website code pushed to GitHub
- [ ] Repository connected to Vercel/Netlify

### Deployment
- [ ] Website deployed to Vercel/Netlify
- [ ] Build successful
- [ ] Environment variables added
- [ ] Website accessible

### Domain Configuration
- [ ] Domain purchased (optional)
- [ ] DNS configured
- [ ] Domain connected to Vercel/Netlify
- [ ] SSL certificate active
- [ ] www redirect configured

### Stripe Integration
- [ ] Checkout flow implemented
- [ ] "Upgrade" buttons work
- [ ] Redirects to Stripe Checkout
- [ ] Success page shows after payment
- [ ] Test payment successful

### Testing
- [ ] Homepage loads
- [ ] Pricing page loads
- [ ] All links work
- [ ] Mobile version works
- [ ] Checkout flow works end-to-end
- [ ] Success page shows correctly

---

## 📱 Chrome Extension

### Code Updates
- [ ] API URL updated to production
- [ ] Pricing page URL updated to production
- [ ] Manifest version incremented
- [ ] All console.logs removed or disabled
- [ ] Production mode enabled

### Testing
- [ ] Extension works with production backend
- [ ] Contact limits enforced
- [ ] Upgrade prompts show
- [ ] "View Plans" button opens correct URL
- [ ] Subscription status loads correctly

### Packaging
- [ ] ZIP file created
- [ ] File size < 20MB
- [ ] All files included
- [ ] No unnecessary files (node_modules, .git, etc.)

### Assets Preparation
- [ ] 5 screenshots taken (1280x800 or 640x400)
- [ ] Promotional images created
  - [ ] Small tile (440x280)
  - [ ] Large tile (920x680)  
  - [ ] Marquee (1400x560)
- [ ] Icon updated (if needed)

### Store Listing
- [ ] Name: "CRMSYNC - Gmail Contact Manager"
- [ ] Short description written (132 chars)
- [ ] Detailed description written
- [ ] Category selected: Productivity
- [ ] Privacy policy URL added
- [ ] Support email added
- [ ] Screenshots uploaded
- [ ] Promotional images uploaded

### Submission
- [ ] ZIP file uploaded
- [ ] All fields completed
- [ ] Permissions justified
- [ ] Privacy practices declared
- [ ] Single purpose explained
- [ ] Submitted for review

### Review Status
- [ ] Submission confirmed
- [ ] Review started (date: ______)
- [ ] Feedback received (if any)
- [ ] Changes made (if needed)
- [ ] Resubmitted (if needed)
- [ ] **APPROVED** ✅ (date: ______)

---

## 🔐 Security & Compliance

### Security
- [ ] HTTPS enforced everywhere
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SQL injection protection (using parameterized queries)
- [ ] XSS protection enabled
- [ ] CSRF protection implemented
- [ ] Secrets not committed to git
- [ ] Environment variables secure

### Legal
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Refund policy published
- [ ] GDPR compliance verified
- [ ] Cookie policy (if using cookies)
- [ ] Support email functional

### Monitoring
- [ ] Error tracking set up (Sentry optional)
- [ ] Logging configured
- [ ] Health checks running
- [ ] Uptime monitoring (optional)
- [ ] Analytics set up (optional)

---

## 💰 Stripe Live Mode (When Ready)

### Pre-Switch Checklist
- [ ] Thoroughly tested in test mode
- [ ] All features working
- [ ] Webhook tested
- [ ] Refund process tested
- [ ] At least 5 beta users tested

### Switch to Live
- [ ] Stripe dashboard toggled to "Live mode"
- [ ] Live API keys generated
- [ ] Live keys added to Render environment
- [ ] Live webhook created
- [ ] Live webhook secret added to environment
- [ ] Test purchase completed successfully
- [ ] Backend restarted/redeployed

### Verification
- [ ] Live mode active
- [ ] Test purchase successful ($0.50 test)
- [ ] Webhook triggered
- [ ] User subscription updated in database
- [ ] Extension reflects Pro tier
- [ ] Refund process works

---

## 🎉 Launch

### Pre-Launch
- [ ] Everything tested end-to-end
- [ ] Beta testers feedback incorporated
- [ ] Known bugs fixed
- [ ] Support email monitored
- [ ] Launch date set: ______________

### Launch Day
- [ ] Chrome Web Store listing live
- [ ] Website live
- [ ] Backend stable
- [ ] Monitoring active
- [ ] Support ready

### Post-Launch
- [ ] Announced on social media
- [ ] Product Hunt submission
- [ ] Reddit posts (r/SaaS, r/SideProject)
- [ ] Hacker News submission
- [ ] Email newsletter sent
- [ ] Friends/network notified

---

## 📊 Metrics to Track

### Week 1
- [ ] Total installs: _______
- [ ] Daily active users: _______
- [ ] Paying customers: _______
- [ ] MRR: $_______
- [ ] Support tickets: _______

### Month 1
- [ ] Total installs: _______
- [ ] Daily active users: _______
- [ ] Paying customers: _______
- [ ] MRR: $_______
- [ ] Churn rate: _______%
- [ ] Customer feedback score: _______

---

## 🎯 Success Milestones

- [ ] First install
- [ ] 10 installs
- [ ] 100 installs
- [ ] First paying customer 🎉
- [ ] $100 MRR
- [ ] $500 MRR
- [ ] $1,000 MRR
- [ ] 5-star review on Chrome Web Store
- [ ] Featured on Product Hunt
- [ ] Break-even (costs covered)

---

## 📞 Important Information

**Backend URL:** ___________________________________
**Website URL:** ___________________________________
**Chrome Extension ID:** ___________________________________
**Support Email:** ___________________________________

**Render Dashboard:** https://dashboard.render.com
**Stripe Dashboard:** https://dashboard.stripe.com
**Chrome Web Store:** https://chrome.google.com/webstore/devconsole
**GitHub Repos:**
- Backend: ___________________________________
- Website: ___________________________________

---

**Deployment Started:** _______________
**Deployment Completed:** _______________
**Launch Date:** _______________

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

