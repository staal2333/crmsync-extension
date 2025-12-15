# Test Your CRMSYNC Extension

Quick checklist to verify everything is working.

## ✅ Pre-Flight Checklist

### 1. Extension Loads Without Errors

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select "Saas Tool" folder
5. Look for errors (click "Errors" button if present)

**Expected Result:** No errors, extension shows up with icon

**If you see errors:**
- Service worker error? Check background.js console
- File not found? Make sure all files exist in "Saas Tool" folder

### 2. Popup Opens

1. Click the CRMSYNC extension icon in toolbar
2. Popup should open (not blank)

**Expected Result:** Popup opens with welcome banner or tabs visible

**If popup is blank:**
- Open DevTools Console (F12 while popup is open)
- Check for JavaScript errors
- Verify all script files are loading

### 3. Widget Shows on Gmail (Without Backend)

1. Go to https://mail.google.com
2. Look for floating widget in bottom-right corner

**Expected Result:** Small floating widget with "CRM" icon

**If widget doesn't show:**
- Open Console (F12) on Gmail page
- Look for content.js errors
- Check if "Show Widget" button in popup works

### 4. Basic Functionality (Offline Mode)

1. Click extension icon
2. If you see welcome banner, click "Continue Offline"
3. Go to Gmail
4. Send an email to someone
5. Click extension icon
6. Check if contact appears in "Contacts" tab

**Expected Result:** Contact appears in list

### 5. Backend Connection (Optional)

**Only if you've set up the backend:**

1. Start backend: `cd crmsync-backend && npm run dev`
2. Verify it's running: `curl http://localhost:3000/health`
3. Click extension icon
4. Click "Sign In / Sign Up"
5. Try creating an account

**Expected Result:** Login page opens, registration works

---

## 🔧 Quick Fixes

### Extension Not Loading

**Symptom:** Extension shows errors in chrome://extensions/

**Fix:**
1. Check all files are in "Saas Tool" folder:
   - manifest.json
   - background.js
   - popup.html, popup.js, popup.css
   - content.js
   - styles.css
   - auth.js, sync.js
   - login.html, login-page.js
   - guest-mode-banner.js
   - icons/ folder

2. Reload extension: Click refresh icon in chrome://extensions/

### Popup Not Clickable

**Symptom:** Popup opens but can't click anything

**Fix:**
1. Check for blocking overlay
2. Open popup DevTools (right-click popup → Inspect)
3. Look for z-index issues
4. Try closing and reopening popup

### Widget Not Showing

**Symptom:** No widget on Gmail

**Fix:**
1. Open Gmail console (F12)
2. Check for content.js errors
3. Look for `"🔧 CRMSYNC widget initialized"` message
4. Try clicking "Show Widget" in popup
5. Refresh Gmail page

### "Cannot access chrome.identity" Error

**Symptom:** Error when trying to sign in with Google

**Fix:**
1. Make sure `manifest.json` has `"identity"` permission
2. Add Google OAuth client ID to `oauth2` section
3. Reload extension

---

## 🧪 Test Each Mode

### Test Guest Mode (No Account)

```
✅ Welcome banner shows
✅ Click "Continue Offline"
✅ Extension works
✅ Contacts save locally
✅ CSV export works
✅ Settings save
```

### Test With Backend (Account Mode)

```
✅ Backend running (http://localhost:3000/health returns OK)
✅ Click "Sign In / Sign Up"
✅ Registration works
✅ Login works
✅ Auth banner shows email
✅ Sync status updates
✅ Manual sync button works
✅ Sign out works
```

---

## 📊 Common Issues & Solutions

### Issue: "importScripts is not defined"

**Cause:** Service worker trying to import files that use `window`

**Status:** ✅ FIXED - Removed importScripts from background.js

**Verify Fix:**
1. Reload extension
2. Check background.js console - no errors

### Issue: Popup blocked/not clickable

**Cause:** Overlay blocking interaction

**Status:** ✅ FIXED - Changed to non-blocking banner

**Verify Fix:**
1. Open popup
2. Should be able to click tabs and buttons
3. Welcome banner should have X button to close

### Issue: Widget not appearing

**Cause:** Content script not initializing

**Check:**
1. Gmail console: `"🔧 CRMSYNC widget initialized"` message?
2. Extension permissions include Gmail URL?
3. Content script matches in manifest?

**Quick Fix:**
```javascript
// In Gmail console:
window.location.reload(); // Refresh page
```

### Issue: Database connection failed

**Cause:** PostgreSQL not running or wrong credentials

**Check:**
```bash
# Test connection
psql -U postgres -d crmsync

# Check PostgreSQL status
# macOS:
brew services list

# Linux:
sudo systemctl status postgresql

# Windows:
# Check Services app for PostgreSQL
```

**Fix:**
1. Start PostgreSQL
2. Verify database exists: `psql -U postgres -l`
3. Check .env credentials match database

### Issue: CORS error when extension calls backend

**Cause:** Extension ID not in backend ALLOWED_ORIGINS

**Fix:**
1. Get Extension ID from chrome://extensions/
2. Add to `crmsync-backend/.env`:
   ```
   ALLOWED_ORIGINS=http://localhost:3000,chrome-extension://YOUR_ID_HERE
   ```
3. Restart backend

---

## 📝 Verification Checklist

Before reporting issues, verify:

- [ ] Extension loads without errors in chrome://extensions/
- [ ] Popup opens and is clickable
- [ ] Welcome banner shows for first-time users
- [ ] Can choose Guest Mode or Sign In
- [ ] Guest mode works (contacts save)
- [ ] Widget appears on Gmail (check console)
- [ ] Backend running (if testing sync)
- [ ] Extension ID in backend .env (if testing sync)
- [ ] No console errors in popup
- [ ] No console errors in Gmail page
- [ ] No errors in background service worker

---

## 🎯 Success Criteria

### Minimum (Guest Mode):
- ✅ Extension loads
- ✅ Popup opens
- ✅ Can click buttons
- ✅ Contacts save locally
- ✅ CSV export works

### Full (With Backend):
- ✅ All above +
- ✅ Can register account
- ✅ Can login
- ✅ Auth banner shows
- ✅ Sync works
- ✅ Data persists across devices

---

## 🚀 Ready to Use!

If all checks pass, your extension is ready!

**Next:** Go to Gmail and start tracking contacts!

**Need Help?** 
- Check browser console (F12)
- Check background service worker console
- See [SETUP_GUIDE.md](Saas%20Tool/SETUP_GUIDE.md)

