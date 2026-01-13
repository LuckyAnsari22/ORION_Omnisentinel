import { useState, useEffect, useRef } from 'react';
import { AudioThreatDetector } from './ml/AudioThreatDetector';
import { FirebaseAlertService } from './services/FirebaseAlertService';
import './App.css';

function App() {
  const [detector, setDetector] = useState(null);
  const [emailService, setEmailService] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentThreat, setCurrentThreat] = useState(null);
  const [threatHistory, setThreatHistory] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [emailConfig, setEmailConfig] = useState({
    useDefault: true, // Use OrionTeamOutliers Firebase by default
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    recipientEmail: '',
    recipientName: 'Security Team',
  });
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(false);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const initDetector = async () => {
      const audioDetector = new AudioThreatDetector();
      const success = await audioDetector.initialize();
      if (success) {
        setDetector(audioDetector);
        setIsInitialized(true);
      }
    };

    const alertService = new FirebaseAlertService();
    setEmailService(alertService);

    initDetector();

    return () => {
      if (detector) {
        detector.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (isListening && detector) {
      const interval = setInterval(() => {
        const level = detector.getAudioLevel();
        setAudioLevel(level);
      }, 20);

      return () => clearInterval(interval);
    }
  }, [isListening, detector]);

  useEffect(() => {
    if (isListening) {
      drawRadar();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [isListening, currentThreat, threatHistory]);

  const handleToggleListening = async () => {
    if (!detector) return;

    if (isListening) {
      detector.stopListening();
      setIsListening(false);
      setCurrentThreat(null);
    } else {
      try {
        await detector.startListening(async (threat) => {
          setCurrentThreat(threat);
          setThreatHistory(prev => [threat, ...prev].slice(0, 10));

          // Send email alert if enabled
          if (emailAlertsEnabled && emailService && emailService.isReady()) {
            const result = await emailService.sendThreatAlert(threat);
            if (result.success) {
              console.log('Email alert sent successfully');
            }
          }

          // Auto-clear current threat after 3 seconds
          setTimeout(() => {
            setCurrentThreat(null);
          }, 3000);
        });
        setIsListening(true);
      } catch (error) {
        alert('Microphone access is required for SonicGuard to work');
      }
    }
  };

  const handleSaveEmailConfig = () => {
    if (emailService) {
      emailService.configure(emailConfig);
      setEmailAlertsEnabled(true);
      setShowEmailConfig(false);
      alert('Email alerts configured successfully!');
    }
  };

  const handleEmailConfigChange = (field, value) => {
    setEmailConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const drawRadar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 20;

    // Clear canvas
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, width, height);

    // Draw radar circles
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (maxRadius / 4) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw crosshairs
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - maxRadius);
    ctx.lineTo(centerX, centerY + maxRadius);
    ctx.moveTo(centerX - maxRadius, centerY);
    ctx.lineTo(centerX + maxRadius, centerY);
    ctx.stroke();

    // Draw direction markers
    ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.font = '12px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('N', centerX, centerY - maxRadius - 5);
    ctx.fillText('S', centerX, centerY + maxRadius + 15);
    ctx.fillText('E', centerX + maxRadius + 15, centerY + 5);
    ctx.fillText('W', centerX - maxRadius - 15, centerY + 5);

    // Draw audio level pulse
    if (isListening) {
      const pulseRadius = (audioLevel / 100) * maxRadius * 0.3;
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw current threat
    if (currentThreat) {
      const angle = (currentThreat.direction * Math.PI) / 180;
      const distance = ((50 - currentThreat.distance) / 50) * maxRadius;
      const x = centerX + Math.cos(angle - Math.PI / 2) * distance;
      const y = centerY + Math.sin(angle - Math.PI / 2) * distance;

      // Threat marker
      const color = getSeverityColor(currentThreat.severity);
      ctx.fillStyle = color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Threat line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Threat label
      ctx.fillStyle = color;
      ctx.font = 'bold 11px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText(formatThreatType(currentThreat.type), x, y - 15);
    }

    // Draw threat history (fading)
    threatHistory.slice(1).forEach((threat, index) => {
      const age = index + 1;
      const opacity = Math.max(0, 1 - (age / 10));
      const angle = (threat.direction * Math.PI) / 180;
      const distance = ((50 - threat.distance) / 50) * maxRadius;
      const x = centerX + Math.cos(angle - Math.PI / 2) * distance;
      const y = centerY + Math.sin(angle - Math.PI / 2) * distance;

      const color = getSeverityColor(threat.severity);
      ctx.fillStyle = color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    animationRef.current = requestAnimationFrame(drawRadar);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff6600';
      case 'medium': return '#ffaa00';
      case 'low': return '#44ff88';
      default: return '#00ffff';
    }
  };

  const formatThreatType = (type) => {
    return type
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .toUpperCase();
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">SonicGuard</h1>
        <p className="subtitle">
          AI-Powered Audio Threat Intelligence • 360° Sound Awareness
        </p>
      </div>

      <div className="grid">
        <div>
          <div className="card">
            <div className="radar-container">
              <canvas
                ref={canvasRef}
                width={500}
                height={500}
                className="radar-canvas"
              />
              {!isListening && (
                <div className="radar-overlay">
                  <div className="radar-overlay-text">
                    Click START to begin monitoring
                  </div>
                </div>
              )}
            </div>

            <div className="button-container">
              <button
                onClick={handleToggleListening}
                disabled={!isInitialized}
                className={`button ${isListening ? 'button-stop' : 'button-start'}`}
              >
                {!isInitialized ? 'INITIALIZING...' : isListening ? 'STOP MONITORING' : 'START MONITORING'}
              </button>
            </div>

            {isListening && (
              <div className="audio-level-container">
                <div className="stat-label">Audio Level</div>
                <div className="audio-level-bar">
                  <div
                    className="audio-level-fill"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
            )}

            <div className="email-alert-section">
              <button
                onClick={() => setShowEmailConfig(true)}
                className="button button-email"
              >
                {emailAlertsEnabled ? '✓ Email Alerts Active' : '📧 Configure Email Alerts'}
              </button>
            </div>
          </div>
        </div>

        <div>
          {currentThreat && (
            <div className="panel threat-alert">
              <h3 className="panel-title" style={{ color: getSeverityColor(currentThreat.severity) }}>
                ⚠️ THREAT DETECTED
              </h3>

              <div style={{ marginBottom: '1.5rem' }}>
                <div className="stat-label">Threat Type</div>
                <div className="stat-value-large" style={{ color: getSeverityColor(currentThreat.severity) }}>
                  {formatThreatType(currentThreat.type)}
                </div>
              </div>

              <div className="threat-grid">
                <div>
                  <div className="stat-label">Confidence</div>
                  <div className="stat-value">{currentThreat.confidence.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="stat-label">Severity</div>
                  <div className="stat-value" style={{ color: getSeverityColor(currentThreat.severity) }}>
                    {currentThreat.severity.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="threat-grid">
                <div>
                  <div className="stat-label">Direction</div>
                  <div className="stat-value">{currentThreat.direction}°</div>
                </div>
                <div>
                  <div className="stat-label">Distance</div>
                  <div className="stat-value">~{currentThreat.distance}m</div>
                </div>
              </div>
            </div>
          )}

          <div className="panel">
            <h3 className="panel-title">Detection Capabilities</h3>
            <ul className="info-list">
              <li>🔴 Gunshots & Explosions</li>
              <li>🔊 Screams & Distress Calls</li>
              <li>💥 Glass Breaking</li>
              <li>🚨 Alarm Systems</li>
              <li>😠 Aggressive Voices</li>
              <li>🚗 Car Crashes</li>
              <li>🐕 Aggressive Dog Barks</li>
              <li>📍 Spatial Audio Mapping</li>
            </ul>
          </div>

          {threatHistory.length > 0 && (
            <div className="panel">
              <h3 className="panel-title">Recent Threats</h3>
              <div className="threat-history">
                {threatHistory.slice(0, 5).map((threat, index) => (
                  <div key={index} className="threat-history-item">
                    <div className="threat-history-dot" style={{ backgroundColor: getSeverityColor(threat.severity) }} />
                    <div className="threat-history-content">
                      <div className="threat-history-type">{formatThreatType(threat.type)}</div>
                      <div className="threat-history-meta">
                        {threat.confidence.toFixed(0)}% • {threat.direction}° • {threat.distance}m
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="panel">
            <h3 className="panel-title">How It Works</h3>
            <ul className="info-list">
              <li>• Real-time audio frequency analysis</li>
              <li>• AI-powered sound classification</li>
              <li>• Spectral pattern matching</li>
              <li>• Spatial audio estimation</li>
              <li>• Sub-100ms threat detection</li>
              <li>• 100% privacy (local processing)</li>
            </ul>
          </div>
        </div>
      </div>

      {showEmailConfig && (
        <div className="modal-overlay" onClick={() => setShowEmailConfig(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Configure Firebase Alerts</h2>
            <p className="modal-subtitle">
              Get instant email notifications and cloud storage when threats are detected
            </p>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={emailConfig.useDefault}
                  onChange={(e) => handleEmailConfigChange('useDefault', e.target.checked)}
                />
                Use Default Configuration (OrionTeamOutliers)
              </label>
              <p className="field-hint">Use the pre-configured Firebase project for immediate testing.</p>
            </div>

            {!emailConfig.useDefault && (
              <>
                <div className="form-group">
                  <label className="form-label">Firebase API Key</label>
                  <input
                    type="text"
                    className="form-input"
                    value={emailConfig.apiKey}
                    onChange={(e) => handleEmailConfigChange('apiKey', e.target.value)}
                    placeholder="AIzaSy..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Auth Domain</label>
                  <input
                    type="text"
                    className="form-input"
                    value={emailConfig.authDomain}
                    onChange={(e) => handleEmailConfigChange('authDomain', e.target.value)}
                    placeholder="your-project.firebaseapp.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Project ID</label>
                  <input
                    type="text"
                    className="form-input"
                    value={emailConfig.projectId}
                    onChange={(e) => handleEmailConfigChange('projectId', e.target.value)}
                    placeholder="your-project-id"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Storage Bucket</label>
                  <input
                    type="text"
                    className="form-input"
                    value={emailConfig.storageBucket}
                    onChange={(e) => handleEmailConfigChange('storageBucket', e.target.value)}
                    placeholder="your-project.appspot.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Messaging Sender ID</label>
                  <input
                    type="text"
                    className="form-input"
                    value={emailConfig.messagingSenderId}
                    onChange={(e) => handleEmailConfigChange('messagingSenderId', e.target.value)}
                    placeholder="123456789"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">App ID</label>
                  <input
                    type="text"
                    className="form-input"
                    value={emailConfig.appId}
                    onChange={(e) => handleEmailConfigChange('appId', e.target.value)}
                    placeholder="1:123456789:web:abc123"
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Recipient Email</label>
              <input
                type="email"
                className="form-input"
                value={emailConfig.recipientEmail}
                onChange={(e) => handleEmailConfigChange('recipientEmail', e.target.value)}
                placeholder="security@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Recipient Name</label>
              <input
                type="text"
                className="form-input"
                value={emailConfig.recipientName}
                onChange={(e) => handleEmailConfigChange('recipientName', e.target.value)}
                placeholder="Security Team"
              />
            </div>

            <div className="modal-info">
              <p>📝 <strong>Setup Instructions:</strong></p>
              {emailConfig.useDefault ? (
                <ol>
                  <li>Values are pre-configured for the <strong>OrionTeamOutliers</strong> project.</li>
                  <li>Just enter your email address to receive alerts.</li>
                  <li>Click "Save & Enable Alerts" to start.</li>
                </ol>
              ) : (
                <ol>
                  <li>Create a Firebase project at <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
                  <li>Enable Firestore Database and Cloud Functions</li>
                  <li>Go to Project Settings → General → Your apps</li>
                  <li>Copy your Firebase configuration values</li>
                  <li>Paste them above and click Save</li>
                </ol>
              )}
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowEmailConfig(false)}
                className="button button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEmailConfig}
                className="button button-start"
                disabled={(!emailConfig.useDefault && (!emailConfig.apiKey || !emailConfig.projectId || !emailConfig.appId)) || !emailConfig.recipientEmail}
              >
                Save & Enable Alerts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
