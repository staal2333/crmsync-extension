# ⚡ Quick Fix - Website Login Integration

## 🎯 Problem

Logging in on the website doesn't log you into the extension popup.

## ✅ Solution

Add this code to your website's login success handler:

---

## 📝 Copy-Paste This Code:

### **Add to your Login component (React):**

```typescript
// After successful login, add this:

const handleLoginSuccess = (authData: any) => {
  const { token, user } = authData;
  
  // Store auth data (your normal flow)
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));

  // ✅ NEW: Check if logging in from extension
  const urlParams = new URLSearchParams(window.location.search);
  const source = urlParams.get('source');
  const extensionId = urlParams.get('extensionId');

  if (source === 'extension' && extensionId) {
    // Redirect back to extension with auth data
    const callbackUrl = new URL(`chrome-extension://${extensionId}/auth-callback.html`);
    callbackUrl.searchParams.set('token', token);
    callbackUrl.searchParams.set('email', user.email);
    callbackUrl.searchParams.set('name', user.name || '');
    callbackUrl.searchParams.set('tier', user.tier || 'free');
    
    console.log('🔌 Redirecting to extension:', callbackUrl.toString());
    window.location.href = callbackUrl.toString();
  } else {
    // Normal redirect to dashboard
    window.location.href = '/dashboard';
  }
};
```

---

## 🔍 **Where to Add This:**

Look for your login function, probably in one of these files:
- `pages/Login.tsx`
- `components/Login.tsx`
- `services/authService.ts`

Find where you handle successful login response and add the code above.

---

## 🧪 **Test It:**

1. Click "Sign In" in extension
2. Website opens: `.../#/login?source=extension&extensionId=abc123`
3. Log in with your credentials
4. Should redirect back to extension
5. Extension popup shows you're logged in ✅

---

## 💡 **How It Works:**

```
Extension
   ↓ Opens website with special URL params
Website Login Page
   ↓ Detects "source=extension"
   ↓ User logs in successfully
   ↓ Redirects to: chrome-extension://[id]/auth-callback.html?token=...
Extension
   ↓ Receives auth data
   ↓ Stores in chrome.storage
   ↓ Popup updates to show logged-in state
```

---

## 🆘 **Still Not Working?**

### **Check These:**

1. **Website Console (F12):**
   ```javascript
   // Should see these logs:
   console.log('Extension ID:', extensionId); // Should have a value
   console.log('Redirecting to:', callbackUrl); // Should start with chrome-extension://
   ```

2. **Extension Console (Popup → Right-click → Inspect):**
   ```javascript
   // Should see:
   "Received auth from website: {token: ..., email: ...}"
   ```

3. **URL Parameters:**
   - Open website login page from extension
   - Check URL has: `?source=extension&extensionId=...`
   - If missing, extension might not be opening it correctly

---

## 📋 **Minimal Example:**

If you just want the bare minimum:

```typescript
// In your login success handler:
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('source') === 'extension') {
  const extensionId = urlParams.get('extensionId');
  window.location.href = `chrome-extension://${extensionId}/auth-callback.html?token=${token}&email=${user.email}&tier=${user.tier || 'free'}`;
}
```

---

That's it! This should make the extension receive your login. 🚀
