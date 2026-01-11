# Quick Start Guide — AI Assistant Platform

## 🚀 Getting Started in 10 Minutes

This guide will help you set up and run the AI Assistant platform locally.

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 18+** ([Download](https://nodejs.org/))
- ✅ **Python 3.8+** ([Download](https://www.python.org/))
- ✅ **npm** or **yarn** (comes with Node.js)
- ✅ **Git** ([Download](https://git-scm.com/))

---

## Step 1: Setup Frontend (3D Orchestrator)

The frontend is already scaffolded and ready to go!

```bash
# Navigate to frontend
cd frontend

# Dependencies are already installed
# If not, run: npm install

# Start development server
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5174/
➜  Network: use --host to expose
```

✅ **Frontend is now running on http://localhost:5174**

---

## Step 2: Setup Guardian AI (Fall Detection)

```bash
# Navigate to guardian-ai directory
cd guardian-ai

# Clone the Guardian AI repository
git clone https://github.com/PANTH217/Guardian-AI-Fall-Detection .

# Install Python dependencies
pip install -r requirements.txt

# Configure to run on port 5001
# Edit app.py or config file to set PORT=5001

# Start the Flask server
python app.py
```

**Expected Output:**
```
* Running on http://127.0.0.1:5001
* Debug mode: on
```

✅ **Guardian AI is now running on http://localhost:5001**

---

## Step 3: Setup Visualky (Visual Intelligence)

```bash
# Navigate to visualky directory
cd visualky

# Clone the Visualky repository
git clone https://github.com/LuckyAnsari22/visualky .

# Install dependencies
npm install

# Configure to run on port 5173
# Edit vite.config.ts or package.json if needed

# Start development server
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

✅ **Visualky is now running on http://localhost:5173**

---

## Step 4: Access the Platform

Open your browser and navigate to:

### 🌌 **http://localhost:5174**

You should see:
1. **Immersive 3D landing page** with AI core
2. **Two orbiting nodes**: Guardian AI and Visualky
3. **Voice command indicator** (bottom right)

---

## Navigation

### Mouse/Touch
- **Hover** over nodes to see them pulse
- **Click** on a node to navigate to that system
- **Drag** to rotate the camera (if OrbitControls enabled)

### Voice Commands
- Say **"Open Guardian AI"** → Navigate to Guardian
- Say **"Launch Visualky"** → Navigate to Visualky
- Say **"Go back"** → Return to landing

---

## Troubleshooting

### Frontend won't start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Port already in use
```bash
# Kill process on port 5174 (Windows)
netstat -ano | findstr :5174
taskkill /PID <PID> /F

# Kill process on port 5174 (Mac/Linux)
lsof -ti:5174 | xargs kill -9
```

### Guardian AI dependencies fail
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

pip install -r requirements.txt
```

### Visualky won't clone
```bash
# If git clone fails, download ZIP from GitHub
# Extract to visualky/ directory
# Then run npm install
```

---

## Verification Checklist

- [ ] Frontend running on port 5174
- [ ] Guardian AI running on port 5001
- [ ] Visualky running on port 5173
- [ ] 3D landing page loads correctly
- [ ] Can click on feature nodes
- [ ] Voice commands work (optional)
- [ ] Systems load in iframe/proxy

---

## Next Steps

### For Development
1. Explore `frontend/src/components/` for 3D components
2. Check `frontend/src/utils/constants.ts` for configuration
3. Modify colors, animations, or add new systems

### For Production
```bash
# Build frontend
cd frontend
npm run build

# Deploy with Docker
cd ..
docker-compose up --build
```

### For Demo
1. Open http://localhost:5174
2. Let the 3D scene load (2-3 seconds)
3. Hover over nodes to show interactivity
4. Click Guardian AI → Show fall detection
5. Use voice command "Go back"
6. Click Visualky → Show visual intelligence
7. Explain the architecture to judges

---

## Performance Tips

### For Low-End Devices
Edit `frontend/src/utils/constants.ts`:
```typescript
export const PERFORMANCE_CONFIG = {
  targetFPS: 30,           // Lower FPS
  enableShadows: false,    // Disable shadows
  enablePostProcessing: false,  // Disable bloom
  particleInstancing: true,
};
```

### For High-End Devices
Keep defaults or increase:
```typescript
export const PERFORMANCE_CONFIG = {
  targetFPS: 60,
  enableShadows: true,
  enablePostProcessing: true,
  particleInstancing: true,
};
```

---

## Support

If you encounter issues:

1. Check `STRUCTURE.md` for architecture details
2. Review `README.md` for comprehensive documentation
3. Inspect browser console for errors
4. Verify all ports are available

---

## Demo Day Checklist

- [ ] All systems running smoothly
- [ ] 3D animations are smooth (60fps)
- [ ] Voice commands tested
- [ ] Backup plan if voice fails (mouse navigation)
- [ ] Demo script memorized (30 seconds)
- [ ] Architecture explanation ready
- [ ] Laptop charged + backup charger
- [ ] Browser cache cleared for fresh demo

---

**You're ready to win! 🏆**

**AI Assistant. Not a project. A platform.**
