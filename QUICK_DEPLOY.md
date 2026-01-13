# 🚀 Quick Deploy - AI Assistant Platform

## Fastest Way to Deploy (5 minutes)

### Prerequisites
- GitHub account
- Vercel account (free)
- Render account (free) - optional for Guardian backend

---

## 🎯 One-Click Deploy

### Step 1: Deploy to Vercel (All Frontends)

Click these buttons in order:

#### 1. Main Platform (3D Orchestrator)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/ai-assistant-platform&project-name=ai-assistant-platform&root-directory=frontend)

#### 2. Visualky
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/ai-assistant-platform&project-name=visualky&root-directory=visualky)

#### 3. Guardian AI Frontend
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/ai-assistant-platform&project-name=guardian-ai-frontend&root-directory=guardian-ai/frontend)

---

## 💻 Command Line Deploy (Recommended)

### Install Vercel CLI
```bash
npm install -g vercel
```

### Login
```bash
vercel login
```

### Deploy Everything
```bash
# Windows
deploy-all.bat

# Mac/Linux
chmod +x deploy-all.sh
./deploy-all.sh
```

---

## 🎬 For Hackathon Demo (No Backend Needed)

If you just want to show the UI without live camera:

1. **Deploy frontends only** (steps above)
2. **Use demo mode** - Guardian will show mock data
3. **Present the 3D interface** - fully functional

This is perfect for:
- Hackathon presentations
- Portfolio showcases
- Initial demos

---

## 🔴 Live Camera Demo (Local Backend)

For live fall detection demo:

### 1. Keep backend running locally
```bash
cd guardian-ai
python app.py
```

### 2. Expose with ngrok
```bash
# Install ngrok from https://ngrok.com
ngrok http 5001
```

### 3. Update frontend
Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and update in:
- `guardian-ai/frontend/src/components/Dashboard.jsx`
- `guardian-ai/frontend/src/components/History.jsx`
- `guardian-ai/frontend/src/components/Settings.jsx`

Replace:
```javascript
const API_BASE_URL = 'http://localhost:5001';
```

With:
```javascript
const API_BASE_URL = 'https://abc123.ngrok.io';
```

### 4. Redeploy frontend
```bash
cd guardian-ai/frontend
vercel --prod
```

---

## ✅ Verification

After deployment, test these URLs:

- Main Platform: `https://your-app.vercel.app`
- Guardian AI: `https://your-app.vercel.app/guardian`
- Visualky: `https://your-app.vercel.app/visualky`

---

## 🎉 You're Live!

Your AI Assistant Platform is now deployed and accessible worldwide!

### Share Your Demo
```
🌐 Live Demo: https://your-app.vercel.app
🛡️ Guardian AI: https://your-app.vercel.app/guardian
👁️ Visualky: https://your-app.vercel.app/visualky
```

---

## 📊 Next Steps

1. **Custom Domain**: Add your domain in Vercel dashboard
2. **Analytics**: Enable Vercel Analytics
3. **Monitoring**: Set up error tracking
4. **SSL**: Automatic with Vercel (already done!)

---

## 🐛 Troubleshooting

### Build fails?
```bash
# Clear cache and retry
vercel --force
```

### 3D scene not loading?
- Check browser console for errors
- Ensure WebGL is supported
- Try fallback buttons

### Guardian not connecting?
- Verify ngrok is running (for local backend)
- Check CORS settings
- Confirm API URLs are updated

---

## 💡 Pro Tips

1. **Test locally first**: Run `launch-platform.bat` before deploying
2. **Check build logs**: Use `vercel logs` to debug
3. **Use environment variables**: Store API keys in Vercel dashboard
4. **Enable preview deployments**: Test changes before production

---

**Need help? Check `DEPLOYMENT_GUIDE.md` for detailed instructions!**
