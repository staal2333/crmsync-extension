# 🎯 Quick Start: Test New User Flow

## ⏱️ **First: Wait for Deployment**
1. Check Vercel dashboard for commit `b363592`
2. Status should show: **Ready** ✅
3. ETA: 1-2 minutes from last push

---

## 🚀 **5-Minute Speed Test**

### **Step 1: Open Incognito Window** (Ctrl + Shift + N)

### **Step 2: Visit & Register**
```
1. Go to: https://crm-sync.net
2. Click "Get Started" or go to: https://crm-sync.net/#/register
3. Fill in: Name, Email, Password
4. Click "Create Account"
```

**Expected:** ✅ Account created, redirected, token in localStorage

### **Step 3: Connect CRM (or Skip)**
```
1. Should auto-navigate to: https://crm-sync.net/#/connect-crm
2. Choose: "Connect HubSpot" OR "Connect Salesforce" OR "Skip"
3. Click "Continue" or "Skip"
```

**Expected:** ✅ Page loads, buttons work, can proceed

### **Step 4: Set Exclusions**
```
1. Should navigate to: https://crm-sync.net/#/exclusions
2. Fill in some test data:
   - Exclude Name: Test
   - Domains: mycompany.com, internal.com
   - Check the toggles
3. Click "Save & Continue"
```

**Expected:** ✅ Saves successfully, redirects to install page

### **Step 5: Install Extension**
```
1. Should navigate to: https://crm-sync.net/#/install
2. Click "Install Extension" (will show Web Store or placeholder)
3. Click "Continue"
```

**Expected:** ✅ Page loads, button works

### **Step 6: Done!**
```
1. Should navigate to: https://crm-sync.net/#/done
2. See completion message
```

**Expected:** ✅ Success message displayed

---

## 📋 **Quick Checklist:**

```
[ ] Website homepage loads
[ ] Can register new account
[ ] Token saved (F12 → Application → Local Storage)
[ ] Connect CRM page loads
[ ] Exclusions page loads
[ ] Exclusions form saves
[ ] Install page loads
[ ] Done page loads
[ ] Zero console errors (F12 → Console)
```

---

## 🐛 **If Something Breaks:**

1. **Open Console** (F12)
2. **Take screenshot** of any red errors
3. **Note which step** it broke at
4. **Share the error message**

---

## 💡 **Tips:**

- **Hard refresh** if page looks broken: `Ctrl + Shift + R`
- **Check console** at each step: `F12`
- **Use test email** like: `yourname+test@gmail.com`
- **Try different path** if stuck:
  ```
  https://crm-sync.net/#/connect-crm
  https://crm-sync.net/#/exclusions
  https://crm-sync.net/#/install
  https://crm-sync.net/#/done
  ```

---

## 🎯 **Success = All Green Checkmarks!**

Then we move on to testing the Chrome extension! 🚀

---

**Full test guide:** See `NEW-USER-TEST-GUIDE.md`
