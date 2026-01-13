# 🚀 ONE-CLICK DEPLOYMENT GUIDE

## Deploy Entire Platform at Once

This guide shows you how to deploy the entire AI Assistant Platform (all 3 apps) in one go.

---

## 📋 **Prerequisites**

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account** - For repository connection
3. **API Keys** - Get your API keys ready (optional but recommended)

---

## 🎯 **Method 1: GitHub + Vercel (Recommended - Truly One-Click)**

### **Step 1: Push to GitHub**

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - AI Assistant Platform"

# Create repo on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/ai-assistant-platform.git
git branch -M main
git push -u origin main
```

### **Step 2: Deploy on Vercel**

1. **Go to** [vercel.com/new](https://vercel.com/new)

2. **Import Git Repository:**
   - Click "Import Git Repository"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project:**
   ```
   Project Name: ai-assistant-platform
   Framework Preset: Other
   Root Directory: ./
   Build Command: npm run build
   Output Directory: frontend/dist
   Install Command: npm install
   ```

4. **Add Environment Variables:**
   Click "Environment Variables" and add:
   
   ```
   VITE_GEMINI_API_KEY=your_gemini_key
   VITE_GROQ_API_KEY=your_groq_key
   VITE_REPLICATE_API_KEY=your_replicate_key
   ```

5. **Click "Deploy"**

6. **Wait 3-5 minutes** for build to complete

7. **Done!** Your entire platform is live at one URL

---

## 🎯 **Method 2: Vercel CLI (Single Command)**

### **Step 1: Install Dependencies**

```bash
npm install
```

### **Step 2: Create .env File**

```bash
# Copy the example
copy .env.example .env

# Edit .env and add your API keys
```

Your `.env` should look like:
```env
VITE_GEMINI_API_KEY=AIzaSy...your_key_here
VITE_GROQ_API_KEY=gsk_...your_key_here
VITE_REPLICATE_API_KEY=r8_...your_key_here
```

### **Step 3: Deploy Everything**

```bash
# Single command to deploy entire platform
vercel --prod
```

**Answer the prompts:**
```
? Set up and deploy? Y
? Which scope? [Select your account]
? Link to existing project? N
? What's your project's name? ai-assistant-platform
? In which directory is your code located? ./
? Want to override settings? N
```

### **Step 4: Add Environment Variables**

After first deployment:

```bash
# Add each environment variable
vercel env add VITE_GEMINI_API_KEY production
vercel env add VITE_GROQ_API_KEY production
vercel env add VITE_REPLICATE_API_KEY production
```

Then redeploy:
```bash
vercel --prod
```

---

## 📊 **Complete Configuration**

### **Root vercel.json** (Already Created)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "frontend/dist" }
    },
    {
      "src": "visualky/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "visualky/dist" }
    },
    {
      "src": "guardian-ai/frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "guardian-ai/frontend/dist" }
    }
  ],
  "routes": [
    { "src": "/visualky/(.*)", "dest": "/visualky/$1" },
    { "src": "/guardian/(.*)", "dest": "/guardian-ai/frontend/$1" },
    { "src": "/(.*)", "dest": "/frontend/$1" }
  ]
}
```

### **Root package.json** (Already Created)
```json
{
  "name": "ai-assistant-platform",
  "scripts": {
    "build": "npm run build:frontend && npm run build:visualky && npm run build:guardian",
    "build:frontend": "cd frontend && npm install && npm run build",
    "build:visualky": "cd visualky && npm install && npm run build",
    "build:guardian": "cd guardian-ai/frontend && npm install && npm run build"
  }
}
```

---

## 🔑 **Environment Variables Reference**

### **Required for Visualky (Visual Intelligence):**
```
VITE_GEMINI_API_KEY=AIzaSy...
VITE_GROQ_API_KEY=gsk_...
VITE_REPLICATE_API_KEY=r8_...
```

### **Optional for Guardian AI:**
```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

### **How to Get API Keys:**

#### **Gemini API (Google AI):**
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

#### **Groq API:**
1. Go to https://console.groq.com
2. Sign up / Login
3. Go to API Keys
4. Create new key
5. Copy the key

#### **Replicate API:**
1. Go to https://replicate.com/account/api-tokens
2. Create token
3. Copy the token

---

## ✅ **Verification**

After deployment, test:

1. **Main URL:** `https://your-app.vercel.app`
   - Should show 3D landing page
   
2. **Visualky:** `https://your-app.vercel.app/visualky`
   - Should load visual intelligence interface
   
3. **Guardian:** `https://your-app.vercel.app/guardian`
   - Should load fall detection dashboard

---

## 🐛 **Troubleshooting**

### **Build Fails:**
```bash
# Test build locally first
npm run build

# If it works locally, deploy with:
vercel --prod --force
```

### **Environment Variables Not Working:**
```bash
# List current variables
vercel env ls

# Pull environment variables
vercel env pull

# Redeploy
vercel --prod
```

### **Routes Not Working:**
- Check `vercel.json` is in root directory
- Ensure all paths are correct
- Redeploy with `vercel --prod --force`

---

## 🎉 **Success!**

Your entire AI Assistant Platform is now deployed as ONE application!

**Single URL for everything:**
- Landing Page: `https://your-app.vercel.app`
- Visualky: `https://your-app.vercel.app/visualky`
- Guardian: `https://your-app.vercel.app/guardian`

---

## 📞 **Quick Commands**

```bash
# Deploy everything
vercel --prod

# Add environment variable
vercel env add VARIABLE_NAME production

# View logs
vercel logs

# Redeploy
vercel --prod --force
```

---

**That's it! One repository, one deployment, one URL for your entire platform!** 🚀
