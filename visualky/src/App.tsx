import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, useEffect, useState } from 'react';
import Home from './pages/Home';
import CameraPage from './pages/Camera';
import SettingsPage from './pages/Settings';
import DemoPage from './pages/Demo';
import IntelligentInterface from './components/IntelligentInterface';
import AppShell from './components/AppShell';
import { initializeAISystem } from './services/aiIntegration';
import { logEngineStatus } from './services/intelligence/visionEngineConfig';

function App() {
  const [aiInitialized, setAiInitialized] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize AI system - works with OR WITHOUT API key
    // Primary: MediaPipe (FREE, offline)
    // Optional Enhancement: Gemini (if API key available)

    const key =
      import.meta.env.VITE_GEMINI_API_KEY ||
      localStorage.getItem('gemini_api_key') ||
      '';

    console.log('🚀 App.tsx: Initializing Visualky...');
    logEngineStatus();

    if (key) {
      console.log('🔑 Gemini API key found - will use for enhanced analysis');
      setApiKey(key);
    } else {
      console.log('📱 No API key - using MediaPipe (free, offline, unlimited)');
    }

    // Initialize system (works even without API key)
    initializeAISystem(key).then(success => {
      if (success) {
        console.log('✅ AI System initialized successfully');
        setAiInitialized(true);
      } else {
        console.error('❌ AI System initialization warning');
        // Still allow app to work with MediaPipe fallback
        setAiInitialized(true);
      }
      setLoading(false);
    }).catch(err => {
      console.error('❌ AI initialization error:', err);
      // Still allow app to work
      setAiInitialized(true);
      setLoading(false);
    });
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="text-4xl mb-4">🚀</div>
          <p className="text-xl font-bold text-white mb-2">Initializing Visualky...</p>
          <p className="text-gray-400">Preparing vision engines</p>
          <div className="mt-6 text-sm text-gray-500">
            <p>📱 MediaPipe: Ready (Free, Offline)</p>
            <p>{apiKey ? '🔮 Gemini: Ready (Enhanced)' : '🔮 Gemini: Optional'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show intelligent interface if initialized (works with or without API key)
  if (aiInitialized) {
    return (
      <div className="min-h-screen">
        <AppShell />
      </div>
    );
  }

  // Fallback
  return (
    <Router>
      <div className="min-h-screen bg-slate-900">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-2xl font-bold text-white">Loading...</p>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/camera" element={<CameraPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
