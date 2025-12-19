# 🔴 CRITICAL SECURITY FIX - Rotate JWT Secrets NOW!

## ⚠️ **URGENT: Your JWT secrets need to be updated!**

**Current Risk:** Using default/weak JWT secrets  
**Impact:** Attackers could forge authentication tokens  
**Time to Fix:** 5 minutes  
**Priority:** 🔴 **CRITICAL**

---

## 🛠️ **Step-by-Step Fix:**

### **Step 1: Generate Strong Secrets** (30 seconds)

Open PowerShell and run:

```powershell
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('REFRESH_TOKEN_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

You'll see output like:
```
JWT_SECRET=a1b2c3d4e5f6...
REFRESH_TOKEN_SECRET=f6e5d4c3b2a1...
```

**Copy both lines!** You'll need them in the next step.

---

### **Step 2: Update Render Environment Variables** (3 minutes)

1. **Go to Render Dashboard:**
   - https://dashboard.render.com

2. **Select your backend service:**
   - Click "crmsync-backend" (or whatever you named it)

3. **Go to Environment tab:**
   - Left sidebar → "Environment"

4. **Update JWT_SECRET:**
   - Find `JWT_SECRET`
   - Click "Edit"
   - Paste the new value (the long hex string)
   - Click "Save"

5. **Update REFRESH_TOKEN_SECRET:**
   - Find `REFRESH_TOKEN_SECRET`
   - Click "Edit"
   - Paste the new value
   - Click "Save"

6. **Save Changes:**
   - Click "Save Changes" at the top
   - Render will automatically restart your service

---

### **Step 3: Wait for Restart** (1-2 minutes)

Watch the logs:
- You'll see: "Service restarting..."
- Wait for: "✅ CRMSYNC API SERVER RUNNING"

---

### **Step 4: Test** (1 minute)

1. **Go to your website:**
   - https://www.crm-sync.net

2. **Try to login:**
   - You may need to logout first (old tokens will be invalid)
   - Login with your credentials
   - Should work! ✅

3. **Try the extension:**
   - Open extension popup
   - Should show your account ✅

---

## ✅ **Done!**

Your authentication is now secured with strong, unique secrets! 🔒

**Note:** All existing users will need to login again (old tokens are now invalid).

---

## 🔄 **Rotate Secrets Regularly**

**Best Practice:** Rotate JWT secrets every 90 days

**Set a reminder for:** March 17, 2026

---

## 🚨 **If You See Errors:**

### **"Invalid or expired token" errors everywhere:**
✅ **This is EXPECTED!** Old tokens are now invalid.

**Fix:** Just logout and login again.

---

### **Backend won't start:**
**Check logs:**
- Render Dashboard → Your Service → Logs

**Common issue:** Missing environment variables

**Fix:**
- Make sure both `JWT_SECRET` and `REFRESH_TOKEN_SECRET` are set
- Make sure you clicked "Save Changes"

---

## 📋 **What You Just Fixed:**

**Before:**
```javascript
❌ JWT_SECRET = 'dev_jwt_secret_change_in_production'
   Anyone could guess this!
```

**After:**
```javascript
✅ JWT_SECRET = 'a1b2c3d4e5f6789...' (64 random chars)
   Impossible to guess! 🔒
```

**Security Improvement:** 🔴 → 🟢 (Critical → Secure!)

---

## 🎯 **Next Security Fixes:**

After this, tackle these:

1. ✅ **JWT Secrets** ← YOU JUST DID THIS!
2. ⬜ **Input Validation** (see CYBERSECURITY-AUDIT.md)
3. ⬜ **CSRF Protection** (see CYBERSECURITY-AUDIT.md)

---

**Great job securing your app!** 🎉🔒
