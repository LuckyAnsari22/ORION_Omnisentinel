# Guardian AI Backend - Render.com Configuration

## Build Command
```
pip install -r requirements.txt
```

## Start Command
```
gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120
```

## Environment Variables

Add these in Render dashboard:

```
FLASK_ENV=production
PORT=5001
CORS_ORIGINS=https://guardian-ai-frontend.vercel.app,https://ai-assistant-platform.vercel.app
PYTHON_VERSION=3.11
```

## Important Notes

⚠️ **Camera Access Limitation**: 
The Guardian AI backend requires webcam access for fall detection. Since cloud servers don't have cameras, you have two options:

### Option 1: Demo Mode (Recommended for Hackathon)
Deploy the frontend only with mock data. The backend can show pre-recorded fall detection events.

### Option 2: Local Backend with ngrok (Best for Live Demos)
1. Keep backend running locally
2. Use ngrok to expose it:
   ```bash
   ngrok http 5001
   ```
3. Update frontend to use ngrok URL

## Deployment Steps

1. **Create Render Account**: Go to [render.com](https://render.com)

2. **New Web Service**: 
   - Click "New +" → "Web Service"
   - Connect GitHub repo or upload code

3. **Configure**:
   - Name: `guardian-ai-backend`
   - Environment: `Python 3`
   - Region: Choose closest to your users
   - Branch: `main`
   - Root Directory: `guardian-ai`

4. **Build Settings**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT`

5. **Environment Variables**: Add all variables listed above

6. **Deploy**: Click "Create Web Service"

## Health Check

After deployment, test the backend:
```bash
curl https://your-app.onrender.com/api/health
```

## Updating Frontend

After backend is deployed, update these files in `guardian-ai/frontend/src/components/`:

**Dashboard.jsx, History.jsx, Settings.jsx**:
```javascript
const API_BASE_URL = 'https://your-app.onrender.com';
```

Then redeploy frontend:
```bash
cd guardian-ai/frontend
vercel --prod
```
