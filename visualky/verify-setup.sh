#!/bin/bash

# ============================================
# SETUP VERIFICATION SCRIPT
# ============================================

echo "🔍 Verifying Visualky Hackathon Implementation..."
echo ""

# Check Node.js
echo "✅ Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "   Node version: $NODE_VERSION"
else
    echo "   ❌ Node.js not found. Please install Node.js 16+"
    exit 1
fi

# Check npm
echo "✅ Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "   npm version: $NPM_VERSION"
else
    echo "   ❌ npm not found"
    exit 1
fi

# Check project structure
echo ""
echo "✅ Checking project structure..."

FILES_TO_CHECK=(
    "src/services/intelligence/gemini3VisionEngine.ts"
    "src/services/modeController.ts"
    "src/services/conversationManager.ts"
    "src/services/spatialScanner.ts"
    "src/services/aiServiceOrchestrator.ts"
    "src/services/aiIntegration.ts"
    "src/components/IntelligentInterface.tsx"
    "src/App.tsx"
    "package.json"
)

MISSING_FILES=0
for FILE in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$FILE" ]; then
        echo "   ✓ $FILE"
    else
        echo "   ✗ Missing: $FILE"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -gt 0 ]; then
    echo ""
    echo "❌ Some files are missing. Please run the implementation again."
    exit 1
fi

# Check dependencies
echo ""
echo "✅ Checking key dependencies in package.json..."
if grep -q "@google/generative-ai" package.json; then
    echo "   ✓ @google/generative-ai found"
else
    echo "   ✗ @google/generative-ai missing - run: npm install"
fi

if grep -q "react" package.json; then
    echo "   ✓ react found"
else
    echo "   ✗ react missing"
fi

# Check environment
echo ""
echo "✅ Checking environment configuration..."
if [ -f ".env.local" ]; then
    if grep -q "VITE_GEMINI_API_KEY" .env.local; then
        echo "   ✓ .env.local with API key found"
    else
        echo "   ⚠ .env.local exists but VITE_GEMINI_API_KEY not set"
    fi
else
    echo "   ⚠ .env.local not found"
    echo "   Create .env.local with VITE_GEMINI_API_KEY=your_key"
fi

# Check documentation
echo ""
echo "✅ Checking documentation..."
DOCS=(
    "HACKATHON_IMPLEMENTATION_GUIDE.md"
    "QUICK_START.md"
    "TESTING_GUIDE.ts"
    "IMPLEMENTATION_SUMMARY.md"
)

for DOC in "${DOCS[@]}"; do
    if [ -f "$DOC" ]; then
        echo "   ✓ $DOC"
    else
        echo "   ✗ Missing: $DOC"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ VERIFICATION COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo "1. Get API Key: https://aistudio.google.com/app/apikey"
echo "2. Add to .env.local: VITE_GEMINI_API_KEY=your_key"
echo "3. Run: npm install"
echo "4. Run: npm run dev"
echo ""
echo "📚 Documentation:"
echo "   - QUICK_START.md (5-minute setup)"
echo "   - HACKATHON_IMPLEMENTATION_GUIDE.md (complete guide)"
echo "   - IMPLEMENTATION_SUMMARY.md (overview)"
echo ""
echo "🎯 Ready to demo with: npm run dev"
echo ""
