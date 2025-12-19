# Quick Start Guide - Get Running in 5 Minutes

## Prerequisites

1. **PostgreSQL** - Must be installed and running
2. **Node.js 16+** - Download from https://nodejs.org/

## Step 1: Setup Database

### macOS/Linux:
```bash
# Make setup script executable
chmod +x quick-setup.sh

# Run setup script
./quick-setup.sh
```

### Windows:
```cmd
# Run setup script
quick-setup.bat
```

### Manual Setup (if scripts don't work):

```bash
# 1. Install dependencies
npm install

# 2. Create database
psql -U postgres
CREATE DATABASE crmsync;
\q

# 3. Create .env file
cp .env.example .env
# Edit .env and set your database password

# 4. Run migrations
npm run migrate
```

## Step 2: Start the Server

```bash
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════╗
║      CRMSYNC API SERVER RUNNING          ║
╠═══════════════════════════════════════════╣
║  Port: 3000                              ║
║  Environment: development                ║
╚═══════════════════════════════════════════╝
```

Test it:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"healthy","timestamp":"...","version":"1.0.0"}
```

## Step 3: Install Extension

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the "Saas Tool" folder
5. **Copy the Extension ID** (under the extension name)

## Step 4: Connect Extension to Backend

1. Open `crmsync-backend/.env`
2. Add your Extension ID:
   ```
   ALLOWED_ORIGINS=http://localhost:3000,chrome-extension://YOUR_EXTENSION_ID_HERE
   ```
3. Restart the server (Ctrl+C, then `npm run dev`)

## Step 5: Use the Extension

1. Go to Gmail
2. Click the CRMSYNC extension icon
3. Choose either:
   - **"Continue Offline"** - Use without account (local only)
   - **"Sign In / Sign Up"** - Create account for cloud sync

## Done! 🎉

The extension is now working and connected to your backend.

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready

# On macOS:
brew services start postgresql

# On Ubuntu:
sudo systemctl start postgresql

# On Windows:
# Start PostgreSQL service from Services app
```

### Port 3000 Already in Use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change the port in .env
PORT=3001
```

### Extension Not Connecting
1. Check backend is running: `curl http://localhost:3000/health`
2. Verify Extension ID in `.env` file
3. Restart backend after changing `.env`
4. Check browser console (F12) for errors

### "CORS Error"
- Make sure Extension ID is in `.env` under `ALLOWED_ORIGINS`
- Restart backend after adding Extension ID
- Extension ID should look like: `abcdefghijklmnopqrstuvwxyz123456`

## Next Steps

- **Production Deploy**: See [SETUP_GUIDE.md](../Saas%20Tool/SETUP_GUIDE.md)
- **Google OAuth**: Configure in Google Cloud Console
- **Custom Domain**: Update API URLs in extension files

## Need Help?

- Check console logs (F12 in browser)
- Check backend logs (in terminal where server is running)
- See full guide: [SETUP_GUIDE.md](../Saas%20Tool/SETUP_GUIDE.md)

