# 🔧 FIXES IN PROGRESS - Testing Issues

**Status:** Fixing all 5 issues now  
**Time:** 20-30 minutes total

---

## 🐛 **ISSUES TO FIX:**

### **1. CRM Connection - Add Pro Plan + Trial Context** ✅ FIXING NOW
**Problem:** Users can connect CRM but don't know it requires Pro plan
**Solution:** 
- Add Pro plan badge to CRM buttons
- Show "14-day free trial" messaging
- Explain benefits clearly
- Allow connection to start trial automatically

**Files to update:**
- `Crm-sync/pages/ConnectCRM.tsx`

---

### **2. Popup Auto-Refresh** ⏳ NEXT
**Problem:** After actions (sync, settings change), popup doesn't update
**Solution:**
- Add event listeners for storage changes
- Auto-reload data when backend responds
- Show loading states during updates
- Smooth transitions

**Files to update:**
- `Saas Tool/popup.js`
- `Saas Tool/sync.js`

---

### **3. HubSpot Auto-Sync** ⏳ PENDING
**Problem:** Extension doesn't pull contacts from HubSpot automatically
**Solution:**
- Add background sync every 15 minutes
- Pull new contacts from HubSpot API
- Merge with local contacts
- Show "Synced from HubSpot" badge

**Files to update:**
- `Saas Tool/background.js`
- `Saas Tool/sync.js`
- Add new `hubspot-sync.js`

---

### **4. Subscription Upgrade - No Refresh Needed** ⏳ PENDING
**Problem:** After buying Pro, user must refresh to see new tier
**Solution:**
- Listen for subscription webhook
- Update localStorage immediately
- Show success notification
- Auto-update UI tier display

**Files to update:**
- `Crm-sync/pages/Pricing.tsx`
- `Saas Tool/popup.js`
- Add subscription status polling

---

### **5. Login Glitch - Duplicate Header** ⏳ PENDING
**Problem:** Login page shows header twice
**Solution:**
- Find duplicate render
- Fix CSS z-index issues
- Ensure single header component

**Files to update:**
- `Saas Tool/login.html` or `popup.html`

---

## 📝 **FIXING NOW:**

Starting with Issue #1 - CRM Connection context...
