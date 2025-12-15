#!/bin/bash

echo "🚀 CRMSYNC Quick Setup Script"
echo "================================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed!"
    echo "Please install PostgreSQL first:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql"
    echo "  Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

echo "✅ PostgreSQL is installed"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js is installed ($(node --version))"
echo ""

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from template..."
    cat > .env << 'EOF'
# Server Configuration
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crmsync
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=dev_jwt_secret_key_change_in_production_12345678901234567890
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=dev_refresh_secret_key_different_67890123456789012345
REFRESH_TOKEN_EXPIRES_IN=7d

# Google OAuth (Optional - for Google Sign In)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS (Add your Chrome Extension ID after installing)
ALLOWED_ORIGINS=http://localhost:3000,chrome-extension://
EOF
    echo "✅ Created .env file"
    echo ""
fi

# Create database if it doesn't exist
echo "📊 Setting up database..."
echo "Enter your PostgreSQL superuser password (usually blank or 'postgres'):"

# Try to create database
psql -U postgres -c "CREATE DATABASE crmsync;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database 'crmsync' created"
else
    echo "ℹ️  Database 'crmsync' might already exist (this is OK)"
fi

echo ""

# Run migrations
echo "🔄 Running database migrations..."
npm run migrate

if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed"
else
    echo "❌ Migration failed! Check the error above."
    exit 1
fi

echo ""
echo "================================"
echo "✨ Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Start the server: npm run dev"
echo "2. Install the Chrome extension"
echo "3. Add your Extension ID to .env file under ALLOWED_ORIGINS"
echo "4. Restart the server"
echo ""
echo "Server will run at: http://localhost:3000"
echo "Test with: curl http://localhost:3000/health"
echo ""

