# 🔐 Google OAuth Setup for CRMSYNC

**Time Required:** 15 minutes  
**Difficulty:** Easy  
**Status:** ⚠️ **REQUIRED BEFORE LAUNCH**

---

## ❓ **Why This is Needed**

Your `manifest.json` currently has:
```json
"oauth2": {
  "client_id": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
}
```

This is a **placeholder**. Without a real Google OAuth Client ID, users **cannot sign in with Google**!

---

## 📋 **Step-by-Step Setup**

### **Step 1: Go to Google Cloud Console** (2 min)

1. Open: https://console.cloud.google.com
2. Sign in with your Google account
3. Click "Select a project" → "New Project"
4. Project name: **CRMSYNC**
5. Click "Create"
6. Wait for project creation (10-20 seconds)

---

### **Step 2: Enable Required APIs** (2 min)

1. In the project dashboard, click "APIs & Services"
2. Click "Enable APIs and Services"
3. Search for: **Google Identity Services API**
4. Click on it → Click "Enable"
5. Wait for it to enable (10-20 seconds)

---

### **Step 3: Configure OAuth Consent Screen** (3 min)

1. In sidebar, click "OAuth consent screen"
2. User Type: **External** (select this)
3. Click "Create"

**Fill out the form:**
```
App name: CRMSYNC
User support email: [your email]
App logo: [optional - skip for now]

Application home page: https://www.crm-sync.net
Application privacy policy: https://www.crm-sync.net/#/privacy
Application terms of service: https://www.crm-sync.net/#/terms

Developer contact: [your email]
```

4. Click "Save and Continue"
5. **Scopes:** Click "Add or Remove Scopes"
   - Select: `openid`
   - Select: `email`
   - Select: `profile`
   - Click "Update"
6. Click "Save and Continue"
7. **Test users:** Skip for now (or add yourself)
8. Click "Save and Continue"
9. Review and click "Back to Dashboard"

---

### **Step 4: Create OAuth Client ID** (3 min)

1. In sidebar, click "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"

**Fill out:**
```
Application type: Chrome Extension
Name: CRMSYNC
```

3. **Extension ID:**
   - Open Chrome: `chrome://extensions`
   - Enable "Developer mode" (top right)
   - Find your CRMSYNC extension
   - Copy the ID (looks like: `abcdefghijklmnopqrstuvwxyz123456`)

4. **In Google Cloud Console:**
   - Paste Extension ID
   - Click "Create"

5. **IMPORTANT:** Copy the Client ID that appears!
   - It looks like: `123456789-abc123xyz789.apps.googleusercontent.com`
   - Save it somewhere safe!

---

### **Step 5: Update manifest.json** (2 min)

1. Open: `Saas Tool/manifest.json`

2. Find this line:
```json
"client_id": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
```

3. Replace with your actual Client ID from Step 4:
```json
"client_id": "123456789-abc123xyz789.apps.googleusercontent.com"
```

4. **Save the file!**

---

### **Step 6: Reload Extension** (1 min)

1. Go to: `chrome://extensions`
2. Find CRMSYNC
3. Click the **reload icon** 🔄
4. Close and reopen the extension popup

---

### **Step 7: Test Google Sign-In** (2 min)

1. Click extension icon
2. Click "Sign in with Google"
3. **Should see Google popup** ✅
4. Select your Google account
5. Allow permissions
6. Should return to extension
7. Should see your email/name

**If it works:** ✅ You're done!  
**If it doesn't:** See Troubleshooting below

---

## 🐛 **TROUBLESHOOTING**

### **"OAuth popup doesn't open"**

**Check:**
```json
// manifest.json should have:
"permissions": ["identity"],
"oauth2": {
  "client_id": "YOUR-ACTUAL-CLIENT-ID.apps.googleusercontent.com",
  "scopes": ["openid", "email", "profile"]
}
```

**Fix:**
1. Make sure Client ID is correct (no quotes, no typos)
2. Reload extension: `chrome://extensions` → Reload
3. Try again

---

### **"Access blocked: This app's request is invalid"**

**Problem:** OAuth consent screen not configured

**Fix:**
1. Go to Google Cloud Console
2. OAuth consent screen
3. Make sure App name, emails, and URLs are filled out
4. Click "Save"
5. Try again

---

### **"The OAuth client was not found"**

**Problem:** Extension ID doesn't match

**Fix:**
1. Go to: `chrome://extensions`
2. Copy extension ID exactly
3. Go to Google Cloud Console → Credentials
4. Edit your OAuth Client ID
5. Update Extension ID
6. Save
7. Try again

---

### **"redirect_uri_mismatch"**

**Problem:** Missing redirect URI

**Fix:**
1. Google Cloud Console → Credentials
2. Edit OAuth Client ID
3. Add Authorized redirect URI:
   ```
   https://YOUR-EXTENSION-ID.chromiumapp.org/
   ```
   (Replace YOUR-EXTENSION-ID with your actual extension ID)
4. Save
5. Try again

---

## 🔒 **SECURITY NOTES**

### **Keep Your Client ID Safe**

- ✅ **OK to commit** to your repo (it's not a secret)
- ✅ **OK to distribute** with your extension
- ✅ **OK to show publicly**

**Why?** Client IDs are designed to be public. The security comes from:
1. Extension ID verification
2. OAuth consent screen (user approval)
3. Authorized redirect URIs

### **Do NOT Share:**
- ❌ Client Secret (if generated - not needed for extensions)
- ❌ Service Account keys
- ❌ API keys

---

## 📝 **AFTER CHROME WEB STORE SUBMISSION**

### **Important: Update OAuth Settings**

Once your extension is on Chrome Web Store, you'll get a permanent Extension ID.

**You must:**
1. Get new Extension ID from Chrome Web Store
2. Update OAuth Client ID in Google Console
3. Update `manifest.json` with stable Extension ID
4. Re-submit extension update

**Timeline:**
- Day 1: Submit to Chrome Web Store (with temp ID)
- Day 3-5: Get approved, get permanent ID
- Day 6: Update OAuth settings
- Day 7: Re-submit extension update

---

## ✅ **VERIFICATION CHECKLIST**

Before you move on:

```bash
☐ Google Cloud project created
☐ Google Identity Services API enabled
☐ OAuth consent screen configured
☐ OAuth Client ID created
☐ Client ID copied and saved
☐ manifest.json updated with real Client ID
☐ Extension reloaded in Chrome
☐ Tested "Sign in with Google" button
☐ Can successfully sign in with Google account
☐ Extension shows my Google account info
```

**All checked?** ✅ You're done with OAuth setup!

---

## 🎯 **WHAT'S NEXT**

After OAuth is working:

1. ✅ Rotate JWT Secrets (see `SECURITY-QUICK-FIX.md`)
2. ✅ Complete end-to-end testing
3. ✅ Submit to Chrome Web Store

---

## 📞 **NEED HELP?**

**Google OAuth Documentation:**
- https://developers.google.com/identity/protocols/oauth2
- https://developer.chrome.com/docs/extensions/mv3/tut_oauth/

**Common Issues:**
- https://developers.google.com/identity/protocols/oauth2/resources/error-codes

**Still Stuck?**
- Check Chrome extension console for errors
- Check Google Cloud Console logs
- Try with a fresh Google account

---

**Good luck! OAuth setup is the last critical step before launch! 🚀**
