# CRMSYNC Backend API

**Version:** 1.0.0 (Production-Ready)  
**Last Updated:** December 15, 2025

Secure backend API for CRMSYNC Chrome extension providing user authentication, cloud synchronization, and GDPR-compliant data management.

---

## 🚀 Quick Links

- **🏠 Production URL**: https://crmsync-extension.onrender.com
- **📋 Deployment Guide**: [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
- **⚖️ Terms of Service**: [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md)
- **🛡️ Security**: Winston logging + Sentry error tracking

---

## ✨ Features

### Core Functionality
- ✅ **User Authentication** - Email/password + Google OAuth
- ✅ **JWT-based Sessions** - Access & refresh tokens
- ✅ **Cloud Synchronization** - Full & incremental sync
- ✅ **Contact Management** - CRUD operations with search
- ✅ **Settings Sync** - User preferences across devices

### Production-Ready
- ✅ **Security**: HTTPS redirect, rate limiting, Helmet headers
- ✅ **Monitoring**: Winston logging, Sentry error tracking
- ✅ **GDPR Compliance**: Data export, account deletion, data summary
- ✅ **Rate Limiting**: 60 API requests/15min, 5 auth attempts/15min, 10 syncs/5min
- ✅ **Error Handling**: Centralized error middleware
- ✅ **Graceful Shutdown**: Clean server termination

### GDPR Endpoints (New!)
- `GET /api/user/export` - Export all user data (Article 15)
- `DELETE /api/user/account` - Delete account & data (Article 17)
- `GET /api/user/data-summary` - View data storage summary

---

## 📚 API Documentation

### Authentication Endpoints

#### Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "subscriptionTier": "free"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer {accessToken}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {accessToken}
```

---

### Sync Endpoints

#### Full Synchronization
```http
POST /api/sync/full
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "contacts": [...],
  "messages": [...],
  "settings": {...},
  "lastSyncAt": "2025-12-15T10:30:00Z"
}
```

#### Incremental Sync
```http
POST /api/sync/incremental
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "lastSyncAt": "2025-12-15T10:30:00Z",
  "changes": {
    "contactsAdded": [...],
    "contactsUpdated": [...],
    "contactsDeleted": ["id1", "id2"]
  }
}
```

---

### Contact Endpoints

#### Get All Contacts
```http
GET /api/contacts?search=john&limit=50&offset=0
Authorization: Bearer {accessToken}
```

#### Create Contact
```http
POST /api/contacts
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "email": "contact@example.com",
  "name": "Jane Smith",
  "company": "Acme Corp",
  "phone": "+1234567890"
}
```

#### Update Contact
```http
PUT /api/contacts/:id
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Jane Smith-Updated",
  "phone": "+9876543210"
}
```

#### Delete Contact
```http
DELETE /api/contacts/:id
Authorization: Bearer {accessToken}
```

---

### GDPR Endpoints (New!)

#### Export All Data
```http
GET /api/user/export
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "message": "User data export successful",
  "data": {
    "user": {...},
    "contacts": [...],
    "messages": [...],
    "settings": {...},
    "exportedAt": "2025-12-15T12:00:00Z"
  },
  "gdpr_notice": "This export contains all personal data..."
}
```

#### Delete Account
```http
DELETE /api/user/account
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "confirmPassword": "SecurePassword123!"
}
```

#### Data Summary
```http
GET /api/user/data-summary
Authorization: Bearer {accessToken}
```

---

## 🛠️ Setup & Deployment

### Local Development

1. **Clone and Install**
```bash
git clone https://github.com/yourusername/crmsync-extension.git
cd crmsync-extension/crmsync-backend
npm install
```

2. **Set Up Environment**
```bash
cp CRMSYNC\ Backend\ Configuration.env.txt .env
# Edit .env with your settings
```

3. **Start Database** (PostgreSQL)
```bash
# On Render: Automatically provided via DATABASE_URL
# Locally: Install PostgreSQL or use Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
```

4. **Run Migrations**
```bash
npm run migrate
```

5. **Start Server**
```bash
npm run dev  # Development mode with nodemon
# or
npm start    # Production mode
```

### Production Deployment

**See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for complete guide**

**Quick Deploy to Render:**

1. Run production setup script:
```bash
chmod +x production-setup.sh
./production-setup.sh
```

2. Update Render environment variables with generated secrets

3. Deploy:
```bash
git push origin main  # Auto-deploys to Render
```

4. Verify:
```bash
curl https://crmsync-extension.onrender.com/health
```

---

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Access (15min) + Refresh (7 days)
- **Password Hashing**: Bcrypt with salt
- **Token Validation**: On every protected route
- **Session Management**: Refresh token rotation

### Rate Limiting
- **API Endpoints**: 60 requests per 15 minutes
- **Auth Endpoints**: 5 attempts per 15 minutes
- **Sync Endpoints**: 10 operations per 5 minutes
- **Per-IP tracking**: Prevents abuse

### Network Security
- **HTTPS Only**: Automatic redirect in production
- **CORS**: Whitelist-based origin checking
- **Helmet.js**: Security headers (CSP, XSS protection, etc.)
- **Input Validation**: Express-validator on all inputs

### Monitoring & Logging
- **Winston**: Structured JSON logging
- **Sentry**: Real-time error tracking
- **Request Logging**: Method, path, status, duration, IP
- **Health Checks**: `/health` endpoint with uptime

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  avatar_url VARCHAR(500),
  subscription_tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);
```

### Contacts Table
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  company VARCHAR(255),
  job_title VARCHAR(255),
  phone VARCHAR(50),
  linkedin_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

See `src/migrations/001_initial_schema.sql` for complete schema.

---

## 🧪 Testing

### Health Check
```bash
curl https://crmsync-extension.onrender.com/health
```

### Register & Login
```bash
# Register
curl -X POST https://crmsync-extension.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","displayName":"Test User"}'

# Login
curl -X POST https://crmsync-extension.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

### Load Testing
```bash
# Install Apache Bench
# Windows: Download from Apache website
# Mac: brew install apache-bench
# Linux: sudo apt-get install apache2-utils

# Test 1000 requests, 10 concurrent
ab -n 1000 -c 10 https://crmsync-extension.onrender.com/health
```

---

## 📁 Project Structure

```
crmsync-backend/
├── src/
│   ├── config/
│   │   ├── config.js          # App configuration
│   │   ├── database.js        # PostgreSQL connection
│   │   └── database-sqlite.js # SQLite (dev only)
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   ├── errorHandler.js   # Error handling
│   │   └── rateLimiter.js    # Rate limiting
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   └── run.js             # Migration runner
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── contacts.js        # Contact CRUD
│   │   ├── settings.js        # User settings
│   │   ├── sync.js            # Sync endpoints
│   │   └── user.js            # GDPR endpoints (NEW)
│   ├── services/
│   │   ├── authService.js     # Auth business logic
│   │   ├── googleOAuth.js     # Google Sign-In
│   │   └── syncService.js     # Sync logic
│   ├── utils/
│   │   └── jwt.js             # JWT helpers
│   └── server.js              # Express app (UPDATED with logging)
├── production-setup.sh        # Production setup script (NEW)
├── PRODUCTION_DEPLOYMENT.md   # Deployment guide (NEW)
├── TERMS_OF_SERVICE.md        # Legal terms (NEW)
├── package.json
└── README.md                  # This file
```

---

## 🌍 Environment Variables

### Required
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=<64-char-hex-secret>
REFRESH_TOKEN_SECRET=<different-64-char-hex-secret>
```

### Optional
```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
LOG_LEVEL=info
ALLOWED_ORIGINS=https://mail.google.com,chrome-extension://YOUR_ID
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

**Generate secrets:**
```bash
./production-setup.sh
```

---

## 💰 Hosting Costs

### Free Tier (Good for beta)
- Render Web Service: $0/mo
- Render PostgreSQL: $0/mo
- ⚠️ Spins down after 15min inactivity

### Recommended Production
- Render Web Service Starter: $7/mo
- Render Database Starter: $7/mo
- **Total: $14/month** ✅

See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for detailed cost breakdown.

---

## 📞 Support

- **Issues**: https://github.com/yourusername/crmsync-extension/issues
- **Email**: support@crmsync.com
- **Render Support**: https://render.com/support
- **Sentry Docs**: https://docs.sentry.io

---

## 📜 License

Proprietary - CRMSYNC

See [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md) for usage terms.

---

## 🎉 What's New in v1.0.0

- ✅ **Winston Logging**: Structured production logging
- ✅ **Sentry Integration**: Real-time error tracking
- ✅ **HTTPS Redirect**: Automatic in production
- ✅ **GDPR Endpoints**: Data export, deletion, summary
- ✅ **Stricter Rate Limits**: Production-ready values
- ✅ **Sync Rate Limiting**: Prevent abuse of data-heavy ops
- ✅ **Production Scripts**: Automated setup and deployment
- ✅ **Terms of Service**: Legal compliance documentation
- ✅ **Graceful Shutdown**: Clean server termination

---

**Ready for Production! 🚀**

Follow [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) to deploy securely.

---

*Last Updated: December 15, 2025*  
*CRMSYNC Backend API v1.0.0*
