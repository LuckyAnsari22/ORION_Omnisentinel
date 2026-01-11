# 🚀 LocalLens - Quick Start Guide

## ⚡ 5-Minute Setup

### Prerequisites
- Node.js 18+ installed
- npm or yarn
- Modern browser (Chrome 100+ recommended)

### Installation

```bash
# Navigate to project
cd d:\visualky

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at: `http://localhost:5173`

## 🎮 First Time Usage

1. **Allow Camera Access**
   - Click "Allow" when browser asks for camera permission
   - Wait for camera to initialize

2. **Understand the Interface**
   - Yellow button (center): Capture photo
   - Blue microphone button (left): Voice commands
   - Green button (right): Change analysis mode
   - Dark text on white background: High contrast accessibility

3. **Try Voice Commands**
   - Say "Help" to hear available commands
   - Say "Describe scene" to analyze what you're looking at
   - Say "Read text" to detect and read text

4. **Explore Settings**
   - Click "Settings" button
   - Adjust speech rate, pitch, vibration
   - Try different languages
   - Enable/disable features

## 🧪 Testing the Application

### Test Voice Recognition
```bash
# Speak: "Describe scene"
# Expected: Camera captures and analyzes
```

### Test Camera
```bash
# Point camera at objects
# Click yellow button to capture
# App analyzes and describes
```

### Test Settings
```bash
# Click Settings
# Change speech rate to 0.5x (slow)
# Settings auto-save to browser storage
```

### Test Offline Mode
```bash
# Open DevTools (F12)
# Network tab → Throttle to "Offline"
# App continues to work
```

## 📊 Verify Build

```bash
# Check production build
npm run build

# Preview production build
npm run preview
```

Expected output:
```
dist/index.html              0.46 kB
dist/assets/index-*.css     24.81 kB (gzipped: 5.29 kB)
dist/assets/index-*.js     432.07 kB (gzipped: 134.83 kB)
✓ built in 3.49s
```

## 🔧 Troubleshooting

### Camera Not Working
```
1. Check browser permissions
2. Ensure HTTPS or localhost
3. Try different browser
4. Check if camera is in use elsewhere
```

### Voice Not Working
```
1. Check microphone permissions
2. Ensure quiet environment
3. Try different browser
4. Check microphone levels
```

### Settings Not Saving
```
1. Check browser LocalStorage enabled
2. Clear browser cache
3. Try private/incognito mode
4. Check IndexedDB in DevTools
```

## 📱 Mobile Testing

### On Mobile Device
```bash
# Get your computer's IP
ipconfig getifaddr en0  # macOS
hostname -I             # Linux
ipconfig               # Windows (look for IPv4)

# Run dev server with network access
npm run dev -- --host

# Visit from phone
http://YOUR_IP:5173
```

### Mobile Features
- ✅ Touch capture button
- ✅ Voice commands work
- ✅ Full screen camera
- ✅ Responsive design
- ✅ Vibration feedback

## 🎯 Key Features to Test

### 1. Scene Description
```
1. Point camera at object (table, lamp, person)
2. Click yellow capture button
3. Wait 2-3 seconds for analysis
4. Listen to description
5. Check text display
```

### 2. Voice Commands
```
1. Click microphone button
2. Say "Describe scene"
3. App captures and analyzes
4. Hear AI response
```

### 3. Mode Switching
```
1. Click green button (right)
2. Mode changes: description → text → object → color → navigation
3. Current mode displayed at bottom
4. Capture uses appropriate analysis mode
```

### 4. Settings
```
1. Navigate to Settings page
2. Adjust any slider
3. Click back to Camera
4. Settings persist across sessions
```

## 🎓 Understanding the Architecture

### AI Processing
```
Camera Feed
    ↓
MediaPipe (Object Detection)
    ↓
Google Gemini Nano (Understanding)
    ↓
Voice Output (Text-to-Speech)
```

### Voice Processing
```
Microphone
    ↓
Web Speech API (Recognition)
    ↓
Command Parser
    ↓
Action Handler
```

### Storage
```
User Settings → Browser LocalStorage
Analysis History → IndexedDB
Cached Models → IndexedDB
```

## 📚 Project Files Structure

```
src/
├── components/          # React components
│   ├── Camera/         # Camera interface
│   └── Accessibility/  # Voice & accessibility
├── hooks/              # React hooks
│   ├── useCamera.ts
│   ├── useVoice.ts
│   └── useOfflineStorage.ts
├── pages/              # Page components
│   ├── Home.tsx
│   ├── Camera.tsx
│   ├── Settings.tsx
│   └── Demo.tsx
├── services/           # Business logic
│   ├── aiService.ts    # Gemini Nano
│   ├── visionService.ts # MediaPipe
│   └── storageService.ts # IndexedDB
└── utils/              # Utilities
    └── spatialDescriptions.ts
```

## 🐛 Debug Mode

### Enable Verbose Logging
```javascript
// In browser console
localStorage.setItem('DEBUG', 'locallens:*')
location.reload()
```

### Check Storage
```javascript
// View all stored data
const data = await indexedDB.databases()
console.log(data)

// Clear all data
localStorage.clear()
await indexedDB.deleteDatabase('LocalLensDB')
```

### Monitor Network
```
DevTools → Network tab
Expect: 0 requests to cloud services
All processing local only
```

## 🚀 Ready to Launch

You now have:
- ✅ Working camera interface
- ✅ Voice recognition and synthesis
- ✅ AI-powered scene understanding
- ✅ Offline functionality
- ✅ Full accessibility features
- ✅ Settings customization
- ✅ Complete documentation

## 📞 Common Questions

**Q: Does it need internet?**
A: No! Everything works offline.

**Q: Is my camera data saved?**
A: No! Camera feed is never stored.

**Q: Can I use voice?**
A: Yes! Click microphone or say commands.

**Q: Where are settings saved?**
A: Browser LocalStorage (on your device).

**Q: What languages are supported?**
A: 15+ via Gemini Nano settings.

**Q: Can I customize voice speed?**
A: Yes! Settings page has voice controls.

## 🎉 Next Steps

1. **Explore the App**
   - Try all voice commands
   - Test different modes
   - Adjust settings

2. **Test Accessibility**
   - Use keyboard only (Tab to navigate)
   - Try with screen reader
   - Test high contrast mode

3. **Build for Production**
   ```bash
   npm run build
   npm run preview
   ```

4. **Deploy**
   - Upload `dist/` folder to hosting
   - Enable HTTPS
   - Test on mobile device

---

**Happy hacking! 🚀**

For detailed documentation, see:
- [README.md](./README.md) - Full project documentation
- [DEVELOPMENT_SUMMARY.md](./DEVELOPMENT_SUMMARY.md) - What was built
- [src/services/aiService.ts](./src/services/aiService.ts) - AI documentation

*LocalLens: See the world through AI.*
