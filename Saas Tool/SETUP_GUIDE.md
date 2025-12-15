# CRMSYNC Setup Guide - Backend & Authentication

This guide will help you set up the complete CRMSYNC system with backend authentication and cross-platform data synchronization.

## Overview

CRMSYNC now has two modes:
- **Offline Mode (Guest)**: Works without an account, data stored locally only
- **Cloud Sync Mode**: Sign in to sync contacts across all devices

## Prerequisites

### Backend Requirements
- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn
- Google Cloud Console account (for Google OAuth)

### Extension Requirements
- Chrome browser (or Chromium-based browser)
- Chrome Extension Developer Mode enabled

---

## Part 1: Backend Setup

### 1. Database Setup

**Install PostgreSQL:**

```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download and install from https://www.postgresql.org/download/windows/
```

**Create Database:**

```bash
# Login to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE crmsync;
CREATE USER crmsync_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE crmsync TO crmsync_user;

# Exit
\q
```

### 2. Backend Installation

```bash
cd crmsync-backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 3. Configure Environment Variables

Edit `.env` file:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crmsync
DB_USER=crmsync_user
DB_PASSWORD=your_secure_password

# JWT Secrets (generate strong random strings!)
JWT_SECRET=your_jwt_secret_64_chars_minimum_random_string
REFRESH_TOKEN_SECRET=your_refresh_secret_64_chars_different_random_string

# Google OAuth (we'll set this up next)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# CORS (add your extension ID after installing)
ALLOWED_ORIGINS=http://localhost:3000,chrome-extension://YOUR_EXTENSION_ID
```

**Generate Secure Secrets:**

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate refresh token secret (run again for different value)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "CRMSYNC"
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://your-production-domain.com` (if deploying)
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/google/callback`
     - `https://your-production-domain.com/auth/google/callback`
   - Click "Create"

5. Also create **Chrome Extension** OAuth client:
   - Click "Create Credentials" > "OAuth client ID" again
   - Application type: "Chrome Extension"
   - Name: "CRMSYNC Extension"
   - Application ID: (you'll get this after installing the extension)

6. Copy the **Client ID** and **Client Secret** to your `.env` file

### 5. Run Database Migrations

```bash
npm run migrate
```

You should see: `✅ Database migrations completed successfully!`

### 6. Start the Backend Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server starts at `http://localhost:3000`

**Test the API:**
```bash
curl http://localhost:3000/health
```

Should return: `{"status":"healthy","timestamp":"...","version":"1.0.0"}`

---

## Part 2: Extension Setup

### 1. Install Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the "Saas Tool" folder
5. **Copy the Extension ID** (long string of letters under the extension name)

### 2. Update Extension Configuration

**Update `auth.js`:**

Replace `http://localhost:3000/api` with your backend URL:

```javascript
const API_URL = 'http://localhost:3000/api'; // or your production URL
```

**Update `sync.js`:**

Replace `http://localhost:3000/api` with your backend URL:

```javascript
const API_URL = 'http://localhost:3000/api'; // or your production URL
```

**Update `manifest.json`:**

1. Replace `YOUR_GOOGLE_CLIENT_ID` with your Google OAuth Chrome Extension Client ID:

```json
"oauth2": {
  "client_id": "YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com",
  "scopes": ["openid", "email", "profile"]
}
```

2. Update `host_permissions` if using production URL:

```json
"host_permissions": [
  "https://mail.google.com/*",
  "https://outlook.office.com/*",
  "http://localhost:3000/*",
  "https://your-production-api.com/*"
]
```

### 3. Update Backend CORS

**Add your extension ID to backend `.env`:**

```env
ALLOWED_ORIGINS=http://localhost:3000,chrome-extension://YOUR_EXTENSION_ID_HERE
```

**Restart the backend** after updating.

### 4. Test the Extension

1. Go to Gmail (`https://mail.google.com`)
2. Click the CRMSYNC extension icon
3. You'll see a welcome screen with options to:
   - **Sign In / Sign Up**
   - **Continue Offline (Guest Mode)**

---

## Part 3: Using CRMSYNC

### Guest Mode (Offline)

- All data stored locally in `chrome.storage.local`
- No account required
- Data only available on current browser
- Can upgrade to cloud sync anytime

### Cloud Sync Mode

**Sign Up Methods:**
1. **Email & Password**: Minimum 8 characters
2. **Google OAuth**: One-click sign in with Google account

**After Signing In:**
- Automatic sync every 5 minutes
- Manual sync button available
- Data accessible from any device
- Contacts, settings, and activity synced

**Sync Indicators:**
- Green banner at top shows email and sync status
- "Synced Xm ago" shows last sync time
- Click "Sync" button for immediate sync

---

## Part 4: Deployment (Production)

### Deploy Backend

**Recommended Platforms:**

#### Option A: Railway.app (Easiest)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL
railway add postgresql

# Set environment variables via dashboard
railway variables set JWT_SECRET=your_secret

# Deploy
railway up
```

#### Option B: Render.com

1. Create account at [render.com](https://render.com)
2. Create PostgreSQL database
3. Create Web Service from GitHub
4. Set environment variables in dashboard
5. Deploy automatically on push

#### Option C: DigitalOcean App Platform

1. Create account at [digitalocean.com](https://digitalocean.com)
2. Create PostgreSQL database
3. Create App from GitHub
4. Configure environment variables
5. Deploy

### Update Extension for Production

1. **Update API URLs** in `auth.js` and `sync.js`:

```javascript
const API_URL = 'https://your-production-api.com/api';
```

2. **Update manifest host_permissions**:

```json
"host_permissions": [
  "https://mail.google.com/*",
  "https://outlook.office.com/*",
  "https://your-production-api.com/*"
]
```

3. **Update Google OAuth** with production domain

4. **Package extension** for Chrome Web Store:
   - Update `manifest.json` version
   - Create zip of extension folder
   - Submit to Chrome Web Store

---

## Part 5: Troubleshooting

### Backend Issues

**Database Connection Failed:**
```bash
# Test connection
psql -U crmsync_user -d crmsync -h localhost

# Check PostgreSQL is running
pg_isready
```

**Port Already in Use:**
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

**Migration Errors:**
```bash
# Drop and recreate database
dropdb crmsync
createdb crmsync
npm run migrate
```

### Extension Issues

**Sync Not Working:**
1. Check backend is running: `curl http://localhost:3000/health`
2. Open DevTools Console in extension popup
3. Look for error messages
4. Verify Extension ID in backend `.env`

**Google OAuth Fails:**
1. Verify Client ID in `manifest.json` matches Google Console
2. Check Extension ID registered in Google Console
3. Clear Chrome cache and restart browser

**Contacts Not Syncing:**
1. Click "Sync Now" button
2. Check DevTools Console for errors
3. Verify authentication (green banner should show)
4. Test with `chrome.storage.local.get('authToken')`

### Common Errors

**"Not allowed by CORS":**
- Add extension ID to backend `ALLOWED_ORIGINS`
- Restart backend server

**"Invalid or expired token":**
- Token expired, try logging out and back in
- Check JWT secrets are same on backend

**"Database connection error":**
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

---

## Part 6: Security Best Practices

### Production Checklist

- [ ] Use strong random JWT secrets (64+ characters)
- [ ] Enable HTTPS for backend (use Let's Encrypt)
- [ ] Use environment-specific `.env` files (never commit `.env`)
- [ ] Set `NODE_ENV=production` in production
- [ ] Enable rate limiting (already configured)
- [ ] Regular database backups
- [ ] Monitor logs for suspicious activity
- [ ] Keep dependencies updated (`npm audit fix`)
- [ ] Use PostgreSQL SSL connections
- [ ] Implement IP whitelisting if needed

### Privacy Compliance

- Data stored encrypted in transit (TLS)
- Users can export all data (GDPR compliance)
- Users can delete account and all data
- Privacy policy updated with cloud sync info
- No data sold or shared with third parties

---

## Support

**Issues?** Open an issue on GitHub or contact support@crmsync.com

**Feature Requests?** We'd love to hear your ideas!

## License

MIT License - See LICENSE file for details

---

**Congratulations! 🎉** 

Your CRMSYNC extension is now fully set up with backend authentication and cloud synchronization!

Start using it on Gmail to track and manage your contacts effortlessly.

