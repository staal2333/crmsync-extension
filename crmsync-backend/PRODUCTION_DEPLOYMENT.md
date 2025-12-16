# CRMSYNC Backend - Production Deployment Guide

**Version:** 1.0.0  
**Last Updated:** December 15, 2025

---

## ✅ Production-Ready Features Implemented

### Security
- ✅ Winston logging for production monitoring
- ✅ Sentry error tracking integration
- ✅ HTTPS redirect in production
- ✅ Stricter rate limiting (60 requests/15min, 5 auth attempts/15min)
- ✅ Sync endpoint rate limiting (10 syncs/5min)
- ✅ Request logging with IP tracking
- ✅ Graceful shutdown handling

### GDPR Compliance
- ✅ Data export endpoint (`GET /api/user/export`)
- ✅ Account deletion endpoint (`DELETE /api/user/account`)
- ✅ Data summary endpoint (`GET /api/user/data-summary`)
- ✅ 30-day data retention after deletion

### Monitoring
- ✅ Structured JSON logging
- ✅ Error tracking with Sentry
- ✅ Request/response logging
- ✅ Health check endpoint with uptime

### Documentation
- ✅ Terms of Service
- ✅ Production setup script
- ✅ This deployment guide

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Generate Secrets (2 min)

```bash
cd crmsync-backend
chmod +x production-setup.sh
./production-setup.sh
```

**Copy the generated JWT secrets** - you'll need them for Render.

### Step 2: Update Render Environment (2 min)

Go to [Render Dashboard](https://dashboard.render.com) → Your Web Service → Environment

**Add/Update these variables:**

```env
NODE_ENV=production
JWT_SECRET=<paste_generated_secret_here>
REFRESH_TOKEN_SECRET=<paste_different_generated_secret_here>
LOG_LEVEL=info
```

### Step 3: Deploy (1 min)

```bash
git add .
git commit -m "Production-ready backend with security & GDPR compliance"
git push origin main
```

Render will automatically deploy. ✅

---

## 📋 Complete Setup Checklist

### Critical (Must Do Before Launch)

- [ ] **1. Change JWT Secrets**
  ```bash
  ./production-setup.sh  # Run this to generate new secrets
  ```
  Then add to Render environment variables.

- [ ] **2. Set NODE_ENV to production**
  ```env
  NODE_ENV=production  # In Render environment
  ```

- [ ] **3. Run Security Audit**
  ```bash
  npm audit
  npm audit fix  # If needed
  ```

- [ ] **4. Set Up Error Tracking (Sentry)**
  - Sign up at https://sentry.io (free tier: 5K errors/month)
  - Create new Node.js project
  - Copy DSN
  - Add to Render: `SENTRY_DSN=your_dsn_here`

- [ ] **5. Configure CORS**
  After Chrome extension is approved, add extension ID:
  ```env
  ALLOWED_ORIGINS=https://mail.google.com,chrome-extension://YOUR_EXTENSION_ID
  ```

- [ ] **6. Test All Endpoints**
  ```bash
  # Health check
  curl https://crmsync-extension.onrender.com/health
  
  # Register (should work)
  curl -X POST https://crmsync-extension.onrender.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"Test123!","displayName":"Test User"}'
  ```

### Important (Should Do Before Launch)

- [ ] **7. Upgrade Render Plan (\$7/mo recommended)**
  - Web Service: Starter (\$7/mo) - Always on, no cold starts
  - Database: Starter (\$7/mo) - Daily backups, 7-day retention
  - Total: $14/month for production reliability

- [ ] **8. Set Up Status Page**
  - Options: StatusPage.io, Instatus, or Cachet
  - Monitor: API uptime, database connectivity

- [ ] **9. Create Support Email**
  - Set up: support@yourdomain.com
  - Or use: Google Workspace, Zoho Mail (free for 5 users)

- [ ] **10. Review Rate Limits**
  Current settings (in code):
  - API: 60 requests per 15 minutes
  - Auth: 5 attempts per 15 minutes
  - Sync: 10 operations per 5 minutes
  
  Adjust if needed in `src/middleware/rateLimiter.js`

### Nice to Have (Can Do After Launch)

- [ ] **11. Set Up Automated Backups**
  ```bash
  # Create backup script
  #!/bin/bash
  DATE=$(date +%Y%m%d_%H%M%S)
  pg_dump $DATABASE_URL > backup_$DATE.sql
  # Upload to S3, Dropbox, etc.
  ```

- [ ] **12. Add Redis Caching** (if high traffic)
  - Upstash Redis (free tier: 10K commands/day)
  - Cache frequently accessed data

- [ ] **13. Set Up CI/CD**
  - GitHub Actions for automated testing
  - Automated deployment on merge to main

- [ ] **14. Create API Documentation**
  - Swagger/OpenAPI spec
  - Postman collection

---

## 🔒 Security Verification

### Test These Security Features:

1. **HTTPS Redirect**
   ```bash
   curl -I http://crmsync-extension.onrender.com
   # Should redirect to HTTPS
   ```

2. **Rate Limiting**
   ```bash
   # Try 10 rapid requests - should get rate limited
   for i in {1..10}; do curl https://crmsync-extension.onrender.com/api/auth/login; done
   ```

3. **CORS**
   ```bash
   curl -H "Origin: https://evil.com" https://crmsync-extension.onrender.com/api/auth/login
   # Should be blocked by CORS
   ```

4. **Helmet Headers**
   ```bash
   curl -I https://crmsync-extension.onrender.com
   # Should see security headers: X-Content-Type-Options, X-Frame-Options, etc.
   ```

---

## 📊 Monitoring Setup

### 1. Sentry Error Tracking

**Setup:**
1. Sign up: https://sentry.io
2. Create project: Node.js / Express
3. Copy DSN
4. Add to Render environment:
   ```env
   SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   ```

**What it tracks:**
- Unhandled errors
- API errors
- Performance issues
- Request traces (10% sampled)

### 2. Log Monitoring

**Render Logs:**
- Dashboard → Your Service → Logs
- Real-time log streaming
- Search and filter capabilities

**External Options (if needed):**
- **LogTail** (1GB/month free) - https://logtail.com
- **Papertrail** (50MB/month free) - https://papertrailapp.com
- **Datadog** (free tier available) - https://www.datadoghq.com

### 3. Uptime Monitoring

**Free Options:**
- **UptimeRobot** (50 monitors free) - https://uptimerobot.com
- **StatusCake** (10 tests free) - https://www.statuscake.com
- **Freshping** (50 URLs free) - https://www.freshworks.com/website-monitoring

**What to monitor:**
```
https://crmsync-extension.onrender.com/health
```

**Alert on:**
- Response time > 2 seconds
- Status code != 200
- Downtime > 5 minutes

---

## 💰 Cost Breakdown

### Free Tier (0-500 users)
```
Render Web Service (Free)           $0/mo
Render PostgreSQL (Free)            $0/mo
Sentry (Free - 5K errors)           $0/mo
UptimeRobot (Free - 50 monitors)    $0/mo

⚠️ Limitations:
- Spins down after 15min inactivity (30s startup)
- No automated backups
- 512MB RAM, 0.1 CPU
───────────────────────────────────────────
TOTAL: $0/month
```

### Recommended (0-5K users)
```
Render Web Service (Starter)        $7/mo   ✅ Always on
Render PostgreSQL (Starter)         $7/mo   ✅ Daily backups
Sentry (Free)                       $0/mo
UptimeRobot (Free)                  $0/mo
Domain (optional)                   $1/mo
───────────────────────────────────────────
TOTAL: $14-15/month
```

### Professional (5K-50K users)
```
Render Web Service (Standard)       $25/mo  ✅ 2GB RAM, autoscaling
Render PostgreSQL (Standard)        $20/mo  ✅ 30-day backups
Redis Cache (Upstash)               $10/mo
Sentry (Team)                       $26/mo  ✅ More features
CDN (Cloudflare)                    $0/mo   ✅ Free forever
───────────────────────────────────────────
TOTAL: $81/month
```

---

## 🧪 Testing in Production

### 1. Health Check
```bash
curl https://crmsync-extension.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-12-15T...",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 12345.67
}
```

### 2. Registration
```bash
curl -X POST https://crmsync-extension.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "displayName": "Test User"
  }'

# Should return access token and user info
```

### 3. Data Export (GDPR)
```bash
# First login to get token
TOKEN="your_access_token_here"

curl -X GET https://crmsync-extension.onrender.com/api/user/export \
  -H "Authorization: Bearer $TOKEN"

# Should return all user data in JSON format
```

### 4. Rate Limiting
```bash
# Try 70 requests rapidly (limit is 60/15min)
for i in {1..70}; do
  curl https://crmsync-extension.onrender.com/health
done

# Should get 429 error after 60 requests
```

---

## 🚨 Troubleshooting

### Issue: "Server not responding"
**Solution:**
```bash
# Check Render logs
# Go to Dashboard → Logs
# Look for startup errors

# Common causes:
# 1. Database connection failed - check DATABASE_URL
# 2. Port binding error - Render sets PORT automatically
# 3. Missing environment variables
```

### Issue: "Rate limited too quickly"
**Solution:**
```javascript
// Adjust in src/middleware/rateLimiter.js
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increase from 60 to 100
  //...
});
```

### Issue: "CORS errors from extension"
**Solution:**
```env
# In Render environment, update:
ALLOWED_ORIGINS=https://mail.google.com,chrome-extension://YOUR_ACTUAL_EXTENSION_ID
```

### Issue: "Cold starts taking too long"
**Solution:**
```
Upgrade to Render Starter plan ($7/mo)
- No cold starts
- Always on
- Faster response times
```

---

## 📅 Post-Launch Maintenance

### Daily (First Week)
- [ ] Check Render logs for errors
- [ ] Monitor Sentry for new issues
- [ ] Check uptime monitor
- [ ] Respond to support emails

### Weekly
- [ ] Review logs for patterns
- [ ] Check database size
- [ ] Monitor resource usage (RAM, CPU)
- [ ] Review user growth

### Monthly
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review and optimize database queries
- [ ] Check backup integrity
- [ ] Update dependencies
- [ ] Review Terms of Service for needed updates

---

## 📞 Support Resources

- **Render Support**: https://render.com/support
- **Sentry Docs**: https://docs.sentry.io
- **Node.js Security**: https://nodejs.org/en/docs/guides/security/
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/

---

## ✅ Final Pre-Launch Checklist

```
CRITICAL (MUST DO):
☐ JWT secrets changed in Render
☐ NODE_ENV=production set
☐ npm audit run and clean
☐ Sentry configured (optional but recommended)
☐ All endpoints tested
☐ HTTPS redirect working
☐ Rate limiting tested

RECOMMENDED:
☐ Upgraded to Render Starter ($7/mo)
☐ Automated backups enabled
☐ Status page set up
☐ Support email configured
☐ Terms of Service published

OPTIONAL:
☐ Redis caching added
☐ CI/CD pipeline set up
☐ API documentation published
☐ Load testing completed
```

---

## 🎉 You're Ready to Launch!

Once all critical items are checked, your backend is production-ready and can handle thousands of users safely and securely.

**Questions?** Check the troubleshooting section or open an issue on GitHub.

---

*Last Updated: December 15, 2025*  
*CRMSYNC Backend v1.0.0*

