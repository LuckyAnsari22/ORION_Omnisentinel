# AI Assistant — Scalable AI Platform

> **A hackathon-winning platform that orchestrates multiple intelligent AI systems under one immersive 3D interface.**

## 🌐 Live Deployment (Production)

| Component | URL | Status |
|-----------|-----|--------|
| **Main Platform** (3D Landing) | [**https://omnisentinel-main.vercel.app**](https://omnisentinel-main.vercel.app) | ✅ Live |
| **Guardian AI** (Fall Detection) | [https://omnisentinel-guardian.vercel.app](https://omnisentinel-guardian.vercel.app) | ✅ Live |
| **Visualky** (Visual Intelligence) | [https://visualky.vercel.app](https://visualky.vercel.app) | ✅ Live |

---

## 🎯 What is AI Assistant?

**AI Assistant** is not a single AI model.  
It is a **scalable AI platform** designed to host multiple intelligent systems under one immersive interface.  
Each system operates independently, exactly how real-world AI products are built.

### Phase-1 Systems

1. **Guardian AI** — Fall Detection System for elderly care
2. **Visualky** — Visual Intelligence Assistant for accessibility

---

## 🏗️ Architecture

```
AI-Assistant/
│
├── 🌌 frontend/          # 3D Orchestrator (React + Three.js)
│   └── Immersive landing experience with voice navigation
│
├── 🛡️ guardian-ai/       # Independent System 1
│   └── Fall detection with real-time alerts
│
├── 👁️ visualky/          # Independent System 2
│   └── Visual intelligence and scene understanding
│
└── 🔀 nginx.conf         # Production routing
```

### Why This Architecture?

- **Micro-Frontend Pattern** — Real-world scalability (like Spotify, Uber)
- **Zero Coupling** — Each AI system deploys/scales independently
- **Production-Ready** — Not a prototype, a platform
- **Extensible** — Add new AI systems without refactoring

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.8+
- npm or yarn

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd ai-assistant

# 2. Setup Frontend (3D Orchestrator)
cd frontend
npm install
npm run dev
# Runs on http://localhost:5174

# 3. Setup Guardian AI
cd ../guardian-ai
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5001

# 4. Setup Visualky
cd ../visualky
npm install
npm run dev
# Runs on http://localhost:5173
```

### Access Points

- **Landing Page**: http://localhost:5174
- **Guardian AI**: http://localhost:5174/guardian
- **Visualky**: http://localhost:5174/visualky

---

## 🌌 Features

### Immersive 3D Landing

- **Living AI Core** — Breathing, interactive neural sphere
- **Feature Nodes** — Orbiting AI system modules
- **Cinematic Transitions** — Smooth camera animations
- **60fps Performance** — Optimized rendering

### Voice Navigation

- "Open Guardian AI" → Navigate to Guardian
- "Launch Visualky" → Navigate to Visualky
- "Go back" → Return to landing

### Independent Systems

Each AI system:
- Runs on its own port
- Has its own dependencies
- Scales independently
- Integrates seamlessly

---

## 🛠️ Technology Stack

### Frontend (3D Orchestrator)
- React 18 + TypeScript
- Vite (fast HMR)
- React Three Fiber (declarative Three.js)
- @react-three/drei (3D helpers)
- @react-three/postprocessing (effects)
- GSAP (animations)
- Zustand (state management)
- Annyang (voice commands)

### Backend Systems
- **Guardian AI**: Flask, OpenCV, TensorFlow
- **Visualky**: React, MediaPipe, Gemini API

### Orchestration
- React Router (client-side routing)
- Nginx (production reverse proxy)
- Docker Compose (optional deployment)

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── AICore.tsx           # Central 3D brain
│   │   ├── FeatureNode.tsx      # Orbiting AI modules
│   │   ├── ParticleRing.tsx     # Particle effects
│   │   ├── Scene.tsx            # Three.js orchestrator
│   │   └── VoiceCommand.tsx     # Voice navigation
│   ├── pages/
│   │   ├── Landing.tsx          # 3D landing experience
│   │   └── SystemProxy.tsx      # AI system integration
│   ├── shaders/
│   │   ├── coreGlow.frag        # Core shader effects
│   │   └── nodeParticles.vert   # Node particle system
│   ├── store/
│   │   └── appStore.ts          # Global state
│   └── App.tsx
└── package.json
```

---

## 🎬 Demo Script (30 seconds)

> "Meet **AI Assistant** — a platform that orchestrates multiple intelligent systems.
> 
> This is Guardian AI, our fall detection system. Notice the seamless integration.
> 
> [Voice command: "Go back"]
> 
> Each system runs independently, scales independently.
> 
> This is how real AI products are built — modular, scalable, immersive.
> 
> **AI Assistant. Not a project. A platform.**"

---

## 🏆 What Makes This Hackathon-Winning?

1. **Memorable UX** — Judges remember the 3D experience
2. **Technical Depth** — Shows distributed systems knowledge
3. **Real-World Architecture** — Production-ready design
4. **Polish** — Every detail considered
5. **Scalability** — Built for growth, not just demo

---

## 📝 License

MIT License — Built for innovation

---

## 👥 Team

Built by **Team Outliers** for hackathon excellence.

---

**AI Assistant. Not a project. A platform.**
