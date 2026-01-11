#!/usr/bin/env node

/**
 * LocalLens Debug Console
 * Copy-paste these commands in your browser DevTools console (F12)
 */

// ============================================
// 📊 LOGGING SYSTEM
// ============================================

// View all logs
getAllLogs = () => {
  const logs = JSON.parse(localStorage.getItem('locallens-logs') || '[]');
  console.table(logs);
  return logs;
};

// Get logs by component
getLogsByComponent = (component) => {
  const logs = JSON.parse(localStorage.getItem('locallens-logs') || '[]');
  return logs.filter(l => l.component === component);
};

// Get logs by level
getLogsByLevel = (level) => {
  const logs = JSON.parse(localStorage.getItem('locallens-logs') || '[]');
  return logs.filter(l => l.level === level);
};

// Clear all logs
clearAllLogs = () => {
  localStorage.removeItem('locallens-logs');
  console.log('✓ All logs cleared');
};

// Export logs as JSON
exportLogs = () => {
  const logs = JSON.parse(localStorage.getItem('locallens-logs') || '[]');
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `locallens-logs-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  console.log('✓ Logs exported');
};

// ============================================
// 💾 STORAGE DEBUGGING
// ============================================

// Check localStorage
checkLocalStorage = () => {
  console.log('LocalStorage contents:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const size = new Blob([localStorage.getItem(key)]).size;
    console.log(`  ${key}: ${(size / 1024).toFixed(2)} KB`);
  }
};

// Check IndexedDB
checkIndexedDB = async () => {
  const dbs = await indexedDB.databases();
  console.log('IndexedDB databases:', dbs);
  
  // Get LocalLensDB details
  const request = indexedDB.open('LocalLensDB');
  request.onsuccess = (e) => {
    const db = e.target.result;
    console.log('LocalLensDB Object Stores:', Array.from(db.objectStoreNames));
    db.close();
  };
};

// Get stored preferences
getStoredPreferences = () => {
  const prefs = localStorage.getItem('locallens-settings');
  if (prefs) {
    console.table(JSON.parse(prefs));
  } else {
    console.log('No preferences stored');
  }
};

// Clear all storage
clearAllStorage = async () => {
  localStorage.clear();
  indexedDB.deleteDatabase('LocalLensDB');
  console.log('✓ All storage cleared. Reload page to reinitialize.');
};

// Storage usage
getStorageUsage = async () => {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const percentUsed = (estimate.usage / estimate.quota * 100).toFixed(2);
    console.log(`Storage: ${(estimate.usage / 1024 / 1024).toFixed(2)} MB / ${(estimate.quota / 1024 / 1024).toFixed(2)} MB (${percentUsed}%)`);
  }
};

// ============================================
// 📱 CAMERA & MEDIA
// ============================================

// Check camera permissions
checkCameraPermissions = async () => {
  try {
    const permission = await navigator.permissions.query({ name: 'camera' });
    console.log('Camera permission status:', permission.state);
  } catch (e) {
    console.log('Camera permissions API not available');
  }
};

// Check microphone permissions
checkMicPermissions = async () => {
  try {
    const permission = await navigator.permissions.query({ name: 'microphone' });
    console.log('Microphone permission status:', permission.state);
  } catch (e) {
    console.log('Microphone permissions API not available');
  }
};

// List available media devices
listMediaDevices = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameras = devices.filter(d => d.kind === 'videoinput');
  const mics = devices.filter(d => d.kind === 'audioinput');
  console.log('Cameras:', cameras);
  console.log('Microphones:', mics);
};

// ============================================
// 🎤 VOICE & SPEECH
// ============================================

// Test speech synthesis
testSpeech = () => {
  const utterance = new SpeechSynthesisUtterance('Hello, I am LocalLens. Testing voice synthesis.');
  utterance.rate = 1;
  utterance.pitch = 1;
  speechSynthesis.speak(utterance);
  console.log('Speaking...');
};

// Test speech recognition
testSpeechRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.log('Speech Recognition not supported');
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.start();
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(r => r[0].transcript)
      .join('');
    console.log('Heard:', transcript);
  };
  recognition.onerror = (event) => {
    console.log('Error:', event.error);
  };
};

// List available voices
listVoices = () => {
  const voices = speechSynthesis.getVoices();
  console.table(voices.map(v => ({
    name: v.name,
    lang: v.lang,
    default: v.default ? '✓' : '',
  })));
};

// ============================================
// 🤖 AI & GEMINI NANO
// ============================================

// Check Gemini Nano availability
checkGeminiNano = async () => {
  if (!window.ai) {
    console.log('❌ Gemini Nano not available');
    return;
  }
  try {
    const capabilities = await window.ai.languageModel.capabilities();
    console.log('Gemini Nano status:', capabilities.available);
    console.log('Full capabilities:', capabilities);
  } catch (e) {
    console.log('Error checking Gemini Nano:', e.message);
  }
};

// Get AI session info
getAISession = async () => {
  if (!window.ai) {
    console.log('Gemini Nano not available');
    return;
  }
  try {
    const session = await window.ai.languageModel.create();
    console.log('✓ AI session created');
    session.destroy();
    console.log('✓ Session destroyed');
  } catch (e) {
    console.log('Error creating AI session:', e.message);
  }
};

// ============================================
// 🔌 NETWORK DEBUGGING
// ============================================

// Check if online
checkNetworkStatus = () => {
  console.log('Online status:', navigator.onLine ? '✓ Online' : '❌ Offline');
};

// Monitor network changes
monitorNetwork = () => {
  window.addEventListener('online', () => console.log('✓ Back online'));
  window.addEventListener('offline', () => console.log('❌ Went offline'));
  console.log('Network monitoring enabled');
};

// Get network information (if available)
checkNetworkInfo = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection) {
    console.table({
      'Effective Type': connection.effectiveType,
      'Downlink': connection.downlink + ' Mbps',
      'RTT': connection.rtt + ' ms',
      'Save Data': connection.saveData ? 'Yes' : 'No',
    });
  } else {
    console.log('Network Information API not available');
  }
};

// ============================================
// 🎯 PERFORMANCE METRICS
// ============================================

// Get page performance
getPerformanceMetrics = () => {
  const perf = performance.timing;
  const pageLoadTime = perf.loadEventEnd - perf.navigationStart;
  const connectTime = perf.responseEnd - perf.requestStart;
  const renderTime = perf.domComplete - perf.domLoading;
  
  console.table({
    'Page Load Time': pageLoadTime + ' ms',
    'Connect Time': connectTime + ' ms',
    'Render Time': renderTime + ' ms',
    'DOM Interactive': perf.domInteractive - perf.navigationStart + ' ms',
  });
};

// Memory usage
getMemoryUsage = () => {
  if (performance.memory) {
    console.table({
      'Used JS Heap': (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      'Total JS Heap': (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      'Heap Limit': (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
    });
  } else {
    console.log('Memory API not available');
  }
};

// ============================================
// 📋 SYSTEM INFO
// ============================================

// Get device info
getDeviceInfo = () => {
  console.table({
    'User Agent': navigator.userAgent,
    'Platform': navigator.platform,
    'Language': navigator.language,
    'Online': navigator.onLine ? 'Yes' : 'No',
    'Cookies Enabled': navigator.cookieEnabled ? 'Yes' : 'No',
    'Vendor': navigator.vendor,
    'Max Touch Points': navigator.maxTouchPoints,
  });
};

// Get browser capabilities
getBrowserCapabilities = () => {
  const caps = {
    'Geolocation': 'geolocation' in navigator ? '✓' : '❌',
    'Camera/Mic': 'mediaDevices' in navigator ? '✓' : '❌',
    'Web Workers': 'Worker' in window ? '✓' : '❌',
    'Service Worker': 'serviceWorker' in navigator ? '✓' : '❌',
    'IndexedDB': 'indexedDB' in window ? '✓' : '❌',
    'LocalStorage': 'localStorage' in window ? '✓' : '❌',
    'Speech API': 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window ? '✓' : '❌',
    'Gemini Nano': 'ai' in window ? '✓' : '❌',
  };
  console.table(caps);
};

// ============================================
// 🚀 QUICK COMMANDS
// ============================================

// Full system check
fullSystemCheck = async () => {
  console.log('=== LOCALLENS SYSTEM CHECK ===\n');
  
  console.log('📱 Device:');
  getDeviceInfo();
  
  console.log('\n🌐 Browser Capabilities:');
  getBrowserCapabilities();
  
  console.log('\n🔌 Network:');
  checkNetworkStatus();
  await checkNetworkInfo();
  
  console.log('\n📷 Permissions:');
  await checkCameraPermissions();
  await checkMicPermissions();
  
  console.log('\n🤖 AI:');
  await checkGeminiNano();
  
  console.log('\n💾 Storage:');
  checkLocalStorage();
  await getStorageUsage();
  
  console.log('\n⚡ Performance:');
  getPerformanceMetrics();
  getMemoryUsage();
  
  console.log('\n📊 Logs:');
  getAllLogs();
};

// Quick troubleshooting
troubleshoot = async () => {
  console.log('🔧 Troubleshooting LocalLens...\n');
  
  if (!navigator.mediaDevices) {
    console.log('❌ Camera API not available');
  } else {
    console.log('✓ Camera API available');
  }
  
  if (!navigator.onLine) {
    console.log('⚠️  App is offline');
  } else {
    console.log('✓ Online');
  }
  
  const caps = await window.ai?.languageModel.capabilities();
  if (caps?.available === 'no') {
    console.log('❌ Gemini Nano not available - using fallback');
  } else {
    console.log('✓ Gemini Nano available');
  }
  
  const prefs = localStorage.getItem('locallens-settings');
  if (!prefs) {
    console.log('⚠️  No user preferences saved yet');
  } else {
    console.log('✓ User preferences saved');
  }
};

// ============================================
// HELP
// ============================================

showHelp = () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║            LocalLens Debug Console Help                       ║
╚═══════════════════════════════════════════════════════════════╝

📊 LOGGING:
  getAllLogs()           - View all application logs
  getLogsByComponent()   - Filter logs by component name
  getLogsByLevel()       - Filter logs by severity level
  clearAllLogs()         - Clear all logs
  exportLogs()           - Download logs as JSON file

💾 STORAGE:
  checkLocalStorage()    - View localStorage usage
  checkIndexedDB()       - Check IndexedDB databases
  getStoredPreferences() - View saved settings
  clearAllStorage()      - Clear all data

📷 MEDIA:
  checkCameraPermissions()   - Check camera access
  checkMicPermissions()      - Check microphone access
  listMediaDevices()         - List available cameras/mics

🎤 VOICE:
  testSpeech()           - Test text-to-speech
  testSpeechRecognition()- Test voice input
  listVoices()           - List available voices

🤖 AI:
  checkGeminiNano()      - Check if Gemini Nano is available
  getAISession()         - Create and test AI session

🔌 NETWORK:
  checkNetworkStatus()   - Check if online/offline
  monitorNetwork()       - Monitor connection changes
  checkNetworkInfo()     - Get network speed info

⚡ PERFORMANCE:
  getPerformanceMetrics()- Page load times
  getMemoryUsage()       - Memory usage info

📋 SYSTEM:
  getDeviceInfo()        - Device information
  getBrowserCapabilities()- Browser feature support
  fullSystemCheck()      - Complete system check
  troubleshoot()         - Quick troubleshooting

🆘 HELP:
  showHelp()             - Show this message

Examples:
  getAllLogs()
  getLogsByComponent('CameraView')
  getLogsByLevel('ERROR')
  checkGeminiNano()
  fullSystemCheck()
  troubleshoot()
  `);
};

console.log('%c🎯 LocalLens Debug Console Ready!', 'color: #00aa00; font-size: 14px; font-weight: bold;');
console.log('Type showHelp() for available commands');
