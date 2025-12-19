#!/bin/bash

echo "🚀 CRMSYNC Backend - Production Setup Script"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Generate secure secrets
echo -e "${YELLOW}1️⃣  Generating secure JWT secrets...${NC}"
echo ""

if command -v openssl &> /dev/null; then
    JWT_SECRET=$(openssl rand -hex 64)
    REFRESH_SECRET=$(openssl rand -hex 64)
    
    echo -e "${GREEN}✅ Secrets generated successfully!${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${YELLOW}⚠️  COPY THESE TO RENDER ENVIRONMENT VARIABLES:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "JWT_SECRET=$JWT_SECRET"
    echo ""
    echo "REFRESH_TOKEN_SECRET=$REFRESH_SECRET"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
else
    echo -e "${RED}❌ OpenSSL not found. Using Node.js...${NC}"
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    
    echo -e "${GREEN}✅ Secrets generated!${NC}"
    echo ""
    echo "JWT_SECRET=$JWT_SECRET"
    echo "REFRESH_TOKEN_SECRET=$REFRESH_SECRET"
    echo ""
fi

# 2. Check for vulnerabilities
echo -e "${YELLOW}2️⃣  Running security audit...${NC}"
npm audit

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ No vulnerabilities found${NC}"
else
    echo -e "${YELLOW}⚠️  Vulnerabilities detected. Run 'npm audit fix' to resolve.${NC}"
fi

echo ""

# 3. Check if production packages are installed
echo -e "${YELLOW}3️⃣  Checking production dependencies...${NC}"

if grep -q "winston" package.json && grep -q "@sentry/node" package.json; then
    echo -e "${GREEN}✅ All production packages installed${NC}"
else
    echo -e "${YELLOW}⚠️  Installing production packages...${NC}"
    npm install winston @sentry/node --save
fi

echo ""

# 4. Provide next steps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo ""
echo "1. Go to Render.com Dashboard"
echo "2. Select your web service"
echo "3. Go to Environment tab"
echo "4. Add/Update these variables:"
echo ""
echo "   NODE_ENV=production"
echo "   JWT_SECRET=<paste generated secret>"
echo "   REFRESH_TOKEN_SECRET=<paste generated secret>"
echo "   LOG_LEVEL=info"
echo ""
echo "5. Optional - Set up Sentry error tracking:"
echo "   - Sign up at https://sentry.io"
echo "   - Create new project"
echo "   - Add to Render: SENTRY_DSN=<your_sentry_dsn>"
echo ""
echo "6. Recommended - Upgrade Render plan:"
echo "   - Starter plan (\$7/mo) for automatic backups"
echo "   - Database Starter (\$7/mo) for daily backups"
echo ""
echo "7. Deploy changes:"
echo "   - Git push to trigger auto-deploy"
echo "   - Or manual deploy in Render dashboard"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}🚀 Your backend is ready for production!${NC}"
echo ""

