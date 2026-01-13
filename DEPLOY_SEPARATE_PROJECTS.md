# 🚀 CORRECT DEPLOYMENT GUIDE - 3 Separate Projects

## ✅ The Right Way to Deploy

Deploy each app as a **separate Vercel project**, then link them with buttons.

---

## 📋 **STEP-BY-STEP DEPLOYMENT**

### **Project 1: Main Frontend (3D Landing Page)**

#### **Vercel Dashboard Settings:**
```
Project Name: ai-assistant-platform
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node Version: 18.x
```

#### **Environment Variables:**
```
NONE REQUIRED
```

#### **Deploy:**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. Set Root Directory to `frontend`
4. Click Deploy
5. **Note the URL:** e.g., `https://ai-assistant-platform.vercel.app`

---

### **Project 2: Visualky (Visual Intelligence)**

#### **Vercel Dashboard Settings:**
```
Project Name: visualky
Framework Preset: Vite
Root Directory: visualky
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node Version: 18.x
```

#### **Environment Variables:**
```
VITE_GEMINI_API_KEY=AIzaSyCC0S8qPy3CeNhfHv7cNf0Mk-JArzJ_66Y
VITE_GROQ_API_KEY=your_groq_key_here
VITE_REPLICATE_API_KEY=your_replicate_key_here
```

#### **Deploy:**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import same repository
3. Set Root Directory to `visualky`
4. Add environment variables
5. Click Deploy
6. **Note the URL:** e.g., `https://visualky.vercel.app`

---

### **Project 3: Guardian AI Frontend**

#### **Vercel Dashboard Settings:**
```
Project Name: guardian-ai-frontend
Framework Preset: Vite
Root Directory: guardian-ai/frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node Version: 18.x
```

#### **Environment Variables:**
```
NONE REQUIRED
```

#### **Deploy:**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import same repository
3. Set Root Directory to `guardian-ai/frontend`
4. Click Deploy
5. **Note the URL:** e.g., `https://guardian-ai-frontend.vercel.app`

---

## 🔗 **AFTER ALL 3 ARE DEPLOYED**

### **Update Main Frontend with Real URLs:**

You'll have 3 URLs like:
- Main: `https://ai-assistant-platform-xyz.vercel.app`
- Visualky: `https://visualky-abc.vercel.app`
- Guardian: `https://guardian-ai-def.vercel.app`

#### **Add These to Main Frontend:**

1. Go to Main Frontend project in Vercel
2. Settings → Environment Variables
3. Add:
```
VITE_VISUALKY_URL=https://visualky-abc.vercel.app
VITE_GUARDIAN_URL=https://guardian-ai-def.vercel.app
```
4. Redeploy main frontend

---

## ✅ **FINAL RESULT**

### **Your Platform URLs:**
```
Landing Page:  https://ai-assistant-platform.vercel.app
  ↓ Click "INITIATE VISUALKY"
Visualky:      https://visualky.vercel.app
  
  ↓ Click "INITIATE GUARDIAN"
Guardian AI:   https://guardian-ai-frontend.vercel.app
```

---

## 📊 **Deployment Summary**

| Project | Root Directory | Environment Variables | URL |
|---------|---------------|----------------------|-----|
| **Main Frontend** | `frontend` | None | Main landing page |
| **Visualky** | `visualky` | Gemini, Groq, Replicate | Visual intelligence |
| **Guardian AI** | `guardian-ai/frontend` | None | Fall detection |

---

## 🎯 **Quick Checklist**

- [ ] Deploy Main Frontend (root: `frontend`)
- [ ] Deploy Visualky (root: `visualky`) with API keys
- [ ] Deploy Guardian AI (root: `guardian-ai/frontend`)
- [ ] Note all 3 deployment URLs
- [ ] Add URLs to Main Frontend environment variables
- [ ] Redeploy Main Frontend
- [ ] Test all links work

---

## 🐛 **Why This Works (and Monorepo Didn't)**

**Monorepo Issues:**
- ❌ Complex routing configuration
- ❌ Build path conflicts
- ❌ 404 errors on sub-routes
- ❌ Hard to debug

**Separate Projects:**
- ✅ Simple and reliable
- ✅ Each app builds independently
- ✅ Easy to update individual apps
- ✅ No routing conflicts
- ✅ Works perfectly

---

## 🚀 **Deploy Now!**

1. **Main Frontend** - Deploy from `frontend` directory
2. **Visualky** - Deploy from `visualky` directory (add API keys!)
3. **Guardian AI** - Deploy from `guardian-ai/frontend` directory
4. **Link them** - Add URLs to main frontend
5. **Done!** ✅

---

**This is the correct, working approach!** 🎉
