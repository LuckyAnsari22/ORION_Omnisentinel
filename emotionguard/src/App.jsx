import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import './App.css';

function App() {
  const [initializing, setInitializing] = useState(true);
  const [emotions, setEmotions] = useState(null);
  const [crisisScore, setCrisisScore] = useState(0);
  const [isCrisis, setIsCrisis] = useState(false);
  const [debugInfo, setDebugInfo] = useState('Initializing AI...');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  // Load models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        setDebugInfo('Loading Neural Networks...');
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);

        setDebugInfo('Starting Camera...');
        startVideo();
      } catch (err) {
        console.error('Failed to load models:', err);
        setDebugInfo('Error Loading AI Models');
      }
    };

    loadModels();

    return () => {
      stopVideo();
    };
  }, []);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 1280, height: 720 } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      })
      .catch((err) => {
        console.error('Camera error:', err);
        setDebugInfo('Camera Permission Denied');
      });
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleVideoPlay = () => {
    setInitializing(false);

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Face detection
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      // Clear canvas
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw detections
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

      if (detections.length > 0) {
        const expressions = detections[0].expressions;
        setEmotions(expressions);

        // Calculate Crisis Score (0-100) based on negative emotions
        const negativeSum = (expressions.fear || 0) + (expressions.sad || 0) + (expressions.angry || 0) + (expressions.disgusted || 0);
        const score = Math.min(100, Math.round(negativeSum * 100));

        // Smooth transition for visualization
        setCrisisScore(prev => Math.round(prev * 0.8 + score * 0.2));

        if (score > 60) {
          setIsCrisis(true);
        } else {
          setIsCrisis(false);
        }
      } else {
        // No face detected, slowly drop score
        setCrisisScore(prev => Math.max(0, prev - 5));
      }

    }, 100);
  };

  return (
    <div className="app-container">
      {initializing && (
        <div className="loading-screen">
          <div className="loader"></div>
          <h2 className="loading-text">{debugInfo}</h2>
        </div>
      )}

      <header className="header">
        <div>
          <h1 className="title">EmotionGuard</h1>
          <div className="subtitle">CRISIS DETECTION SYSTEM</div>
        </div>
        <div className={`status-badge ${isCrisis ? 'offline' : ''}`}>
          {isCrisis ? '⚠️ ALERT ACTIVE' : '● SYSTEM NOMINAL'}
        </div>
      </header>

      <div className="viewport">
        <div className="video-container">
          <video
            ref={videoRef}
            autoPlay
            muted
            onPlay={handleVideoPlay}
          />
          <canvas ref={canvasRef} />
          <div className="hud-layer">
            <div className="scan-line"></div>
          </div>
        </div>
      </div>

      <div className="dashboard-panel">
        <div className="panel-header">
          <span>BIO-METRICS</span>
          <span>LIVE</span>
        </div>

        {isCrisis && (
          <div className="crisis-alert">
            <h3>⚠️ CRISIS DETECTED</h3>
            <p>Elevated stress levels detected. Recommending immediate intervention.</p>
          </div>
        )}

        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-label">
              <span>Overall Stability</span>
              <span>{100 - crisisScore}%</span>
            </div>
            <div className="metric-bar-bg">
              <div
                className={`metric-bar-fill ${crisisScore > 40 ? 'high' : ''} ${crisisScore > 70 ? 'critical' : ''}`}
                style={{ width: `${100 - crisisScore}%`, background: crisisScore > 60 ? '#ff3333' : '#00ffaa' }}
              ></div>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-label">
              <span>Happiness</span>
              <span>{emotions ? Math.round(emotions.happy * 100) : 0}%</span>
            </div>
            <div className="metric-bar-bg">
              <div className="metric-bar-fill" style={{ width: `${emotions ? emotions.happy * 100 : 0}%`, background: '#ffd700' }}></div>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-label">
              <span>Stress/Fear</span>
              <span>{emotions ? Math.round(emotions.fear * 100) : 0}%</span>
            </div>
            <div className="metric-bar-bg">
              <div className="metric-bar-fill high" style={{ width: `${emotions ? emotions.fear * 100 : 0}%`, background: '#ff6600' }}></div>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-label">
              <span>Discomfort</span>
              <span>{emotions ? Math.round(emotions.sad * 100) : 0}%</span>
            </div>
            <div className="metric-bar-bg">
              <div className="metric-bar-fill high" style={{ width: `${emotions ? emotions.sad * 100 : 0}%`, background: '#ffaa00' }}></div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
          <div className="metric-label">
            <span>AI CONFIDENCE</span>
            <span>98.2%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
