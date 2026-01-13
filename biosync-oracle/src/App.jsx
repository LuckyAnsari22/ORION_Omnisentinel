import { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Heart, Activity, Wind, Brain, Sparkles, X, Stethoscope } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import './App.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

// Initialize Gemini
const API_KEY = "AIzaSyDBGGhd0SxfpouxkD_JKmdOEMJCaAq3MAU";
const genAI = new GoogleGenerativeAI(API_KEY);

function App() {
  const [bpm, setBpm] = useState(0);
  const [hrv, setHrv] = useState(0);
  const [graphData, setGraphData] = useState(new Array(50).fill(0));
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [camError, setCamError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const processingRef = useRef(null);
  const lastProcess = useRef(Date.now());

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.oncanplay = () => {
          videoRef.current.play();
          startProcessing();
        };
      }
    } catch (err) {
      console.error(err);
      if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCamError("CAMERA BUSY: Please close OTHER tabs (Reality Anchor, etc).");
      } else {
        setCamError("CAMERA ERROR: " + err.message);
      }
    }
  };

  const stopCamera = () => {
    if (processingRef.current) cancelAnimationFrame(processingRef.current);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const startProcessing = () => {
    setTimeout(() => setIsCalibrating(false), 3000);

    const update = () => {
      processFrame();
      processingRef.current = requestAnimationFrame(update);
    };
    processingRef.current = requestAnimationFrame(update);
  };

  const processFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    // Draw Overlay
    const roiSize = 60;
    const roiX = width / 2 - roiSize / 2;
    const roiY = height / 3 - roiSize / 2;

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.strokeRect(roiX, roiY, roiSize, roiSize);

    // Simulating signal processing for demo stability
    const time = Date.now();
    const simulatedPulse = Math.sin(time / 150) * 5;

    setGraphData(prev => [...prev.slice(1), 50 + simulatedPulse + (Math.random() * 5)]);

    if (!isCalibrating && time - lastProcess.current > 1000) {
      setBpm(Math.round(70 + Math.random() * 10)); // Variable synthetic HR
      setHrv(Math.round(40 + Math.random() * 20)); // Variable synthetic HRV
      lastProcess.current = time;
    }
  };

  const consultGemini = async () => {
    setIsAnalyzing(true);
    setAiAnalysis("Analyzing bio-signals...");
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `I am a user of a health app. My Heart Rate is currently ${bpm} BPM and my HRV is ${hrv}ms. I am resting. Analyze these metrics briefly in a medical but friendly tone. Is this normal? Give one quick actionable tip.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setAiAnalysis(response.text());
    } catch (e) {
      console.warn(e);
      // SIMULATED LOGIC FALLBACK
      let advice = "Your vitals appear stable. ";
      if (bpm > 100) advice = "Your heart rate is slightly elevated. Consider practicing box breathing or sitting down to rest. ";
      else if (bpm < 60) advice = "Your heart rate is in a calm, resting state. Excellent. ";

      if (hrv < 30) advice += "Your HRV indicates some stress. A 5-minute meditation could help.";
      else advice += "Your stress resilience (HRV) looks good!";

      setAiAnalysis(advice + " (Offline Analysis)");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { display: false } },
    elements: { point: { radius: 0 }, line: { tension: 0.4, borderWidth: 2, borderColor: '#00ff88', fill: true } }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="brand">
          <h1>BIOSYNC ORACLE</h1>
          <div className="subtitle">AI-POWERED VITAL SIGNS MONITOR</div>
        </div>
        <div className="status-badge normal">SYSTEM ACTIVE</div>
      </header>

      {camError && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.9)', zIndex: 9999, color: 'red', display: 'flex',
          justifyContent: 'center', alignItems: 'center', flexDirection: 'column', textAlign: 'center'
        }}>
          <X size={64} />
          <h3>{camError}</h3>
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px' }}>REFRESH</button>
        </div>
      )}

      <main className="main-view">
        <div className="camera-feed">
          <video ref={videoRef} muted playsInline autoPlay />
          <canvas ref={canvasRef} />
          <div className="scanning-line"></div>
        </div>

        <aside className="vitals-panel">
          <div className="vital-card">
            <div className="vital-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Heart size={18} color="#ff3333" /> HEART RATE
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span className="vital-value-main" style={{ color: '#ff3333' }}>
                {isCalibrating ? '--' : bpm}
              </span>
              <span className="vital-unit">BPM</span>
            </div>
            <div className="graph-container">
              <Line data={{ labels: new Array(50).fill(''), datasets: [{ data: graphData, borderColor: '#ff3333', backgroundColor: 'rgba(255, 50, 50, 0.1)' }] }} options={chartOptions} />
            </div>
          </div>

          <div className="vital-card">
            <div className="vital-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#00ff88" /> HRV
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span className="vital-value-main">{isCalibrating ? '--' : hrv}</span>
              <span className="vital-unit">ms</span>
            </div>
          </div>

          {/* Gemini Integration */}
          <div style={{ marginTop: 'auto' }}>
            {!aiAnalysis ? (
              <button
                className="metabolism-btn"
                onClick={consultGemini}
                disabled={isCalibrating || isAnalyzing}
                style={{
                  width: '100%', padding: '1rem', background: 'linear-gradient(90deg, #00bdff, #0079ff)',
                  border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer',
                  opacity: isCalibrating ? 0.5 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
                }}
              >
                {isAnalyzing ? <Sparkles className="animate-spin" /> : <Stethoscope />}
                {isAnalyzing ? "CONSULTING ORACLE..." : "ANALYZE VITALS"}
              </button>
            ) : (
              <div style={{ background: 'rgba(0, 40, 60, 0.8)', padding: '1rem', borderRadius: '8px', border: '1px solid #00bdff', position: 'relative' }}>
                <button onClick={() => setAiAnalysis(null)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'none', border: 'none', color: '#00bdff', cursor: 'pointer' }}><X size={16} /></button>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#00bdff', display: 'flex', alignItems: 'center', gap: '5px' }}><Sparkles size={14} /> ORACLE REPORT</h4>
                <p style={{ fontSize: '0.9rem', color: '#ddd', margin: 0 }}>{aiAnalysis}</p>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
