# 🚀 CRM Integrations Setup Guide
## HubSpot & Salesforce Integration

**Status:** ✅ All Code Implemented  
**Next Step:** Configuration & Deployment

---

## 📋 **WHAT'S BEEN DONE**

✅ **Backend:**
- Database migrations for OAuth tokens and mappings
- HubSpot controller with OAuth and sync
- Salesforce controller with OAuth and sync
- Integration routes mounted
- Contacts API updated to include CRM status

✅ **Extension:**
- Integration manager class
- Integrations tab in popup
- CRM badges on contacts
- Sync buttons and UI

---

## 🎯 **WHAT YOU NEED TO DO NOW**

### **STEP 1: Run Database Migration** (5 minutes)

Connect to your Render PostgreSQL database and run:

```bash
# Connect to database (use PSQL command from Render)
psql postgresql://crmsync_user:xxx@xxx.render.com/crmsync

# Then run migration
\i migrations/add_crm_tables.sql

# Verify tables were created
\dt

# You should see:
# - crm_integrations
# - crm_contact_mappings
# - crm_sync_logs
```

---

### **STEP 2: Create HubSpot Developer Account** (10 minutes)

1. **Go to:** https://developers.hubspot.com/
2. **Sign up** for a free developer account
3. **Create an App:**
   - Click "Create App"
   - Name: "CRM-Sync"
   - Description: "Contact management extension"
   
4. **Configure OAuth:**
   - Go to "Auth" tab
   - Redirect URL: `https://crmsync-api.onrender.com/api/integrations/hubspot/callback`
   - Scopes needed:
     - `crm.objects.contacts.read`
     - `crm.objects.contacts.write`
   
5. **Save these values:**
   ```
   Client ID: xxxxx
   Client Secret: yyyyy
   ```

---

### **STEP 3: Create Salesforce Developer Account** (10 minutes)

1. **Go to:** https://developer.salesforce.com/
2. **Sign up** for Developer Edition (free)
3. **Create a Connected App:**
   - Setup → App Manager → New Connected App
   - Name: "CRM-Sync"
   - Contact Email: your email
   - Enable OAuth Settings: ✓
   - Callback URL: `https://crmsync-api.onrender.com/api/integrations/salesforce/callback`
   - Scopes:
     - `Access and manage your data (api)`
     - `Perform requests on your behalf (refresh_token, offline_access)`
   
4. **Save these values:**
   ```
   Consumer Key: xxxxx
   Consumer Secret: yyyyy
   ```

---

### **STEP 4: Add Environment Variables to Render** (5 minutes)

Go to your Render dashboard → crmsync-backend → Environment

**Add these variables:**

```bash
# HubSpot
HUBSPOT_CLIENT_ID=your_client_id_from_step_2
HUBSPOT_CLIENT_SECRET=your_client_secret_from_step_2
HUBSPOT_REDIRECT_URI=https://crmsync-api.onrender.com/api/integrations/hubspot/callback

# Salesforce
SALESFORCE_CLIENT_ID=your_consumer_key_from_step_3
SALESFORCE_CLIENT_SECRET=your_consumer_secret_from_step_3
SALESFORCE_REDIRECT_URI=https://crmsync-api.onrender.com/api/integrations/salesforce/callback
SALESFORCE_LOGIN_URL=https://login.salesforce.com
```

**Click "Save Changes"** - Render will auto-redeploy

---

### **STEP 5: Deploy Code** (2 minutes)

```bash
cd "C:\Users\sebas\Downloads\Saas Tool-20251202T124049Z-3-001"

# Stage all changes
git add .

# Commit
git commit -m "Add HubSpot and Salesforce CRM integrations"

# Push to GitHub (Render auto-deploys)
git push
```

Wait for Render to finish deploying (check dashboard).

---

### **STEP 6: Test Locally** (10 minutes)

1. **Load unpacked extension** in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `Saas Tool` folder
   
2. **Open extension popup**

3. **Go to "🔌 CRM" tab**

4. **Test HubSpot:**
   - Click "Connect HubSpot"
   - OAuth window should open
   - Authorize in HubSpot
   - Should see "✓ Connected"
   - Click "🔄 Sync All Contacts"
   - Check contacts for "✓ In HubSpot" badges
   
5. **Test Salesforce:**
   - Click "Connect Salesforce"
   - OAuth window should open
   - Authorize in Salesforce
   - Should see "✓ Connected"
   - Click "🔄 Sync All Contacts"
   - Check contacts for badges

---

## 🧪 **HOW TO TEST**

### **Test 1: OAuth Connection**

**Expected behavior:**
1. Click "Connect HubSpot" → Popup opens
2. Login to HubSpot → Authorize
3. Popup closes automatically
4. Extension shows "✓ Connected"
5. "Sync All" button appears

**Troubleshooting:**
- **Popup blocked?** Allow popups for extension
- **Redirect error?** Check redirect URL matches exactly
- **401 error?** Check Client ID/Secret are correct

---

### **Test 2: Sync All Contacts**

**Expected behavior:**
1. Click "🔄 Sync All Contacts"
2. Button shows "🔄 Syncing..."
3. After ~5 seconds: "✓ Synced X contacts"
4. Go to "Contacts" tab
5. Contacts that exist in HubSpot show "✓ In HubSpot" badge

**Troubleshooting:**
- **0 contacts synced?** Check if you have contacts in HubSpot
- **Error?** Check browser console for details
- **No badges?** Refresh contacts list

---

### **Test 3: Push New Contact**

**Expected behavior:**
1. Find a contact WITHOUT "✓ In HubSpot" badge
2. Click contact to expand
3. Click "Add to HubSpot" button
4. Button changes to "✓ In HubSpot"
5. Check HubSpot → Contact should be there

**Troubleshooting:**
- **"Not connected" error?** Connect HubSpot first
- **Duplicate error?** Contact already exists
- **Permission error?** Check OAuth scopes

---

## 📊 **HOW TO VERIFY IT'S WORKING**

### **Check 1: Database**

```sql
-- Connect to database
psql postgresql://xxx

-- Check integrations
SELECT user_id, platform, is_active, portal_id, instance_url 
FROM crm_integrations;

-- Check mappings
SELECT COUNT(*), platform 
FROM crm_contact_mappings 
GROUP BY platform;

-- Check sync logs
SELECT * FROM crm_sync_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### **Check 2: Backend Logs**

In Render dashboard → Logs, you should see:

```
🔵 Starting HubSpot OAuth for user: 123
✅ HubSpot connected successfully for user: 123
🔵 Starting full HubSpot sync for user: 123
📊 Fetched 50 contacts (total: 50)
✅ Sync complete: Mapped 25 contacts out of 50 HubSpot contacts
```

### **Check 3: Extension**

In Chrome DevTools Console (F12):

```
🔌 Integration Manager initialized
✅ Integrations initialized successfully
🔵 HubSpot OAuth callback for user: 123
✅ Integration status updated
```

---

## 🐛 **COMMON ISSUES & FIXES**

### **Issue 1: "OAuth redirect_uri mismatch"**

**Cause:** Redirect URL in HubSpot/Salesforce doesn't match

**Fix:**
```
HubSpot:
✓ https://crmsync-api.onrender.com/api/integrations/hubspot/callback

Salesforce:
✓ https://crmsync-api.onrender.com/api/integrations/salesforce/callback

Make sure:
- No trailing slash
- Exact match (case-sensitive)
- HTTPS (not HTTP)
```

---

### **Issue 2: "Connection fails silently"**

**Cause:** Environment variables not set

**Fix:**
1. Go to Render dashboard
2. Environment tab
3. Verify all 6 variables are set
4. Click "Save" to trigger redeploy

---

### **Issue 3: "No contacts synced"**

**Possible causes:**
- HubSpot account has no contacts
- Email addresses don't match
- Permission issues

**Fix:**
1. Check HubSpot has contacts with emails
2. Check your extension has contacts
3. Run sync again
4. Check database:
```sql
SELECT * FROM crm_sync_logs WHERE status = 'error';
```

---

### **Issue 4: "Token expired" errors**

**Cause:** OAuth tokens need refresh

**Fix:** Already handled automatically!
- HubSpot tokens refresh automatically
- Salesforce tokens don't expire (unless revoked)
- Just disconnect and reconnect if issues persist

---

## 📝 **TESTING CHECKLIST**

Before going live, test these scenarios:

**HubSpot:**
- [ ] Connect account (OAuth)
- [ ] Sync all contacts
- [ ] View badges on contacts
- [ ] Push new contact
- [ ] Update existing contact
- [ ] Disconnect account
- [ ] Reconnect account

**Salesforce:**
- [ ] Connect account (OAuth)
- [ ] Sync all contacts (Leads + Contacts)
- [ ] View badges on contacts
- [ ] Push new contact as Lead
- [ ] Push new contact as Contact
- [ ] Update existing record
- [ ] Disconnect account

**Edge Cases:**
- [ ] Test with empty CRM
- [ ] Test with 100+ contacts
- [ ] Test duplicate detection
- [ ] Test with invalid email
- [ ] Test token refresh
- [ ] Test after disconnecting

---

## 🎉 **LAUNCH CHECKLIST**

Once everything is tested:

1. **Update website:**
   - Remove "coming soon" language
   - Add "Now available" badges
   - Update feature descriptions
   - Add screenshots of integration tab
   
2. **Announce:**
   - Email existing users
   - Social media post
   - Product Hunt update
   - Blog post
   
3. **Monitor:**
   - Check sync logs daily
   - Watch for errors
   - Track usage metrics
   - Gather user feedback

---

## 💡 **NEXT FEATURES** (Optional)

After launch, consider adding:

- **Bi-directional sync** - Pull contact updates from CRM
- **Webhooks** - Real-time sync when CRM changes
- **Field mapping** - Custom field mappings
- **Bulk sync** - Sync 100+ contacts at once
- **More CRMs** - Pipedrive, Copper, Zoho
- **Auto-sync** - Background sync every X hours
- **Conflict resolution** - Handle data conflicts

---

## 📚 **USEFUL LINKS**

**HubSpot:**
- Developer Docs: https://developers.hubspot.com/docs/api/overview
- OAuth Guide: https://developers.hubspot.com/docs/api/oauth-quickstart-guide
- API Explorer: https://developers.hubspot.com/docs/api/crm/contacts

**Salesforce:**
- Developer Docs: https://developer.salesforce.com/docs/
- OAuth Guide: https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_web_server_flow.htm
- REST API: https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/

---

## ✅ **DONE!**

Your CRM integrations are ready to launch! 🚀

**Questions?** Check the logs, test locally, and iterate!

**Need help?** Check the troubleshooting section above.

**Ready to launch?** Follow the launch checklist!
