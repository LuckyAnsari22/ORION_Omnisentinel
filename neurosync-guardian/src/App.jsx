import { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { FallPredictor } from './ml/FallPredictor';
import './App.css';

function App() {
  const webcamRef = useRef(null);
  const [predictor, setPredictor] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [stabilityScore, setStabilityScore] = useState(100);

  useEffect(() => {
    const initPredictor = async () => {
      const fallPredictor = new FallPredictor();
      await fallPredictor.initialize();
      setPredictor(fallPredictor);
    };
    initPredictor();
  }, []);

  useEffect(() => {
    if (!isActive || !predictor || !webcamRef.current) return;

    const interval = setInterval(async () => {
      const video = webcamRef.current.video;
      if (video && video.readyState === 4) {
        await predictor.detectPose(video);
        const pred = await predictor.predictFall();
        setPrediction(pred);
        setStabilityScore(predictor.getStabilityScore());
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, predictor]);

  const getRiskColor = (level) => {
    switch (level) {
      case 'safe': return '#44FF88';
      case 'warning': return '#FFAA00';
      case 'alert': return '#FF6600';
      case 'critical': return '#FF4444';
      default: return '#44FF88';
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">NeuroSync Guardian</h1>
        <p className="subtitle">
          AI-Powered Fall Prediction • 30-Second Advance Warning
        </p>
      </div>

      <div className="grid">
        <div>
          <div className="card">
            <div className="video-container">
              <Webcam
                ref={webcamRef}
                audio={false}
                mirrored
              />
              <div className="hud">LIVE MONITORING</div>
              {prediction && (
                <div className="risk-badge" style={{ color: getRiskColor(prediction.riskLevel) }}>
                  {prediction.riskLevel.toUpperCase()}
                </div>
              )}
            </div>

            <div className="button-container">
              <button
                onClick={() => setIsActive(!isActive)}
                className={`button ${isActive ? 'button-stop' : 'button-start'}`}
              >
                {isActive ? 'STOP MONITORING' : 'START MONITORING'}
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="panel">
            <h3 className="panel-title">Stability Score</h3>
            <div className="score">{stabilityScore}%</div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${stabilityScore}%` }}
              />
            </div>
          </div>

          {prediction && (
            <div className="panel">
              <h3 className="panel-title">Fall Prediction</h3>

              <div style={{ marginBottom: '1.5rem' }}>
                <div className="stat-label">Risk Level</div>
                <div
                  className="stat-value"
                  style={{ color: getRiskColor(prediction.riskLevel) }}
                >
                  {prediction.riskLevel.toUpperCase()}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div className="stat-label">Probability</div>
                <div className="stat-value">
                  {prediction.probability.toFixed(1)}%
                </div>
                <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
                  <div
                    style={{
                      width: `${prediction.probability}%`,
                      height: '100%',
                      backgroundColor: getRiskColor(prediction.riskLevel),
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              </div>

              {prediction.riskLevel !== 'safe' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div className="stat-label">Time to Fall</div>
                  <div className="stat-value-large" style={{ color: '#ef4444' }}>
                    {prediction.timeToFall}s
                  </div>
                </div>
              )}

              {prediction.factors.length > 0 && (
                <div>
                  <div className="stat-label">Risk Factors</div>
                  <div className="factors-list">
                    {prediction.factors.map((factor, i) => (
                      <div key={i} className="factor-item">
                        <div
                          className="factor-dot"
                          style={{ backgroundColor: getRiskColor(prediction.riskLevel) }}
                        />
                        {factor}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="panel">
            <h3 className="panel-title">How It Works</h3>
            <ul className="info-list">
              <li>• Tracks 33 body landmarks in real-time</li>
              <li>• Analyzes center of mass displacement</li>
              <li>• Monitors joint velocity changes</li>
              <li>• Measures base of support width</li>
              <li>• Detects trunk angle deviation</li>
              <li>• Predicts falls 30 seconds in advance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
