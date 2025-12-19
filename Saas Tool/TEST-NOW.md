# ⚡ Quick Test Guide (10 Minutes)

## 🔄 **STEP 0: Reload Extension First!**

1. Open Chrome
2. Go to `chrome://extensions`
3. Find **CRMSYNC**
4. Click the **reload** icon 🔄
5. ✅ Extension reloaded with fixes

---

## ✅ **Test 1: Sign In (2 min)**

### **Steps:**
1. Click CRMSYNC extension icon
2. Click **"Sign In"** button
3. You'll be redirected to `www.crm-sync.net`
4. Log in with your account
5. Watch the redirect back to extension

### **Expected Result:**
✅ Popup shows your email  
✅ Shows your tier (Free/Pro/Enterprise)  
✅ No errors in console

### **If It Fails:**
- Press F12 to open console
- Look for red errors
- Copy and paste them
- Tell me what happened

---

## ✅ **Test 2: Add Contact (3 min)**

### **Steps:**
1. Open Gmail (`mail.google.com`)
2. Open any email with a sender
3. Look for sidebar on the right →
4. Sidebar should show:
   - Contact name
   - Email address
   - "Add Contact" button
5. Click **"Add Contact"**
6. Click **"Save Contact"**

### **Expected Result:**
✅ Sidebar shows "Contact saved!"  
✅ Contact count increases (e.g., 1/50)  
✅ Contact appears in popup

### **If It Fails:**
- Check if sidebar appears at all
- Check console for errors (F12)
- Try refreshing Gmail

---

## ✅ **Test 3: View Contacts (1 min)**

### **Steps:**
1. Click extension icon
2. Go to **"Contacts"** tab
3. Should see contact(s) you added

### **Expected Result:**
✅ Contact list shows all added contacts  
✅ Each contact shows name, email, company  
✅ Count shows correctly (e.g., "3/50")

---

## ✅ **Test 4: Limit Warning (2 min)**

**Only if you're on Free tier (50 contacts):**

### **Steps:**
1. Add contacts until you reach **40/50**
2. Open sidebar in Gmail
3. Look for yellow/orange warning banner

### **Expected Result:**
✅ At 40/50: Yellow banner "⚠️ Approaching limit"  
✅ At 48/50: Red banner "🚨 Almost at limit"  
✅ At 50/50: Blocking panel appears

### **If You Don't Want to Add 40 Contacts:**
- We can test this later
- Or I can temporarily lower the limit for testing
- Not critical right now

---

## ✅ **Test 5: CSV Export (1 min)**

### **Steps:**
1. Open popup
2. Go to **"Contacts"** tab
3. Click **"Export CSV"**
4. File should download

### **Expected Result:**
✅ CSV file downloads  
✅ Opens in Excel/Google Sheets  
✅ Contains all your contacts  
✅ Columns: Name, Email, Company, Date

---

## ✅ **Test 6: Sign Out & Back In (1 min)**

### **Steps:**
1. Open popup
2. Go to **"Settings"** tab
3. Click **"Sign Out"**
4. Sign back in

### **Expected Result:**
✅ Signs out successfully  
✅ Can sign back in  
✅ Contacts still there after signing back in

---

## 🐛 **What To Look For:**

### **Green Flags (Good!):**
✅ No red errors in console  
✅ Features work smoothly  
✅ Data persists after reload  
✅ Sidebar appears in Gmail  
✅ Counts are accurate

### **Red Flags (Tell Me!):**
❌ Console shows errors  
❌ "Failed to fetch" messages  
❌ CORS errors  
❌ Contacts don't save  
❌ Sidebar doesn't appear  
❌ Login doesn't work

---

## 📝 **Bug Report Template:**

If something breaks, tell me:

```
❌ BUG: [What went wrong]

WHAT I DID:
1. Step 1
2. Step 2
3. Error happened

WHAT I EXPECTED:
Should do X

WHAT ACTUALLY HAPPENED:
Did Y instead

CONSOLE ERRORS:
[Paste any red errors from F12 console]

SCREENSHOT: (optional)
```

---

## 🎯 **Quick Checklist:**

- [ ] Reloaded extension
- [ ] Signed in successfully
- [ ] Added a contact
- [ ] Contact shows in popup
- [ ] CSV export works
- [ ] No console errors
- [ ] Sidebar appears in Gmail

**If all checked ✅ → Everything works!**

---

## 💡 **Pro Testing Tips:**

1. **Keep Console Open:**
   - Press F12
   - Go to "Console" tab
   - Watch for errors as you test

2. **Test in Incognito:**
   - Fresh state
   - No cache issues
   - Enable extension in incognito first

3. **Try Different Emails:**
   - Open 3-4 different emails
   - Check sidebar updates each time
   - Make sure no duplicates added

4. **Check Network Tab:**
   - F12 → Network tab
   - Filter: "fetch/XHR"
   - Watch API calls succeed (green)
   - Look for failures (red)

---

## 🚀 **What's Working vs Not:**

After testing, let me know:

### **✅ WORKING:**
- (List what works)

### **❌ NOT WORKING:**
- (List what fails)

### **❓ UNSURE:**
- (List anything weird/confusing)

---

## ⏱️ **Time Estimate:**

- Basic test (1-3): **5 minutes**
- Full test (all 6): **10 minutes**
- Deep test with console: **15 minutes**

---

**Ready? Start with Step 0 (reload extension) and go from there!** 🎯

Let me know the results! 🚀
