# 🚀 LocalLens - Launch Instructions

## If App Won't Open

### Step 1: Check the Dev Server
```
✓ Dev server MUST be running
✓ Terminal should show: "VITE v7.3.1 ready"
✓ URL should be: http://localhost:5173/
```

### Step 2: Clear Browser Cache
```javascript
// In browser console (F12):
localStorage.clear();
location.reload();
```

### Step 3: Try in Different Browser
- Chrome Canary (best for Gemini Nano)
- Firefox
- Edge
- Safari (mobile)

### Step 4: Hard Refresh Browser
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

---

## Direct Access Instructions

### Method 1: Direct URL
```
1. Open browser
2. Copy-paste: http://localhost:5173/
3. Press Enter
4. Wait for page to load (5-10 seconds)
```

### Method 2: Browser Tools
```
1. Open browser DevTools (F12)
2. Go to Console tab
3. Watch for any errors
4. Try hard refresh (Ctrl+Shift+R)
```

### Method 3: Check Server Status
```bash
# In terminal, press 'h' then Enter to see options
# Or run this command:
curl http://localhost:5173/
```

---

## If You See Errors in Console

### Common Errors & Fixes

**Error: "Cannot find module '@mediapipe'"**
```bash
npm install
npm run dev
```

**Error: "Port 5173 already in use"**
```bash
# Kill the process:
lsof -i :5173 | grep node | awk '{print $2}' | xargs kill -9
# Or restart:
npm run dev
```

**Error: "React Router issues"**
```bash
# Clear cache:
rm -rf node_modules/.vite
npm run dev
```

---

## What You Should See

### When App Opens Correctly:
1. ✅ Blue and yellow LocalLens branding
2. ✅ "See the World Through AI" heading
3. ✅ Statistics cards (< 3s, 100% offline, etc.)
4. ✅ Feature cards (Camera, Zap, Globe, Lock)
5. ✅ Buttons: "Start Camera", "Try Demo", "Settings"
6. ✅ Professional footer

### Initial Wait Time:
- 5-10 seconds for React to load
- Then immediate page display
- Camera/voice features load after

---

## Mobile Testing

### On Phone:
```
1. Get your computer IP:
   - Windows: ipconfig
   - Mac: hostname -I
   
2. Start server with network access:
   npm run dev -- --host
   
3. On phone, visit:
   http://YOUR_COMPUTER_IP:5173/
   
4. Allow camera/microphone permissions
```

---

## Debug Commands (Browser Console F12)

```javascript
// Check if app loaded
console.log('React App Status:', window.React ? '✓ Loaded' : '❌ Error')

// Check routing
console.log('Current route:', window.location.pathname)

// Check storage
console.log('LocalStorage:', localStorage.length, 'items')

// Check camera
navigator.mediaDevices.enumerateDevices().then(devices => {
  const cameras = devices.filter(d => d.kind === 'videoinput');
  console.log('Cameras found:', cameras.length);
});

// Show any errors
console.log('Errors:', window.__errors || 'None')
```

---

## Network Issues?

### Check Localhost
```bash
# Test if server responds:
curl -I http://localhost:5173/

# Should return:
# HTTP/1.1 200 OK
# Content-Type: text/html
```

### Port Conflicts
```bash
# See what's using port 5173:
netstat -ano | findstr :5173

# Kill process (replace PID with actual number):
taskkill /PID <PID> /F
```

---

## Still Not Working?

### Try Complete Reset
```bash
# 1. Kill all node processes
taskkill /F /IM node.exe

# 2. Clear everything
rm -rf node_modules
rm package-lock.json

# 3. Reinstall
npm install

# 4. Start fresh
npm run dev
```

### Check Environment
```bash
# Verify Node version (should be 18+)
node --version

# Verify npm version
npm --version

# Check npm cache
npm cache clean --force
```

---

## Expected Behavior

### On First Load:
```
1. Page loads with heading and cards
2. App announces welcome message
3. Camera/Voice features load
4. You can interact with buttons
5. Try "Start Camera" or "Try Demo"
```

### Performance:
```
Load time: 5-10 seconds first time
Subsequent loads: 2-3 seconds
No network requests needed (fully offline)
```

### Accessibility:
```
✓ Can tab through all buttons
✓ Screen reader announces content
✓ High contrast colors visible
✓ Voice feedback working
✓ Keyboard shortcuts work
```

---

## Support Checklist

Before asking for help:
- [ ] Dev server is running
- [ ] URL is http://localhost:5173/
- [ ] Browser cache is cleared
- [ ] Tried hard refresh (Ctrl+Shift+R)
- [ ] Checked browser console (F12)
- [ ] Tried different browser
- [ ] Allowed camera/microphone
- [ ] Network is stable

---

## Quick Links

- **Dev Server URL**: http://localhost:5173/
- **Documentation**: README.md
- **Debug Guide**: OPTIMIZATION_GUIDE.md
- **Console Commands**: DEBUG_CONSOLE.js
- **Implementation**: FINAL_IMPLEMENTATION.md

---

## Still Having Issues?

### Get Full Error Details
```javascript
// In console, enable debug mode:
localStorage.setItem('DEBUG', 'locallens:*');
location.reload();

// View all logs:
const logs = JSON.parse(localStorage.getItem('locallens-logs') || '[]');
console.table(logs);
```

### Export Diagnostics
```javascript
// Export system info:
const info = {
  userAgent: navigator.userAgent,
  online: navigator.onLine,
  timestamp: new Date().toISOString(),
  logs: JSON.parse(localStorage.getItem('locallens-logs') || '[]')
};
console.table(info);
```

---

**LocalLens is ready to use! Visit http://localhost:5173/ now!** 🚀
