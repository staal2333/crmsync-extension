# 📦 ZIP PACKAGE CHECKLIST

## **Files to Include in ZIP:**

### ✅ **Core Files (Required):**
```
Saas Tool/
├── manifest.json          ✅
├── background.js          ✅
├── content.js             ✅
├── popup.html             ✅
├── popup.js               ✅
├── styles.css             ✅
├── config.js              ✅
├── auth.js                ✅
├── integrations.js        ✅
├── sync.js                ✅
├── logger.js              ✅
├── error-handler.js       ✅
├── loading-manager.js     ✅
├── sample-data.js         ✅
├── feature-tour.js        ✅
├── subscriptionService.js ✅
```

### ✅ **UI Pages:**
```
├── onboarding.html        ✅
├── onboarding.js          ✅
├── login.html             ✅
├── auth-callback.html     ✅
```

### ✅ **UI Enhancements:**
```
├── guest-mode-banner.js   ✅
├── popup-subscription.js  ✅
├── popup-enhancements.js  ✅
```

### ✅ **Icons (Required):**
```
└── icons/
    ├── icon16.png         ✅
    ├── icon48.png         ✅
    ├── icon128.png        ✅
    ├── widget-logo.png.png         ✅
    └── widget-logo-animated.gif    ✅
```

---

## **❌ DO NOT Include:**

- ❌ `node_modules/` (if exists)
- ❌ `.git/` folder
- ❌ `.env` files
- ❌ `*.log` files
- ❌ `.DS_Store` (Mac)
- ❌ `Thumbs.db` (Windows)
- ❌ Documentation files (optional)
- ❌ Marketing Website folder (separate)

---

## **Quick Zip Instructions:**

### **Windows:**
1. Navigate to: `c:\Users\sebas\Downloads\Saas Tool-20251202T124049Z-3-001\`
2. Right-click on **"Saas Tool"** folder
3. Select **"Send to" → "Compressed (zipped) folder"**
4. Rename to: **CRMSYNC-v2.0.0.zip**

### **Alternative (PowerShell):**
```powershell
cd "c:\Users\sebas\Downloads\Saas Tool-20251202T124049Z-3-001"
Compress-Archive -Path "Saas Tool" -DestinationPath "CRMSYNC-v2.0.0.zip"
```

---

## **Verify ZIP Contents:**

1. Open the ZIP file
2. Should see "Saas Tool" folder inside
3. Inside that folder, should see:
   - manifest.json
   - All .js files
   - All .html files
   - icons/ folder

---

## **Testing on Other Device:**

1. **Transfer ZIP:**
   - Email to yourself
   - USB drive
   - Cloud storage

2. **Extract ZIP**

3. **Load in Chrome:**
   ```
   chrome://extensions
   → Enable Developer Mode
   → Load unpacked
   → Select "Saas Tool" folder
   ```

4. **Test!**

---

## **File Size Check:**

Expected ZIP size: **~2-5 MB**

If much larger:
- Check for node_modules (remove)
- Check for large images (optimize)
- Check for log files (remove)

---

## **Manifest Version:**
Current: **v2.0.0**

Update version in `manifest.json` before each release:
```json
"version": "2.0.0"  // Update this
```

---

## **Quick Test After Zip:**

1. Extract ZIP to temp folder
2. Load in Chrome (developer mode)
3. Should load without errors
4. Click extension icon
5. Should see popup or onboarding

If errors appear:
- Check browser console
- Check missing files
- Verify all files included

---

**Ready to zip? Follow Windows instructions above!** 📦
