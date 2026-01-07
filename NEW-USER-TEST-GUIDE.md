# 🧪 Complete New User Onboarding Test

## 🎯 **Goal:**
Test the entire flow as if you're a brand new user discovering CRMSYNC for the first time.

---

## ⏱️ **Wait for Deployment First!**

1. **Check Vercel Dashboard:**
   - Look for commit `b363592`
   - Wait for "Ready" status (~1-2 minutes)

2. **Or check GitHub:**
   - Latest commit should be: `Fix: Remove react-router-dom usage from onboarding pages, use hash navigation`

---

## 🚀 **Testing Steps:**

### **Step 0: Prepare Test Environment** 🧹

1. **Open Incognito/Private Window:**
   ```
   Chrome: Ctrl + Shift + N
   ```

2. **Optional: Use a test email:**
   ```
   Use a different email than your main one
   Example: youremail+test@gmail.com
   ```

---

### **Step 1: Visit Website** 🌐

1. **Go to:** https://crm-sync.net

2. **Expected:**
   - ✅ Homepage loads
   - ✅ Hero section visible
   - ✅ "Get Started" button visible
   - ✅ No console errors (except maybe extension detection)

3. **Check Console:**
   - Press `F12`
   - Should see NO red errors (403 is OK if not logged in)

---

### **Step 2: Register New Account** ✍️

1. **Click:** "Get Started" or navigate to `#/register`

2. **Fill in:**
   ```
   Name: Test User
   Email: your+test@gmail.com
   Password: TestPassword123!
   ```

3. **Click:** "Create Account"

4. **Expected:**
   - ✅ Account created successfully
   - ✅ Redirected to somewhere (home, dashboard, or onboarding)
   - ✅ Token saved in localStorage

5. **Check localStorage:**
   - Press `F12` → Application → Local Storage → https://crm-sync.net
   - Look for `token` key

---

### **Step 3: Connect CRM** 🔗

1. **Navigate to:** https://crm-sync.net/#/connect-crm

2. **Expected:**
   - ✅ Page loads with HubSpot and Salesforce options
   - ✅ "Connect HubSpot" button
   - ✅ "Connect Salesforce" button
   - ✅ "Skip for now" button

3. **Choose one of:**

   **Option A: Connect HubSpot**
   - Click "Connect HubSpot"
   - Should redirect to HubSpot OAuth
   - Sign in with HubSpot account
   - Authorize the app
   - Should redirect back to CRMSYNC

   **Option B: Connect Salesforce**
   - Click "Connect Salesforce"
   - Should redirect to Salesforce OAuth
   - Sign in with Salesforce account
   - Authorize the app
   - Should redirect back to CRMSYNC

   **Option C: Skip for now**
   - Click "Skip"
   - Should go to next step

4. **Expected after connecting:**
   - ✅ Success message
   - ✅ "Continue" button appears
   - ✅ Can proceed to next step

---

### **Step 4: Set Up Exclusions** 🚫

1. **Navigate to:** https://crm-sync.net/#/exclusions

2. **Expected:**
   - ✅ Page loads with exclusion form
   - ✅ Form fields for:
     - Exclude specific text (name, email, phone, company)
     - Exclude domains (e.g., mycompany.com)
     - Exclude specific emails
     - Toggle for "Ignore signature matches"
     - Toggle for "Ignore internal threads"

3. **Fill in test data:**
   ```
   Exclude Name: Test User
   Exclude Email: noreply@
   Exclude Company: Test Company
   
   Domains to exclude:
   - mycompany.com
   - internal.com
   
   Emails to exclude:
   - spam@example.com
   - test@test.com
   
   ✓ Ignore signature matches
   ✓ Ignore internal threads
   ```

4. **Click:** "Save & Continue"

5. **Expected:**
   - ✅ Success message ("Exclusions saved!")
   - ✅ Redirects to `/install`
   - ✅ No errors in console

6. **Verify saved data:**
   - Go back to https://crm-sync.net/#/exclusions
   - Should see your saved exclusions pre-filled

---

### **Step 5: Install Chrome Extension** 📥

1. **Should be on:** https://crm-sync.net/#/install

2. **Expected:**
   - ✅ Page loads with install instructions
   - ✅ "Install Extension" button
   - ✅ Chrome Web Store link
   - ✅ Instructions/screenshots

3. **Click:** "Install Extension"
   - Should open Chrome Web Store in new tab
   - (Or shows placeholder if not published yet)

4. **For testing (if not published yet):**
   - Load unpacked extension from `Saas Tool` folder
   - Chrome → Extensions → Developer Mode → Load Unpacked
   - Select `Saas Tool` folder

5. **Click:** "Continue" (on website)

6. **Expected:**
   - ✅ Redirects to `/done`

---

### **Step 6: Completion Page** 🎉

1. **Should be on:** https://crm-sync.net/#/done

2. **Expected:**
   - ✅ Success/completion message
   - ✅ Next steps displayed
   - ✅ Link to open Gmail
   - ✅ Link to extension popup

3. **Take a moment to celebrate!** 🎊

---

### **Step 7: Test Extension** ⚡

1. **Open Gmail:**
   ```
   https://mail.google.com
   ```

2. **Open an email thread**

3. **Expected:**
   - ✅ Sidebar appears on right side
   - ✅ Shows "CRM Sync" header
   - ✅ Detects contact from email
   - ✅ Shows contact info
   - ✅ Exclusions are applied (emails matching exclusions NOT detected)

4. **Check extension popup:**
   - Click CRMSYNC extension icon in toolbar
   - ✅ Popup opens
   - ✅ Shows signed-in status
   - ✅ Shows "Contacts" tab
   - ✅ Shows detected contacts

5. **Test exclusions:**
   - Find an email from a domain you excluded (e.g., mycompany.com)
   - ✅ Should NOT be detected as a contact
   - ✅ Should be filtered out by exclusion rules

---

## 📊 **Complete Checklist:**

### **Website Flow:**
- [ ] Homepage loads correctly
- [ ] Can register new account
- [ ] Token saved in localStorage
- [ ] Connect CRM page loads
- [ ] Can connect HubSpot OR Salesforce (or skip)
- [ ] Exclusions page loads
- [ ] Can fill in exclusion form
- [ ] Exclusions save successfully
- [ ] Exclusions persist (reload page, still there)
- [ ] Install page loads
- [ ] Done page loads
- [ ] No console errors throughout

### **Extension Flow:**
- [ ] Extension loads in Chrome
- [ ] Shows sign-in prompt (if not authenticated)
- [ ] Can sign in from extension
- [ ] Fetches exclusions from backend
- [ ] Applies exclusions to contact detection
- [ ] Sidebar shows in Gmail
- [ ] Popup shows contacts
- [ ] Can push contacts to CRM
- [ ] Exclusions work correctly (emails filtered)

### **Backend Integration:**
- [ ] Registration API works
- [ ] Login API works
- [ ] Exclusions GET/POST work
- [ ] CRM OAuth works (HubSpot/Salesforce)
- [ ] Extension authenticates with backend
- [ ] Contacts sync to backend

---

## 🐛 **If Something Breaks:**

### **Website Issues:**

1. **"Uncaught Error" in console:**
   - Check which file/line
   - Look for missing imports or undefined functions
   - Take screenshot and share

2. **403/404 errors:**
   - Check Network tab (F12 → Network)
   - See which API endpoint is failing
   - Share the URL and response

3. **Page doesn't load:**
   - Check URL is correct (has `#/` in it)
   - Try hard refresh (Ctrl + Shift + R)
   - Clear cache and try again

### **Extension Issues:**

1. **Sidebar doesn't appear:**
   - Check extension is enabled
   - Check Gmail is fully loaded
   - Refresh Gmail page
   - Check console for errors

2. **Exclusions not working:**
   - Open background.js console: Chrome Extensions → CRMSYNC → Service Worker → Console
   - Look for exclusions fetch logs
   - Check if exclusions are stored in chrome.storage

3. **Can't sign in:**
   - Check backend API is live: https://crmsync-api.onrender.com/health
   - Check token is valid
   - Try signing in on website first

---

## 📸 **What to Capture:**

For each step, note:
1. ✅ = Worked perfectly
2. ⚠️ = Worked but with warnings
3. ❌ = Failed

Take screenshots of:
- Any errors
- Successful completions
- Extension sidebar in Gmail
- Extension popup

---

## 🎯 **Success Criteria:**

### **Minimum Viable:**
- ✅ Can register account
- ✅ Can save exclusions
- ✅ Extension loads
- ✅ Contacts detected in Gmail

### **Full Success:**
- ✅ All website pages load
- ✅ CRM connection works
- ✅ Exclusions save and sync to extension
- ✅ Extension detects contacts
- ✅ Exclusions filter contacts correctly
- ✅ Can push contacts to CRM
- ✅ Zero console errors

---

## ⏭️ **After Testing:**

**Share your results:**
1. Overall experience (smooth? confusing?)
2. Any errors encountered
3. Screenshots of issues
4. Suggestions for improvement

**Then we'll:**
1. Fix any bugs found
2. Polish the flow
3. Add any missing pieces
4. Make it production-ready! 🚀

---

**Good luck with the test! Let me know how it goes!** 🎯
