import { useState, useEffect, useRef } from 'react';
// Tone.js imported dynamically to prevent Autoplay warnings
import { Shield, Home, Tv, Utensils, Activity, Power, Volume2, Moon, Loader } from 'lucide-react';
import { format } from 'date-fns';
import './App.css';

function App() {
  const [isActive, setIsActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [currentMode, setCurrentMode] = useState('vacation');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lightState, setLightState] = useState({ color: '#000000', intensity: 0, room: 'Living Room' });
  const [audioLevel, setAudioLevel] = useState(0);

  /* 
     Removed: const ToneRef = useRef(null); 
     We will use the top-level Tone import.
  */
  const tvOscillator = useRef(null);
  const noiseSource = useRef(null);

  useEffect(() => {
    // Top-level import workaround or just rely on the static import if we change it.
    // For now, let's stick to the existing structure but fix the initialization.
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const ToneRef = useRef(null); // Ensure ToneRef is available

  useEffect(() => {
    let interval;
    if (isActive && ToneRef.current) {
      interval = setInterval(() => {
        simulateEnvironment();
      }, 2000);
    } else {
      stopAudio();
      setLightState({ color: '#000000', intensity: 0, room: 'System Offline' });
    }
    return () => {
      clearInterval(interval);
      stopAudio();
    };
  }, [isActive, currentMode]);


  const initAudio = async () => {
    if (ToneRef.current) {
      if (ToneRef.current.context.state !== 'running') {
        await ToneRef.current.start();
      }
      return;
    }

    setIsInitializing(true);
    try {
      // Use static import if possible, but if we must use dynamic:
      const Tone = await import('tone');
      ToneRef.current = Tone;

      // CRITICAL: Resume context on user gesture
      await Tone.start();
      if (Tone.context.state !== 'running') {
        await Tone.context.resume();
      }

      console.log('Audio Context Started via Dynamic Import');

      // Init Nodes
      noiseSource.current = new Tone.Noise("brown").toDestination();
      noiseSource.current.volume.value = -20;

      tvOscillator.current = new Tone.Oscillator(100, "sine").toDestination();
      tvOscillator.current.volume.value = -30;
    } catch (e) {
      console.error("Audio init failed", e);
    }
    setIsInitializing(false);
  };


  const stopAudio = () => {
    noiseSource.current?.stop();
    tvOscillator.current?.stop();
    setAudioLevel(0);
  };

  const simulateEnvironment = () => {
    if (!ToneRef.current) return;

    let newColor, newIntensity, soundVol = 0;

    if (currentMode === 'vacation') {
      const r = Math.random() > 0.5 ? 200 : 50;
      const g = Math.random() > 0.5 ? 200 : 50;
      const b = 255;
      newColor = `rgb(${r}, ${g}, ${b})`;
      newIntensity = 0.3 + Math.random() * 0.5;
      soundVol = Math.random() * 50;

      if (Math.random() > 0.7 && noiseSource.current && noiseSource.current.state === 'stopped') {
        noiseSource.current.start();
        noiseSource.current.stop("+0.5");
      }
    }
    else if (currentMode === 'dinner') {
      newColor = 'rgb(255, 140, 50)';
      newIntensity = 0.8;
      soundVol = 20;
    }
    else if (currentMode === 'gym') {
      newColor = 'rgb(255, 255, 255)';
      newIntensity = 1;
      soundVol = 80;
    }

    setLightState({
      color: newColor,
      intensity: newIntensity,
      room: 'Living Room'
    });
    setAudioLevel(soundVol);
  };

  const toggleSystem = async () => {
    if (!isActive) {
      await initAudio();
    }
    setIsActive(!isActive);
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="brand">
          <h1>PHANTOM GUARDIAN</h1>
          <div className="subtitle">PRESENCE SIMULATION SYSTEM</div>
        </div>

        <div className="status-panel">
          <div className="status-item">
            <span className="status-label">SYSTEM TIME</span>
            <span className="status-value">{format(currentTime, 'HH:mm:ss')}</span>
          </div>
          <div className="status-item">
            <span className="status-label">STATUS</span>
            <span className="status-value" style={{ color: isActive ? '#00ff88' : '#666' }}>
              {isActive ? 'ARMED' : 'STANDBY'}
            </span>
          </div>
        </div>
      </header>

      <main className="main-content">
        <aside className="controls-panel">
          <div className="mode-selector">
            <h3 style={{ fontFamily: 'Orbitron', color: '#b084cc', marginBottom: '1rem' }}>OPERATION MODE</h3>

            <button className={`mode-btn ${currentMode === 'vacation' ? 'active' : ''}`} onClick={() => setCurrentMode('vacation')}>
              <Tv className="mode-icon" />
              <div><strong>TV Simulator</strong><div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Flickering lights & audio</div></div>
            </button>

            <button className={`mode-btn ${currentMode === 'dinner' ? 'active' : ''}`} onClick={() => setCurrentMode('dinner')}>
              <Utensils className="mode-icon" />
              <div><strong>Dinner Party</strong><div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Warm ambience & chatter</div></div>
            </button>

            <button className={`mode-btn ${currentMode === 'gym' ? 'active' : ''}`} onClick={() => setCurrentMode('gym')}>
              <Activity className="mode-icon" />
              <div><strong>Active Workout</strong><div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Bright lights & rhythm</div></div>
            </button>
          </div>

          <button className={`activate-btn ${isActive ? 'active' : ''}`} onClick={toggleSystem} disabled={isInitializing}>
            {isInitializing ? (
              <><Loader size={18} className="animate-spin" style={{ marginRight: '8px' }} /> INITIALIZING...</>
            ) : isActive ? (
              <><Power size={18} style={{ marginRight: '8px' }} /> DEACTIVATE SYSTEM</>
            ) : (
              <><Shield size={18} style={{ marginRight: '8px' }} /> ARM SYSTEM</>
            )}
          </button>
        </aside>

        <section className="visualizer-panel">
          <div className="sim-overlay">
            <div><Home size={14} style={{ marginRight: '5px' }} /> {lightState.room}</div>
            <div><Volume2 size={14} style={{ marginRight: '5px' }} /> {Math.round(audioLevel)}%</div>
          </div>

          <div className="sim-light" style={{
            width: '600px', height: '600px',
            background: lightState.color,
            opacity: lightState.intensity * 0.5,
            boxShadow: `0 0 100px 50px ${lightState.color}`
          }}></div>

          <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '30%', background: 'linear-gradient(to top, #000 80%, transparent)', pointerEvents: 'none' }}></div>

          {isActive && (
            <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', display: 'flex', gap: '4px' }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bar" style={{ height: `${Math.random() * audioLevel + 10}px`, animationDuration: `${0.2 + Math.random() * 0.5}s` }}></div>
              ))}
            </div>
          )}

          {!isActive && (
            <div style={{ position: 'absolute', textAlign: 'center', opacity: 0.5 }}>
              <Moon size={48} style={{ marginBottom: '1rem' }} />
              <div>SYSTEM SLEEPING</div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
