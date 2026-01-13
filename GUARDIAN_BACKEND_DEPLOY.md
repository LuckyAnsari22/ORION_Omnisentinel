# Guardian AI Backend - Render Deployment Guide

## Quick Deploy to Render

### Step 1: Prepare for Deployment

The backend is ready to deploy with these files:
- `app.py` - Main Flask application
- `requirements.txt` - Python dependencies
- `camera_service.py` - Fall detection service
- `notifier.py` - Notification system

### Step 2: Deploy to Render

**Option A: Deploy from GitHub (Recommended)**

1. Go to [render.com](https://render.com)
2. Sign in or create account
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository: `LuckyAnsari22/ai-assistant-platform`
5. Configure:
   - **Name:** `guardian-ai-backend`
   - **Region:** Choose closest to you (e.g., Singapore, Oregon)
   - **Branch:** `main`
   - **Root Directory:** `guardian-ai`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120`

6. **Environment Variables** (click "Advanced"):
   ```
   FLASK_ENV=production
   PYTHON_VERSION=3.11
   ```

7. Click **"Create Web Service"**

8. Wait for deployment (takes 2-5 minutes)

9. **Copy your backend URL** (will be like: `https://guardian-ai-backend-xxxx.onrender.com`)

**Option B: Manual Deploy (if no GitHub)**

1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Choose **"Deploy an existing image from a registry"** or **"Public Git repository"**
4. Enter repository URL or upload code
5. Follow same configuration as Option A above

### Step 3: Test Backend Deployment

After deployment completes, test it:

```bash
curl https://your-backend-url.onrender.com/api/status
```

Should return: `{"status":"running"}`

### Step 4: Update Frontend with Backend URL

After backend is deployed, update Guardian AI frontend:

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select the `frontend` project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name:** `VITE_GUARDIAN_API_URL`
   - **Value:** `https://your-backend-url.onrender.com`
   - **Environment:** Production

5. Go to **Deployments** tab
6. Click **"Redeploy"** on the latest deployment

### Step 5: Update CORS in Backend

The backend needs to allow requests from your frontend. Update `app.py`:

```python
from flask_cors import CORS

CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://frontend-chi-khaki-51.vercel.app",
            "http://localhost:5173",
            "http://localhost:5174"
        ]
    }
})
```

Then redeploy backend on Render (it will auto-redeploy on git push).

## Important Notes

### Camera Access Limitation

⚠️ **The backend won't have camera access on Render** because cloud servers don't have webcams.

**For Hackathon Demo:**
- The backend API will work (status, logs, history endpoints)
- The video feed endpoint will not work (no camera)
- Frontend will show "ESTABLISHING FEED..." message
- This is perfect for demonstrating the architecture and UI

**For Live Camera Demo:**
- Run backend locally: `python app.py`
- Use ngrok to expose it: `ngrok http 5001`
- Update frontend with ngrok URL

### Free Tier Limitations

Render free tier:
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month free

## Troubleshooting

### Build Fails
- Check Python version is 3.11
- Verify requirements.txt has all dependencies
- Check build logs in Render dashboard

### Backend Returns 500 Error
- Check Render logs for Python errors
- Verify environment variables are set
- Check CORS configuration

### Frontend Can't Connect
- Verify CORS allows frontend domain
- Check backend URL in frontend env vars
- Test backend health endpoint directly

## Health Check Endpoints

Test these after deployment:

```bash
# Status check
curl https://your-backend-url.onrender.com/api/status

# System logs
curl https://your-backend-url.onrender.com/api/system_logs

# Fall history
curl https://your-backend-url.onrender.com/api/history
```

All should return JSON responses.

## Next Steps After Deployment

1. ✅ Backend deployed to Render
2. ✅ Frontend updated with backend URL
3. ✅ CORS configured
4. ✅ Test all API endpoints
5. ✅ Verify frontend connects to backend
6. ✅ Demo ready for hackathon!
