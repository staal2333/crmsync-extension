# 🧪 TESTING PROTOCOL - FIX AS WE GO

**Status:** Testing Phase Active  
**Approach:** Test → Find Issues → Fix → Repeat

---

## 📋 **TEST IN THIS ORDER:**

### **TEST 1: Website (crm-sync.net)** ⏳ IN PROGRESS
**What to check:**
- [ ] Homepage loads without errors
- [ ] Hero section shows new headline ("6+ Hours...")
- [ ] Founder story section appears
- [ ] Demo video placeholder shows
- [ ] All navigation links work
- [ ] "Sign In" and "Add to Chrome" buttons work

**How to test:**
1. Go to: https://crm-sync.net
2. Open browser console (F12)
3. Look for red errors
4. Click through all pages

**Report any issues here - I'll fix them immediately!**

---

### **TEST 2: Onboarding Flow** ⏳ NEXT
**What to test:**
1. Register new account
2. Connect CRM (HubSpot or Salesforce)
3. Set exclusions
4. Complete onboarding
5. Verify redirect to "Done" page

**Expected behavior:**
- No errors during signup
- CRM OAuth redirects back correctly
- Exclusions save successfully
- Final page shows success

---

### **TEST 3: Extension Auto-Login** ⏳ AFTER ONBOARDING
**What to test:**
1. Complete onboarding on website
2. Click extension icon
3. Check if auto-logged in
4. Verify exclusions show in Settings

**Expected behavior:**
- Popup opens with user logged in
- Shows "Welcome back, [name]"
- Settings has exclusions from onboarding

---

### **TEST 4: Gmail Detection** ⏳ AFTER LOGIN
**What to test:**
1. Open Gmail
2. Open an email from external sender
3. Check if extension detects contact
4. Try adding contact

**Expected behavior:**
- Extension icon shows badge/notification
- Contact info appears in popup
- Can add to CRM or save locally

---

### **TEST 5: CRM Sync** ⏳ AFTER DETECTION
**What to test:**
1. Detect a contact
2. Click "Sync to HubSpot" (or Salesforce)
3. Check if it appears in your CRM
4. Verify no duplicate created

**Expected behavior:**
- Success message appears
- Contact appears in CRM within 30 seconds
- No duplicate if contact already exists

---

### **TEST 6: Account Page** ⏳ ANYTIME
**What to test:**
1. Click "Account" in extension
2. Check if shows:
   - Your name, email
   - Subscription tier
   - Usage stats
   - Billing info (if paid)

**Expected behavior:**
- All info displays correctly
- "Upgrade" button works (if free)
- "Manage Billing" works (if paid)

---

### **TEST 7: Console Errors** ⏳ THROUGHOUT
**What to check:**
- Open DevTools (F12)
- Watch Console tab
- Look for red errors
- Note any warnings

**Report:**
- Screenshot any errors
- Copy error text
- Tell me what you were doing when it happened

---

## 🐛 **HOW TO REPORT ISSUES:**

When you find something broken, tell me:

1. **What you were doing:** "I clicked Sign In"
2. **What happened:** "Got 404 error"
3. **What should happen:** "Should go to login page"
4. **Console errors:** Copy/paste any red errors
5. **Screenshot (optional):** If UI looks wrong

**Example report:**
```
Issue: Registration fails

What I did: Filled out register form and clicked Submit
What happened: Page refreshed, no account created
Expected: Should create account and go to onboarding
Console errors: "POST /api/auth/register 500 Internal Server Error"
```

---

## 🔧 **I'LL FIX ISSUES BY:**

1. **Quick fixes:** Update code immediately
2. **Testing:** Verify fix works
3. **Commit:** Push to GitHub
4. **Deploy:** Wait 2 min for Vercel/Render
5. **Retest:** You try again

**Typical fix time:** 2-10 minutes per issue

---

## 📊 **TESTING PROGRESS:**

- [ ] Test 1: Website loads ⏳ **START HERE**
- [ ] Test 2: Onboarding flow
- [ ] Test 3: Extension auto-login
- [ ] Test 4: Gmail detection
- [ ] Test 5: CRM sync
- [ ] Test 6: Account page
- [ ] Test 7: Console clean

---

## 🚀 **LET'S START:**

**Right now, test:**
1. Go to: https://crm-sync.net
2. Open DevTools (F12)
3. Check if page loads correctly
4. Look for any errors in Console

**Tell me:**
- ✅ "Website loads fine, no errors"
- ❌ "I see error: [paste error]"
- ❓ "Something looks wrong: [describe]"

**I'm ready to fix anything you find! Let's do this!** 🔥
