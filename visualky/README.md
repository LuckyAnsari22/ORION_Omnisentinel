# VisualKy - AI-Powered Accessibility Assistant

**An intelligent vision system that prioritizes accuracy, honesty, and accessibility.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 Overview

VisualKy is a web-based AI vision assistant designed specifically for **accessibility**. It uses a rigorous 4-stage verification pipeline to provide **accurate, honest, and trustworthy** analysis of visual scenes.

### **Key Features**

- ✅ **Verified Analysis Pipeline** - 4-stage verification ensures accuracy over availability
- ✅ **Spatial Awareness** - Clock positions, angles, distances for precise object location
- ✅ **Color Recognition** - Dominant color extraction for object identification
- ✅ **Honest Uncertainty** - Can say "I don't know" when unsure
- ✅ **Multi-Engine Support** - Gemini, Hugging Face, MediaPipe, local fallback
- ✅ **Offline Capable** - Works without internet using MediaPipe
- ✅ **Voice Interface** - Text-to-speech for blind users
- ✅ **Real-time Camera** - Live video preview and capture

---

## 🚀 Quick Start

### **Prerequisites**

- Node.js 18+ and npm
- Modern web browser with camera access
- (Optional) Gemini API key for best accuracy

### **Installation**

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/visualky.git
cd visualky

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### **Optional: Add Gemini API Key**

For best accuracy, add a Gemini API key:

1. Get a free key: https://aistudio.google.com/app/apikey
2. Create `.env.local`:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
3. Restart the dev server

---

## 🔬 Verified Analysis Pipeline

### **Philosophy**

**Accuracy > Availability | Honesty > Confidence**

Analysis is ONLY valid if:
1. Objects are grounded in pixel evidence
2. Multiple signals agree (or disagreement is handled)
3. Confidence reflects uncertainty honestly
4. The system can explain WHY it believes something
5. The system can say "I don't know"

### **4-Stage Pipeline**

```
STAGE 1: Physical Detection (MediaPipe)
  ↓ Pixel evidence, bounding boxes
  ↓ If nothing detected → STOP
  
STAGE 2: Visual Verification
  ↓ Size, visibility, geometry checks
  ↓ Reject implausible detections
  
STAGE 3: Semantic Confirmation (Optional)
  ↓ Gemini verification (if available)
  ↓ If unavailable → reduce confidence
  
STAGE 4: Consensus & Confidence
  ↓ Multi-stage agreement
  ↓ Honest confidence calculation
  ↓ Can say "I'm not confident"
```

---

## 📊 Spatial & Color Features

### **Spatial Descriptors**

Every detected object includes:
- **Clock Position**: "12 o'clock", "3 o'clock", etc.
- **Angle**: Precise degrees (0-360)
- **Distance**: "very close", "arm's length", "a few feet away", "far"
- **Relative Position**: "upper left", "center", "lower right"
- **Size**: "small", "medium", "large"

### **Color Extraction**

- **Dominant Colors**: Top 3 colors in the object
- **Color Description**: Natural language ("mostly blue with white and black")

### **Example Output**

```
"I think I can see a large mostly blue with white and black person 
at 12 o'clock (top center), arm's length away."
```

---

## 🎯 Use Cases

### **For Blind Users**
- 🔍 **Object Location**: "Where is my phone?" → "3 o'clock, arm's length"
- 🚶 **Navigation**: "What's ahead?" → "Door at 12 o'clock, a few feet away"
- 🛍️ **Shopping**: "Find the red box" → "Red box at 9 o'clock, very close"
- 📚 **Learning**: "What color is this?" → "Mostly blue with white"

### **General Use**
- Scene understanding
- Product identification
- Text reading (with Gemini)
- Hazard detection

---

## 🤖 AI Engines

VisualKy uses multiple AI engines with automatic fallback:

1. **Gemini 2.0 Flash** (Best accuracy, requires API key)
2. **Hugging Face BLIP-2** (Free, no key needed)
3. **MediaPipe Object Detector** (Offline, browser-based)
4. **Smart Fallback** (Always available)

The system automatically cascades through engines and provides honest confidence scores.

---

## 🔧 Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI/ML**:
  - MediaPipe Object Detection
  - Google Gemini API
  - Hugging Face Inference API
  - TensorFlow.js
- **State Management**: Zustand
- **Voice**: Web Speech API

---

## 📁 Project Structure

```
visualky/
├── src/
│   ├── components/
│   │   ├── Accessibility/
│   │   │   └── EnhancedOverlayUI.tsx    # Main UI
│   │   ├── 3D/
│   │   │   └── PerceptionCore.tsx       # 3D orb visualization
│   │   └── AppShell.tsx                 # App container
│   ├── services/
│   │   ├── intelligence/
│   │   │   ├── verifiedAnalysisPipeline.ts  # Core analysis
│   │   │   ├── gemini3VisionEngine.ts       # Gemini integration
│   │   │   └── smartFallbackEngine.ts       # Offline fallback
│   │   └── multiEngineVision.ts         # Multi-engine orchestrator
│   └── main.tsx
├── public/
└── package.json
```

---

## 🎨 UI Features

- **Live Camera Preview** - See what the camera sees
- **Mode Selection** - General, Shopping, Learn, Navigate
- **Voice Commands** - Hands-free operation
- **Keyboard Shortcuts**:
  - `Space` - Toggle voice
  - `C` - Capture image
  - `Esc` - Cancel
  - `Ctrl+/` - Help

---

## 📊 Confidence Scoring

### **Honest Confidence**

- **< 50%**: Not reported (below threshold)
- **50-60%**: "I might be mistaken, but..."
- **60-80%**: "I think..."
- **> 80%**: High confidence (no prefix)

### **Confidence Penalties**

- No Gemini: -15%
- Offline mode: Capped at 60%
- Partial visibility: -10%
- Unusual geometry: -10%

---

## 🔒 Privacy & Security

- ✅ All processing happens in your browser (MediaPipe)
- ✅ Images are NOT stored or sent to servers (except Gemini API if enabled)
- ✅ Camera access requires explicit permission
- ✅ Works completely offline with MediaPipe

---

## 📝 Documentation

- **`VERIFIED_ANALYSIS_COMPLETE.md`** - Analysis pipeline details
- **`SPATIAL_COLOR_FINAL.md`** - Spatial & color features
- **`INTELLIGENCE_UPGRADE.md`** - AI system architecture
- **`QUICK_START_GUIDE.md`** - Quick reference

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **MediaPipe** - Google's ML solutions
- **Gemini API** - Google's generative AI
- **Hugging Face** - Open-source ML models
- **TensorFlow.js** - Browser-based ML

---

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for accessibility**

**Truth beats demos. Accuracy beats confidence.**
