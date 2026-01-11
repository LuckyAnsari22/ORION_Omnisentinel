# 🐳 Guardian AI Backend - Render Deployment (Docker)

## ✅ Dockerfile Created!

I've created a `Dockerfile` in the `guardian-ai` directory that will fix your deployment error.

---

## 🚀 Deploy to Render (Updated Instructions)

### **Step 1: Push Dockerfile to GitHub**

```bash
cd d:\final_team_outliers
git add guardian-ai/Dockerfile
git commit -m "Add Dockerfile for Render deployment"
git push
```

### **Step 2: Deploy on Render**

1. **Go to:** [render.com](https://render.com)
2. **Click:** "New +" → "Web Service"
3. **Connect:** Your GitHub repository
4. **Select:** Your repository

### **Step 3: Configure Service**

```
Name: guardian-ai-backend
Region: Choose closest to you (e.g., Singapore)
Branch: main
Root Directory: guardian-ai
Runtime: Docker (it will auto-detect the Dockerfile)
```

**Render will automatically:**
- ✅ Find the Dockerfile
- ✅ Build the Docker image
- ✅ Install all dependencies
- ✅ Start the application

### **Step 4: Instance Type**

```
Instance Type: Free
```

### **Step 5: Environment Variables (Optional)**

Add these if you want:
```
FLASK_ENV=production
PORT=5001
```

### **Step 6: Click "Create Web Service"**

---

## ⏱️ **Deployment Time:**

- **First deployment:** 5-10 minutes (building Docker image)
- **Subsequent deployments:** 2-3 minutes (cached layers)

---

## 📊 **What the Dockerfile Does:**

```dockerfile
1. Uses Python 3.11 slim image
2. Installs system dependencies (OpenCV requirements)
3. Installs Python packages from requirements.txt
4. Copies your application code
5. Exposes port 5001
6. Runs gunicorn server
```

---

## ✅ **After Deployment:**

### **You'll Get a URL:**
```
https://guardian-ai-backend.onrender.com
```

### **Test the Backend:**

```bash
# Health check
curl https://guardian-ai-backend.onrender.com/

# Should return: "Guardian AI Backend is running"
```

---

## ⚠️ **Expected Behavior:**

### **What Will Work:**
- ✅ Backend server runs
- ✅ API endpoints respond
- ✅ `/api/events` - Returns event history
- ✅ `/api/settings` - Returns settings

### **What Won't Work:**
- ❌ `/api/camera/start` - Error: "No camera device"
- ❌ Live camera feed - No physical camera
- ❌ Fall detection - Requires camera

**This is normal!** Cloud servers don't have webcams.

---

## 🔗 **Connect Frontend to Deployed Backend:**

### **Step 1: Update Frontend Code**

Edit `guardian-ai/frontend/src/components/Dashboard.jsx`:

```javascript
// Change this line:
const API_BASE_URL = 'http://localhost:5001';

// To this:
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://guardian-ai-backend.onrender.com';
```

### **Step 2: Add Environment Variable to Vercel**

1. Go to Guardian Frontend project on Vercel
2. Settings → Environment Variables
3. Add:
   ```
   VITE_API_URL=https://guardian-ai-backend.onrender.com
   ```

### **Step 3: Redeploy Frontend**

```bash
vercel --prod
```

---

## 🐛 **Troubleshooting:**

### **If Build Fails:**

Check Render logs for errors. Common issues:

1. **Missing dependencies:**
   - Solution: Update `requirements.txt`

2. **Port binding error:**
   - Solution: Ensure `$PORT` is used in start command

3. **Timeout:**
   - Solution: Increase timeout in Dockerfile (already set to 120s)

### **If Camera Errors Appear:**

This is **expected**! Add error handling:

```python
# In app.py or camera_service.py
try:
    camera = cv2.VideoCapture(0)
    if not camera.isOpened():
        print("WARNING: No camera available (running on cloud)")
except Exception as e:
    print(f"Camera initialization failed: {e}")
```

---

## 📋 **Files Created:**

1. ✅ `guardian-ai/Dockerfile` - Docker configuration
2. ✅ `guardian-ai/dockerignore.txt` - Files to exclude (rename to `.dockerignore`)

---

## 🎯 **Next Steps:**

1. **Rename** `dockerignore.txt` to `.dockerignore`:
   ```bash
   cd guardian-ai
   rename dockerignore.txt .dockerignore
   ```

2. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add Docker support for Render deployment"
   git push
   ```

3. **Deploy on Render** using the instructions above

4. **Update frontend** to use the deployed backend URL

---

## ✅ **Summary:**

- ✅ Dockerfile created
- ✅ Ready to deploy on Render
- ✅ Will fix the "no Dockerfile" error
- ⚠️ Camera still won't work (cloud limitation)

**Your backend will deploy successfully now!** 🚀

---

## 💡 **Remember:**

Even with successful deployment:
- Backend runs ✅
- Camera doesn't work ❌ (cloud servers have no webcams)
- For live demos, use local backend + ngrok

**This is the correct setup for a cloud deployment!**
