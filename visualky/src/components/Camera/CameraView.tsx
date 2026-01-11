
import { useEffect, useRef } from 'react';
import { CameraCapture, type CameraCaptureHandle } from './CameraCapture';
import AccessibleButton from '../Common/AccessibleButton';
import { X, Settings, Mic, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { voiceController } from '../../services/voiceController';
import { cameraController } from '../../services/cameraController';
import { useSystemState } from '../../services/systemState';
import { orchestrator } from '../../services/orchestrator';

// VOICE-FIRST CAMERA VIEW
// This component is a visual shell. The 'Orchestrator' runs the show.
const CameraView = () => {
  const cameraRef = useRef<CameraCaptureHandle>(null);
  const systemMode = useSystemState(state => state.mode);
  const transitionTo = useSystemState(state => state.transitionTo);

  useEffect(() => {
    const init = async () => {
      // 1. Initialize the Voice Brain
      await orchestrator.initialize();

      // 2. Register Generic Video Element for Headless Access
      // Robustly use the ref from CameraCapture
      const videoElement = cameraRef.current?.getVideoElement();

      if (videoElement) {
        cameraController.register(videoElement);
      } else {
        // Retry once if ref isn't ready (rare but possible)
        setTimeout(() => {
          const retryVideo = cameraRef.current?.getVideoElement();
          if (retryVideo) cameraController.register(retryVideo);
          else console.warn("⚠️ No video element found for Voice Orchestrator");
        }, 1000);
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(init, 500);

    return () => {
      // Cleanup? VoiceOrchestrator persists usually, but maybe we stop listening?
      // safeVoice.stopListening(); 
    };
  }, []);

  // Manual Fallback: Toggle Listening
  const toggleListening = () => {
    if (systemMode === 'LISTENING') {
      voiceController.stopListening(); // Force stop
      transitionTo('IDLE');
    } else {
      transitionTo('IDLE'); // Reset first to ensure clean state transition logic in orchestrator? 
      // Actually, transitionTo('LISTENING') is safer via orchestrator if we had a method, 
      // but here we just manually poke the controller.
      orchestrator.enterIdle(); // Best way to restart the loop
    }
  };

  const isBusy = systemMode === 'THINKING' || systemMode === 'CAPTURING' || systemMode === 'SPEAKING';
  const isListening = systemMode === 'LISTENING';

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden">
      {/* The Camera Layer - Always Active but controlled by Orchestrator */}
      <CameraCapture
        ref={cameraRef}
        onCapture={() => {
          // No-op: Orchestrator triggers capture via cameraController directly
        }}
        onError={(e) => console.error(e)}
      />

      {/* Voice-First UI Overlay with Manual Overrides */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">

        {/* Top Bar */}
        <div className="flex justify-between items-start pointer-events-auto">
          <Link to="/">
            <AccessibleButton label="Home" icon={<X size={28} />} variant="secondary" size="lg" />
          </Link>
          <div className="flex gap-2">
            <button onClick={() => orchestrator.triggerAction('color')} className="bg-black/40 backdrop-blur border border-white/10 p-3 rounded-full text-white hover:bg-white/10">
              <span className="sr-only">Colors</span>
              <span aria-hidden="true" className="font-bold text-xs">COLOR</span>
            </button>
            <button onClick={() => orchestrator.triggerAction('read')} className="bg-black/40 backdrop-blur border border-white/10 p-3 rounded-full text-white hover:bg-white/10">
              <span className="sr-only">Text</span>
              <span aria-hidden="true" className="font-bold text-xs">TEXT</span>
            </button>
          </div>
          <Link to="/settings">
            <AccessibleButton label="Settings" icon={<Settings size={28} />} variant="secondary" size="lg" />
          </Link>
        </div>

        {/* Center: Dynamic Status or Big Mode Selector */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-auto w-full max-w-sm">
          {isBusy ? (
            <div className="flex flex-col items-center gap-4 animate-pulse">
              <RefreshCw size={64} className="text-yellow-400 animate-spin" />
              <h2 className="text-3xl font-bold text-white tracking-widest">{systemMode}</h2>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              {/* Main "Describe" Action - The Core Voice feature visualized */}
              <button
                onClick={() => orchestrator.triggerAction('description')}
                className={`w-40 h-40 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-300 ${isListening ? 'border-blue-500 bg-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.5)] scale-110' : 'border-white/20 bg-black/40 hover:scale-105'}`}
              >
                <Mic size={48} className={isListening ? "text-white" : "text-white/50"} />
                <span className="text-xs uppercase tracking-widest mt-2 font-bold text-white/80">
                  {isListening ? "Listening" : "Describe"}
                </span>
              </button>

              {/* Secondary "Finder" Action */}
              <div className="flex gap-4">
                <button
                  onClick={() => orchestrator.triggerAction('find', 'object')}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur px-6 py-3 rounded-full border border-white/10 hover:bg-white/20 transition-all"
                >
                  <span>🔍</span>
                  <span className="text-white font-medium">Find Object</span>
                </button>
                <button
                  onClick={() => orchestrator.triggerAction('navigation')}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur px-6 py-3 rounded-full border border-white/10 hover:bg-white/20 transition-all"
                >
                  <span>🚶</span>
                  <span className="text-white font-medium">Path</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="pointer-events-auto flex justify-center pb-8">
          <button
            onClick={toggleListening}
            className="text-white/50 text-sm hover:text-white transition-colors"
          >
            {isListening ? "Tap to Stop Listening" : "Tap to Start Listening"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraView;
