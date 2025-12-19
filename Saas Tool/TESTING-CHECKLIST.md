# 🧪 CRMSYNC Testing Checklist

## ✅ **How to Use This Checklist:**
1. Go through each section systematically
2. Check off items as you test them
3. Note any bugs you find
4. We'll fix them together!

---

## 🔐 **Phase 1: Authentication Flow**

### **1.1 Guest Mode**
- [ ] Click "Continue as Guest" in popup
- [ ] Verify you can see contacts
- [ ] Verify "50 contact limit" shows
- [ ] Verify CSV export works
- [ ] Verify all sidebar features work
- [ ] Check if "Sign In" button is always visible

**Expected Behavior:**
- ✅ All features work
- ✅ Data saved locally
- ✅ Limited to 50 contacts
- ✅ "Upgrade to save online" message shows

---

### **1.2 Sign In Flow**
- [ ] Click "Sign In" in popup
- [ ] Verify redirects to www.crm-sync.net
- [ ] Notice "🔌 Logging in from CRMSYNC Extension" indicator
- [ ] Enter valid email/password
- [ ] Click "Sign in"
- [ ] Verify redirects back to extension
- [ ] Verify auth-callback page shows briefly
- [ ] Verify popup now shows user email
- [ ] Verify tier shows (Free/Pro/Enterprise)
- [ ] Check if contacts sync to backend

**Expected Behavior:**
- ✅ Smooth redirect flow
- ✅ No errors in console
- ✅ User logged in successfully
- ✅ Popup shows user info

**Common Issues to Check:**
- ❌ Stuck in auth-callback loop
- ❌ "chrome-extension://invalid" error
- ❌ CORS errors
- ❌ Token not saved

---

### **1.3 Sign Up Flow**
- [ ] Click "Sign In" → "Sign up here"
- [ ] Enter email, name, password
- [ ] Click "Sign up"
- [ ] Verify account created
- [ ] Verify redirects back to extension
- [ ] Verify logged in as Free tier
- [ ] Check if welcome email sent (if implemented)

**Expected Behavior:**
- ✅ Account created
- ✅ Logged in immediately
- ✅ Free tier (50 contacts)

---

### **1.4 Sign Out Flow**
- [ ] While logged in, click settings icon
- [ ] Click "Sign Out"
- [ ] Verify returns to guest mode
- [ ] Verify popup shows "Sign In" button
- [ ] Verify contacts cleared (or kept locally?)
- [ ] Try signing in again

**Expected Behavior:**
- ✅ Clean sign out
- ✅ Token removed
- ✅ Can sign back in

---

## 📧 **Phase 2: Contact Detection & Extraction**

### **2.1 Gmail Email Scanning**
- [ ] Open Gmail (mail.google.com)
- [ ] Open an email with sender info
- [ ] Verify sidebar appears on right side
- [ ] Verify sidebar shows correct sender info:
  - Name
  - Email
  - Subject line
- [ ] Open different email
- [ ] Verify sidebar updates with new contact
- [ ] Navigate between emails quickly
- [ ] Verify no lag or freezing

**Expected Behavior:**
- ✅ Sidebar shows instantly
- ✅ Contact info accurate
- ✅ Updates when switching emails
- ✅ No performance issues

**Test Multiple Email Types:**
- [ ] Regular email (FirstName LastName <email@domain.com>)
- [ ] Email with no name (just email@domain.com)
- [ ] Email with special characters in name
- [ ] Email with company domain
- [ ] Email from same sender (should not duplicate)
- [ ] Email chain with multiple people

---

### **2.2 Contact Cards**
- [ ] Verify contact card shows:
  - [ ] Profile icon (or initials)
  - [ ] Name
  - [ ] Email
  - [ ] Company (if detected)
  - [ ] Subject line
  - [ ] Date/time
- [ ] Click "Add Contact" button
- [ ] Verify approval panel appears
- [ ] Verify company field editable
- [ ] Verify tags/notes section (if exists)

**Expected Behavior:**
- ✅ Clean, readable card
- ✅ All data present
- ✅ Buttons work

---

### **2.3 Adding Contacts**

#### **First Contact:**
- [ ] Open email
- [ ] Click "Add Contact"
- [ ] Edit company name (optional)
- [ ] Click "Save Contact"
- [ ] Verify contact added
- [ ] Verify count shows "1/50" (or tier limit)
- [ ] Check popup - verify contact shows there too

#### **Multiple Contacts:**
- [ ] Add 5 more contacts from different emails
- [ ] Verify each saves correctly
- [ ] Verify count updates (6/50)
- [ ] Verify no duplicates

#### **Duplicate Handling:**
- [ ] Add contact from email
- [ ] Open another email from SAME person
- [ ] Verify button says "View Contact" not "Add Contact"
- [ ] Click "View Contact"
- [ ] Verify shows existing contact info

**Expected Behavior:**
- ✅ Duplicates prevented
- ✅ Count accurate
- ✅ No errors

---

### **2.4 Edge Cases**

#### **Unusual Email Addresses:**
- [ ] Test: firstname.lastname@domain.com
- [ ] Test: firstname+tag@gmail.com
- [ ] Test: first_last123@domain.co.uk
- [ ] Test: email with numbers: user123@test.com
- [ ] Test: very long email address

#### **Unusual Names:**
- [ ] Test: Name with accents (José García)
- [ ] Test: Name with emoji (John 😊 Doe)
- [ ] Test: Very long name (50+ characters)
- [ ] Test: Single name (Madonna)
- [ ] Test: Name with titles (Dr. John Smith, PhD)

#### **Missing Information:**
- [ ] Email with no sender name (just email)
- [ ] Email with no subject
- [ ] Email with no company info

**Expected Behavior:**
- ✅ Handles gracefully
- ✅ No crashes
- ✅ Shows placeholder for missing data

---

## 📊 **Phase 3: Contact Limits & Upgrade Prompts**

### **3.1 Free Tier Limits (50 contacts)**

#### **At 0-39 contacts (0-79%):**
- [ ] Add contacts
- [ ] Verify NO warning banner in sidebar
- [ ] Verify can add freely
- [ ] Verify count shows correctly

#### **At 40-47 contacts (80-94%):**
- [ ] Add contact to reach 40/50
- [ ] **VERIFY: Warning banner appears in sidebar**
- [ ] Banner should say:
  - "⚠️ You're approaching your Free tier limit (40/50)"
  - "Upgrade to Pro" button
  - "Dismiss" button
- [ ] Banner color: Orange/yellow
- [ ] Click "Dismiss" → banner slides up
- [ ] Reload Gmail → banner reappears (if still at 80%+)

#### **At 48-49 contacts (95-99%):**
- [ ] Add contact to reach 48/50
- [ ] **VERIFY: Critical banner appears**
- [ ] Banner should say:
  - "🚨 Almost at limit! (48/50)"
  - "Upgrade now" button
- [ ] Banner color: Red

#### **At 50 contacts (100%):**
- [ ] Add 50th contact
- [ ] Try to add 51st contact
- [ ] **VERIFY: Blocking panel appears**
- [ ] Panel should say:
  - "You've reached your Free tier limit"
  - "Upgrade to Pro for 1,000 contacts"
  - "Delete old contacts to free up space"
- [ ] **VERIFY: Cannot add contact without upgrading**
- [ ] Click "Not Now" → panel closes, contact NOT added
- [ ] Click "Upgrade" → redirects to pricing page

**Expected Behavior:**
- ✅ Progressive warnings (subtle → critical → blocking)
- ✅ User-friendly messages
- ✅ Clear call-to-action
- ✅ Cannot exceed limit

---

### **3.2 Pro Tier Limits (1000 contacts)**

#### **If you have Pro account:**
- [ ] Sign in with Pro account
- [ ] Add contacts
- [ ] Verify limit shows "X/1000"
- [ ] Test warning at 800/1000 (80%)
- [ ] Test critical at 950/1000 (95%)
- [ ] Test blocking at 1000/1000

---

### **3.3 Enterprise Tier (Unlimited)**

#### **If you have Enterprise account:**
- [ ] Sign in with Enterprise account
- [ ] Verify shows "Unlimited" or "∞"
- [ ] Add many contacts
- [ ] Verify no limit warnings

---

## 📁 **Phase 4: CSV Export**

### **4.1 Basic Export**
- [ ] Add 10+ contacts
- [ ] Open popup
- [ ] Click settings/menu icon
- [ ] Click "Export Contacts"
- [ ] Verify CSV file downloads
- [ ] Open CSV file
- [ ] Verify columns:
  - [ ] Name
  - [ ] Email
  - [ ] Company
  - [ ] Date Added
  - [ ] Tags (if exists)
- [ ] Verify all contacts present
- [ ] Verify data is correct

**Expected Behavior:**
- ✅ CSV downloads immediately
- ✅ Filename: "crmsync-contacts-YYYY-MM-DD.csv"
- ✅ Opens in Excel/Google Sheets
- ✅ All data accurate

---

### **4.2 Export Limits**

#### **Guest/Free (50 contacts max):**
- [ ] Add 50 contacts
- [ ] Export
- [ ] Verify all 50 in CSV

#### **Export with 0 contacts:**
- [ ] Delete all contacts
- [ ] Try to export
- [ ] Verify: Shows message "No contacts to export"

---

### **4.3 CSV Data Quality**
- [ ] Check for proper escaping:
  - Names with commas: "Smith, John"
  - Emails with quotes
  - Special characters
- [ ] Verify dates formatted correctly
- [ ] Verify no missing data (empty cells OK for optional fields)

---

## 🎨 **Phase 5: UI/UX Testing**

### **5.1 Popup Window**

#### **Layout:**
- [ ] Popup opens at correct size
- [ ] All elements visible (no overflow)
- [ ] Scrolling works (if content is long)
- [ ] Buttons aligned properly
- [ ] Text readable

#### **Header Section:**
- [ ] Logo shows correctly
- [ ] User email shows (when logged in)
- [ ] Tier badge shows (Free/Pro/Enterprise)
- [ ] Settings icon clickable

#### **Contact List:**
- [ ] Contacts show in order (newest first?)
- [ ] Contact cards look good
- [ ] Scroll works smoothly
- [ ] Search box works (if exists)
- [ ] Filter options work (if exists)

#### **Footer:**
- [ ] "Add Contact" button (if shown)
- [ ] Contact count visible
- [ ] Upgrade button (if shown)

---

### **5.2 Sidebar Widget**

#### **Positioning:**
- [ ] Appears on right side of Gmail
- [ ] Doesn't overlap Gmail content
- [ ] Stays in position when scrolling
- [ ] Width appropriate (not too wide/narrow)

#### **Design:**
- [ ] Clean, modern look
- [ ] Matches Gmail aesthetic
- [ ] Colors contrast well
- [ ] Icons clear and visible

#### **Responsive:**
- [ ] Works on small screens (1366x768)
- [ ] Works on large screens (1920x1080+)
- [ ] Doesn't break layout

---

### **5.3 Settings Page**

- [ ] Click settings icon in popup
- [ ] Verify settings page opens/shows
- [ ] Check available settings:
  - [ ] Theme (Light/Dark)
  - [ ] Export contacts
  - [ ] Sign out
  - [ ] About/Version
- [ ] Test theme toggle
- [ ] Verify dark mode works
- [ ] Verify light mode works
- [ ] Changes save and persist

---

### **5.4 Animations & Transitions**

- [ ] Sidebar slides in smoothly
- [ ] Buttons have hover effects
- [ ] Loading states show spinners
- [ ] Success messages appear/disappear
- [ ] Limit banner slides in/out smoothly
- [ ] Modals fade in/out

**Expected Behavior:**
- ✅ Smooth, professional animations
- ✅ No janky transitions
- ✅ Fast but not instant

---

## ⚡ **Phase 6: Performance Testing**

### **6.1 Speed Tests**

#### **Extension Load Time:**
- [ ] Reload extension
- [ ] Open Gmail
- [ ] Time how long until sidebar appears
- [ ] **Target: < 2 seconds**

#### **Contact Addition:**
- [ ] Click "Add Contact"
- [ ] Click "Save"
- [ ] Time until saved
- [ ] **Target: < 1 second**

#### **Popup Load:**
- [ ] Click extension icon
- [ ] Time until popup fully loaded
- [ ] **Target: < 1 second**

#### **Export Speed:**
- [ ] Export 50 contacts
- [ ] Time until CSV downloads
- [ ] **Target: < 2 seconds**

---

### **6.2 Resource Usage**

#### **Memory:**
- [ ] Open Chrome Task Manager (Shift+Esc)
- [ ] Find CRMSYNC extension
- [ ] Check memory usage
- [ ] **Target: < 100MB**
- [ ] Add 50 contacts
- [ ] Check memory again
- [ ] **Target: < 150MB**

#### **CPU:**
- [ ] Monitor CPU usage
- [ ] Should be near 0% when idle
- [ ] Brief spike when detecting contacts OK

---

### **6.3 Stress Testing**

#### **Rapid Email Switching:**
- [ ] Open Gmail
- [ ] Quickly navigate between 10 emails
- [ ] Verify sidebar updates each time
- [ ] Verify no lag or freezing
- [ ] Check console for errors

#### **Many Contacts:**
- [ ] Add 50 contacts (max for Free)
- [ ] Open popup
- [ ] Scroll through all contacts
- [ ] Verify smooth scrolling
- [ ] Search for contact (if exists)
- [ ] Verify fast results

---

## 🐛 **Phase 7: Error Handling**

### **7.1 Network Errors**

#### **Test Offline:**
- [ ] Disconnect internet
- [ ] Try to sign in
- [ ] Verify: Error message "No internet connection"
- [ ] Try to sync contacts
- [ ] Verify: Graceful error message
- [ ] Reconnect internet
- [ ] Verify: Auto-syncs when online

#### **Test API Down:**
- [ ] If API is down, try to:
  - [ ] Sign in → Show error
  - [ ] Sync contacts → Show error
  - [ ] Upgrade → Show error
- [ ] Verify: Extension still works in guest mode

---

### **7.2 Invalid Data**

- [ ] Try to add contact with invalid email
- [ ] Verify: Shows error or sanitizes
- [ ] Try to add contact with very long name (1000+ chars)
- [ ] Verify: Handles gracefully

---

### **7.3 Token Expiration**

- [ ] Sign in
- [ ] Wait for token to expire (or manually expire it)
- [ ] Try to sync contacts
- [ ] Verify: Shows "Session expired, please sign in again"
- [ ] Verify: Redirects to login

---

## 🔒 **Phase 8: Security & Privacy**

### **8.1 Data Storage**

- [ ] Add contacts
- [ ] Open Chrome DevTools
- [ ] Go to Application → Storage → Local Storage
- [ ] Find extension storage
- [ ] Verify:
  - [ ] Contacts stored locally
  - [ ] Token stored (encrypted?)
  - [ ] No sensitive data exposed

### **8.2 Permissions**

- [ ] Go to chrome://extensions
- [ ] Find CRMSYNC
- [ ] Click "Details"
- [ ] Review permissions:
  - [ ] Access to mail.google.com (required)
  - [ ] Storage (required)
  - [ ] Tabs (required for auth)
- [ ] Verify: No unnecessary permissions

---

## 🌐 **Phase 9: Browser Compatibility**

### **9.1 Chrome (Primary)**
- [ ] Test all features above
- [ ] Version: _____ (write down)
- [ ] OS: Windows/Mac/Linux
- [ ] Result: ✅ Works / ❌ Issues

### **9.2 Edge (Chromium)**
- [ ] Install extension in Edge
- [ ] Test key features:
  - [ ] Sign in
  - [ ] Add contacts
  - [ ] Sidebar appears
  - [ ] Export works
- [ ] Result: ✅ Works / ❌ Issues

### **9.3 Brave**
- [ ] Install in Brave
- [ ] Test with default shields
- [ ] Test with shields down
- [ ] Result: ✅ Works / ❌ Issues

---

## 📱 **Phase 10: Different Screen Sizes**

### **10.1 Small Laptop (1366x768)**
- [ ] Open Gmail at this resolution
- [ ] Verify sidebar fits
- [ ] Verify popup readable
- [ ] No horizontal scroll needed

### **10.2 Large Monitor (1920x1080+)**
- [ ] Verify sidebar doesn't look tiny
- [ ] Verify text readable
- [ ] Layout looks good

---

## 🎯 **Phase 11: User Flow Testing**

### **Scenario 1: New User (Guest Mode)**
1. [ ] Install extension
2. [ ] Open Gmail
3. [ ] See sidebar with info
4. [ ] Click "Continue as Guest"
5. [ ] Add 5 contacts
6. [ ] Export contacts
7. [ ] Experience smooth and easy?

### **Scenario 2: New User (Sign Up)**
1. [ ] Install extension
2. [ ] Click "Sign In"
3. [ ] Click "Sign up here"
4. [ ] Create account
5. [ ] Redirected back
6. [ ] Add 10 contacts
7. [ ] Contacts sync to account?

### **Scenario 3: Existing User**
1. [ ] Sign in with existing account
2. [ ] See previously added contacts
3. [ ] Add new contact
4. [ ] Export all contacts
5. [ ] Sign out
6. [ ] Sign back in
7. [ ] Contacts still there?

### **Scenario 4: Reaching Limit**
1. [ ] Free user adds 40 contacts
2. [ ] See warning banner (subtle)
3. [ ] Add 8 more (48/50)
4. [ ] See critical warning
5. [ ] Add 2 more (50/50)
6. [ ] Try to add 51st
7. [ ] See upgrade panel (blocking)
8. [ ] Click "Upgrade"
9. [ ] Redirected to pricing page?

---

## 🔍 **Phase 12: Console Error Check**

### **During Normal Use:**
- [ ] Open Console (F12)
- [ ] Use extension normally for 10 minutes
- [ ] Check for errors (red text)
- [ ] Check for warnings (yellow text)
- [ ] **Goal: Zero errors**

### **Common Errors to Look For:**
- ❌ CORS errors
- ❌ Failed to fetch
- ❌ undefined is not a function
- ❌ Cannot read property of null
- ❌ CSP violations
- ❌ 404 Not Found

---

## 📝 **Phase 13: Final Polish**

### **13.1 Remove Debug Code**
- [ ] Search for `console.log` in all files
- [ ] Remove or wrap in debug flag
- [ ] Search for `TODO` comments
- [ ] Resolve or document them

### **13.2 Typos & Text**
- [ ] Check all button text
- [ ] Check all error messages
- [ ] Check popup text
- [ ] Check sidebar text
- [ ] Fix any typos or grammar

### **13.3 Icons & Images**
- [ ] Extension icon (128x128) looks good
- [ ] Profile icons/avatars work
- [ ] No broken images
- [ ] Icons clear at all sizes

---

## ✅ **Final Checklist**

Before declaring "DONE", verify:

- [ ] ✅ All core features work perfectly
- [ ] ✅ No console errors during normal use
- [ ] ✅ Authentication flow smooth
- [ ] ✅ Contacts add/save/export correctly
- [ ] ✅ Limit warnings work as expected
- [ ] ✅ UI looks professional
- [ ] ✅ Performance is good (fast, not laggy)
- [ ] ✅ Tested on fresh Gmail account
- [ ] ✅ Tested by at least 1 other person
- [ ] ✅ All debug code removed
- [ ] ✅ No known bugs remaining

---

## 🚀 **Ready to Launch?**

Once all items are checked, you're ready to:
1. Submit to Chrome Web Store
2. Launch your website
3. Get your first users!

**Good luck! 🎉**

---

## 📊 **Bug Tracking Template**

As you test, note bugs here:

### **Bug #1:**
- **What:** [Description]
- **Steps to reproduce:** [1, 2, 3...]
- **Expected:** [What should happen]
- **Actual:** [What actually happens]
- **Priority:** High/Medium/Low
- **Status:** Found / Fixed / Verified

---

**Need Help?** Let me know which bugs you find and I'll help fix them! 🔧
