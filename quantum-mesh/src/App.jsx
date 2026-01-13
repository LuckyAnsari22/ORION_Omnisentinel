import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { NetworkVisualizer } from './components/NetworkVisualizer';
import { MeshNetwork } from './MeshNetwork';
import { Wifi, Users, ShieldAlert, Send, Activity } from 'lucide-react';
import './App.css';

function App() {
  const [mesh, setMesh] = useState(null);
  const [myId, setMyId] = useState('Initializing...');
  const [peers, setPeers] = useState([]); // Array of peer objects {id, conn}
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize Mesh Network
    const network = new MeshNetwork(
      (data, peerId) => handleData(data, peerId),
      (peerId) => handlePeerConnect(peerId),
      (peerId) => handlePeerDisconnect(peerId)
    );

    network.initialize();

    // Poll for ID until ready (simple approach)
    const interval = setInterval(() => {
      if (network.isReady) {
        setMyId(network.id);
        clearInterval(interval);
      }
    }, 500);

    setMesh(network);

    return () => {
      network.disconnect();
      clearInterval(interval);
    };
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleData = (data, peerId) => {
    // Handle incoming data
    if (data.type === 'chat') {
      addMessage(peerId, data.content, 'received');
    } else if (data.type === 'emergency') {
      addMessage('SYSTEM', `⚠️ EMERGENCY SIGNAL FROM ${peerId}`, 'system');
      setIsEmergency(true);
      // Auto-disable emergency alert visual after 5s
      setTimeout(() => setIsEmergency(false), 5000);
    }
  };

  const handlePeerConnect = (peerId) => {
    if (peerId === 'SERVER_CONNECTED') return; // Ignore internal signal
    setPeers(prev => [...prev, { id: peerId }]);
    addMessage('SYSTEM', `Peer connected: ${peerId}`, 'system');
  };

  const handlePeerDisconnect = (peerId) => {
    setPeers(prev => prev.filter(p => p.id !== peerId));
    addMessage('SYSTEM', `Peer disconnected: ${peerId}`, 'system');
  };

  const addMessage = (sender, text, type) => {
    setMessages(prev => [...prev, { id: Date.now(), sender, text, type }]);
  };

  const sendMessage = () => {
    if (!inputText.trim() || !mesh) return;

    // Broadcast to all
    mesh.broadcast({ type: 'chat', content: inputText });
    addMessage('ME', inputText, 'sent');
    setInputText('');
  };

  const sendEmergencySignal = () => {
    if (!mesh) return;
    mesh.broadcast({ type: 'emergency' });
    addMessage('SYSTEM', '⚠️ BROADCASTING EMERGENCY SIGNAL', 'system');
    setIsEmergency(true);
    setTimeout(() => setIsEmergency(false), 5000);
  };

  const connectToPeer = () => {
    const peerId = prompt("Enter Peer ID to connect:");
    if (peerId && mesh) {
      mesh.connectTo(peerId);
    }
  };

  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showHelp, setShowHelp] = useState(true);

  // Demo functionality
  useEffect(() => {
    if (isDemoMode) {
      setPeers([
        { id: 'DELTA-9', signal: '12ms' },
        { id: 'ECHO-4', signal: '45ms' },
        { id: 'OMNI-1', signal: '8ms' },
      ]);
      addMessage('DELTA-9', 'Sector 4 reporting safe.', 'received');
      setTimeout(() => addMessage('ECHO-4', 'Weather warning in effect.', 'received'), 2000);
    } else {
      setPeers([]); // Clear simulated peers
      // Re-fetch real peers if any... (simplified for now)
    }
  }, [isDemoMode]);

  const toggleDemo = () => setIsDemoMode(!isDemoMode);

  return (
    <div className="app-container">
      {/* 3D Visualization Background */}
      <div className="mesh-canvas" style={{ filter: isEmergency ? 'hue-rotate(-50deg) saturate(2)' : 'none', transition: 'filter 0.5s' }}>
        <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
          <NetworkVisualizer myId={myId} peers={peers} />
        </Canvas>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'rgba(0, 10, 30, 0.95)', border: '1px solid #00f2ff', borderRadius: '12px',
            padding: '2rem', maxWidth: '500px', color: '#fff', textAlign: 'center'
          }}>
            <h2 style={{ fontFamily: 'Orbitron', color: '#00f2ff', marginTop: 0 }}>QUANTUM MESH ONLINE</h2>
            <p>This is a <strong>Peer-to-Peer</strong> safety network.</p>
            <div style={{ textAlign: 'left', background: 'rgba(0,255,255,0.1)', padding: '1rem', borderRadius: '8px', margin: '1rem 0' }}>
              <strong>Result:</strong>
              <ul style={{ margin: '0.5rem 0 0 1.5rem' }}>
                <li>Connects devices directly without central servers.</li>
                <li>Visualizes network topology in 3D.</li>
                <li>Enables emergency broadcasts.</li>
              </ul>
            </div>
            <p><strong>To Test P2P:</strong> Open this page in a <a href="#" style={{ color: '#00f2ff' }} onClick={() => window.open(window.location.href, '_blank')}>New Tab</a>.</p>
            <p><strong>To See UI:</strong> Enable <button onClick={toggleDemo} style={{ background: '#00f2ff', color: '#000', border: 'none', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>DEMO MODE</button></p>

            <button onClick={() => setShowHelp(false)} style={{
              background: 'transparent', border: '1px solid #00f2ff', color: '#00f2ff',
              padding: '0.8rem 2rem', borderRadius: '6px', cursor: 'pointer', marginTop: '1rem',
              fontSize: '1rem', fontFamily: 'Orbitron'
            }}>
              INITIALIZE SYSTEM
            </button>
          </div>
        </div>
      )}

      {/* UI Overlay */}
      <div className="ui-layer">

        {/* Header */}
        <div className="header">
          <div className="brand">
            <h1>QUANTUM MESH</h1>
            <div className="subtitle">DECENTRALIZED SAFETY NETWORK</div>
          </div>

          <div className="network-status">
            <div className="status-row">
              <span className="status-label">NODE STATUS</span>
              <span className="status-value">
                {myId !== 'Initializing...' ? 'ONLINE' : 'CONNECTING...'}
                <span className={`status-indicator ${myId !== 'Initializing...' ? 'connected' : ''}`} style={{ marginLeft: '10px' }}></span>
              </span>
            </div>
            <div className="status-row">
              <span className="status-label">MY ID</span>
              <span className="status-value" style={{ userSelect: 'all' }}>{myId}</span>
            </div>
            <div className="status-row">
              <span className="status-label">PEERS</span>
              <span className="status-value">{peers.length} ACTIVE</span>
            </div>
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#aaa' }}>
                <input type="checkbox" checked={isDemoMode} onChange={toggleDemo} />
                Simulate Network Activity (Demo Mode)
              </label>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3><Users size={18} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} /> NETWORK MAP</h3>
            <button
              onClick={connectToPeer}
              style={{
                background: 'transparent',
                border: '1px solid #00f2ff',
                color: '#00f2ff',
                cursor: 'pointer',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.8rem'
              }}>
              + CONNECT
            </button>
          </div>

          <div className="peer-list">
            {peers.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                Scanning for peers...
              </div>
            ) : (
              peers.map(peer => (
                <div key={peer.id} className="peer-item">
                  <div className="peer-avatar">{peer.id.substring(0, 2)}</div>
                  <div className="peer-info">
                    <span className="peer-id">{peer.id}</span>
                    <span className="peer-signal"><Activity size={12} style={{ marginRight: '4px', verticalAlign: '-2px' }} /> 12ms ping</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: 'auto' }}>
            <button className="emergency-btn" onClick={sendEmergencySignal}>
              <ShieldAlert size={20} />
              BROADCAST SOS
            </button>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="chat-panel">
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.type}`}>
                {msg.type !== 'system' && msg.type !== 'sent' && (
                  <div style={{ fontSize: '0.75rem', marginBottom: '2px', opacity: 0.7 }}>{msg.sender}</div>
                )}
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Broadcast message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage}><Send size={18} /></button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
