# ✅ CRMSYNC Security Checklist

**Print this and check off each item as you complete it!**

---

## 🔴 **TODAY (30 minutes total)**

### **Critical Security Fixes**

- [ ] **Rotate JWT Secrets** (5 min)
  - [ ] Generate new JWT_SECRET (run node command)
  - [ ] Generate new REFRESH_TOKEN_SECRET
  - [ ] Update both in Render dashboard
  - [ ] Wait for service restart
  - [ ] Test login works
  - **Guide:** SECURITY-QUICK-FIX.md

- [ ] **Verify Stripe Webhook Security** (10 min)
  - [ ] Check STRIPE_WEBHOOK_SECRET is set on Render
  - [ ] Test webhook with Stripe CLI: `stripe trigger checkout.session.completed`
  - [ ] Verify in Render logs: "✅ Webhook received"
  - [ ] Check Stripe Dashboard → Developers → Webhooks → Recent Events

- [ ] **Check npm Security** (5 min)
  - [ ] Run: `cd crmsync-backend/crmsync-backend && npm audit`
  - [ ] Run: `npm audit fix` if vulnerabilities found
  - [ ] Commit any package updates

- [ ] **Review Sentry Dashboard** (5 min)
  - [ ] Go to: https://sentry.io (if configured)
  - [ ] Check for recent errors
  - [ ] Set up email alerts if not done

- [ ] **Backup Environment Variables** (5 min)
  - [ ] Document all Render env vars (securely)
  - [ ] Store in password manager
  - [ ] Don't commit to Git!

---

## 🟡 **THIS WEEK (3-4 hours total)**

### **Important Security Enhancements**

#### **Day 1: Input Validation (1-2 hours)**

- [ ] **Install Dependencies**
  ```bash
  cd crmsync-backend/crmsync-backend
  npm install express-validator
  ```

- [ ] **Add Validation to Auth Routes** (30 min)
  - [ ] `/api/auth/register` - validate email, password, name
  - [ ] `/api/auth/login` - validate email, password
  - [ ] Test with invalid inputs
  - [ ] Verify error messages

- [ ] **Add Validation to Contact Routes** (30 min)
  - [ ] `/api/contacts` POST - validate contact fields
  - [ ] `/api/contacts/:id` PUT - validate update fields
  - [ ] Test with malicious input (XSS attempts)

- [ ] **Add Validation to Sync Routes** (30 min)
  - [ ] `/api/sync/full` - validate sync data
  - [ ] `/api/sync/incremental` - validate changes
  - [ ] Test with large payloads

#### **Day 2: Frontend CSP (30 minutes)**

- [ ] **Create vercel.json**
  - [ ] Add CSP header
  - [ ] Add X-Frame-Options: DENY
  - [ ] Add X-Content-Type-Options: nosniff
  - [ ] Add Referrer-Policy
  - [ ] Add Permissions-Policy

- [ ] **Deploy and Test**
  - [ ] Push to GitHub
  - [ ] Wait for Vercel deployment
  - [ ] Open DevTools → Network → Check response headers
  - [ ] Verify CSP is active

#### **Day 3: CSRF Protection (1 hour)**

- [ ] **Install csurf**
  ```bash
  cd crmsync-backend/crmsync-backend
  npm install csurf
  ```

- [ ] **Add CSRF Middleware**
  - [ ] Configure csurf in server.js
  - [ ] Add `/api/csrf-token` endpoint
  - [ ] Apply to state-changing routes

- [ ] **Update Frontend**
  - [ ] Fetch CSRF token on load
  - [ ] Include token in POST/PUT/DELETE requests
  - [ ] Test all forms work

- [ ] **Test Protection**
  - [ ] Try POST without token → should fail
  - [ ] Try POST with token → should work

#### **Day 4: Security Logging (1 hour)**

- [ ] **Add Security Logger**
  - [ ] Create `securityLogger` in server.js
  - [ ] Configure file transport: `security.log`

- [ ] **Add Login Logging**
  - [ ] Log failed login attempts (email, IP, timestamp)
  - [ ] Log successful logins
  - [ ] Log password reset attempts

- [ ] **Add Suspicious Activity Logging**
  - [ ] Log rate limit hits
  - [ ] Log invalid token attempts
  - [ ] Log SQL injection attempts (from validation)

- [ ] **Test Logging**
  - [ ] Try failed login → check logs
  - [ ] Check log format is readable
  - [ ] Set up log rotation (optional)

---

## 🟢 **THIS MONTH (6-8 hours total)**

### **Nice-to-Have Security Features**

#### **Week 2: Token Blacklist (2 hours)**

- [ ] **Set Up Redis** (or in-memory alternative)
  - [ ] Sign up for Redis Cloud (free tier) or use Render Redis
  - [ ] Get connection URL
  - [ ] Add to Render env vars: `REDIS_URL`

- [ ] **Install Redis Client**
  ```bash
  npm install redis
  ```

- [ ] **Implement Blacklist**
  - [ ] Add logout route that blacklists token
  - [ ] Update auth middleware to check blacklist
  - [ ] Test logout → token becomes invalid

- [ ] **Test Logout Flow**
  - [ ] Logout from website → token invalid
  - [ ] Try to use old token → 401 error
  - [ ] Login again → new token works

#### **Week 3: Two-Factor Authentication (3-4 hours)**

- [ ] **Install TOTP Library**
  ```bash
  npm install speakeasy qrcode
  ```

- [ ] **Backend: Add 2FA Endpoints**
  - [ ] `/api/auth/2fa/enable` - Generate secret, return QR code
  - [ ] `/api/auth/2fa/verify` - Verify TOTP code
  - [ ] `/api/auth/2fa/disable` - Turn off 2FA
  - [ ] Add `two_factor_secret` column to users table

- [ ] **Frontend: Add 2FA Settings**
  - [ ] Add "Enable 2FA" button in Account page
  - [ ] Show QR code modal
  - [ ] Add TOTP code input on login (if enabled)

- [ ] **Test 2FA Flow**
  - [ ] Enable 2FA → scan QR with Google Authenticator
  - [ ] Logout and login → enter TOTP code
  - [ ] Wrong code → error
  - [ ] Correct code → success

#### **Week 4: Database Security Audit (2 hours)**

- [ ] **Audit All Database Queries**
  - [ ] Check `authService.js` - all queries parameterized?
  - [ ] Check `syncService.js` - no string concatenation?
  - [ ] Check all route handlers
  - [ ] Search for: `db.query(\`SELECT` (template literals = bad!)

- [ ] **Test SQL Injection**
  - [ ] Try: `email = "admin@test.com' OR '1'='1"`
  - [ ] Should NOT bypass authentication
  - [ ] Should return error or no results

- [ ] **Enable Query Logging** (on Render)
  - [ ] Log slow queries
  - [ ] Log failed queries
  - [ ] Review logs weekly

- [ ] **Set Up Database Backups**
  - [ ] Verify Render auto-backups are enabled
  - [ ] Test manual backup: Render dashboard → Database → Backup
  - [ ] Test restore process (use a copy, not production!)

---

## 📧 **EMAIL SECURITY (1 hour)**

### **DNS Configuration**

- [ ] **Add SPF Record**
  - [ ] Login to DNS provider (Cloudflare, GoDaddy, etc.)
  - [ ] Add TXT record: `v=spf1 include:spf.postmarkapp.com ~all`
  - [ ] Wait 1 hour for propagation
  - [ ] Verify: https://mxtoolbox.com/spf.aspx

- [ ] **Add DKIM Record**
  - [ ] Get DKIM from Postmark dashboard
  - [ ] Add TXT record to DNS
  - [ ] Verify in Postmark dashboard

- [ ] **Add DMARC Record**
  - [ ] Add TXT record: `v=DMARC1; p=quarantine; rua=mailto:admin@crm-sync.net`
  - [ ] Wait 1 hour for propagation
  - [ ] Verify: https://mxtoolbox.com/dmarc.aspx

- [ ] **Test Email Deliverability**
  - [ ] Send test email to: https://mail-tester.com
  - [ ] Check spam score (should be 9-10/10)
  - [ ] Fix any issues reported

---

## 🔄 **ONGOING MAINTENANCE**

### **Weekly (30 min)**

- [ ] **Monday: Security Review**
  - [ ] Check Sentry for new errors
  - [ ] Review Render logs for suspicious activity
  - [ ] Check Stripe dashboard for unusual charges

- [ ] **Friday: Dependency Updates**
  ```bash
  npm audit
  npm audit fix
  ```
  - [ ] Test after updates
  - [ ] Commit if all green

### **Monthly (1 hour)**

- [ ] **First of Month: Security Audit**
  - [ ] Review failed login attempts (security.log)
  - [ ] Check rate limit hits
  - [ ] Review user permissions
  - [ ] Scan for unused API keys

- [ ] **Mid-Month: Backup Test**
  - [ ] Test database backup restore
  - [ ] Verify backups are being created
  - [ ] Check backup retention policy

### **Quarterly (2-3 hours)**

- [ ] **Full Security Review**
  - [ ] Re-read CYBERSECURITY-AUDIT.md
  - [ ] Check for new vulnerabilities: `npm audit`
  - [ ] Update dependencies: `npm update`
  - [ ] Review GDPR compliance
  - [ ] Consider penetration testing

- [ ] **Rotate Secrets**
  - [ ] Generate new JWT secrets
  - [ ] Update on Render
  - [ ] Force all users to re-login

---

## 🚨 **INCIDENT RESPONSE CHECKLIST**

### **If You Detect a Security Breach:**

- [ ] **Immediate Actions (< 5 min)**
  - [ ] Revoke all JWT secrets (rotate on Render)
  - [ ] Force logout all users
  - [ ] Disable API temporarily (if severe)

- [ ] **Investigation (< 1 hour)**
  - [ ] Check Render logs for suspicious activity
  - [ ] Check Sentry for errors
  - [ ] Check security.log for failed attempts
  - [ ] Identify scope: which users affected?

- [ ] **Notification (< 24 hours)**
  - [ ] Email affected users
  - [ ] Explain what happened
  - [ ] Recommend password change
  - [ ] Apologize

- [ ] **Reporting (< 72 hours)**
  - [ ] GDPR: Report to data protection authority (if EU users)
  - [ ] Contact Stripe security team (if payment data)
  - [ ] Public disclosure (if required by law)

- [ ] **Fix & Prevention (< 1 week)**
  - [ ] Identify root cause
  - [ ] Implement fix
  - [ ] Add tests to prevent recurrence
  - [ ] Update security procedures

- [ ] **Post-Mortem (after fix)**
  - [ ] Write incident report
  - [ ] Document lessons learned
  - [ ] Update security training
  - [ ] Review insurance (if applicable)

---

## 📊 **COMPLETION TRACKING**

```
Today's Critical Tasks:        [ ] [ ] [ ] [ ] [ ]  (0/5 done)
This Week's Important Tasks:   [ ] [ ] [ ] [ ]      (0/4 done)
This Month's Nice-to-Haves:   [ ] [ ] [ ]          (0/3 done)

Overall Progress: 0%

Target: 100% completion in 30 days
```

---

## 🎯 **YOUR FIRST STEP:**

**Right now, check this box:**

- [ ] **I've read this checklist and commit to completing it!**

**Then do this:**

1. Open: SECURITY-QUICK-FIX.md
2. Complete: Rotate JWT Secrets (5 min)
3. Check off the first box ✅
4. Feel the satisfaction! 😊

---

## 🏆 **ACHIEVEMENT UNLOCKED**

When you complete all boxes:

```
🏆 SECURITY MASTER 🏆
   Completion: 100%
   Your app is now 95% secure!
   Users can trust your platform! 🛡️
```

**Print this checklist and put it somewhere visible!**

Every completed checkbox is a step toward a more secure CRMSYNC! 🚀

---

**Questions? See:** CYBERSECURITY-AUDIT.md for detailed explanations!
