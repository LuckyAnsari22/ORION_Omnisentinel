#!/bin/bash

# AI Assistant Platform - Automated Deployment Script
# This script deploys all components to Vercel

set -e  # Exit on error

echo "🚀 AI Assistant Platform - Deployment Script"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo -e "${BLUE}📦 Step 1/4: Deploying Main Frontend (3D Orchestrator)${NC}"
cd frontend
echo "Building and deploying..."
vercel --prod --yes
MAIN_URL=$(vercel --prod 2>&1 | grep -o 'https://[^ ]*' | head -1)
echo -e "${GREEN}✅ Main Frontend deployed${NC}"
echo "URL: $MAIN_URL"
cd ..

echo ""
echo -e "${BLUE}📦 Step 2/4: Deploying Visualky${NC}"
cd visualky
echo "Building and deploying..."
vercel --prod --yes
VISUALKY_URL=$(vercel --prod 2>&1 | grep -o 'https://[^ ]*' | head -1)
echo -e "${GREEN}✅ Visualky deployed${NC}"
echo "URL: $VISUALKY_URL"
cd ..

echo ""
echo -e "${BLUE}📦 Step 3/4: Deploying Guardian AI Frontend${NC}"
cd guardian-ai/frontend
echo "Building and deploying..."
vercel --prod --yes
GUARDIAN_URL=$(vercel --prod 2>&1 | grep -o 'https://[^ ]*' | head -1)
echo -e "${GREEN}✅ Guardian AI Frontend deployed${NC}"
echo "URL: $GUARDIAN_URL"
cd ../..

echo ""
echo -e "${BLUE}📝 Step 4/4: Deployment Summary${NC}"
echo "=============================================="
echo ""
echo -e "${GREEN}🎉 All components deployed successfully!${NC}"
echo ""
echo "📍 Deployment URLs:"
echo "  Main Platform: $MAIN_URL"
echo "  Visualky:      $VISUALKY_URL"
echo "  Guardian AI:   $GUARDIAN_URL"
echo ""
echo "⚠️  Next Steps:"
echo "1. Update Guardian AI frontend to point to backend URL"
echo "2. Deploy Guardian AI backend to Render/Railway"
echo "3. Update CORS settings in backend"
echo "4. Test all routes"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
