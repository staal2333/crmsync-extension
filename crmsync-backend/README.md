# CRMSYNC Backend API

Backend server for CRMSYNC Chrome Extension with authentication and cross-platform data synchronization.

## Features

- 🔐 **Authentication**: Email/password + Google OAuth
- 🔄 **Real-time Sync**: Incremental and full sync support
- 📊 **Contact Management**: CRUD operations for contacts
- ⚙️ **Settings Sync**: Cross-device settings synchronization
- 🔒 **Security**: JWT tokens, rate limiting, CORS protection
- 💾 **PostgreSQL Database**: Reliable data storage

## Quick Start

### Prerequisites

- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crmsync
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secrets (generate strong random strings)
JWT_SECRET=your_jwt_secret_here
REFRESH_TOKEN_SECRET=your_refresh_secret_here

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

### 3. Create Database

```sql
CREATE DATABASE crmsync;
```

### 4. Run Migrations

```bash
npm run migrate
```

### 5. Start Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will start at `http://localhost:3000`

## API Endpoints

### Authentication

```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login with email/password
POST   /api/auth/google            - Login with Google OAuth
POST   /api/auth/refresh           - Refresh access token
GET    /api/auth/me                - Get current user
POST   /api/auth/logout            - Logout
DELETE /api/auth/account           - Delete account
```

### Sync

```
POST   /api/sync/full              - Full synchronization
POST   /api/sync/incremental       - Incremental sync
GET    /api/sync/changes           - Get changes since timestamp
GET    /api/sync/status            - Get sync status
```

### Contacts

```
GET    /api/contacts               - List contacts (paginated)
GET    /api/contacts/:id           - Get single contact
POST   /api/contacts               - Create contact
PUT    /api/contacts/:id           - Update contact
DELETE /api/contacts/:id           - Delete contact (soft delete)
POST   /api/contacts/bulk          - Bulk create/update contacts
```

### Settings

```
GET    /api/settings               - Get user settings
PUT    /api/settings               - Update user settings
```

## Authentication

Protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Access tokens expire after 15 minutes. Use the refresh token endpoint to get a new access token.

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins and redirect URIs
6. Copy Client ID and Client Secret to `.env`

For Chrome Extension:
- Add `chrome-extension://YOUR_EXTENSION_ID` to authorized origins

## Database Schema

See `src/migrations/001_initial_schema.sql` for complete schema.

Key tables:
- `users` - User accounts
- `contacts` - Contact information
- `email_messages` - Email activity tracking
- `user_settings` - User preferences
- `sync_metadata` - Sync state tracking

## Security Features

- **Rate Limiting**: 100 requests/15min per user, 10 auth attempts/15min
- **JWT Authentication**: Short-lived access tokens + refresh tokens
- **Password Hashing**: bcrypt with salt factor 12
- **CORS Protection**: Configurable allowed origins
- **Helmet**: Security headers
- **Input Validation**: express-validator
- **SQL Injection Prevention**: Parameterized queries

## Development

### Project Structure

```
crmsync-backend/
├── src/
│   ├── config/          # Configuration files
│   ├── middleware/      # Express middleware
│   ├── migrations/      # Database migrations
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.js        # Main entry point
├── .env                 # Environment variables
├── .gitignore
├── package.json
└── README.md
```

### Testing

```bash
# Run tests (add tests first)
npm test

# Test health endpoint
curl http://localhost:3000/health
```

### Useful Commands

```bash
# Check database connection
psql -U postgres -d crmsync

# View logs in development
npm run dev

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Deployment

### Deploy to Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Create project: `railway init`
4. Add PostgreSQL: `railway add postgresql`
5. Set environment variables: `railway variables set`
6. Deploy: `railway up`

### Deploy to Render

1. Create account at [render.com](https://render.com)
2. Create PostgreSQL database
3. Create Web Service
4. Connect GitHub repo
5. Set environment variables
6. Deploy

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
DB_HOST=your_production_db_host
DB_PORT=5432
DB_NAME=crmsync_production
DB_USER=production_user
DB_PASSWORD=strong_production_password
JWT_SECRET=generate_strong_random_string_64_chars
REFRESH_TOKEN_SECRET=different_strong_random_string_64_chars
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_secret
ALLOWED_ORIGINS=chrome-extension://YOUR_EXTENSION_ID,https://yourdomain.com
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U postgres -d crmsync -c "SELECT 1"
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Migration Errors

```bash
# Drop and recreate database
dropdb crmsync
createdb crmsync
npm run migrate
```

## License

MIT

## Support

For issues or questions, open an issue on GitHub.

