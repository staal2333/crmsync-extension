# 🔧 Backend Setup Guide - Fix CORS and Login Issues

## 🚨 Current Problem

Your website `www.crm-sync.net` is getting CORS errors when trying to login:

```
Access to fetch at 'https://crmsync-api.onrender.com/api/auth/login' 
from origin 'https://www.crm-sync.net' has been blocked by CORS policy
```

---

## ✅ Solution: Enable CORS on Your Backend

Your backend needs to allow requests from your new domain.

---

## 📋 Step-by-Step Fix

### **Step 1: Find Your Backend Code**

1. Go to your Render dashboard: https://dashboard.render.com
2. Find your backend service (the API that handles login)
3. Click on it to view details
4. Click "Shell" or "Logs" to see if it's running

### **Step 2: Update Backend CORS Settings**

#### **If using Node.js + Express:**

**Install CORS package:**
```bash
npm install cors
```

**Add to your server file (server.js or index.js):**
```javascript
const express = require('express');
const cors = require('cors');

const app = express();

// IMPORTANT: Add CORS BEFORE other middleware
app.use(cors({
  origin: [
    'https://www.crm-sync.net',
    'https://crm-sync.net',
    'http://localhost:3000', // for development
    'http://localhost:5173', // if using Vite
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Add this for preflight requests
app.options('*', cors());

// Then add your other middleware
app.use(express.json());

// Your routes here...
app.post('/api/auth/login', async (req, res) => {
  // Your login logic
});

// Start server
app.listen(3000, () => {
  console.log('Server running with CORS enabled');
});
```

#### **If using Python + Flask:**

**Install Flask-CORS:**
```bash
pip install flask-cors
```

**Add to your app.py:**
```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# Enable CORS
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://www.crm-sync.net",
            "https://crm-sync.net",
            "http://localhost:3000"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

@app.route('/api/auth/login', methods=['POST'])
def login():
    # Your login logic
    pass
```

#### **If using Python + FastAPI:**

**Add CORS middleware:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.crm-sync.net",
        "https://crm-sync.net",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/auth/login")
async def login(credentials: LoginRequest):
    # Your login logic
    pass
```

#### **If using other framework:**

**Manual CORS headers (works with any framework):**
```javascript
// Add these headers to EVERY response
res.setHeader('Access-Control-Allow-Origin', 'https://www.crm-sync.net');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
res.setHeader('Access-Control-Allow-Credentials', 'true');

// Handle OPTIONS preflight requests
if (req.method === 'OPTIONS') {
  res.status(200).end();
  return;
}
```

### **Step 3: Deploy Updated Backend**

#### **If using Render:**

1. Commit your changes to GitHub:
```bash
git add .
git commit -m "Enable CORS for www.crm-sync.net"
git push origin main
```

2. Render will auto-deploy (or manually deploy from dashboard)

3. Wait for deployment to complete (check logs)

#### **If using Vercel/Netlify:**

Add `vercel.json` or `netlify.toml` with CORS headers.

### **Step 4: Verify Backend is Running**

Open browser console and test:

```javascript
fetch('https://crmsync-api.onrender.com/api/auth/login', {
  method: 'OPTIONS'
})
.then(res => {
  console.log('CORS Headers:', res.headers);
  console.log('Status:', res.status);
})
.catch(err => console.error('Error:', err));
```

Should return status 200 with CORS headers.

---

## 🧪 Test Your Backend

### **Test 1: Check if Backend is Live**

```bash
curl https://crmsync-api.onrender.com/api/auth/login
```

Should return a response (not 404).

### **Test 2: Check CORS Headers**

```bash
curl -I -X OPTIONS https://crmsync-api.onrender.com/api/auth/login \
  -H "Origin: https://www.crm-sync.net" \
  -H "Access-Control-Request-Method: POST"
```

Should see:
```
Access-Control-Allow-Origin: https://www.crm-sync.net
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
```

### **Test 3: Test Login from Website**

1. Go to https://www.crm-sync.net/#/login
2. Open browser console (F12)
3. Try logging in
4. Check console for errors

---

## 🎯 Alternative: Use Same Domain for API

Instead of calling `crmsync-api.onrender.com`, make API calls to your own domain:

### **Setup Reverse Proxy**

**If hosting on Vercel, add to `vercel.json`:**
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://crmsync-api.onrender.com/api/:path*"
    }
  ]
}
```

**If hosting on Netlify, add to `netlify.toml`:**
```toml
[[redirects]]
  from = "/api/*"
  to = "https://crmsync-api.onrender.com/api/:splat"
  status = 200
  force = true
```

Then update your frontend to use:
```javascript
const API_URL = '/api'; // Relative URL, same domain
```

---

## 📝 Quick Checklist

- [ ] Backend code updated with CORS
- [ ] CORS allows `www.crm-sync.net`
- [ ] Backend redeployed to Render
- [ ] Backend is running (check logs)
- [ ] Test OPTIONS request works
- [ ] Test login from website works
- [ ] Extension callback receives auth token

---

## 🆘 Still Not Working?

### **Check Backend Logs:**

1. Go to Render dashboard
2. Click your backend service
3. Click "Logs"
4. Look for errors

### **Common Issues:**

**Issue:** Backend shows "CORS policy" in logs
**Fix:** Make sure CORS middleware is added BEFORE routes

**Issue:** Backend returns 404
**Fix:** Check your routes are correct (`/api/auth/login`)

**Issue:** Backend crashes on startup
**Fix:** Check for syntax errors, missing packages

---

## 📞 Need Help?

Share with me:
1. What backend framework you're using (Express, Flask, etc.)
2. Your backend logs from Render
3. The exact error message you see

I'll give you the exact code to fix it!

---

## 🎉 Once It's Working

After login works:
1. User logs in on website
2. Website redirects to: `chrome-extension://<id>/auth-callback.html?token=...&tier=...`
3. Extension receives auth data
4. Extension shows user's tier and account info
5. Contact limits apply based on tier

**Your extension is ready! Just need the backend CORS fixed.** 🚀
