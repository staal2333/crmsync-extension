@echo off
echo 🚀 CRMSYNC Quick Setup Script (Windows)
echo ================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js 16+ from https://nodejs.org/
    exit /b 1
)

echo ✅ Node.js is installed
node --version
echo.

REM Install dependencies if not already installed
if not exist "node_modules\" (
    echo 📦 Installing dependencies...
    call npm install
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo ⚠️  .env file not found!
    echo Creating .env from template...
    (
        echo # Server Configuration
        echo NODE_ENV=development
        echo PORT=3000
        echo API_URL=http://localhost:3000
        echo.
        echo # Database Configuration
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=crmsync
        echo DB_USER=postgres
        echo DB_PASSWORD=postgres
        echo.
        echo # JWT Secrets
        echo JWT_SECRET=dev_jwt_secret_key_change_in_production_12345678901234567890
        echo JWT_EXPIRES_IN=15m
        echo REFRESH_TOKEN_SECRET=dev_refresh_secret_key_different_67890123456789012345
        echo REFRESH_TOKEN_EXPIRES_IN=7d
        echo.
        echo # Google OAuth
        echo GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
        echo GOOGLE_CLIENT_SECRET=your_google_client_secret
        echo.
        echo # Rate Limiting
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo.
        echo # CORS
        echo ALLOWED_ORIGINS=http://localhost:3000,chrome-extension://
    ) > .env
    echo ✅ Created .env file
    echo.
)

echo 📊 Setting up database...
echo Please make sure PostgreSQL is installed and running!
echo.
echo Creating database 'crmsync'...
psql -U postgres -c "CREATE DATABASE crmsync;" 2>nul
echo.

REM Run migrations
echo 🔄 Running database migrations...
call npm run migrate

if %ERRORLEVEL% EQU 0 (
    echo ✅ Database migrations completed
) else (
    echo ❌ Migration failed! Make sure PostgreSQL is running.
    echo.
    echo Try:
    echo 1. Start PostgreSQL service
    echo 2. Create database manually: psql -U postgres -c "CREATE DATABASE crmsync;"
    echo 3. Run migrations: npm run migrate
    exit /b 1
)

echo.
echo ================================
echo ✨ Setup Complete!
echo ================================
echo.
echo Next steps:
echo 1. Start the server: npm run dev
echo 2. Install the Chrome extension
echo 3. Add your Extension ID to .env file under ALLOWED_ORIGINS
echo 4. Restart the server
echo.
echo Server will run at: http://localhost:3000
echo Test with: curl http://localhost:3000/health
echo.
pause

