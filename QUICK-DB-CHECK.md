# 🔍 Quick Database Check Commands

Use these commands in **Render Dashboard → Backend Service → Shell**

---

## ✅ Check Current User Tier

```bash
psql $DATABASE_URL -c "SELECT email, subscription_tier, subscription_status, contact_limit, stripe_customer_id FROM users WHERE email = '2w@crm-sync.net';"
```

---

## 📊 See All Recent Users

```bash
psql $DATABASE_URL -c "SELECT email, subscription_tier, subscription_status, created_at FROM users ORDER BY created_at DESC LIMIT 10;"
```

---

## 🔧 Manually Set to PRO (For Testing)

```bash
psql $DATABASE_URL -c "UPDATE users SET subscription_tier = 'pro', subscription_status = 'active', contact_limit = -1 WHERE email = '2w@crm-sync.net'; SELECT email, subscription_tier FROM users WHERE email = '2w@crm-sync.net';"
```

---

## 🔄 Reset to FREE (For Testing)

```bash
psql $DATABASE_URL -c "UPDATE users SET subscription_tier = 'free', subscription_status = 'active', contact_limit = 50 WHERE email = '2w@crm-sync.net'; SELECT email, subscription_tier FROM users WHERE email = '2w@crm-sync.net';"
```

---

## 📋 Check Stripe Connection

```bash
psql $DATABASE_URL -c "SELECT email, subscription_tier, stripe_customer_id, stripe_subscription_id FROM users WHERE email = '2w@crm-sync.net';"
```

Should show:
- `stripe_customer_id`: `cus_xxxxx` (if payment was made)
- `stripe_subscription_id`: `sub_xxxxx` (if subscription created)

---

## 🔍 Check All Test Accounts

```bash
psql $DATABASE_URL -c "SELECT email, subscription_tier, subscription_status, created_at FROM users WHERE email LIKE '%crm-sync.net' OR email LIKE '%test%' ORDER BY created_at DESC;"
```

---

## 🗑️ Delete Test User (Careful!)

```bash
psql $DATABASE_URL -c "DELETE FROM users WHERE email = '2w@crm-sync.net';"
```

⚠️ **Warning:** This permanently deletes the user!

---

## 📊 Count Users by Tier

```bash
psql $DATABASE_URL -c "SELECT subscription_tier, COUNT(*) as count FROM users GROUP BY subscription_tier;"
```

---

## 🎯 Quick Copy-Paste (Most Common)

### **Check User:**
```bash
psql $DATABASE_URL -c "SELECT email, subscription_tier, subscription_status FROM users WHERE email = '2w@crm-sync.net';"
```

### **Set to PRO:**
```bash
psql $DATABASE_URL -c "UPDATE users SET subscription_tier = 'pro', subscription_status = 'active', contact_limit = -1 WHERE email = '2w@crm-sync.net';"
```

### **Verify Update:**
```bash
psql $DATABASE_URL -c "SELECT email, subscription_tier, contact_limit FROM users WHERE email = '2w@crm-sync.net';"
```

---

**Pro Tip:** You can chain multiple commands with `;` in one line! 🚀
