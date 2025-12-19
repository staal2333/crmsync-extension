# 🚀 CRMSYNC - Chrome Extension + Backend

Complete CRMSYNC solution with Chrome extension and Node.js backend.

---

## 📁 Repository Structure

```
crmsync-extension/
├── crmsync-backend/          # Node.js Backend API
│   ├── src/
│   │   ├── routes/           # API routes (auth, contacts, sync, etc.)
│   │   ├── middleware/       # Auth, rate limiting, error handling
│   │   ├── services/         # Business logic
│   │   └── server.js         # Main server file
│   ├── package.json
│   └── README.md             # Backend documentation
│
└── Saas Tool/                # Chrome Extension
    ├── manifest.json         # Extension configuration
    ├── background.js         # Service worker
    ├── content.js            # Gmail content script
    ├── popup.html/js/css     # Extension popup
    └── config.js             # Extension configuration
```

---

## 🎯 Quick Start

### **Backend (crmsync-backend)**

**Deployed on:** Render → https://crmsync-api.onrender.com

**Local Setup:**
```bash
cd crmsync-backend
npm install
cp ENV_TEMPLATE.txt .env
# Edit .env with your configuration
npm start
```

**See:** `crmsync-backend/RENDER-SETUP.md` for deployment guide

---

### **Extension (Saas Tool)**

**Load in Chrome:**
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `Saas Tool` folder
5. Extension will appear in toolbar

**See:** `Saas Tool/README.md` for full documentation

---

## 🌐 Live URLs

- **Website:** https://www.crm-sync.net
- **Backend API:** https://crmsync-api.onrender.com
- **Extension:** Load unpacked from `Saas Tool/` folder

---

## 🔧 Configuration

### Backend Environment Variables (Render)

Required environment variables on Render:

```env
NODE_ENV=production
DATABASE_URL=<auto-set-by-render>
ALLOWED_ORIGINS=https://www.crm-sync.net,https://crm-sync.net
JWT_SECRET=<generate-64-char-secret>
REFRESH_TOKEN_SECRET=<generate-64-char-secret>
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
FRONTEND_URL=https://www.crm-sync.net
```

### Extension Configuration

The extension is pre-configured for production:

```javascript
// Saas Tool/config.js
const CONFIG = {
  WEBSITE_URL: 'https://www.crm-sync.net',
  API_URL: 'https://crmsync-api.onrender.com/api',
  // ...
};
```

---

## 🚀 Deployment

### **Backend → Render**

Render is configured to:
- **Repository:** staal2333/crmsync-extension
- **Branch:** main
- **Root Directory:** `crmsync-backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Auto-deploys** when you push to `main` branch.

### **Extension → Chrome Web Store**

1. Zip the `Saas Tool` folder
2. Upload to Chrome Web Store Developer Dashboard
3. Follow submission guidelines in `Saas Tool/README.md`

---

## 📚 Documentation

- **Backend Setup:** `crmsync-backend/RENDER-SETUP.md`
- **Extension Setup:** `Saas Tool/README.md`
- **Website Integration:** `Saas Tool/WEBSITE-INTEGRATION.md`
- **Backend API:** `crmsync-backend/README.md`

---

## 🔐 Features

### **Extension**
- ✅ Gmail contact extraction
- ✅ Real-time sidebar widget
- ✅ Contact limits by tier (Free: 50, Pro: 1000, Enterprise: Unlimited)
- ✅ CSV export
- ✅ Website authentication integration

### **Backend**
- ✅ JWT authentication
- ✅ PostgreSQL database
- ✅ Contact sync API
- ✅ Stripe subscription management
- ✅ Rate limiting & security
- ✅ CORS configured for www.crm-sync.net

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, PostgreSQL, Stripe
- **Extension:** Vanilla JavaScript, Chrome APIs
- **Frontend:** React (separate repo: `Crm-sync`)
- **Hosting:** Render (backend), Vercel (frontend)

---

## 📊 Current Status

| Component | Status | URL |
|-----------|--------|-----|
| **Backend API** | ✅ Live | https://crmsync-api.onrender.com |
| **Frontend Website** | ✅ Live | https://www.crm-sync.net |
| **Extension** | 📦 Development | Load unpacked |
| **Database** | ✅ Live | PostgreSQL on Render |

---

## 🆘 Support

- **Backend Issues:** Check `crmsync-backend/RENDER-SETUP.md`
- **Extension Issues:** Check `Saas Tool/README.md`
- **CORS Issues:** Check `Saas Tool/BACKEND-SETUP-GUIDE.md`

---

## 📝 License

MIT License - See individual folders for details.

---

**Built with ❤️ for CRMSYNC**
