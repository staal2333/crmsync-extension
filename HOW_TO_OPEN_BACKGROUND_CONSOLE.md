# How to Open Background Console (Service Worker)

## What is it?
Your Chrome extension has TWO consoles:
1. **Popup Console** (F12 on the popup) - You already know this one
2. **Background Console** (Service Worker) - This is where Pull/Sync actually runs!

## How to Open It:

### Method 1: Via Extension Page (EASIEST)
1. Type in Chrome address bar: `chrome://extensions/`
2. Press Enter
3. Find "CRMSYNC" extension in the list
4. Look for this text: **"Inspect views: service worker"**
   - It's a blue clickable link below the extension description
5. Click "service worker"
6. A new DevTools window opens - THIS IS THE BACKGROUND CONSOLE!

### What if I don't see "service worker"?
If you see **"service worker (inactive)"** instead:
- Click it to wake it up
- Background script was sleeping

If you see NOTHING (no "Inspect views" at all):
- Background script crashed
- Click the 🔄 Reload button on the extension first
- Then look for "Inspect views: service worker" again

---

## Visual Guide:

```
chrome://extensions/

┌─────────────────────────────────────────────┐
│ CRMSYNC                            [ON] ⚙️  │
│ Version 1.0.0                               │
│ Description: Auto-sync Gmail contacts...   │
│                                             │
│ Details  Remove  Errors                     │
│                                             │
│ Inspect views: service worker  👈 CLICK HERE│
└─────────────────────────────────────────────┘
```

When you click "service worker", you'll see a DevTools window that looks like:

```
┌─────────────────────────────────────────────┐
│ Console │ Sources │ Network │ Application   │
├─────────────────────────────────────────────┤
│ > ✅ Background script initialized          │
│ > 📦 Extension updated                      │
│ >                                           │
│                                             │
│   👈 This is where sync messages appear!   │
└─────────────────────────────────────────────┘
```

---

## Quick Test - Is it Working?

Once you have background console open, type:

```javascript
console.log('Background console is open!');
```

Press Enter. You should see: "Background console is open!"

Now you're ready to debug the sync issue!
