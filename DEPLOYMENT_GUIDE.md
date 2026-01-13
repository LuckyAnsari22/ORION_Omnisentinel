# 🚀 AI Assistant Platform - Deployment Guide

## Overview
This guide will help you deploy the AI Assistant Platform to production using Vercel for frontends and Render/Railway for the Guardian AI backend.

## Architecture
- **Main Frontend**: 3D Orchestrator (Vercel)
- **Guardian AI Frontend**: React Dashboard (Vercel)
- **Guardian AI Backend**: Flask + Python (Render/Railway)
- **Visualky**: Visual Intelligence (Vercel)

---

## 📦 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Render Account** (for Guardian backend): Sign up at [render.com](https://render.com)
3. **Vercel CLI** (optional but recommended):
   ```bash
   npm install -g vercel
   ```

---

## 🎯 Step-by-Step Deployment

### 1️⃣ Deploy Main Frontend (3D Orchestrator)

```bash
# Navigate to frontend directory
cd frontend

# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

**Configuration prompts:**
- Project name: `ai-assistant-platform`
- Framework: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

**After deployment, note the URL** (e.g., `https://ai-assistant-platform.vercel.app`)

---

### 2️⃣ Deploy Visualky

```bash
# Navigate to visualky directory
cd ../visualky

# Deploy to Vercel
vercel --prod
```

**Configuration:**
- Project name: `visualky`
- Framework: `Vite`

**Note the deployment URL** (e.g., `https://visualky.vercel.app`)

---

### 3️⃣ Deploy Guardian AI Frontend

```bash
# Navigate to Guardian frontend
cd ../guardian-ai/frontend

# Deploy to Vercel
vercel --prod
```

**Configuration:**
- Project name: `guardian-ai-frontend`
- Framework: `Vite`

**Note the deployment URL** (e.g., `https://guardian-ai-frontend.vercel.app`)

---

### 4️⃣ Deploy Guardian AI Backend (Python/Flask)

#### Option A: Using Render.com (Recommended)

1. **Go to** [render.com](https://render.com) and create a new **Web Service**

2. **Connect your GitHub repository** or upload the `guardian-ai` folder

3. **Configure the service:**
   - **Name**: `guardian-ai-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Port**: `5001`

4. **Add Environment Variables:**
   ```
   FLASK_ENV=production
   PORT=5001
   ```

5. **Deploy** and note the URL (e.g., `https://guardian-ai-backend.onrender.com`)

#### Option B: Using Railway.app

1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Select `guardian-ai` directory
4. Railway will auto-detect Python and deploy
5. Note the deployment URL

---

### 5️⃣ Update Frontend URLs

After deploying the backend, update the frontend to point to production URLs:

**File: `guardian-ai/frontend/src/components/Dashboard.jsx`**
```javascript
// Replace localhost URLs with production URL
const API_BASE_URL = 'https://guardian-ai-backend.onrender.com';
```

**File: `guardian-ai/frontend/src/components/History.jsx`**
```javascript
const API_BASE_URL = 'https://guardian-ai-backend.onrender.com';
```

**File: `guardian-ai/frontend/src/components/Settings.jsx`**
```javascript
const API_BASE_URL = 'https://guardian-ai-backend.onrender.com';
```

Then redeploy Guardian frontend:
```bash
cd guardian-ai/frontend
vercel --prod
```

---

### 6️⃣ Update Main Frontend Routing

**File: `frontend/vercel.json`**

Update the rewrites with your actual deployment URLs:
```json
{
  "rewrites": [
    {
      "source": "/guardian/:path*",
      "destination": "https://guardian-ai-frontend.vercel.app/:path*"
    },
    {
      "source": "/visualky/:path*",
      "destination": "https://visualky.vercel.app/:path*"
    }
  ]
}
```

Redeploy main frontend:
```bash
cd frontend
vercel --prod
```

---

## 🔧 Quick Deploy Script

I've created a deployment script for you:

```bash
# Run from project root
./deploy-all.sh
```

---

## 🌐 Production URLs

After deployment, your platform will be accessible at:

- **Main Platform**: `https://ai-assistant-platform.vercel.app`
- **Guardian AI**: `https://ai-assistant-platform.vercel.app/guardian`
- **Visualky**: `https://ai-assistant-platform.vercel.app/visualky`

---

## ⚠️ Important Notes

### Guardian AI Backend Limitations
- **Camera Access**: The fall detection system requires webcam access, which won't work on a remote server
- **Solution**: For demos, you have two options:
  1. **Local Backend**: Keep Guardian backend running locally and use ngrok to expose it
  2. **Demo Mode**: Deploy frontend only with mock data for presentation

### Using ngrok for Local Backend (Recommended for Demos)

```bash
# Install ngrok
# Download from https://ngrok.com

# Expose local Guardian backend
ngrok http 5001

# Use the ngrok URL in your deployed frontend
# Example: https://abc123.ngrok.io
```

---

## 🔐 Environment Variables

### Guardian AI Backend (Render/Railway)
```
FLASK_ENV=production
PORT=5001
CORS_ORIGINS=https://guardian-ai-frontend.vercel.app,https://ai-assistant-platform.vercel.app
```

### Visualky (Vercel)
Add these in Vercel dashboard:
```
VITE_GEMINI_API_KEY=your_key_here
VITE_GROQ_API_KEY=your_key_here
VITE_REPLICATE_API_KEY=your_key_here
```

---

## 🐛 Troubleshooting

### Build Failures
```bash
# Clear cache and rebuild
vercel --force

# Check build logs
vercel logs
```

### CORS Issues
Ensure Guardian backend has proper CORS configuration in `app.py`:
```python
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://guardian-ai-frontend.vercel.app",
            "https://ai-assistant-platform.vercel.app"
        ]
    }
})
```

### WebGL Context Loss
If 3D scene crashes on some devices, users can still access systems via fallback buttons.

---

## 📊 Monitoring

- **Vercel Analytics**: Enable in Vercel dashboard
- **Render Logs**: Check at render.com/logs
- **Error Tracking**: Consider adding Sentry

---

## 🎉 Success Checklist

- [ ] Main frontend deployed to Vercel
- [ ] Visualky deployed to Vercel
- [ ] Guardian frontend deployed to Vercel
- [ ] Guardian backend deployed (or ngrok running)
- [ ] All URLs updated in code
- [ ] CORS configured properly
- [ ] Environment variables set
- [ ] Test all routes working
- [ ] 3D scene loads correctly
- [ ] Guardian dashboard accessible
- [ ] Visualky interface functional

---

## 🚀 One-Command Deploy

Run this from project root:

```bash
npm run deploy:all
```

This will:
1. Build all frontends
2. Deploy to Vercel
3. Update URLs automatically
4. Run health checks

---

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all URLs are updated
3. Test CORS configuration
4. Ensure environment variables are set

**Your platform is now ready for the world! 🌍✨**
