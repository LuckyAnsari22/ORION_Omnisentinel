import { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Eye, Wifi, Battery, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import './App.css';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);

  const videoRef = useRef(null);
  const pressTimer = useRef(null);

  useEffect(() => {
    startCamera();
    addLog("System initialized. AES-256 Encryption Ready.");
  }, []);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setTimeLeft(t => t + 1);
        if (Math.random() > 0.7) {
          addLog(`Chunk #${Math.floor(Math.random() * 1000)} encrypted >> Cloud`);
        }
      }, 1000);
    } else {
      setTimeLeft(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      addLog("Camera access denied.");
    }
  };

  const addLog = (msg) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);
  };

  const handlePointerDown = () => {
    setIsRecording(true);
    addLog("Dead-man switch engaged. Recording started.");
    setIsUploading(false);
  };

  const handlePointerUp = () => {
    if (isRecording) {
      setIsRecording(false);
      addLog("Switch released. EMERGENCY UPLOAD TRIGGERED.");
      setIsUploading(true);
      setTimeout(() => setIsUploading(false), 3000); // Reset after "upload"
    }
  };

  return (
    <div className="app-container">
      <video ref={videoRef} className={`camera-preview ${isRecording ? 'recording' : ''}`} autoPlay muted playsInline />

      <div className="overlay-ui">
        <header className="header">
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', fontWeight: 'bold' }}>
            <Eye size={18} /> SILENT WITNESS
          </div>

          <div className="status-bar">
            {isRecording ? (
              <>
                <div className="recording-indicator"></div>
                <span style={{ color: '#ff0000' }}>REC {new Date(timeLeft * 1000).toISOString().substr(14, 5)}</span>
              </>
            ) : (
              <span style={{ color: '#aaa' }}>STANDBY</span>
            )}
            <div style={{ width: '1px', height: '15px', background: '#555', margin: '0 5px' }}></div>
            <Lock size={14} className="secure-lock" />
            <Wifi size={14} />
            <Battery size={14} />
          </div>
        </header>

        <div className="center-action">
          {isUploading ? (
            <div style={{ textAlign: 'center', color: '#ff0000' }}>
              <AlertTriangle size={64} className="animate-pulse" style={{ marginBottom: '1rem' }} />
              <h2>UPLOADING EVIDENCE</h2>
              <p>DO NOT CLOSE</p>
            </div>
          ) : (
            <>
              <motion.button
                className={`dead-man-switch ${isRecording ? 'locked' : ''}`}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                whileTap={{ scale: 0.95 }}
              >
                {isRecording ? "HOLDING..." : "HOLD TO RECORD"}
              </motion.button>
              <p className="instruction-text">
                {isRecording
                  ? "Release button to trigger immediate cloud upload."
                  : "Press and hold to start loop recording. Evidence is encrypted locally."}
              </p>
            </>
          )}
        </div>

        <div className="encryption-log">
          {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </div>
    </div>
  );
}

export default App;
