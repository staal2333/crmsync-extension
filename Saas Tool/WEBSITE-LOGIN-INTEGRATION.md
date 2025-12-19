# 🔗 Website Login Integration for Extension

## 🎯 Goal

When users log in on your website from the extension, they need to be redirected back to the extension with their auth data.

---

## 📋 What Your Website Needs to Do:

### **1. Detect Extension Login**

When the extension opens your login page, it adds URL parameters:
```
https://crm-sync.vercel.app/#/login?source=extension&extensionId=abc123
```

Your login page should:
1. Check for `source=extension` parameter
2. Store the `extensionId` parameter
3. After successful login, redirect to extension

---

## 💻 **Code to Add to Your Website Login:**

### **In Your Login Page Component (React):**

```typescript
// pages/Login.tsx or components/Login.tsx

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isExtensionLogin, setIsExtensionLogin] = useState(false);
  const [extensionId, setExtensionId] = useState('');

  useEffect(() => {
    // Check if this is an extension login
    const source = searchParams.get('source');
    const extId = searchParams.get('extensionId');
    
    if (source === 'extension' && extId) {
      setIsExtensionLogin(true);
      setExtensionId(extId);
      console.log('🔌 Extension login detected:', extId);
    }
  }, [searchParams]);

  const handleLogin = async (email: string, password: string) => {
    try {
      // Your existing login logic
      const response = await fetch('https://crmsync-api.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Store token in localStorage (your normal flow)
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // ✅ IF this is an extension login, redirect to extension
        if (isExtensionLogin && extensionId) {
          redirectToExtension(data);
        } else {
          // Normal redirect to dashboard
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const redirectToExtension = (authData: any) => {
    const { token, user } = authData;
    
    // Build callback URL with auth data
    const callbackUrl = new URL(`chrome-extension://${extensionId}/auth-callback.html`);
    callbackUrl.searchParams.set('token', token);
    callbackUrl.searchParams.set('email', user.email);
    callbackUrl.searchParams.set('name', user.name || '');
    callbackUrl.searchParams.set('tier', user.tier || 'free');
    
    // Optional: Add more user data
    if (user.firstName) callbackUrl.searchParams.set('firstName', user.firstName);
    if (user.lastName) callbackUrl.searchParams.set('lastName', user.lastName);
    if (user.avatar) callbackUrl.searchParams.set('avatar', user.avatar);

    console.log('🚀 Redirecting to extension:', callbackUrl.toString());
    
    // Redirect to extension
    window.location.href = callbackUrl.toString();
  };

  // Your normal login form JSX here
  return (
    <div>
      {isExtensionLogin && (
        <div className="alert alert-info">
          🔌 You'll be redirected to the extension after login
        </div>
      )}
      
      {/* Your login form */}
    </div>
  );
}
```

---

## 🔧 **Alternative: Global Handler**

If you want to handle this globally (recommended), add this to your auth service:

```typescript
// services/authService.ts

export const login = async (email: string, password: string) => {
  const response = await fetch('https://crmsync-api.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (response.ok && data.token) {
    // Store token
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // ✅ Check if this is an extension callback
    handleExtensionCallback(data);
  }

  return data;
};

function handleExtensionCallback(authData: any) {
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const source = urlParams.get('source');
  const extensionId = urlParams.get('extensionId');

  // If from extension, redirect back
  if (source === 'extension' && extensionId) {
    const callbackUrl = new URL(`chrome-extension://${extensionId}/auth-callback.html`);
    callbackUrl.searchParams.set('token', authData.token);
    callbackUrl.searchParams.set('email', authData.user.email);
    callbackUrl.searchParams.set('name', authData.user.name || '');
    callbackUrl.searchParams.set('tier', authData.user.tier || 'free');
    
    if (authData.user.firstName) callbackUrl.searchParams.set('firstName', authData.user.firstName);
    if (authData.user.lastName) callbackUrl.searchParams.set('lastName', authData.user.lastName);

    console.log('🔌 Redirecting to extension:', callbackUrl.toString());
    window.location.href = callbackUrl.toString();
    return true;
  }

  return false;
}
```

---

## 📝 **What the Extension Receives:**

After successful login, the extension receives this URL:

```
chrome-extension://jaddbiojbkcomkejnphknlbaappcdggf/auth-callback.html?token=eyJhbGc...&email=user@example.com&name=John%20Doe&tier=free
```

The `auth-callback.html` page (already created in extension) will:
1. Parse these parameters
2. Send to background script via `chrome.runtime.sendMessage`
3. Background script stores in `chrome.storage.local`
4. Extension is now logged in!

---

## 🧪 **Testing Flow:**

### **Step 1: User Opens Extension**
```
Extension Popup → Click "Sign In" 
  ↓
Opens: https://crm-sync.vercel.app/#/login?source=extension&extensionId=abc123
```

### **Step 2: User Logs In**
```
Website Login Form → Enter credentials → Submit
  ↓
Your Backend: Validates & returns JWT token
  ↓
Your Frontend: Receives token + user data
```

### **Step 3: Website Redirects to Extension**
```
Website checks: source=extension? ✅
  ↓
Redirects to: chrome-extension://abc123/auth-callback.html?token=...&email=...&tier=...
  ↓
Extension receives auth data
  ↓
Popup updates: Shows logged-in state!
```

---

## 🔍 **Debug Mode:**

Add this to your login page to test:

```typescript
// Debug: Log extension login params
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  console.log('🔍 URL Params:', {
    source: urlParams.get('source'),
    extensionId: urlParams.get('extensionId'),
    allParams: Object.fromEntries(urlParams.entries())
  });
}, []);
```

---

## 📊 **Complete Example (Copy-Paste Ready):**

```typescript
// Add this to your Login component

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export function Login() {
  const [searchParams] = useSearchParams();

  const handleSuccessfulLogin = async (loginResponse: any) => {
    const { token, user } = loginResponse;

    // Store auth data
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    // Check for extension callback
    const source = searchParams.get('source');
    const extensionId = searchParams.get('extensionId');

    if (source === 'extension' && extensionId) {
      // Build callback URL
      const params = new URLSearchParams({
        token: token,
        email: user.email,
        name: user.name || '',
        tier: user.tier || 'free',
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      });

      const callbackUrl = `chrome-extension://${extensionId}/auth-callback.html?${params.toString()}`;
      
      console.log('🔌 Extension login - Redirecting to:', callbackUrl);
      
      // Show success message briefly
      showNotification('Success! Redirecting to extension...');
      
      // Redirect after brief delay
      setTimeout(() => {
        window.location.href = callbackUrl;
      }, 1000);
    } else {
      // Normal redirect to dashboard
      navigate('/dashboard');
    }
  };

  // Your normal login form here
  return (
    <div>
      {searchParams.get('source') === 'extension' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800 text-sm">
            🔌 Logging in from CRMSYNC Extension
          </p>
        </div>
      )}
      
      {/* Your login form */}
    </div>
  );
}
```

---

## ✅ **Checklist:**

- [ ] Add code to detect `source=extension` parameter
- [ ] Store `extensionId` from URL
- [ ] After successful login, check if from extension
- [ ] If from extension, build callback URL with auth data
- [ ] Redirect to: `chrome-extension://[id]/auth-callback.html?token=...`
- [ ] Test the flow: Extension → Website → Back to Extension

---

## 🆘 **Troubleshooting:**

### **Extension doesn't get logged in:**

**Check Console:**
```javascript
// In website console after login:
console.log('Extension ID:', searchParams.get('extensionId'));
console.log('Redirecting to:', callbackUrl);
```

**Check Extension Console:**
```javascript
// Open extension popup → Right-click → Inspect
// Should see: "Received auth from website"
```

### **"Invalid extension ID" error:**

Make sure you're using the actual extension ID from the URL, not a hardcoded value.

### **Redirect doesn't work:**

Check browser console for any errors. The `chrome-extension://` protocol should work automatically.

---

## 📞 **Need Help?**

Share with me:
1. Your login component code
2. Console logs during login
3. Any errors you see

I'll help you integrate it! 🚀
