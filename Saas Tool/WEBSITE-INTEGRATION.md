# Website Integration Guide for CRMSYNC Extension

This guide explains how to integrate your website with the CRMSYNC Chrome extension for authentication and subscription management.

## 🚀 Overview

The extension now redirects users to your website for sign-in/sign-up. After authentication, your website sends the user's data back to the extension.

**Flow:**
1. User clicks "Sign In" in extension → Opens your website
2. User logs in or signs up on your website
3. Your website redirects to the extension's callback page with auth data
4. Extension stores the data and shows the user's account + tier

---

## ⚙️ Step 1: Configure Your Website URL

Edit `config.js` and update the `WEBSITE_URL`:

```javascript
const CONFIG = {
  WEBSITE_URL: 'https://your-actual-website.com',  // <-- Change this!
  
  AUTH: {
    LOGIN: '/login',
    SIGNUP: '/signup',
    CALLBACK: '/auth/extension-callback'
  },
  // ... rest of config
};
```

---

## 📝 Step 2: Implement Login/Signup Pages

### Login Page URL Format

When users click "Sign In" in the extension, they'll be redirected to:

```
https://your-website.com/login?source=extension&extensionId=<chrome-extension-id>
```

**URL Parameters:**
- `source=extension` - Indicates the user came from the extension
- `extensionId=<id>` - The Chrome extension ID (for callback)

### Your Login Page Should:

1. Display your normal login/signup form
2. Authenticate the user with your backend
3. After successful auth, redirect to the extension callback

---

## 🔄 Step 3: Redirect Back to Extension

After successful authentication, redirect the user to:

```
chrome-extension://<extensionId>/auth-callback.html?token=<JWT>&email=<email>&name=<name>&tier=<tier>
```

### Example (JavaScript):

```javascript
// After successful login on your website
async function handleSuccessfulLogin(userData) {
  // Get the extension ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const extensionId = urlParams.get('extensionId');
  const source = urlParams.get('source');
  
  // Only redirect if user came from extension
  if (source === 'extension' && extensionId) {
    // Generate JWT token for the user
    const token = generateJWT(userData); // Your JWT generation logic
    
    // Build callback URL
    const callbackUrl = new URL(`chrome-extension://${extensionId}/auth-callback.html`);
    callbackUrl.searchParams.set('token', token);
    callbackUrl.searchParams.set('email', userData.email);
    callbackUrl.searchParams.set('name', userData.name);
    callbackUrl.searchParams.set('tier', userData.subscriptionTier); // 'free', 'pro', or 'enterprise'
    callbackUrl.searchParams.set('firstName', userData.firstName || '');
    callbackUrl.searchParams.set('lastName', userData.lastName || '');
    callbackUrl.searchParams.set('avatar', userData.avatarUrl || '');
    
    // Redirect to extension
    window.location.href = callbackUrl.toString();
  } else {
    // Normal web login - redirect to dashboard
    window.location.href = '/dashboard';
  }
}
```

### Example (Node.js/Express):

```javascript
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const { extensionId, source } = req.query;
  
  try {
    // Authenticate user
    const user = await authenticateUser(email, password);
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // If from extension, redirect to callback
    if (source === 'extension' && extensionId) {
      const callbackUrl = `chrome-extension://${extensionId}/auth-callback.html?` +
        `token=${encodeURIComponent(token)}&` +
        `email=${encodeURIComponent(user.email)}&` +
        `name=${encodeURIComponent(user.name)}&` +
        `tier=${encodeURIComponent(user.subscriptionTier)}&` +
        `firstName=${encodeURIComponent(user.firstName || '')}&` +
        `lastName=${encodeURIComponent(user.lastName || '')}`;
      
      return res.redirect(callbackUrl);
    }
    
    // Normal web login
    res.json({ success: true, token, user });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});
```

---

## 🎯 Step 4: User Tiers

The extension supports three subscription tiers:

### Tier Options:
- **`free`** - Free tier (limited features)
- **`pro`** - Pro tier (more features)
- **`enterprise`** - Enterprise tier (unlimited)

### Tier Configuration (config.js):

```javascript
TIERS: {
  free: {
    name: 'Free',
    contactLimit: 50,        // Max contacts
    exportLimit: 10,         // Exports per month
    features: [
      'Extract up to 50 contacts',
      'Export 10 contacts per month',
      'Basic contact management'
    ]
  },
  pro: {
    name: 'Pro',
    contactLimit: 1000,
    exportLimit: -1,         // -1 = unlimited
    features: [
      'Extract up to 1,000 contacts',
      'Unlimited exports',
      'Advanced analytics',
      'Priority support'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    contactLimit: -1,        // -1 = unlimited
    exportLimit: -1,
    features: [
      'Unlimited contacts',
      'Unlimited exports',
      'Team collaboration',
      'API access',
      'Dedicated support'
    ]
  }
}
```

---

## 🔐 Step 5: JWT Token Structure

Your JWT token should contain:

```json
{
  "userId": "user-123",
  "email": "user@example.com",
  "tier": "pro",
  "exp": 1735689600  // Expiration timestamp
}
```

The extension stores this token and can use it to make authenticated API calls to your backend.

---

## 📊 Step 6: Subscription Management

### Upgrade Flow

When free users click "Upgrade to Pro" in the extension:
1. Opens: `https://your-website.com/pricing?source=extension`
2. User selects a plan and completes payment
3. Your website updates the user's tier in your database
4. User returns to extension and sees updated tier

### How Extension Gets Updated Tier

**Option 1: User Re-authenticates**
- User signs out and signs back in
- Extension receives updated tier from your website

**Option 2: Background Sync (Recommended)**
- Extension periodically checks your API for tier updates
- Implement an API endpoint: `GET /api/user/tier` (requires JWT)

```javascript
// Example API endpoint
app.get('/api/user/tier', authenticateJWT, async (req, res) => {
  const user = await getUserById(req.user.userId);
  res.json({
    tier: user.subscriptionTier,
    contactLimit: TIER_LIMITS[user.subscriptionTier].contacts,
    exportLimit: TIER_LIMITS[user.subscriptionTier].exports
  });
});
```

---

## 🧪 Testing the Integration

### 1. Test Login Flow

1. Open the extension popup
2. Click "Sign In"
3. Verify you're redirected to your website
4. Log in with test credentials
5. Verify you're redirected back to extension
6. Check extension shows your name, email, and tier

### 2. Test Signup Flow

1. Click "Sign In" → "Create Account"
2. Sign up as a new user
3. Choose a tier (free/pro)
4. Verify callback works

### 3. Test Upgrade Flow

1. Log in with a free-tier account
2. Go to Settings tab in extension
3. Click "Upgrade to Pro"
4. Complete upgrade on your website
5. Return to extension and verify tier updates

---

## 🐛 Debugging

### Check Extension Console

```javascript
// Open extension popup
// Right-click → Inspect
// Go to Console tab
// Look for auth-related logs
```

### Check Background Script

```bash
# Go to chrome://extensions
# Find CRMSYNC
# Click "service worker" link
# Check console for auth messages
```

### Common Issues

**Issue:** "Missing required authentication parameters"
- **Fix:** Ensure all URL parameters are passed correctly (token, email, name, tier)

**Issue:** Extension shows "Sign In" after successful login
- **Fix:** Check that `isAuthenticated` is set to `true` in Chrome storage
- **Debug:** Open extension → Right-click → Inspect → Console:
  ```javascript
  chrome.storage.local.get(['isAuthenticated', 'user'], console.log)
  ```

**Issue:** Tier not displaying
- **Fix:** Ensure `tier` parameter is included in callback URL and is one of: 'free', 'pro', 'enterprise'

---

## 📚 Example: Full Integration

### Frontend (React Example)

```jsx
// LoginPage.jsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const extensionId = searchParams.get('extensionId');
  const isFromExtension = searchParams.get('source') === 'extension';
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, extensionId, source: 'extension' })
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (isFromExtension && extensionId) {
        // Redirect to extension
        const callbackUrl = `chrome-extension://${extensionId}/auth-callback.html?` +
          `token=${encodeURIComponent(data.token)}&` +
          `email=${encodeURIComponent(data.user.email)}&` +
          `name=${encodeURIComponent(data.user.name)}&` +
          `tier=${encodeURIComponent(data.user.tier)}`;
        
        window.location.href = callbackUrl;
      } else {
        // Normal web login
        navigate('/dashboard');
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {isFromExtension && (
        <div className="alert">
          🔌 Signing in from CRMSYNC Extension
        </div>
      )}
      
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required 
      />
      
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required 
      />
      
      <button type="submit">Sign In</button>
    </form>
  );
}
```

---

## 🎉 You're Done!

Your CRMSYNC extension is now integrated with your website! Users can:

✅ Sign in through your website  
✅ Choose subscription tiers  
✅ See their account info in the extension  
✅ Upgrade from within the extension  

**Need help?** Check the console logs in both the extension and your website for debugging information.
